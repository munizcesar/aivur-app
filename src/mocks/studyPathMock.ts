export type StudyTopicStatus = "completed" | "in_progress" | "locked";

export interface StudyTopic {
  id: string;
  titulo: string;
  status: StudyTopicStatus;
}

export interface StudyModule {
  id: string;
  titulo: string;
  subtitulo: string;
  progresso: number;
  subtópicos: StudyTopic[];
}

export interface StudyPathMock {
  titulo_curso: string;
  progresso_geral: number;
  modulos: StudyModule[];
}

const studyPathMock: StudyPathMock = {
  titulo_curso: "Analista Administrativo — Prefeitura de Limeira 2026",
  progresso_geral: 38,
  modulos: [
    {
      id: "modulo-01",
      titulo: "Língua Portuguesa",
      subtitulo: "Interpretação, gramática e redação oficial",
      progresso: 67,
      subtópicos: [
        { id: "port-01", titulo: "Interpretação de textos", status: "completed" },
        { id: "port-02", titulo: "Coesão e coerência", status: "completed" },
        { id: "port-03", titulo: "Pontuação e sintaxe", status: "in_progress" },
        { id: "port-04", titulo: "Redação oficial", status: "locked" },
      ],
    },
    {
      id: "modulo-02",
      titulo: "Direito Administrativo",
      subtitulo: "Princípios, atos e organização administrativa",
      progresso: 42,
      subtópicos: [
        { id: "adm-01", titulo: "Princípios da Administração Pública", status: "completed" },
        { id: "adm-02", titulo: "Atos administrativos", status: "in_progress" },
        { id: "adm-03", titulo: "Poderes administrativos", status: "locked" },
        { id: "adm-04", titulo: "Licitações e contratos", status: "locked" },
      ],
    },
    {
      id: "modulo-03",
      titulo: "Direito Constitucional",
      subtitulo: "Constituição Federal e direitos fundamentais",
      progresso: 25,
      subtópicos: [
        { id: "const-01", titulo: "Princípios fundamentais", status: "completed" },
        { id: "const-02", titulo: "Direitos e garantias fundamentais", status: "in_progress" },
        { id: "const-03", titulo: "Organização dos Poderes", status: "locked" },
        { id: "const-04", titulo: "Administração Pública na CF/88", status: "locked" },
      ],
    },
    {
      id: "modulo-04",
      titulo: "Conhecimentos Específicos",
      subtitulo: "Rotinas administrativas e gestão pública",
      progresso: 0,
      subtópicos: [
        { id: "esp-01", titulo: "Gestão de processos", status: "locked" },
        { id: "esp-02", titulo: "Atendimento ao cidadão", status: "locked" },
        { id: "esp-03", titulo: "Arquivologia aplicada", status: "locked" },
      ],
    },
  ],
};

export default studyPathMock;
