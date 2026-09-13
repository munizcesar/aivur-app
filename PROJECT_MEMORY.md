## 1. Regras Vigentes

- **Paleta Institucional (tokens CSS):** usar EXCLUSIVAMENTE variáveis CSS do `globals.css` — `var(--color-bg)`, `var(--color-surface)`, `var(--color-border)`, `var(--color-heading)`, `var(--color-text)`, `var(--color-text-muted)`, `var(--color-primary)`, `var(--color-primary-hover)`, `var(--elite-red)`, `var(--elite-navy)`, `var(--elite-cream)`. **PROIBIDO** hex hardcoded (`#020C14`, `#C9A84C` etc.) em qualquer componente novo ou editado.
- Alternativas devem preservar CSS Grid com primeira coluna fixa de `40px` e segunda coluna flexível (`40px 1fr` / `40px_minmax(0,1fr)_24px`).
- O box model das alternativas mobile deve manter respiro lateral mínimo de `px-5` e padding vertical equivalente a `py-4`.
- Badges de alternativas devem permanecer fixas em `40x40px`, sem deformação ou layout shift.
- Skeletons devem reproduzir a geometria das alternativas e não causar CLS durante o carregamento.
- Estados pós-resposta devem congelar a interação, destacar acertos em Emerald, erros em Rose.
- Scroll de conteúdo deve permanecer interno ao Cockpit, sem deslocar Header ou Sidebar.
- **Abas do Stage:** usar `hidden`/`block` (nunca unmount) — especialmente a aba `video` — para reter o DOM do player.
- **Tab ids reais:** `video` | `resumo` | `flashcards` | `questoes` — type `StudyTab` em `useStudyStore.ts`. Qualquer nova aba deve ser adicionada ao type antes de renderizar.
- Flashcards 3D: usar arbitrary values Tailwind (`[perspective:1000px]`, `[transform:rotateY(180deg)]`, `[backface-visibility:hidden]`).
- Markdown do resumo: `react-markdown` + `remark-gfm` com components tipados; **não** depender de `@tailwindcss/typography` (não instalado).
- **Viewport Mobile:** usar `h-[100dvh]` (não `h-screen`) em containers fullscreen para evitar corte pela barra de endereços iOS/Android.
- **CLS em questões:** o bloco de justificativa pós-resposta deve ter `min-h-[140px]` permanente com `opacity-0` antes do submit — nunca crescer dinamicamente e empurrar o botão de ação.

## 2. Arquitetura Atual

- Next.js 16.3 com App Router e TypeScript (Strict Mode ativo).
- Tailwind CSS v4 para estilos utilitários.
- Zustand para estado assíncrono e sessão de estudo — com middleware `persist` (IndexedDB via `idb-keyval`, key: `aivur-study-store`). Sincroniza com Cloudflare Worker via `/api/sync`.
- Autenticação: cookie HttpOnly `aivur_session` verificado pelo Worker.
- Rota isolada do Cockpit: `/sala-de-aula` → `StudyCockpit.tsx`.
- Estado global: `src/store/useStudyStore.ts` — `progressData.answers: Record<string, boolean>` (false = erro).
- Dados locais de trilha: `src/mocks/trilhasMock.ts` (TRILHAS_MOCK, 4 trilhas).
- AI Engine: `src/app/api/ai/gerar-questoes/route.ts` (Edge runtime) → `callGroqWithFallback` → fallback mock garantido.

## 3. Estado Validado

- Cockpit renderiza Header, Sidebar responsiva e abas de Vídeo, Resumo, Flashcards e Questões.
- Sidebar é fixa no desktop e off-canvas no mobile.
- **TrilhaSala.tsx** em produção: todas as 4 abas funcionais, estado wired ao Zustand, botão "Aprofundar com IA" dispara rota Edge e injeta questões novas na fila.
- **Build de produção:** `npm run build` → exit 0, 23 páginas geradas, `/trilhas/[id]` com SSG para t-001..t-004.
- **Teste automatizado:** `scratch/test-trilhas.mjs` (Puppeteer) navega fluxo completo — video → flashcard → questões (state machine loop) → End State → clique em "Aprofundar com IA" → exit 0.

## 4. Regra de Titânio (Lucide + Flexbox)

