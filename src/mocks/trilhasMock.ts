// Mock data for the Trilhas module — simulates API return

export interface TrilhaVideo {
  youtubeId: string;
  titulo: string;
  resumo: string;
}

export interface TrilhaFlashcard {
  id: string;
  frente: string;
  verso: string;
}

export interface TrilhaQuestao {
  id: string;
  enunciado: string;
  opcoes: string[];
  corretaIdx: number;
  justificativa: string;
}

export interface Trilha {
  id: string;
  titulo: string;
  disciplina: string;
  progresso: number;
  video: TrilhaVideo;
  flashcards: TrilhaFlashcard[];
  questoes: TrilhaQuestao[];
}

export const TRILHAS_MOCK: Trilha[] = [
  {
    id: "t-001",
    titulo: "Principios da Administracao Publica",
    disciplina: "Direito Administrativo",
    progresso: 72,
    video: {
      youtubeId: "dQw4w9WgXcQ",
      titulo: "Principios LIMPE — Aula Completa",
      resumo: "Os principios constitucionais da Administracao Publica estao previstos no art. 37 da CF/88: Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiencia (LIMPE).",
    },
    flashcards: [
      { id: "fc-001-1", frente: "O que significa o principio da Legalidade para o administrador publico?", verso: "O administrador so pode fazer o que a lei expressamente autoriza — diferente do particular, que pode fazer tudo que a lei nao proibe." },
      { id: "fc-001-2", frente: "O principio da Impessoalidade tem dois sentidos. Quais sao?", verso: "1) Finalidade: o ato deve visar ao interesse publico, nao ao agente. 2) Imputacao: os atos sao da Administracao, nao do agente que os pratica." },
      { id: "fc-001-3", frente: "Qual e a diferenca entre Moralidade e Legalidade na Administracao Publica?", verso: "Um ato pode ser legal e imoral. A moralidade exige que o agente atue com honestidade e boa-fe, alem de observar a lei." },
      { id: "fc-001-4", frente: "Publicidade: quando ela pode ser restringida?", verso: "Quando a lei impuser sigilo necessario a seguranca da sociedade e do Estado (art. 5, XXXIII da CF) ou quando a intimidade exigir protecao." },
      { id: "fc-001-5", frente: "O principio da Eficiencia foi inserido na CF por qual emenda?", verso: "Emenda Constitucional nr 19/1998 (Reforma Administrativa do Estado)." },
    ],
    questoes: [
      { id: "q-001-1", enunciado: "De acordo com o principio da legalidade aplicado a Administracao Publica, o administrador publico:", opcoes: ["Pode fazer tudo o que a lei nao proibe expressamente.", "So pode agir quando houver expressa previsao legal.", "Tem liberdade de agir conforme seu criterio de oportunidade.", "Esta dispensado de observar a lei em situacoes de urgencia.", "Pode delegar competencias sem qualquer previsao normativa."], corretaIdx: 1, justificativa: "O principio da legalidade, para o administrador publico, determina que ele so pode agir quando houver expressa previsao legal, ao contrario do particular, que pode fazer tudo o que a lei nao proibe." },
      { id: "q-001-2", enunciado: "O principio que impede o administrador de usar o cargo para promocao pessoal e o da:", opcoes: ["Legalidade", "Moralidade", "Impessoalidade", "Eficiencia", "Publicidade"], corretaIdx: 2, justificativa: "O principio da Impessoalidade veda a promocao pessoal em detrimento do interesse publico." },
      { id: "q-001-3", enunciado: "A exigencia de que os atos administrativos sejam divulgados para produzirem efeitos perante terceiros decorre do principio da:", opcoes: ["Moralidade", "Legalidade", "Eficiencia", "Publicidade", "Razoabilidade"], corretaIdx: 3, justificativa: "O principio da Publicidade determina que os atos administrativos devem ser divulgados para ter eficacia perante terceiros." },
      { id: "q-001-4", enunciado: "Qual emenda constitucional inseriu o principio da Eficiencia no art. 37 da Constituicao Federal?", opcoes: ["EC nr 19/1998", "EC nr 45/2004", "EC nr 32/2001", "EC nr 41/2003", "EC nr 95/2016"], corretaIdx: 0, justificativa: "A EC nr 19/1998 (Reforma Administrativa) acrescentou o principio da Eficiencia ao art. 37 da CF/88." },
      { id: "q-001-5", enunciado: "Um agente publico pratica ato formalmente legal, mas com desvio de finalidade. Qual principio foi violado?", opcoes: ["Publicidade", "Eficiencia", "Legalidade", "Impessoalidade", "Razoabilidade"], corretaIdx: 3, justificativa: "O principio da Impessoalidade exige que o administrador atue visando exclusivamente ao interesse publico. O desvio de finalidade viola este principio." },
    ],
  },
  {
    id: "t-002",
    titulo: "Interpretacao de Textos",
    disciplina: "Lingua Portuguesa",
    progresso: 45,
    video: {
      youtubeId: "dQw4w9WgXcQ",
      titulo: "Interpretacao e Inferencia — Tecnicas para Concursos",
      resumo: "A interpretacao de textos exige identificar tema, ideia central e intencao do autor. Nas bancas, as questoes testam inferencia e distinguir informacoes implicitas das explicitas.",
    },
    flashcards: [
      { id: "fc-002-1", frente: "Qual a diferenca entre informacao explicita e implicita em um texto?", verso: "Explicita: esta claramente escrita no texto. Implicita: pode ser inferida a partir do que esta escrito, mas nao esta dita diretamente." },
      { id: "fc-002-2", frente: "O que e inferencia na interpretacao de textos?", verso: "E o processo de chegar a uma conclusao que nao esta explicitamente no texto, mas pode ser logicamente deduzida a partir das informacoes fornecidas." },
      { id: "fc-002-3", frente: "O que sao marcadores de oposicao e como afetam a interpretacao?", verso: "Conectivos como 'mas', 'porem', 'entretanto', 'contudo' indicam contraste — a ideia principal geralmente vem apos eles." },
    ],
    questoes: [
      { id: "q-002-1", enunciado: "Em questoes que pedem o 'sentido geral do texto', o candidato deve identificar:", opcoes: ["O vocabulario mais dificil utilizado.", "A tese ou ideia central defendida ao longo do texto.", "O numero de paragrafos e a estrutura formal.", "Os nomes proprios e datas citados.", "O estilo literario do autor."], corretaIdx: 1, justificativa: "O sentido geral do texto e sua ideia central ou tese — o que o autor defende ao longo de toda a leitura." },
      { id: "q-002-2", enunciado: "Quando a questao pede para identificar uma informacao 'inferida' no texto, o candidato deve:", opcoes: ["Copiar uma frase que aparece literalmente no texto.", "Buscar informacao em fontes externas.", "Deduzir uma conclusao a partir das pistas do proprio texto.", "Ignorar as informacoes implicitas.", "Escolher a alternativa mais longa."], corretaIdx: 2, justificativa: "Inferencia e a habilidade de deduzir, com base nas pistas do texto, uma conclusao que nao esta escrita diretamente." },
      { id: "q-002-3", enunciado: "O conectivo 'contudo' indica qual relacao logica entre as oracoes?", opcoes: ["Adicao", "Causa", "Oposicao/Adversidade", "Conclusao", "Condicionalidade"], corretaIdx: 2, justificativa: "'Contudo' e um conectivo adversativo — indica oposicao ou contraste entre as ideias das oracoes." },
    ],
  },
  {
    id: "t-003",
    titulo: "Direitos e Garantias Fundamentais",
    disciplina: "Direito Constitucional",
    progresso: 20,
    video: {
      youtubeId: "dQw4w9WgXcQ",
      titulo: "Direitos Fundamentais — CF/88 Art. 5",
      resumo: "O art. 5 da CF/88 consagra os direitos e garantias fundamentais. Sao clausulas petreas (art. 60, par. 4), nao podendo ser abolidos por emenda constitucional.",
    },
    flashcards: [
      { id: "fc-003-1", frente: "O que sao clausulas petreas e qual a sua relacao com os direitos fundamentais?", verso: "Clausulas petreas sao dispositivos imutaveis da CF (art. 60, par. 4) que nao podem ser abolidos nem por emenda. Os direitos e garantias individuais sao clausulas petreas." },
      { id: "fc-003-2", frente: "Qual e o principio que garante tratamento igual a todos perante a lei?", verso: "Principio da Isonomia (art. 5, caput): 'Todos sao iguais perante a lei, sem distincao de qualquer natureza.' Tambem chamado de igualdade formal." },
      { id: "fc-003-3", frente: "O que e o habeas corpus e quando e cabivel?", verso: "E remedio constitucional (art. 5, LXVIII) cabivel quando alguem sofrer ou se achar ameacado de sofrer violencia ou coacsao em sua liberdade de locomocao." },
    ],
    questoes: [
      { id: "q-003-1", enunciado: "Nos termos da CF/88, os direitos e garantias individuais sao considerados:", opcoes: ["Normas programaticas, dependentes de regulamentacao infraconstitucional.", "Clausulas petreas, nao podendo ser abolidos nem por emenda constitucional.", "Normas de eficacia limitada, aplicaveis apenas quando regulamentadas.", "Diretrizes, podendo ser suprimidos por lei complementar.", "Principios gerais, flexiveis conforme a realidade social."], corretaIdx: 1, justificativa: "O art. 60, par.4, IV da CF/88 estabelece que os direitos e garantias individuais sao clausulas petreas — nao podem ser abolidos nem pela via da emenda constitucional." },
      { id: "q-003-2", enunciado: "O habeas corpus e remedio constitucional adequado para proteger:", opcoes: ["O direito a informacao de interesse particular.", "A liberdade de locomocao ameacada por ilegalidade ou abuso de poder.", "Direitos liquidos e certos ameacados por ato de autoridade.", "O conhecimento de informacoes de interesse coletivo.", "O direito de peticao aos orgaos publicos."], corretaIdx: 1, justificativa: "O habeas corpus (art. 5, LXVIII da CF) protege a liberdade de locomocao quando ameacada ou violada por ilegalidade ou abuso de poder." },
    ],
  },
  {
    id: "t-004",
    titulo: "Raciocinio Logico — Proposicoes",
    disciplina: "Raciocinio Logico",
    progresso: 0,
    video: {
      youtubeId: "dQw4w9WgXcQ",
      titulo: "Proposicoes e Conectivos Logicos",
      resumo: "Uma proposicao e uma afirmacao que pode ser verdadeira (V) ou falsa (F). Os conectivos (e, ou, se...entao, nao) combinam proposicoes formando novas, com valor logico calculavel pelas tabelas-verdade.",
    },
    flashcards: [
      { id: "fc-004-1", frente: "O que e uma proposicao logica?", verso: "E uma sentenca declarativa que pode ser classificada como verdadeira (V) ou falsa (F), nunca as duas ao mesmo tempo." },
      { id: "fc-004-2", frente: "A conjuncao (p e q) e verdadeira em que caso?", verso: "Somente quando AMBAS as proposicoes (p e q) forem verdadeiras. Se pelo menos uma for falsa, a conjuncao e falsa." },
      { id: "fc-004-3", frente: "A disjuncao inclusiva (p ou q) e falsa em que caso?", verso: "Somente quando AMBAS as proposicoes (p e q) forem falsas. Se pelo menos uma for verdadeira, a disjuncao e verdadeira." },
    ],
    questoes: [
      { id: "q-004-1", enunciado: "Considerando p = V e q = F, qual e o valor logico da proposicao composta p e q?", opcoes: ["Verdadeiro", "Falso", "Indeterminado", "Depende do contexto", "Tautologia"], corretaIdx: 1, justificativa: "A conjuncao (p e q) so e verdadeira quando ambas as proposicoes sao verdadeiras. Como q = F, o resultado e Falso." },
      { id: "q-004-2", enunciado: "Considerando p = F e q = F, qual e o valor logico da proposicao composta p ou q?", opcoes: ["Verdadeiro", "Falso", "Indeterminado", "Tautologia", "Contradicao"], corretaIdx: 1, justificativa: "A disjuncao inclusiva (p ou q) e falsa apenas quando ambas as proposicoes sao falsas. Como p = F e q = F, o resultado e Falso." },
    ],
  },
];

