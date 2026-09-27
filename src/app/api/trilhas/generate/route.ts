import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TrilhaSchema } from '@/lib/validations/trilha';
import { extractCleanJson, getDomainRules } from '@/lib/ai-protocols';
import type { TrilhaSourceType } from '@/mocks/trilhasMock';

export const runtime = 'edge';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GenerateRequestBody {
  input: string;
  titulo?: string;
  sourceType?: TrilhaSourceType;
}

// ─── System prompt (blindado) ─────────────────────────────────────────────────
function buildSystemPrompt(): string {
  return [
    'You are a strict JSON generation API.',
    'You MUST respond with a single, valid JSON object and NOTHING ELSE.',
    'No markdown fences (```json), no commentary, no preamble.',
    'The JSON must exactly match the schema provided in the user message.',
    'Any deviation from the schema will be rejected by the validation layer.',
    'Do NOT add extra keys. Do NOT omit required keys.',
  ].join(' ');
}

function buildUserPrompt(input: string, titulo: string, domainRules: string): string {
  return `
Gere UMA trilha de estudo completa sobre o tema: "${titulo}".

FONTE DE CONTEÚDO FORNECIDA PELO USUÁRIO:
---
${input.slice(0, 8000)}
---

${domainRules}

SCHEMA OBRIGATÓRIO (retorne EXATAMENTE este formato, sem campos extras):
{
  "disciplina": "string — nome da matéria geral",
  "video": {
    "titulo": "string — título da aula",
    "resumo": "string — 1 frase descritiva",
    "resumo_markdown": "string — resumo estruturado em markdown (headings, listas, conceitos-chave)"
  },
  "flashcards": [
    { "frente": "string — pergunta ou conceito", "verso": "string — resposta direta" }
  ],
  "questoes": [
    {
      "enunciado": "string",
      "opcoes": ["string","string","string","string"],
      "corretaIdx": 0,
      "justificativa": "string",
      "tipo_questao": "MULTIPLA_ESCOLHA"
    }
  ]
}

REGRAS OBRIGATÓRIAS:
- flashcards: mínimo 3, máximo 5 objetos
- questoes: mínimo 3, máximo 5 objetos; opcoes DEVE ter exatamente 4 strings; corretaIdx entre 0 e 3
- resumo_markdown DEVE usar \\n para quebras de linha dentro da string JSON
- Responda APENAS com o JSON puro. Nenhum texto antes ou depois.
`.trim();
}

// ─── Model fallback chain ─────────────────────────────────────────────────────
const MODELS = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'gemma2-9b-it',
];

async function callGroqDirect(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  temperature = 0.15
): Promise<string | null> {
  for (const model of MODELS) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: 6000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json() as any;
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (content) {
        console.log(`[generate] Success with model ${model}`);
        return content;
      }
    } else {
      console.warn(`[generate] Model ${model} failed: ${res.status}`);
    }
  }
  return null;
}

// ─── Helper: inject required top-level fields the LLM cannot know ─────────────
function injectServerFields(
  raw: any,
  titulo: string,
  trilhaId: string
): any {
  raw.id       = trilhaId;
  raw.titulo   = titulo;
  raw.progresso = 0;

  raw.flashcards = (raw.flashcards ?? []).map((fc: any, i: number) => ({
    id: `${trilhaId}-fc-${i}`,
    frente: fc.frente ?? '',
    verso:  fc.verso  ?? '',
  }));

  raw.questoes = (raw.questoes ?? []).map((q: any, i: number) => ({
    id:           `${trilhaId}-q-${i}`,
    enunciado:    q.enunciado    ?? '',
    opcoes:       q.opcoes       ?? [],
    corretaIdx:   q.corretaIdx   ?? 0,
    justificativa: q.justificativa ?? '',
    tipo_questao:  q.tipo_questao  ?? 'MULTIPLA_ESCOLHA',
  }));

  return raw;
}

