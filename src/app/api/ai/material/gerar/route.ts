export const runtime = "edge";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { extractCleanJson, getDomainRules } from "@/lib/ai-protocols";
import {
  MaterialGenerateRequestSchema,
  RawMaterialAIGenerationSchema,
  buildAuthoritativeGeneratedMaterial,
} from "@/lib/validations/material-ai";
import {
  materialRateLimiter,
  resolveClientRateLimitKey,
} from "@/lib/material-rate-limit";
import { verifySessionCookie } from "@/lib/session";

// ─── 1. RESOLUÇÃO DE BINDINGS NO EDGE ────────────────────────────────────────

function resolveEnv(): any {
  try {
    const ctx = getRequestContext();
    if (ctx?.env) return ctx.env;
  } catch (_) {}
  const g = globalThis as any;
  if (g.GROQ_API_KEY) return g;
  return process.env;
}

// ─── 2. HANDLER POST ─────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // A. AUTENTICAÇÃO ANTES DE QUALQUER OPERAÇÃO DE IA OU ACESSO A CREDENCIAIS
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aivur_session");

  const session = await verifySessionCookie(sessionCookie?.value);
  if (!session.valid) {
    return NextResponse.json(
      { error: "Sessão ausente ou inválida" },
      { status: 401 }
    );
  }

  const userId = session.userId;

  // B. VERIFICAÇÃO DE CHAVE GROQ DISPONÍVEL
  const env = resolveEnv();
  const apiKey =
    env.GROQ_API_KEY ||
    env.GROQ_API_KEY_2 ||
    env.GROQ_API_KEY_3 ||
    env.GROQ_API_KEY_FALLBACK;

  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return NextResponse.json(
      { error: "GROQ_API_KEY não configurada no ambiente." },
      { status: 401 }
    );
  }

  // C. RATE LIMITING COM IDENTIFICAÇÃO CONFIÁVEL E CONTENÇÃO CONSERVADORA
  const clientKey = resolveClientRateLimitKey(req);
  if (!materialRateLimiter.check(clientKey)) {
    return NextResponse.json(
      { error: "Limite temporário de requisições excedido. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  // D. PARSING E VALIDAÇÃO DE ENTRADA VIA ZOD
  let rawBody: any;
  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      rawBody = await req.json();
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      const metaStr = formData.get("metadados");
      let metadados;
      if (typeof metaStr === "string") {
        try { metadados = JSON.parse(metaStr); } catch (_) {}
      }
      rawBody = {
        titulo: formData.get("titulo") ?? undefined,
        conteudo: formData.get("conteudo") ?? undefined,
        disciplina: formData.get("disciplina") ?? undefined,
        metadados,
      };
    } else {
      rawBody = await req.json().catch(() => ({}));
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Corpo da requisição inválido ou malformado." },
      { status: 400 }
    );
  }

  const inputValidation = MaterialGenerateRequestSchema.safeParse(rawBody);
  if (!inputValidation.success) {
    return NextResponse.json(
      {
        error: "Dados de entrada inválidos para geração de material.",
        details: inputValidation.error.issues,
      },
      { status: 400 }
    );
  }

  const { titulo, conteudo, disciplina, metadados } = inputValidation.data;

  // Log seguro (sem expor o texto integral em logs)
  console.log(
    `[Meu Material IA] Solicitação recebida: titulo="${titulo}", caracteres=${conteudo.length}, clientKey=${clientKey}`
  );

  // E. CONSTRUÇÃO DO PROMPT FUNDAMENTADO (GROUNDED AI)
  const domainRules = getDomainRules(disciplina || titulo);

  const prompt = `Você é um professor examinador e tutor pedagógico de excelência do AIVUR.
Sua missão é sintetizar o MATERIAL FORNECIDO ABAIXO em ferramentas ativas de estudo.

=== REGRAS ABSOLUTAS DE FUNDAMENTAÇÃO ===
1. Utilize EXCLUSIVAMENTE o texto abaixo como fonte da verdade factual.
2. É expressamente PROIBIDO alucinar ou inventar artigos de lei, prazos, dados históricos ou regras que NÃO estejam contidas no texto.
3. Se o texto for conciso, adapte e dimensione a quantidade de flashcards (2 a 4) e questões (2 a 3) com foco estrito naquilo que o documento comprova.
4. Gere exatamente 4 alternativas (A, B, C, D) por questão. As alternativas NÃO PODEM ser repetidas nem parafraseadas de forma idêntica.
5. Indique o índice da alternativa correta (corretaIdx) de 0 a 3.

TÍTULO DO MATERIAL: "${titulo}"
DISCIPLINA: "${disciplina || "Geral"}"

=== CONTEÚDO FONTE DO ALUNO ===
${conteudo}

=== SCHEMA JSON OBRIGATÓRIO ===
Devolva APENAS um objeto JSON válido (sem tags markdown externas, sem texto introdutório):
{
  "disciplina_sugerida": "string",
  "resumo": {
    "tema_central": "Frase concisa resumindo o tema central do documento (5 a 250 caracteres)",
    "pontos_chave": [
      "Ponto-chave 1 extraído do texto",
      "Ponto-chave 2 extraído do texto"
    ],
    "conteudo_markdown": "Resumo estruturado completo com subtítulos, tópicos e conceitos fundamentados no material."
  },
  "flashcards": [
    {
      "frente": "Pergunta ou conceito extraído diretamente do texto?",
      "verso": "Resposta ou definição exata correspondente encontrada no texto."
    }
  ],
  "questoes": [
    {
      "enunciado": "Enunciado da questão baseado exclusivamente no material fornecido.",
      "opcoes": [
        "Alternativa A",
        "Alternativa B",
        "Alternativa C",
        "Alternativa D"
      ],
      "corretaIdx": 0,
      "justificativa": "Explicação fundamentada demonstrando por que a alternativa está correta segundo o texto.",
      "trecho_referencia": "Trecho exato do material que comprova o gabarito."
    }
  ]
}

=== PROTOCOLO DE CONFIABILIDADE ===
${domainRules}`;

  const messages = [
    {
      role: "system",
      content: "You are a JSON assistant. Output valid JSON only, strictly matching the requested schema.",
    },
    { role: "user", content: prompt },
  ];

  // F. CASCATA DE MODELOS GROQ COM RETRY LIMITADO
  const fallbackModels = [
    "openai/gpt-oss-120b", // Primário
    "openai/gpt-oss-20b",  // Plano B
    "qwen/qwen3.8-27b",    // Plano C
  ];

  let groqResponse: Response | undefined;
  let lastErrorStatus = 500;
  let lastErrorText = "";

  for (const modelId of fallbackModels) {
    try {
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          temperature: 0.2,
          max_tokens: 2200,
          response_format: { type: "json_object" },
        }),
      });

      if (groqResponse.ok) {
        console.log(`[Meu Material IA] Resposta gerada com sucesso via modelo: ${modelId}`);
        break;
      }

      lastErrorStatus = groqResponse.status;
      lastErrorText = await groqResponse.text();
      console.warn(`[Meu Material IA] Falha no modelo ${modelId}: ${lastErrorStatus} - ${lastErrorText}`);

      // Se for rate limit (429), interrompe imediatamente para não queimar outras cotas em cascata
      if (groqResponse.status === 429) {
        break;
      }
    } catch (networkErr: any) {
      lastErrorStatus = 503;
      lastErrorText = networkErr?.message || "Falha de rede com a API da Groq.";
      console.warn(`[Meu Material IA] Exceção de rede no modelo ${modelId}: ${lastErrorText}`);
    }
  }

  if (!groqResponse || !groqResponse.ok) {
    console.warn(`[Meu Material IA] Falha no provedor de IA. Status HTTP: ${lastErrorStatus}`);

    if (lastErrorStatus === 429) {
      return NextResponse.json(
        {
          error: "Limite temporário de requisições da IA atingido. Por favor, aguarde alguns instantes antes de tentar novamente.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "O serviço de IA está temporariamente indisponível. Tente novamente mais tarde.",
      },
      { status: lastErrorStatus >= 500 ? lastErrorStatus : 503 }
    );
  }

  // G. PARSING DO RETORNO E VALIDAÇÃO ZOD INICIAL
  const completionData = (await groqResponse.json()) as any;
  const rawMessage = completionData?.choices?.[0]?.message?.content || "";

  let parsedJson: any;
  try {
    const cleanJson = extractCleanJson(rawMessage);
    parsedJson = JSON.parse(cleanJson);
  } catch (jsonErr) {
    console.error("[Meu Material IA] Falha no parse JSON inicial:", jsonErr);
    return NextResponse.json(
      { error: "A resposta gerada pela IA não pôde ser interpretada como JSON válido." },
      { status: 422 }
    );
  }

  let parseResult = RawMaterialAIGenerationSchema.safeParse(parsedJson);

  // H. ESTRATÉGIA DE FIXER PROMPT (MÁXIMO 1 RODADA DE CORREÇÃO ESTRUTURAL)
  if (!parseResult.success) {
    console.warn(
      "[Meu Material IA] Validação estrutural inicial falhou. Acionando Fixer Prompt...",
      parseResult.error.issues
    );

    const fixerPrompt = `Você gerou o JSON abaixo a partir de um material de estudo, mas ele falhou na validação estrutural obrigatória do sistema.
ERROS DETECTADOS:
${JSON.stringify(parseResult.error.issues, null, 2)}

JSON ORIGINAL:
${JSON.stringify(parsedJson, null, 2)}

SUA TAREFA:
Corrija APENAS os erros estruturais acima (ex: garanta exatamente 4 alternativas distintas sem repetições, ajuste contagens de pontos-chave ou flashcards, corrija corretaIdx para 0..3).
NÃO invente informações externas. Mantenha 100% de fundamentação no material.
Devolva APENAS o JSON corrigido estritamente no schema esperado.`;

    let fixerSuccess = false;
    let fixerResponse: Response | undefined;
    let fixerLastErrorStatus = 500;

    for (const modelId of fallbackModels) {
      try {
        fixerResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: "user", content: fixerPrompt }],
            temperature: 0.1,
            max_tokens: 2200,
            response_format: { type: "json_object" },
          }),
        });

        if (fixerResponse.ok) {
          fixerSuccess = true;
          break;
        }

        fixerLastErrorStatus = fixerResponse.status;
        console.warn(`[Meu Material IA Fixer] Modelo ${modelId} retornou status ${fixerLastErrorStatus}`);

        // Se for rate limit (429), interrompe imediatamente para não disparar cascata destrutiva
        if (fixerResponse.status === 429) {
          break;
        }
      } catch (fixerNetErr: any) {
        fixerLastErrorStatus = 503;
        console.warn(`[Meu Material IA Fixer] Exceção no modelo ${modelId}`);
      }
    }

    // Preserva o status 429 se ocorrido durante a execução do Fixer
    if (fixerLastErrorStatus === 429) {
      return NextResponse.json(
        {
          error: "Limite temporário de requisições da IA atingido. Por favor, aguarde alguns instantes antes de tentar novamente.",
        },
        { status: 429 }
      );
    }

    if (fixerSuccess && fixerResponse) {
      try {
        const fixerData = (await fixerResponse.json()) as any;
        const fixerMessage = fixerData?.choices?.[0]?.message?.content || "";
        const cleanFixerJson = extractCleanJson(fixerMessage);
        const parsedFixerJson = JSON.parse(cleanFixerJson);
        const fixerParseResult = RawMaterialAIGenerationSchema.safeParse(parsedFixerJson);

        if (fixerParseResult.success) {
          parseResult = fixerParseResult;
        } else {
          console.warn("[Meu Material IA Fixer] Validação pós-Fixer não atingiu o contrato.");
        }
      } catch (fixerErr) {
        console.warn("[Meu Material IA Fixer] Falha ao processar resposta do Fixer.");
      }
    }

    // Se mesmo após o Fixer a validação falhar, aborta com 422 controlado (sem vazar detalhes brutos)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Não foi possível estruturar o material gerado pela IA no formato pedagógico necessário. Tente novamente.",
        },
        { status: 422 }
      );
    }
  }

  // I. HIDRATAÇÃO AUTORITATIVA PELO SERVIDOR
  // De forma conservadora, a rota não tem fonte confiável para comprovar integralidade de arquivo
  // arbitrária enviada pelo cliente. Portanto, cobertura é sempre 'recorte' (comprovacaoIntegralidadeServidor: false).
  try {
    const finalMaterial = buildAuthoritativeGeneratedMaterial({
      titulo,
      disciplina: disciplina || parseResult.data.disciplina_sugerida,
      caracteresProcessados: conteudo.length,
      totalCaracteresMaterial: metadados?.totalCaracteresMaterial,
      tipoExtracaoDeclarado: metadados?.tipoExtracao,
      raw: parseResult.data,
      comprovacaoIntegralidadeServidor: false,
    });

    return NextResponse.json(finalMaterial);
  } catch (buildErr: any) {
    console.error("[Meu Material IA] Erro na formatação autoritativa final");
    return NextResponse.json(
      { error: "Falha na formatação final do material gerado." },
      { status: 500 }
    );
  }
}
