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

// Roteamento de domínio: molda o perfil da IA conforme a matéria
function getDomainRules(subject: string = "") {
  const materia = subject.toLowerCase();
  if (materia.includes("português") || materia.includes("portuguesa") || materia.includes("redação")) {
    return "ATUE COMO GRAMÁTICO EXAMINADOR. Baseie-se exclusivamente nas gramáticas normativas de referência (Cegalla, Bechara, Cunha & Cintra) e no Acordo Ortográfico vigente (VOLP). Foque em regras de exceção e morfossintaxe pura.";
  }
  if (materia.includes("matemática") || materia.includes("raciocínio") || materia.includes("lógico") || materia.includes("rlm")) {
    return "ATUE COMO MATEMÁTICO EXAMINADOR. O universo do modelo é a lógica formal e teoremas exatos. O foco absoluto deve ser o raciocínio passo a passo inquebrável, sem pular etapas de cálculo. A criatividade deve ser zero; a exatidão deve ser total.";
  }
  if (materia.includes("informática") || materia.includes("tecnologia") || materia.includes("computação")) {
    return "ATUE COMO ENGENHEIRO DE TECNOLOGIA EXAMINADOR. Baseie-se em manuais oficiais (Windows, Linux) e cartilhas de segurança (CERT.br).";
  }
  return "ATUE COMO JURISTA EXAMINADOR. O universo do modelo se resume à Constituição Federal, Vade Mecum, jurisprudência e leis vigentes. É TERMINANTEMENTE PROIBIDO inventar números de leis, artigos, incisos, penas ou prazos. Na dúvida, explique o princípio jurídico e alerte para a leitura da lei seca.";
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
          .map((r, i) => `[Trecho ${i + 1}]:\n${r.text.substring(0, 2500)}`) // Limita a 2500 chars por chunk para não explodir o LLM
          .join('\n\n');
      }
    } else {
      console.error(`[RAG Teoria] Falha ao buscar contexto: ${searchResponse.status}`);
    }

    // 4. System Prompt com Scaffolding + Roteamento de Domínio
    const domainRules = getDomainRules(subject);
    const systemPrompt = `Você é o tutor especialista em concursos do Aivur. Seu objetivo é explicar a matéria em passos lógicos (scaffolding).
Use OBRIGATORIAMENTE o [CONTEXTO VETORIAL] fornecido abaixo. Se houver 'pegadinhas' ou menções a bancas (como SH Dias, Vunesp) no contexto, destaque isso brutalmente para o aluno. Se o contexto estiver vazio, avise e responda com seu conhecimento.

PERFIL ATIVO: ${domainRules}

IMPORTANTE: Mantenha qualquer bloco <think> extremamente curto. Vá direto à geração da aula estruturada em Markdown.

[CONTEXTO VETORIAL]:
${contextText || "Nenhum contexto encontrado na base de dados para este tema."}`;

    // 5. Chamada para a Groq
    const result = await callGroqWithFallback([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Explique detalhadamente o tema: ${tema}` }
    ], {
      model: "qwen/qwen3.6-27b",
      temperature: 0.3,
      max_tokens: 5000,
      apiKey: groqApiKey
    });

    // Remove o bloco <think> do modelo Qwen de forma indestrutível
    let cleanContent = result || "";
    const thinkStart = cleanContent.indexOf('<think>');
    if (thinkStart !== -1) {
      const thinkEnd = cleanContent.indexOf('</think>');
      if (thinkEnd !== -1) {
        cleanContent = (cleanContent.substring(0, thinkStart) + cleanContent.substring(thinkEnd + 8)).trim();
      } else {
        // Se a tag não fechou, removemos do <think> em diante
        cleanContent = cleanContent.substring(0, thinkStart).trim();
      }
    }

    // Retorna 'resposta' (nova spec) e 'teoria' (compatibilidade frontend)
    return NextResponse.json({ 
      resposta: cleanContent,
      teoria: cleanContent 
    });

  } catch (error: any) {
    console.error("Erro na rota de Teoria (RAG + Groq):", error);
    
    // Fallback info for debugging API keys
    const env = resolveEnv();
    return NextResponse.json({ 
      error: error.message || "Erro ao gerar teoria",
      env_keys: Object.keys(env || {})
    }, { status: 500 });
  }
}
