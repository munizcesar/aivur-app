import { z } from "zod";

export const MATERIAL_LIMITS = {
  MIN_CHARS: 100,
  MAX_CHARS: 8000,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: [".pdf"],
  ALLOWED_MIME_TYPES: ["application/pdf", "application/x-pdf"],
} as const;

export const MaterialContentSchema = z
  .string({ message: "O conteúdo é obrigatório." })
  .trim()
  .min(MATERIAL_LIMITS.MIN_CHARS, {
    message: `O conteúdo possui menos de ${MATERIAL_LIMITS.MIN_CHARS} caracteres. Mínimo necessário: ${MATERIAL_LIMITS.MIN_CHARS} caracteres.`,
  })
  .max(MATERIAL_LIMITS.MAX_CHARS, {
    message: `O conteúdo excede o limite máximo de ${MATERIAL_LIMITS.MAX_CHARS} caracteres desta etapa.`,
  });

export const MaterialImportSchema = z.object({
  origem: z.enum(["texto", "pdf"]),
  titulo: z
    .string()
    .trim()
    .min(1, "O título do material é obrigatório.")
    .max(120, "O título não pode exceder 120 caracteres."),
  conteudo: MaterialContentSchema,
  metadados: z.object({
    nomeArquivo: z.string().optional(),
    tamanhoBytes: z.number().int().nonnegative().optional(),
    paginas: z.number().int().positive().optional(),
    caracteres: z.number().int().positive(),
  }),
});

export type MaterialImportInput = z.infer<typeof MaterialImportSchema>;

export type ValidationStatus = "idle" | "empty" | "too_short" | "valid" | "too_long";

export interface ValidationFeedback {
  status: ValidationStatus;
  charCount: number;
  isValid: boolean;
  message: string;
}

export function evaluateContentLimits(content: string): ValidationFeedback {
  const trimmed = (content || "").trim();
  const charCount = trimmed.length;

  if (charCount === 0) {
    return {
      status: "empty",
      charCount: 0,
      isValid: false,
      message: "O conteúdo não pode estar vazio.",
    };
  }

  if (charCount < MATERIAL_LIMITS.MIN_CHARS) {
    return {
      status: "too_short",
      charCount,
      isValid: false,
      message: `Conteúdo insuficiente: ${charCount} caracteres informados (mínimo exigido: ${MATERIAL_LIMITS.MIN_CHARS}).`,
    };
  }

  if (charCount > MATERIAL_LIMITS.MAX_CHARS) {
    return {
      status: "too_long",
      charCount,
      isValid: false,
      message: `Limite de ${MATERIAL_LIMITS.MAX_CHARS.toLocaleString("pt-BR")} caracteres excedido (${charCount.toLocaleString("pt-BR")} caracteres). O documento não foi truncado silenciosamente.`,
    };
  }

  return {
    status: "valid",
    charCount,
    isValid: true,
    message: `Conteúdo válido: ${charCount.toLocaleString("pt-BR")} caracteres prontos para conferência.`,
  };
}
