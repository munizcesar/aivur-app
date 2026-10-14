# Regression Gate — Registro de mudanças da baseline

Toda adição, alteração ou remoção de caso deve ser registrada aqui (ver README, "Mudança intencional").
Formato: data · ID · tipo (ADD / CHANGE / REMOVE) · descrição · motivo · aprovado por.

## 2026-10-12 — Baseline inicial (Trilhas)

- ADD REG-TRILHAS-001 … 014 — comportamentos validados na correção do CTA e da geração por IA
  (commit `65ae983`): geração, contrato, Zod, 401, 429, 5xx/fallback, JSON truncado, Fixer, 422, limite de retries,
  salvamento e CTA.
- ADD REG-TRILHAS-015 — orçamento de tokens (entrada limitada a ~8.000 caracteres, prompt + saída cabem em 8.000 TPM,
  `max_tokens` ≥ 1.600 para não truncar a trilha), validado na mesma tarefa.
- Notas: REG-006 e REG-013 têm partes MANUAIS documentadas no README. O login não consome `?redirect=` (lacuna conhecida).

## 2026-10-13 — Fase 1 (Meu Material: Importação Real)

- ADD REG-MAT-001 … 005 (camada API): validação de limites de texto colado (100 a 8.000 chars), prevenção contra truncamento silencioso, validação de arquivo (extensão .pdf e teto de 10MB), extração de PDF válido com contagem real de páginas/caracteres e tratamento defensivo (PDF vazio, corrompido ou scan sem camada de texto).
- ADD REG-MAT-006 (camada Navegador): validação da interface `/material`, alternância de abas (PDF vs Texto), contador de caracteres em tempo real, visualização de conferência e garantia de ausência de chamadas à IA ou persistência na Fase 1.
