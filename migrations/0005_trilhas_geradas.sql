-- migrations/0005_trilhas_geradas.sql
-- Tabela de trilhas geradas por usuário (hub multi-tenant)
-- is_public = 0 para trilhas do usuário, 1 para cursos oficiais da plataforma

CREATE TABLE IF NOT EXISTS trilhas_geradas (
  id            TEXT    PRIMARY KEY,
  user_id       TEXT    NOT NULL,
  titulo        TEXT    NOT NULL,
  disciplina    TEXT    NOT NULL,
  source_type   TEXT    CHECK(source_type IN ('youtube','text','edital','system')) DEFAULT 'text',
  is_public     INTEGER NOT NULL DEFAULT 0 CHECK(is_public IN (0, 1)),
  progress_json TEXT    NOT NULL,  -- JSON completo da TrilhaTemplateType validado por Zod
  created_at    INTEGER NOT NULL   -- Unix timestamp em ms
);

CREATE INDEX IF NOT EXISTS idx_trilhas_user   ON trilhas_geradas(user_id);
CREATE INDEX IF NOT EXISTS idx_trilhas_public ON trilhas_geradas(is_public, created_at DESC);

-- Tabela de progresso global por usuário (usada pelo /api/sync/push)
CREATE TABLE IF NOT EXISTS user_progress (
  user_id       TEXT    PRIMARY KEY,
  progress_json TEXT    NOT NULL,
  updated_at    INTEGER NOT NULL
);
