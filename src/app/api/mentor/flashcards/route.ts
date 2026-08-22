export const runtime = 'edge';
import { NextResponse } from "next/server";
import { callGroqWithFallback } from "@/lib/groq";
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDomainRules, extractCleanJson } from '@/lib/ai-protocols';

// Função auxiliar para resolver bindings e env no Edge (padrão da nossa arquitetura)
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

    const { label, subject, nicho, context } = await req.json() as {
      label?: string;
      subject?: string;
      nicho?: string;
      context?: string;
    };

    if (!label) {
      return NextResponse.json({ error: "Parâmetro 'label' é obrigatório." }, { status: 400 });
    }

    // 1. Se não houver context do frontend, busca no RAG (mesma lógica das outras rotas)
    let contextText = context || "";
    if (!contextText) {
      const reqUrl = new URL(req.url);
      const searchUrl = `${reqUrl.origin}/api/rag/search?q=${encodeURIComponent(label)}`;
      console.log(`[RAG Flashcards] Buscando contexto em: ${searchUrl}`);

      const searchResponse = await fetch(searchUrl);
      if (searchResponse.ok) {
        const searchData = await searchResponse.json() as { results?: Array<{ text: string }> };
        if (searchData.results && searchData.results.length > 0) {
          // Truncamento crucial (2500 chars por chunk) — mesmo torniquete das outras rotas
          contextText = searchData.results
            .map((r, i) => `[Trecho ${i + 1}]:\n${r.text.substring(0, 2500)}`)
            .join('\n\n');
        }
      } else {
        console.error(`[RAG Flashcards] Falha ao buscar contexto: ${searchResponse.status}`);
      }
    }

    // 2. System Prompt — Especialista em Memorização + Protocolo de Confiabilidade centralizado
    const systemPrompt = `Você é um Especialista em Memorização e criação de flashcards para concursos públicos.
Sua missão é criar EXATAMENTE 4 flashcards de alta qualidade baseados no tópico e no contexto fornecido.

Tópico: ${label}
Matéria: ${subject || "Geral"}
Nicho: ${nicho || "Concursos Públicos"}

REGRAS DE CRIAÇÃO:
1. A frente ("front") deve conter uma pergunta direta, um termo técnico, ou um gatilho de memorização.
2. O verso ("back") deve conter a resposta curta, objetiva, mnemônicos ou palavras-chave que fixem o conceito.
3. Baseie-se OBRIGATORIAMENTE no [CONTEXTO] abaixo. Se houver pegadinhas ou pontos críticos no contexto, transforme-os em flashcards.
4. NÃO cite número de artigo de lei salvo certeza absoluta.
5. PENSAMENTO DIRETO: Mantenha qualquer bloco <think> extremamente curto (máx 100 palavras). Vá direto ao JSON.

[CONTEXTO]:
${contextText || "Nenhum contexto específico encontrado. Use seu conhecimento especializado."}

FORMATO JSON IMPLACÁVEL:
Retorne APENAS o JSON abaixo. Absolutamente nenhum texto adicional antes ou depois.

{
  "flashcards": [
    { "id": "placeholder-1", "front": "Pergunta ou termo aqui", "back": "Resposta curta ou mnemônico aqui" },
    { "id": "placeholder-2", "front": "Pergunta ou termo aqui", "back": "Resposta curta ou mnemônico aqui" },
    { "id": "placeholder-3", "front": "Pergunta ou termo aqui", "back": "Resposta curta ou mnemônico aqui" },
    { "id": "placeholder-4", "front": "Pergunta ou termo aqui", "back": "Resposta curta ou mnemônico aqui" }
  ]
}

=== PROTOCOLO DE CONFIABILIDADE ===
${getDomainRules(subject || "")}`;

    // 3. Chamada ao Qwen via Groq
    const result = await callGroqWithFallback([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Gere os flashcards para: ${label}` }
    ], {
      model: "qwen/qwen3.6-27b",
      temperature: 0.2,
      max_tokens: 3000,
      apiKey: groqApiKey
    });

    if (!result) throw new Error("Resposta vazia da API Groq");

    // 4. Extração de JSON centralizada via ai-protocols (extractCleanJson)
    const cleanResult = extractCleanJson(result);

    let parsed;
    try {
      parsed = JSON.parse(cleanResult);
    } catch (e: any) {
      console.error("JSON parse error em flashcards:", e.message);
      throw new Error("Falha ao parsear JSON gerado pela IA. Conteúdo: " + cleanResult.substring(0, 200));
    }

    // 5. Injeção de IDs únicos para evitar conflito de keys no React
    if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
      parsed.flashcards = parsed.flashcards.map((fc: any) => ({
        ...fc,
        id: crypto.randomUUID()
      }));
    }

    // 6. Retorno padronizado
    return NextResponse.json({ flashcards: parsed.flashcards });

  } catch (error: any) {
    console.error("Erro na rota de Flashcards (RAG + Qwen):", error);
    const env = resolveEnv();
    return NextResponse.json({
      error: error.message,
      env_keys: Object.keys(env || {})
    }, { status: 500 });
  }
}
