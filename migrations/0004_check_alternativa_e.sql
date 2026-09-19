-- 1. Backup local da tabela (se existirem dados)
CREATE TABLE questoes_temp AS SELECT * FROM questoes;

-- 2. Drop dos índices e da tabela
DROP INDEX IF EXISTS idx_topico;
DROP INDEX IF EXISTS idx_disciplina;
DROP TABLE questoes;

-- 3. Nova tabela com suporte flexível
CREATE TABLE questoes (
  id TEXT PRIMARY KEY,
  disciplina TEXT NOT NULL,
  topico_id TEXT NOT NULL,
  edital_ref TEXT,
  banca TEXT,
  ano INTEGER,
  dificuldade TEXT CHECK(dificuldade IN ('FACIL','MEDIO','DIFICIL')),
  enunciado TEXT NOT NULL,
  
  tipo_questao TEXT NOT NULL DEFAULT 'MULTIPLA_ESCOLHA' CHECK(tipo_questao IN ('MULTIPLA_ESCOLHA','CERTO_ERRADO')),
  alternativa_a TEXT,
  alternativa_b TEXT,
  alternativa_c TEXT,
  alternativa_d TEXT,
  alternativa_e TEXT,
  
  correta TEXT NOT NULL,
  
  justificativa TEXT NOT NULL,
  fonte_legislacao TEXT,
  prioridade TEXT CHECK(prioridade IN ('MAX','ALTA','MEDIA','COMPLEMENTAR')),
  revisado_por_humano INTEGER DEFAULT 0,
  criado_em TEXT DEFAULT (datetime('now')),
  
  -- Novo CHECK corrigido: exige alternativa_e se correta for 'E'
  CHECK (
    (tipo_questao = 'MULTIPLA_ESCOLHA' AND alternativa_a IS NOT NULL AND alternativa_b IS NOT NULL AND alternativa_c IS NOT NULL AND alternativa_d IS NOT NULL AND correta IN ('A','B','C','D','E') AND (correta <> 'E' OR alternativa_e IS NOT NULL))
    OR
    (tipo_questao = 'CERTO_ERRADO' AND alternativa_a IS NULL AND alternativa_b IS NULL AND alternativa_c IS NULL AND alternativa_d IS NULL AND alternativa_e IS NULL AND correta IN ('CERTO','ERRADO'))
  )
);

-- 4. Inserir dados de volta da temp
INSERT INTO questoes (id, disciplina, topico_id, edital_ref, banca, ano, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, correta, justificativa, fonte_legislacao, prioridade, revisado_por_humano, criado_em, tipo_questao)
SELECT id, disciplina, topico_id, edital_ref, banca, ano, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, correta, justificativa, fonte_legislacao, prioridade, revisado_por_humano, criado_em, tipo_questao
FROM questoes_temp;

-- 5. Recriar índices
CREATE INDEX idx_topico ON questoes(topico_id);
CREATE INDEX idx_disciplina ON questoes(disciplina);

-- 6. Limpeza
DROP TABLE questoes_temp;
