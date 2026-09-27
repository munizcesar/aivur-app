import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("aivur_session");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = sessionCookie.value;
    const body = await req.json() as { action?: string; payload?: any; updatedAt?: number };
    
    if (!body.action || !body.payload) {
      return NextResponse.json({ error: "Bad Request: action e payload são obrigatórios." }, { status: 400 });
    }

    const db = getRequestContext().env.D1_DB;
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      
      const selectStmt = await db.prepare("SELECT progress_json, updated_at FROM user_progress WHERE user_id = ?").bind(userId).first();
      
      let currentProgress: any = { answered: 0, correct: 0, incorrect: 0, answers: {}, completedTopicIds: [] };
      let currentUpdatedAt = 0;
      let isNew = true;

      if (selectStmt) {
        currentProgress = JSON.parse(selectStmt.progress_json as string);
        currentUpdatedAt = selectStmt.updated_at as number;
        isNew = false;
        if (!currentProgress.completedTopicIds) currentProgress.completedTopicIds = [];
      }
      
      // 1. Processamento Delta
      if (body.action === "REGISTER_ANSWER") {
        const { questionId, isCorrect } = body.payload;
        if (typeof questionId !== 'string' || typeof isCorrect !== 'boolean') {
           return NextResponse.json({ error: "Bad Request: payload inválido para REGISTER_ANSWER." }, { status: 400 });
        }
        
        const previousAnswer = currentProgress.answers[questionId];
        if (previousAnswer === isCorrect) {
           return NextResponse.json({ success: true, message: "No changes needed" }, { status: 200 });
        }
        
        currentProgress.answers[questionId] = isCorrect;
        
        if (previousAnswer !== undefined) {
           currentProgress.correct += (isCorrect ? 1 : -1);
           currentProgress.incorrect += (isCorrect ? -1 : 1);
        } else {
           currentProgress.answered += 1;
           currentProgress.correct += (isCorrect ? 1 : 0);
           currentProgress.incorrect += (isCorrect ? 0 : 1);
        }
      } else if (body.action === "TOGGLE_TOPIC") {
        const { topicId, isCompleted } = body.payload;
        if (typeof topicId !== 'string' || typeof isCompleted !== 'boolean') {
           return NextResponse.json({ error: "Bad Request: payload inválido para TOGGLE_TOPIC." }, { status: 400 });
        }
        
        const hasTopic = currentProgress.completedTopicIds.includes(topicId);
        if (isCompleted && !hasTopic) {
           currentProgress.completedTopicIds.push(topicId);
        } else if (!isCompleted && hasTopic) {
           currentProgress.completedTopicIds = currentProgress.completedTopicIds.filter((id: string) => id !== topicId);
        }
      } else {
        // Tratamento de erro 400 para action desconhecida
        return NextResponse.json({ error: "Bad Request: Action desconhecida." }, { status: 400 });
      }

      const newUpdatedAt = Date.now();
      const newJson = JSON.stringify(currentProgress);

      // 2. Concorrência e Locks (Tratamento Seguro com OCC)
      if (isNew) {
        try {
          await db.prepare("INSERT INTO user_progress (user_id, progress_json, updated_at) VALUES (?, ?, ?)")
            .bind(userId, newJson, newUpdatedAt)
            .run();
          return NextResponse.json({ success: true }, { status: 200 });
        } catch (e: any) {
          // Se falhou por colisão de chave primária, houve concorrência. Retry.
          if (attempt >= maxRetries) throw e;
        }
      } else {
        const updateResult = await db.prepare("UPDATE user_progress SET progress_json = ?, updated_at = ? WHERE user_id = ? AND updated_at = ?")
          .bind(newJson, newUpdatedAt, userId, currentUpdatedAt)
          .run();
        
        if (updateResult.meta.changes === 1) {
          return NextResponse.json({ success: true }, { status: 200 });
        }
        // Se 0 mudanças (changes === 0), o updated_at mudou no meio do caminho. Tentar novamente.
        if (attempt >= maxRetries) {
          return NextResponse.json({ error: "Conflict: Muitas requisições simultâneas. Mutação falhou." }, { status: 409 });
        }
      }
    }
    
  } catch (err: any) {
    console.error("[Sync Push Error]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
