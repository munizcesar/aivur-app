import { getRequestContext } from "@cloudflare/next-on-pages";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/session";
import type { JornadaDB, JornadaTopicoDB } from "@/lib/validations/jornada";

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
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

    const jornadaStmt = db
      .prepare("SELECT * FROM jornadas WHERE id = ? AND user_id = ?")
      .bind(id, userId);
    const jornada = await jornadaStmt.first<JornadaDB>();

    if (!jornada) {
      return NextResponse.json(
        { error: "Jornada não encontrada ou acesso negado." },
        { status: 404 }
      );
    }

    const topicosStmt = db
      .prepare(`
        SELECT * FROM jornada_topicos
        WHERE jornada_id = ?
        ORDER BY ordem_global ASC
      `)
      .bind(id);
    const topicosRes = await topicosStmt.all<JornadaTopicoDB>();
    const topicos = topicosRes.results || [];

    const total = topicos.length;
    const concluidos = topicos.filter((t) => t.status === "concluido").length;
    const progresso_geral = total > 0 ? Math.round((concluidos * 100) / total) : 0;

    return NextResponse.json(
      {
        jornada: {
          ...jornada,
          progresso_geral,
          topicos,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API /api/jornadas/[id] GET] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
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

    const verifyStmt = db
      .prepare("SELECT id FROM jornadas WHERE id = ? AND user_id = ?")
      .bind(id, userId);
    const exists = await verifyStmt.first();

    if (!exists) {
      return NextResponse.json(
        { error: "Jornada não encontrada ou acesso negado." },
        { status: 404 }
      );
    }

    // ON DELETE CASCADE limpa automaticamente os jornada_topicos
    await db
      .prepare("DELETE FROM jornadas WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .run();

    return NextResponse.json(
      { success: true, message: "Jornada excluída com sucesso." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API /api/jornadas/[id] DELETE] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir jornada." },
      { status: 500 }
    );
  }
}
