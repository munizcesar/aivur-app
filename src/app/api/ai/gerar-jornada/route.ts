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

  const { title, text, banca, ano, cargo } = parseResult.data;

  const env = resolveEnv();
  const groqApiKeys = getGroqKeysFromEnv(env);

  if (!groqApiKeys || groqApiKeys.length === 0) {
    return NextResponse.json(
      { error: "Provedor de inteligência artificial temporariamente indisponível." },
      { status: 503 }
    );
  }

  const primaryApiKey = groqApiKeys[0];

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

Texto do Edital / Conteúdo Programático:
"""
${text}
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

  const fallbackModels = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
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

      // Interrupção imediata em 429 para proteger TPM
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
      return NextResponse.json(
        { error: "Limite temporário de requisições da IA atingido. Aguarde alguns instantes." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Instabilidade temporária na comunicação com o provedor de IA." },
      { status: 502 }
    );
  }

  const data = (await groqResponse.json()) as any;
  const choice = data.choices?.[0];
  const messageContent = choice?.message?.content;

  if (choice?.finish_reason === "length") {
    return NextResponse.json(
      { error: "A resposta do edital foi truncada por limite de tamanho. Forneça uma seção mais concisa do conteúdo programático." },
      { status: 422 }
    );
  }

  let parsedJson: any;
  try {
    const jsonString = extractCleanJson(messageContent || "");
    parsedJson = JSON.parse(jsonString);
  } catch {
    return NextResponse.json(
      { error: "A IA retornou um formato de ementa inválido." },
      { status: 400 }
    );
  }

  // Preenche metadados do concurso a partir da requisição se a IA não tiver preenchido
  if (parsedJson && typeof parsedJson === "object") {
    parsedJson.titulo_concurso = parsedJson.titulo_concurso || parseResult.data.title;
    if (parseResult.data.banca && !parsedJson.banca) parsedJson.banca = parseResult.data.banca;
    if (parseResult.data.ano && !parsedJson.ano) parsedJson.ano = parseResult.data.ano;
    if (parseResult.data.cargo && !parsedJson.cargo) parsedJson.cargo = parseResult.data.cargo;
  }

  // Validação Zod com o schema da ementa
  let validationResult = JornadaEmentaSchema.safeParse(parsedJson);

  // Tentativa única de Fixer Prompt se falhar a validação estrutural
  if (!validationResult.success) {
    const fixerPrompt = `O JSON abaixo falhou na validação estrutural da ementa de estudos.
ERROS:
${JSON.stringify(validationResult.error.issues, null, 2)}

JSON ORIGINAL:
${JSON.stringify(parsedJson, null, 2)}

Sua tarefa: corrija APENAS a estrutura JSON para cumprir as regras (cada disciplina deve ter 'nome' e 'topicos', sem títulos duplicados). Devolva APENAS o JSON válido.`;

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

        if (parsedFixer && typeof parsedFixer === "object") {
          parsedFixer.titulo_concurso = parsedFixer.titulo_concurso || parseResult.data.title;
          if (parseResult.data.banca && !parsedFixer.banca) parsedFixer.banca = parseResult.data.banca;
          if (parseResult.data.ano && !parsedFixer.ano) parsedFixer.ano = parseResult.data.ano;
          if (parseResult.data.cargo && !parsedFixer.cargo) parsedFixer.cargo = parseResult.data.cargo;
        }

        const secondValidation = JornadaEmentaSchema.safeParse(parsedFixer);
        if (secondValidation.success) {
          validationResult = secondValidation;
        }
      }
    } catch (_) {}

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Não foi possível estruturar a ementa no formato correto.",
          details: validationResult.error.flatten(),
        },
        { status: 422 }
      );
    }
  }

  return NextResponse.json(validationResult.data, { status: 200 });
}
