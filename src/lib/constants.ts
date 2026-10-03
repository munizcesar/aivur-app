export const concursosFilters: Record<string, { label: string, icon: string, description: string }> = {
  'concursos.portugues': {
    label: 'Português',
    icon: 'book-open',
    description: 'Gramática, regência, semântica, interpretação de textos',
  },
  'concursos.direito_constitucional': {
    label: 'Direito Constitucional',
    icon: 'balance-scale',
    description: 'CF/88, direitos fundamentais, poderes e federação',
  },
  'concursos.direito_administrativo': {
    label: 'Direito Administrativo',
    icon: 'briefcase',
    description: 'Administração pública, servidores, licitações, atos administrativos',
  },
  'concursos.direito_penal': {
    label: 'Direito Penal',
    icon: 'shield-check',
    description: 'Teoria do crime, crimes contra a pessoa, patrimônio, administração pública e processo penal',
  },
  'concursos.direito_processual_civil': {
    label: 'Direito Processual Civil',
    icon: 'book-open',
    description: 'Jurisdição, ação, tutelas, recursos e execução civil',
  },
  'concursos.direito_processual_penal': {
    label: 'Direito Processual Penal',
    icon: 'gavel',
    description: 'Procedimento penal, ação penal, prova, recursos e execução penal',
  },
  'concursos.direito_tributario': {
    label: 'Direito Tributário',
    icon: 'coins',
    description: 'Sistema tributário, impostos, princípios, lançamento e execução fiscal',
  },
  'concursos.direito_civil': {
    label: 'Direito Civil',
    icon: 'building',
    description: 'Contratos, responsabilidade civil, direitos reais, família e sucessões',
  },
  'concursos.direito_trabalhista': {
    label: 'Direito Trabalhista',
    icon: 'briefcase',
    description: 'Direitos do trabalhador, contrato de trabalho, jornada, rescisão e Justiça do Trabalho',
  },
  'concursos.legislacao_especifica': {
    label: 'Legislação Específica',
    icon: 'file-text',
    description: 'Leis de servidores, acesso à informação, improbidade, licitações e compliance',
  },
  'concursos.atualidades': {
    label: 'Atualidades',
    icon: 'globe-alt',
    description: 'Economia, política, tecnologia, meio ambiente e políticas públicas recentes',
  },
  'concursos.raciocinio_logico': {
    label: 'Raciocínio Lógico',
    icon: 'zap',
    description: 'Lógica formal, combinatória, probabilidade, argumentos',
  },
  'concursos.informatica': {
    label: 'Informática',
    icon: 'cpu',
    description: 'SO, redes, segurança, protocolos, bancos de dados',
  },
  'concursos.administracao_publica': {
    label: 'Administração Pública',
    icon: 'briefcase',
    description: 'Gestão pública, planejamento, Lei 8.112, Lei 14.133 (licitações)',
  },
};

export const concursoTopicMap: Record<string, string[]> = {
  'portugues': ['Compreensão e Interpretação de Texto','Ortografia e Acentuação','Concordância Nominal e Verbal','Regência Nominal e Verbal','Pontuação e Crase','Semântica e Vocabulário','Morfologia','Sintaxe da Frase','Tipologia e Gêneros Textuais','Redação Oficial'],
  'direito_constitucional': ['CF/88 — Princípios Fundamentais','Direitos e Garantias Fundamentais','Direitos Sociais','Direitos Políticos e Nacionalidade','Poder Executivo','Poder Legislativo','Poder Judiciário','Controle de Constitucionalidade','Administração Pública'],
  'direito_administrativo': ['Atos Administrativos','Processo Administrativo (Lei 9.784/99)','Servidores Públicos (Lei 8.112/90)','Licitações (Lei 8.666/93)','Nova Lei de Licitações (Lei 14.133/21)','Contratos Administrativos','Responsabilidade Civil do Estado','Improbidade Administrativa'],
  'direito_penal': ['Teoria Geral do Crime','Tipicidade e Ilicitude','Dolo e Culpa','Crime Doloso e Culposo','Crime Omissivo','Consumação e Tentativa','Homicídio e Lesões','Crimes Contra o Patrimônio','Crimes Contra a Honra','Crimes Contra a Administração Pública','Lei de Drogas e Lavagem de Dinheiro'],
  'direito_processual_penal': ['Ação Penal Pública, Privada e Condicionada','Inquérito Policial e Competência','Prisão em Flagrante e Preventiva','Provas e Nulidades','Recursos e Execução Penal'],
  'direito_tributario': ['Sistema Tributário Nacional','Princípios Tributários','Impostos, Taxas e Contribuições','Lançamento e Extinção do Crédito Tributário','Execução Fiscal e Dívida Ativa'],
  'direito_civil': ['Parte Geral do Código Civil','Contratos e Obrigações','Direitos Reais','Responsabilidade Civil','Família e Sucessões'],
  'direito_processual_civil': ['Jurisdição e Ação','Processo de Conhecimento','Tutelas Provisórias','Recursos','Execução Civil','Cumprimento de Sentença'],
  'direito_trabalhista': ['Contrato de Trabalho','Jornada e Remuneração','Direitos Trabalhistas','Estabilidade e FGTS','Processo do Trabalho'],
  'legislacao_especifica': ['Lei de Licitações e Contratos','Lei de Improbidade Administrativa','Lei de Acesso à Informação','Estatuto dos Servidores Públicos','LGPD no Setor Público','Lei de Responsabilidade Fiscal','Lei Anticorrupção e Compliance'],
  'atualidades': ['Economia e Política','Governo Digital e Cibersegurança','Sustentabilidade e Meio Ambiente','Segurança Pública','Políticas Sociais e Reformas','Geopolítica e Conflitos Internacionais','Eleições e Democracia'],
  'raciocinio_logico': ['Lógica Proposicional','Tabelas-Verdade','Diagramas Lógicos (Venn)','Sequências e Padrões','Argumentação e Inferência','Análise Combinatória','Probabilidade','Porcentagem e Proporção'],
  'informatica': ['Hardware e Software Básico','Sistemas Operacionais (Windows/Linux)','Pacote Office (Word, Excel, PowerPoint)','Internet, Redes e Protocolos','Segurança da Informação','Banco de Dados Básico','Redes de Computadores'],
  'administracao_publica': ['Princípios Constitucionais da AP','Organização Administrativa','Controle da Administração','Planejamento e Orçamento Público','Gestão de Pessoas no Setor Público','Liderança e Comportamento Organizacional','Ética no Serviço Público'],
};

export const bancas = ['Todas', 'CEBRASPE/CESPE','FCC','VUNESP','FGV','CESGRANRIO','IDECAN','IBFC','AOCP','FEPESE','QUADRIX'];

export const agencias = ['Todas', 'Receita Federal','INSS','TCU','TCE','AGU','Banco do Brasil','Caixa Econômica','BNDES','Banco Central','Correios','Petrobras','ANATEL','ANVISA','CGU','PF','PRF','DEPEN','TJ','TRF','TST','MPU','Prefeitura','Instituto Federal','Outro'];

export const niveis = [
  {v:'Todas', l:'Qualquer nível'},
  {v:'fundamental', l:'Ensino Fundamental'},
  {v:'médio', l:'Ensino Médio'},
  {v:'técnico', l:'Ensino Técnico'},
  {v:'superior', l:'Ensino Superior'},
];
