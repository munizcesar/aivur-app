## 1. Regras Vigentes

- **Paleta Institucional (tokens CSS oficiais da marca):**`n  - Fundo branco limpo: #FFFFFF`n  - Azul-marinho profundo: #0A2E45`n  - Vermelho vivo: #C41230`n  - Creme editorial: #FBEBD0`n  - Azul acinzentado: #6B99B3`n  - **Regra:** Usar EXCLUSIVAMENTE variaveis CSS documentadas no globals.css que mapeiam essas cores exatas. PROIBIDO hex hardcoded em componentes.
- Alternativas devem preservar CSS Grid com primeira coluna fixa de `40px` e segunda coluna flexÃ­vel (`40px 1fr` / `40px_minmax(0,1fr)_24px`).
- O box model das alternativas mobile deve manter respiro lateral mÃ­nimo de `px-5` e padding vertical equivalente a `py-4`.
- Badges de alternativas devem permanecer fixas em `40x40px`, sem deformaÃ§Ã£o ou layout shift.
- Skeletons devem reproduzir a geometria das alternativas e nÃ£o causar CLS durante o carregamento.
- Estados pÃ³s-resposta devem congelar a interaÃ§Ã£o, destacar acertos em Emerald, erros em Rose.
- Scroll de conteÃºdo deve permanecer interno ao Cockpit, sem deslocar Header ou Sidebar.
- **Abas do Stage:** usar `hidden`/`block` (nunca unmount) â€” especialmente a aba `video` â€” para reter o DOM do player.
- **Tab ids reais:** `video` | `resumo` | `flashcards` | `questoes` â€” type `StudyTab` em `useStudyStore.ts`. Qualquer nova aba deve ser adicionada ao type antes de renderizar.
- Flashcards 3D: usar arbitrary values Tailwind (`[perspective:1000px]`, `[transform:rotateY(180deg)]`, `[backface-visibility:hidden]`).
- Markdown do resumo: `react-markdown` + `remark-gfm` com components tipados; **nÃ£o** depender de `@tailwindcss/typography` (nÃ£o instalado).
- **Viewport Mobile:** usar `h-[100dvh]` (nÃ£o `h-screen`) em containers fullscreen para evitar corte pela barra de endereÃ§os iOS/Android.
- **CLS em questÃµes:** o bloco de justificativa pÃ³s-resposta deve ter `min-h-[140px]` permanente com `opacity-0` antes do submit â€” nunca crescer dinamicamente e empurrar o botÃ£o de aÃ§Ã£o.

## 2. Arquitetura Atual

- Next.js 16.3 com App Router e TypeScript (Strict Mode ativo).
- Tailwind CSS v4 para estilos utilitÃ¡rios.
- Zustand para estado assÃ­ncrono e sessÃ£o de estudo â€” com middleware `persist` (IndexedDB via `idb-keyval`, key: `aivur-study-store`). Sincroniza com Cloudflare Worker via `/api/sync`.
- AutenticaÃ§Ã£o: cookie HttpOnly `aivur_session` verificado pelo Worker.
- Rota isolada do Cockpit: `/sala-de-aula` â†’ `StudyCockpit.tsx`.
- Estado global: `src/store/useStudyStore.ts` â€” `progressData.answers: Record<string, boolean>` (false = erro).
- Dados locais de trilha: `src/mocks/trilhasMock.ts` (TRILHAS_MOCK, 4 trilhas).
- AI Engine: `src/app/api/ai/gerar-questoes/route.ts` (Edge runtime) â†’ `callGroqWithFallback` â†’ fallback mock garantido.

## 3. Estado Validado

- Cockpit renderiza Header, Sidebar responsiva e abas de VÃ­deo, Resumo, Flashcards e QuestÃµes.
- Sidebar Ã© fixa no desktop e off-canvas no mobile.
- **TrilhaSala.tsx** em produÃ§Ã£o: todas as 4 abas funcionais, estado wired ao Zustand, botÃ£o "Aprofundar com IA" dispara rota Edge e injeta questÃµes novas na fila.
- **Build de produÃ§Ã£o:** `npm run build` â†’ exit 0, 23 pÃ¡ginas geradas, `/trilhas/[id]` com SSG para t-001..t-004.
- **Teste automatizado:** `scratch/test-trilhas.mjs` (Puppeteer) navega fluxo completo â€” video â†’ flashcard â†’ questÃµes (state machine loop) â†’ End State â†’ clique em "Aprofundar com IA" â†’ exit 0.

