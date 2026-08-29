# PROJECT_MEMORY.md â€” MemÃ³ria Persistente do Projeto AIVUR/StudyMaster

âš ï¸ **ATENÃ‡ÃƒO AO AGENTE: Antes de escrever cÃ³digo de backend/IA, leia e siga o ARCHITECTURE_RULES.md**

> **INSTRUÃ‡ÃƒO OBRIGATÃ“RIA PARA QUALQUER IA TRABALHANDO NESTE REPOSITÃ“RIO:**
> 1. Leia este arquivo INTEIRO antes de executar qualquer tarefa.
> 2. Ao final de qualquer mudanÃ§a relevante (feature concluÃ­da, bug corrigido, decisÃ£o de arquitetura tomada), ATUALIZE este arquivo antes de encerrar a resposta.
> 3. Nunca reescreva o histÃ³rico â€” adicione novas entradas nas seÃ§Ãµes corretas, mantendo o que jÃ¡ existe.
> 4. Se encontrar uma tarefa "aberta" listada em "PendÃªncias", trate como prioridade conhecida, nÃ£o como descoberta nova.

---

### ðŸ§  DOUTRINA AIVUR (Personalidade & Regras Core)

* **Protocolo de Pivotagem Arquitetural:** Se um erro (visual ou lÃ³gico) persistir por 3 a 4 iteraÃ§Ãµes, Ã‰ PROIBIDO continuar remendando o cÃ³digo quebrado. Pivote imediatamente para uma tÃ©cnica superior e blindada (ex: Inline Styles brutos, React Portals, ou reescrita total da lÃ³gica).
* **Blindagem Anti-Esmagamento (Stacking Context):** Nunca deixe elementos circulares sem trava. Use SEMPRE `flex-none` e dimensÃµes rÃ­gidas (ex: `minWidth: 32px`).
* **A Paleta Elite:** Ã‰ terminantemente proibido improvisar cores genÃ©ricas. Fundo base: `slate-900` ou `slate-950`. Destaque/AÃ§Ã£o PrimÃ¡ria: Laranja `#f68b33`.
* **Arquitetura Universal:** SoluÃ§Ãµes visuais complexas validadas devem ser componentizadas e reutilizadas globalmente, nunca duplicadas por rota.
* **VerificaÃ§Ã£o de Realidade:** Nunca afirme ter consertado algo sem validar na estrutura real. Se nÃ£o tiver certeza, avise.

*Sempre que o usuÃ¡rio definir uma nova 'Regra de Ouro' ou um padrÃ£o recorrente durante o chat, vocÃª tem a OBRIGAÃ‡ÃƒO de abrir o project-memory automaticamente e adicionar a nova regra a este campo, garantindo que a personalidade do projeto continue evoluindo.*

---

## 1. VisÃ£o Geral do Projeto

Site de preparaÃ§Ã£o para concursos (AIVUR), migrando de um HTML puro de 11.000+ linhas para uma arquitetura Next.js nova, construÃ­da do zero em pasta separada. O produto atende tanto alunos de concurso pÃºblico quanto alunos de vestibular/ENEM/estudo livre.

A fundaÃ§Ã£o do Backend de InteligÃªncia Artificial usa o padrÃ£o RAG (Retrieval-Augmented Generation) com otimizaÃ§Ã£o severa de custos via Cloudflare:
- **D1**: Filtro HÃ­brido.
- **Vectorize**: Busca SemÃ¢ntica.
- **KV**: Cache SemÃ¢ntico de custo zero (RAG_CACHE).
- **RAGOptimizer**: Fatiamento estrito limitando tokens antes de acionar a LLM.

## 2. Arquitetura Atual (dois sistemas coexistindo)

- **Novo (Next.js)** â€” pasta do projeto novo. Onde vive a feature "Trilha/Mentor": checklist de curso, teoria, questÃµes, flashcards, revisÃ£o de erros, progressÃ£o. Local-first via IndexedDB.
- **Legado (Cloudflare Worker)** â€” repositÃ³rio `studymaster-agent` (GitHub: munizcesar/studymaster-agent), deploy em `studymaster-agent.pages.dev`. ContÃ©m:
  - `worker.js` â€” worker principal `studymaster-worker`, com `wrangler.toml` configurado com bindings reais: D1 (`DB_EDITAIS`), Queues (ingestÃ£o de PDF), KV (`RAG_CACHE`), e **dois Ã­ndices Vectorize populados**: `studymaster-provas` (340 vetores, vazio de conteÃºdo real) e `studymaster-knowledge` (4.732 vetores, leis secas reais â€” 8.112/90, LGPD, CPC, CPP, CLT â€” domÃ­nio pÃºblico, seguro para uso).
  - `mentor-class-backend/` â€” worker simples e separado, sÃ³ com rotas `/api/parse-edital` e `/api/gerar-sessao`, geraÃ§Ã£o zero-shot via Groq, sem uso de D1/R2/Vectorize.
  - DocumentaÃ§Ã£o extensa sobre um pipeline de RAG que foi **desenhado mas nunca conectado** ao fluxo real de produÃ§Ã£o (branch `feature/quality-protocols`, nunca integrada ao main). O `rag-handler.js` existe isolado.
  - `ARCHITECTURE_STATUS.md` (o doc mais confiÃ¡vel do repo) declara o projeto "congelado" apÃ³s a Sprint 4. O R2 estava bloqueado (cÃ³digo 10042), mas a restriÃ§Ã£o de billing foi resolvida e a infra estÃ¡ liberada para uso.

