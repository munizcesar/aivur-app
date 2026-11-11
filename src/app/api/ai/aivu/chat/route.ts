export const runtime = "edge";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifySessionCookie } from "@/lib/session";
import { callGroqWithFallback, getGroqKeysFromEnv } from "@/lib/groq";
import { extractCleanMarkdown } from "@/lib/ai-protocols";
import { InMemoryRateLimiter } from "@/lib/material-rate-limit";
import {
  AivuChatRequestSchema,
  classifyAivuIntent,
  type AivuCitation,
} from "@/lib/validations/aivu-chat";
import {
  chunkDocumentWithPages,
  retrieveRelevantChunks,
  type RetrievedChunk,
} from "@/lib/aivu-rag";

/**
 * Limitador em memória para conversas com o AIVU.
 * Janela: 15 mensagens a cada 15 minutos por usuário ativo no isolate.
 */
export const aivuChatRateLimiter = new InMemoryRateLimiter({
  limit: 15,
  windowMs: 15 * 60 * 1000,
  maxEntries: 500,
});

export const MAX_AIVU_CHAT_BODY_BYTES = 256 * 1024; // 256 KB

type ReadBodyResult =
  | { ok: true; text: string }
  | { ok: false; status: 400 | 413; error: string };

async function readBoundedJsonBody(
  req: Request,
  maxBytes: number = MAX_AIVU_CHAT_BODY_BYTES
): Promise<ReadBodyResult> {
  if (!req.body) {
    return { ok: false, status: 400, error: "Payload JSON malformado." };
  }

  let reader: ReadableStreamDefaultReader<Uint8Array>;
  try {
    reader = req.body.getReader();
  } catch {
    return { ok: false, status: 400, error: "Payload JSON malformado." };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.byteLength > 0) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel("Payload excede o limite de 256 KB.").catch(() => {});
          return {
            ok: false,
            status: 413,
            error: "O payload enviado excede o limite máximo permitido de 256 KB.",
          };
        }
        chunks.push(value);
      }
    }
  } catch {
    await reader.cancel().catch(() => {});
    return { ok: false, status: 400, error: "Payload JSON malformado." };
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }

  if (totalBytes === 0) {
    return { ok: false, status: 400, error: "Payload JSON malformado." };
  }

  let combined: Uint8Array;
  if (chunks.length === 1) {
    combined = chunks[0];
  } else {
    combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(combined);
    return { ok: true, text };
  } catch {
    return { ok: false, status: 400, error: "Payload JSON malformado." };
  }
}

function resolveEnv(): Record<string, any> {
  let cfEnv: Record<string, any> = {};
  try {
    const ctx = getRequestContext();
    if (ctx?.env) cfEnv = ctx.env as any;
  } catch (_) {}

  const g = globalThis as any;
  const regEnv = g.__REG_CF_CONTEXT?.env || {};

  if (cfEnv.GROQ_API_KEY) return { ...regEnv, ...cfEnv };
  if (g.GROQ_API_KEY) return { ...regEnv, ...cfEnv, ...g };

  return { ...(process.env as any), ...regEnv, ...cfEnv };
}

