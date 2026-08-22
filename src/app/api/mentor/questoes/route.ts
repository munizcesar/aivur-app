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

    const { label, subject, nicho, dificuldade, banca } = await req.json() as { label?: string; subject?: string; nicho?: string; dificuldade?: string; banca?: string };

    if (!label) {
      return NextResponse.json({ error: "Falta label" }, { status: 400 });
    }

    // 1. Busca o contexto vetorial na nossa rota de busca (mesma lógica da teoria)
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

    // 2. System Prompt Turbinado
    const systemPrompt = `Você atua como um Elaborador Sênior de Concursos para Guardas Municipais e Carreiras Policiais.
Sua missão é gerar 3 questões inéditas de múltipla escolha com alto rigor técnico.

Tópico: ${label}
Matéria: ${subject || "Geral"}
Dificuldade: ${dificuldade || "Média"}
Banca: ${banca || "SH Dias / Estilo Municipal"}

REGRAS DE OURO (Siga estritamente):
1. PADRONIZAÇÃO DAS ALTERNATIVAS: Gere SEMPRE e EXATAMENTE 4 alternativas (A, B, C e D). Nenhuma a mais, nenhuma a menos.
2. O PERFIL DO EXAMINADOR: Os enunciados DEVEM trazer cenários práticos do dia a dia (aplicação de leis em ocorrências, estatutos em delegacias, regras de trânsito em patrulha, ou matemática/cálculos aplicados à realidade policial/guarda). Evite perguntas teóricas e secas.
3. CASCAS DE BANANA OBRIGATÓRIAS: Pelo menos UMA alternativa incorreta em cada questão deve ser uma "pegadinha" extremamente plausível, baseada nos erros mais comuns dos candidatos ou em semelhanças que confundem.
4. JUSTIFICATIVA SOCRÁTICA: A chave "justificativa" NÃO pode ser apenas "A letra X está correta". Você DEVE explicar rapidamente o motivo da correta e DESTRUIR a principal pegadinha da questão, explicando por que ela está errada e como não cair nela.
5. CONTEXTO VETORIAL: Use OBRIGATORIAMENTE o [CONTEXTO VETORIAL] fornecido abaixo para embasar o conteúdo jurídico, matemático ou teórico das questões. Se o contexto trouxer "pegadinhas", aplique-as nas questões.

[CONTEXTO VETORIAL]:
${contextText || "Nenhum contexto específico encontrado na base. Utilize seu conhecimento de ponta."}

FORMATO JSON IMPLACÁVEL:
Você DEVE retornar APENAS UM JSON VÁLIDO no exato formato abaixo e ABSOLUTAMENTE NENHUM TEXTO ADICIONAL (sem tags markdown, sem blocos <think>, apenas o objeto JSON puramente encodado).

{
  "questoes": [
    {
      "id": "gerar-um-id-unico-aqui",
      "enunciado": "Texto da questão situacional...",
      "alternativas": {
        "A": "Texto da alternativa A",
        "B": "Texto da alternativa B",
        "C": "Texto da alternativa C",
        "D": "Texto da alternativa D"
      },
      "correta": "B",
      "justificativa": "Explicação matadora da correta e destruição da pegadinha..."
    }
  ]
}`;

    // 3. Chamada para a Groq com JSON Mode
    const result = await callGroqWithFallback([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Gere as questões para: ${label}` }
    ], {
      model: "qwen/qwen3.6-27b",
      temperature: 0.3,
      max_tokens: 2500, // Margem um pouco maior para array de 3 questões com justificativas completas
      apiKey: groqApiKey
    });

    if (!result) throw new Error("Resposta vazia da API Groq");
    
    // Limpeza de segurança super robusta para extrair o JSON mesmo com <think> malformado ou Markdown
    let cleanResult = result;
    const thinkEnd = cleanResult.lastIndexOf('</think>');
    if (thinkEnd !== -1) {
      cleanResult = cleanResult.substring(thinkEnd + 8);
    } else if (cleanResult.includes('<think>')) {
      // Se tiver abertura mas não tiver fechamento (corte abrupto)
      cleanResult = cleanResult.replace(/<think>[\s\S]*/, '');
    }

    const jsonStart = cleanResult.indexOf('{');
    const jsonEnd = cleanResult.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanResult = cleanResult.substring(jsonStart, jsonEnd + 1);
    }

    const json = JSON.parse(cleanResult);

    // Adiciona IDs randomicos se o modelo esqueceu
    if (json.questoes && Array.isArray(json.questoes)) {
      json.questoes = json.questoes.map((q: any) => ({
        ...q,
        id: q.id && q.id !== "gerar-um-id-unico-aqui" ? q.id : crypto.randomUUID()
      }));
    }

    return NextResponse.json(json);
  } catch (error: any) {
    console.error("Erro na rota de Questões (RAG + Qwen):", error);
    
    const env = resolveEnv();
    return NextResponse.json({ 
      error: error.message,
      env_keys: Object.keys(env || {}) 
    }, { status: 500 });
  }
}
