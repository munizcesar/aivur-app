import { NextResponse } from "next/server";
import { callGroqWithFallback } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const { label, subject, nicho, context } = await req.json();

    if (!label) {
      return NextResponse.json({ error: "Falta label" }, { status: 400 });
    }

    const systemPrompt = `Você é um criador de flashcards para concursos públicos.
Seu objetivo é gerar um conjunto de 5 a 10 flashcards baseados no tópico solicitado.
Tópico: ${label}
Matéria: ${subject || ""}
${context ? `Contexto Base: ${context}` : ""}

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

    return NextResponse.json(json);
  } catch (error: any) {
    console.error("Erro na rota de Flashcards:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
