export const runtime = 'edge';
import { NextResponse } from "next/server";
import { callGroqWithFallback } from "@/lib/groq";
import { extractCleanJson } from '@/lib/ai-protocols';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Função auxiliar para resolver bindings e env no Edge
function resolveEnv(): any {
  try {
    const ctx = getRequestContext();
    if (ctx?.env) return ctx.env;
  } catch (_) {}
  const g = globalThis as any;
  if (g.GROQ_API_KEY) return g;
  return process.env;
}

// Basic in-memory rate limiting
const ipMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 5;
  const windowMs = 60 * 1000 * 60; // 1 hour window

  if (!ipMap.has(ip)) {
    ipMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const record = ipMap.get(ip)!;
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    const env = resolveEnv();
    const groqApiKey = env?.GROQ_API_KEY;

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit excedido. Tente novamente mais tarde." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    let text = formData.get("text") as string || "";
    const file = formData.get("file") as File | null;

    if (!title) {
      return NextResponse.json(
        { error: "Título é obrigatório." },
        { status: 400 }
      );
    }

    const sourceType: "edital" | "livre" = (text || file) ? "edital" : "livre";

    if (file) {
      try {
        if (typeof global !== 'undefined') {
          // @ts-ignore
          if (typeof global.DOMMatrix === 'undefined') {
            // @ts-ignore
            global.DOMMatrix = class DOMMatrix { constructor() { this.a=1; this.b=0; this.c=0; this.d=1; this.e=0; this.f=0; } } as any;
          }
          // @ts-ignore
          if (typeof global.Path2D === 'undefined') global.Path2D = class Path2D {} as any;
          // @ts-ignore
          if (typeof global.ImageData === 'undefined') global.ImageData = class ImageData {} as any;
        }

        const pdfParse = require("pdf-parse");
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } catch (err) {
        console.error("PDF Parsing error:", err);
        return NextResponse.json(
          { error: "Falha ao ler o PDF fornecido." },
          { status: 400 }
        );
      }
    }

    if (text.length > 50000) {
      text = text.slice(0, 50000);
    }

    const promptEdital = `Você é um estruturador de cursos especialista em concursos públicos e exames. 
Abaixo está o conteúdo de um edital ou material bruto.
Você deve estruturar esse conteúdo em um JSON rigoroso, dividindo-o em matérias, nichos de matérias e tópicos.
Para cada matéria, sugira um 'ytTerm' apropriado (o termo de busca que o aluno deve usar para encontrar aulas sobre essa matéria no YouTube).
NÃO invente artigos de lei ou dispositivos que não estejam no texto.
NÃO OMita nenhuma lei, artigo ou tópico listado. Se houver legislações ou tópicos soltos no final do texto sem uma matéria clara, crie uma matéria extra (ex: "Legislação Específica" ou "Conhecimentos Específicos") e coloque-os lá. Todo o conteúdo do edital deve ser contemplado.
Seja SINTÉTICO na fragmentação: não crie um tópico isolado para cada vírgula ou palavra solta; agrupe conceitos e legislações correlatas em tópicos abrangentes para otimizar o tamanho da saída.
NÃO use markdown no retorno, devolva APENAS o JSON puro.

Schema esperado do JSON:
{
  "subjects": [
    {
      "subject": "Nome da Matéria (ex: Língua Portuguesa)",
      "ytTerm": "Língua Portuguesa para concursos aula",
      "nichos": [
        {
          "title": "Nome do Nicho (ex: Compreensão de Textos)",
          "items": [
            {
              "id": "será preenchido no backend, retorne string vazia",
              "label": "Tópico específico (ex: Significação das palavras e Pontuação)"
            }
          ]
        }
      ]
    }
  ]
}

Conteúdo bruto:
${text}`;

    const promptLivre = `Você é um estruturador de cursos especialista.
O aluno deseja criar uma trilha de estudos abrangente sobre o seguinte tema livre: "${title}".
Você deve estruturar uma trilha lógica e pedagógica sobre este tema em um JSON rigoroso, dividindo o curso em grandes módulos (matérias), subseções (nichos) e aulas individuais (tópicos).
Para cada matéria/módulo, sugira um 'ytTerm' apropriado (o termo de busca que o aluno deve usar para encontrar aulas no YouTube).
NÃO use markdown no retorno, devolva APENAS o JSON puro.

Schema esperado do JSON:
{
  "subjects": [
    {
      "subject": "Nome do Módulo (ex: Fundamentos Básicos)",
      "ytTerm": "Tema específico aula passo a passo",
      "nichos": [
        {
          "title": "Nome da Subseção (ex: Introdução Histórica)",
          "items": [
            {
              "id": "será preenchido no backend, retorne string vazia",
              "label": "Tópico da Aula (ex: O surgimento do conceito no século XX)"
            }
          ]
        }
      ]
    }
  ]
}`;

    const prompt = sourceType === "edital" ? promptEdital : promptLivre;

    const messages = [
      { role: "system", content: "You are a JSON assistant. Output valid JSON only." },
      { role: "user", content: prompt }
    ];

    const messageContent = await callGroqWithFallback(messages, {
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      apiKey: groqApiKey
    });

    // 4. Extração de JSON centralizada via ai-protocols (extractCleanJson)
    const jsonString = extractCleanJson(messageContent || "");

    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON retornado pela Groq:", parseError);
      return NextResponse.json(
        { error: "O edital é muito extenso ou complexo, fazendo a geração ser cortada. Tente dividir o conteúdo em partes ou remover textos irrelevantes." },
        { status: 400 }
      );
    }
    const parsedSubjects = parsedJson.subjects;
    
    // Validate basic shape
    if (!Array.isArray(parsedSubjects)) {
      throw new Error("Invalid output shape from AI");
    }

    // Add unique IDs and structure the final Course
    const courseId = `local-${Date.now().toString(36)}`;
    const finalCourse = {
      id: courseId,
      title: title,
      sourceType: sourceType,
      subjects: parsedSubjects.map((s: any, sIdx: number) => ({
        subject: s.subject,
        ytTerm: s.ytTerm,
        nichos: (s.nichos || []).map((n: any, nIdx: number) => ({
          title: n.title,
          items: (n.items || []).map((i: any, iIdx: number) => ({
            id: `${courseId}_M${sIdx}_N${nIdx}_T${iIdx}`,
            label: i.label
          }))
        }))
      }))
    };

    return NextResponse.json(finalCourse);
  } catch (error: any) {
    console.error("Erro na rota de Geração:", error);
    return NextResponse.json(
      { error: "Falha interna ao gerar o curso. " + error.message },
      { status: 500 }
    );
  }
}
