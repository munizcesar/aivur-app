CREATE TABLE trilhas (
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

CREATE INDEX idx_trilhas_user_id
ON trilhas(user_id);

CREATE TABLE trilha_flashcards (
  id TEXT PRIMARY KEY,
  trilha_id TEXT NOT NULL
    REFERENCES trilhas(id)
    ON DELETE CASCADE,
  frente TEXT NOT NULL,
  verso TEXT NOT NULL
);

CREATE INDEX idx_trilha_flashcards_trilha_id
ON trilha_flashcards(trilha_id);

CREATE TABLE trilha_questoes (
  id TEXT PRIMARY KEY,
  trilha_id TEXT NOT NULL
    REFERENCES trilhas(id)
    ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  opcoes TEXT NOT NULL,
  correta_idx INTEGER NOT NULL,
  justificativa TEXT NOT NULL,
  tipo_questao TEXT DEFAULT 'MULTIPLA_ESCOLHA'
    CHECK(tipo_questao IN ('MULTIPLA_ESCOLHA','CERTO_ERRADO'))
);

CREATE INDEX idx_trilha_questoes_trilha_id
ON trilha_questoes(trilha_id);
