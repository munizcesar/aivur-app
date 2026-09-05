export interface Alternative {
  id: string;
  texto: string;
}

export interface Question {
  id: string;
  enunciado: string;
  alternativas: Alternative[];
  correta: string;
  explicacao: string;
  format?: "multiple_choice" | "true_false";
}

export const cockpitQuestions: Question[] = [
  {
    id: "cockpit-q1",
    enunciado: "Qual princípio orienta a atuação da Administração Pública conforme o caput do art. 37 da Constituição Federal?",
    alternativas: [
      { id: "A", texto: "Legalidade, impessoalidade, moralidade, publicidade e eficiência." },
      { id: "B", texto: "Autonomia, soberania, cidadania, pluralismo e igualdade." },
      { id: "C", texto: "Oralidade, informalidade, economia e celeridade." },
      { id: "D", texto: "Contraditório, ampla defesa, juiz natural e presunção de inocência." },
    ],
    correta: "A",
    explicacao: "O art. 37, caput, reúne os princípios LIMPE: legalidade, impessoalidade, moralidade, publicidade e eficiência.",
  },
  {
    id: "cockpit-q2",
    enunciado: "No processo administrativo, a motivação dos atos públicos contribui principalmente para:",
    alternativas: [
      { id: "A", texto: "Eliminar a necessidade de controle pelos interessados." },
      { id: "B", texto: "Demonstrar os fundamentos da decisão e permitir seu controle." },
      { id: "C", texto: "Substituir a publicação oficial do ato administrativo." },
      { id: "D", texto: "Restringir o acesso do cidadão aos documentos públicos." },
    ],
    correta: "B",
    explicacao: "A motivação apresenta os fatos e fundamentos jurídicos da decisão, permitindo transparência e controle do ato administrativo.",
  },
  {
    id: "cockpit-q3",
    enunciado: "A publicidade dos atos administrativos tem como finalidade essencial:",
    alternativas: [
      { id: "A", texto: "Garantir transparência e eficácia externa aos atos, quando exigida." },
      { id: "B", texto: "Permitir que todo ato seja mantido em sigilo permanente." },
      { id: "C", texto: "Dispensar a Administração de prestar informações." },
      { id: "D", texto: "Transferir a decisão administrativa para o Poder Judiciário." },
    ],
    correta: "A",
    explicacao: "A publicidade assegura transparência e, quando exigida, dá eficácia externa aos atos administrativos.",
  },
  {
    id: "cockpit-q4",
    format: "true_false",
    enunciado: "A eficiência, como princípio constitucional da Administração Pública, exige que o agente público atue com presteza, perfeição e rendimento funcional, podendo ser aferida tanto no exercício de atividades-meio quanto das atividades-fim.",
    alternativas: [
      { id: "C", texto: "Certo" },
      { id: "E", texto: "Errado" },
    ],
    correta: "C",
    explicacao: "O princípio da eficiência, inserido pela EC 19/1998, impõe ao agente público o dever de atuar com presteza, perfeição e rendimento funcional, aplicando-se tanto às atividades-meio quanto às atividades-fim da Administração.",
  },
];
