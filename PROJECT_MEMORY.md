- **Correção de compilação em `WizardStep3.tsx`** - CONCLUÍDO. Removido um bloco JSX duplicado e solto após o retorno de `OptionButton`, que causava `Expression expected` no Turbopack e impedia a rota `/questoes` de renderizar. Validado com `npx.cmd tsc --noEmit` e recarregamento da página local; a tela de configuração do simulado voltou a aparecer.
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
* **A Paleta Elite:** É terminantemente proibido improvisar cores genéricas. Fundo base: `slate-900` ou `slate-950`. Destaque/Ação Primária e Botões Especiais incluem Vermelho (`red-700`) e Vermelho Escuro (`red-800`), e o Laranja (`#f68b33`). É EXPLICITAMENTE PROIBIDO remover a cor vermelha sob alegação de padronização, ela faz parte da identidade oficial.
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
- **Encapsulamento Absoluto (Proibição de CSS Externo):** Todo componente (.tsx) deve ser uma "caixa preta" isolada. É TERMINANTEMENTE PROIBIDO usar CSS Modules (.module.css), injetar regras em globals.css ou criar estilos globais que afetem outras páginas. Toda a estilização e responsividade DEVE ser feita exclusivamente através de classes utilitárias do Tailwind inline no próprio elemento. Se um componente quebrar, o erro deve ficar preso dentro do arquivo dele.
- **Iconografia Premium (Proibição Absoluta de Emojis):** É terminantemente proibido o uso de emojis (ex: ??, ??, ???) como elementos visuais na interface. Utilize SEMPRE a biblioteca `lucide-react` ou ícones SVG customizados. O design deve se manter fiel ao padrão Elite e maduro.

- **Refatoracao Card de Topico** - CONCLUIDO. ChecklistItem.tsx: botoes pill reordenados (1. Questoes HelpCircle, 2. Flashcards Layers, 3. YouTube Youtube - todos lucide-react). TopicDetails.tsx: aba renomeada para 'Resumo + Dicas' com cor ativa #f68b33; disclaimer premium com ShieldCheck (sem emojis); botao 'Gerar Resumo + Dicas' com Sparkles icon e estilo bg-[#f68b33]; erro tratado com caixa suave. API mentor/teoria/route.ts: prompt refatorado para foco em confianca, bullet points, mnenonicos e maior incidencia em provas. Commit: fix(trilhas): refatora layout do card de topico, reordena acoes e otimiza prompt de geracao de resumo.

