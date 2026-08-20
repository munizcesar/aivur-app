export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { RAGChunker } from '@/lib/rag/chunker';

// Resolução robusta de bindings para Cloudflare Pages (Edge Runtime)
// A ordem de prioridade é: getRequestContext() → globalThis → process.env
function resolveEnv(): any {
  // 1ª tentativa: contexto oficial do next-on-pages (produção Pages)
  try {
    const ctx = getRequestContext();
    if (ctx?.env && (ctx.env as any).AI) {
      return ctx.env;
    }
  } catch (_) {
    // ignora se não estiver disponível
  }

  // 2ª tentativa: bindings injetados diretamente no globalThis pelo runtime Cloudflare
  // Em Workers/Pages, o globalThis é enriquecido com os bindings definidos no wrangler.toml
  const g = globalThis as any;
  if (g.AI || g.VECTORIZE || g.D1_DB) {
    return {
      AI:        g.AI,
      VECTORIZE: g.VECTORIZE,
      D1_DB:     g.D1_DB,
      ADMIN_SECRET: g.ADMIN_SECRET,
    };
  }

  // 3ª tentativa: process.env (dev local ou fallback)
  return process.env;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token Bearer ausente ou inválido' }, { status: 401 });
    }

    const env = resolveEnv();

    const token = authHeader.split(' ')[1];
    const adminSecret = env?.ADMIN_SECRET || 'aivur-admin-secret-local';

    if (token !== adminSecret) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const { text, curso, disciplina, municipio, tipo_fonte, banca } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texto para ingestão ausente' }, { status: 400 });
    }

    // 1. Fatiamento inteligente
    const chunks = RAGChunker.splitLegislation(text, { maxTokens: 400 });

    const ai = env?.AI;
    const vectorize = env?.VECTORIZE;
    const db = env?.D1_DB;

    // Diagnóstico detalhado — visível nos logs da Cloudflare para debug
    if (!ai || !vectorize || !db) {
      const missing = [
        !ai        && 'AI',
        !vectorize && 'VECTORIZE',
        !db        && 'D1_DB',
      ].filter(Boolean).join(', ');

      console.error(`[Ingest] Bindings ausentes: ${missing}. env keys: ${Object.keys(env || {}).join(', ')}`);
      return NextResponse.json(
        { error: `Bindings ausentes: ${missing}. Verifique o painel do Cloudflare Pages > Settings > Bindings.` },
        { status: 500 }
      );
    }

    // 2. Geração de Embeddings via Workers AI
    const embeddingsResponse = await ai.run('@cf/baai/bge-base-en-v1.5', {
      text: chunks,
    });

    const vectorsToUpsert: any[] = [];
    const dbRowsToInsert: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = crypto.randomUUID();
      const chunkText = chunks[i];
      const vector = embeddingsResponse.data[i];

      vectorsToUpsert.push({
        id: chunkId,
        values: vector,
        metadata: { curso, disciplina, municipio, tipo_fonte, banca },
      });

      dbRowsToInsert.push({ chunkId, chunkText, curso, disciplina, municipio, tipo_fonte, banca });
    }

    // 3. Salvar metadados no D1 (Filtro Híbrido)
    const insertStmt = db.prepare(`
      INSERT INTO documents (id, text, curso, disciplina, municipio, tipo_fonte, banca)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const batchStmts = dbRowsToInsert.map((row: any) =>
      insertStmt.bind(row.chunkId, row.chunkText, row.curso, row.disciplina, row.municipio, row.tipo_fonte, row.banca)
    );
    await db.batch(batchStmts);

    // 4. Upsert no Vectorize
    const vectorizeResult = await vectorize.upsert(vectorsToUpsert);

    return NextResponse.json({
      message: 'Pipeline de ingestão concluída com sucesso',
      chunksProcessed: chunks.length,
      vectorizeResult,
    });

  } catch (error: any) {
    console.error('[Ingest API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
