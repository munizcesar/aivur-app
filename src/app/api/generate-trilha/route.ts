import { NextRequest } from "next/server";
import { z } from "zod";
import Groq from "groq-sdk";

export const runtime = "edge"; // Otimização de TTI, alocação V8 instântanea

// 1. Zod Schema: Blindagem de Payload e Validação Estrita (Evita desperdício de tokens)
const TrilhaPayloadSchema = z.object({
  edital: z.string().min(3, "Edital inválido. Mínimo de 3 caracteres."),
  nivel: z.enum(["iniciante", "intermediario", "avancado"]),
  objetivo: z.string().optional(),
});

// Setup do SDK Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy_key",
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    
    // Validação Segura Zod
    const result = TrilhaPayloadSchema.safeParse(rawBody);
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: "Payload Incorreto", 
        details: result.error.format() 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { edital, nivel, objetivo } = result.data;

    // 2. Prompt Estruturado (System Instruction) Blindado
    const systemPrompt = `Você é um motor de estruturação de conhecimento de IA.
Sua única função é gerar um objeto JSON rigoroso contendo a trilha de estudos.
Não retorne NADA além do JSON válido. Sem formatação Markdown. Sem textos adicionais. Sem saudações.

O formato EXATO deve ser:
{
  "modules": [
    {
      "title": "Nome do Módulo",
      "subjects": [
        {
          "name": "Nome do Assunto",
          "flashcards": ["Flashcard 1", "Flashcard 2", "Flashcard 3"]
        }
      ]
    }
  ]
}

REGRAS OBRIGATÓRIAS:
- Nível do aluno: ${nivel}
- Foco (Edital): ${edital}
- Objetivo extra: ${objetivo || 'Não especificado'}
- Gere exatamente 3 módulos.
- Cada módulo deve ter exatamente 2 assuntos.
- Cada assunto deve ter exatamente 3 flashcards práticos.
- Nenhuma chave adicional é permitida.
A resposta DEVE iniciar com { e terminar com }.`;

    // 3. Fallback de Payload e Chamada do Modelo com Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    let aiStream: AsyncIterable<any>;

    try {
      aiStream = await groq.chat.completions.create({
        model: "llama3-8b-8192", // Modelo otimizado para baixa latência
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Gere a trilha estritamente no formato JSON solicitado." }
        ],
        temperature: 0.1, // Temperatura baixa para previsibilidade
        stream: true,
        response_format: { type: "json_object" },
      }, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (apiError: any) {
      clearTimeout(timeoutId);
      console.error("[Edge API] Motor LLM indisponível ou timeout:", apiError);
      // Retorna erro limpo que o ErrorBoundary consegue engolir
      return new Response(JSON.stringify({ 
        error: "AI_TIMEOUT", 
        message: "O motor de inteligência artificial demorou a responder ou falhou. Por favor, tente novamente." 
      }), {
        status: 504,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Criação do ReadableStream para Server-Sent Events (SSE) progressivo
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(streamController) {
        try {
          // Passo 1: Notifica início do processo
          streamController.enqueue(encoder.encode(`data: {"step": 1, "message": "Edital '${edital}' mapeado. Nível: ${nivel}."}\n\n`));
          
          let fullJsonText = "";
          let chunksReceived = 0;

          // Consumindo a stream de dados da IA
          for await (const chunk of aiStream) {
            if (chunksReceived === 0) {
              // Notifica o processamento em andamento no primeiro byte recebido
              streamController.enqueue(encoder.encode(`data: {"step": 2, "message": "Análise da matriz de disciplinas em andamento..."}\n\n`));
            }
            
            const content = chunk.choices[0]?.delta?.content || "";
            fullJsonText += content;
            chunksReceived++;
          }

          // Verificação de Segurança: Prevenção contra parser quebrado
          try {
            JSON.parse(fullJsonText);
          } catch (parseError) {
            console.error("[Edge API] Modelo quebrou o contrato JSON:", fullJsonText);
            throw new Error("Saída do modelo inválida.");
          }

          // Passo 3: Finalização
          streamController.enqueue(encoder.encode(`data: {"step": 3, "message": "Trilha final forjada com sucesso!"}\n\n`));
          
          // Envio do Payload consolidado
          streamController.enqueue(encoder.encode(`data: {"trilha": ${fullJsonText}}\n\n`));
          
          // Fim da Transmissão
          streamController.enqueue(encoder.encode(`data: [DONE]\n\n`));
          streamController.close();
        } catch (streamError) {
          console.error("[Edge API] Erro durante o stream SSE:", streamError);
          streamController.error(streamError);
        }
      },
      cancel() {
        console.warn("[Edge API] Cliente abortou o streaming da Trilha.");
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Falha Interna no Servidor Edge" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
