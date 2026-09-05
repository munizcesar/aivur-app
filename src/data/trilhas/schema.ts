/**
 * AIVUR — Schema de Produção de Trilhas
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Este arquivo é a FONTE DA VERDADE para criação de qualquer trilha no AIVUR.
 * Toda nova trilha (edital completo ou matéria avulsa) deve seguir este schema.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  REGRA DO BRASÃO                                                        │
 * │  O campo `badge` existe SOMENTE na entrada da Guarda Municipal de       │
 * │  Hortolândia. Nenhum outro edital ou matéria pode ter brasão.           │
 * │  Se criar um novo edital, NÃO inclua o campo `badge`.                  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * MODOS DE TRILHA:
 * ──────────────────
 * ● type: "edital"   → Concurso completo com N disciplinas.
 * ● type: "materia"  → Disciplina avulsa (válida para qualquer concurso).
 *
 * ANATOMIA:
 * ─────────
 *  TrilhaConfig
 *  ├── id           → slug único global (kebab-case)
 *  ├── type         → "edital" | "materia"
 *  ├── title        → Título exibido no cabeçalho da seção
 *  ├── subtitle     → Linha de apoio (ex: "Edital 2025 · 4 disciplinas")
 *  ├── badge?       → EXCLUSIVO da GM Hortolândia. Nunca usar em outros.
 *  │   ├── src      → "/badges/gm-hortolandia.png"
 *  │   ├── alt      → Texto alternativo
 *  │   └── label    → Nome curto exibido ao lado do brasão
 *  └── disciplinas  → Array de Disciplina[]
 *      └── Disciplina
 *          ├── id     → slug único dentro da trilha
 *          ├── title  → Nome da matéria
 *          └── topics → Array de Topic[]
 *              ├── id    → slug único dentro da disciplina
 *              ├── label → Texto do tópico
 *              └── done  → boolean (false = não estudado ainda)
 */

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface TrilhaTopic {
  id: string;
  label: string;
  done: boolean;
}

export interface TrilhaDisciplina {
  id: string;
  title: string;
  topics: TrilhaTopic[];
}

export interface TrilhaBadge {
  /** Caminho: /public/badges/<slug>.png */
  src: string;
  alt: string;
  label: string;
}

export interface TrilhaConfig {
  id: string;
  type: "edital" | "materia";
  title: string;
  subtitle: string;
  /**
   * EXCLUSIVO da Guarda Municipal de Hortolândia.
   * Deixe undefined em TODOS os outros editais e matérias.
   */
  badge?: TrilhaBadge;
  disciplinas: TrilhaDisciplina[];
}

// ── Catálogo de Trilhas ─────────────────────────────────────────────────────
//
// Para adicionar um novo EDITAL:  copie o bloco marcado como "EDITAL", ajuste
//   os campos id/title/subtitle/disciplinas e NÃO inclua `badge`.
//
// Para adicionar uma MATÉRIA AVULSA: use type: "materia", omita `badge`.