- **NUNCA** usar `className="w-N h-N"` junto com `size={N}` em ícones Lucide.
- Padrão correto: `<Icon size={20} className="shrink-0 flex-none" />` (sem `w-N h-N`).
- `shrink-0 flex-none` é obrigatório em qualquer ícone dentro de container `flex`.

## 5. Backlog Vivo

1. Substituir `TRILHAS_MOCK` por dados reais do banco (Supabase/Drizzle) — schema ainda não criado.
2. Adicionar Testes Unitários para a Persistência de Zustand.
3. Trocar `GROQ_API_KEY` no `.env.local` — chave atual retorna 401, rota cai no fallback mock.

## 6. Última Sessão (UX Premium Cockpit)

- Arquivos editados: `StudyCockpit.tsx`, `CockpitStage.tsx`, `ResumeTab.tsx`, `FlashcardsTab.tsx`, `QuestionsTab.tsx`, `TrilhasAccordion.tsx`, `CockpitSidebar.tsx`.
- `npx tsc -p tsconfig.json --noEmit` → exit 0.
- Correções do plano original: tab `video` (não `aula`); sem `@tailwindcss/typography`; 3D via arbitrary values; paleta alinhada ao Navy/Gold já vigente no Cockpit.

## 7. Spatial UI & Cinematic Flow

- **Layout:** Main layout switched from CSS Grid to Flexbox (`lg:flex-row`); bg unified to `#091422`.
- **Navigation:** Floating pill capsule — `rounded-2xl` on mobile, `md:rounded-full md:w-fit` on desktop. Backdrop blur over dark navy.
- **Stage:** Cinematic panel with `rounded-3xl`, `bg-black/40`, `ring-1 ring-[#C9A84C]/10`.
- **Sidebar:** Glassmorphism floating panel — `lg:w-96`, `bg-[#0B1929]/90 backdrop-blur-xl`.
- **Global CSS:** Added `.no-scrollbar` utility.

## 8. Trilhas Microlearning Module — Sessão de Produção (commit 6559605)

### Arquivos Criados/Promovidos
- `src/mocks/trilhasMock.ts` — 4 trilhas com `video`, `flashcards[]`, `questoes[]`.
- `src/components/Trilhas/TrilhaSala.tsx` — Sala de Estudo de produção:
  - 4 abas: `video`, `resumo`, `flashcards`, `questoes` (sincronizadas com `StudyTab` do store).
  - Wired ao `useStudyStore` (`registerAnswer`, `toggleTopicCompletion`).
  - Paleta 100% via tokens CSS (zero hex hardcoded).
  - `h-[100dvh]` para viewport mobile.
  - Bloco de justificativa com `min-h-[140px]` permanente (fix CLS/Layout Shift).
  - Botão "Aprofundar com IA" → chama `/api/ai/gerar-questoes` → valida shape real em runtime antes de injetar questões.
- `src/app/api/ai/gerar-questoes/route.ts` — Edge runtime com:
  - Runtime guard no body: `typeof` checks antes de desestruturar → 400 se inválido.
  - Fallback mock garantido (3 questões) se Groq falhar.
- `src/app/trilhas/[id]/page.tsx` — Dynamic route com SSG.
## 1. Regras Vigentes

