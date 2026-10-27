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

## 2026-10-18 — Jornada de Edital (Módulo Trilhas / Etapa 1)

- ADD REG-JORNADA-001 … 008 (camada Contratos, API e Persistência D1):
  - REG-JORNADA-001: Validação Zod dos contratos da Jornada de Edital (`jornada.ts`), aceitando ementa estruturada válida e rejeitando disciplinas vazias, tópicos em branco, ausência de hashes ou texto fora dos limites (50 a 15.000 caracteres).
  - REG-JORNADA-002: Autenticação e integridade de sessão em todas as rotas da Jornada (`/api/ai/gerar-jornada`, `/api/jornadas`, `/api/jornadas/[id]`), rejeitando cookies ausentes, forjados ou adulterados com HTTP 401 sem invocar IA nem consultar o banco.
  - REG-JORNADA-003: Validação de limites da extração de ementa com IA (`/api/ai/gerar-jornada`), consumo estrito de 1 chamada Groq sob payload válido e bloqueio de entradas curtas ou excessivas.
  - REG-JORNADA-004: Resiliência da extração de ementa com autocorreção controlada via Fixer Prompt em 1 tentativa única para JSON fora do contrato e conversão de saída truncada em erro controlado, sem alucinações.
  - REG-JORNADA-005: Criação persistida no D1 com integridade referencial e resposta idempotente: requisições repetidas com idêntico `ementa_hash` retornam a jornada existente sem duplicar registros no D1.
  - REG-JORNADA-006: Isolamento estrito anti-IDOR: validação de propriedade vinculando `session.userId` a todas as consultas D1, impedindo consulta, alteração ou exclusão de jornadas de outros usuários.
  - REG-JORNADA-007: Concorrência e convergência determinística ao iniciar tópicos: múltiplas requisições simultâneas convergem atomicamente para a mesma trilha estável (`trilha_${topicoId}`) sem criar registros órfãos ou duplicatas em `trilhas`.
  - REG-JORNADA-008: Conclusão explícita de tópico e cálculo do próximo passo: tópico só é concluído mediante evento explícito persistido (`POST /concluir`), atualizando o progresso geral e recomendando o próximo tópico em ordem linear.
  - REG-JORNADA-009: Início de tópico resiliente contra perda de associação e tópicos órfãos: elimina fallback permissivo e responde HTTP 404 sem `success: true` ou `trilha_id` fantasma quando o tópico/vínculo não é consolidado; preserva integralmente `trilha_id` pré-existente sem sobrescrita.

## 2026-10-22 — Jornadas (Prevenção de Truncamento de Editais Extensos)

- ADD REG-JORNADA-010 … 013:
  - REG-JORNADA-010: Segmentação e processamento de edital extenso com múltiplas disciplinas em blocos seguros (`jornada-chunking.ts`).
  - REG-JORNADA-011: Tratamento defensivo de truncamento por limite de tokens e JSON incompleto com relatório de etapa.
  - REG-JORNADA-012: Preservação de conteúdo parcial em falha de bloco posterior e retomada sem duplicação.
  - REG-JORNADA-013: Consolidação determinística de ementas: deduplicação de disciplinas, tópicos repetidos e ordenação estável.

## 2026-10-22 — AIVU (Evolução do Cérebro Central / Professor Particular Inteligente)

- ADD REG-AIVU-008 … 011:
  - REG-AIVU-008: Isolamento de contexto e retrocompatibilidade com contexto ausente ou geral (`assembleAivuPromptMessages` sem injeção espúria quando `context` não é fornecido ou `modulo === 'geral'`).
  - REG-AIVU-009: Contexto tipado por módulo e troca dinâmica de contexto pedagógico (Trilhas com protocolo de domínio jurídico, Questões com diretrizes pedagógicas para descarte de distratores).
  - REG-AIVU-010: Regra restritiva de ancoragem no Meu Material (`modulo === 'material'` restringe respostas à fonte e instrui declaração expressa: "Informação não encontrada no material fornecido.").
  - REG-AIVU-011: Privacidade e orçamento de tokens (limite Zod de 1.500 caracteres em `trecho_foco`, contenção de metadados e poda automática de histórico recente respeitando `HISTORY_RESERVE` de 1.100 tokens).

## 2026-10-23 — AIVU (Fase 2: Contexto Real das Telas — Questões, Trilhas, Jornadas e Meu Material)

