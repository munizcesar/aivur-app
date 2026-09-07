# AIVUR — Memória Operacional do Projeto

## 1. Regras Vigentes

- Protocolo Zero Laranja: usar somente Slate, White, Emerald e Rose nas interfaces do Cockpit.
- Alternativas devem preservar CSS Grid com primeira coluna fixa de `40px` e segunda coluna flexível (`40px 1fr`).
- O box model das alternativas deve manter respiro lateral mínimo de `px-5` e padding vertical equivalente a `py-4`.
- Badges de alternativas devem permanecer fixas em `40x40px`, sem deformação ou layout shift.
- Skeletons devem reproduzir a geometria das alternativas e não causar CLS durante o carregamento.
- Estados pós-resposta devem congelar a interação, destacar acertos em Emerald, erros em Rose e manter inativos em White/Slate.
- Scroll de conteúdo deve permanecer interno ao Cockpit, sem deslocar Header ou Sidebar.

## 2. Arquitetura Atual

- Next.js com App Router e TypeScript.
- Tailwind CSS para estilos utilitários, com estilos inline nas propriedades críticas de geometria e contraste.
- Zustand para estado assíncrono e sessão de estudo — com middleware `persist` (localStorage, key: `aivur-study-store`).
- Rota isolada do Cockpit: `/sala-de-aula`.
- Orquestrador principal: `src/components/Cockpit/StudyCockpit.tsx`.
- Estado global: `src/store/useStudyStore.ts`.
- Hook de hidratação SSR: `src/hooks/useHydrated.ts`.
- Dados locais de trilha: `src/mocks/studyPathMock.ts`.
- Skeleton de questões: `src/components/UI/QuestionSkeleton.tsx`.
- A rota do Cockpit não depende de API ou backend para sua validação visual atual.

## 3. Estado Validado

