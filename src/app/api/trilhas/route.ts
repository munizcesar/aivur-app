import { getRequestContext } from '@cloudflare/next-on-pages';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Trilha, TrilhaFlashcard, TrilhaQuestao } from '@/mocks/trilhasMock';
import { TrilhaSchema } from '@/lib/validations/trilha';

export const runtime = 'edge';

interface TrilhaRow {
  id: string;
  user_id: string;
  titulo: string;
  disciplina: string;
  video_youtube_id: string;
  video_titulo: string;
  video_resumo: string;
  video_resumo_markdown: string | null;
  criado_em: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('aivur_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Sessão ausente ou inválida' },
        { status: 401 }
      );
    }

    const userId = sessionCookie.value.trim();
    if (!userId) {
      return NextResponse.json(
        { error: 'Sessão ausente ou inválida' },
        { status: 401 }
      );
    }

    const env = getRequestContext().env;
    const db = env.D1_DB || env.DB;

    if (!db) {
      console.error('[API /api/trilhas] D1 database binding not found');
      return NextResponse.json(
        { error: 'Erro interno no servidor' },
        { status: 500 }
      );
    }

    const trilhasQuery = `
      SELECT
        id,
        user_id,
        titulo,
        disciplina,
        video_youtube_id,
        video_titulo,
        video_resumo,
        video_resumo_markdown,
        criado_em
      FROM trilhas
      WHERE user_id = ?
      ORDER BY criado_em DESC
    `;

    const trilhasStmt = db.prepare(trilhasQuery).bind(userId);
    const trilhasResult = await trilhasStmt.all<TrilhaRow>();

    if (!trilhasResult.success) {
      console.error('[API /api/trilhas] Falha ao consultar trilhas:', trilhasResult.error);
      return NextResponse.json(
        { error: 'Erro interno no servidor' },
        { status: 500 }
      );
    }

    const trilhasRows = trilhasResult.results || [];
    if (trilhasRows.length === 0) {
      return NextResponse.json({ trilhas: [] }, { status: 200 });
    }

    const statements = [];
    for (const row of trilhasRows) {
      statements.push(
        db.prepare('SELECT id, frente, verso FROM trilha_flashcards WHERE trilha_id = ?').bind(row.id)
      );
      statements.push(
        db.prepare('SELECT id, enunciado, opcoes, correta_idx, justificativa, tipo_questao FROM trilha_questoes WHERE trilha_id = ?').bind(row.id)
      );
    }

    const batchResults = await db.batch(statements);

    const trilhas: Trilha[] = trilhasRows.map((row, index) => {
      const flashcardsRes = batchResults[index * 2];
      const questoesRes = batchResults[index * 2 + 1];

      const flashcards: TrilhaFlashcard[] = ((flashcardsRes?.results as any[]) || []).map((fc) => ({
        id: String(fc.id),
        frente: String(fc.frente ?? ''),
        verso: String(fc.verso ?? ''),
      }));

      const questoes: TrilhaQuestao[] = ((questoesRes?.results as any[]) || []).map((q) => {
        let opcoes: string[] = [];
        try {
          if (typeof q.opcoes === 'string') {
            opcoes = JSON.parse(q.opcoes);
          } else if (Array.isArray(q.opcoes)) {
            opcoes = q.opcoes;
          }
        } catch {
          opcoes = [];
        }

        return {
          id: String(q.id),
          enunciado: String(q.enunciado ?? ''),
          opcoes,
          corretaIdx: typeof q.correta_idx === 'number' ? q.correta_idx : parseInt(String(q.correta_idx || 0), 10),
          justificativa: String(q.justificativa ?? ''),
          tipo_questao: q.tipo_questao === 'CERTO_ERRADO' ? 'CERTO_ERRADO' : 'MULTIPLA_ESCOLHA',
        };
      });

      return {
        id: String(row.id),
        titulo: String(row.titulo ?? ''),
        disciplina: String(row.disciplina ?? ''),
        progresso: 0,
        video: {
          youtubeId: String(row.video_youtube_id ?? ''),
          titulo: String(row.video_titulo ?? ''),
          resumo: String(row.video_resumo ?? ''),
          resumo_markdown: row.video_resumo_markdown ? String(row.video_resumo_markdown) : undefined,
        },
        flashcards,
        questoes,
      };
    });

    return NextResponse.json({ trilhas }, { status: 200 });
  } catch (error) {
    console.error('[API /api/trilhas] Erro não tratado:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('aivur_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Sessão ausente ou inválida' }, { status: 401 });
    }

    const userId = sessionCookie.value.trim();
    if (!userId) {
      return NextResponse.json({ error: 'Sessão ausente ou inválida' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
    }

    const validation = TrilhaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.format() }, { status: 400 });
    }

    const data = validation.data;
    const env = getRequestContext().env;
    const db = env.D1_DB || env.DB;

    if (!db) {
      console.error('[API /api/trilhas POST] D1 database binding not found');
      return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }

    // Força a geração de um novo ID no servidor.
    // Ignora completamente o ID enviado pelo cliente para evitar colisões e 
    // reutilização de IDs do mock/Zustand.
    const trilhaId = crypto.randomUUID();

    const statements = [];

    statements.push(
      db.prepare(`
        INSERT INTO trilhas (
          id, user_id, titulo, disciplina, video_youtube_id, video_titulo, video_resumo, video_resumo_markdown
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        trilhaId,
        userId,
        data.titulo,
        data.disciplina,
        data.video.youtubeId || '',
        data.video.titulo,
        data.video.resumo,
        data.video.resumo_markdown || null
      )
    );

    const finalFlashcards: TrilhaFlashcard[] = data.flashcards.map((fc) => {
      // Força novo ID pelo servidor para flashcards
      const fcId = crypto.randomUUID();
      statements.push(
        db.prepare(`
          INSERT INTO trilha_flashcards (id, trilha_id, frente, verso)
          VALUES (?, ?, ?, ?)
        `).bind(fcId, trilhaId, fc.frente, fc.verso)
      );
      return { id: fcId, frente: fc.frente, verso: fc.verso };
    });

    const finalQuestoes: TrilhaQuestao[] = data.questoes.map((q) => {
      // Força novo ID pelo servidor para questões
      const qId = crypto.randomUUID();
      const tipoQuestao = q.tipo_questao === 'CERTO_ERRADO' ? 'CERTO_ERRADO' : 'MULTIPLA_ESCOLHA';
      
      let corretaIdx = 0;
      let opcoes: string[] = [];
      
      if (q.tipo_questao === 'CERTO_ERRADO') {
         corretaIdx = q.gabarito === 'CERTO' ? 0 : 1;
         opcoes = ['CERTO', 'ERRADO'];
      } else {
         corretaIdx = q.corretaIdx;
         opcoes = q.opcoes;
      }

      statements.push(
        db.prepare(`
          INSERT INTO trilha_questoes (
            id, trilha_id, enunciado, opcoes, correta_idx, justificativa, tipo_questao
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(qId, trilhaId, q.enunciado, JSON.stringify(opcoes), corretaIdx, q.justificativa, tipoQuestao)
      );

      return {
        id: qId,
        enunciado: q.enunciado,
        opcoes,
        corretaIdx,
        justificativa: q.justificativa,
        tipo_questao: tipoQuestao
      };
    });

    const batchResults = await db.batch(statements);
    
    // Validando retorno do batch
    for (const res of batchResults) {
      if (!res.success) {
        throw new Error('Falha na transação D1');
      }
    }

    const trilhaRespondida: Trilha = {
      id: trilhaId,
      titulo: data.titulo,
      disciplina: data.disciplina,
      progresso: 0,
      video: {
        youtubeId: data.video.youtubeId || '',
        titulo: data.video.titulo,
        resumo: data.video.resumo,
        resumo_markdown: data.video.resumo_markdown,
      },
      flashcards: finalFlashcards,
      questoes: finalQuestoes,
    };

    return NextResponse.json({ trilha: trilhaRespondida }, { status: 201 });
  } catch (error) {
    console.error('[API /api/trilhas POST] Erro não tratado:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
