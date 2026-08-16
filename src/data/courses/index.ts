/**
 * AIVUR — Registro Central de Cursos / Trilhas
 * ============================================
 *
 * Como adicionar um novo curso:
 * 1. Crie um arquivo em `src/data/courses/<id-do-curso>.ts`
 *    - Seguindo o tipo `Course` de `@/types/course`
 *    - O campo `id` deve ser único e em kebab-case (ex: "pm-campinas-2026")
 *    - Cada `CourseTopic.id` deve ser FIXO e único globalmente:
 *      formato: `<id-curso>_<materia>_<nicho>_<seq>`
 *      ex: "pm-campinas_portugues_fonetica_01"
 *    - Não use índices de array como IDs — eles mudam se o array for reordenado.
 *
 * 2. Importe o curso aqui e adicione-o ao array `ALL_COURSES`.
 *
 * 3. Pronto — o curso aparecerá automaticamente em /mentor.
 *
 * Fonte do conteúdo: sempre usar o edital oficial ou lista de tópicos
 * fornecida explicitamente. Nunca inventar ou estimar conteúdo programático.
 */

import type { Course } from "@/types/course";
import { gmHortolandia2026 } from "./gm-hortolandia-2026";

export const ALL_COURSES: Course[] = [
  gmHortolandia2026,
  // Adicione novos cursos aqui:
  // policiaFederal2026,
  // pmSaoPaulo2027,
];