## 4. Regra de TitÃ¢nio (Lucide + Flexbox)

- **NUNCA** usar `className="w-N h-N"` junto com `size={N}` em Ã­cones Lucide.
- PadrÃ£o correto: `<Icon size={20} className="shrink-0 flex-none" />` (sem `w-N h-N`).
- `shrink-0 flex-none` Ã© obrigatÃ³rio em qualquer Ã­cone dentro de container `flex`.

## 5. Backlog Vivo

1. Substituir `TRILHAS_MOCK` por dados reais do banco (Supabase/Drizzle) â€” schema ainda nÃ£o criado.
2. Adicionar Testes UnitÃ¡rios para a PersistÃªncia de Zustand.
3. Trocar `GROQ_API_KEY` no `.env.local` â€” chave atual retorna 401, rota cai no fallback mock.

## 6. Ãšltima SessÃ£o (UX Premium Cockpit)

- Arquivos editados: `StudyCockpit.tsx`, `CockpitStage.tsx`, `ResumeTab.tsx`, `FlashcardsTab.tsx`, `QuestionsTab.tsx`, `TrilhasAccordion.tsx`, `CockpitSidebar.tsx`.
- `npx tsc -p tsconfig.json --noEmit` â†’ exit 0.
- CorreÃ§Ãµes do plano original: tab `video` (nÃ£o `aula`); sem `@tailwindcss/typography`; 3D via arbitrary values; paleta alinhada ao Navy/Gold jÃ¡ vigente no Cockpit.

## 7. Spatial UI & Cinematic Flow

- **Layout:** Main layout switched from CSS Grid to Flexbox (`lg:flex-row`); bg unified to `#091422`.
- **Navigation:** Floating pill capsule â€” `rounded-2xl` on mobile, `md:rounded-full md:w-fit` on desktop. Backdrop blur over dark navy.
- **Stage:** Cinematic panel with `rounded-3xl`, `bg-black/40`, `ring-1 ring-[#C9A84C]/10`.
- **Sidebar:** Glassmorphism floating panel â€” `lg:w-96`, `bg-[#0B1929]/90 backdrop-blur-xl`.
- **Global CSS:** Added `.no-scrollbar` utility.

## 8. Trilhas Microlearning Module â€” SessÃ£o de ProduÃ§Ã£o (commit 6559605)

### Arquivos Criados/Promovidos
- `src/mocks/trilhasMock.ts` â€” 4 trilhas com `video`, `flashcards[]`, `questoes[]`.
- `src/components/Trilhas/TrilhaSala.tsx` â€” Sala de Estudo de produÃ§Ã£o:
  - 4 abas: `video`, `resumo`, `flashcards`, `questoes` (sincronizadas com `StudyTab` do store).
  - Wired ao `useStudyStore` (`registerAnswer`, `toggleTopicCompletion`).
  - Paleta 100% via tokens CSS (zero hex hardcoded).
  - `h-[100dvh]` para viewport mobile.
  - Bloco de justificativa com `min-h-[140px]` permanente (fix CLS/Layout Shift).
  - BotÃ£o "Aprofundar com IA" â†’ chama `/api/ai/gerar-questoes` â†’ valida shape real em runtime antes de injetar questÃµes.
- `src/app/api/ai/gerar-questoes/route.ts` â€” Edge runtime com:
  - Runtime guard no body: `typeof` checks antes de desestruturar â†’ 400 se invÃ¡lido.
  - Fallback mock garantido (3 questÃµes) se Groq falhar.
- `src/app/trilhas/[id]/page.tsx` â€” Dynamic route com SSG.
## 1. Protocolo de Integridade de Execução

