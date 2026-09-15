import { NextResponse } from "next/server";
import { extractCleanJson, getDomainRules } from '@/lib/ai-protocols';
import { TrilhaSchema } from '@/lib/validations/trilha';

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Função auxiliar para resolver bindings e env no Edge
function resolveEnv(): any {
  try {
    const ctx = getRequestContext();
    if (ctx?.env) return ctx.env;
  } catch (_) {}
  const g = globalThis as any;
  if (g.GROQ_API_KEY) return g;
  return process.env;
}

// Basic in-memory rate limiting
const ipMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 5;
  const windowMs = 60 * 1000 * 60; // 1 hour window

  if (!ipMap.has(ip)) {
    ipMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const record = ipMap.get(ip)!;
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: Request) {
  const env = resolveEnv();
  const apiKey = env.GROQ_API_KEY || env.GROQ_API_KEY_2 || env.GROQ_API_KEY_3 || env.GROQ_API_KEY_FALLBACK;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GROQ_API_KEY não configurada no ambiente." }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit excedido. Tente novamente mais tarde." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    let text = formData.get("text") as string || "";

    if (!title) {
      return NextResponse.json(
        { error: "Título é obrigatório." },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "Conteúdo do edital (text) é obrigatório." },
        { status: 400 }
      );
    }

    if (text.length > 50000) {
      text = text.slice(0, 50000);
    }

    const prompt = `Você é um tutor especialista. 
O aluno quer estudar sobre o seguinte tema: "${title}".
${text ? `Conteúdo de base para a trilha:\n${text}` : ""}

Você deve gerar UMA UNICA Trilha de Estudo em JSON rigoroso contendo:
- 'disciplina': o nome da matéria geral (ex: Direito Constitucional).
- 'video': um objeto contendo 'titulo', 'resumo' (curto, 1 frase) e 'resumo_markdown' (um resumo farto, estruturado em markdown com subtópicos, listas e conceitos-chave da matéria).
- 'flashcards': array de 3 a 5 objetos com 'frente' (pergunta) e 'verso' (resposta curta e direta).
- 'questoes': array de 3 a 5 questões de múltipla escolha. Cada questão deve ter 'enunciado', 'opcoes' (exatamente 4 strings), 'corretaIdx' (0 a 3) e 'justificativa'.

Certifique-se de escapar corretamente as aspas e quebras de linha (\\n) dentro da string do 'resumo_markdown', pois o retorno DEVE ser um JSON perfeitamente válido.
NÃO use markdown no corpo principal do retorno (sem blocos \`\`\`json), devolva APENAS o JSON puro.

Schema esperado:
{
  "disciplina": "string",
  "video": {
    "titulo": "string",
    "resumo": "string",
    "resumo_markdown": "string"
  },
  "flashcards": [
    { "frente": "string", "verso": "string" }
  ],
  "questoes": [
    {
      "enunciado": "string",
      "opcoes": ["string", "string", "string", "string"],
      "corretaIdx": 0,
      "justificativa": "string"
    }
  ]
}`;

    // Recupera contexto semântico já indexado antes da inferência. O texto enviado
    // pelo aluno continua sendo a fonte principal; o RAG apenas acrescenta contexto
    // verificável quando o ambiente possui os bindings ativos.
    let ragContext = "";
    try {
      const ragUrl = new URL(`/api/rag/search?q=${encodeURIComponent(title)}`, req.url);
      const ragResponse = await fetch(ragUrl);
      if (ragResponse.ok) {
        const ragData = await ragResponse.json() as { results?: Array<{ text?: string }> };
        ragContext = (ragData.results ?? [])
          .map((result, index) => `[Contexto indexado ${index + 1}]:\n${(result.text ?? "").slice(0, 2500)}`)
          .filter(Boolean)
          .join("\n\n");
      }
    } catch {
      // Ambientes locais sem bindings RAG seguem usando o conteúdo fornecido.
    }

    const finalPrompt = `${prompt}
=== PROTOCOLO DE CONFIABILIDADE ===
${getDomainRules(title)}
${ragContext ? `=== CONTEXTO RAG INDEXADO ===\n${ragContext}` : ""}`;

    const messages = [
      { role: "system", content: "You are a JSON assistant. Output valid JSON only." },
      { role: "user", content: finalPrompt }
    ];

    const fallbackModels = [
      "llama-3.3-70b-versatile", // Primário
      "openai/gpt-oss-120b",     // Plano B
      "qwen/qwen3.6-27b"         // Plano C
    ];

    let groqResponse;
    let lastErrorStatus = 500;
    let lastErrorText = "";

    for (const modelId of fallbackModels) {
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages,
          temperature: 0.2,
          max_tokens: 8000,
          response_format: { type: "json_object" }
        })
      });

      if (groqResponse.ok) {
        console.log(`[AIVUR IA] Sucesso na geracao utilizando o modelo: ${modelId}`);
        break; // Sucesso, aborta o loop de fallbacks
      } else {
        lastErrorStatus = groqResponse.status;
        lastErrorText = await groqResponse.text();
        console.warn(`[Generate Route] Falha no modelo ${modelId}: ${lastErrorStatus} - ${lastErrorText}`);
      }
    }

    if (!groqResponse || !groqResponse.ok) {
      let parsedErr;
      try {
        parsedErr = JSON.parse(lastErrorText);
      } catch (e) {
        parsedErr = { message: lastErrorText };
      }
      return new Response(JSON.stringify({ 
        error: "Erro na API da IA (Groq). Todos os modelos falharam.", 
        details: parsedErr 
      }), {
        status: lastErrorStatus,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await groqResponse.json() as any;
    const messageContent = data.choices[0]?.message?.content;

    // 4. Extração de JSON centralizada via ai-protocols (extractCleanJson)
    let parsedJson: any;
    try {
      const jsonString = extractCleanJson(messageContent || "");
      parsedJson = JSON.parse(jsonString);
    } catch (err) {
      console.error("Falha ao fazer parse do JSON final:", err);
      return NextResponse.json(
        { error: "A resposta gerada não estava em um formato válido." },
        { status: 400 }
      );
    }
    
    // 4. Validação Zod com schema TrilhaSchema
    // Usamos um schema derivado que ignora 'id' e 'progresso', pois estes 
    // são injetados pelo backend e não devem ser gerados/validados da IA
    const StrictTrilhaSchema = TrilhaSchema.omit({ id: true, progresso: true });
    
    let validTrilhaData = parsedJson;
    let parseResult = StrictTrilhaSchema.safeParse(parsedJson);

    // 5. Estratégia de Retry (Fixer Prompt) - 1 tentativa apenas
    if (!parseResult.success) {
      console.warn("[AIVUR IA] Erro na validacao do JSON inicial, iniciando Fixer Prompt...", parseResult.error.issues);
      
      const fixerPrompt = `Você gerou o JSON abaixo, mas ele falhou na validação estrutural obrigatória do sistema.
ERROS ENCONTRADOS:
${JSON.stringify(parseResult.error.issues, null, 2)}

JSON ORIGINAL DEFEITUOSO:
${JSON.stringify(parsedJson, null, 2)}

Sua única tarefa: Corrija APENAS os erros estruturais apontados acima (ex: ajuste o número de opções para exatamente 4, garanta que todos os campos existam). NÃO altere a essência do conteúdo se ele estiver correto. 
Devolva o mesmo JSON perfeitamente válido, e NADA MAIS. Sem markdown fora do JSON.`;

      let fixerResponse;
      let fixerSuccess = false;

      for (const modelId of fallbackModels) {
        fixerResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey.trim()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: "user", content: fixerPrompt }],
            temperature: 0.1,
            max_tokens: 1000, // Token limit baixo para o fixer
            response_format: { type: "json_object" }
          })
        });

        if (fixerResponse.ok) {
          console.log(`[AIVUR IA Fixer] Sucesso na correcao utilizando o modelo: ${modelId}`);
          fixerSuccess = true;
          break;
        }
      }

      if (fixerSuccess && fixerResponse) {
        const fixerData = await fixerResponse.json() as any;
        const fixerContent = fixerData.choices[0]?.message?.content;
        
        try {
          const cleanFixerJson = extractCleanJson(fixerContent || "");
          const parsedFixerJson = JSON.parse(cleanFixerJson);
          const fixerParseResult = StrictTrilhaSchema.safeParse(parsedFixerJson);
          
          if (fixerParseResult.success) {
            validTrilhaData = parsedFixerJson;
            parseResult = fixerParseResult;
          } else {
            console.error("[AIVUR IA Fixer] O Fixer tambem falhou na validacao Zod:", fixerParseResult.error.issues);
          }
        } catch (err) {
          console.error("[AIVUR IA Fixer] JSON do fixer malformado:", err);
        }
      }

      // Se mesmo após o fixer a validação falhar, aborta com 422
      if (!parseResult.success) {
        return NextResponse.json(
          { 
            error: "Não foi possível gerar uma trilha com o formato correto.",
            details: parseResult.error.issues 
          },
          { status: 422 }
        );
      }
    }

    const trilhaId = `t-gerada-${Date.now().toString(36)}`;
    
    const finalTrilha = {
      id: trilhaId,
      titulo: title,
      disciplina: validTrilhaData.disciplina || "Geral",
      progresso: 0,
      video: {
        titulo: validTrilhaData.video?.titulo || `Aula: ${title}`,
        resumo: validTrilhaData.video?.resumo || "Resumo da aula.",
        resumo_markdown: validTrilhaData.video?.resumo_markdown || ""
      },
      flashcards: (validTrilhaData.flashcards || []).map((fc: any, idx: number) => ({
        id: `${trilhaId}-fc-${idx}`,
        frente: fc.frente || "",
        verso: fc.verso || ""
      })),
      questoes: (validTrilhaData.questoes || []).map((q: any, idx: number) => ({
        id: `${trilhaId}-q-${idx}`,
        enunciado: q.enunciado || "",
        opcoes: q.opcoes, // Validação garantida pelo Zod
        corretaIdx: q.corretaIdx, // Validação garantida pelo Zod
        justificativa: q.justificativa || ""
      }))
    };

    return NextResponse.json(finalTrilha);
  } catch (error: any) {
    console.error("Erro na rota de Geração:", error);
    
    return NextResponse.json({ 
      error: "Falha interna ao gerar o curso. " + error.message,
      env_keys: Object.keys(process.env || {}) 
    }, { status: 500 });
  }
}