export const QUESTOES_IA_EXTRA: TrilhaQuestao[] = [
  { id: "q-ia-001", enunciado: "Qual dos seguintes principios administrativos esta diretamente relacionado a exigencia de motivacao dos atos administrativos?", opcoes: ["Publicidade", "Legalidade", "Eficiencia", "Moralidade", "Impessoalidade"], corretaIdx: 3, justificativa: "A motivacao dos atos administrativos esta ligada ao principio da Moralidade e da Publicidade — o agente deve expor as razoes do ato, permitindo o controle pela sociedade." },
  { id: "q-ia-002", enunciado: "O principio que proibe a Administracao de agir por simples capricho, devendo haver proporcionalidade entre meios e fins, e o da:", opcoes: ["Legalidade estrita", "Razoabilidade e Proporcionalidade", "Eficiencia", "Publicidade", "Supremacia do interesse publico"], corretaIdx: 1, justificativa: "O principio da Razoabilidade/Proporcionalidade exige que os atos administrativos sejam adequados, necessarios e proporcionais aos seus objetivos." },
  { id: "q-ia-003", enunciado: "A vedacao a Administracao de renunciar a competencias que lhe foram atribuidas por lei decorre do principio da:", opcoes: ["Continuidade do servico publico", "Indisponibilidade do interesse publico", "Autotutela", "Hierarquia", "Presuncao de legitimidade"], corretaIdx: 1, justificativa: "O principio da Indisponibilidade do Interesse Publico determina que o administrador nao pode renunciar a competencias da Administracao, pois pertencem a coletividade." },
];