- **Nunca assuma o sucesso sem validação real:** Se um script, deploy ou teste automatizado disser "sucesso", o agente não deve assumir sucesso final antes de confirmar os efeitos no ambiente real de produção ou antes do usuário validar. O agente é passível de falhas arquiteturais ou alucinações de teste.
- **Transparência Absoluta em Diagnósticos:** Ao investigar problemas complexos, o agente deve relatar a causa raiz baseada em evidências em código e logs. Sem "achismos". Se não sabe a causa, deve assumir "Ainda investigando".
- **Git - Push Seguro Exclusivo:** O comando `git push --force` é ESTRITAMENTE PROIBIDO. Todo overwrite deve usar **exclusivamente** `git push --force-with-lease`.
- **Configuração de Segredos:** Secrets sensíveis (Cloudflare) NUNCA vão para `.env.local` de produção. Só via painel/CLI (`wrangler pages secret put`).
- **Edge Runtime:** Variáveis dinâmicas de ambiente devem ser lidas via `getRequestContext().env` no Next.js on Pages (Edge), nunca via `process.env`.
- **Validação Cruzada de Ambiente (Client vs Server):** Ficar atento a discrepâncias como persistência em `localStorage` (Zustand client-side) tentando ser lida por Server Components.

## 2. Regras Vigentes- **Secrets no Cloudflare Pages:** A via confiável para registrar Secrets neste projeto (ex: YOUTUBE_API_KEY) é via terminal `npx wrangler pages secret put NOME_DA_VAR --project-name aivur-app`, e **não** o painel web.
- **Leitura de Env Vars no Edge (Cloudflare):** Variáveis sensíveis e secrets injetadas no ambiente de produção (`@cloudflare/next-on-pages`) DEVEM ser lidas usando `getRequestContext().env.VAR_NAME` nas rotas `/api/*` rodando no Edge, em vez de depender apenas de `process.env`.
- **Git â€” Push seguro:** NUNCA usar `git push --force`. Sempre usar `git push --force-with-lease`, que cancela o push automaticamente se o remoto tiver recebido commits novos entre o fetch e o push, evitando sobrescrever/perder trabalho de outra sessÃ£o ou dispositivo sem aviso.
- **Paleta Institucional (tokens CSS oficiais da marca):**`n  - Fundo branco limpo: #FFFFFF`n  - Azul-marinho profundo: #0A2E45`n  - Vermelho vivo: #C41230`n  - Creme editorial: #FBEBD0`n  - Azul acinzentado: #6B99B3`n  - **Regra:** Usar EXCLUSIVAMENTE variaveis CSS documentadas no globals.css que mapeiam essas cores exatas. PROIBIDO hex hardcoded em componentes.
- Alternativas devem preservar CSS Grid com primeira coluna fixa de `40px` e segunda coluna flexÃ­vel (`40px 1fr` / `40px_minmax(0,1fr)_24px`).
- O box model das alternativas mobile deve manter respiro lateral mÃ­nimo de `px-5` e padding vertical equivalente a `py-4`.
- Badges de alternativas devem permanecer fixas em `40x40px`, sem deformaÃ§Ã£o ou layout shift.
- Skeletons devem reproduzir a geometria das alternativas e nÃ£o causar CLS durante o carregamento.
- Estados pÃ³s-resposta devem congelar a interaÃ§Ã£o, destacar acertos em Emerald, erros em Rose.
- Scroll de conteÃºdo deve permanecer interno ao Cockpit, sem deslocar Header ou Sidebar.
- **Abas do Stage:** usar `hidden`/`block` (nunca unmount) â€” especialmente a aba `video` â€” para reter o DOM do player.
- **Tab ids reais:** `video` | `resumo` | `flashcards` | `questoes` â€” type `StudyTab` em `useStudyStore.ts`. Qualquer nova aba deve ser adicionada ao type antes de renderizar.
- Flashcards 3D: usar arbitrary values Tailwind (`[perspective:1000px]`, `[transform:rotateY(180deg)]`, `[backface-visibility:hidden]`).
- Markdown do resumo: `react-markdown` + `remark-gfm` com components tipados; **nÃ£o** depender de `@tailwindcss/typography` (nÃ£o instalado).
- **Viewport Mobile:** usar `h-[100dvh]` (nÃ£o `h-screen`) em containers fullscreen para evitar corte pela barra de endereÃ§os iOS/Android.
- **CLS em questÃµes:** o bloco de justificativa pÃ³s-resposta deve ter `min-h-[140px]` permanente com `opacity-0` antes do submit â€” nunca crescer dinamicamente e empurrar o botÃ£o de aÃ§Ã£o.

