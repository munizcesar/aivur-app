import { z } from "zod";

// ─── Schema completo de uma Trilha (fonte de verdade) ───────────────────────
export const TrilhaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  disciplina: z.string(),
  progresso: z.number().min(0).max(100),
  video: z.object({
    youtubeId: z.string(),
    titulo: z.string(),
    resumo: z.string(),
  }),
  flashcards: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        frente: z.string(),
        verso: z.string(),
      })
    )
    .min(3, "Mínimo de 3 flashcards por bloco para garantir fixação"),
  questoes: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        enunciado: z.string(),
        opcoes: z
          .array(z.string())
          .length(4, "Exatamente 4 alternativas para padrão de concurso"),
        corretaIdx: z.number().min(0).max(3),
        justificativa: z.string(),
      })
    )
    .min(3, "Mínimo de 3 questões por bloco de fixação"),
});

export type TrilhaTemplateType = z.infer<typeof TrilhaSchema>;

// ─── Schema de expansão adaptativa (saída da IA) ────────────────────────────
// Valida o JSON retornado pela Edge API antes de injetar no estado global.
// Se a IA alucinar o formato, o Zod barra aqui — a UI nunca vê dados malformados.
export const AIExpansionSchema = z.object({
  questoes: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        enunciado: z.string(),
        opcoes: z
          .array(z.string())
          .length(4, "Obrigatório exatamente 4 alternativas"),
        corretaIdx: z.number().min(0).max(3, "Índice deve ser entre 0 e 3"),
        justificativa: z.string(),
      })
    )
    .min(1, "A IA deve retornar pelo menos uma questão"),
  flashcards: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        frente: z.string(),
        verso: z.string(),
      })
    )
    .optional(),
});

export type AIExpansionType = z.infer<typeof AIExpansionSchema>;
