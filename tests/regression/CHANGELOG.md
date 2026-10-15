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

## 2026-10-14 — Fase 2 (Meu Material: Contratos Zod e Rota de Síntese de IA)

- ADD REG-MAT-007 … 008 (camada Contratos/API): validação dos schemas Zod (`material-ai.ts`) para resumo (tema central, pontos-chave, markdown), flashcards (frente/verso) e questões (4 alternativas distintas, sem duplicatas, corretaIdx 0..3 e justificativa); garantia de que IDs e o campo `cobertura` são calculados autoritativamente pelo servidor e não aceitos cegamente da IA.
- ADD REG-MAT-009 … 013 (camada API): rota Edge `/api/ai/material/gerar`: autenticação 401 pré-IA, validação Zod de entrada (400 para texto vazio, <100 ou >8000), geração com sucesso e contrato estrutural íntegro (1 chamada Groq), resiliência com Fixer prompt em JSON inválido/divergente (1 retry), 422 em falha irrecuperável e tratamento controlado de 429 sem cascata.
- CHANGE REG-MAT-011: cobertura declarada como "recorte" conservador pelo servidor, eliminando confiança indevida em metadados do cliente.
- ADD REG-MAT-014: comprovação de que o envio de tipoExtracao: "integral" pelo cliente não forja cobertura integral, preservação estrita do status HTTP 429 durante o Fixer, fallback conservador compartilhado ('fallback:unknown') descartando x-forwarded-for quando cf-connecting-ip estiver ausente/vazio, contenção conservadora sob saturação (recusa de novas admissões sem evicção de cotas ativas) e encapsulamento em `@/lib/material-rate-limit.ts` sem exports internos em `route.ts`.
