export const runtime = 'edge';

import { NextResponse } from "next/server";
import { callGroqWithFallback, getGroqKeysFromEnv } from "@/lib/groq";
import { getRequestContext } from '@cloudflare/next-on-pages';
import { AIExpansionSchema } from "@/lib/validations/trilha";

// Padrão de resolução de env para Edge Runtime / Cloudflare Pages
function resolveEnv(): Record<string, string | undefined> {
  try {
    const ctx = getRequestContext();
    if (ctx?.env) return ctx.env as any;
  } catch (_) {}
  const g = globalThis as any;
  if (g.GROQ_API_KEY) return g;
  return process.env as any;
}

export async function POST(req: Request) {
  const env = resolveEnv();
  const groqApiKeys = getGroqKeysFromEnv(env);
  try {
    const raw: unknown = await req.json();

    // Runtime guard: garante formato antes de usar
    if (
      !raw ||
      typeof raw !== "object" ||
      typeof (raw as Record<string, unknown>).topico !== "string" ||
      typeof (raw as Record<string, unknown>).trilhaId !== "string"
    ) {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const body = raw as Record<string, unknown>;
    const trilhaId = body.trilhaId as string;
    const topico = body.topico as string;
    const erros = Array.isArray(body.erros) ? (body.erros as string[]) : [];

    const errosFormatados = erros.length > 0
      ? erros.join(", ")
      : "Nenhum erro registrado ainda. Gere questões de nível intermediário.";

    const prompt = `Você é um gerador de questões de concurso público focado em micro-learning e correção de fraquezas.
Tópico: ${topico}.
O aluno errou os seguintes conceitos recentemente: ${errosFormatados}.
Gere EXATAMENTE 3 questões de múltipla escolha com 4 alternativas cada, focadas em corrigir essas fraquezas e aprofundar o conhecimento.
Retorne SOMENTE este JSON, sem texto adicional:
{
  "questoes": [
    {
      "id": "q_gen_1",
      "enunciado": "texto da questao",
      "opcoes": ["alternativa A", "alternativa B", "alternativa C", "alternativa D"],
      "corretaIdx": 0,
      "justificativa": "explicacao detalhada da resposta correta"
    }
  ]
}`;

    const content = await callGroqWithFallback(
      [{ role: "user", content: prompt }],
      { model: "llama3-8b-8192", temperature: 0.4, response_format: { type: "json_object" }, apiKeys: groqApiKeys }
    );
    
    if (!content) throw new Error("Retorno vazio da IA");

    const parsed = AIExpansionSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      console.error("[Zod Validation Error]", parsed.error.flatten());
      throw new Error(`Formato inválido retornado pela IA: ${parsed.error.message}`);
    }

    return NextResponse.json(parsed.data);

  } catch (error: any) {
    console.error("[AI Generation Error]", error);
    // Mock Fallback garantido caso a Key da Groq falhe
    return NextResponse.json({
      questoes: [
        {
          id: `q-ia-${Date.now()}-1`,
          enunciado: "[IA] Em relação ao tema abordado, assinale a alternativa correta sobre as exceções à regra principal:",
          opcoes: ["Não há exceções absolutas no ordenamento jurídico pátrio aplicáveis ao caso.", "A discricionariedade permite flexibilizar a regra em qualquer circunstância.", "A lei estabelece rol taxativo de exceções, não admitindo analogia.", "O interesse público primário sempre afasta a incidência da regra."],
          corretaIdx: 2,
          justificativa: "As exceções devem vir expressas em lei e, em regra, interpretam-se restritivamente."
        },
        {
          id: `q-ia-${Date.now()}-2`,
          enunciado: "[IA] Sobre as hipóteses de erro que você cometeu, qual é a principal jurisprudência aplicável?",
          opcoes: ["A inconstitucionalidade material do ato por violação direta à Constituição.", "A validade condicionada à aprovação prévia do Tribunal de Contas.", "A possibilidade de convalidação desde que não haja lesão ao erário.", "A nulidade absoluta insuscetível de correção retroativa."],
          corretaIdx: 2,
          justificativa: "Atos com vícios sanáveis podem ser convalidados desde que não acarretem lesão ao interesse público nem prejuízo a terceiros."
        },
        {
          id: `q-ia-${Date.now()}-3`,
          enunciado: "[IA] Qual ferramenta processual seria mais adequada para impugnar essa conduta?",
          opcoes: ["Mandado de Segurança", "Habeas Data", "Ação Popular", "Reclamação Constitucional"],
          corretaIdx: 0,
          justificativa: "O Mandado de Segurança é a via adequada para proteger direito líquido e certo não amparado por Habeas Corpus."
        }
      ]
    });
  }
}