## 3. DecisÃµes de Arquitetura JÃ¡ Tomadas (nÃ£o reabrir sem motivo novo)

- **Multi-dispositivo (login + sync D1/R2)**: âœ… IMPLEMENTADO. SincronizaÃ§Ã£o LWW (Last Write Wins) baseada em timestamp via API Worker (`/api/sync/push` e `pull`) e D1/R2. AutenticaÃ§Ã£o via Magic Link (`/api/auth/magic-link`) usando cookie HttpOnly gerenciado pelo Next.js. Implementada lÃ³gica de debounce (5s) para push automÃ¡tico local-first. Salvaguarda de pull implementada (Push CompulsÃ³rio + Backup local pre-sync) para evitar perda de dados offline durante recarregamentos.
- **GeraÃ§Ã£o de conteÃºdo (Teoria/QuestÃµes/Flashcards)**: sempre on-demand, nunca no momento de criar o curso. Cache-first no IndexedDB antes de chamar a Groq.
- **ExclusÃ£o de curso**: usa Abordagem C (varredura cirÃºrgica via JSON do curso) + garbage collector de Ã³rfÃ£os, sem precisar de Object Stores/Ã­ndices nativos â€” implementado e testado.
- **Filtro de banca**: sÃ³ aparece para cursos com `sourceType: "edital"`. Cursos `sourceType: "livre"` (vestibular, tema livre) nunca mostram esse filtro. Regras de formato especÃ­ficas por banca (Cebraspe = Certo/Errado obrigatÃ³rio, FGV = analÃ­tico, FCC = monotemÃ¡tico, Vunesp = objetivo/literal, Cesgranrio = direto, IADES = complexo) devem estar embutidas no prompt de geraÃ§Ã£o, nÃ£o sÃ³ o nome da banca solto.
- **Bancas cobertas**: Cebraspe, FGV, FCC, Vunesp, Cesgranrio, IADES, IBFC, IDECAN, Consulplan, Quadrix (10 bancas) + opÃ§Ã£o "PadrÃ£o/Geral" como default. DetecÃ§Ã£o automÃ¡tica de banca a partir do edital colado Ã© a meta (evitar obrigar escolha manual).
- **RAG**: decidido reaproveitar a infraestrutura jÃ¡ existente no worker legado (Vectorize `studymaster-knowledge`) em vez de construir do zero. RAG deve ser tratado como REFORÃ‡O opcional (fallback para zero-shot se nÃ£o houver match relevante), nunca dependÃªncia obrigatÃ³ria â€” muitas matÃ©rias (PortuguÃªs, RLM, InformÃ¡tica) nÃ£o tÃªm cobertura no Ã­ndice atual de leis.
- **Banco de questÃµes reais (verbatim)**: evitado por risco de direitos autorais de bancas organizadoras. Caminho seguro: linkar PDFs oficiais de provas anteriores, ou usar poucas questÃµes reais sÃ³ como calibraÃ§Ã£o interna de estilo (nÃ£o exibidas ao aluno).

## 4. Status por Fase (Trilha/Mentor, projeto Next.js)