## 2. Arquitetura Atual

- Next.js 16.3 com App Router e TypeScript (Strict Mode ativo).
- Tailwind CSS v4 para estilos utilitÃ¡rios.
- Zustand para estado assÃ­ncrono e sessÃ£o de estudo â€” com middleware `persist` (IndexedDB via `idb-keyval`, key: `aivur-study-store`). Sincroniza com Cloudflare Worker via `/api/sync`.
- AutenticaÃ§Ã£o: cookie HttpOnly `aivur_session` verificado pelo Worker.
- Rota isolada do Cockpit: `/sala-de-aula` â†’ `StudyCockpit.tsx`.
- Estado global: `src/store/useStudyStore.ts` â€” `progressData.answers: Record<string, boolean>` (false = erro).
- Dados locais de trilha: `src/mocks/trilhasMock.ts` (TRILHAS_MOCK, 4 trilhas).
- AI Engine: `src/app/api/ai/gerar-questoes/route.ts` (Edge runtime) â†’ `callGroqWithFallback` â†’ fallback mock garantido.

## 3. Estado Validado

- Cockpit renderiza Header, Sidebar responsiva e abas de VÃ­deo, Resumo, Flashcards e QuestÃµes.
- Sidebar Ã© fixa no desktop e off-canvas no mobile.
- **TrilhaSala.tsx** em produÃ§Ã£o: todas as 4 abas funcionais, estado wired ao Zustand, botÃ£o "Aprofundar com IA" dispara rota Edge e injeta questÃµes novas na fila.
- **Build de produÃ§Ã£o:** `npm run build` â†’ exit 0, 23 pÃ¡ginas geradas, `/trilhas/[id]` com SSG para t-001..t-004.
- **Teste automatizado:** `scratch/test-trilhas.mjs` (Puppeteer) navega fluxo completo â€” video â†’ flashcard â†’ questÃµes (state machine loop) â†’ End State â†’ clique em "Aprofundar com IA" â†’ exit 0.

## 4. Regra de TitÃ¢nio (Lucide + Flexbox)

- **NUNCA** usar `className="w-N h-N"` junto com `size={N}` em Ã­cones Lucide.
- PadrÃ£o correto: `<Icon size={20} className="shrink-0 flex-none" />` (sem `w-N h-N`).
- `shrink-0 flex-none` Ã© obrigatÃ³rio em qualquer Ã­cone dentro de container `flex`.

## 5. Backlog Vivo

1. Substituir `TRILHAS_MOCK` por dados reais do banco (Supabase/Drizzle) â€” schema ainda nÃ£o criado.
2. Adicionar Testes UnitÃ¡rios para a PersistÃªncia de Zustand.
3. Trocar `GROQ_API_KEY` no `.env.local` â€” chave atual retorna 401, rota cai no fallback mock.

## 6. Ãšltima SessÃ£o (UX Premium Cockpit)

- Arquivos editados: `StudyCockpit.tsx`, `CockpitStage.tsx`, `ResumeTab.tsx`, `FlashcardsTab.tsx`, `QuestionsTab.tsx`, `TrilhasAccordion.tsx`, `CockpitSidebar.tsx`.
- `npx tsc -p tsconfig.json --noEmit` â†’ exit 0.
- CorreÃ§Ãµes do plano original: tab `video` (nÃ£o `aula`); sem `@tailwindcss/typography`; 3D via arbitrary values; paleta alinhada ao Navy/Gold jÃ¡ vigente no Cockpit.

## 7. Spatial UI & Cinematic Flow