- ADD REG-AIVU-012 … 014:
  - REG-AIVU-012: Transição dinâmica de contexto entre telas de estudo (Questões -> Meu Material -> Reset), validação de isolamento estrito sem vazamento de resíduos de telas anteriores e verificação de prompt limpo no dashboard.
  - REG-AIVU-013: Preservação do histórico pedagógico da conversa durante a navegação entre telas de estudo (conversas no `useAivoStore` continuam íntegras enquanto o contexto da página é atualizado dinamicamente).
  - REG-AIVU-014: Alternância dinâmica de seções em Trilhas (teoria/resumo -> flashcards -> questões), verificação da atualização de atividade e descarte de diretrizes da seção anterior.

## 2026-10-23 — Jornadas (Fase 7: Blindagem da Retomada Parcial de Edital)

- ADD REG-JORNADA-014:
  - Blindagem da retomada parcial via hash SHA-256 determinístico (`computeEditalHash`).
  - Validação de vinculação estrita entre o texto do edital e o conteúdo parcial acumulado (`edital_hash`).
  - Rejeição controlada com HTTP 400 (`motivo: EDITAL_DIVERGENTE`) em caso de tentativa de retomada com texto modificado.
  - Rejeição controlada com HTTP 400 (`motivo: HASH_AUSENTE`) quando a identificação do edital de origem é omitida.
  - Preservação integral do `conteudo_parcial` no corpo da resposta rejeitada, evitando descarte involuntário do progresso anterior.
- ADD REG-JORNADA-015:
  - Contrato do frontend na retomada parcial (`CriarJornadaView.tsx`): interceptação de HTTP 422 com conteúdo parcial estruturado, preservação de `edital_hash`, `bloco_inicio` e `conteudo_parcial`, e reenvio no clique de "Tentar novamente" com o texto de edital original, garantindo conclusão sem recomeço forçado e rejeição imediata em caso de edital adulterado.

## 2026-10-24 — AIVU (Migração AIVO → AIVU: Compatibilidade Visual e Renderização DOM)

- ADD REG-AIVU-015 (camada Navegador):
  - Validação no DOM real via Puppeteer dos estilos computados do widget (`AivoWidget.tsx` e `AivoWidget.module.css`).
  - Confirmação de renderização com classes e regras visuais idênticas para mensagens históricas (`sender: 'aivo'`) e modernas (`sender: 'aivu'`) com alinhamento à esquerda (`flex-start`), cor de fundo institucional, cor de texto e raio de borda do assistente (`borderBottomLeftRadius: 4px`).
  - Confirmação de estilização do usuário (`sender: 'user'`) preservando alinhamento à direita (`flex-end`), raio de borda invertido (`borderBottomRightRadius: 4px`) e contraste cromático diferenciado.

## 2026-10-25 — AIVUR Fase 1 (Navegação Global e Correção do Drawer)

- ADD REG-AIVU-016 (camada Navegador):
  - Validação no Puppeteer da abertura e fechamento do `<SideDrawer />` centralizado no `RootLayout` nas rotas `/material` e `/redacao`.
  - Validação de fechamento acessível via tecla `Escape` e clique no overlay escuro (`drawerOverlay`).
  - Validação de indicação de rota ativa nos links de navegação (`aria-current="page"` e classe `activeAction` com tokens de design).
  - Validação de harmonia com o widget AIVU: o mascote permanece estável em sua ancoragem padrão (`bottom: 24px; right: 24px`), sem teleportar para o canto superior direito (`inDrawer`) nem sobrepor o drawer aberto.

## 2026-10-25 — AIVUR Fase 2 (Responsividade e Teclado Mobile do Chat AIVU)

- ADD REG-AIVU-017 (camada Navegador):
  - Validação em viewports mobile (360x740 e 390x844) do painel de chat do AIVU.
  - Verificação de limites horizontais estritos e ausência de overflow horizontal na viewport.
  - Verificação de taxa de densidade e aproveitamento de largura útil das mensagens no mobile (>= 250px em 360px e >= 270px em 390px).
  - Verificação de visibilidade simultânea do cabeçalho, botão de fechar e campo de envio no viewport.
  - Simulação de redução de viewport por teclado virtual (360x440), comprovando que o cabeçalho e os controles de envio permanecem visíveis e acessíveis sem ejeção do topo.
  - Validação de cenário extremo com altura visual inferior a 284px (360x260), assegurando que o teto dinâmico encolhe sem extrapolar o topo.
  - Validação de preservação do layout desktop flutuante (1280x900, largura 340px, position: absolute, sem estilos inline).
