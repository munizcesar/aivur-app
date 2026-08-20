export const runtime = 'edge';
import { NextResponse } from "next/server";
import { callGroqWithFallback } from "@/lib/groq";
import { fetchRagContext } from "@/lib/ragClient";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { RAGEngine } from "@/lib/rag/engine";
import { RAGOptimizer } from "@/lib/rag/optimizer";

export async function POST(req: Request) {
  try {
    const { label, subject, nicho } = await req.json() as { label?: string; subject?: string; nicho?: string };

    if (!label || !subject) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes." }, { status: 400 });
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
      const cacheKey = `teoria:${subject}:${label}:${nicho||""}`;
      const cached = await engine.getCachedResponse(cacheKey);
      if (cached) {
        console.log(`[RAG_CACHE] Hit para teoria: ${label}`);
        return NextResponse.json({ teoria: cached });
      }
    }

    const rag = await fetchRagContext(`${label} ${subject}`);
    if (rag.context) {
      console.log(`[RAG Teoria] MatchCount: ${rag.matchCount}, TopScore: ${rag.topScore}`);
    }

    let systemPrompt = `Você é um professor especializado em concursos públicos.
Seu objetivo é explicar o tópico solicitado de forma simples, direta e didática, e fornecer dicas práticas de prova.
Tópico: ${label}
Matéria: ${subject}
Área (Nicho): ${nicho || ""}

REGRAS ESTABELECIDAS:
1. NUNCA cite o número de um artigo de lei, súmula, ou dispositivo legal específico, a menos que você tenha CERTEZA ABSOLUTA de que ele está correto e atualizado. Na dúvida, explique o conceito e o princípio geral sem citar o número.
2. Foque em como isso costuma cair em provas.
3. Responda em Markdown. Divida em duas seções claras: "### Teoria" e "### Dicas Práticas".
4. Seja conciso, mas completo.
`;

    if (rag.context) {
      const rawChunks = rag.context.split('\n---\n').filter(Boolean);
      const chunkObjs = rawChunks.map((text, i) => ({ id: String(i), text, score: 1 }));
      const optimizedChunks = RAGOptimizer.optimizeContext(chunkObjs, { maxTokens: 1500 });
      const xmlContext = `<referencias_teoricas>\n` + optimizedChunks.map((c, i) => `  <trecho id="${i+1}">\n${c.text.trim()}\n  </trecho>`).join('\n') + `\n</referencias_teoricas>`;
      systemPrompt += `\n\nCONTEXTO EXTRAÍDO OBRIGATÓRIO (baseie-se estritamente nos trechos em <referencias_teoricas> quando pertinente para ancorar a explicação):\n${xmlContext}\n`;
    }

    const result = await callGroqWithFallback([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Gere a teoria e dicas para o tópico: ${label}` }
    ], {
      model: "llama-3.3-70b-versatile",
      temperature: 0.3
    });

    if (engine) {
      const cacheKey = `teoria:${subject}:${label}:${nicho||""}`;
      await engine.cacheResponse(cacheKey, result ?? '');
    }
    return NextResponse.json({ teoria: result });
  } catch (error: any) {
    console.error("Erro na rota de Teoria:", error);
    return NextResponse.json({ error: error.message || "Erro ao gerar teoria" }, { status: 500 });
  }
}
