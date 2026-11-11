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

export const AivuPdfFileInfoSchema = z.object({
  name: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(15 * 1024 * 1024, "Arquivo excede o limite máximo de 15 MB."),
  pageCount: z.number().int().positive().max(100, "Máximo de 100 páginas permitidas."),
  fonte: z.literal("PDF"),
});

export const AivuChatRequestSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, "A mensagem não pode ser vazia.")
      .max(1000, "A mensagem deve ter no máximo 1.000 caracteres."),
    material_text: z
      .string()
      .trim()
      .min(20, "O material deve ter no mínimo 20 caracteres.")
      .max(40000, "O material deve ter no máximo 40.000 caracteres.")
      .optional(),
    file_info: AivuPdfFileInfoSchema.optional(),
    history: z
      .array(AivuChatMessageSchema)
      .max(8, "O histórico não pode exceder 8 mensagens recentes.")
      .optional()
      .default([]),
    context: AivuPageContextSchema.optional(),
  })
  .refine(
    (data) => {
      const msgLen = data.message.length;
      const matLen = data.material_text ? data.material_text.length : 0;
      const histLen = data.history.reduce((acc, h) => acc + h.content.length, 0);
      return msgLen + matLen + histLen <= 45000;
    },
    {
      message: "O payload combinado (mensagem, edital e histórico) excede o orçamento de contexto seguro (45.000 caracteres).",
      path: ["material_text"],
    }
  );

export const AivuCitationSchema = z.object({
  source: z.string().trim().min(1).max(255),
  page: z.number().int().positive().optional(),
  section: z.string().trim().max(180).optional(),
  excerpt: z.string().trim().min(1).max(400),
});

export const AivuIntentEnum = z.enum(["EDITAL_JORNADA", "DOCUMENT_QA", "GENERAL_CHAT"]);

export const AivuChatResponseSchema = z.object({
  reply: z.string().min(1, "Resposta não pode ser vazia."),
  state: z.enum(["speaking", "idle", "concerned", "success"]).default("speaking"),
  actionProposal: AivuActionProposalSchema.optional(),
  citations: z.array(AivuCitationSchema).max(3).optional(),
  intent: AivuIntentEnum.optional(),
});

export type AivuCitation = z.infer<typeof AivuCitationSchema>;
export type AivuIntent = z.infer<typeof AivuIntentEnum>;
export type AivuChatMessage = z.infer<typeof AivuChatMessageSchema>;
export type AivuActionProposal = z.infer<typeof AivuActionProposalSchema>;
export type AivuPdfFileInfo = z.infer<typeof AivuPdfFileInfoSchema>;
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
 * Identifica se a mensagem do usuário é uma solicitação explícita para criar/estruturar
 * uma Jornada ou Trilha de estudos a partir do edital.
 */
export function isExplicitJornadaCreationRequest(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) return false;
  const lower = trimmed.toLowerCase();
  const creationPatterns = [
    /\bjornad/i,
    /\bpropost/i,
    /\bcronograma/i,
    /\btrilha/i,
    /\bplano\s+de\s+estudos?\b/i,
    /\b(?:cri(?:e|ar)|mont(?:e|ar)|ger(?:e|ar)|prepar(?:e|ar)|transform(?:e|ar)|estrutur(?:e|ar)|elabor(?:e|ar))\b.*\b(?:edital|jornada|proposta|estudos?|disciplinas?|mat[eé]rias?|conte[uú]do|cargo)\b/i,
    /^analise\s+(?:todo\s+o\s+|o\s+|este\s+|esse\s+|meu\s+)?(?:edital|conte[uú]do\s+program[aá]tico|material)/i,
    /^analise\s+para\s+/i,
    /(?:cargo(?:\s*:\s*|\s+de\s+)|\bquero\s+(?:o\s+)?cargo\s+de\s+)/i,
  ];
  return creationPatterns.some((p) => p.test(lower));
}

/**
 * Identifica se a mensagem é uma pergunta pontual ou pedido de explicação sobre o documento/material
 * (ex: dúvidas sobre páginas, artigos, leis, prazos, requisitos, conceitos da apostila/PDF).
 */
export function isDocumentQuestionPattern(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3 || trimmed.length > 800) return false;

  // Se o usuário pediu explicitamente para criar a jornada/proposta, não é mera dúvida documental
  if (isExplicitJornadaCreationRequest(trimmed)) {
    return false;
  }

  const lower = trimmed.toLowerCase();
  const questionPatterns = [
    /\?$/,
    /^(?:qual|quais|como|onde|quando|quanto|quantos|quantas|por\s*que|porque|quem)\b/i,
    /\b(?:o\s+que\s+(?:diz|fala|consta|trata|significa|é|sao|são)|explique|explica|resuma|detalhe|cite|localize|busque|encontre)\b/i,
    /\b(?:p[aá]gina|p[aá]g\.?|artigo|art\.?|inciso|par[aá]grafo|§|lei\s+n?[ºo°\.]?\s*\d|decreto|s[uú]mula)\b/i,
    /\b(?:segundo\s+o\s+(?:pdf|documento|material|texto|edital|artigo)|no\s+(?:pdf|documento|material|anexo|texto)|de\s+acordo\s+com\s+o)\b/i,
    /\b(?:taxa\s+de\s+inscri[çc][aã]o|isen[çc][aã]o|requisito|prazo|remunera[çc][aã]o|sal[aá]rio|vagas|data\s+da\s+prova|est[aá]gio\s+probat[oó]rio|posse|exerc[ií]cio)\b/i,
  ];

  return questionPatterns.some((p) => p.test(lower));
}

