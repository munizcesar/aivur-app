import { z } from "zod";
import { AivuPageContextSchema } from "@/lib/aivu-brain";
import { CriarJornadaRequestSchema } from "@/lib/validations/jornada";

export const AivuChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1, "Mensagem não pode ser vazia.").max(2000, "Mensagem histórica muito longa."),
});

export const AivuActionProposalSchema = z.object({
  id: z.string(),
  tipo: z.enum(["CRIAR_JORNADA", "CRIAR_TRILHA", "ACAO_RAPIDA"]),
  titulo: z.string().min(1).max(150),
  subtitulo: z.string().max(120).optional(),
  resumo_dados: z.object({
    disciplinas_count: z.number().int().min(1),
    topicos_count: z.number().int().min(1),
    preview_disciplinas: z.array(z.string()).min(1),
  }),
  payload_preparado: CriarJornadaRequestSchema,
  status: z.enum(["proposta", "executando", "concluida", "erro"]).default("proposta"),
  resultado: z
    .object({
      id: z.string().optional(),
      redirect_url: z.string(),
      mensagem: z.string(),
    })
    .optional(),
});

export const AivuChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "A mensagem não pode ser vazia.")
    .max(1000, "A mensagem deve ter no máximo 1.000 caracteres."),
  material_text: z
    .string()
    .trim()
    .min(50, "O material deve ter no mínimo 50 caracteres.")
    .max(15000, "O material deve ter no máximo 15.000 caracteres.")
    .optional(),
  history: z
    .array(AivuChatMessageSchema)
    .max(8, "O histórico não pode exceder 8 mensagens recentes.")
    .optional()
    .default([]),
  context: AivuPageContextSchema.optional(),
});

export const AivuChatResponseSchema = z.object({
  reply: z.string().min(1, "Resposta não pode ser vazia."),
  state: z.enum(["speaking", "idle", "concerned", "success"]).default("speaking"),
  actionProposal: AivuActionProposalSchema.optional(),
});

export type AivuChatMessage = z.infer<typeof AivuChatMessageSchema>;
export type AivuActionProposal = z.infer<typeof AivuActionProposalSchema>;
export type AivuChatRequest = z.infer<typeof AivuChatRequestSchema>;
export type AivuChatResponse = z.infer<typeof AivuChatResponseSchema>;

/**
 * Heurística defensiva para identificar se um texto representa um edital ou conteúdo programático
 * estruturado (disciplinas, tópicos numerados, etc.).
 * Não confunde comandos e instruções curtas do usuário com o edital em si.
 */
export function isEditalPattern(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 50) return false;

  const lower = trimmed.toLowerCase();

  // Se for apenas uma instrução do usuário pedindo análise de algo enviado anteriormente
  const isInstructionOnly =
    /^(?:analise|analisar|crie|monte|gere|prepare|transforme|elabore|veja|leia)\s+(?:todo\s+o\s+|o\s+|este\s+|esse\s+|meu\s+|o\s+meu\s+)?(?:conte[uú]do|edital|material|ementa)/i.test(trimmed) &&
    !/(?:1[\.\-\)]|[a-e][\.\-\)])\s+[A-Za-zÀ-ÖØ-öø-ÿ]/.test(trimmed);

  if (isInstructionOnly && trimmed.length < 1000) {
    return false;
  }

  // Marcadores explícitos de editais brasileiros
  const explicitMarkers = [
    "conteúdo programático",
    "conteudo programatico",
    "conhecimentos básicos",
    "conhecimentos basicos",
    "conhecimentos específicos",
    "conhecimentos especificos",
    "programa de matérias",
    "quadro de provas",
    "das disciplinas",
    "ementa do concurso",
  ];

  const hasNumberedItems = /(?:^|\n)\s*(?:[0-9]{1,2}[\.\-\)]|[a-e][\.\-\)])\s+[A-Za-zÀ-ÖØ-öø-ÿ]/m;
  const disciplinePattern =
    /(?:língua portuguesa|direito constitucional|direito administrativo|direito penal|direito processual|informática|raciocínio lógico|administração pública|atualidades|contabilidade)/i;

  if (explicitMarkers.some((marker) => lower.includes(marker))) {
    if (trimmed.length > 300 || hasNumberedItems.test(trimmed) || disciplinePattern.test(trimmed)) {
      return true;
    }
  }

  return disciplinePattern.test(trimmed) && hasNumberedItems.test(trimmed);
}

/**
 * Identifica se a mensagem do usuário é uma solicitação pedagógica para analisar edital
 * ou criar uma jornada de estudos a partir de um material/edital.
 */
