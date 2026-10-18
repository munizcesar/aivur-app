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

## 2026-10-15 — Fase 2 (Meu Material: Integração do Estúdio de Estudo Ativo — Passo 2.3)

- ADD REG-MAT-015 (camada Navegador): integração completa frontend de Meu Material (`/material`) com a rota de geração por IA (`/api/ai/material/gerar`); validação de bloqueio de requisições de IA na conferência; preservação integral do texto e metadados validados em erro HTTP 429; geração bem-sucedida renderizando o Estúdio de Estudo Ativo com contrato Zod estrito; interatividade completa com troca de abas (Resumo, Flashcards com virada 3D e avaliação, Questões com seleção de alternativas e justificativa fundamentada com trecho de referência); e reset explícito via "Importar Outro Material" desmontando o estúdio.

## 2026-10-17 — AIVU (Chat Real com Inteligência Artificial v1)

- ADD REG-AIVU-001 … 006 (camada API): implementação e validação do chat real com IA do AIVU (`/api/ai/aivu/chat`):
  - REG-AIVU-001: validação Zod de entrada (rejeição com 400 de mensagem vazia, em branco, tipo incorreto ou JSON malformado sem chamada à IA).
  - REG-AIVU-002: validação Zod de limites (rejeição com 400 para mensagens > 1000 caracteres, histórico > 8 itens ou papéis inválidos).
  - REG-AIVU-003: autenticação estrita de sessão criptográfica HMAC-SHA256 (rejeição com 401 controlado para cookie ausente, vazio, forjado, adulterado ou expirado antes de qualquer processamento de IA).
  - REG-AIVU-004: proteção de taxa por usuário ativo via `InMemoryRateLimiter` (cota de 15 mensagens / 15 minutos por usuário, bloqueando rajadas com 429 sem impactar outros usuários).
  - REG-AIVU-005: round-trip completo de conversa válida com sessão assinada (retorna 200, contrato estrutural `{ reply, state: "speaking" }` validado por Zod, sanitização markdown e consumo de exatamente 1 chamada Groq com modelo `openai/gpt-oss-120b`).
  - REG-AIVU-006: resiliência de borda contra falhas do provedor (conversão limpa de HTTP 429 da Groq para 429 amigável sem cascata, falhas 5xx e respostas inválidas/nulas de content convertidas para 502 Bad Gateway controlado, com garantia de zero vazamento de segredos ou stack traces).
- ADD REG-AIVU-007 (camada Navegador): validação no Puppeteer da interface do widget AIVU (`AivoWidget.tsx`); abertura da janela, submissão de mensagem, interceptação de erro HTTP 502 da IA, exibição de erro controlado e recuperação automática do temporizador com reabilitação do input e restauração do mascote para idle sem congelamento em thinking ou speaking.