/**
 * Classificador determinístico de intenção para o roteamento do AIVU (Fase B.2):
 * - EDITAL_JORNADA: análise de edital para estruturação de disciplinas e criação de Jornada/Trilha
 * - DOCUMENT_QA: perguntas, buscas de artigos/páginas e explicações fundamentadas no documento/material
 * - GENERAL_CHAT: conversação geral ou pedagógica sem recuperação documental RAG
 */
export function classifyAivuIntent(params: {
  message: string;
  material_text?: string;
  context?: {
    modulo?: string;
    atividade?: string;
    trecho_foco?: string;
  } | null;
}): AivuIntent {
  const { message, material_text, context } = params;
  const trimmedMsg = (message || "").trim();

  const hasMaterialText = typeof material_text === "string" && material_text.trim().length >= 20;
  const isMsgDirectEdital = !hasMaterialText && isEditalPattern(trimmedMsg);
  const candidateDoc = hasMaterialText ? material_text!.trim() : isMsgDirectEdital ? trimmedMsg : undefined;

  if (candidateDoc) {
    const docLooksLikeEdital = isEditalPattern(candidateDoc);

    // Se o usuário faz uma pergunta específica sobre o documento (e não pediu criação de jornada)
    if (!isMsgDirectEdital && isDocumentQuestionPattern(trimmedMsg)) {
      return "DOCUMENT_QA";
    }

    // Se for uma solicitação explícita de criação de jornada ou análise pedagógica de edital -> EDITAL_JORNADA
    if (isMsgDirectEdital || isExplicitJornadaCreationRequest(trimmedMsg) || (docLooksLikeEdital && isAnalysisRequest(trimmedMsg))) {
      return "EDITAL_JORNADA";
    }

    // Se o documento NÃO é um edital (ex: apostila, lei seca, resumo de aula) -> DOCUMENT_QA
    if (!docLooksLikeEdital) {
      return "DOCUMENT_QA";
    }

    // Fallback para documento quando acompanhado de dúvida
    return "DOCUMENT_QA";
  }

  // Se está no módulo "material" com trecho_foco ativo, trata como DOCUMENT_QA
  if (context?.modulo === "material" && context?.trecho_foco && context.trecho_foco.trim().length >= 20) {
    return "DOCUMENT_QA";
  }

  return "GENERAL_CHAT";
}

export interface AivuActiveSessionDocument {
  name: string;
  text: string;
  size?: number;
  pageCount?: number;
  fonte?: "PDF" | "TEXTO";
}
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
  material_text?: string;
  file_info?: AivuPdfFileInfo;
  activeDocument?: AivuActiveSessionDocument | null;
  messages: Array<{ sender: string; text?: string }>;
  activeContext?: any;
  pathname?: string | null;
}): {
  message: string;
  material_text?: string;
  file_info?: AivuPdfFileInfo;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  context?: any;
} {
  const { text, material_text, file_info, activeDocument, messages, activeContext, pathname } = params;

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
  let messageField: string;
  let materialField: string | undefined;
  let effectiveFileInfo: AivuPdfFileInfo | undefined = file_info;

  if (material_text) {
    messageField = text.slice(0, 1000) || "Analise o edital em anexo e elabore uma proposta de Jornada de Estudos.";
    materialField = material_text;
  } else {
    const isDirectLongMaterial = text.length > 1000;
    const previousEdital = findPreviousEdital(messages);
    const sessionDocText =
      activeDocument && typeof activeDocument.text === "string" && activeDocument.text.trim().length >= 20
        ? activeDocument.text.trim().slice(0, 40000)
        : undefined;

    if (isDirectLongMaterial) {
      messageField = "Analise o edital enviado e prepare uma proposta de Jornada de Estudos.";
      materialField = text;
    } else if (previousEdital && (isAnalysisRequest(text) || isDocumentQuestionPattern(text))) {
      messageField = text.slice(0, 1000);
      materialField = previousEdital;
    } else if (isEditalPattern(text)) {
      messageField = "Analise o edital enviado e prepare uma proposta de Jornada de Estudos.";
      materialField = text;
    } else if (sessionDocText) {
      messageField = text.slice(0, 1000);
      materialField = sessionDocText;
      if (!effectiveFileInfo && activeDocument?.fonte === "PDF" && activeDocument.name) {
        effectiveFileInfo = {
          name: activeDocument.name.slice(0, 255),
          size: Math.min(Math.max(1, activeDocument.size || sessionDocText.length), 15 * 1024 * 1024),
          pageCount: Math.min(Math.max(1, activeDocument.pageCount || 1), 100),
          fonte: "PDF",
        };
      }
    } else {
      messageField = text.slice(0, 1000);
      materialField = undefined;
    }
  }

  return {
    message: messageField,
    material_text: materialField,
    file_info: effectiveFileInfo,
    history: historyPayload,
    context: effectiveContext || undefined,
  };
}
