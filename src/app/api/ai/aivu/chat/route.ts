export const runtime = "edge";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifySessionCookie } from "@/lib/session";
import { callGroqWithFallback, getGroqKeysFromEnv } from "@/lib/groq";
import { extractCleanMarkdown } from "@/lib/ai-protocols";
import { InMemoryRateLimiter } from "@/lib/material-rate-limit";
import { AivuChatRequestSchema } from "@/lib/validations/aivu-chat";

/**
 * Limitador em memória para conversas com o AIVU.
 * Janela: 15 mensagens a cada 15 minutos por usuário ativo no isolate.
 */
export const aivuChatRateLimiter = new InMemoryRateLimiter({
  limit: 15,
  windowMs: 15 * 60 * 1000,
  maxEntries: 500,
});

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
  // 1. Validação estrita da sessão criptográfica
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aivur_session");
  const session = await verifySessionCookie(sessionCookie?.value);

  if (!session.valid) {
    return NextResponse.json(
      { error: "Sessão ausente ou inválida. Faça login para conversar com o AIVU." },
      { status: 401 }
    );
  }

  const userId = session.userId;

  // 2. Proteção contra rajadas e contenção de custos (Rate Limit)
  const clientKey = `user:${userId}`;
  if (!aivuChatRateLimiter.check(clientKey)) {
    return NextResponse.json(
      { error: "Limite de mensagens atingido. Por favor, aguarde alguns instantes antes de enviar outra mensagem." },
      { status: 429 }
    );
  }

  // 3. Validação do corpo da requisição via Zod
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Payload JSON malformado." },
      { status: 400 }
    );
  }

  const parseResult = AivuChatRequestSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Dados de requisição inválidos.",
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { message, history } = parseResult.data;

  // 4. Resolução de credenciais do provedor de IA
  const env = resolveEnv();
  const groqApiKeys = getGroqKeysFromEnv(env);

  if (!groqApiKeys || groqApiKeys.length === 0) {
    return NextResponse.json(
      { error: "Provedor de inteligência artificial temporariamente indisponível." },
      { status: 503 }
    );
  }

  // 5. Construção do contexto e histórico para a Groq
  const systemPrompt = `Você é o AIVU, assistente virtual inteligente da plataforma de estudos para concursos públicos AIVUR.
Suas diretrizes:
- Responda em português brasileiro de forma amigável, clara, encorajadora e altamente objetiva.
- Auxilie o aluno com dúvidas gerais de estudo, organização, motivação e conceitos de concursos.
- Seja conciso: forneça respostas em 1 a 3 parágrafos curtos ou listas com marcadores diretos.
- Não invente legislações ou números de artigos caso não tenha absoluta certeza.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  // 6. Invocação da Groq com suporte nativo a failover
  try {
    const rawReply = await callGroqWithFallback(messages, {
      model: "openai/gpt-oss-120b",
      temperature: 0.5,
      max_tokens: 600,
      apiKeys: groqApiKeys,
    });

    if (!rawReply || typeof rawReply !== "string") {
      return NextResponse.json(
        { error: "Falha ao obter resposta do modelo de inteligência artificial." },
        { status: 502 }
      );
    }

    const cleanReply = extractCleanMarkdown(rawReply);

    return NextResponse.json({
      reply: cleanReply,
      state: "speaking",
    });
  } catch (error: any) {
    const status = error?.status || (error?.response?.status) || 500;
    const isRateLimit = status === 429 || (error?.message && error.message.includes("429"));

    if (isRateLimit) {
      return NextResponse.json(
        { error: "A inteligência artificial atingiu o limite de capacidade por minuto. Aguarde 30 segundos e tente novamente." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Instabilidade temporária na comunicação com o assistente. Tente novamente." },
      { status: 502 }
    );
  }
}
