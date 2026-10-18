CREATE TABLE jornadas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  titulo_concurso TEXT NOT NULL,
  banca TEXT,
  ano INTEGER,
  cargo TEXT,
  edital_fonte_tipo TEXT NOT NULL CHECK(edital_fonte_tipo IN ('TEXTO', 'PDF')),
  edital_nome_arquivo TEXT,
  doc_original_hash TEXT NOT NULL,
  ementa_hash TEXT NOT NULL,
  versao INTEGER DEFAULT 1,
  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_jornadas_user_id
ON jornadas(user_id);

CREATE UNIQUE INDEX idx_jornadas_user_hash
ON jornadas(user_id, ementa_hash);

CREATE TABLE jornada_topicos (
  id TEXT PRIMARY KEY,
  jornada_id TEXT NOT NULL
    REFERENCES jornadas(id)
    ON DELETE CASCADE,
  disciplina TEXT NOT NULL,
  ordem_disciplina INTEGER NOT NULL DEFAULT 0,
  titulo_topico TEXT NOT NULL,
  ordem_global INTEGER NOT NULL DEFAULT 0,
  edital_item_ref TEXT,
  trilha_id TEXT
    REFERENCES trilhas(id)
    ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK(status IN ('pendente', 'em_andamento', 'concluido')),
  progresso INTEGER NOT NULL DEFAULT 0
    CHECK(progresso >= 0 AND progresso <= 100),
  concluido_em TEXT
);

CREATE INDEX idx_jornada_topicos_jornada_id
ON jornada_topicos(jornada_id);

CREATE INDEX idx_jornada_topicos_trilha_id
ON jornada_topicos(trilha_id);

CREATE UNIQUE INDEX idx_jornada_topicos_global
ON jornada_topicos(jornada_id, ordem_global);

CREATE INDEX idx_jornada_topicos_disciplina
ON jornada_topicos(jornada_id, disciplina, ordem_disciplina);
