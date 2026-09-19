import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const topicoId = searchParams.get('topicoId');
    const excludeIdsParam = searchParams.get('excludeIds'); // Opcional, ids separados por vírgula
    const limitParam = searchParams.get('limit') || '10';

    if (!topicoId) {
      return NextResponse.json({ error: 'topicoId é obrigatório' }, { status: 400 });
    }

    const limit = parseInt(limitParam, 10);
    if (isNaN(limit) || limit <= 0 || limit > 50) {
      return NextResponse.json({ error: 'limit inválido' }, { status: 400 });
    }

    const db = getRequestContext().env.DB;

    // Se houver ids para excluir, montamos a query dinamicamente
    let query = 'SELECT * FROM questoes WHERE topico_id = ?';
    const params: any[] = [topicoId];

    if (excludeIdsParam) {
      const excludeIds = excludeIdsParam.split(',').map((id) => id.trim()).filter(Boolean);
      if (excludeIds.length > 0) {
        const placeholders = excludeIds.map(() => '?').join(',');
        query += ` AND id NOT IN (${placeholders})`;
        params.push(...excludeIds);
      }
    }

    // Ordenar de forma aleatória ou pela prioridade (vamos fazer aleatório por enquanto ou por data)
    // Para SQLite, ORDER BY RANDOM() funciona
    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query).bind(...params);
    const result = await stmt.all();

    if (!result.success) {
      console.error('Erro na query D1:', result.error);
      return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 });
    }

    return NextResponse.json({ questoes: result.results }, { status: 200 });

  } catch (error) {
    console.error('Erro na rota de questões:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
