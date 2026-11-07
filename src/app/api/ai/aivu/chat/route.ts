export const runtime = "edge";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifySessionCookie } from "@/lib/session";
import { callGroqWithFallback, getGroqKeysFromEnv } from "@/lib/groq";
import { extractCleanMarkdown } from "@/lib/ai-protocols";
import { InMemoryRateLimiter } from "@/lib/material-rate-limit";
import { AivuChatRequestSchema } from "@/lib/validations/aivu-chat";

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

function resolveEnv(): Record<string, string | undefined> {
  let cfEnv: Record<string, any> = {};
  try {
    const ctx = getRequestContext();
    if (ctx?.env) cfEnv = ctx.env as any;
  } catch (_) {}

  if (cfEnv.GROQ_API_KEY) return cfEnv;

  const g = globalThis as any;
  if (g.GROQ_API_KEY) return { ...cfEnv, ...g };

  return { ...cfEnv, ...(process.env as any) };
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

  // 4. Resolução de credenciais do provedor de IA
  const env = resolveEnv();
  const groqApiKeys = getGroqKeysFromEnv(env);

  if (!groqApiKeys || groqApiKeys.length === 0) {
    return NextResponse.json(
      { error: "Provedor de inteligência artificial temporariamente indisponível." },
      { status: 503 }
    );
  }

  // 5. Roteamento Inteligente: Detecção de Edital e Geração de Proposta de Jornada
  const { isEditalPattern, parseEditalToProposal } = await import("@/lib/aivu-edital");
  const candidateEdital = material_text || (isEditalPattern(message) ? message : undefined);

  if (candidateEdital) {
    try {
      // Extrai intenção de cargo específico da mensagem do usuário se houver
      let userTargetCargo: string | undefined;
      const cargoExplicitMatch = message.match(/(?:cargo(?:\s*:\s*|\s+de\s+)|\bquero\s+(?:o\s+)?cargo\s+de\s+)([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s\-\/]{3,50})/i);
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
          });
        }
      }
    } catch (editalErr: any) {
      console.warn("[aivu/chat] Falha na extração de edital, caindo para conversa padrão:", editalErr);
    }
  }

  // 6. Construção do contexto inteligente e histórico via montador pedagógico
  const { assembleAivuPromptMessages } = await import("@/lib/aivu-brain");
  const messages = assembleAivuPromptMessages({
    message,
    history,
    context,
  });

  // 6. Invocação da Groq com suporte nativo a failover
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
