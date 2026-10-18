import { z } from "zod";

export const AivuChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1, "Mensagem não pode ser vazia.").max(2000, "Mensagem histórica muito longa."),
});

export const AivuChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "A mensagem não pode ser vazia.")
    .max(1000, "A mensagem deve ter no máximo 1.000 caracteres."),
  history: z
    .array(AivuChatMessageSchema)
    .max(8, "O histórico não pode exceder 8 mensagens recentes.")
    .optional()
    .default([]),
});

export const AivuChatResponseSchema = z.object({
  reply: z.string().min(1, "Resposta não pode ser vazia."),
  state: z.enum(["speaking", "idle", "concerned", "success"]).default("speaking"),
});

export type AivuChatMessage = z.infer<typeof AivuChatMessageSchema>;
export type AivuChatRequest = z.infer<typeof AivuChatRequestSchema>;
export type AivuChatResponse = z.infer<typeof AivuChatResponseSchema>;
