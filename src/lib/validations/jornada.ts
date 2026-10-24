import { z } from "zod";

export const TopicoDraftSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, "O título do tópico deve ter no mínimo 3 caracteres")
    .max(180, "O título do tópico deve ter no máximo 180 caracteres"),
  edital_item_ref: z
    .string()
    .trim()
    .max(60, "Referência ao item do edital não deve exceder 60 caracteres")
    .optional(),
});

export const DisciplinaDraftSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome da disciplina deve ter no mínimo 2 caracteres")
    .max(100, "Nome da disciplina deve ter no máximo 100 caracteres"),
  topicos: z
    .array(TopicoDraftSchema)
    .min(1, "A disciplina deve conter pelo menos 1 tópico")
    .max(30, "Limite defensivo de 30 tópicos por disciplina"),
}).refine(
  (data) => {
    const titles = data.topicos.map((t) => t.titulo.toLowerCase());
    return new Set(titles).size === titles.length;
  },
  { message: "A disciplina não pode conter tópicos com títulos repetidos" }
);

export const JornadaEmentaSchema = z.object({
  titulo_concurso: z
    .string()
    .trim()
    .min(3, "Título do concurso deve ter no mínimo 3 caracteres")
    .max(150, "Título do concurso deve ter no máximo 150 caracteres"),
  banca: z.string().trim().max(80).optional(),
  ano: z.number().int().min(2020).max(2035).optional(),
  cargo: z.string().trim().max(100).optional(),
  edital_hash: z
    .string()
    .trim()
    .regex(/^[0-9a-f]{64}$/i, "Hash SHA-256 do edital deve conter 64 caracteres hexadecimais")
    .optional(),
  disciplinas: z
    .array(DisciplinaDraftSchema)
    .min(1, "O edital deve conter pelo menos 1 disciplina")
    .max(15, "Teto defensivo de 15 disciplinas por jornada"),
});

export type JornadaEmentaType = z.infer<typeof JornadaEmentaSchema>;
export type DisciplinaDraftType = z.infer<typeof DisciplinaDraftSchema>;
export type TopicoDraftType = z.infer<typeof TopicoDraftSchema>;

export const GerarJornadaRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Título do concurso deve ter no mínimo 3 caracteres")
    .max(150, "Título do concurso deve ter no máximo 150 caracteres"),
  text: z
    .string()
    .trim()
    .min(50, "Conteúdo insuficiente do edital. Forneça ao menos 50 caracteres.")
    .max(15000, "Conteúdo excede o limite máximo de 15.000 caracteres para estruturação."),
  banca: z.string().trim().max(80).optional(),
  ano: z.number().int().min(2020).max(2035).optional(),
  cargo: z.string().trim().max(100).optional(),
  bloco_inicio: z.number().int().min(1).optional(),
  edital_hash: z
    .string()
    .trim()
    .regex(/^[0-9a-f]{64}$/i, "Hash SHA-256 do edital deve conter 64 caracteres hexadecimais")
    .optional(),
  conteudo_parcial: z.lazy(() => JornadaEmentaSchema).optional(),
});

export type GerarJornadaRequestType = z.infer<typeof GerarJornadaRequestSchema>;

export const CriarJornadaRequestSchema = JornadaEmentaSchema.extend({
  edital_fonte_tipo: z.enum(["TEXTO", "PDF"]),
  edital_nome_arquivo: z.string().trim().max(255).optional(),
  doc_original_hash: z.string().length(64, "Hash SHA-256 do documento original inválido"),
  ementa_hash: z.string().length(64, "Hash SHA-256 da ementa normalizada inválido"),
});

export type CriarJornadaRequestType = z.infer<typeof CriarJornadaRequestSchema>;

export interface JornadaTopicoDB {
  id: string;
  jornada_id: string;
  disciplina: string;
  ordem_disciplina: number;
  titulo_topico: string;
  ordem_global: number;
  edital_item_ref?: string | null;
  trilha_id?: string | null;
  status: "pendente" | "em_andamento" | "concluido";
  progresso: number;
  concluido_em?: string | null;
}

export interface JornadaDB {
  id: string;
  user_id: string;
  titulo_concurso: string;
  banca?: string | null;
  ano?: number | null;
  cargo?: string | null;
  edital_fonte_tipo: "TEXTO" | "PDF";
  edital_nome_arquivo?: string | null;
  doc_original_hash: string;
  ementa_hash: string;
  versao: number;
  criado_em: string;
  atualizado_em: string;
  topicos?: JornadaTopicoDB[];
  progresso_geral?: number;
}
