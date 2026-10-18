import { getRequestContext } from "@cloudflare/next-on-pages";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/session";

export const runtime = "edge";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; topicoId: string }> }
) {
  try {
    const { id: jornadaId, topicoId } = await params;
    if (!jornadaId || !topicoId) {
      return NextResponse.json({ error: "IDs inválidos." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("aivur_session");

    const session = await verifySessionCookie(sessionCookie?.value);
    if (!session.valid) {
      return NextResponse.json(
        { error: "Sessão ausente ou inválida." },
        { status: 401 }
      );
    }

    const userId = session.userId;
    const env = getRequestContext().env;
    const db = env.D1_DB || env.DB;

    if (!db) {
      return NextResponse.json(
        { error: "Banco de dados indisponível." },
        { status: 500 }
      );
    }

    // 1. Validação estrita de propriedade anti-IDOR
    const verifyQuery = `
      SELECT t.id, t.ordem_global
      FROM jornada_topicos t
      JOIN jornadas j ON j.id = t.jornada_id
      WHERE t.id = ? AND t.jornada_id = ? AND j.user_id = ?
    `;

    const topico = await db
      .prepare(verifyQuery)
      .bind(topicoId, jornadaId, userId)
      .first<{ id: string; ordem_global: number }>();

    if (!topico) {
      return NextResponse.json(
        { error: "Tópico não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    // 2. Evento explícito de conclusão persistida
    await db
      .prepare(`
        UPDATE jornada_topicos
        SET
          status = 'concluido',
          progresso = 100,
          concluido_em = datetime('now')
        WHERE id = ? AND jornada_id = ?
      `)
      .bind(topicoId, jornadaId)
      .run();

    // 3. Recálculo consistente do progresso da jornada
    const countQuery = `
      SELECT
        COUNT(id) as total,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as concluidos
      FROM jornada_topicos
      WHERE jornada_id = ?
    `;
    const counts = await db
      .prepare(countQuery)
      .bind(jornadaId)
      .first<{ total: number; concluidos: number }>();

    const total = counts?.total || 1;
    const concluidos = counts?.concluidos || 1;
    const progresso_geral = Math.round((concluidos * 100) / total);

    // 4. Determinação do próximo tópico pendente (algoritmo linear de recomendação)
    const nextTopicQuery = `
      SELECT id, titulo_topico, disciplina, ordem_global
      FROM jornada_topicos
      WHERE jornada_id = ? AND status != 'concluido'
      ORDER BY ordem_global ASC
      LIMIT 1
    `;
    const proximoTopico = await db
      .prepare(nextTopicQuery)
      .bind(jornadaId)
      .first<{
        id: string;
        titulo_topico: string;
        disciplina: string;
        ordem_global: number;
      }>();

    return NextResponse.json(
      {
        success: true,
        status: "concluido",
        topico_id: topicoId,
        progresso_geral,
        concluido: true,
        proximo_topico: proximoTopico || null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API /api/jornadas/.../concluir] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao concluir tópico." },
      { status: 500 }
    );
  }
}
