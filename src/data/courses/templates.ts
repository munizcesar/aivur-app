export interface CourseTemplate {
  id: string;
  title: string;
  category: "Segurança Pública" | "Administrativo" | "Tribunais" | "Fiscal & Bancário" | "Geral";
  badge?: string;
  description: string;
  banca?: string;
  subjectsCount: number;
  topicsCount: number;
  estimatedHours: number;
  level: "Médio" | "Superior" | "Todos";
  courseId: string;
  isReady: boolean;
  syllabusSummary: string[];
  suggestedPrompt?: string;
}

export const COURSE_TEMPLATES: CourseTemplate[] = [
  {
    id: "gm-hortolandia-2026",
    title: "Guarda Municipal Hortolândia 2026",
    category: "Segurança Pública",
    badge: "Edital Aberto",
    description: "Trilha oficial completa com cronograma de matérias, leis específicas municipais e checklist de tópicos para Guarda Civil.",
    banca: "Instituto Mais",
    subjectsCount: 5,
    topicsCount: 78,
    estimatedHours: 120,
    level: "Médio",
    courseId: "gm-hortolandia-2026",
    isReady: true,
    syllabusSummary: ["Língua Portuguesa", "Matemática e RLM", "Informática", "Legislação Municipal", "Conhecimentos Específicos"],
    suggestedPrompt: "Edital Guarda Municipal Hortolândia 2026: Português, Matemática, Informática, Legislação Municipal e Conhecimentos Específicos.",
  },
  {
    id: "pf-agente-adm",
    title: "Polícia Federal — Agente Administrativo",
    category: "Segurança Pública",
    badge: "Mais Procurado",
    description: "Plano estratégico focado nas disciplinas de base: Português, Informática, RLM, Constitucional, Administrativo e Adm. Pública.",
    banca: "Cebraspe",
    subjectsCount: 6,
    topicsCount: 92,
    estimatedHours: 160,
    level: "Médio",
    courseId: "pf-agente-adm",
    isReady: false,
    syllabusSummary: ["Língua Portuguesa", "Informática", "Raciocínio Lógico", "Direito Administrativo", "Direito Constitucional", "Administração Pública"],
    suggestedPrompt: "Concurso Polícia Federal - Agente Administrativo. Matérias: Língua Portuguesa, Noções de Informática, Raciocínio Lógico, Atualidades, Noções de Direito Administrativo, Noções de Direito Constitucional, Noções de Administração Pública, Noções de Administração Financeira e Orçamentária, Noções de Gestão de Pessoas, Noções de Arquivologia e Legislação Aplicada à PF.",
  },
  {
    id: "inss-tecnico",
    title: "INSS — Técnico do Seguro Social",
    category: "Administrativo",
    badge: "Alta Concorrência",
    description: "Foco maciço em Direito Previdenciário (Seguridade Social), Ética no Serviço Público e Legislação Previdenciária atualizada.",
    banca: "Cebraspe",
    subjectsCount: 6,
    topicsCount: 110,
    estimatedHours: 180,
    level: "Médio",
    courseId: "inss-tecnico",
    isReady: false,
    syllabusSummary: ["Seguridade Social / Direito Previdenciário", "Língua Portuguesa", "Ética no Serviço Público", "Direito Constitucional", "Direito Administrativo", "Informática"],
    suggestedPrompt: "Concurso INSS - Técnico do Seguro Social. Foco principal: Seguridade Social / Legislação Previdenciária (70 questões). Disciplinas complementares: Língua Portuguesa, Ética no Setor Público, Noções de Direito Constitucional, Noções de Direito Administrativo, Raciocínio Lógico e Informática.",
  },
  {
    id: "trt-tecnico-judiciario",
    title: "TRT — Técnico Judiciário (Área Administrativa)",
    category: "Tribunais",
    badge: "Ciclo Contínuo",
    description: "Roteiro padronizado FCC para Tribunais Regionais do Trabalho com Direito do Trabalho, Processo do Trabalho e Gestão Pública.",
    banca: "FCC",
    subjectsCount: 7,
    topicsCount: 105,
    estimatedHours: 200,
    level: "Superior",
    courseId: "trt-tecnico-judiciario",
    isReady: false,
    syllabusSummary: ["Direito do Trabalho", "Direito Processual do Trabalho", "Direito Constitucional", "Direito Administrativo", "Língua Portuguesa", "RLM", "Regimento Interno"],
    suggestedPrompt: "Concurso TRT - Técnico Judiciário - Área Administrativa. Matérias: Língua Portuguesa, Matemática e Raciocínio Lógico-Matemático, Noções de Direito Constitucional, Noções de Direito Administrativo, Noções de Direito do Trabalho, Noções de Direito Processual do Trabalho e Legislação Aplicada.",
  },
  {
    id: "receita-auditor",
    title: "Receita Federal — Auditor Fiscal",
    category: "Fiscal & Bancário",
    badge: "Nível Elite",
    description: "Trilha densa de alta complexidade: Direito Tributário, Legislação Aduaneira, Contabilidade Geral e Avançada e Auditoria Fiscal.",
    banca: "FGV",
    subjectsCount: 9,
    topicsCount: 145,
    estimatedHours: 320,
    level: "Superior",
    courseId: "receita-auditor",
    isReady: false,
    syllabusSummary: ["Direito Tributário", "Legislação Tributária e Aduaneira", "Contabilidade Geral e Avançada", "Auditoria", "Economia e Finanças Públicas", "Direito Constitucional e Adm."],
    suggestedPrompt: "Concurso Receita Federal do Brasil - Auditor Fiscal. Disciplinas: Língua Portuguesa, Língua Inglesa, Raciocínio Lógico-Matemático e Estatística, Economia e Finanças Públicas, Administração Geral e Pública, Auditoria, Contabilidade Geral e Avançada, Direito Administrativo, Direito Constitucional, Direito Previdenciário, Direito Tributário, Legislação Tributária e Legislação Aduaneira.",
  },
  {
    id: "caixa-tecnico-bancario",
    title: "Caixa Econômica — Técnico Bancário",
    category: "Fiscal & Bancário",
    badge: "Início Rápido",
    description: "Plano objetivo voltado a Conhecimentos Bancários, Atendimento/Vendas, Tecnologia da Informação e Matemática Financeira.",
    banca: "Cesgranrio",
    subjectsCount: 5,
    topicsCount: 65,
    estimatedHours: 110,
    level: "Médio",
    courseId: "caixa-tecnico-bancario",
    isReady: false,
    syllabusSummary: ["Conhecimentos Bancários", "Atendimento e Vendas", "Tecnologia da Informação", "Língua Portuguesa", "Matemática Financeira"],
    suggestedPrompt: "Concurso Caixa Econômica Federal - Técnico Bancário Novo. Matérias: Língua Portuguesa, Língua Inglesa, Matemática Financeira, Noções de Probabilidade e Estatística, Conhecimentos Bancários, Conhecimentos de Tecnologia da Informação e Comunicação, e Atendimento e Negócios.",
  },
];

export function getCourseTemplates(): CourseTemplate[] {
  return COURSE_TEMPLATES;
}

export function getTemplateById(id: string): CourseTemplate | undefined {
  return COURSE_TEMPLATES.find((t) => t.id === id || t.courseId === id);
}

