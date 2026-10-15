import { z } from "zod";

/**
 * ==============================================================================
 * AIVUR — CONTRATOS ZOD DO MEU MATERIAL (FASE 2)
 * ==============================================================================
 * Define os schemas tipados de validação e saída para a síntese gerada por IA:
 * 1. Resumo estruturado com tema central, pontos-chave e markdown analítico.
 * 2. Flashcards de fixação (frente e verso).
 * 3. Questões de múltipla escolha com 4 alternativas distintas e justificativa.
 *
 * REGRA ARQUITETURAL DE COBERTURA:
 * O modelo de IA NUNCA determina o campo `cobertura`. O modelo recebe apenas a
 * janela de contexto informada no prompt e não é fonte confiável sobre a totalidade
 * do documento. A cobertura é de competência estrita e exclusiva do servidor,
 * calculada pela comparação entre `caracteresProcessados` e `totalCaracteresMaterial`.
 * ==============================================================================
 */

// ─── 1. RESUMO ESTRUTURADO ───────────────────────────────────────────────────

export const MaterialSummarySchema = z.object({
  tema_central: z
    .string({ message: "Tema central é obrigatório." })
    .trim()
    .min(5, "O tema central deve ter pelo menos 5 caracteres.")
    .max(250, "O tema central não pode exceder 250 caracteres."),
  pontos_chave: z
    .array(
      z
        .string({ message: "Ponto-chave deve ser texto." })
        .trim()
        .min(5, "Cada ponto-chave deve ter pelo menos 5 caracteres.")
        .max(300, "Cada ponto-chave não pode exceder 300 caracteres.")
    )
    .min(2, "O resumo deve conter no mínimo 2 pontos-chave.")
    .max(6, "O resumo deve conter no máximo 6 pontos-chave."),
  conteudo_markdown: z
    .string({ message: "Conteúdo estruturado em markdown é obrigatório." })
    .trim()
    .min(50, "O resumo estruturado deve ter pelo menos 50 caracteres.")
    .max(12000, "O resumo estruturado não pode exceder 12.000 caracteres."),
});

export type MaterialSummary = z.infer<typeof MaterialSummarySchema>;

// ─── 2. FLASHCARDS ───────────────────────────────────────────────────────────

/** Schema para validação do retorno bruto da IA (sem IDs arbitrários do modelo) */
export const RawMaterialFlashcardSchema = z.object({
  frente: z
    .string({ message: "A frente do flashcard é obrigatória." })
    .trim()
    .min(3, "A frente deve ter pelo menos 3 caracteres.")
    .max(300, "A frente não pode exceder 300 caracteres."),
  verso: z
    .string({ message: "O verso do flashcard é obrigatório." })
    .trim()
    .min(3, "O verso deve ter pelo menos 3 caracteres.")
    .max(600, "O verso não pode exceder 600 caracteres."),
});

/** Schema canônico entregue ao cliente (com ID seguro injetado pelo servidor) */
export const MaterialFlashcardSchema = RawMaterialFlashcardSchema.extend({
  id: z
    .string({ message: "ID do flashcard é obrigatório." })
    .trim()
    .min(1, "ID do flashcard não pode ser vazio."),
});

export type RawMaterialFlashcard = z.infer<typeof RawMaterialFlashcardSchema>;
export type MaterialFlashcard = z.infer<typeof MaterialFlashcardSchema>;

// ─── 3. QUESTÕES DE MÚLTIPLA ESCOLHA ─────────────────────────────────────────

/**
 * Validação rigorosa de 4 alternativas:
 * - Exatamente 4 itens (índices 0 a 3 correspondentes a A, B, C, D)
 * - Proibição absoluta de alternativas duplicadas
 */
const OpcoesArraySchema = z
  .array(
    z
      .string({ message: "Alternativa deve ser texto." })
      .trim()
      .min(1, "A alternativa não pode ser vazia.")
      .max(500, "A alternativa não pode exceder 500 caracteres.")
  )
  .length(4, "A questão deve possuir exatamente 4 alternativas.")
  .refine(
    (opts) => {
      const normalized = opts.map((opt) => opt.toLowerCase().trim());
      return new Set(normalized).size === opts.length;
    },
    { message: "A questão não pode conter alternativas repetidas ou duplicadas." }
  );