- **Layout:** Main layout switched from CSS Grid to Flexbox (`lg:flex-row`); bg unified to `#091422`.
- **Navigation:** Floating pill capsule â€” `rounded-2xl` on mobile, `md:rounded-full md:w-fit` on desktop. Backdrop blur over dark navy.
- **Stage:** Cinematic panel with `rounded-3xl`, `bg-black/40`, `ring-1 ring-[#C9A84C]/10`.
- **Sidebar:** Glassmorphism floating panel â€” `lg:w-96`, `bg-[#0B1929]/90 backdrop-blur-xl`.
- **Global CSS:** Added `.no-scrollbar` utility.

## 8. Trilhas Microlearning Module â€” SessÃ£o de ProduÃ§Ã£o (commit 6559605)

### Arquivos Criados/Promovidos
- `src/mocks/trilhasMock.ts` â€” 4 trilhas com `video`, `flashcards[]`, `questoes[]`.
- `src/components/Trilhas/TrilhaSala.tsx` â€” Sala de Estudo de produÃ§Ã£o:
  - 4 abas: `video`, `resumo`, `flashcards`, `questoes` (sincronizadas com `StudyTab` do store).
  - Wired ao `useStudyStore` (`registerAnswer`, `toggleTopicCompletion`).
  - Paleta 100% via tokens CSS (zero hex hardcoded).
  - `h-[100dvh]` para viewport mobile.
  - Bloco de justificativa com `min-h-[140px]` permanente (fix CLS/Layout Shift).
  - BotÃ£o "Aprofundar com IA" â†’ chama `/api/ai/gerar-questoes` â†’ valida shape real em runtime antes de injetar questÃµes.
- `src/app/api/ai/gerar-questoes/route.ts` â€” Edge runtime com:
  - Runtime guard no body: `typeof` checks antes de desestruturar â†’ 400 se invÃ¡lido.
  - Fallback mock garantido (3 questÃµes) se Groq falhar.
- `src/app/trilhas/[id]/page.tsx` â€” Dynamic route com SSG.
- `src/components/Trilhas/TrilhaCriadorMicro.tsx` + `src/app/trilhas/criar/page.tsx`.
- `scratch/test-trilhas.mjs` â€” Script Puppeteer com state machine robusto.

### DependÃªncias Instaladas
- `clsx`, `tailwind-merge`, `framer-motion` (eram referenciadas no cÃ³digo mas ausentes do `package.json`).

### Sistema de Failover Groq (Alta Disponibilidade)
Para evitar falhas por chaves revogadas (401) ou rate limit (429), foi implementado um sistema de rotaÃ§Ã£o de chaves em `src/lib/groq.ts`:
1. **MÃºltiplas Chaves:** O sistema lÃª sequencialmente `GROQ_API_KEY`, `GROQ_API_KEY_2`, `GROQ_API_KEY_3`, `GROQ_API_KEY_4`, `GROQ_API_KEY_5` e `GROQ_API_KEY_FALLBACK` do `.env.local`.
2. **Failover AutomÃ¡tico:** Se uma chave falhar com 401, 429 ou 5xx, o sistema tenta a prÃ³xima do array automaticamente.
3. **Log Seguro:** O index da chave usada e os eventos de failover sÃ£o logados no console (ex: `[Groq Failover] Iniciando failover para a chave reserva no index 1...`) sem expor o valor da chave.
4. **Mock Fallback:** Se TODAS as chaves da fila falharem, o sistema captura a exceÃ§Ã£o globalmente em `route.ts` e injeta questÃµes simuladas (Mock Fallback), garantindo que a tela nunca quebre para o aluno.

### PendÃªncia Atualizada
- A chave primÃ¡ria `GROQ_API_KEY` (index 0) estÃ¡ retornando `401 Invalid API Key`. Como nÃ£o hÃ¡ chaves secundÃ¡rias no momento, o sistema esgota as tentativas e cai suavemente no fallback mock. Para restaurar o motor real de IA, basta adicionar chaves vÃ¡lidas em `.env.local` na ordem de prioridade descrita acima.

## 9. Motor de ValidaÃ§Ã£o Zod (Schema-Driven AI) â€” SessÃ£o atual