export const TRILHAS_CATALOG: TrilhaConfig[] = [

  // ════════════════════════════════════════════════════════════════
  // EDITAL — Guarda Municipal de Hortolândia 2025
  // ⚠ ÚNICO com brasão. Não replicar o campo `badge` em outros.
  // ════════════════════════════════════════════════════════════════
  {
    id: "gm-hortolandia-2025",
    type: "edital",
    title: "Guarda Municipal — Hortolândia",
    subtitle: "Edital 2025 · 4 disciplinas mapeadas",
    disciplinas: [
      {
        id: "port",
        title: "Língua Portuguesa",
        topics: [
          { id: "p1", label: "Interpretação e Compreensão de Textos", done: true },
          { id: "p2", label: "Tipologia e Gêneros Textuais", done: true },
          { id: "p3", label: "Ortografia — Acordo Ortográfico 2009", done: false },
          { id: "p4", label: "Concordância Nominal e Verbal", done: false },
          { id: "p5", label: "Regência Nominal e Verbal", done: false },
          { id: "p6", label: "Crase: regras e casos facultativos", done: false },
          { id: "p7", label: "Pontuação: vírgula, ponto-e-vírgula e dois-pontos", done: false },
          { id: "p8", label: "Semântica: sinonímia, antonímia e polissemia", done: false },
        ],
      },
      {
        id: "mat",
        title: "Matemática e Raciocínio Lógico",
        topics: [
          { id: "m1", label: "Operações com Números Inteiros, Racionais e Reais", done: true },
          { id: "m2", label: "Razão, Proporção e Regra de Três", done: false },
          { id: "m3", label: "Porcentagem e Juros Simples", done: false },
          { id: "m4", label: "Equações do 1° e 2° Grau", done: false },
          { id: "m5", label: "Geometria Plana: perímetro e área", done: false },
          { id: "m6", label: "Lógica Proposicional: conectivos e tabela-verdade", done: false },
          { id: "m7", label: "Sequências e Progressões Aritméticas", done: false },
          { id: "m8", label: "Probabilidade e Estatística Básica", done: false },
        ],
      },
      {
        id: "leg-municipal",
        title: "Legislação Municipal",
        topics: [
          { id: "l1", label: "Lei Orgânica do Município de Hortolândia", done: false },
          { id: "l2", label: "Estatuto da Guarda Municipal (Lei Complementar nº 01/2019)", done: false },
          { id: "l3", label: "Regimento Interno da Guarda Municipal de Hortolândia", done: false },
          { id: "l4", label: "Lei nº 13.022/2014 — Estatuto Nacional das Guardas Municipais", done: false },
          { id: "l5", label: "Código de Posturas e Ética do Servidor Municipal", done: false },
          { id: "l6", label: "Noções do Estatuto dos Servidores Públicos do Município", done: false },
        ],
      },
      {
        id: "especifico",
        title: "Conhecimentos Específicos — Guarda Municipal",
        topics: [
          { id: "e1", label: "Atribuições e Competências da Guarda Municipal", done: false },
          { id: "e2", label: "Noções de Direitos Humanos e Cidadania", done: false },
          { id: "e3", label: "Abordagem, Conduta e Uso Progressivo da Força", done: false },
          { id: "e4", label: "Noções de Primeiros Socorros", done: false },
          { id: "e5", label: "Legislação de Trânsito (CTB — Lei 9.503/97)", done: false },
          { id: "e6", label: "Estatuto do Desarmamento e Porte de Arma", done: false },
          { id: "e7", label: "Noções de Criminologia e Prevenção à Violência", done: false },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // TEMPLATE — Novo Edital (copie este bloco, NÃO adicione badge)
  // ════════════════════════════════════════════════════════════════
  //
  // {
  //   id: "slug-do-concurso-ano",
  //   type: "edital",
  //   title: "Nome do Órgão — Cargo",
  //   subtitle: "Edital AAAA · N disciplinas mapeadas",
  //   // ← Sem `badge`. Regra: somente GM Hortolândia tem brasão.
  //   disciplinas: [
  //     {
  //       id: "port",
  //       title: "Língua Portuguesa",
  //       topics: [
  //         { id: "p1", label: "Tópico 1", done: false },
  //       ],
  //     },
  //   ],
  // },

  // ════════════════════════════════════════════════════════════════
  // TEMPLATE — Matéria Avulsa (sem brasão, sem type edital)
  // ════════════════════════════════════════════════════════════════
  //
  // {
  //   id: "dir-constitucional-geral",
  //   type: "materia",
  //   title: "Direito Constitucional",
  //   subtitle: "Matéria avulsa · Válida para qualquer concurso",
  //   disciplinas: [
  //     {
  //       id: "dir-const",
  //       title: "Direito Constitucional",
  //       topics: [
  //         { id: "c1", label: "Princípios Fundamentais (arts. 1°–4°)", done: false },
  //       ],
  //     },
  //   ],
  // },
];