- **Fase 1** â€” Checklist com dados reais (curso gm-hortolandia-2026 como teste). âœ… ConcluÃ­da.
- **Fase 2** â€” GeraÃ§Ã£o de curso a partir de edital colado/PDF via IA, tela de revisÃ£o antes de salvar. âœ… ConcluÃ­da e validada (Puppeteer, edital real de Limeira).
- **Fase 3** â€” Teoria (protocolo anti-alucinaÃ§Ã£o por prompt), Flashcards, QuestÃµes com filtro de dificuldade/banca, cache IndexedDB. âœ… ConcluÃ­da.
- **Redesign ChecklistItem** â€” 3 botÃµes inline (YouTube/QuestÃµes/Flashcards), nÃºmeros dinÃ¢micos com lazy loading via IntersectionObserver. âœ… ConcluÃ­do.
- **Fase 4** â€” Controle de progressÃ£o + revisÃ£o de erros (questÃµes erradas + flashcards "nÃ£o sei"), por matÃ©ria. MÃ©trica de % de acerto deduplicada (Ãºltima tentativa por questÃ£o, nÃ£o acumulada). âœ… ConcluÃ­da.
- **Rodada de polimento** â€” corrigida race condition na geraÃ§Ã£o Groq (cliques duplos), corrigidos Ã³rfÃ£os no painel de revisÃ£o ao regerar questÃµes, eliminado prop drilling do `courseId` via `CourseContext`. âœ… ConcluÃ­da.
- **Fase 5a** â€” Gerenciamento de cursos: listagem (jÃ¡ existia), exclusÃ£o segura com GC de Ã³rfÃ£os, ediÃ§Ã£o de nome do curso. âœ… ConcluÃ­da.
- **sourceType edital/livre** â€” implementado, filtro de banca condicional. âœ… ConcluÃ­do.
- **ConexÃ£o RAG (studymaster-knowledge â†’ Trilha)** â€” âœ… CONCLUÃDO. Rota POST `/api/rag-search` no `worker.js` (repo: `C:\Users\Cesar Victor\Desktop\studymaster-worker`, deploy em `.workers.dev`) consultando o Ã­ndice `studymaster-knowledge`. O Next.js consome essa rota antes de gerar Teoria/QuestÃµes. Retornos adicionais (`matchCount` e `topScore`) foram implementados. Filtro de qualidade (`score >= 0.70`) implementado no backend para descartar vetores fracos e impedir que conteÃºdo irrelevante contamine a geraÃ§Ã£o do LLM em matÃ©rias nÃ£o-jurÃ­dicas.
- **SincruonizaÃ§Ã£o Multi-dispositivo (D1/R2)** â€” âœ… CONCLUÃDO. ImplementaÃ§Ã£o de rotas de Push/Pull + Magic Link via Worker. Cliente Next.js adaptado com `useSyncManager`, salvaguardas contra reescrita acidental e debouncing local para IndexedDB. Envio de e-mail via API REST oficial do Resend implementado. Dev-bypass criado para localhost.
- **Pilar 1 UX/UI (Dashboard/Gerador)** â€” âœ… CONCLUÃDO. RestauraÃ§Ã£o do Wizard como central, remoÃ§Ã£o de marketing intrusivo logado. Empty state focado em ativaÃ§Ã£o. Teoria renderizada com React Markdown (tipografia premium).
- **Pilar 2 (LaboratÃ³rio de Materiais)** â€” âœ… CONCLUÃDO (Casca Visual). Criada a rota `/material` com Dropzone limpa, ferramenta de Simulado RÃ¡pido interativa (com feedback imediato) e Flashcards binÃ¡rios (Tinder-swipe) voltados para mobile-first e altÃ­ssima retenÃ§Ã£o. Implementada a fundaÃ§Ã£o do Extrator de PDF hÃ­brido (nativo com fallback para OCR automÃ¡tico).
- **Raio-X Editorial no Hero (coluna direita 40%)** â€” âœ… CONCLUÃDO. SubstituÃ­do placeholder "Aivo â€” em breve" pela "Radiografia do Edital": bloco de texto bruto do CTB em `rgba(107,153,179,0.38)` com fade-mask vertical, trecho extraÃ­do marcado inline (`background: #FBEBD0 / color: #0A2E45`, `border-radius: 0`), linha conectora vertical vermelha (`2px, elite-red`), bloco de questÃ£o gerada com `border-left: 3px elite-red` e tag "Gerado: QuestÃ£o VUNESP". Container com `rotate(-1deg)` (removido no mobile). Sem opacity herdada: cor com alpha direto no elemento pai. Commit `f1e1bda`.
- **PadronizaÃ§Ã£o Rota `/questoes` (Wizard / Caderno de QuestÃµes)** â€” âœ… CONCLUÃDO. Aplicada identidade "Curadoria Institucional Elite". Background `var(--elite-navy)`. Removidos botÃµes gradiente, border-radius pill (9999px) e glassmorphism pesado. Cards e painÃ©is de filtros ajustados para fundo translÃºcido sutil (`rgba(251,235,208,0.03)`) com borda fina `rgba(107,153,179,0.18)`. BotÃµes primÃ¡rios (`qfResolverBtn`, `qfExitContinueBtn`) brutalistas retangulares (`border-radius: 2px`) em `elite-red` com shadow-offset wine (`4px 4px 0 #6B0000`). Tipografia pesada mantida (elite-cream). Atualizados `Wizard.module.css`, `WizardStep3.tsx` e `questoes/page.tsx`. Commit `e194179`.
- **DesobstruÃ§Ã£o de UX e Light Mode** â€” âœ… CONCLUÃDO. Restaurado toggle claro/escuro via `[data-theme="light"]` com mapeamento semÃ¢ntico invertido da Paleta Elite (mantendo legibilidade sem quebrar as classes hardcoded). Removido filtro inÃºtil de "Alternativas (4/5)". Corrigido bloqueio fatal de base de dados via bypass `handleForceMock`, e UI de erro redesenhada no padrÃ£o brutalista de alertas para `WizardStep3`. Commit `1aa408f`.
- **RefatoraÃ§Ã£o UI Gerador de Trilhas (`/mentor/gerar`)** â€” âœ… CONCLUÃDO. FormulÃ¡rios (inputs e textareas) adequados ao Brutalismo (bordas retas `2px`, coloraÃ§Ã£o `elite-grayblue` para inativos e texto principal em `elite-text` com outline sÃ³lido no focus). BotÃµes principais padronizados (`elite-red`, sombra offset `elite-wine`, tipografia forte em uppercase). Telas de Input e de RevisÃ£o completamente sincronizadas. Commit `5665f46`.
- **IntegraÃ§Ã£o Mascote Aivur & Cofre Editorial (`/material`)** â€” âœ… CONCLUÃDO. Dropzone de materiais transformado no "Cofre Editorial": borda tracejada fina (`elite-grayblue`), fundo rÃ­gido (`elite-navy`). Ao arrastar arquivo (drag active), inverte pra altÃ­ssimo contraste (fundo `elite-cream`, texto `elite-navy`). Novo mascote `<Aivur />` integrado estourando o topo do container, reagindo a eventos (repouso `calm`, drag over `curious`, upload `loading`, concluÃ­do `success`). Commit pendente de push.

