export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Função auxiliar para injetar as bindings
function resolveEnv(): any {
  try {
    const ctx = getRequestContext();
    if (ctx?.env) {
      return ctx.env;
    }
  } catch (_) {}
  const g = globalThis as any;
  if (g.AI || g.VECTORIZE || g.D1_DB) {
    return {
      AI:        g.AI,
      VECTORIZE: g.VECTORIZE,
      D1_DB:     g.D1_DB,
      ADMIN_SECRET: g.ADMIN_SECRET,
    };
  }
  return process.env;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Parâmetro de busca ?q= é obrigatório' }, { status: 400 });
    }

    const env = resolveEnv();
    const ai = env?.AI || env?.ai;
    const vectorize = env?.VECTORIZE || env?.vectorize;
    const db = env?.D1_DB || env?.d1_db || env?.DB || env?.D1;

    if (!ai || !vectorize || !db) {
      return NextResponse.json(
        { error: 'Bindings ausentes (AI, VECTORIZE ou D1_DB)' },
        { status: 500 }
      );
    }

    // 1. Gera o vetor para a string de busca
    const embeddingsResponse = await ai.run('@cf/baai/bge-base-en-v1.5', {
      text: [query],
    });

    const queryVector = embeddingsResponse.data[0];

    // 2. Busca os Top 3 vetores mais próximos no Vectorize
    const vectorizeResults = await vectorize.query(queryVector, { topK: 3 });

    if (!vectorizeResults.matches || vectorizeResults.matches.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const matchIds = vectorizeResults.matches.map((match: any) => match.id);

    // 3. Resgata os textos e metadados no D1 usando os IDs
    // O D1 suporta parâmetros binding seguros (?) no IN usando json_each ou injetando os ? dinamicamente.
    const placeholders = matchIds.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT id, text, curso, disciplina, municipio, tipo_fonte, banca
      FROM documents 
      WHERE id IN (${placeholders})
    `);

    // Binding dos parâmetros (spread da lista de IDs)
    const { results: dbRows } = await stmt.bind(...matchIds).all();

    // 4. Consolida e mescla os resultados (D1 + Vectorize Score)
    const consolidatedResults = vectorizeResults.matches.map((match: any) => {
      const dbInfo = dbRows.find((row: any) => row.id === match.id) || {};
      return {
        id: match.id,
        score: match.score,
        text: dbInfo.text,
        curso: dbInfo.curso,
        disciplina: dbInfo.disciplina,
        municipio: dbInfo.municipio,
        tipo_fonte: dbInfo.tipo_fonte,
        banca: dbInfo.banca,
      };
    });

    return NextResponse.json({
      query,
      results: consolidatedResults,
    });

  } catch (error: any) {
    console.error('[Search API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
