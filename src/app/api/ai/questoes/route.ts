export const runtime = 'edge';
import { NextResponse } from "next/server";
import { callGroqWithFallback, getGroqKeysFromEnv } from "@/lib/groq";
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDomainRules, extractCleanJson } from '@/lib/ai-protocols';

// FunÃ§Ã£o auxiliar para resolver bindings e env no Edge
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
    const groqApiKeys = getGroqKeysFromEnv(env);

    const { label, subject, nicho, dificuldade, banca } = await req.json() as {
      label?: string;
      subject?: string;
      nicho?: string;
      dificuldade?: string;
      banca?: string;
    };

    if (!label) {
      return NextResponse.json({ error: "Falta label" }, { status: 400 });
    }

    // 1. Busca o contexto vetorial na nossa rota de busca (mesma lÃ³gica da teoria)
    const reqUrl = new URL(req.url);
    const searchUrl = `${reqUrl.origin}/api/rag/search?q=${encodeURIComponent(label)}`;
    
    console.log(`[RAG Questoes] Buscando contexto em: ${searchUrl}`);
    const searchResponse = await fetch(searchUrl);
    
    let contextText = "";
    if (searchResponse.ok) {
      const searchData = await searchResponse.json() as { results?: Array<{ text: string }> };
      if (searchData.results && searchData.results.length > 0) {
        // Truncamento crucial (2500 chars por chunk) para evitar Rate Limit TPM
        contextText = searchData.results
          .map((r, i) => `[Trecho ${i + 1}]:\n${r.text.substring(0, 2500)}`)
          .join('\n\n');
      }
    } else {
      console.error(`[RAG Questoes] Falha ao buscar contexto: ${searchResponse.status}`);
    }

    // 2. System Prompt + Protocolo de Confiabilidade centralizado
    const systemPrompt = `VocÃª atua como um Elaborador SÃªnior de Concursos para Guardas Municipais e Carreiras Policiais.
Sua missÃ£o Ã© gerar 2 questÃµes inÃ©ditas de mÃºltipla escolha com alto rigor tÃ©cnico.

TÃ³pico: ${label}
MatÃ©ria: ${subject || "Geral"}
Dificuldade: ${dificuldade || "MÃ©dia"}
Banca: ${banca || "SH Dias / Estilo Municipal"}

REGRAS DE OURO (Siga estritamente):
1. PADRONIZAÃ‡ÃƒO DAS ALTERNATIVAS: Gere SEMPRE e EXATAMENTE 4 alternativas (A, B, C e D).
2. O PERFIL DO EXAMINADOR: Os enunciados DEVEM trazer cenÃ¡rios prÃ¡ticos (aplicaÃ§Ã£o de leis, estatutos em delegacias, regras de trÃ¢nsito, matemÃ¡tica policial). Evite perguntas teÃ³ricas.
3. CASCAS DE BANANA OBRIGATÃ“RIAS: Pelo menos UMA alternativa incorreta em cada questÃ£o deve ser uma pegadinha altamente plausÃ­vel.
4. JUSTIFICATIVA SOCRÃTICA: Explique rapidamente o motivo da correta e destrua a pegadinha. Seja CONCISO para economizar tokens.
5. CONTEXTO VETORIAL: Use OBRIGATORIAMENTE o [CONTEXTO VETORIAL] abaixo.
6. PENSAMENTO DIRETO: Mantenha qualquer bloco <think> extremamente curto (mÃ¡x 200 palavras). VÃ¡ direto Ã  geraÃ§Ã£o do JSON.

[CONTEXTO VETORIAL]:
${contextText || "Nenhum contexto especÃ­fico encontrado na base. Utilize seu conhecimento de ponta."}

FORMATO JSON IMPLACÃVEL:
VocÃª DEVE retornar APENAS UM JSON VÃLIDO no exato formato abaixo e ABSOLUTAMENTE NENHUM TEXTO ADICIONAL (sem tags markdown, sem blocos <think>, apenas o objeto JSON puramente encodado).

{
  "questoes": [
    {
      "id": "gerar-um-id-unico-aqui",
      "enunciado": "Texto da questÃ£o situacional...",
      "alternativas": {
        "A": "Texto da alternativa A",
        "B": "Texto da alternativa B",
        "C": "Texto da alternativa C",
        "D": "Texto da alternativa D"
      },
      "correta": "B",
      "justificativa": "ExplicaÃ§Ã£o matadora da correta e destruiÃ§Ã£o da pegadinha..."
    }
  ]
}

=== PROTOCOLO DE CONFIABILIDADE ===
${getDomainRules(subject || "")}`;

    // 3. Chamada para a Groq
    const result = await callGroqWithFallback([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Gere as questões para: ${label}` }
    ], {
      model: "qwen/qwen3.6-27b",
      temperature: 0.3,
      max_tokens: 5000,
      apiKeys: groqApiKeys
    });

    if (typeof result !== "string" || !result) {
      throw new Error("Resposta vazia ou inválida da API Groq");
    }

    // 4. Extração de JSON centralizada via ai-protocols (extractCleanJson)
    const cleanResult = extractCleanJson(result);

    let json;
    try {
      json = JSON.parse(cleanResult);
    } catch (e: any) {
      console.error("JSON parse error:", e);
      throw new Error("Falha ao parsear JSON gerado pela IA. Texto puro: " + cleanResult);
    }

    // 5. Adiciona IDs randomicos se o modelo esqueceu
    if (json.questoes && Array.isArray(json.questoes)) {
      json.questoes = json.questoes.map((q: any) => ({
        ...q,
        id: q.id && q.id !== "gerar-um-id-unico-aqui" ? q.id : crypto.randomUUID()
      }));
    }

    return NextResponse.json(json);
  } catch (error: any) {
    console.error("Erro na rota de QuestÃµes (RAG + Qwen):", error);
    
    const env = resolveEnv();
    return NextResponse.json({ 
      error: error.message,
      env_keys: Object.keys(env || {}) 
    }, { status: 500 });
  }
}