## 5. Bugs Conhecidos (verificar se jÃ¡ corrigidos)

- âœ… **RemoÃ§Ã£o de Falso Positivo (Frontend)** â€” Removido definitivamente o botÃ£o 'ForÃ§ar Acesso (Mock Offline)' e a funÃ§Ã£o associada do WizardStep3.tsx que causava confusÃ£o visual mesmo com o backend destravado.
- âœ… **Destravamento da API de QuestÃµes** â€” Removida a trava artificial (RAG validation) no worker.js do Cloudflare Worker (studymaster-agent). Agora a IA gera questÃµes em tempo real via fallback LLM (Groq) ignorando a falta de contexto vetorial. Rota de geraÃ§Ã£o jÃ¡ era pÃºblica, o erro 401 de /api/sync/pull no console Ã© apenas um polling de sync nÃ£o autenticado e nÃ£o bloqueia a geraÃ§Ã£o.
- âœ… **Aba ativa do TopicDetails reseta ao fechar/reabrir o tÃ³pico** (perda de estado â€” filtros de dificuldade/banca voltam ao padrÃ£o). *Corrigido â€” estado elevado para CourseContext, compartilhado por sessÃ£o.*
- âœ… **Skeleton loader ausente** nos botÃµes de aÃ§Ã£o enquanto o IntersectionObserver carrega as contagens. *Corrigido â€” CSS shimmer implementado.*
- âœ… **Layout "pulando"** no ReviewPanel ao remover item (sem fade-out). *Corrigido â€” Framer Motion integrado com AnimatePresence.*
- âœ… **BotÃ£o "Gerar Flashcards com IA" nÃ£o dÃ¡ feedback visual** quando clicado sem a Teoria do tÃ³pico jÃ¡ ter sido gerada â€” *Corrigido (mensagem inline adicionada)*.

## 6. PendÃªncias / PrÃ³ximos Passos Conhecidos

- Auditoria de cobertura do Vectorize por matÃ©ria do edital de teste (quais matÃ©rias nÃ£o tÃªm cobertura de leis, ex: PortuguÃªs/RLM/InformÃ¡tica) â€” fazer DEPOIS que o RAG estiver conectado e testado, nÃ£o misturar com a integraÃ§Ã£o atual.
- Avaliar expandir a base de conhecimento (Vectorize) para matÃ©rias nÃ£o jurÃ­dicas, com cuidado de direitos autorais por fonte.
- Decidir sobre Fase 5b (ediÃ§Ã£o de estrutura do curso â€” add/remover tÃ³picos), que exige decisÃ£o sobre o que fazer com conteÃºdo/progresso Ã³rfÃ£o gerado.