// ─── POST /api/trilhas/generate ───────────────────────────────────────────────
export async function POST(req: Request) {
  // 1. Auth guard
  const cookieStore = await cookies();
  const session = cookieStore.get('aivur_session');
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.value;

  // 2. Env resolution (Edge-safe)
  let env: Record<string, string | undefined>;
  try {
    env = getRequestContext().env as any;
  } catch {
    env = process.env as any;
  }

  const apiKey =
    env.GROQ_API_KEY       ||
    env.GROQ_API_KEY_2     ||
    env.GROQ_API_KEY_3     ||
    env.GROQ_API_KEY_FALLBACK;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key não configurada. Contacte o suporte.' },
      { status: 503 }
    );
  }

  // 3. Parse & validate body
  const contentType = req.headers.get('content-type') || '';
  let input = '';
  let rawTitulo = '';
  let sourceType: TrilhaSourceType = 'text';

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      rawTitulo = formData.get('titulo') as string || '';
      sourceType = (formData.get('sourceType') as TrilhaSourceType) || 'edital';

      if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'O arquivo excede o limite de 5MB.' }, { status: 413 });
      }

      const arrayBuffer = await file.arrayBuffer();
      // Extração edge-safe usando Uint8Array e btoa
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      input = `[DOCUMENTO PDF (BASE64)]: data:application/pdf;base64,${base64}`;

    } else {
      const body = await req.json() as GenerateRequestBody;
      input = body.input || '';
      rawTitulo = body.titulo || '';
      sourceType = body.sourceType || 'text';
    }
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao processar o corpo da requisição.' }, { status: 400 });
  }

  if (!input || typeof input !== 'string' || input.trim().length < 10) {
    return NextResponse.json(
      { error: 'Campo "input" é obrigatório e deve ter ao menos 10 caracteres.' },
      { status: 400 }
    );
  }

  const titulo = (rawTitulo?.trim() || input.trim().slice(0, 80)) as string;

  // 4. Build prompts
  const systemPrompt = buildSystemPrompt();
  const domainRules  = getDomainRules(titulo);
  const userPrompt   = buildUserPrompt(input.trim(), titulo, domainRules);

  // 5. First LLM call
  const rawContent = await callGroqDirect(systemPrompt, userPrompt, apiKey);

  if (!rawContent) {
    return NextResponse.json(
      { error: 'Todos os modelos de IA falharam. Tente novamente.' },
      { status: 502 }
    );
  }

  // 6. JSON extraction + Zod validation
  const trilhaId   = `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const StrictSchema = TrilhaSchema.omit({ id: true, progresso: true });

  let parsedRaw: any;
  try {
    parsedRaw = JSON.parse(extractCleanJson(rawContent));
  } catch {
    return NextResponse.json(
      { error: 'A IA retornou um JSON malformado.' },
      { status: 422 }
    );
  }

  // ── ACOPLAMENTO ZOD (ponto de validação primário) ──────────────────────────
  // Toda a resposta da IA passa por aqui antes de tocar o D1 ou o store.
  // Erros de schema ativam o Fixer Prompt abaixo.
  let zodResult = StrictSchema.safeParse(parsedRaw);

  // 7. Fixer prompt (única retentativa)
  if (!zodResult.success) {
    console.warn('[generate] Zod validation failed, triggering fixer:', zodResult.error.issues);

    const fixerPrompt = `
O JSON abaixo falhou na validação de schema. Corrija APENAS os erros estruturais listados.
NÃO altere o conteúdo educacional. Responda APENAS com o JSON corrigido.

ERROS:
${JSON.stringify(zodResult.error.issues, null, 2)}

JSON ORIGINAL:
${JSON.stringify(parsedRaw, null, 2)}
    `.trim();

    const fixedContent = await callGroqDirect(
      buildSystemPrompt(),
      fixerPrompt,
      apiKey,
      0.05 // temperature mínima para correção estrutural
    );

    if (fixedContent) {
      try {
        const fixedRaw = JSON.parse(extractCleanJson(fixedContent));
        // ── ACOPLAMENTO ZOD (ponto de validação secundário — pós-fixer) ──────
        zodResult = StrictSchema.safeParse(fixedRaw);
        if (zodResult.success) parsedRaw = fixedRaw;
      } catch {
        /* fixer também retornou JSON malformado — cai no 422 abaixo */
      }
    }
  }

  if (!zodResult.success) {
    return NextResponse.json(
      {
        error: 'Não foi possível estruturar a trilha corretamente. Tente novamente.',
        details: zodResult.error.issues,
      },
      { status: 422 }
    );
  }

  // 8. Assemble final trilha with server-injected fields + hub metadata
  const assembled = injectServerFields(parsedRaw, titulo, trilhaId);
  const finalTrilha = {
    ...assembled,
    sourceType,
    sourceUrl:        sourceType === 'youtube' ? input.trim() : undefined,
    isPublic:         false, // tenant isolation: geração do usuário é sempre privada
    generationStatus: 'done' as const,
  };

  // ── ACOPLAMENTO ZOD (validação final completa — com campos server-injected) ─
  const fullResult = TrilhaSchema.safeParse(finalTrilha);
  if (!fullResult.success) {
    console.error('[generate] Final schema validation failed:', fullResult.error.issues);
    return NextResponse.json(
      { error: 'Erro na montagem final da trilha.', details: fullResult.error.issues },
      { status: 500 }
    );
  }

  const validatedTrilha = fullResult.data;

  // 9. Persist no D1 — isolado por userId (isPublic: false)
  try {
    const db = (getRequestContext().env as any).D1_DB as D1Database | undefined;

    if (db) {
      await db
        .prepare(
          `INSERT INTO trilhas_geradas
             (id, user_id, titulo, disciplina, source_type, is_public, progress_json, created_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
        )
        .bind(
          validatedTrilha.id,
          userId,
          validatedTrilha.titulo,
          validatedTrilha.disciplina,
          sourceType,
          JSON.stringify(validatedTrilha),
          Date.now()
        )
        .run();

      console.log(`[generate] Trilha ${validatedTrilha.id} persisted to D1 for user ${userId.slice(0, 8)}…`);
    } else {
      // Ambiente local sem binding D1 — continua retornando o JSON sem falhar
      console.warn('[generate] D1_DB binding not available. Skipping persistence (local dev mode).');
    }
  } catch (dbErr: any) {
    // Falha no D1 não deve bloquear a resposta ao usuário.
    // A trilha já está validada e será salva no Zustand no client.
    console.error('[generate] D1 insert failed (non-blocking):', dbErr?.message);
  }

  return NextResponse.json(validatedTrilha, { status: 200 });
}