- **Git — Push seguro:** NUNCA usar `git push --force`. Sempre usar `git push --force-with-lease`, que cancela o push automaticamente se o remoto tiver recebido commits novos entre o fetch e o push, evitando sobrescrever/perder trabalho de outra sessão ou dispositivo sem aviso.
- **Paleta Institucional (tokens CSS):** usar EXCLUSIVAMENTE variáveis CSS do `globals.css` — `var(--color-bg)`, `var(--color-surface)`, `var(--color-border)`, `var(--color-heading)`, `var(--color-text)`, `var(--color-text-muted)`, `var(--color-primary)`, `var(--color-primary-hover)`, `var(--elite-red)`, `var(--elite-navy)`, `var(--elite-cream)`. **PROIBIDO** hex hardcoded (`#020C14`, `#C9A84C` etc.) em qualquer componente novo ou editado.
- Alternativas devem preservar CSS Grid com primeira coluna fixa de `40px` e segunda coluna flexível (`40px 1fr` / `40px_minmax(0,1fr)_24px`).
- O box model das alternativas mobile deve manter respiro lateral mínimo de `px-5` e padding vertical equivalente a `py-4`.
- Badges de alternativas devem permanecer fixas em `40x40px`, sem deformação ou layout shift.
- Skeletons devem reproduzir a geometria das alternativas e não causar CLS durante o carregamento.
- Estados pós-resposta devem congelar a interação, destacar acertos em Emerald, erros em Rose.
- Scroll de conteúdo deve permanecer interno ao Cockpit, sem deslocar Header ou Sidebar.
- **Abas do Stage:** usar `hidden`/`block` (nunca unmount) — especialmente a aba `video` — para reter o DOM do player.
- **Tab ids reais:** `video` | `resumo` | `flashcards` | `questoes` — type `StudyTab` em `useStudyStore.ts`. Qualquer nova aba deve ser adicionada ao type antes de renderizar.
- Flashcards 3D: usar arbitrary values Tailwind (`[perspective:1000px]`, `[transform:rotateY(180deg)]`, `[backface-visibility:hidden]`).
- Markdown do resumo: `react-markdown` + `remark-gfm` com components tipados; **não** depender de `@tailwindcss/typography` (não instalado).
- **Viewport Mobile:** usar `h-[100dvh]` (não `h-screen`) em containers fullscreen para evitar corte pela barra de endereços iOS/Android.
- **CLS em questões:** o bloco de justificativa pós-resposta deve ter `min-h-[140px]` permanente com `opacity-0` antes do submit — nunca crescer dinamicamente e empurrar o botão de ação.

## 2. Arquitetura Atual

- Next.js 16.3 com App Router e TypeScript (Strict Mode ativo).
- Tailwind CSS v4 para estilos utilitários.
- Zustand para estado assíncrono e sessão de estudo — com middleware `persist` (IndexedDB via `idb-keyval`, key: `aivur-study-store`). Sincroniza com Cloudflare Worker via `/api/sync`.
- Autenticação: cookie HttpOnly `aivur_session` verificado pelo Worker.
- Rota isolada do Cockpit: `/sala-de-aula` → `StudyCockpit.tsx`.
- Estado global: `src/store/useStudyStore.ts` — `progressData.answers: Record<string, boolean>` (false = erro).
- Dados locais de trilha: `src/mocks/trilhasMock.ts` (TRILHAS_MOCK, 4 trilhas).
- AI Engine: `src/app/api/ai/gerar-questoes/route.ts` (Edge runtime) → `callGroqWithFallback` → fallback mock garantido.

## 3. Estado Validado

- Cockpit renderiza Header, Sidebar responsiva e abas de Vídeo, Resumo, Flashcards e Questões.
- Sidebar é fixa no desktop e off-canvas no mobile.
- **TrilhaSala.tsx** em produção: todas as 4 abas funcionais, estado wired ao Zustand, botão "Aprofundar com IA" dispara rota Edge e injeta questões novas na fila.
- **Build de produção:** `npm run build` → exit 0, 23 páginas geradas, `/trilhas/[id]` com SSG para t-001..t-004.
- **Teste automatizado:** `scratch/test-trilhas.mjs` (Puppeteer) navega fluxo completo — video → flashcard → questões (state machine loop) → End State → clique em "Aprofundar com IA" → exit 0.

## 4. Regra de Titânio (Lucide + Flexbox)

- **NUNCA** usar `className="w-N h-N"` junto com `size={N}` em ícones Lucide.
- Padrão correto: `<Icon size={20} className="shrink-0 flex-none" />` (sem `w-N h-N`).
- `shrink-0 flex-none` é obrigatório em qualquer ícone dentro de container `flex`.

## 5. Backlog Vivo

1. Substituir `TRILHAS_MOCK` por dados reais do banco (Supabase/Drizzle) — schema ainda não criado.
2. Adicionar Testes Unitários para a Persistência de Zustand.
3. Trocar `GROQ_API_KEY` no `.env.local` — chave atual retorna 401, rota cai no fallback mock.

## 6. Última Sessão (UX Premium Cockpit)

