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

    // 1. Validação estrita da propriedade e existência antes de qualquer inserção
    const verifyQuery = `
      SELECT
        t.id,
        t.jornada_id,
        t.disciplina,
        t.titulo_topico,
        t.trilha_id,
        t.status
      FROM jornada_topicos t
      JOIN jornadas j ON j.id = t.jornada_id
      WHERE t.id = ? AND t.jornada_id = ? AND j.user_id = ?
    `;

    const topico = await db
      .prepare(verifyQuery)
      .bind(topicoId, jornadaId, userId)
      .first<{
        id: string;
        jornada_id: string;
        disciplina: string;
        titulo_topico: string;
        trilha_id?: string | null;
        status: string;
      }>();

    if (!topico) {
      return NextResponse.json(
        { error: "Tópico não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    // 2. Se já existe trilha associada, retorna imediatamente sem duplicar
    if (topico.trilha_id) {
      return NextResponse.json(
        {
          trilha_id: topico.trilha_id,
          status: topico.status,
          success: true,
          reused: true,
        },
        { status: 200 }
      );
    }

    // 3. Identificador estável determinístico para convergir chamadas concorrentes
    const targetTrilhaId = `trilha_${topicoId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30)}`;

    // 4. Operação atômica em batch no D1:
    // - Cria o stub em trilhas com INSERT OR IGNORE (sem colisão mesmo com chamadas simultâneas)
    // - Atualiza o tópico de forma idempotente
    const statements = [
      db
        .prepare(`
          INSERT OR IGNORE INTO trilhas (
            id, user_id, titulo, disciplina, video_youtube_id, video_titulo, video_resumo, video_resumo_markdown
          ) VALUES (?, ?, ?, ?, '', ?, 'Conteúdo pedagógico em preparação', NULL)
        `)
        .bind(
          targetTrilhaId,
          userId,
          topico.titulo_topico,
          topico.disciplina,
          `Aula: ${topico.titulo_topico}`
        ),
      db
        .prepare(`
          UPDATE jornada_topicos
          SET
            trilha_id = ?,
            status = CASE WHEN status = 'pendente' THEN 'em_andamento' ELSE status END
          WHERE id = ? AND jornada_id = ? AND (trilha_id IS NULL OR trilha_id = ?)
        `)
        .bind(targetTrilhaId, topicoId, jornadaId, targetTrilhaId),
    ];

    await db.batch(statements);

    // Consulta final para confirmar o ID consolidado (garante convergência sob concorrência extrema)
    const consolidated = await db
      .prepare("SELECT trilha_id, status FROM jornada_topicos WHERE id = ?")
      .bind(topicoId)
      .first<{ trilha_id: string; status: string }>();

    if (!consolidated || !consolidated.trilha_id) {
      return NextResponse.json(
        { error: "Tópico não encontrado ou vínculo não persistido." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        trilha_id: consolidated.trilha_id,
        status: consolidated.status,
        success: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API /api/jornadas/.../iniciar] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao iniciar tópico." },
      { status: 500 }
    );
  }
}