- Cockpit renderiza Header, Sidebar responsiva e abas de Resumo, Flashcards e Questões.
- Sidebar é fixa no desktop (shrink-0, flex 0 0 288px) e off-canvas no mobile (z-50, backdrop z-40).
- Questões possuem seleção, resposta, bloqueio pós-envio e feedback dinâmico.
- Gabarito comentado aparece após a resposta com `role="status"` e `aria-live`.
- Loading assíncrono mock usa `isLoading` no Zustand e latência simulada de 1,5s.
- Skeletons preservam Grid, badge `40x40px`, altura de `72px` e scroll interno.
- Alternativas inativas mantêm fundo branco, texto Slate e opacidade reduzida.
- TypeScript isolado do Cockpit deve ser validado com `tsconfig.cockpit.json`.
- **Modo Flow (Auto-Resume):** `currentTopicId` persiste no localStorage; aluno retoma exatamente onde parou.
- **Defesa de Hidratação:** `useHydrated` hook bloqueia render do Cockpit até `persist.hasHydrated()` → evita SSR mismatch.
- **Persistência parcial:** `isLoading` excluído do `partialize` para não reidratar estado transiente.
- **URL params têm prioridade** sobre estado persistido no sync do `useEffect`.
- **TrilhasAccordion (Contenção de Overflow & Paleta Premium):** Purga de cores escuras e ícones dissonantes; cabeçalho com paleta clara (`bg-white`, `border-slate-200`, `text-slate-800`), barra de progresso padronizada (`h-1.5 bg-slate-100` / `bg-emerald-500`) e pílulas de ação com `flex-wrap` para contenção rigorosa nos 320px da Sidebar. Seleção de subtópico conectada à action `setCurrentTopic(topic.id)`.
- **Roteamento Síncrono das Abas:** Abas agora suportam a opção `video`, integradas nativamente com as pílulas do `TrilhasAccordion`. O clique aciona simultaneamente `setCurrentTopic` e `setActiveTab` com `e.stopPropagation()` para manter integridade da UI.
- **Hub de Videoaulas:** Implementação do `VideoPlayerHub.tsx` encapsulando player principal do YouTube e grade de opções dinâmicas. Lógica inteligente de busca (`topicTitle`) extraída via roteamento. Protegido com SSR Hydration Guard. Layout estrito com `aspect-video` e `flex-col h-full overflow-y-auto`.
- **Cálculo Dinâmico de Progresso Real**: As barras de progresso do `TrilhasAccordion` agora são totalmente reativas. Baseiam-se na relação entre tópicos do módulo e o array global de `completedTopicIds` (mantido no Zustand via `toggleTopicCompletion`). O usuário interage através de um botão "Concluir Tópico" injetado no Header dinâmico, fechando o loop de gamificação.
- **Polimento Premium (UI/UX)**: Transições táteis em eixos Y (`hover:-translate-y-0.5`) aplicadas às pílulas da Sidebar, casadas com acentos `indigo-600` e sombras fluidas. O botão de Concluir Tópico fornece recompensa visual instantânea, alternando de `slate-700`/`bg-white` para um estado rebaixado e vibrante `emerald-700`/`bg-emerald-50` com `shadow-inner`.
- **Desacoplamento Arquitetural (Smart Components)**: O Orquestrador `StudyCockpit.tsx` foi purgado de _Prop Drilling_ e estados locais massivos. A Sidebar (`CockpitSidebar`), Header, Navigation, Stage e MobileTrigger foram extraídos para o diretório `parts/`. O Zustand agora atua como a espinha dorsal global controlando nativamente a UI Transiente (ex: `isSidebarOpen`).
- **Arena de Flashcards (Active Recall 3D)**: Substituição do Empty State por um mini-app interativo na aba de Flashcards. Implementado motor de física 3D em CSS (`perspective`, `transform-style: preserve-3d`, `rotateY`) e painel de repetição espaçada simulada (botões Errei, Bom, Fácil) orquestrado por um mock de dados e estados de flip e avanço automático.
- **Simulador de Questões (Focus Mode)**: Aba de Questões evoluída para uma experiência "Uma por Vez", eliminando a fadiga de _scroll_ infinito. Alternativas tornaram-se botões altamente táteis com validação visual imediata (Emerald vs Rose) e bloqueio de _pointer-events_ anti-clique-duplo. O painel de Resolução (Gabarito Comentado) surge dinamicamente via animações CSS suaves.
- **Leitor Premium de Resumos (Notion-like)**: Aba de Resumos finalizada com foco absoluto em legibilidade (`ResumeTab.tsx`). Fundo branco protegido isolado do Stage, tipografia hierárquica pesada (`slate-900` para títulos, `slate-700` para corpo) e `Highlights` (`indigo-50`). Integrada ao store global via _Call to Action_ no rodapé ("Marcar como Lido" / "Resumo Concluído") fechando o ciclo de gamificação.
- **Motor Serverless & Data Fetching**: Evolução do arquitetural Client-only para BFF (Backend-for-Frontend). Criada API Route (`/api/study-path`) para isolar os dados estáticos (`studyPathMock.ts`) atuando como banco de dados. Implementado Service Layer (`studyService.ts`) e Cérebro Assíncrono no Zustand (`loadStudyPath` com estado de `isLoading` não persistido). O Orquestrador `StudyCockpit` foi blindado com um _Skeleton Loading_ Premium (proteção total contra CLS) injetado durante a janela de busca assíncrona.

## 4. Regra de Titânio (Lucide + Flexbox)

- **NUNCA** usar `className="w-N h-N"` junto com `size={N}` em ícones Lucide. O `size` nativo injeta `width`/`height` direto no SVG; as classes Tailwind criam conflito de especificidade que o browser resolve para o maior valor, causando ícones gigantes.
- Padrão correto: `<Icon size={20} className="shrink-0 flex-none" />` (sem `w-N h-N`).
- `shrink-0 flex-none` é obrigatório em qualquer ícone dentro de container `flex` para evitar distorção elástica.
- Correção aplicada em: `page.tsx`, `TrilhasAccordion.tsx`, `VideoPlayerHub.tsx`, `CockpitStage.tsx`, `FlashcardsTab.tsx`, `QuestionsTab.tsx`, `ResumeTab.tsx` — commit `e6e24e3` na `main`.

## 5. Backlog Vivo

1. Adicionar Testes Unitários para a Persistência de Zustand.
