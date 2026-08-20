export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { RAGChunker } from '@/lib/rag/chunker';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token Bearer ausente ou inválido' }, { status: 401 });
    }

    let env: any;
    try {
      env = process.env.NODE_ENV === 'development' ? process.env : getRequestContext()?.env;
    } catch (e) {
      env = process.env;
    }

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
    const chunks = RAGChunker.splitLegislation(text, { maxTokens: 400 }); // bge-base lida melhor com max 512
    
    const ai = env?.AI;
    const vectorize = env?.VECTORIZE;
    const db = env?.D1_DB;

    if (!ai || !vectorize || !db) {
      return NextResponse.json({ error: 'Bindings (AI, VECTORIZE, D1_DB) ausentes no ambiente.' }, { status: 500 });
    }

    // 2. Geração de Embeddings
    // @cf/baai/bge-base-en-v1.5 é indicado no prompt do usuário
    const embeddingsResponse = await ai.run('@cf/baai/bge-base-en-v1.5', {
      text: chunks
    });

    const vectorsToUpsert = [];
    const dbRowsToInsert = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = crypto.randomUUID();
      const chunkText = chunks[i];
      const vector = embeddingsResponse.data[i]; 

      // Payload para Vectorize
      vectorsToUpsert.push({
        id: chunkId,
        values: vector,
        metadata: { curso, disciplina, municipio, tipo_fonte, banca }
      });

      // Payload para D1
      dbRowsToInsert.push({ chunkId, chunkText, curso, disciplina, municipio, tipo_fonte, banca });
    }

    // 3. Salvar metadados e texto original no D1 (Filtro Híbrido)
    const insertStmt = db.prepare(`
      INSERT INTO documents (id, text, curso, disciplina, municipio, tipo_fonte, banca) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const batchStmts = dbRowsToInsert.map(row => 
      insertStmt.bind(row.chunkId, row.chunkText, row.curso, row.disciplina, row.municipio, row.tipo_fonte, row.banca)
    );
    await db.batch(batchStmts);

    // 4. Upsert no Vectorize
    const vectorizeResult = await vectorize.upsert(vectorsToUpsert);

    return NextResponse.json({
      message: 'Pipeline de ingestão concluída com sucesso',
      chunksProcessed: chunks.length,
      vectorizeResult
    });

  } catch (error: any) {
    console.error('[Ingest API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