## 7. Armadilhas JÃ¡ Identificadas (nÃ£o repetir)

- O relatÃ³rio de uma IA sobre "o que estÃ¡ implementado" pode estar desatualizado ou incompleto â€” sempre que a suspeita for de funcionalidade nÃ£o conectada (RAG, protocolos), pedir auditoria de leitura antes de assumir que nÃ£o existe.
- MÃºltiplos sistemas (Next.js novo + worker legado) podem ter infraestrutura provisionada na Cloudflare (visÃ­vel no dashboard) que nÃ£o aparece numa busca de cÃ³digo simples â€” checar o dashboard da conta Ã© uma fonte de verdade complementar ao cÃ³digo.
- Ao pedir correÃ§Ãµes, sempre restringir explicitamente que a IA NÃƒO deve alterar cÃ³digo de partes jÃ¡ validadas/testadas, sÃ³ a Ã¡rea da tarefa pedida.

## 8. Regras InegociÃ¡veis de UI/UX

1. **PALETA INSTITUCIONAL ELITE**: O sistema baseia-se em `--elite-navy` (fundo principal escuro), `--elite-red` (aÃ§Ãµes primÃ¡rias), `--elite-cream` (textos de destaque/fundos claros), `--elite-wine` (sombras e hovers) e `--elite-grayblue` (apoio/bordas tracejadas).
2. **BRUTALISMO EDITORIAL**: A interface adota curvas levemente suavizadas (`8px`) mantendo sombras sÃ³lidas de deslocamento (offset shadows) sem blur.
3. **MASCOTE REATIVO**: O componente `<Aivur />` em SVG deve ser atrelado aos eventos do usuÃ¡rio para criar microinteraÃ§Ãµes vivas sem uso de WebGL.
4. **RESILIÃŠNCIA DE UI**: Todas as telas dependentes de banco de dados devem ter um botÃ£o oculto de "Mock Offline".
5. **REGRA DE OURO: FUGA DO MURAL PESADO**: A navegaÃ§Ã£o principal (Dashboard/Home) deve ser um menu de alta velocidade focado em escaneabilidade da esquerda para a direita (Horizontal List Cards). Elementos visuais nunca devem brigar pela atenÃ§Ã£o do usuÃ¡rio. O 'Minimalismo Rico' (Ã­cones tÃ¡ticos, fundos limpos) dita a interface de conversÃ£o. Artes 3D imersivas e complexas devem ser reservadas EXCLUSIVAMENTE para os cabeÃ§alhos das pÃ¡ginas internas, gerando imersÃ£o apenas apÃ³s o clique da decisÃ£o.

---
*Ãšltima atualizaÃ§Ã£o: 23/08/2026. Regras de Design System (Curadoria Institucional Elite) consolidadas apÃ³s ampla refatoraÃ§Ã£o de UI/UX em Landing Page, Wizard, Gerador e LaboratÃ³rio de Materiais. Mascote reativo SVG integrado.*
- **Refatoração Seção de Trilhas** – ? CONCLUÍDO. A raiz /mentor foi transformada em um Dashboard organizado e isolado do fluxo de criação, corrigindo a UX que enviava o usuário direto para /mentor/gerar ao clicar na aba Trilhas. O novo Dashboard usa a Paleta Elite, lista trilhas salvas (oficiais e locais geradas via IndexedDB), e traz um estado vazio elegante.

### ?? DOUTRINA AIVUR
- **Iconografia Premium (Proibição Absoluta de Emojis):** É terminantemente proibido o uso de emojis (ex: ??, ??, ???) como elementos visuais na interface. Utilize SEMPRE a biblioteca `lucide-react` ou ícones SVG customizados. O design deve se manter fiel ao padrão Elite e maduro.

- **Refatoracao Card de Topico** - CONCLUIDO. ChecklistItem.tsx: botoes pill reordenados (1. Questoes HelpCircle, 2. Flashcards Layers, 3. YouTube Youtube - todos lucide-react). TopicDetails.tsx: aba renomeada para 'Resumo + Dicas' com cor ativa #f68b33; disclaimer premium com ShieldCheck (sem emojis); botao 'Gerar Resumo + Dicas' com Sparkles icon e estilo bg-[#f68b33]; erro tratado com caixa suave. API mentor/teoria/route.ts: prompt refatorado para foco em confianca, bullet points, mnenonicos e maior incidencia em provas. Commit: fix(trilhas): refatora layout do card de topico, reordena acoes e otimiza prompt de geracao de resumo.