- Arquivos editados: `StudyCockpit.tsx`, `CockpitStage.tsx`, `ResumeTab.tsx`, `FlashcardsTab.tsx`, `QuestionsTab.tsx`, `TrilhasAccordion.tsx`, `CockpitSidebar.tsx`.
- `npx tsc -p tsconfig.json --noEmit` → exit 0.
- Correções do plano original: tab `video` (não `aula`); sem `@tailwindcss/typography`; 3D via arbitrary values; paleta alinhada ao Navy/Gold já vigente no Cockpit.

## 7. Spatial UI & Cinematic Flow

- **Layout:** Main layout switched from CSS Grid to Flexbox (`lg:flex-row`); bg unified to `#091422`.
- **Navigation:** Floating pill capsule — `rounded-2xl` on mobile, `md:rounded-full md:w-fit` on desktop. Backdrop blur over dark navy.
- **Stage:** Cinematic panel with `rounded-3xl`, `bg-black/40`, `ring-1 ring-[#C9A84C]/10`.
- **Sidebar:** Glassmorphism floating panel — `lg:w-96`, `bg-[#0B1929]/90 backdrop-blur-xl`.
- **Global CSS:** Added `.no-scrollbar` utility.

## 8. Trilhas Microlearning Module — Sessão de Produção (commit 6559605)

### Arquivos Criados/Promovidos
- `src/mocks/trilhasMock.ts` — 4 trilhas com `video`, `flashcards[]`, `questoes[]`.
- `src/components/Trilhas/TrilhaSala.tsx` — Sala de Estudo de produção:
  - 4 abas: `video`, `resumo`, `flashcards`, `questoes` (sincronizadas com `StudyTab` do store).
  - Wired ao `useStudyStore` (`registerAnswer`, `toggleTopicCompletion`).
  - Paleta 100% via tokens CSS (zero hex hardcoded).
  - `h-[100dvh]` para viewport mobile.
  - Bloco de justificativa com `min-h-[140px]` permanente (fix CLS/Layout Shift).
  - Botão "Aprofundar com IA" → chama `/api/ai/gerar-questoes` → valida shape real em runtime antes de injetar questões.
- `src/app/api/ai/gerar-questoes/route.ts` — Edge runtime com:
  - Runtime guard no body: `typeof` checks antes de desestruturar → 400 se inválido.
  - Fallback mock garantido (3 questões) se Groq falhar.
- `src/app/trilhas/[id]/page.tsx` — Dynamic route com SSG.
- `src/components/Trilhas/TrilhaCriadorMicro.tsx` + `src/app/trilhas/criar/page.tsx`.
- `scratch/test-trilhas.mjs` — Script Puppeteer com state machine robusto.

### Dependências Instaladas
- `clsx`, `tailwind-merge`, `framer-motion` (eram referenciadas no código mas ausentes do `package.json`).

### Sistema de Failover Groq (Alta Disponibilidade)
Para evitar falhas por chaves revogadas (401) ou rate limit (429), foi implementado um sistema de rotação de chaves em `src/lib/groq.ts`:
1. **Múltiplas Chaves:** O sistema lê sequencialmente `GROQ_API_KEY`, `GROQ_API_KEY_2`, `GROQ_API_KEY_3`, `GROQ_API_KEY_4`, `GROQ_API_KEY_5` e `GROQ_API_KEY_FALLBACK` do `.env.local`.
2. **Failover Automático:** Se uma chave falhar com 401, 429 ou 5xx, o sistema tenta a próxima do array automaticamente.
3. **Log Seguro:** O index da chave usada e os eventos de failover são logados no console (ex: `[Groq Failover] Iniciando failover para a chave reserva no index 1...`) sem expor o valor da chave.
4. **Mock Fallback:** Se TODAS as chaves da fila falharem, o sistema captura a exceção globalmente em `route.ts` e injeta questões simuladas (Mock Fallback), garantindo que a tela nunca quebre para o aluno.

### Pendência Atualizada
- A chave primária `GROQ_API_KEY` (index 0) está retornando `401 Invalid API Key`. Como não há chaves secundárias no momento, o sistema esgota as tentativas e cai suavemente no fallback mock. Para restaurar o motor real de IA, basta adicionar chaves válidas em `.env.local` na ordem de prioridade descrita acima.
