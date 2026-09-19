import { z } from "zod";

const questaoBase = z.object({
  id: z.union([z.string(), z.number()]),
  enunciado: z.string(),
  justificativa: z.string(),
});

const MultiplaEscolhaSchema = questaoBase.extend({
  tipo_questao: z.literal("MULTIPLA_ESCOLHA"),
  opcoes: z.array(z.string()).min(4, "Mínimo de 4 alternativas").max(5, "Máximo de 5 alternativas"),
  corretaIdx: z.number().min(0).max(4),
}).refine(data => data.corretaIdx < data.opcoes.length, "Índice correto deve estar dentro do tamanho do array de opções");

const CertoErradoSchema = questaoBase.extend({
  tipo_questao: z.literal("CERTO_ERRADO"),
  gabarito: z.enum(["CERTO", "ERRADO"]),
});

const QuestaoSchema = z.preprocess(
  (val: any) => {
    if (!val || typeof val !== "object") return val;
    // Se não tem tipo_questao, assume MULTIPLA_ESCOLHA (compatibilidade com base legada/IndexedDB)
    if (!val.tipo_questao) {
      return { ...val, tipo_questao: "MULTIPLA_ESCOLHA" };
    }
    return val;
  },
  z.discriminatedUnion("tipo_questao", [MultiplaEscolhaSchema, CertoErradoSchema])
);

// ─── Schema completo de uma Trilha (fonte de verdade) ───────────────────────
export const TrilhaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  disciplina: z.string(),
  progresso: z.number().min(0).max(100),
  video: z.object({
    youtubeId: z.string().optional(),
    titulo: z.string(),
    resumo: z.string(),
    resumo_markdown: z.string().optional(),
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
    .array(QuestaoSchema)
    .min(3, "Mínimo de 3 questões por bloco de fixação"),
});

export type TrilhaTemplateType = z.infer<typeof TrilhaSchema>;
export type QuestaoType = z.infer<typeof QuestaoSchema>;

// ─── Schema de expansão adaptativa (saída da IA) ────────────────────────────
// Valida o JSON retornado pela Edge API antes de injetar no estado global.
// Se a IA alucinar o formato, o Zod barra aqui — a UI nunca vê dados malformados.
export const AIExpansionSchema = z.object({
  questoes: z
    .array(QuestaoSchema)
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
