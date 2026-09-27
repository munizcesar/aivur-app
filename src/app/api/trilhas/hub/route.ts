import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('aivur_session');
    
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.value;

    const db = (getRequestContext().env as any).D1_DB as D1Database | undefined;

    if (!db) {
      console.warn('[hub] D1_DB binding not found, returning empty arrays.');
      return NextResponse.json({ minhasTrilhas: [], cursosOficiais: [] });
    }

    // Busca as trilhas do usuário atual e os cursos oficiais públicos
    const { results } = await db
      .prepare(`
        SELECT id, titulo, disciplina, source_type, is_public, progress_json, created_at
        FROM trilhas_geradas
        WHERE user_id = ? OR is_public = 1
        ORDER BY created_at DESC
        LIMIT 100
      `)
      .bind(userId)
      .all();

    const minhasTrilhas: any[] = [];
    const cursosOficiais: any[] = [];

    if (results) {
      results.forEach((row: any) => {
        let parsedProgress = {};
        try {
          parsedProgress = JSON.parse(row.progress_json || '{}');
        } catch (e) {
          console.error('[hub] Error parsing progress_json for trilha:', row.id);
        }

        const trilha = {
          id: row.id,
          titulo: row.titulo,
          disciplina: row.disciplina,
          sourceType: row.source_type,
          isPublic: Boolean(row.is_public),
          createdAt: row.created_at,
          ...parsedProgress, // injeta meta-dados de progresso
        };

        if (row.is_public === 1) {
          cursosOficiais.push(trilha);
        } else if (row.user_id === userId || !row.is_public) {
          minhasTrilhas.push(trilha);
        }
      });
    }

    return NextResponse.json({ minhasTrilhas, cursosOficiais });
  } catch (error: any) {
    console.error('[hub] Error fetching trilhas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hub trilhas.', details: error.message },
      { status: 500 }
    );
  }
}