/** Schema para validação do retorno bruto da IA */
export const RawMaterialQuestionSchema = z.object({
  enunciado: z
    .string({ message: "Enunciado da questão é obrigatório." })
    .trim()
    .min(10, "O enunciado deve ter pelo menos 10 caracteres.")
    .max(1500, "O enunciado não pode exceder 1.500 caracteres."),
  opcoes: OpcoesArraySchema,
  corretaIdx: z
    .number({ message: "O índice da alternativa correta deve ser numérico." })
    .int("O índice da alternativa correta deve ser um número inteiro.")
    .min(0, "O índice da alternativa correta não pode ser menor que 0.")
    .max(3, "O índice da alternativa correta não pode ser maior que 3."),
  justificativa: z
    .string({ message: "A justificativa é obrigatória." })
    .trim()
    .min(10, "A justificativa deve ter pelo menos 10 caracteres.")
    .max(1500, "A justificativa não pode exceder 1.500 caracteres."),
  trecho_referencia: z
    .string()
    .trim()
    .max(1000, "O trecho de referência não pode exceder 1.000 caracteres.")
    .optional(),
});

/** Schema canônico entregue ao cliente (com ID seguro injetado pelo servidor) */
export const MaterialQuestionSchema = RawMaterialQuestionSchema.extend({
  id: z
    .string({ message: "ID da questão é obrigatório." })
    .trim()
    .min(1, "ID da questão não pode ser vazio."),
});

export type RawMaterialQuestion = z.infer<typeof RawMaterialQuestionSchema>;
export type MaterialQuestion = z.infer<typeof MaterialQuestionSchema>;

// ─── 4. SCHEMA BRUTO DA IA (INPUT DO PARSER / FIXER) ─────────────────────────

export const RawMaterialAIGenerationSchema = z.object({
  disciplina_sugerida: z.string().trim().max(80).default("Geral"),
  resumo: MaterialSummarySchema,
  flashcards: z
    .array(RawMaterialFlashcardSchema)
    .min(2, "Mínimo de 2 flashcards gerados.")
    .max(6, "Máximo de 6 flashcards gerados."),
  questoes: z
    .array(RawMaterialQuestionSchema)
    .min(2, "Mínimo de 2 questões geradas.")
    .max(5, "Máximo de 5 questões geradas."),
});

export type RawMaterialAIGeneration = z.infer<typeof RawMaterialAIGenerationSchema>;

// ─── 5. ESCOPO DE PROCESSAMENTO E CONTRATO FINAL AUTORITATIVO ────────────────

export const EscopoProcessamentoSchema = z.object({
  caracteresProcessados: z.number().int().positive("Contagem processada deve ser positiva."),
  totalCaracteresMaterial: z.number().int().positive("Total de caracteres deve ser positivo."),
  cobertura: z.enum(["integral", "recorte"]),
  observacao: z.string().optional(),
});

export type EscopoProcessamento = z.infer<typeof EscopoProcessamentoSchema>;

export const MaterialGeneratedContentSchema = z.object({
  materialId: z.string().optional(),
  titulo: z.string().trim().min(1, "Título é obrigatório.").max(120),
  disciplina: z.string().trim().max(80).default("Geral"),
  escopoProcessado: EscopoProcessamentoSchema,
  resumo: MaterialSummarySchema,
  flashcards: z
    .array(MaterialFlashcardSchema)
    .min(2, "Mínimo de 2 flashcards estruturados.")
    .max(6, "Máximo de 6 flashcards estruturados."),
  questoes: z
    .array(MaterialQuestionSchema)
    .min(2, "Mínimo de 2 questões estruturadas.")
    .max(5, "Máximo de 5 questões estruturadas."),
});

export type MaterialGeneratedContent = z.infer<typeof MaterialGeneratedContentSchema>;

// ─── 6. SCHEMA DE ENTRADA DA ROTA DE GERAÇÃO ─────────────────────────────────