export async function POST(req: Request) {
  // 1. Validação estrita da sessão criptográfica
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aivur_session");
  const session = await verifySessionCookie(sessionCookie?.value);

  if (!session.valid) {
    return NextResponse.json(
      { error: "Sessão ausente ou inválida. Faça login para conversar com o AIVU." },
      { status: 401 }
    );
  }

  const userId = session.userId;

  // 2. Proteção contra rajadas e contenção de custos (Rate Limit)
  const clientKey = `user:${userId}`;
  if (!aivuChatRateLimiter.check(clientKey)) {
    return NextResponse.json(
      { error: "Limite de mensagens atingido. Por favor, aguarde alguns instantes antes de enviar outra mensagem." },
      { status: 429 }
    );
  }

  // 3. Validação estrita do contrato JSON (rejeição de binário PDF multipart)
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      {
        error: "Envio de binário PDF multipart não é suportado pelo endpoint. O processamento de PDF deve ser executado no cliente, enviando apenas JSON estruturado.",
        code: "MULTIPART_NOT_ACCEPTED",
      },
      { status: 400 }
    );
  }

  // 3. Leitura limitada em bytes (máximo 256 KB) antes de parsing JSON
  const rawBodyResult = await readBoundedJsonBody(req, MAX_AIVU_CHAT_BODY_BYTES);
  if (!rawBodyResult.ok) {
    return NextResponse.json(
      { error: rawBodyResult.error },
      { status: rawBodyResult.status }
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = JSON.parse(rawBodyResult.text);
  } catch {
    return NextResponse.json(
      { error: "Payload JSON malformado." },
      { status: 400 }
    );
  }

  const parseResult = AivuChatRequestSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Dados de requisição inválidos.",
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { message, material_text, file_info, history = [], context } = parseResult.data;

  // 4. Resolução de credenciais do provedor de IA e banco D1
  const env = resolveEnv();
  const groqApiKeys = getGroqKeysFromEnv(env);

  if (!groqApiKeys || groqApiKeys.length === 0) {
    return NextResponse.json(
      { error: "Provedor de inteligência artificial temporariamente indisponível." },
      { status: 503 }
    );
  }

  // 4.1 Verificação Anti-IDOR em Falha Segura (Fail-Closed) no D1 para recursos persistidos (trilhas / jornadas)
  // - Identidade autoritativa: exclusivamente `userId` extraído de `verifySessionCookie` (qualquer userId enviado pelo cliente é ignorado)
  // - Consulta escopada por propriedade: `WHERE id = ? AND user_id = ?`
  // - Sem fallback permissivo: binding D1 ausente/indisponível (503), ID inexistente ou pertencente a outro usuário (403) bloqueiam a requisição antes da IA
  const rawTrilhaId = context?.metadados?.trilhaId?.trim();
  const rawJornadaId = context?.metadados?.jornadaId?.trim();
  const isMockTrilhaId = rawTrilhaId ? /^t-00[1-4]$/.test(rawTrilhaId) : false;
  const requiresTrilhaCheck = Boolean(rawTrilhaId && !isMockTrilhaId);
  const requiresJornadaCheck = Boolean(rawJornadaId);

  if (requiresTrilhaCheck || requiresJornadaCheck) {
    const db = env.D1_DB || env.DB;
    if (!db || typeof db.prepare !== "function") {
      return NextResponse.json(
        {
          error:
            "Acesso bloqueado por segurança: banco de dados de verificação de propriedade indisponível.",
        },
        { status: 503 }
      );
    }

    if (requiresTrilhaCheck && rawTrilhaId) {
      let ownedTrilha: { id: string; user_id: string } | null = null;
      try {
        ownedTrilha = (await db
          .prepare("SELECT id, user_id FROM trilhas WHERE id = ? AND user_id = ?")
          .bind(rawTrilhaId, userId)
          .first()) as { id: string; user_id: string } | null;
      } catch {
        return NextResponse.json(
          { error: "Falha ao verificar permissão de acesso à trilha no banco de dados." },
          { status: 503 }
        );
      }

      if (!ownedTrilha || ownedTrilha.user_id !== userId) {
        return NextResponse.json(
          {
            error:
              "Acesso negado: a trilha informada não existe ou não pertence ao usuário autenticado.",
          },
          { status: 403 }
        );
      }
    }

    if (requiresJornadaCheck && rawJornadaId) {
      let ownedJornada: { id: string; user_id: string } | null = null;
      try {
        ownedJornada = (await db
          .prepare("SELECT id, user_id FROM jornadas WHERE id = ? AND user_id = ?")
          .bind(rawJornadaId, userId)
          .first()) as { id: string; user_id: string } | null;
      } catch {
        return NextResponse.json(
          { error: "Falha ao verificar permissão de acesso à jornada no banco de dados." },
          { status: 503 }
        );
      }

      if (!ownedJornada || ownedJornada.user_id !== userId) {
        return NextResponse.json(
          {
            error:
              "Acesso negado: a jornada informada não existe ou não pertence ao usuário autenticado.",
          },
          { status: 403 }
        );
      }
    }
  }

  // 5. Roteamento Inteligente por Intenção (Fase B.2: EDITAL_JORNADA vs DOCUMENT_QA vs GENERAL_CHAT)
  const intent = classifyAivuIntent({
    message,
    material_text,
    context,
  });

  if (intent === "EDITAL_JORNADA") {
    const { isEditalPattern, parseEditalToProposal } = await import("@/lib/aivu-edital");
    const candidateEdital = material_text || (isEditalPattern(message) ? message : undefined);

    if (candidateEdital) {
      try {
        // Extrai intenção de cargo específico da mensagem do usuário se houver
        let userTargetCargo: string | undefined;
        const cargoExplicitMatch = message.match(
          /(?:cargo(?:\s*:\s*|\s+de\s+)|\bquero\s+(?:o\s+)?cargo\s+de\s+)([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s\-\/]{3,50})/i
        );
        if (cargoExplicitMatch) {
          userTargetCargo = cargoExplicitMatch[1].trim();
        }

        const editalResult = await parseEditalToProposal({
          editalText: candidateEdital,
          groqApiKeys,
          fonteTipo: file_info ? "PDF" : "TEXTO",
          nomeArquivo: file_info?.name,
          targetCargo: userTargetCargo,
        });

        if (editalResult.success) {
          if (editalResult.actionProposal && editalResult.reply) {
            return NextResponse.json({
              reply: editalResult.reply,
              state: "speaking",
              intent,
              actionProposal: editalResult.actionProposal,
              fileInfo: file_info
                ? {
                    name: file_info.name,
                    size: file_info.size,
                    pageCount: file_info.pageCount,
                  }
                : undefined,
            });
          }

          // Se retornou resposta de orientação/esclarecimento (ex: múltiplos cargos)
          if (editalResult.reply) {
            return NextResponse.json({
              reply: editalResult.reply,
              state: "speaking",
              intent,
            });
          }
        }
      } catch (editalErr: any) {
        console.warn("[aivu/chat] Falha na extração de edital, caindo para conversa padrão:", editalErr);
      }
    }
  }

  // 5.1 Recuperação Lexical Determinística (RAG) para perguntas sobre documentos e materiais
  let retrievedChunks: RetrievedChunk[] = [];
  let citations: AivuCitation[] | undefined = undefined;
  const documentSourceName =
    file_info?.name || context?.titulo || (material_text ? "Documento Anexado" : undefined);
  const rawDocForRag =
    material_text && material_text.trim().length >= 20
      ? material_text
      : intent === "DOCUMENT_QA" && context?.trecho_foco && context.trecho_foco.trim().length >= 20
      ? context.trecho_foco
      : undefined;
  const hasActiveDocument = Boolean(rawDocForRag);

  if (intent === "DOCUMENT_QA" && rawDocForRag) {
    const docChunks = chunkDocumentWithPages(rawDocForRag, {
      maxChunkChars: 750,
      overlapChars: 120,
      sourceName: documentSourceName || "Material do Aluno",
    });

    retrievedChunks = retrieveRelevantChunks(message, docChunks, {
      maxChunks: 3,
      maxTotalChars: 1800,
    });

    if (retrievedChunks.length > 0) {
      citations = retrievedChunks.map((rc) => {
        const cleanExcerpt = rc.sanitizedText
          .replace(/---\s*P[aá]gina\s*\d+\s*---/gi, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 220);
        return {
          source: (rc.sourceName || documentSourceName || "Material do Aluno").slice(0, 255),
          ...(rc.pageNumber ? { page: rc.pageNumber } : {}),
          ...(rc.sectionHeader ? { section: rc.sectionHeader.slice(0, 180) } : {}),
          excerpt: cleanExcerpt || rc.sanitizedText.slice(0, 220),
        };
      });
    } else if (material_text) {
      // Quando há documento explícito em material_text e nenhum trecho alcança o limiar mínimo de relevância,
      // retorna resposta determinística ancorada sem alucinar fatos externos e sem desperdiçar chamada de IA.
      return NextResponse.json({
        reply:
          "Informação não encontrada no material fornecido. Não localizei nenhum trecho correspondente à sua pergunta nas páginas do documento enviado.",
        state: "speaking",
        intent,
        citations: [],
        ...(file_info
          ? {
              fileInfo: {
                name: file_info.name,
                size: file_info.size,
                pageCount: file_info.pageCount,
              },
            }
          : {}),
      });
    }
  }

  // 6. Construção do contexto inteligente e histórico via montador pedagógico
  const { assembleAivuPromptMessages } = await import("@/lib/aivu-brain");
  const messages = assembleAivuPromptMessages({
    message,
    history,
    context,
    retrievedChunks,
    documentSource: documentSourceName,
    hasActiveDocument,
  });

  // 7. Invocação da Groq com suporte nativo a failover
  try {
    const rawReply = await callGroqWithFallback(messages, {
      model: "openai/gpt-oss-120b",
      temperature: 0.5,
      max_tokens: 600,
      apiKeys: groqApiKeys,
    });

    if (!rawReply || typeof rawReply !== "string") {
      return NextResponse.json(
        { error: "Falha ao obter resposta do modelo de inteligência artificial." },
        { status: 502 }
      );
    }

    const cleanReply = extractCleanMarkdown(rawReply);

    return NextResponse.json({
      reply: cleanReply,
      state: "speaking",
      intent,
      ...(citations ? { citations } : {}),
      ...(file_info
        ? {
            fileInfo: {
              name: file_info.name,
              size: file_info.size,
              pageCount: file_info.pageCount,
            },
          }
        : {}),
    });
  } catch (error: any) {
    const status = error?.status || (error?.response?.status) || 500;
    const isRateLimit = status === 429 || (error?.message && error.message.includes("429"));

    if (isRateLimit) {
      return NextResponse.json(
        { error: "A inteligência artificial atingiu o limite de capacidade por minuto. Aguarde 30 segundos e tente novamente." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Instabilidade temporária na comunicação com o assistente. Tente novamente." },
      { status: 502 }
    );
  }
}
