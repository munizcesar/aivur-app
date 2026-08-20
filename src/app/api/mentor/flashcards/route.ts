export const runtime = 'edge';
import { NextResponse } from "next/server";
import { callGroqWithFallback } from "@/lib/groq";
import { fetchRagContext } from "@/lib/ragClient";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { RAGEngine } from "@/lib/rag/engine";
import { RAGOptimizer } from "@/lib/rag/optimizer";

export async function POST(req: Request) {
  try {
    const { label, subject, nicho, context } = await req.json();

    if (!label) {
      return NextResponse.json({ error: "Falta label" }, { status: 400 });
    }

    let engine: RAGEngine | null = null;
    try {
      const env = (process.env.NODE_ENV === 'development' ? process.env : getRequestContext()?.env) as any;
      if (env?.RAG_CACHE) {
        engine = new RAGEngine(env);
      }
    } catch (e) {
      // Fallback
    }

    if (engine) {
      const cacheKey = `flashcards:${subject}:${label}:${nicho||""}`;
      const cached = await engine.getCachedResponse(cacheKey);
      if (cached) {
        console.log(`[RAG_CACHE] Hit para flashcards: ${label}`);
        return NextResponse.json(JSON.parse(cached));
      }
    }

    const rag = await fetchRagContext(`${label} ${subject}`);
    let xmlContext = "";
    if (rag.context) {
      const rawChunks = rag.context.split('\n---\n').filter(Boolean);
      const chunkObjs = rawChunks.map((text, i) => ({ id: String(i), text, score: 1 }));
      const optimizedChunks = RAGOptimizer.optimizeContext(chunkObjs, { maxTokens: 1500 });
      if (optimizedChunks.length > 0) {
        xmlContext = `<referencias_teoricas>\n` + optimizedChunks.map((c, i) => `  <trecho id="${i+1}">\n${c.text.trim()}\n  </trecho>`).join('\n') + `\n</referencias_teoricas>\n\nCONTEXTO EXTRAÍDO OBRIGATÓRIO (baseie-se estritamente nestes trechos):\n`;
      }
    }

    const systemPrompt = `Você é um criador de flashcards para concursos públicos.
Seu objetivo é gerar um conjunto de 5 a 10 flashcards baseados no tópico solicitado.
Tópico: ${label}
Matéria: ${subject || ""}
${context ? `Contexto Base: ${context}` : ""}
${xmlContext}

REGRAS:
1. Gere perguntas diretas e curtas para a frente (front) do cartão.
2. Gere respostas diretas e precisas para o verso (back) do cartão.
3. NÃO cite número de artigo de lei salvo certeza absoluta.
4. Você DEVE retornar EXATAMENTE e APENAS um JSON válido seguindo a estrutura:
{
  "flashcards": [
    { "id": "uuid-curto", "front": "Pergunta", "back": "Resposta" }
  ]
}
`;

    const result = await callGroqWithFallback([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Gere flashcards para: ${label}` }
    ], {
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    if (!result) throw new Error("Resposta vazia da API Groq");
    const json = JSON.parse(result);

    if (engine) {
      const cacheKey = `flashcards:${subject}:${label}:${nicho||""}`;
      await engine.cacheResponse(cacheKey, result);
    }
    return NextResponse.json(json);
  } catch (error: any) {
    console.error("Erro na rota de Flashcards:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
