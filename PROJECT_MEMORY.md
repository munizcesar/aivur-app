# AIVUR — Memória Operacional do Projeto

## 1. Regras Vigentes

- **Paleta do Cockpit (Navy/Gold):** `#0B1929`, `#091422`, `#122338`, acento `#C9A84C`, texto creme `#FBEBD0`; feedbacks de acerto/erro em Emerald/Rose.
- Alternativas devem preservar CSS Grid com primeira coluna fixa de `40px` e segunda coluna flexível (`40px 1fr` / `40px_minmax(0,1fr)_24px`).
- O box model das alternativas mobile deve manter respiro lateral mínimo de `px-5` e padding vertical equivalente a `py-4`.
- Badges de alternativas devem permanecer fixas em `40x40px`, sem deformação ou layout shift.
- Skeletons devem reproduzir a geometria das alternativas e não causar CLS durante o carregamento.
- Estados pós-resposta devem congelar a interação, destacar acertos em Emerald, erros em Rose e callout de gabarito com borda dourada.
- Scroll de conteúdo deve permanecer interno ao Cockpit, sem deslocar Header ou Sidebar.
- **Abas do Stage:** usar `hidden`/`block` (nunca unmount) — especialmente a aba `video` — para reter o DOM do player.
- **Tab ids reais:** `video` | `resumo` | `flashcards` | `questoes` (não existe `aula`).
- Flashcards 3D: usar arbitrary values Tailwind (`[perspective:1000px]`, `[transform:rotateY(180deg)]`, `[backface-visibility:hidden]`) — classes como `rotate-y-180` / `perspective-1000` não existem no Tailwind base do projeto.
- Markdown do resumo: `react-markdown` + `remark-gfm` com components tipados; **não** depender de `@tailwindcss/typography` (não instalado).

## 2. Arquitetura Atual

- Next.js com App Router e TypeScript.
- Tailwind CSS v4 para estilos utilitários, com estilos inline nas propriedades críticas de geometria e contraste.
- Zustand para estado assíncrono e sessão de estudo — com middleware `persist` (localStorage, key: `aivur-study-store`).
- Rota isolada do Cockpit: `/sala-de-aula`.
- Orquestrador principal: `src/components/Cockpit/StudyCockpit.tsx`.
- Stage: `src/components/Cockpit/parts/CockpitStage.tsx` (Guard Clause + retenção DOM das abas).
- Estado global: `src/store/useStudyStore.ts`.
- Hook de hidratação SSR: `src/hooks/useHydrated.ts`.
- Dados locais de trilha: `src/mocks/studyPathMock.ts` + BFF `/api/study-path`.
- Skeleton de questões: `src/components/UI/QuestionSkeleton.tsx`.

## 3. Estado Validado

- Cockpit renderiza Header, Sidebar responsiva e abas de Vídeo, Resumo, Flashcards e Questões.
- Sidebar é fixa no desktop e off-canvas no mobile (z-50, backdrop z-40); área de scroll com `pb-24` seguro.
- Questões: seleção, micro-loading (~280ms) antes do reveal Emerald/Rose, bloqueio pós-envio e gabarito com callout dourado (`role="status"` / `aria-live`).
- Mobile de questões: clique na alternativa seleciona e valida com o mesmo micro-loading.
- **Modo Flow (Auto-Resume):** `currentTopicId` persiste no localStorage; aluno retoma exatamente onde parou.
- **Defesa de Hidratação:** `useHydrated` + skeleton/loader dourado no orquestrador; Guard Clause no `CockpitStage` se `!activeTopic || !activeModuleId`.
- **Persistência parcial:** `isLoading` excluído do `partialize` para não reidratar estado transiente.
- **URL params têm prioridade** sobre estado persistido no sync do `useEffect`.
- **TrilhasAccordion (Navy/Gold):** progresso real via `completedTopicIds`, badge `{pct}%` (`bg-[#122338] text-[#C9A84C]`), barra emerald e pílulas de ação (Aula/Resumo/Questões).
- **Hub de Videoaulas:** `VideoPlayerHub.tsx` com retenção de DOM via Stage `hidden`/`block`.
- **Arena de Flashcards (Active Recall 3D):** flip 3D com `isFlipped`, borda gold na frente / emerald no verso, SRS simulado (Errei/Bom/Fácil).
- **Leitor Premium de Resumos:** Reader Mode (`max-w-4xl`, `bg-[#091422]`, tipografia navy/gold) com Markdown tipado.
- **Motor Serverless & Data Fetching:** API Routes mentor (`/api/mentor/*`) + `loadStudyPath` no Zustand.

## 4. Regra de Titânio (Lucide + Flexbox)

- **NUNCA** usar `className="w-N h-N"` junto com `size={N}` em ícones Lucide.
- Padrão correto: `<Icon size={20} className="shrink-0 flex-none" />` (sem `w-N h-N`).
- `shrink-0 flex-none` é obrigatório em qualquer ícone dentro de container `flex`.

## 5. Backlog Vivo

1. Adicionar Testes Unitários para a Persistência de Zustand.
2. Validar visualmente no browser: clique rápido em trilha → loader dourado; aba Flashcards → flip 3D.

## 6. Última Sessão (UX Premium Cockpit)

- Arquivos editados: `StudyCockpit.tsx`, `CockpitStage.tsx`, `ResumeTab.tsx`, `FlashcardsTab.tsx`, `QuestionsTab.tsx`, `TrilhasAccordion.tsx`, `CockpitSidebar.tsx`.
- `npx tsc -p tsconfig.json --noEmit` → exit 0.
- Correções do plano original: tab `video` (não `aula`); sem `@tailwindcss/typography`; 3D via arbitrary values; paleta alinhada ao Navy/Gold já vigente no Cockpit.

## 7. Spatial UI & Cinematic Flow

- **Layout:** Main layout switched from CSS Grid to Flexbox (`lg:flex-row`); bg unified to `#091422`.
- **Navigation:** Floating pill capsule — `rounded-2xl` on mobile (full-width, `overflow-x-auto no-scrollbar`), `md:rounded-full md:w-fit` on desktop. Backdrop blur over dark navy.
- **Header/Breadcrumb:** Converted to breadcrumb path (`Módulo / Tópico`) with `text-sm text-slate-400`. Completion button now navy/gold palette (`bg-[#122338] text-[#C9A84C]`) with emerald variant for completed state.
- **Stage:** Cinematic panel with `rounded-3xl`, `bg-black/40`, `ring-1 ring-[#C9A84C]/10`, `shadow-[0_0_40px_rgba(0,0,0,0.5)]`. Tabs retained in DOM with `hidden`/`block` — player iframe never unmounts.
- **Sidebar:** Glassmorphism floating panel — `lg:w-96`, `bg-[#0B1929]/90 backdrop-blur-xl`, `border border-[#C9A84C]/15`, `rounded-3xl`, inner padding `p-4`.
- **ResumeTab:** Editorial reader mode — `bg-transparent`, `p-6 md:p-12`, `max-w-3xl`, `text-[1.05rem] md:text-[1.15rem]`, `leading-[1.8]`, gold titles.
- **Global CSS:** Added `.no-scrollbar` utility (hides scrollbar for webkit/firefox/IE).
- `npx tsc -p tsconfig.json --noEmit` → exit 0.
