import { NextResponse } from "next/server";
import { extractCleanJson, getDomainRules } from '@/lib/ai-protocols';

export const runtime = 'nodejs';

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
  const apiKey = process.env.GROQ_API_KEY;
  
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
    const file = formData.get("file") as File | null;

    if (!title) {
      return NextResponse.json(
        { error: "Título é obrigatório." },
        { status: 400 }
      );
    }

    const sourceType: "edital" | "livre" = (text || file) ? "edital" : "livre";

    if (file) {
      try {
        if (typeof global !== 'undefined') {
          // @ts-ignore
          if (typeof global.DOMMatrix === 'undefined') {
            // @ts-ignore
            global.DOMMatrix = class DOMMatrix { constructor() { this.a=1; this.b=0; this.c=0; this.d=1; this.e=0; this.f=0; } } as any;
          }
          // @ts-ignore
          if (typeof global.Path2D === 'undefined') global.Path2D = class Path2D {} as any;
          // @ts-ignore
          if (typeof global.ImageData === 'undefined') global.ImageData = class ImageData {} as any;
        }

        const pdfParse = require("pdf-parse");
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } catch (err) {
        console.error("PDF Parsing error:", err);
        return NextResponse.json(
          { error: "Falha ao ler o PDF fornecido." },
          { status: 400 }
        );
      }
    }

    if (text.length > 50000) {
      text = text.slice(0, 50000);
    }

    const prompt = `Você é um tutor especialista. 
O aluno quer estudar sobre o seguinte tema: "${title}".
${text ? `Conteúdo de base para a trilha:\n${text}` : ""}

Você deve gerar UMA UNICA Trilha de Estudo em JSON rigoroso contendo:
- 'disciplina': o nome da matéria geral (ex: Direito Constitucional).
- 'video': um objeto contendo 'youtubeId' (invente uma string de 11 caracteres baseada no tema ou use um real se souber), 'titulo' e 'resumo'.
- 'flashcards': array de 3 a 5 objetos com 'frente' (pergunta) e 'verso' (resposta curta e direta).
- 'questoes': array de 3 a 5 questões de múltipla escolha. Cada questão deve ter 'enunciado', 'opcoes' (exatamente 4 strings), 'corretaIdx' (0 a 3) e 'justificativa'.

NÃO use markdown no retorno, devolva APENAS o JSON puro.

Schema esperado:
{
  "disciplina": "string",
  "video": {
    "youtubeId": "string",
    "titulo": "string",
    "resumo": "string"
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
    const jsonString = extractCleanJson(messageContent || "");

    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON retornado pela Groq:", parseError);
      return NextResponse.json(
        { error: "O edital é muito extenso ou complexo, fazendo a geração ser cortada. Tente dividir o conteúdo em partes ou remover textos irrelevantes." },
        { status: 400 }
      );
    }
    const trilhaId = `t-gerada-${Date.now().toString(36)}`;
    
    const finalTrilha = {
      id: trilhaId,
      titulo: title,
      disciplina: parsedJson.disciplina || "Geral",
      progresso: 0,
      video: {
        youtubeId: parsedJson.video?.youtubeId || "dQw4w9WgXcQ",
        titulo: parsedJson.video?.titulo || `Aula: ${title}`,
        resumo: parsedJson.video?.resumo || "Resumo da aula."
      },
      flashcards: (parsedJson.flashcards || []).map((fc: any, idx: number) => ({
        id: `${trilhaId}-fc-${idx}`,
        frente: fc.frente || "",
        verso: fc.verso || ""
      })),
      questoes: (parsedJson.questoes || []).map((q: any, idx: number) => ({
        id: `${trilhaId}-q-${idx}`,
        enunciado: q.enunciado || "",
        opcoes: Array.isArray(q.opcoes) && q.opcoes.length === 4 ? q.opcoes : ["A", "B", "C", "D"],
        corretaIdx: typeof q.corretaIdx === 'number' && q.corretaIdx >= 0 && q.corretaIdx <= 3 ? q.corretaIdx : 0,
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
