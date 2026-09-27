import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TrilhaSchema } from '@/lib/validations/trilha';
import { extractCleanJson, getDomainRules } from '@/lib/ai-protocols';
import type { TrilhaSourceType } from '@/mocks/trilhasMock';

export const runtime = 'edge';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5MB

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
  const fonte = input
    ? `\nFONTE DE CONTEÚDO FORNECIDA PELO USUÁRIO:\n---\n${input.slice(0, 8000)}\n---\n`
    : '\nFONTE DE CONTEÚDO: o documento PDF anexado a esta mensagem. Extraia o conteúdo dele.\n';

  return `
Gere UMA trilha de estudo completa sobre o tema: "${titulo}".
${fonte}
${domainRules}

SCHEMA OBRIGATÓRIO (retorne EXATAMENTE este formato, sem campos extras):
{
  "disciplina": "string — nome da matéria geral",
  "titulo": "string — título curto da trilha",
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

// ─── Model fallback chains ────────────────────────────────────────────────────
const TEXT_MODELS = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'gemma2-9b-it',
];

// Modelos multimodais do Groq que aceitam PDF via document input
const PDF_MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
];

interface ChatPartText { type: 'text'; text: string }
interface ChatPartFile {
  type: 'file';
  file: { filename: string; file_data: string };
}
type ChatContent = string | (ChatPartText | ChatPartFile)[];

async function callGroq(
  systemPrompt: string,
  userContent: ChatContent,
  apiKey: string,
  models: string[],
  temperature = 0.15
): Promise<string | null> {
  for (const model of models) {
    try {
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
            { role: 'user', content: userContent },
          ],
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          console.log(`[generate] Success with model ${model}`);
          return content;
        }
      } else {
        console.warn(`[generate] Model ${model} failed: ${res.status}`);
      }
    } catch (modelErr) {
      console.warn(`[generate] Model ${model} threw:`, modelErr);
    }
  }
  return null;
}

// ─── Helper: base64 chunked (evita estouro de stack em PDFs grandes) ──────────
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.byteLength; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

// ─── Helper: inject required top-level fields the LLM cannot know ─────────────
function injectServerFields(raw: any, titulo: string, trilhaId: string): any {
  raw.id = trilhaId;
  raw.titulo = titulo;
  raw.progresso = 0;

  raw.flashcards = (raw.flashcards ?? []).map((fc: any, i: number) => ({
    id: `${trilhaId}-fc-${i}`,
    frente: fc.frente ?? '',
    verso: fc.verso ?? '',
  }));

  raw.questoes = (raw.questoes ?? []).map((q: any, i: number) => ({
    id: `${trilhaId}-q-${i}`,
    enunciado: q.enunciado ?? '',
    opcoes: q.opcoes ?? [],
    corretaIdx: q.corretaIdx ?? 0,
    justificativa: q.justificativa ?? '',
    tipo_questao: q.tipo_questao ?? 'MULTIPLA_ESCOLHA',
  }));

  return raw;
}

// ─── POST /api/trilhas/generate ───────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // 1. Auth guard
    const cookieStore = await cookies();
    const session = cookieStore.get('aivur_session');
    if (!session?.value) {
      return NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
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
      env.GROQ_API_KEY ||
      env.GROQ_API_KEY_2 ||
      env.GROQ_API_KEY_3 ||
      env.GROQ_API_KEY_FALLBACK;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Motor de IA não configurado. Contacte o suporte.' },
        { status: 503 }
      );
    }

    // 3. Parser híbrido: multipart/form-data (PDF) vs application/json (link/texto)
    const contentType = req.headers.get('content-type') || '';
    let input = '';
    let rawTitulo = '';
    let sourceType: TrilhaSourceType = 'text';
    let pdfBase64: string | null = null;

    try {
      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        const file = formData.get('file');
        rawTitulo = String(formData.get('titulo') || '');
        const rawSource = String(formData.get('sourceType') || 'edital');
        sourceType = rawSource === 'edital' ? 'edital' : 'text';

        if (!(file instanceof File)) {
          return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }
        if (file.type && file.type !== 'application/pdf') {
          return NextResponse.json(
            { error: 'Formato inválido — envie apenas arquivos PDF.' },
            { status: 400 }
          );
        }
        if (file.size > MAX_PDF_BYTES) {
          return NextResponse.json(
            { error: 'O arquivo excede o limite de 5MB.' },
            { status: 413 }
          );
        }

        // Buffer → base64 chunked (edge-safe, sem fs ou parsers Node)
        const arrayBuffer = await file.arrayBuffer();
        pdfBase64 = bytesToBase64(new Uint8Array(arrayBuffer));
      } else {
        const body = (await req.json()) as GenerateRequestBody;
        input = typeof body.input === 'string' ? body.input : '';
        rawTitulo = typeof body.titulo === 'string' ? body.titulo : '';
        sourceType =
          body.sourceType === 'youtube' || body.sourceType === 'edital' || body.sourceType === 'system'
            ? body.sourceType
            : 'text';
      }
    } catch (err) {
      console.error('[generate] Body parse failed:', err);
      return NextResponse.json(
        { error: 'Não foi possível ler o conteúdo enviado. Verifique o arquivo e tente novamente.' },
        { status: 400 }
      );
    }

    if (input && (input.trim().length < 10)) {
      return NextResponse.json(
        { error: 'O conteúdo enviado é curto demais. Envie ao menos 10 caracteres.' },
        { status: 400 }
      );
    }

    const titulo = (rawTitulo?.trim() || input.trim().slice(0, 80) || 'Trilha de Estudos') as string;

    // 4. Build prompts + chamar LLM conforme o tipo de entrada
    const systemPrompt = buildSystemPrompt();
    const domainRules = getDomainRules(titulo);

    let rawContent: string | null = null;

    if (pdfBase64) {
      // ── Caminho PDF: document input multimodal do Groq ────────────────────
      const pdfUserContent: (ChatPartText | ChatPartFile)[] = [
        { type: 'text', text: buildUserPrompt('', titulo, domainRules) },
        {
          type: 'file',
          file: {
            filename: 'documento.pdf',
            file_data: `data:application/pdf;base64,${pdfBase64}`,
          },
        },
      ];
      rawContent = await callGroq(systemPrompt, pdfUserContent, apiKey, PDF_MODELS);
      if (!rawContent) {
        return NextResponse.json(
          { error: 'Não foi possível extrair o conteúdo do PDF. Tente um arquivo menor ou cole o texto diretamente.' },
          { status: 502 }
        );
      }
    } else {
      // ── Caminho texto/link: chat padrão ───────────────────────────────────
      rawContent = await callGroq(
        systemPrompt,
        buildUserPrompt(input.trim(), titulo, domainRules),
        apiKey,
        TEXT_MODELS
      );
      if (!rawContent) {
        return NextResponse.json(
          { error: 'Todos os modelos de IA falharam. Tente novamente em instantes.' },
          { status: 502 }
        );
      }
    }

    // 5. JSON extraction + Zod validation
    const trilhaId = `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const StrictSchema = TrilhaSchema.omit({ id: true, progresso: true });

    let parsedRaw: any;
    try {
      parsedRaw = JSON.parse(extractCleanJson(rawContent));
    } catch {
      return NextResponse.json(
        { error: 'A IA retornou um JSON malformado. Tente novamente.' },
        { status: 422 }
      );
    }

    // ── ACOPLAMENTO ZOD (ponto de validação primário) ──────────────────────────
    let zodResult = StrictSchema.safeParse(parsedRaw);

    // 6. Fixer prompt (única retentativa)
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

      const fixedContent = await callGroq(
        buildSystemPrompt(),
        fixerPrompt,
        apiKey,
        TEXT_MODELS,
        0.05
      );

      if (fixedContent) {
        try {
          const fixedRaw = JSON.parse(extractCleanJson(fixedContent));
          // ── ACOPLAMENTO ZOD (validação secundária — pós-fixer) ──────────────
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

    // 7. Assemble final trilha with server-injected fields + hub metadata
    const assembled = injectServerFields(parsedRaw, titulo, trilhaId);
    const finalTrilha = {
      ...assembled,
      sourceType,
      sourceUrl: sourceType === 'youtube' ? input.trim() : undefined,
      isPublic: false, // tenant isolation: geração do usuário é sempre privada
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

    // 8. Persist no D1 — amarrado ao userId, is_public = 0
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
        // Ambiente local sem binding D1 — não bloqueia a resposta ao usuário
        console.warn('[generate] D1_DB binding not available. Skipping persistence (local dev mode).');
      }
    } catch (dbErr: any) {
      // Falha no D1 não bloqueia a resposta: a trilha validada vai para o store no client
      console.error('[generate] D1 insert failed (non-blocking):', dbErr?.message);
    }

    return NextResponse.json(validatedTrilha, { status: 200 });
  } catch (err: any) {
    // ── Catch global: NENHUM erro silencioso ─────────────────────────────────
    console.error('[generate] Unhandled error:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro interno ao gerar a trilha. Tente novamente.' },
      { status: 500 }
    );
  }
}
