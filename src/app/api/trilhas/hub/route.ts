import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

// ─── Types ────────────────────────────────────────────────────────────────────
interface HubTrilhaDTO {
  id: string;
  titulo: string;
  disciplina: string;
  sourceType: string;
  isPublic: boolean;
  progresso: number;
  createdAt: number;
}

interface HubPayload {
  minhasTrilhas: HubTrilhaDTO[];
  cursosOficiais: HubTrilhaDTO[];
}

/** Payload canônico de fallback — blindagem anti-quebra da tela do Hub. */
function emptyPayload(): HubPayload {
  return { minhasTrilhas: [], cursosOficiais: [] };
}

function mapRow(row: Record<string, unknown>): HubTrilhaDTO {
  let progresso = 0;
  try {
    const parsed = JSON.parse(String(row.progress_json ?? '{}')) as { progresso?: number };
    progresso = typeof parsed?.progresso === 'number' ? parsed.progresso : 0;
  } catch {
    progresso = 0;
  }
  return {
    id: String(row.id ?? ''),
    titulo: String(row.titulo ?? 'Trilha sem título'),
    disciplina: String(row.disciplina ?? 'Geral'),
    sourceType: String(row.source_type ?? 'system'),
    isPublic: Number(row.is_public) === 1,
    progresso,
    createdAt: Number(row.created_at ?? 0),
  };
}

// ─── GET /api/trilhas/hub ─────────────────────────────────────────────────────
export async function GET() {
  try {
    // ── Auth guard — payload vazio em vez de 401 (blindagem anti-quebra) ──────
    const cookieStore = await cookies();
    const session = cookieStore.get('aivur_session');
    if (!session?.value) {
      return NextResponse.json<HubPayload>(emptyPayload(), { status: 200 });
    }
    const userId = session.value;

    const db = (getRequestContext().env as any).D1_DB as D1Database | undefined;
    if (!db) {
      console.warn('[hub] D1_DB binding not found, returning empty arrays.');
      return NextResponse.json<HubPayload>(emptyPayload(), { status: 200 });
    }

    // ── Query com isolamento de tenant: trilhas do usuário + cursos públicos ──
    const { results } = await db
      .prepare(`
        SELECT id, titulo, disciplina, source_type, is_public, progress_json, created_at
        FROM trilhas_geradas
        WHERE user_id = ? OR is_public = 1
        ORDER BY is_public ASC, created_at DESC
        LIMIT 100
      `)
      .bind(userId)
      .all();

    const minhasTrilhas: HubTrilhaDTO[] = [];
    const cursosOficiais: HubTrilhaDTO[] = [];

    for (const row of (results ?? []) as Record<string, unknown>[]) {
      const dto = mapRow(row);
      if (row.is_public === 1) {
        cursosOficiais.push(dto);
      } else {
        minhasTrilhas.push(dto);
      }
    }

    return NextResponse.json<HubPayload>({ minhasTrilhas, cursosOficiais }, { status: 200 });
  } catch (error) {
    // ── Blindagem anti-quebra: qualquer falha → arrays vazios com 200 ────────
    console.error('[hub] Query failed, falling back to empty payload:', error);
    return NextResponse.json<HubPayload>(emptyPayload(), { status: 200 });
  }
}
