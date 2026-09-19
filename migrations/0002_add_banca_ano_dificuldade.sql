DROP TABLE IF EXISTS questoes;
CREATE TABLE questoes (
  id TEXT PRIMARY KEY,
  disciplina TEXT NOT NULL,
  topico_id TEXT NOT NULL,
  edital_ref TEXT,
  banca TEXT,
  ano INTEGER,
  dificuldade TEXT CHECK(dificuldade IN ('FACIL','MEDIO','DIFICIL')),
  enunciado TEXT NOT NULL,
  alternativa_a TEXT NOT NULL,
  alternativa_b TEXT NOT NULL,
  alternativa_c TEXT NOT NULL,
  alternativa_d TEXT NOT NULL,
  correta TEXT NOT NULL CHECK(correta IN ('A','B','C','D')),
  justificativa TEXT NOT NULL,
  fonte_legislacao TEXT,
  prioridade TEXT CHECK(prioridade IN ('MAX','ALTA','MEDIA','COMPLEMENTAR')),
  revisado_por_humano INTEGER DEFAULT 0,
  criado_em TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_topico ON questoes(topico_id);
CREATE INDEX idx_disciplina ON questoes(disciplina);
