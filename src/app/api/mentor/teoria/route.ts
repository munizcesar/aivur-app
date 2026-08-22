export const runtime = 'edge';
import { NextResponse } from "next/server";
import { callGroqWithFallback } from "@/lib/groq";
import { getRequestContext } from '@cloudflare/next-on-pages';

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

export async function POST(req: Request) {
  try {
    const env = resolveEnv();
    const groqApiKey = env?.GROQ_API_KEY;

    const body = await req.json() as { tema?: string; label?: string; subject?: string };
    
    // Compatibilidade com a chamada antiga (label/subject) e a nova (tema)
    const tema = body.tema || body.label;

    if (!tema) {
      return NextResponse.json({ error: "Parâmetro 'tema' ou 'label' é obrigatório." }, { status: 400 });
    }

    // 2. Busca o contexto vetorial na nossa própria rota de busca
    // Pegamos a URL da requisição atual para extrair a origin (funciona em dev e prod)
    const reqUrl = new URL(req.url);
    const searchUrl = `${reqUrl.origin}/api/rag/search?q=${encodeURIComponent(tema)}`;
    
    console.log(`[RAG Teoria] Buscando contexto em: ${searchUrl}`);
    const searchResponse = await fetch(searchUrl);
    
    let contextText = "";
    if (searchResponse.ok) {
      const searchData = await searchResponse.json() as { results?: Array<{ text: string }> };
      if (searchData.results && searchData.results.length > 0) {
        // 3. Mapeia os textos dos resultados
        contextText = searchData.results
          .map((r, i) => `[Trecho ${i + 1}]:\n${r.text}`)
          .join('\n\n');
      }
    } else {
      console.error(`[RAG Teoria] Falha ao buscar contexto: ${searchResponse.status}`);
    }

    // 4. System Prompt com Scaffolding
    const systemPrompt = `Você é o tutor especialista em concursos do Aivur. Seu objetivo é explicar a matéria em passos lógicos (scaffolding).
Use OBRIGATORIAMENTE o [CONTEXTO VETORIAL] fornecido abaixo. Se houver 'pegadinhas' ou menções a bancas (como SH Dias, Vunesp) no contexto, destaque isso brutalmente para o aluno. Se o contexto estiver vazio, avise e responda com seu conhecimento.

[CONTEXTO VETORIAL]:
${contextText || "Nenhum contexto encontrado na base de dados para este tema."}`;

    // 5. Chamada para a Groq
    const result = await callGroqWithFallback([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Explique detalhadamente o tema: ${tema}` }
    ], {
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      apiKey: groqApiKey
    });

    // Retorna 'resposta' (nova spec) e 'teoria' (compatibilidade frontend)
    return NextResponse.json({ 
      resposta: result,
      teoria: result 
    });

  } catch (error: any) {
    console.error("Erro na rota de Teoria (RAG + Groq):", error);
    return NextResponse.json({ error: error.message || "Erro ao gerar teoria" }, { status: 500 });
  }
}
