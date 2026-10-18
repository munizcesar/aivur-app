import { getRequestContext } from "@cloudflare/next-on-pages";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/session";
import { CriarJornadaRequestSchema } from "@/lib/validations/jornada";

export const runtime = "edge";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("aivur_session");

    const session = await verifySessionCookie(sessionCookie?.value);
    if (!session.valid) {
      return NextResponse.json(
        { error: "Sessão ausente ou inválida. Faça login para continuar." },
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

    const query = `
      SELECT
        j.id,
        j.user_id,
        j.titulo_concurso,
        j.banca,
        j.ano,
        j.cargo,
        j.edital_fonte_tipo,
        j.edital_nome_arquivo,
        j.doc_original_hash,
        j.ementa_hash,
        j.versao,
        j.criado_em,
        j.atualizado_em,
        COUNT(t.id) as total_topicos,
        COUNT(CASE WHEN t.status = 'concluido' THEN 1 END) as concluidos_count
      FROM jornadas j
      LEFT JOIN jornada_topicos t ON t.jornada_id = j.id
      WHERE j.user_id = ?
      GROUP BY j.id
      ORDER BY j.criado_em DESC
    `;

    const stmt = db.prepare(query).bind(userId);
    const result = await stmt.all<any>();

    const jornadas = (result.results || []).map((row) => {
      const total = Number(row.total_topicos || 0);
      const concluidos = Number(row.concluidos_count || 0);
      const progresso_geral = total > 0 ? Math.round((concluidos * 100) / total) : 0;

      return {
        id: row.id,
        user_id: row.user_id,
        titulo_concurso: row.titulo_concurso,
        banca: row.banca,
        ano: row.ano,
        cargo: row.cargo,
        edital_fonte_tipo: row.edital_fonte_tipo,
        edital_nome_arquivo: row.edital_nome_arquivo,
        doc_original_hash: row.doc_original_hash,
        ementa_hash: row.ementa_hash,
        versao: row.versao,
        criado_em: row.criado_em,
        atualizado_em: row.atualizado_em,
        total_topicos: total,
        concluidos_count: concluidos,
        progresso_geral,
      };
    });

    return NextResponse.json({ jornadas }, { status: 200 });
  } catch (error: any) {
    console.error("[API /api/jornadas GET] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar jornadas." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("aivur_session");

    const session = await verifySessionCookie(sessionCookie?.value);
    if (!session.valid) {
      return NextResponse.json(
        { error: "Sessão ausente ou inválida. Faça login para continuar." },
        { status: 401 }
      );
    }

    const userId = session.userId;

    let bodyJson: unknown;
    try {
      bodyJson = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Payload JSON malformado." },
        { status: 400 }
      );
    }

    const parseResult = CriarJornadaRequestSchema.safeParse(bodyJson);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Dados de jornada inválidos.",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const env = getRequestContext().env;
    const db = env.D1_DB || env.DB;

    if (!db) {
      return NextResponse.json(
        { error: "Banco de dados indisponível." },
        { status: 500 }
      );
    }

    // 1. Verificação de idempotência por ementa_hash
    const existingStmt = db
      .prepare("SELECT id FROM jornadas WHERE user_id = ? AND ementa_hash = ?")
      .bind(userId, data.ementa_hash);
    const existing = await existingStmt.first<{ id: string }>();

    if (existing?.id) {
      return NextResponse.json(
        {
          id: existing.id,
          message: "Jornada já existente para esta ementa. Redirecionando.",
          is_existing: true,
          reused: true,
        },
        { status: 200 }
      );
    }

    // 2. Criação transacional em batch
    const jornadaId = crypto.randomUUID();
    const statements: any[] = [];

    statements.push(
      db
        .prepare(`
          INSERT INTO jornadas (
            id, user_id, titulo_concurso, banca, ano, cargo,
            edital_fonte_tipo, edital_nome_arquivo, doc_original_hash, ementa_hash, versao
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `)
        .bind(
          jornadaId,
          userId,
          data.titulo_concurso,
          data.banca || null,
          data.ano || null,
          data.cargo || null,
          data.edital_fonte_tipo,
          data.edital_nome_arquivo || null,
          data.doc_original_hash,
          data.ementa_hash
        )
    );

    let ordemGlobal = 1;
    for (let dIdx = 0; dIdx < data.disciplinas.length; dIdx++) {
      const disc = data.disciplinas[dIdx];
      for (let tIdx = 0; tIdx < disc.topicos.length; tIdx++) {
        const topico = disc.topicos[tIdx];
        const topicoId = crypto.randomUUID();

        statements.push(
          db
            .prepare(`
              INSERT INTO jornada_topicos (
                id, jornada_id, disciplina, ordem_disciplina,
                titulo_topico, ordem_global, edital_item_ref, status, progresso
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', 0)
            `)
            .bind(
              topicoId,
              jornadaId,
              disc.nome,
              tIdx + 1,
              topico.titulo,
              ordemGlobal,
              topico.edital_item_ref || null
            )
        );
        ordemGlobal++;
      }
    }

    const batchResults = await db.batch(statements);
    for (const res of batchResults) {
      if (!res.success) {
        throw new Error("Falha na transação batch de persistência da jornada.");
      }
    }

    return NextResponse.json(
      {
        id: jornadaId,
        titulo_concurso: data.titulo_concurso,
        total_topicos: ordemGlobal - 1,
        success: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API /api/jornadas POST] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar jornada." },
      { status: 500 }
    );
  }
}