export const MaterialGenerateRequestSchema = z.object({
  titulo: z
    .string({ message: "Título deve ser texto." })
    .trim()
    .min(1, "O título do material é obrigatório.")
    .max(120, "O título não pode exceder 120 caracteres.")
    .default("Material de Estudo"),
  conteudo: z
    .string({ message: "O conteúdo para geração é obrigatório." })
    .trim()
    .min(100, "O conteúdo possui menos de 100 caracteres. Mínimo necessário: 100 caracteres.")
    .max(8000, "O conteúdo excede o limite máximo de 8.000 caracteres desta etapa."),
  disciplina: z.string().trim().max(80).optional(),
  metadados: z
    .object({
      origem: z.enum(["texto", "pdf"]).optional(),
      nomeArquivo: z.string().optional(),
      tamanhoBytes: z.number().int().nonnegative().optional(),
      paginas: z.number().int().positive().optional(),
      totalCaracteresMaterial: z.number().int().positive().optional(),
      tipoExtracao: z.enum(["integral", "recorte"]).optional(),
    })
    .optional(),
});

export type MaterialGenerateRequest = z.infer<typeof MaterialGenerateRequestSchema>;

// ─── 7. FUNÇÃO AUXILIAR DE HIGIENIZAÇÃO E HIDRATAÇÃO DO SERVIDOR ─────────────

export interface BuildAuthoritativeParams {
  materialId?: string;
  titulo: string;
  totalCaracteresMaterial?: number;
  caracteresProcessados: number;
  disciplina?: string;
  tipoExtracaoDeclarado?: "integral" | "recorte";
  raw: RawMaterialAIGeneration;
  /**
   * Prova de completude apurada/verificada pelo servidor de forma confiável
   * (ex: verificação criptográfica de arquivo íntegro no backend, nunca metadados do cliente).
   */
  comprovacaoIntegralidadeServidor?: boolean;
}

/**
 * Converte a saída bruta da IA no contrato final auditado:
 * 1. Atribui IDs determinísticos gerados pelo servidor (sem confiar em IDs do modelo).
 * 2. Calcula a cobertura real de forma autoritativa e conservadora pelo servidor:
 *    - Metadados enviados pelo cliente (totalCaracteresMaterial, tipoExtracao) NUNCA comprovam integralidade.
 *    - Se comprovacaoIntegralidadeServidor !== true -> 'recorte' (padrão conservador).
 *    - Somente quando a completude é verificada no servidor e caracteresProcessados >= total -> 'integral'.
 * 3. Valida o payload resultante com o schema canônico final.
 */
export function buildAuthoritativeGeneratedMaterial(
  params: BuildAuthoritativeParams
): MaterialGeneratedContent {
  const {
    materialId,
    titulo,
    totalCaracteresMaterial,
    caracteresProcessados,
    disciplina,
    raw,
    comprovacaoIntegralidadeServidor,
  } = params;

  const prefix = materialId ? `${materialId}-` : `mat-${Date.now().toString(36)}-`;

  const total =
    totalCaracteresMaterial !== undefined && totalCaracteresMaterial > caracteresProcessados
      ? totalCaracteresMaterial
      : caracteresProcessados;

  let cobertura: "integral" | "recorte" = "recorte";
  if (
    comprovacaoIntegralidadeServidor === true &&
    caracteresProcessados >= total
  ) {
    cobertura = "integral";
  }

  const flashcards: MaterialFlashcard[] = raw.flashcards.map((fc, index) => ({
    id: `${prefix}fc-${index + 1}`,
    frente: fc.frente,
    verso: fc.verso,
  }));

  const questoes: MaterialQuestion[] = raw.questoes.map((q, index) => ({
    id: `${prefix}q-${index + 1}`,
    enunciado: q.enunciado,
    opcoes: q.opcoes,
    corretaIdx: q.corretaIdx,
    justificativa: q.justificativa,
    trecho_referencia: q.trecho_referencia,
  }));

  const content: MaterialGeneratedContent = {
    materialId,
    titulo: titulo.trim(),
    disciplina: (disciplina || raw.disciplina_sugerida || "Geral").trim(),
    escopoProcessado: {
      caracteresProcessados,
      totalCaracteresMaterial: total,
      cobertura,
      observacao:
        cobertura === "recorte"
          ? `Processado trecho de ${caracteresProcessados.toLocaleString("pt-BR")} de um total de ${total.toLocaleString("pt-BR")} caracteres.`
          : undefined,
    },
    resumo: raw.resumo,
    flashcards,
    questoes,
  };

  return MaterialGeneratedContentSchema.parse(content);
}