### Arquivos Criados/Modificados
- `src/lib/validations/trilha.ts` â€” **[NOVO]** Contrato Ãºnico de dados:
  - `TrilhaSchema` â€” fonte de verdade completa (video + flashcards min(3) + questoes min(3), opcoes `.length(4)`).
  - `AIExpansionSchema` â€” contrato da saÃ­da da IA (questoes min(1) + flashcards optional).
  - Types exportados: `TrilhaTemplateType`, `AIExpansionType`.
- `src/app/api/ai/gerar-questoes/route.ts` â€” **[MODIFICADO]**:
  - Import de `AIExpansionSchema`.
  - `JSON.parse(content)` substituÃ­do por `AIExpansionSchema.safeParse(...)`.
  - Formato invÃ¡lido da IA â†’ log estruturado + throw â†’ cai no catch existente â†’ fallback mock ativado.
  - **Gap corrigido:** antes a IA podia retornar `opcoes` com 3 itens e quebrar o grid de alternativas silenciosamente.

### VerificaÃ§Ã£o
- `npx tsc -p tsconfig.json --noEmit` â†’ exit 0 (zero erros TypeScript).
- Commit: `647dad5` â€” "feat: adaptive prompt for gerar-questoes + regression tests (11/11 pass)"

## 10. InvestigaÃ§Ã£o: Timing do Failover Groq (nÃ£o bloqueante)

### Dados Medidos (2026-09-13)
MediÃ§Ã£o com `groq-sdk` diretamente (Node.js), simulando o loop de `callGroqWithFallback`:

| CenÃ¡rio | Status | Tempo atÃ© exceÃ§Ã£o | Delay pÃ³s-falha | Custo total/chave |
|---|---|---|---|---|
| Chave formato errado | 401 | ~37ms | 500ms | ~537ms |
| Chave vazia | 401 | ~85ms | 500ms | ~585ms |
| Chave projeto (`gsk_9mgS...`) | 401 | ~326ms | 500ms | ~826ms |

**ProjeÃ§Ã£o worst-case (5 chaves todas 401):** `5 Ã— 826ms = ~4.1s` atÃ© ativar mock fallback.

### DiagnÃ³stico do Problema
O delay de `500ms` entre chaves (`src/lib/groq.ts` linha 67) foi concebido para erros de rate-limit (429) ou falhas de servidor (5xx), onde o delay faz sentido. Para erros `401` (chave invÃ¡lida), o delay Ã© **desnecessÃ¡rio** â€” a resposta jÃ¡ chegou em ~326ms e sabemos imediatamente que a chave Ã© invÃ¡lida permanentemente.

### Proposta de OtimizaÃ§Ã£o (BACKLOG)
```ts
// Em callGroqWithFallback, diferenciar delay por tipo de erro:
const delay = status === 401 ? 0 : 500; // 401 = chave invÃ¡lida permanente, sem delay
await new Promise((resolve) => setTimeout(resolve, delay));
```
**Ganho projetado com 5 chaves 401:** `5 Ã— 326ms = ~1.6s` (vs. 4.1s atual) â€” reduÃ§Ã£o de **61%** no tempo atÃ© o mock.

### DecisÃ£o
- **NÃ£o implementar agora** â€” com apenas 1 chave no `.env.local`, o loop executa 1 iteraÃ§Ã£o: `~326ms` (chave) + `throw` â†’ `catch` â†’ mock. Tempo atual aceitÃ¡vel (~326ms).
- **Implementar quando** houver 3+ chaves todas invÃ¡lidas em cascata (ex: rotaÃ§Ã£o de chaves vencidas). Prioridade: **Backlog Baixa**.
- **Tarefa futura:** substituir delay fixo por `const delay = status === 401 ? 0 : 500` em `src/lib/groq.ts`.

## 11. Auditoria: NavegaÃ§Ã£o em CriarTrilhaView.tsx (2026-09-13)

### Resultado: âœ… JÃ¡ estÃ¡ correto â€” nenhuma alteraÃ§Ã£o necessÃ¡ria

Auditoria completa de todos os usos de `window.history` e `router.push` no codebase:

- **`CriarTrilhaView.tsx`**: botÃ£o "Verificar minhas trilhas" usa `onNavigateToMinhas` (callback de prop) â†’ `TrilhasContainer.handleNavigateToMinhas` â†’ `router.push("/trilhas?view=minhas", { scroll: false })`. PadrÃ£o correto.
- **`handleSave`**: usa `router.push(`/mentor/${draftCourse.id}`)`. Correto.
- **`TrilhasContainer.tsx`**: todas as transiÃ§Ãµes usam `router.push` com `{ scroll: false }`. Correto.
- **`WizardStep3.tsx`**: usa `window.history.pushState` (nÃ£o `back()`) como interceptor intencional para capturar `popstate` e exibir modal de confirmaÃ§Ã£o antes de sair do quiz. PadrÃ£o legÃ­timo de UX defensivo.

**`window.history.back()` nÃ£o existe em nenhum arquivo do projeto.** O item de backlog foi resolvido em sessÃ£o anterior sem registro explÃ­cito.

## 12. MigraÃ§Ã£o de IA para TrilhaSchema (Etapa 3 de 3)

### MudanÃ§as Implementadas
- **RefatoraÃ§Ã£o do Endpoint de IA (/api/ai/gerar-trilha):** O prompt de geraÃ§Ã£o e a extraÃ§Ã£o do JSON foram totalmente refatorados. Antes, gerava um Course complexo (composto por matÃ©rias, nichos e tÃ³picos iterÃ¡veis). Agora, instrui o modelo a retornar diretamente o formato micro-learning TrilhaSchema (um vÃ­deo, lista de flashcards e lista de questÃµes), mapeando perfeitamente para o armazenamento persistido. O Edge runtime foi removido em prol do 
odejs runtime para suportar pacotes nativos de extraÃ§Ã£o (ex: pdf-parse).
- **MigraÃ§Ã£o de Rotas:** Todos os arquivos da pasta obsoleta /api/mentor/* foram migrados para /api/ai/* e a API foi atualizada em todos os callers do Cockpit (FlashcardsTab, QuestionsTab, ResumeTab, useTopicContent).
- **RefatoraÃ§Ã£o da View de CriaÃ§Ã£o (CriarTrilhaView.tsx):** A view foi completamente simplificada. O estado de eview complexo (que permitia editar disciplinas, nichos e itens manualmente antes de salvar) foi removido. Agora, uma vez carregado, exibe apenas a ementa simplificada da trilha gerada (TÃ­tulo, Disciplina e contagem de QuestÃµes/Flashcards) e um botÃ£o de salvamento atÃ´mico.
- **Acoplamento com Zustand (useStudyStore):** A view de criaÃ§Ã£o agora salva a Trilha finalizada no array global customTrilhas via ddCustomTrilha (persistÃªncia unificada em localStorage), roteando imediatamente para o Cockpit unificado (/trilhas/[id]). O Cockpit (TrilhaSala.tsx) consegue ler tanto o TRILHAS_MOCK estÃ¡tico quanto as dinÃ¢micas do useStudyStore.
- **Limpeza do Legado:** Foram removidas todas as interfaces remanescentes da Ã¡rea Mentor, inclusive subcomponentes (src/components/Mentor/*) e a prÃ³pria dependÃªncia do IDBKeyVal em visualizaÃ§Ãµes antigas (como MinhasTrilhasView).

### Status e PrÃ³ximos Passos
- O refactor da trilha estÃ¡ 100% concluÃ­do. O cÃ³digo passa com zero erros de TS (
pm run build sucesso) e o script de teste de mock (scratch/test-ai-route.mjs) foi testado contra a API rodando.
- Nenhum link morto remanescente (rotas /trilhas/novo apontam diretamente para criaÃ§Ã£o e redirecionam para o Cockpit).
- A base do app estÃ¡ estruturada inteiramente sobre o padrÃ£o do Cockpit (Microlearning).
- **Ajuste UX (CriarTrilhaView):** Adicionada capacidade de renomear o tÃ­tulo da trilha gerada inline (click-to-edit com Ã­cone Edit2) antes de salvÃ¡-la definitivamente no Zustand, mantendo o restante do fluxo 100% automatizado.
- **PDF Parsing:** Leitura de PDFs foi movida para o client-side (no CriarTrilhaView.tsx) usando pdfjs-dist para suportar nativamente a restriÃ§Ã£o do Edge Runtime do Cloudflare Pages sem quebrar a geraÃ§Ã£o da IA.

- Stage 1-5 UI e IA fixes no Cockpit Microlearning concluídos (YouTube real, Resumo Markdown, Flashcards overflow, Questões grid, Trilhas Page Palette).


## 13. Cockpit V2 — TrilhaSalaV2 (2026-09-13)

### Motivação
O TrilhaSala.tsx original apresentava bugs recorrentes de layout (coluna direita vazia). Decisão: construir um Cockpit novo isolado em paralelo, **sem tocar no original**.

### Arquivos Criados
- **src/components/Trilhas/TrilhaSalaV2.tsx** — Componente novo e isolado.
  - Layout: página vertical com accordion de 4 seções empilhadas (Vídeo, Resumo, Flashcards, Questões).
  - Sem tabs, sem grid de duas colunas. Seção ativa ocupa 100% da largura disponível.
  - Reutiliza os mesmos dados: TRILHAS_MOCK, customTrilhas do useStudyStore, egisterAnswer, 	oggleTopicCompletion.
  - Estilos scoped via <style> inline, usando exclusivamente variáveis CSS de globals.css (sem hex hardcoded).
  - TS check: exit 0 (zero erros).

- **src/app/trilhas-v2/[id]/page.tsx** — Rota de teste /trilhas-v2/[id].
  - Usa generateStaticParams com TRILHAS_MOCK (mesmo padrão da rota original).
  - Renderiza <TrilhaSalaV2 /> com key={id}.

### Status Final da Sessão
- **Feito e validado:** Cockpit V2 completo. A rota antiga (tabs) foi substituída em definitivo (rollout REALIZADO na rota principal `/trilhas/[id]`, `TrilhaSala.tsx` original removido, `trilhas-v2` deletado). URL de produção confirmada: `https://aivur-app.pages.dev/trilhas/[id]`.
- **Feito (Aguardando teste E2E):** Correção de confiabilidade do `/api/ai/gerar-trilha` (Schema Zod estrito + Fixer Prompt de reparo inteligente). Teste E2E bloqueado por erro 401/429 na `GROQ_API_KEY`.
- **Feito (Aguardando aprovação visual):** Fase 4 (Flashcards com cores dinâmicas Frente/Verso - Opção A). Implementada com sucesso em Light Mode (confirmado) e Dark Mode. A validação visual do Dark Mode (texto navy forte sobre creme) está com PENDÊNCIA ABERTA no lado do usuário (as 2 primeiras tentativas de screenshot falharam, pendente verificação da 3ª).

### Backlog Priorizado (Próximos Passos)
1. 🔧 **GROQ_API_KEY (Externo):** Resolver erro 401/429 no `.env.local` e painel Groq.
2. 🔧 **Confirmar Dark Mode do Flashcard:** Validar visualmente o screenshot da frente do flashcard em tema escuro (texto navy sólido, accordion aberto).
3. 🧪 **Fixer Prompt E2E:** Testar o motor de autocorreção JSON assim que houver chave de IA válida.
4. 🔧 **Fase 2:** Geração lazy (sob demanda) das demais abas.
5. 🔧 **Fase 3:** Refatorar layout de questões para o "padrão banca".
6. 🔧 **Débito Técnico CSS:** Refatorar `--elite-*` (variáveis com nomenclatura invertida entre temas).
7. 🔧 **Fase 5:** Módulo de retenção (streak, progresso gamificado do edital).
8. 🔧 **Integração D1 (Schema):** `QuestoesPanel/TrilhaSalaV2.tsx` ainda recebe ID no formato do mock (t-XXX); quando a trilha passar a usar o formato oficial do catálogo (p1/m3/etc.), a prop de ID muda de fonte, mas a lógica de fetch ao D1 já implementada hoje não precisa mudar.