- **Layout Desktop de Questões (QConcursos-style)** – ✅ CONCLUÍDO. Criado `DesktopQuestionList.tsx` com lista contínua (scroll vertical), breadcrumb de matéria/nicho/tópico, metadata (dificuldade/banca/tipo IA), alternativas compactas com clique direito para riscar (eliminação local sem persistência), botão Responder com feedback inline certo/errado, gabarito comentado expansível, e barra de 7 ações secundárias (Gabarito funcional, restantes preparadas com handlers vazios). Integrado em `TopicDetails.tsx` via breakpoint Tailwind `hidden md:block` — mobile mantém `FullscreenQuestion` intacto. Paleta 100% AIVUR Elite (#f68b33 ações, red-700 sombras, slate-900 fundo). Zero CSS externo, encapsulamento absoluto. Commit: `feat(mentor): implementa layout desktop de questoes estilo qconcursos com paleta aivur elite`.


- **Miss�o T�tica de Refinamento Visual (Tailwind UI)** - ? CONCLU�DO. Injetadas micro-intera��es de alta performance (feedback t�til), efeito glassmorphism em modais/barras e tipografia sofisticada nas rotas Home, Trilhas e Quest�es. Cart�es ganharam bordas sutis para maior profundidade. Altera��es estritamente baseadas em Tailwind, preservando a l�gica e estados existentes. Commit: 'ui(design): injeta micro-interacoes, profundidade visual e tipografia premium nas telas principais'.

- **Calibragem de Anima��o (Float Premium)** - ? CONCLU�DO. A anima��o da imagem 3D principal no Dashboard foi substitu�da por uma anima��o de respiro de baixa amplitude (floatPremium 8s ease-in-out infinite), implementada atrav�s do Tailwind CSS v4 (@theme em globals.css). Isso eleva a est�tica para um padr�o SaaS de alto n�vel e reduz o peso agressivo visual. Commit: 'ui(design): calibra animacao float-premium na imagem 3D principal'.
- **Missão Tática de Refinamento Visual (Tailwind UI)** - ✅ CONCLUÍDO. Injetadas micro-interações de alta performance (feedback tátil), efeito glassmorphism em modais/barras e tipografia sofisticada nas rotas Home, Trilhas e Questões. Cartões ganharam bordas sutis para maior profundidade. Alterações estritamente baseadas em Tailwind, preservando a lógica e estados existentes. Commit: 'ui(design): injeta micro-interacoes, profundidade visual e tipografia premium nas telas principais'.

- **Calibragem de Animação (Float Premium)** - ✅ CONCLUÍDO. A animação da imagem 3D principal no Dashboard foi substituída por uma animação de respiro de baixa amplitude (floatPremium 8s ease-in-out infinite), implementada através do Tailwind CSS v4 (@theme em globals.css). Isso eleva a estética para um padrão SaaS de alto nível e reduz o peso agressivo visual. Commit: 'ui(design): calibra animacao float-premium na imagem 3D principal'.

- **LCP Optimization (Hero Image)** - ✅ CONCLUÍDO. Adicionado fetchPriority=\high\ na tag \<img>\ do \hero-main.png\ (Dashboard.tsx) para forçar o carregamento imediato e eliminar o delay visual relatado pelo usuário, otimizando o LCP (Largest Contentful Paint). Commit: 'perf(ui): prioriza carregamento da imagem principal do hero para eliminar delay visual'.

- **Eliminação de Flicker de Tema (Logo)** - ✅ CONCLUÍDO. A lógica JS (hydration mismatch) que alternava o logo no \Header.tsx\ com base no tema foi substituída por renderização estática simultânea com \next/image\ (usando \block dark:hidden\ e \hidden dark:block\). Adicionado \priority\ para evitar delay, melhorando a métrica CLS e eliminando o piscar da versão errada no FOUC. Commit: 'fix(ui): substitui logica de tema do logo js por css puro para eliminar flicker no carregamento'.

- **Correção Definitiva do Logo (Flicker/Contraste)** - ✅ CONCLUÍDO. O Tailwind v4 neste projeto não estava mapeando a variante \dark:\ para \[data-theme="dark"]\ nativamente, o que quebrou as classes \dark:hidden\. A solução definitiva e blindada foi criar classes puras de CSS Module (\.logoLight\ e \.logoDark\) no \Header.module.css\ que escutam diretamente o seletor \:global([data-theme="dark"])\. Isso corrigiu o contraste nos dois temas e manteve o carregamento instantâneo sem flicker de JS. Commit: 'fix(ui): implementa toggle de logo via CSS Modules para contornar limitacao do Tailwind v4'.

- **Migração de Flexbox para CSS Grid (Opções de Questão)** – ✅ CONCLUÍDO. Foi identificada uma vulnerabilidade severa de "Layout Shift" e distorção em componentes Flexbox no `WizardStep3.tsx` (Desktop) e `FullscreenQuestion.tsx` (Mobile) provocada pelas engines de navegadores. A renderização das alternativas foi reescrita utilizando uma blindagem estrita via `grid grid-cols-[auto_1fr]`, ancorando perfeitamente as proporções de geometria (`w-10 h-10 border-2` fixas na coluna 1). Todos os conflitos de flex, cores laranja residuais e inline styles foram eliminados, consolidando as opções em um UX de altíssima fidelidade e conversão.
