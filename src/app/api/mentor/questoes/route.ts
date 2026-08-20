export const runtime = 'edge';
import { NextResponse } from "next/server";
import { callGroqWithFallback } from "@/lib/groq";
import { fetchRagContext } from "@/lib/ragClient";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { RAGEngine } from "@/lib/rag/engine";
import { RAGOptimizer } from "@/lib/rag/optimizer";

export async function POST(req: Request) {
  try {
    const { label, subject, nicho, dificuldade, banca } = await req.json();

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
      const cacheKey = `questoes:${subject}:${label}:${dificuldade||""}:${banca||""}`;
      const cached = await engine.getCachedResponse(cacheKey);
      if (cached) {
        console.log(`[RAG_CACHE] Hit para questoes: ${label}`);
        return NextResponse.json(JSON.parse(cached));
      }
    }

    const rag = await fetchRagContext(`${label} ${subject}`);
    if (rag.context) {
      console.log(`[RAG Questoes] MatchCount: ${rag.matchCount}, TopScore: ${rag.topScore}`);
    }

    let systemPrompt = `Você é um elaborador de questões de concurso público.
Seu objetivo é gerar 3 questões inéditas de múltipla escolha.
Tópico: ${label}
Matéria: ${subject || ""}
Dificuldade: ${dificuldade || "Média"}
Estilo da Banca Inspiradora: ${banca || "Estilo Genérico Múltipla Escolha"}

REGRAS ESTABELECIDAS:
1. Gere questões INÉDITAS inspiradas no estilo da banca. NUNCA reproduza enunciados reais de provas anteriores (isso evita problemas de copyright e de legislação desatualizada).
2. Não cite artigos específicos de lei na justificativa a não ser que tenha 100% de certeza.
3. Cada questão deve ter 5 alternativas (A, B, C, D, E), sendo apenas UMA correta.
4. Você DEVE retornar EXATAMENTE e APENAS um JSON válido seguindo a estrutura:
{
  "questoes": [
    {
      "id": "uuid-curto",
      "enunciado": "Texto da questão...",
      "alternativas": {
        "A": "Texto alternativa A",
        "B": "Texto alternativa B",
        "C": "Texto alternativa C",
        "D": "Texto alternativa D",
        "E": "Texto alternativa E"
      },
      "correta": "A",
      "justificativa": "A alternativa A está correta porque..."
    }
  ]
}
`;

    if (rag.context) {
      const rawChunks = rag.context.split('\n---\n').filter(Boolean);
      const chunkObjs = rawChunks.map((text, i) => ({ id: String(i), text, score: 1 }));
      const optimizedChunks = RAGOptimizer.optimizeContext(chunkObjs, { maxTokens: 1500 });
      const xmlContext = `<referencias_teoricas>\n` + optimizedChunks.map((c, i) => `  <trecho id="${i+1}">\n${c.text.trim()}\n  </trecho>`).join('\n') + `\n</referencias_teoricas>`;
      systemPrompt += `\n\nCONTEXTO EXTRAÍDO OBRIGATÓRIO (baseie-se estritamente nos trechos em <referencias_teoricas> como fundamentação base para elaborar as alternativas e justificar o gabarito. Ele contém as regras/leis relevantes para o tema):\n${xmlContext}\n`;
    }

    const result = await callGroqWithFallback([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Gere questões para o tópico: ${label} (Dificuldade: ${dificuldade}, Banca: ${banca})` }
    ], {
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    if (!result) throw new Error("Resposta vazia da API Groq");
    const json = JSON.parse(result);

    if (engine) {
      const cacheKey = `questoes:${subject}:${label}:${dificuldade||""}:${banca||""}`;
      await engine.cacheResponse(cacheKey, result);
    }
    return NextResponse.json(json);
  } catch (error: any) {
    console.error("Erro na rota de Questões:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
