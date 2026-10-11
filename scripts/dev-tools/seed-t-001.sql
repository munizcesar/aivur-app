CREATE TABLE IF NOT EXISTS trilhas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  disciplina TEXT NOT NULL,
  video_youtube_id TEXT NOT NULL,
  video_titulo TEXT NOT NULL,
  video_resumo TEXT NOT NULL,
  video_resumo_markdown TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trilha_flashcards (
  id TEXT PRIMARY KEY,
  trilha_id TEXT NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  frente TEXT NOT NULL,
  verso TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trilha_questoes (
  id TEXT PRIMARY KEY,
  trilha_id TEXT NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  opcoes TEXT NOT NULL,
  correta_idx INTEGER NOT NULL,
  justificativa TEXT NOT NULL,
  tipo_questao TEXT DEFAULT 'MULTIPLA_ESCOLHA' CHECK(tipo_questao IN ('MULTIPLA_ESCOLHA','CERTO_ERRADO'))
);

INSERT OR REPLACE INTO trilhas (id, user_id, titulo, disciplina, video_youtube_id, video_titulo, video_resumo, video_resumo_markdown)
VALUES (
  't-001',
  'cesa.muniz@gmail.com',
  'Principios da Administracao Publica',
  'Direito Administrativo',
  'Y_m2s4TXPyM',
  'Principios LIMPE — Aula Completa',
  'Os principios constitucionais da Administracao Publica estao previstos no art. 37 da CF/88: Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiencia (LIMPE).',
  '### Princípios da Administração Pública (LIMPE)\n\nA Administração Pública direta e indireta de qualquer dos Poderes da União, dos Estados, do Distrito Federal e dos Municípios obedecerá aos princípios de legalidade, impessoalidade, moralidade, publicidade e eficiência.\n\n- **Legalidade**: O administrador só pode fazer o que a lei permite.\n- **Impessoalidade**: A administração deve ser neutra, sem favoritismos.\n- **Moralidade**: Atuação ética e de boa-fé.\n- **Publicidade**: Transparência dos atos.\n- **Eficiência**: Fazer o melhor com os recursos disponíveis (Emenda 19/98).'
);

-- Insert a couple of questions so the context works
INSERT OR REPLACE INTO trilha_questoes (id, trilha_id, enunciado, opcoes, correta_idx, justificativa, tipo_questao)
VALUES (
  'q-001-1', 't-001', 'De acordo com o principio da legalidade aplicado a Administracao Publica, o administrador publico:', 
  '["Pode fazer tudo o que a lei nao proibe expressamente.", "So pode agir quando houver expressa previsao legal.", "Tem liberdade de agir conforme seu criterio de oportunidade.", "Esta dispensado de observar a lei em situacoes de urgencia.", "Pode delegar competencias sem qualquer previsao normativa."]',
  1, 'O principio da legalidade, para o administrador publico, determina que ele so pode agir quando houver expressa previsao legal, ao contrario do particular, que pode fazer tudo o que a lei nao proibe.', 'MULTIPLA_ESCOLHA'
);

INSERT OR REPLACE INTO trilha_flashcards (id, trilha_id, frente, verso)
VALUES (
  'fc-001-1', 't-001', 'O que significa o principio da Legalidade para o administrador publico?', 'O administrador so pode fazer o que a lei expressamente autoriza — diferente do particular, que pode fazer tudo que a lei nao proibe.'
);