export function isAnalysisRequest(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) return false;
  const lower = trimmed.toLowerCase();
  const patterns = [
    /\banalis/i,
    /\bjornad/i,
    /\bpropost/i,
    /\bcronograma/i,
    /\bedital/i,
    /\bconte[uú]do\s+program[aá]tico/i,
    /\bmat[eé]rias?\b/i,
    /\bdisciplinas?\b/i,
    /\bt[oó]picos?\b/i,
    /\bconcurso\b/i,
    /\bementa\b/i,
    /\bcri(?:e|ar|a[çc][aã]o)\b/i,
    /\bmont(?:e|ar|agem)\b/i,
    /\bger(?:e|ar|a[çc][aã]o)\b/i,
    /\bprepar(?:e|ar|a[çc][aã]o)\b/i,
    /\btransform(?:e|ar)\b/i,
    /\bestrutur(?:e|ar)\b/i,
    /\bplano\s+de\s+estudos?\b/i,
  ];
  return patterns.some((p) => p.test(lower));
}

/**
 * Procura no histórico recente se existe algum edital/material anterior válido enviado pelo usuário.
 */
export function findPreviousEdital(
  messages: Array<{ sender: string; text?: string }>
): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.sender === "user" && typeof m.text === "string") {
      const trimmed = m.text.trim();
      if (trimmed.length >= 50 && trimmed.length <= 15000) {
        if (trimmed.length > 1000 || isEditalPattern(trimmed)) {
          return trimmed;
        }
      }
    }
  }
  return undefined;
}

/**
 * Monta o payload seguro para envio ao POST /api/ai/aivu/chat, separando claramente:
 * - message: instrução atual do usuário (max 1000 chars)
 * - material_text: edital ou material extenso recuperado (não truncado, até 15.000 chars)
 * - history: contexto resumido (cada item <= 1800 chars, edital substituído por marcador)
 */
export function prepareAivuChatPayload(params: {
  text: string;
  messages: Array<{ sender: string; text?: string }>;
  activeContext?: any;
  pathname?: string | null;
}): {
  message: string;
  material_text?: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  context?: any;
} {
  const { text, messages, activeContext, pathname } = params;

  // 1. Contexto da página
  let effectiveContext = activeContext;
  if (!effectiveContext && pathname) {
    let derivedModulo:
      | "home"
      | "jornadas"
      | "trilhas"
      | "questoes"
      | "material"
      | "redacao"
      | "auth"
      | "geral" = "geral";
    if (pathname === "/" || pathname === "/dashboard") derivedModulo = "home";
    else if (pathname.includes("jornada")) derivedModulo = "jornadas";
    else if (pathname.includes("trilha")) derivedModulo = "trilhas";
    else if (pathname.includes("questao") || pathname.includes("questoes")) derivedModulo = "questoes";
    else if (pathname.includes("material")) derivedModulo = "material";
    else if (pathname.includes("redacao")) derivedModulo = "redacao";
    else if (pathname.includes("login") || pathname.includes("register")) derivedModulo = "auth";

    effectiveContext = {
      pathname: pathname.slice(0, 200),
      modulo: derivedModulo,
      atividade: "navegando",
    };
  }

  // 2. Histórico recente resumido defensivamente (máximo 8 itens, cada item <= 1800 chars)
  const historyPayload = messages.slice(-8).map((m) => {
    let content = typeof m.text === "string" ? m.text.trim() : "";
    if (content.length > 1000 || isEditalPattern(content)) {
      content = "[Edital enviado anteriormente]";
    } else if (content.length > 1800) {
      content = content.slice(0, 1800) + "...";
    }
    return {
      role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: content || "...",
    };
  });

  // 3. Detecção e separação de message e material_text
  const isDirectLongMaterial = text.length > 1000;
  const previousEdital = findPreviousEdital(messages);

  let messageField: string;
  let materialField: string | undefined;

  if (isDirectLongMaterial) {
    messageField = "Analise o edital enviado e prepare uma proposta de Jornada de Estudos.";
    materialField = text;
  } else if (previousEdital && isAnalysisRequest(text)) {
    messageField = text.slice(0, 1000);
    materialField = previousEdital;
  } else if (isEditalPattern(text)) {
    messageField = "Analise o edital enviado e prepare uma proposta de Jornada de Estudos.";
    materialField = text;
  } else {
    messageField = text.slice(0, 1000);
    materialField = undefined;
  }

  return {
    message: messageField,
    material_text: materialField,
    history: historyPayload,
    context: effectiveContext || undefined,
  };
}
