import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifySessionCookie } from "@/lib/session";
import { getGroqKeysFromEnv } from "@/lib/groq";
import { extractCleanJson } from "@/lib/ai-protocols";
import { InMemoryRateLimiter } from "@/lib/material-rate-limit";
import {
  GerarJornadaRequestSchema,
  JornadaEmentaSchema,
} from "@/lib/validations/jornada";

export const runtime = "edge";

const jornadaRateLimiter = new InMemoryRateLimiter({
  limit: 5,
  windowMs: 10 * 60 * 1000,
  maxEntries: 500,
});

function resolveEnv(): any {
  try {
    const ctx = getRequestContext();
    if (ctx?.env) return ctx.env;
  } catch (_) {}
  const g = globalThis as any;
  if (g.GROQ_API_KEY) return g;
  return process.env;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aivur_session");

  const session = await verifySessionCookie(sessionCookie?.value);
  if (!session.valid) {
    return NextResponse.json(
      { error: "Sessão ausente ou inválida. Faça login para continuar." },
      { status: 401 }
    );
  }

  const userId = session.userId;
  const clientKey = `user:${userId}`;

  if (!jornadaRateLimiter.check(clientKey)) {
    return NextResponse.json(
      { error: "Limite de estruturação de editais atingido. Aguarde alguns minutos." },
      { status: 429 }
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Payload JSON malformado." },
      { status: 400 }
    );
  }

  const parseResult = GerarJornadaRequestSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Dados de requisição inválidos.",
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { title, text, banca, ano, cargo, bloco_inicio, edital_hash, conteudo_parcial } = parseResult.data;

  // Importa utilitários de chunking e cálculo determinístico de hash
  const { splitEditalIntoBlocks, consolidateDisciplinas, computeEditalHash } =
    await import("@/lib/jornada-chunking");

  // Blindagem de retomada parcial: valida vinculação estrita ao edital original
  const isResumption =
    (bloco_inicio !== undefined && bloco_inicio > 1) || conteudo_parcial !== undefined;

  if (isResumption) {
    // Rejeita conflito entre hash externo da requisição e hash do conteúdo parcial
    if (
      edital_hash &&
      conteudo_parcial?.edital_hash &&
      edital_hash.toLowerCase() !== conteudo_parcial.edital_hash.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error:
            "Conflito entre o hash do edital fornecido na requisição e o hash registrado no conteúdo parcial.",
          motivo: "CONFLITO_HASH",
          edital_hash_externo: edital_hash,
          edital_hash_conteudo_parcial: conteudo_parcial.edital_hash,
          conteudo_parcial: conteudo_parcial || undefined,
        },
        { status: 400 }
      );
    }

    const providedHash = (edital_hash || conteudo_parcial?.edital_hash)?.toLowerCase();

    if (!providedHash) {
      return NextResponse.json(
        {
          error:
            "Identificação do edital ausente para retomada parcial. Forneça o hash do edital original (edital_hash).",
          motivo: "HASH_AUSENTE",
          conteudo_parcial: conteudo_parcial || undefined,
        },
        { status: 400 }
      );
    }

    const currentEditalHash = await computeEditalHash(text);
    if (providedHash !== currentEditalHash) {
      return NextResponse.json(
        {
          error:
            "O conteúdo do edital enviado na retomada difere do edital que originou o conteúdo parcial.",
          motivo: "EDITAL_DIVERGENTE",
          edital_hash_esperado: providedHash,
          edital_hash_recebido: currentEditalHash,
          conteudo_parcial: conteudo_parcial || undefined,
        },
        { status: 400 }
      );
    }
  }

  const env = resolveEnv();
  const groqApiKeys = getGroqKeysFromEnv(env);

  if (!groqApiKeys || groqApiKeys.length === 0) {
    return NextResponse.json(
      { error: "Provedor de inteligência artificial temporariamente indisponível." },
      { status: 503 }
    );
  }

  const primaryApiKey = groqApiKeys[0];

  const fallbackModels = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
  ];

  // Particiona o conteúdo programático em blocos seguros
  const blocks = splitEditalIntoBlocks(text);
  const totalBlocks = blocks.length;

  // Inicializa com conteúdo parcial prévio se fornecido (retomada sem duplicação)
  const completedBlocks: Array<{ disciplinas?: any[] }> = [];
  if (conteudo_parcial?.disciplinas && Array.isArray(conteudo_parcial.disciplinas)) {
    completedBlocks.push({ disciplinas: conteudo_parcial.disciplinas });
  }

  const startIndex =
    bloco_inicio && bloco_inicio >= 1 && bloco_inicio <= totalBlocks
      ? bloco_inicio - 1
      : 0;

  async function processChunk(
    chunkText: string,
    blockIndex: number,
    total: number
  ): Promise<{ success: true; data: any } | { success: false; status: number; error: string; etapa_falha?: any }> {
    const systemPrompt = `Você é um coordenador pedagógico especialista em concursos públicos.
Sua missão é extrair e organizar a árvore de Conteúdo Programático do edital fornecido.
Diretrizes:
- Extraia APENAS disciplinas e tópicos de estudo. NÃO invente matérias ou tópicos que não constam no edital.
- Cada disciplina deve ter uma lista de tópicos sequenciais e ordenados de forma pedagógica.
- Se houver numeração no edital (ex: "1.2 Princípios fundamentais"), preserve na propriedade 'edital_item_ref'.
- NÃO gere resumos, questões ou flashcards. Devolva estritamente a ementa estruturada.
- O retorno DEVE ser um objeto JSON puro, sem blocos markdown.`;

    const userPrompt = `Concurso: "${title}"
${banca ? `Banca: "${banca}"` : ""}
${ano ? `Ano: ${ano}` : ""}
${cargo ? `Cargo: "${cargo}"` : ""}

${total > 1 ? `Conteúdo Programático do Edital (Seção ${blockIndex + 1} de ${total}):` : "Texto do Edital / Conteúdo Programático:"}
"""
${chunkText}
"""

Retorne APENAS um JSON no seguinte formato:
{
  "titulo_concurso": "${title}",
  "banca": "${banca || ""}",
  "ano": ${ano || new Date().getFullYear()},
  "cargo": "${cargo || ""}",
  "disciplinas": [
    {
      "nome": "Nome da Matéria (ex: Direito Administrativo)",
      "topicos": [
        {
          "titulo": "Título claro do tópico de estudo",
          "edital_item_ref": "Item 1.1 (opcional)"
        }
      ]
    }
  ]
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    let groqResponse: Response | null = null;
    let lastErrorStatus = 500;
    let lastErrorText = "";

    for (const modelId of fallbackModels) {
      try {
        groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${primaryApiKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelId,
            messages,
            temperature: 0.1,
            max_tokens: 2200,
            response_format: { type: "json_object" },
          }),
        });

        if (groqResponse.ok) {
          break;
        }

        lastErrorStatus = groqResponse.status;
        lastErrorText = await groqResponse.text();

        if (groqResponse.status === 429) {
          break;
        }
      } catch (err: any) {
        lastErrorStatus = 500;
        lastErrorText = err.message || "Erro de rede";
      }
    }

    if (!groqResponse || !groqResponse.ok) {
      if (lastErrorStatus === 429) {
        return {
          success: false,
          status: 429,
          error: "Limite temporário de requisições da IA atingido. Aguarde alguns instantes.",
        };
      }
      return {
        success: false,
        status: 502,
        error: "Instabilidade temporária na comunicação com o provedor de IA.",
      };
    }

    const data = (await groqResponse.json()) as any;
    const choice = data.choices?.[0];
    const messageContent = choice?.message?.content;

    if (choice?.finish_reason === "length") {
      return {
        success: false,
        status: 422,
        error:
          total > 1
            ? `A resposta da seção ${blockIndex + 1} de ${total} do edital foi truncada por limite de tamanho.`
            : "A resposta do edital foi truncada por limite de tamanho. Forneça uma seção mais concisa do conteúdo programático.",
        etapa_falha: {
          bloco_indice: blockIndex + 1,
          total_blocos: total,
          motivo: "LIMITE_TOKENS",
        },
      };
    }

    let parsedJson: any;
    try {
      const jsonString = extractCleanJson(messageContent || "");
      parsedJson = JSON.parse(jsonString);
    } catch {
      // Se o parse falhar, tenta o Fixer Prompt uma vez
      parsedJson = null;
    }

    // Valida se parsedJson atende a estrutura mínima de disciplinas com tópicos
    const isStructurallyValid =
      parsedJson &&
      typeof parsedJson === "object" &&
      Array.isArray(parsedJson.disciplinas) &&
      parsedJson.disciplinas.length > 0 &&
      parsedJson.disciplinas.every(
        (d: any) =>
          d &&
          typeof d.nome === "string" &&
          Array.isArray(d.topicos) &&
          d.topicos.length > 0
      );

    if (!isStructurallyValid) {
      const fixerPrompt = `O retorno abaixo falhou na estrutura da ementa de estudos.
CONTEÚDO RECEBIDO:
${messageContent || ""}

Sua tarefa: estruture e corrija APENAS o JSON puro no formato exigido (objeto com 'disciplinas', onde cada disciplina possui 'nome' e 'topicos' não-vazios com 'titulo'). Devolva APENAS o JSON válido.`;

      try {
        const fixerRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${primaryApiKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: fallbackModels[0],
            messages: [{ role: "user", content: fixerPrompt }],
            temperature: 0.1,
            max_tokens: 2200,
            response_format: { type: "json_object" },
          }),
        });

        if (fixerRes.ok) {
          const fixerData = (await fixerRes.json()) as any;
          const fixerContent = fixerData.choices?.[0]?.message?.content;
          const cleanFixer = extractCleanJson(fixerContent || "");
          const parsedFixer = JSON.parse(cleanFixer);

          if (
            parsedFixer &&
            typeof parsedFixer === "object" &&
            Array.isArray(parsedFixer.disciplinas) &&
            parsedFixer.disciplinas.length > 0
          ) {
            parsedJson = parsedFixer;
          }
        }
      } catch (_) {}
    }

    if (
      !parsedJson ||
      !Array.isArray(parsedJson.disciplinas) ||
      parsedJson.disciplinas.length === 0
    ) {
      return {
        success: false,
        status: 422,
        error:
          total > 1
            ? `Não foi possível estruturar as matérias na seção ${blockIndex + 1} de ${total} do edital.`
            : "A IA retornou um formato de ementa inválido.",
        etapa_falha: {
          bloco_indice: blockIndex + 1,
          total_blocos: total,
          motivo: "FORMATO_INVALIDO",
        },
      };
    }

    return { success: true, data: parsedJson };
  }

  // Executa o processamento sequencial e seguro de cada bloco
  for (let i = startIndex; i < totalBlocks; i++) {
    const blockText = blocks[i];
    const chunkResult = await processChunk(blockText, i, totalBlocks);

    if (!chunkResult.success) {
      if (chunkResult.status === 429) {
        return NextResponse.json({ error: chunkResult.error }, { status: 429 });
      }

      // Retorna erro estruturado preservando todo o progresso validado até o momento
      const partialDisciplinas = consolidateDisciplinas(completedBlocks);
      const computedHash = await computeEditalHash(text);
      return NextResponse.json(
        {
          error: chunkResult.error,
          etapa_falha: chunkResult.etapa_falha,
          edital_hash: computedHash,
          conteudo_parcial: {
            titulo_concurso: title,
            banca: banca || undefined,
            ano: ano || new Date().getFullYear(),
            cargo: cargo || undefined,
            edital_hash: computedHash,
            disciplinas: partialDisciplinas,
          },
        },
        { status: chunkResult.status }
      );
    }

    completedBlocks.push(chunkResult.data);
  }

  // Consolidação final sem duplicatas com ordenação determinística
  const consolidatedDisciplinas = consolidateDisciplinas(completedBlocks);
  const finalEditalHash = await computeEditalHash(text);

  const candidateEmenta = {
    titulo_concurso: title,
    banca: banca || undefined,
    ano: ano || new Date().getFullYear(),
    cargo: cargo || undefined,
    edital_hash: finalEditalHash,
    disciplinas: consolidatedDisciplinas,
  };

  const validationResult = JornadaEmentaSchema.safeParse(candidateEmenta);
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: "Não foi possível consolidar a ementa no formato correto.",
        details: validationResult.error.flatten(),
      },
      { status: 422 }
    );
  }

  return NextResponse.json(validationResult.data, { status: 200 });
}
