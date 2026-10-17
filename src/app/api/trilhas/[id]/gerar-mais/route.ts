import { getRequestContext } from '@cloudflare/next-on-pages';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { extractCleanJson } from '@/lib/ai-protocols';
import { verifySessionCookie } from '@/lib/session';

export const runtime = 'edge';

function resolveEnv(): any {
  try {
    const ctx = getRequestContext();
    if (ctx?.env) return ctx.env;
  } catch (_) {}
  const g = globalThis as any;
  if (g.GROQ_API_KEY) return g;
  return process.env;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('aivur_session');

    const session = await verifySessionCookie(sessionCookie?.value);
    if (!session.valid) {
      return NextResponse.json({ error: 'Sessão ausente ou inválida' }, { status: 401 });
    }

    const userId = session.userId;

    const env = resolveEnv();
    const apiKey = env.GROQ_API_KEY || env.GROQ_API_KEY_2 || env.GROQ_API_KEY_3 || env.GROQ_API_KEY_FALLBACK;
    
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY não configurada no ambiente." }, { status: 401 });
    }

    const db = env.D1_DB || env.DB;
    if (!db) {
      return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }

    const verifyStmt = db.prepare('SELECT id, titulo, disciplina, video_resumo_markdown FROM trilhas WHERE id = ? AND user_id = ?').bind(id, userId);
    const trilha = await verifyStmt.first() as any;
    if (!trilha) {
      return NextResponse.json({ error: 'Trilha não encontrada ou acesso negado' }, { status: 404 });
    }

    const body = await request.json() as any;
    const { tipo } = body; // 'flashcards' | 'questoes' | 'resumo'
    if (tipo !== 'flashcards' && tipo !== 'questoes' && tipo !== 'resumo') {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    let prompt = '';
    if (tipo === 'resumo') {
      prompt = `Você é um tutor especialista.\nO aluno quer gerar o resumo teórico estruturado em markdown para a trilha: "${trilha.titulo}".\nDisciplina: ${trilha.disciplina}\n\nVocê deve gerar um JSON contendo:\n- 'resumo': um resumo curto de 1 frase.\n- 'resumo_markdown': um resumo farto, didático e estruturado em markdown com subtópicos, listas e conceitos-chave da matéria.\n\nSchema esperado:\n{\n  "resumo": "string",\n  "resumo_markdown": "string"\n}\n`;
    } else {
      // Obter as questões ou flashcards atuais para usar como contexto negativo (evitar repetição)
      let contextoExistente = '';
      if (tipo === 'flashcards') {
        const fcStmt = db.prepare('SELECT frente FROM trilha_flashcards WHERE trilha_id = ?').bind(id);
        const fcRes = await fcStmt.all();
        if (fcRes.success && fcRes.results.length > 0) {
          contextoExistente = '\nFlashcards já existentes (NÃO REPITA ESTES):\n' + fcRes.results.map((r: any) => '- ' + r.frente).join('\n');
        }
      } else {
        const qStmt = db.prepare('SELECT enunciado FROM trilha_questoes WHERE trilha_id = ?').bind(id);
        const qRes = await qStmt.all();
        if (qRes.success && qRes.results.length > 0) {
          contextoExistente = '\nQuestões já existentes (NÃO REPITA ESTAS):\n' + qRes.results.map((r: any) => '- ' + r.enunciado).join('\n');
        }
      }

      prompt = `Você é um tutor especialista.\nO aluno quer gerar ${tipo} sobre a trilha: "${trilha.titulo}".\nDisciplina: ${trilha.disciplina}\nContexto Base (resumo):\n${trilha.video_resumo_markdown || ""}\n${contextoExistente}\n\n`;

      if (tipo === 'flashcards') {
        prompt += `Você deve gerar um JSON contendo MAIS 3 novos flashcards.\nSchema esperado:\n{ "flashcards": [ { "frente": "string", "verso": "string" } ] }\n`;
      } else {
        prompt += `Você deve gerar um JSON contendo MAIS 3 novas questões de múltipla escolha.\nSchema esperado:\n{ "questoes": [ { "enunciado": "string", "opcoes": ["string", "string", "string", "string"], "corretaIdx": 0, "justificativa": "string" } ] }\n`;
      }
    }

    const messages = [
      { role: "system", content: "You are a JSON assistant. Output valid JSON only. Do not wrap with markdown code blocks." },
      { role: "user", content: prompt }
    ];

    const fallbackModels = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"];
    let groqResponse;

    for (const modelId of fallbackModels) {
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages,
          temperature: 0.3,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        })
      });

      if (groqResponse.ok) {
        break;
      }

      // Se for rate limit (429), interrompe para não consumir mais cotas da organização em cascata
      if (groqResponse.status === 429) {
        break;
      }
    }

    if (!groqResponse || !groqResponse.ok) {
      if (groqResponse?.status === 429) {
        return NextResponse.json({
          error: "Limite temporário de requisições da IA atingido. Por favor, aguarde alguns segundos antes de tentar novamente."
        }, { status: 429 });
      }
      return NextResponse.json({ error: "Erro na API da IA (Groq)." }, { status: 500 });
    }

    const data = await groqResponse.json() as any;
    const messageContent = data.choices[0]?.message?.content;
    const cleanJson = extractCleanJson(messageContent || "");
    const parsedJson = JSON.parse(cleanJson);

    if (tipo === 'resumo') {
      const resumo = parsedJson.resumo || trilha.titulo;
      const resumoMarkdown = parsedJson.resumo_markdown || "";
      await db.prepare('UPDATE trilhas SET video_resumo = ?, video_resumo_markdown = ? WHERE id = ? AND user_id = ?')
        .bind(resumo, resumoMarkdown, id, userId)
        .run();
      return NextResponse.json({ success: true, resumo, resumo_markdown: resumoMarkdown }, { status: 200 });
    }

    const statements = [];
    let itemsToReturn = [];

    if (tipo === 'flashcards') {
      const flashcards = parsedJson.flashcards || [];
      for (const fc of flashcards) {
        const fcId = crypto.randomUUID();
        statements.push(
          db.prepare(`INSERT INTO trilha_flashcards (id, trilha_id, frente, verso) VALUES (?, ?, ?, ?)`).bind(fcId, id, fc.frente, fc.verso)
        );
        itemsToReturn.push({ id: fcId, frente: fc.frente, verso: fc.verso });
      }
    } else {
      const questoes = parsedJson.questoes || [];
      for (const q of questoes) {
        const qId = crypto.randomUUID();
        const corretaIdx = typeof q.corretaIdx === 'number' ? q.corretaIdx : 0;
        const opcoesStr = JSON.stringify(q.opcoes || []);
        statements.push(
          db.prepare(`INSERT INTO trilha_questoes (id, trilha_id, enunciado, opcoes, correta_idx, justificativa, tipo_questao) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(qId, id, q.enunciado, opcoesStr, corretaIdx, q.justificativa || "", "MULTIPLA_ESCOLHA")
        );
        itemsToReturn.push({
          id: qId,
          enunciado: q.enunciado,
          opcoes: q.opcoes,
          corretaIdx,
          justificativa: q.justificativa,
          tipo_questao: "MULTIPLA_ESCOLHA"
        });
      }
    }

    if (statements.length > 0) {
      const batchResults = await db.batch(statements);
      for (const res of batchResults) {
        if (!res.success) throw new Error('Falha na transação D1');
      }
    }

    return NextResponse.json({ success: true, items: itemsToReturn }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/trilhas/[id]/gerar-mais] Erro:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
