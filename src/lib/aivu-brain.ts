import { z } from "zod";
import { getDomainRules } from "@/lib/ai-protocols";
import type { AivuChatMessage } from "@/lib/validations/aivu-chat";

/**
 * Módulos suportados pela plataforma AIVUR para inteligência contextual.
 */
export const AivuModuleEnum = z.enum([
  "home",
  "jornadas",
  "trilhas",
  "questoes",
  "material",
  "redacao",
  "auth",
  "geral",
]);

export type AivuModule = z.infer<typeof AivuModuleEnum>;

/**
 * Atividade pedagógica corrente do estudante.
 */
export const AivuActivityEnum = z.enum([
  "navegando",
  "resolvendo_questao",
  "revisando_flashcard",
  "lendo_teoria",
  "analisando_edital",
  "estudando_material",
  "redigindo_texto",
]);

export type AivuActivity = z.infer<typeof AivuActivityEnum>;

/**
 * Contrato estrito de contexto da página ativa para o cérebro do AIVU.
 * Privativo por design: limita o payload a metadados educacionais essenciais,
 * sem raspagem indiscriminada de DOM, cookies ou dados sensíveis.
 */
export const AivuPageContextSchema = z.object({
  pathname: z.string().trim().max(200, "Caminho da rota muito longo."),
  modulo: AivuModuleEnum.default("geral"),
  atividade: AivuActivityEnum.default("navegando"),
  titulo: z.string().trim().max(180, "Título muito longo.").optional(),
  disciplina: z.string().trim().max(100, "Nome da disciplina muito longo.").optional(),
  topico: z.string().trim().max(180, "Nome do tópico muito longo.").optional(),
  trecho_foco: z
    .string()
    .trim()
    .max(1500, "Trecho de foco limitado a 1.500 caracteres para contenção de tokens.")
    .optional(),
  metadados: z.record(z.string(), z.string().max(300)).optional(),
});

export type AivuPageContext = z.infer<typeof AivuPageContextSchema>;

/**
 * Orçamento defensivo de tokens para o modelo Groq (openai/gpt-oss-120b).
 */
export const AIVU_TOKEN_BUDGET = {
  MAX_TOTAL_INPUT_TOKENS: 2400,
  SYSTEM_PROMPT_RESERVE: 450,
  CONTEXT_RESERVE: 450,
  HISTORY_RESERVE: 1100,
  USER_MESSAGE_RESERVE: 400,
  OUTPUT_RESERVED: 600,
} as const;

/**
 * Estima a contagem aproximada de tokens para textos em português (média de 3.6 chars/token).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.6);
}

/**
 * Montador de Contexto Inteligente para o Professor Particular AIVU.
 *
 * Gera o prompt de sistema especializado, incorpora as diretrizes de domínio,
 * aplica a regra de ancoragem restritiva do Meu Material (quando aplicável)
 * e aloca mensagens do histórico dentro do orçamento seguro de tokens.
 */
export function assembleAivuPromptMessages(params: {
  message: string;
  history?: AivuChatMessage[];
  context?: AivuPageContext;
}): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const { message, history = [], context } = params;

  // 1. Definição da persona do Professor Particular
  let systemPersona = `Você é o AIVU, o Professor Particular Inteligente da plataforma de concursos AIVUR.
Seu papel pedagógico:
- Atue como um mentor e professor de elite: seja didático, encorajador, rigoroso e acolhedor.
- Não dê apenas respostas mecânicas: explique a razão do conceito, alerte sobre pegadinhas comuns da banca e guie o aluno passo a passo.
- Responda em português brasileiro com clareza, em 1 a 3 parágrafos objetivos ou tópicos bem estruturados.
- Nunca alucine leis, artigos, jurisprudências ou prazos sem absoluta certeza.`;

  // 2. Incorporação de regras de domínio se houver disciplina identificada
  const subject = context?.disciplina || context?.titulo || "";
  if (subject) {
    const domainRules = getDomainRules(subject);
    if (domainRules) {
      systemPersona += `\n\n=== PROTOCOLO DE CONFIABILIDADE DE DOMÍNIO ===\n${domainRules}`;
    }
  }

  // 3. Injeção de Contexto da Página Atual
  if (context && context.modulo !== "geral") {
    systemPersona += `\n\n=== CONTEXTO DA PÁGINA ATUAL DO ALUNO ===
- Módulo Atual: ${context.modulo.toUpperCase()}
- Rota: ${context.pathname}
- Atividade em Andamento: ${context.atividade}`;

    if (context.titulo) systemPersona += `\n- Conteúdo: ${context.titulo}`;
    if (context.disciplina) systemPersona += `\n- Matéria: ${context.disciplina}`;
    if (context.topico) systemPersona += `\n- Tópico Específico: ${context.topico}`;

    if (context.trecho_foco) {
      systemPersona += `\n- Trecho em Foco na Tela:\n"""\n${context.trecho_foco}\n"""`;
    }

    if (context.metadados && Object.keys(context.metadados).length > 0) {
      systemPersona += `\n- Dados da Atividade: ${JSON.stringify(context.metadados)}`;
    }

    // Regra Específica Estrita para "Meu Material" (Requisito 8)
    if (context.modulo === "material") {
      systemPersona += `\n\n=== DIRETRIZ RESTRITIVA DE FONTE (MEU MATERIAL) ===
Você está analisando exclusivamente o material acadêmico enviado pelo aluno.
- Suas respostas devem ser baseadas ESTRITAMENTE no trecho e informações do material fornecido.
- Se a dúvida do aluno não tiver resposta no material, informe de forma clara: "Informação não encontrada no material fornecido."
- Não invente ou presuma fatos externos ao documento.`;
    }

    // Regra Específica para "Caderno de Questões"
    if (context.modulo === "questoes" || context.atividade === "resolvendo_questao") {
      systemPersona += `\n\n=== DIRETRIZ PARA QUESTÕES DE CONCURSO ===
- Ajude o aluno a entender a teoria e a lógica por trás da questão.
- Se o aluno perguntar qual a resposta, guie-o até a alternativa correta explicando a tese jurídica ou regra gramatical/lógica que descarta os distratores.`;
    }
  }

  // 4. Seleção e poda do histórico recente respeitando o orçamento de tokens
  const budgetForHistory = AIVU_TOKEN_BUDGET.HISTORY_RESERVE;
  let accumulatedHistoryTokens = 0;
  const filteredHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

  // Percorre do mais recente para o mais antigo para manter o histórico mais relevante
  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];
    const tokens = estimateTokens(item.content);
    if (accumulatedHistoryTokens + tokens > budgetForHistory) {
      break;
    }
    accumulatedHistoryTokens += tokens;
    filteredHistory.unshift({ role: item.role, content: item.content });
  }

  // 5. Montagem final das mensagens
  return [
    { role: "system", content: systemPersona },
    ...filteredHistory,
    { role: "user", content: message },
  ];
}
