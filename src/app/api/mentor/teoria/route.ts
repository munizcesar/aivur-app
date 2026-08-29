export const runtime = 'edge';
import { NextResponse } from "next/server";
import { callGroqWithFallback } from "@/lib/groq";
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDomainRules, extractCleanMarkdown } from '@/lib/ai-protocols';

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
    const subject = body.subject || "";

    if (!tema) {
      return NextResponse.json({ error: "Parâmetro 'tema' ou 'label' é obrigatório." }, { status: 400 });
    }

    // 1. Busca o contexto vetorial na nossa própria rota de busca
    const reqUrl = new URL(req.url);
    const searchUrl = `${reqUrl.origin}/api/rag/search?q=${encodeURIComponent(tema)}`;
    
    console.log(`[RAG Teoria] Buscando contexto em: ${searchUrl}`);
    const searchResponse = await fetch(searchUrl);
    
    let contextText = "";
    if (searchResponse.ok) {
      const searchData = await searchResponse.json() as { results?: Array<{ text: string }> };
      if (searchData.results && searchData.results.length > 0) {
        // Limita a 2500 chars por chunk para não explodir o LLM
        contextText = searchData.results
          .map((r, i) => `[Trecho ${i + 1}]:\n${r.text.substring(0, 2500)}`)
          .join('\n\n');
      }
    } else {
      console.error(`[RAG Teoria] Falha ao buscar contexto: ${searchResponse.status}`);
    }

    // 2. System Prompt com foco estratégico em alta performance para provas
    const systemPrompt = `Atue como um mentor especialista em concursos públicos. Gere um resumo altamente focado e direto ao ponto sobre o tema solicitado. Aborde exclusivamente os conceitos mais importantes e de maior incidência em provas para dar confiança total ao aluno. Inclua dicas práticas, mnemônicos ou macetes estratégicos. Evite textos longos e enrolação; use bullet points e destaque o que realmente importa.

${contextText ? `Use o [CONTEXTO VETORIAL] abaixo como base prioritária. Se houver 'pegadinhas' ou menções a bancas no contexto, destaque isso para o aluno.\n\n[CONTEXTO VETORIAL]:\n${contextText}\n` : "Nenhum contexto vetorial encontrado — responda com seu conhecimento especializado sobre o tema.\n"}

IMPORTANTE: Mantenha qualquer bloco <think> extremamente curto. Formate a resposta em Markdown estruturado com títulos, bullet points e negrito para os termos-chave.

=== PROTOCOLO DE CONFIABILIDADE ===
${getDomainRules(subject)}`;

    // 3. Chamada para a Groq
    const result = await callGroqWithFallback([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Gere um resumo estratégico e direto ao ponto sobre o tema: ${tema}. Foque nos conceitos de maior incidência em provas, use bullet points e destaque mnemônicos ou macetes práticos.` }
    ], {
      model: "qwen/qwen3.6-27b",
      temperature: 0.3,
      max_tokens: 5000,
      apiKey: groqApiKey
    });

    // 4. Limpeza centralizada via ai-protocols (extractCleanMarkdown)
    const cleanContent = extractCleanMarkdown(result || "");

    // Retorna 'resposta' (nova spec) e 'teoria' (compatibilidade frontend)
    return NextResponse.json({ 
      resposta: cleanContent,
      teoria: cleanContent 
    });

  } catch (error: any) {
    console.error("Erro na rota de Teoria (RAG + Groq):", error);
    
    const env = resolveEnv();
    return NextResponse.json({ 
      error: error.message || "Erro ao gerar teoria",
      env_keys: Object.keys(env || {})
    }, { status: 500 });
  }
}
