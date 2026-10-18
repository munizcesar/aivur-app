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

## 14. Refatoração Visual da Página `/trilhas` (Outubro 2026)

### Objetivos Concluídos
- **Auditoria e Mapeamento:** Mapeado componentes compartilhados vs exclusivos. O Cockpit V2 (`/trilhas/[id]`) foi totalmente preservado sem interferências.
- **Refatoração Estrutural:** O arquivo `src/app/trilhas/page.tsx` foi limpo, extraindo o layout de grid para o novo componente `UserTrilhasGrid.tsx` e o progresso para `TrilhaProgressBar.tsx`.
- **Aprimoramento Visual e UX:** Melhorada a responsividade, aplicado design premium nos cards, adicionadas ações de renomear e excluir trilhas com modais estilizados.
- **Resolução de Lint:** Corrigido o aviso `react-hooks/set-state-in-effect` isolando a hidratação e aplicando suppressão seletiva, garantindo `exit 0` no build de linting.

### Próximos Passos (Backlog Atualizado)
As dependências do Cockpit V2 continuam as mesmas, e a migração de Mock para banco real (Drizzle) e recursos de gamificação permanecem mapeados para as próximas iterações.

## 15. Etapa 5D.8 — Ajustes Visuais e Sistema Resiliente de Geração (Concluído)

**Status:** CONCLUÍDA E VALIDADA EM PRODUÇÃO.

### Evidências e Entregas
- **Commits publicados:**
  - `2f1c59c` — fix(ai): atualiza modelos Groq de geração de trilhas
  - `35199d7` — fix(trilhas): ajusta composição da criação de trilha
- **Deploy:** Concluído com sucesso na Cloudflare Pages.
- **Rota Validada:** `https://aivur.com.br/trilhas/novo`
- **Validação Visual (Interface):** A badge ("Mentor AIVUR 360 · Criação") foi removida, o espaçamento superior foi reduzido de forma harmoniosa, e o formulário permaneceu íntegro.
- **Validação E2E (Geração Real da IA):**
  - Criação de trilha efetuada com `Direito Constitucional` como tema.
  - O endpoint `/api/ai/gerar-trilha` processou a requisição e devolveu **HTTP 200**.
  - Resumo, Flashcards e Questões gerados corretamente no formato JSON esperado e validados com o `StrictTrilhaSchema`.
  - A trilha foi persistida corretamente no D1, provado pela **sobrevivência da rotação do Reload**.
  - O registro de teste no banco de produção foi limpado via interface após o sucesso, sem afetar dados reais.
  - Nenhum erro visual ou de runtime (frontend/backend) foi detectado no fluxo inteiro.

### Ressalvas de Validação Rigorosa (Failover/Fixer)
- O **Fallback de Matriz** (`A → B → C`) **NÃO** foi forçado artificialmente no ambiente de Produção.
- O **Fixer Prompt** (Self-healing JSON Engine) **NÃO** foi forçado artificialmente em produção.
- **Ambos os mecanismos de resiliência foram validados ativamente por análise estática, revisão sintática do arquivo modificado e auditoria ponta-a-ponta no código**. A geração real em produção foi válida na primeira tentativa, portanto não houve necessidade de acionar esses caminhos. Não introduzimos falhas artificiais, alteramos secrets ou modificamos código apenas para fabricar esses cenários.

## 16. Geração Lazy e Persistência dos Gaveteiros de Estudo (Trilhas Cockpit V2)

**Status:** CONCLUÍDO E VALIDADO (8/8 TESTES PASS).

### Arquivos Modificados:
- `src/app/api/trilhas/[id]/gerar-mais/route.ts`: Adicionado suporte a `tipo: 'resumo'` (persistência em `trilhas.video_resumo` e `trilhas.video_resumo_markdown`), parada imediata em erro HTTP 429 para evitar cascata destrutiva entre modelos, e proteção contra duplicação de flashcards/questões.
- `src/components/Trilhas/TrilhaSalaV2.tsx`: Ciclo de 4 estados (`nao_preparado`, `preparando`, `preparado`, `erro`) independente por módulo, carregamento unificado com o banco D1, persistência de posições via `useStudyStore`, geração lazy ativada no momento da abertura do gaveteiro sem chamadas desnecessárias aos demais módulos, e mutex de bloqueio de duplo clique (`generatingRef`).

### Decisões Arquiteturais:
1. **Geração Lazy Sob Demanda:** A abertura de qualquer gaveteiro gera unicamente o conteúdo daquele módulo caso não existam dados no D1. Reabrir gaveteiros preparados consome 0 chamadas Groq.
2. **Persistência Total no D1:** Flashcards em `trilha_flashcards`, questões em `trilha_questoes`, e resumo em `trilhas` (colunas `video_resumo` e `video_resumo_markdown`). Dados continuam disponíveis após fechar, recarregar (F5), navegar ou abrir em nova sessão.
3. **Resiliência a Rate Limit (429):** Bloqueio de cascatas no loop de fallback e interface com estado de erro amigável e botão de retentativa controlada.

## REGRAS PERMANENTES DE DESENVOLVIMENTO — AIVUR

### 1. Regras gerais do site

- Preservar funcionalidades existentes que já foram validadas.
- Fazer somente as alterações necessárias para atender ao objetivo solicitado.
- Não realizar refatorações ou mudanças de arquitetura sem necessidade direta.
- Não alterar autenticação, banco de dados, APIs ou modelos de IA sem necessidade explícita.
- Evitar alterações visuais ou estruturais em massa.
- Evitar regressões em páginas e módulos que não fazem parte do escopo.
- Priorizar segurança, persistência, desempenho, estabilidade e experiência consistente.
- Antes de concluir uma alteração, validar build e os fluxos afetados.
- Executar `git diff --check` antes do commit.
- Não fazer commit ou push enquanto houver falha, comportamento não validado ou dúvida sobre regressão.
- Não introduzir código temporário de teste, mocks ou bypasses na implementação definitiva.
- Manter alterações pequenas, rastreáveis e relacionadas ao objetivo solicitado.

### 2. Regras permanentes — Trilhas

A Sala da Trilha possui quatro gaveteiros independentes:

- Vídeo
- Resumo
- Flashcards
- Questões

Regras:

- Cada gaveteiro possui ciclo de vida e geração independentes.
- Abrir um gaveteiro representa a intenção explícita do usuário de acessar/preparar aquele conteúdo.
- Abrir um gaveteiro deve gerar SOMENTE o conteúdo daquele gaveteiro quando ele ainda não estiver preparado.
- Nunca gerar Resumo + Flashcards + Questões como consequência da abertura de apenas um gaveteiro.
- Vídeo NÃO utiliza IA para geração.
- Se o conteúdo já existir no D1, reutilizar o conteúdo existente e NÃO chamar Groq novamente.
- Todo conteúdo gerado deve ser persistido para consultas posteriores.
- Fechar e reabrir um gaveteiro não deve gerar novamente conteúdo já persistido.
- F5/reload não deve apagar conteúdo nem posição de estudo.
- A posição atual de Flashcards e Questões deve ser preservada.
- `Gerar mais` deve SEMPRE acrescentar novos itens, nunca substituir os itens existentes.
- Novos itens devem evitar duplicações semânticas com os itens já existentes.
- Cliques rápidos, duplo clique ou múltiplas interações simultâneas não podem disparar gerações concorrentes.
- A geração deve possuir proteção/mutex contra requisições duplicadas.
- Os estados de preparação, preparado e erro devem ser independentes entre os gaveteiros.
- HTTP 429 / rate limit deve interromper imediatamente a cascata de fallback.
- Não executar fallback agressivo quando o problema for rate limit/TPM.
- Erros de um gaveteiro não devem provocar geração ou alteração dos demais.
- Não criar uma etapa/botão global de "Gerar estudo" se a abertura do próprio gaveteiro já representa a intenção explícita do usuário.
- Não remover essas garantias em futuras refatorações apenas para simplificar o código.

### 3. Regra de preservação

Antes de qualquer alteração futura em Trilhas:

1. Ler estas regras.
2. Identificar quais comportamentos existentes são afetados.
3. Preservar os comportamentos já validados.
4. Alterar somente o que estiver dentro do escopo solicitado.
5. Validar novamente os fluxos afetados antes de concluir.

> PRINCÍPIO: uma melhoria nova não pode destruir uma garantia anteriormente validada.

## 17. Correção de Alinhamento do CTA e Diagnóstico de Geração de Trilhas (Outubro 2026)

### 1. Correção Visual dos Cards em `/trilhas` (UserTrilhasGrid.tsx)
- **Causa do Desalinhamento:**
  - O commit `9ef3395` introduziu `pt-4` diretamente no `<Link>` juntamente com `py-2.5`, gerando assimetria vertical interna (`padding-top: 16px` vs `padding-bottom: 10px`), projetando o texto "Iniciar trilha" 6px para baixo.
  - A classe `mt-auto` no `<Link>` sem margem mínima colapsava para `0px` de margem superior quando o conteúdo preenchia o card, colando o botão diretamente às etapas concluídas.
  - As 4 etapas em `flex flex-wrap gap-1.5` quebravam em 3 badges na linha 1 e 1 badge isolada na linha 2, comprimindo o espaço e gerando desequilíbrio visual.
  - A badge de disciplina usava `text-[var(--color-primary)]` (`#C41230`) sobre fundo navy, resultando em contraste deficitário no tema escuro.
- **Ajustes Implementados:**
  - Isolado o CTA em container `<div className="mt-auto pt-5 w-full">` com garantia de 20px de respiro sobre as etapas concluídas e absorção vertical de altura nos cards da grade.
  - Removido `pt-4` do botão; aplicado padding simétrico `px-4 py-3` (alinhamento vertical e horizontal exatos, 0px de offset do centro).
  - Etapas concluídas organizadas em grid simétrico 2x2 (`grid grid-cols-2 gap-1.5`) com respiro aprimorado nas badges (`px-2.5 py-1`).
  - Indicadores ajustados para `mt-2.5 gap-x-4` e badge de disciplina estilizada com `bg-[var(--color-surface-offset)] border border-[var(--color-border)] text-[var(--color-text-muted)]` para contraste e legibilidade premium em dark e light mode.

### 2. Resolução da Falha ao Gerar Trilha (/api/ai/gerar-trilha & CriarTrilhaView.tsx)
- **Causas Raízes Confirmadas:**
  1. *Autenticação/Sessão (HTTP 401):* Quando a sessão expirava ou caía enquanto o usuário preenchia o formulário, a requisição falhava silenciosamente sem orientar o login nem salvar o conteúdo digitado.
  2. *Groq TPM Rate Limit (HTTP 429):* O limite de texto estava em 50.000 caracteres (~13.500 tokens), o prompt inicial usava `max_tokens: 8000`, e o loop de fallbacks disparava requisições em cascata imediata para 3 modelos em milissegundos sem circuit breaker. 12.000 caracteres também era insuficiente porque resultava em ~3.711 tokens de prompt que, somados a consumos prévios (`Used = 4886`), estouravam 8.000 TPM.
  3. *Fixer Prompt Token Limit (HTTP 422):* O Fixer Prompt usava `max_tokens: 1000`. O payload completo de uma trilha possui entre 1.200 e 1.600 tokens. A resposta era cortada com `finish_reason: "length"`, gerando `SyntaxError` de JSON truncado e falha no Zod com HTTP 422.
- **Implementações Concluídas:**
  - `CriarTrilhaView.tsx`: Interceptação de `401`, preservação automática do rascunho (`title` e `text`) no `sessionStorage`, restauração transparente no carregamento inicial, alerta com CTA "Fazer Login" e redirecionamento controlado para `/login?redirect=/trilhas/novo`.
  - `route.ts`:
    - Texto calibrado para teto seguro de 8.000 caracteres (~2.150 tokens de texto + ~470 de template = ~2.620 tokens totais), garantindo margem mesmo com uso prévio alto na janela de 1 minuto.
    - `max_tokens` da chamada principal ajustado de 8000 para 2200.
    - Circuit breaker na detecção de 429: aborta cascata imediata para não esgotar cotas organizacionais da Groq.
    - Sanitização defensiva de `corretaIdx` (suporte a strings "0", "A", etc.) antes do Zod para evitar invocações desnecessárias do Fixer.
    - `max_tokens` do Fixer Prompt elevado de 1000 para 2200 (mínimo seguro para o payload completo sem truncamento).
- **Status:** Validado via matriz de testes automatizada (11/11 cenários aprovados) e testes de navegador via Puppeteer. Zero regressões.

## 18. REGRESSION GATE — PROTEÇÃO EVOLUTIVA

> **LEIA ISTO ANTES DE ALTERAR QUALQUER COISA EM TRILHAS (e em qualquer domínio que ganhe casos).**
> O AIVUR pode evoluir livremente. Nenhuma alteração pode quebrar silenciosamente um comportamento já validado.

- **O que é:** suíte em `tests/regression/` (sem dependências novas: Node + Puppeteer já existentes). Documentação completa: `tests/regression/README.md`. Registro de mudanças da baseline: `tests/regression/CHANGELOG.md`.
- **Como executar:** `npm run regression` (completa: API + navegador; resultado oficial). `npm run regression:fast` roda só a API e termina `INCOMPLETE` — **nunca equivale a PASS**. Saída final: `REGRESSION GATE: PASS — X/X` ou `FAIL — X/Y`.
- **O que os testes representam:** comportamentos e contratos **já validados e aprovados** (baseline `tests/regression/baseline.json`, IDs `REG-<DOMINIO>-<NNN>`). Hoje: `REG-TRILHAS-001…015` (geração, contrato, Zod, 401 + rascunho, 429 sem cascata, fallback 5xx, JSON truncado, Fixer sem loop, 422, retries finitos, salvar trilha, CTA Iniciar/Continuar, orçamento de tokens).
- **Obrigação:** toda alteração futura deve passar por `npm run regression` antes de commit. `tsc`/build passando **não** substitui a Gate.
- **Novas funcionalidades aprovadas devem ganhar caso novo** (próximo ID livre) em `tests/regression/<dominio>/*.case.mjs` **e** registro em `baseline.json` + `CHANGELOG.md`. Passo a passo no README.
- **Proibido esconder falhas:** não remover teste, não enfraquecer verificações, não trocar teste real por mock para passar, não alterar expectativa sem explicar. A Gate **falha** se um caso da baseline sumir/for renomeado ou se um caso existir sem registro na baseline.
- **A implementação pode mudar livremente** (modelo de IA, prompts, arquivos, bibliotecas, nº de chamadas fora dos tetos funcionais) **desde que o comportamento esperado continue válido.** Os testes protegem contratos, não código.
- **Mudança INTENCIONAL de comportamento:** (1) não apagar nem enfraquecer o teste; (2) identificar o comportamento que mudou; (3) explicar o motivo; (4) validar o novo comportamento; (5) obter aprovação explícita do responsável; (6) só então atualizar a baseline; (7) registrar no `CHANGELOG.md`.
- **Camadas:** API = rota `route.ts` **real** + Zod **real**, com rede (Groq/RAG) e fronteiras do framework simuladas só em `tests/regression/_support/`. Navegador = UI real com respostas interceptadas. **Nenhuma chamada real à Groq/D1.** Nada de mock foi introduzido em código de produção.
- **Lacunas conhecidas (não automatizadas de propósito; ver README):** (a) `/login` e `/auth/callback` ignoram `?redirect=` — não há retorno automático pós-login a `/trilhas/novo`; (b) persistência real no D1 de `POST /api/trilhas` é verificação manual; (c) truncamento real do provedor só é confirmável com teste real controlado; (d) JSON truncado na 1ª resposta retorna 400 controlado (não aciona o Fixer).
- **CI:** o projeto não tem GitHub Actions. Sugestão futura: job `npm ci && npm run regression` (Node 24). Não implementado.

## 19. Meu Material — Fase 2: Passo 2.1 e Passo 2.2 (Síntese de IA e Rate Limiting)

### Decisões Arquiteturais
1. **Contratos Zod do Meu Material (`src/lib/validations/material-ai.ts`):**
   - Resumo (tema central 5-250 chars, pontos-chave 2-6 itens de 10-200 chars, markdown estruturado).
   - Flashcards (2-8 itens, frente/verso 5-300 chars, IDs gerados no servidor).
   - Questões (2-6 itens, exatamente 4 alternativas distintas sem repetições, corretaIdx 0-3, justificativa e trecho de referência).
   - Hidratação autoritativa: IDs gerados no servidor; campo `cobertura` fixado estritamente como `"recorte"` na ausência de comprovação de integralidade calculada pelo servidor (`comprovacaoIntegralidadeServidor: false`), rejeitando declarações não confiáveis do cliente.
2. **Rota Edge de Síntese (`src/app/api/ai/material/gerar/route.ts`):**
   - Exporta exclusivamente `runtime = "edge"` e `POST`.
   - Autenticação prévia de sessão via cookie HttpOnly `aivur_session` antes de acessar credenciais ou invocar provedor.
   - Cascata ordenada de modelos Groq (`gpt-oss-120b` -> `gpt-oss-20b` -> `qwen3.8-27b`) com interrupção imediata (sem cascata destrutiva) em HTTP 429.
   - Fixer prompt limitado a 1 rodada de correção estrutural se a resposta inicial violar o contrato Zod.
   - Preservação de status HTTP 429 se ocorrido durante o Fixer (não mascara como 422).
   - Sanitização de erros da Groq: detalhes internos do provedor não vazam para o cliente.
3. **Rate Limiting Defensivo (`src/lib/material-rate-limit.ts`):**
   - Identidade confiável: preserva `cf-connecting-ip`. Se ausente ou vazio, descarta `x-forwarded-for` e cookies arbitrários, adotando cota compartilhada no isolate (`fallback:unknown`).
   - Política conservadora de saturação: evicção determinística apenas de chaves comprovadamente expiradas (`now > resetTime`). Se o mapa atingir `maxEntries` (500) com todas as cotas ativas, novas chaves são recusadas (HTTP 429), eliminando a vulnerabilidade de quota reset por flood FIFO/LRU.
4. **Validação:**
   - 29/29 cenários cobertos no Regression Gate (`REG-MAT-001..014`, `REG-TRILHAS-001..015`).

## 20. Meu Material — Fase 2: Passo 2.3 (Integração do Estúdio de Estudo Ativo no Frontend)

### Decisões Arquiteturais
1. **Integração Real via Contratos Zod (`src/app/material/page.tsx`):**
   - Conexão do botão explícito "Sintetizar com IA" à rota `POST /api/ai/material/gerar`.
   - O payload enviado pelo cliente segue estritamente o `MaterialGenerateRequestSchema` (`titulo`, `conteudo`, `disciplina: "Geral"`, `metadados`).
   - A resposta do servidor é validada via `MaterialGeneratedContentSchema.safeParse`. Se a resposta for inválida ou divergente, um erro controlado é apresentado sem recorrer a protótipos ou fallbacks silenciosos.
2. **Remoção Completa de Mocks Estáticos (`FlashcardsTool.tsx` e `QuizTool.tsx`):**
   - Ambos os componentes foram refatorados para aceitar exclusivamente props tipadas (`MaterialFlashcard[]` e `MaterialQuestion[]`).
   - Todos os dados estáticos simulados foram removidos do código de produção.
   - Conformidade estrita com a Regra de Titânio (`size={N}`, `shrink-0 flex-none`, sem classes `w-N h-N` conflitantes).
3. **Preservação de Estado e Tratamento Defensivo de Erros:**
   - Importar ou visualizar PDF/texto NÃO dispara chamadas à IA (preservação estrita do `REG-MAT-006`).
   - Em falhas de rede ou status HTTP 401, 422, 429 e 503, o material validado (`verifiedMaterial`) e o texto digitado são 100% preservados na tela, permitindo nova tentativa manual sem perda de dados.
   - Nenhuma retentativa automática é executada, evitando consumo não intencional de cotas.
   - Mutex síncrono via `isGeneratingRef` e estado `isGenerating` previnem requisições concorrentes ou duplo clique.
   - "Importar Outro Material" executa o reset explícito de todo o estado (`verifiedMaterial`, `generatedContent`, `aiError`, abas).
4. **Proteção Evolutiva (Regression Gate):**
   - Total de 30 cenários aprovados.
   - `REG-MAT-015`: Teste de navegador (Puppeteer) cobrindo fluxo real ponta-a-ponta com interceptação de rede: validação sem IA, erro 429 com preservação do material, síntese com renderização do estúdio (Resumo, Flashcards com virada 3D e avaliação, Questões com feedback pedagógico e citação de fonte) e reinício explícito via "Importar Outro Material".

### Ressalva de Segurança Resolvida (Autenticação Criptográfica de Sessão)
- A validação de sessão na rota Edge `/api/ai/material/gerar` agora verifica estritamente a assinatura criptográfica HMAC-SHA256, expiração temporal e integridade do payload do cookie `aivur_session`.
- Cookies forjados, não assinados, adulterados ou expirados são sumariamente rejeitados com HTTP 401 antes de qualquer invocação de IA.

## 21. Autenticação Segura Global de Sessão (Fase 2 — Migração Completa)

### Decisões Arquiteturais e Cobertura
1. **Helper Centralizado Único (`src/lib/session.ts`):**
   - Utiliza Web Crypto nativa (`crypto.subtle`) compatível com Edge Runtime e Node.js sem dependências externas.
   - Formato do token: `${base64url(payload)}.${base64url(hmacSignature)}`.
   - Payload: `{ sub: userId, iat: number, exp: number }`. Expiração padrão de 30 dias.
   - Resolução de segredos de forma segura: `AUTH_SECRET` ou `ADMIN_SECRET` lidos prioritariamente via `getRequestContext().env` no Edge e `process.env` no ambiente de desenvolvimento/testes.
   - Fallback para desenvolvimento local estritamente condicionado a `process.env.NODE_ENV !== "production"`.

2. **Rotas Protegidas e Migradas Integralmente:**
   - `POST /api/ai/gerar-trilha`: valida assinatura via `verifySessionCookie`; extrai `userId = session.userId`; rejeita forjamento/expiração com 401 antes da Groq.
   - `POST /api/ai/material/gerar`: valida assinatura via `verifySessionCookie`; bloqueia consumo de IA se cookie for inválido, adulterado ou expirado.
   - `GET, POST /api/trilhas`: valida assinatura; `userId = session.userId` utilizado como parâmetro vinculado em consultas D1 (isolamento por usuário).
   - `GET, PUT, DELETE /api/trilhas/[id]`: valida assinatura; consultas D1 vinculam estritamente `session.userId` impedindo acesso cruzado (anti-IDOR).
   - `POST /api/trilhas/[id]/gerar-mais`: valida assinatura; verifica propriedade no D1 antes de consumir a Groq.
   - `POST /api/sync/pull`: valida assinatura; encaminha `session.userId` autenticado ao Worker.
   - `POST /api/sync/push`: valida assinatura; grava `user_progress` com `session.userId` autenticado.
   - `Page /trilhas/novo` (SSR): Server Component valida o cookie `aivur_session` assinado via `verifySessionCookie` antes de renderizar; redireciona para `/login` se ausente ou inválido.

3. **Emissão de Sessão:**
   - `src/app/api/auth/verify/route.ts`: assina criptograficamente o `userId` retornado pelo Magic Link antes de gravar o cookie HttpOnly `aivur_session`.
   - `src/app/api/auth/dev-bypass/route.ts`: assina a sessão com `signSession("cesa.muniz@gmail.com")` mantendo bloqueio restrito a `development` (HTTP 403 em produção).

4. **Proteção Evolutiva (Regression Gate):**
   - `REG-MAT-009`: expandido para cobrir cookies ausentes, adulterados, expirados e forjados no Meu Material.
   - `REG-TRILHAS-004`: expandido para cobrir ciclo completo de segurança: forjamento de cookie, adulteração de assinatura, expiração temporal, persistência D1 isolada por `session.userId`, rotas de sincronização (Push/Pull) e rejeição de acesso cruzado (anti-IDOR).
   - `tests/regression/run.mjs` e `tests/regression/_support/browser.mjs`: sincronizam chaves de ambiente com `next dev` e emitem sessões assinadas legítimas para o Puppeteer.
   - **Placar oficial:** 30/30 PASS mantido (`npm run regression`).

5. **Validação em Produção (Concluída):**
   - O segredo `AUTH_SECRET` foi registrado com sucesso no projeto Cloudflare Pages de produção (`aivur-app`) via `npx wrangler pages secret put AUTH_SECRET --project-name aivur-app`.
   - O ambiente de produção passa a resolver `AUTH_SECRET` prioritariamente via `getRequestContext().env.AUTH_SECRET` no Edge Runtime, eliminando pendências de configuração para release.

## 22. AIVU — Chat Real com Inteligência Artificial (v1)

### Status: CONCLUÍDO E VALIDADO (37/37 TESTES PASS NO REGRESSION GATE).

### 1. Escopo e Decisões Técnicas
- **Identidade e Nomenclatura:** Mascote oficial AIVU no AIVUR. Preservados todos os nomes de arquivos legados (`AivoWidget.tsx`, `useAivoStore.ts`) e o componente de demonstração não utilizado (`src/components/Aivur/Aivur.tsx`), sem renomeações arriscadas.
- **Contratos e Validações Zod (`src/lib/validations/aivu-chat.ts`):**
  - Entrada (`AivuChatRequestSchema`): `message` obrigatória, 1 a 1.000 caracteres, tratada com `.trim()`; `history` opcional, teto defensivo de até 8 mensagens (`role: "user" | "assistant"`, `content: 1 a 1000 chars`).
  - Saída (`AivuChatResponseSchema`): `{ reply: string, state: "speaking" }`.
- **Rota Edge de Chat (`src/app/api/ai/aivu/chat/route.ts`):**
  - Autenticação estrita no servidor: extrai `userId` exclusivamente do cookie assinado `aivur_session` via `verifySessionCookie`. Rejeita cookies ausentes, forjados, adulterados ou expirados com HTTP 401 antes de processar IA.
  - Rate Limiting defensivo: `InMemoryRateLimiter` instanciado com cota de 15 mensagens / 15 minutos por usuário (`user:${userId}`).
  - Provedor Groq com Failover: utiliza `callGroqWithFallback` e `getGroqKeysFromEnv`, iterando de forma transparente sobre as chaves disponíveis e modelo ativo `openai/gpt-oss-120b`.
  - Protocolo de Sanitização: respostas tratadas via `extractCleanMarkdown` (remove tags `<think>` e resíduos). Respostas com content nulo, vazio ou inválido retornam status 502 controlado sem expor detalhes internos.
  - Resposta Estruturada: completion JSON com status HTTP controlados (400 validação, 401 não autenticado, 429 limite de taxa, 502 erro do provedor de IA, 503 sem credenciais).
- **Frontend e UX do Widget (`src/components/Aivo/AivoWidget.tsx` e `src/store/useAivoStore.ts`):**
  - Mutex síncrono (`isSendingRef` + `isSending`) bloqueia envios simultâneos, duplo clique e disparo repetido via teclado (Enter).
  - Gestão de temporizador de recuperação (`recoveryTimerRef`): cancela qualquer timer pendente ao iniciar nova mensagem e no unmount do componente, impedindo que timeouts antigos sobrescrevam o estado `thinking` ou `speaking` de requisições recentes.
  - Preservação visual e de animação: integração do mascote mantendo os estados `idle` -> `thinking` durante o fetch -> `speaking` na recepção da resposta -> retorno automático para `idle` após 3,5 segundos.
  - Resiliência após falhas: em erros de rede ou HTTP (401, 429, 502), o mascote exibe o estado `error` e recupera automaticamente para `idle` em 3 segundos, mantendo o input editável e desbloqueado para nova tentativa.
  - Mensagens amigáveis para falha de sessão (orientando login) e cota atingida.
- **Proteção Evolutiva (Regression Gate):**
  - Criados 7 casos automatizados em `tests/regression/aivu/chat.case.mjs`:
    - `REG-AIVU-001`: Validação Zod de entrada (rejeição de mensagem vazia, em branco ou JSON malformado).
    - `REG-AIVU-002`: Validação Zod de limites (rejeição de mensagem > 1000 chars ou histórico > 8 itens).
    - `REG-AIVU-003`: Rejeição com 401 de cookies ausentes, forjados, adulterados ou expirados sem consumir IA.
    - `REG-AIVU-004`: Rate limit por usuário (15 req/15 min) bloqueando rajadas com 429.
    - `REG-AIVU-005`: Conversa válida com sessão assinada, resposta markdown limpa e estado 'speaking' (1 chamada Groq com modelo `openai/gpt-oss-120b`).
    - `REG-AIVU-006`: Resiliência contra erros da Groq (429 controlado, 502 para erro 5xx e para content nulo/vazio/inválido sem vazamento de segredos).
    - `REG-AIVU-007`: Teste de navegador (Puppeteer) comprovando que sob falha HTTP 502 da IA, o widget renderiza o erro e reabilita o mascote e o input para `idle` sem travar em `thinking` ou `speaking`.
  - Placar oficial: **37/37 PASS**.
- **Limitações Conhecidas desta Versão (v1):**
  - Rate limit em memória atua no isolate V8 (proteção por instância no Edge, não distribuído).
  - Histórico mantido no cliente para a conversa imediata (sem persistência no D1, sem embeddings RAG e sem voz nesta fase).
  - Modelo alinhado ao padrão de produção da plataforma (`openai/gpt-oss-120b`), substituindo o identificador obsoleto `llama3-70b-8192`.

## 23. Jornada de Edital — Verticalização e Estruturação de Estudos (Etapa 1)

### Status: IMPLEMENTADO LOCALMENTE E VALIDADO (45/45 TESTES PASS NO REGRESSION GATE).

### 1. Escopo e Decisões Técnicas
- **Schema e Persistência Aditiva D1 (`migrations/0006_jornadas_edital.sql`):**
  - Tabelas aditivas `jornadas` e `jornada_topicos` sem tocar no schema de `trilhas`, `trilha_flashcards`, `trilha_questoes` ou `user_progress`.
  - Índices estáveis (`idx_jornadas_user`, `idx_jornadas_hash`, `idx_jornada_topicos_jornada`, `idx_jornada_topicos_trilha`).
  - Integridade referencial com `ON DELETE CASCADE` de tópicos ao deletar a jornada.
- **Contratos e Validações Zod (`src/lib/validations/jornada.ts`):**
  - `TopicoDraftSchema`: título (3-200 chars), ordem (>= 1).
  - `DisciplinaDraftSchema`: nome (2-120 chars), ordem (>= 1), tópicos (1-50 itens).
  - `JornadaEmentaSchema`: 1 a 30 disciplinas, ordem linear, metadados opcionais.
  - `GerarJornadaRequestSchema`: texto da ementa (50 a 15.000 chars), hashes SHA-256 (`doc_original_hash`, `ementa_hash`).
  - `CriarJornadaRequestSchema`: payload validado de persistência da jornada revisada pelo usuário.
- **Extração com Inteligência Artificial (`/api/ai/gerar-jornada`):**
  - Validação estrita de sessão via `verifySessionCookie`. Rejeição com 401 controlado.
  - Rate Limiting defensivo: 10 requisições / 10 minutos por usuário.
  - Token Conservation: extrai exclusivamente matérias e tópicos essenciais sob demanda, sem gerar questões, flashcards ou resumos durante a importação.
  - Resiliência e Auto-Correção: 1 tentativa controlada via Fixer Prompt em caso de JSON malformado ou fora do contrato Zod.
  - Rejeição de saída truncada: converte respostas truncadas em erro recuperável (422), sem alucinação de dados faltantes.
- **APIs de Persistência e Anti-IDOR (`/api/jornadas`, `/api/jornadas/[id]`):**
  - `POST /api/jornadas`: criação atômica no D1 (jornada + tópicos em lote). Idempotência estrita: se o usuário submeter a mesma ementa (`ementa_hash`), a rota localiza a jornada existente e retorna `{ jornada, reused: true, is_existing: true }` sem duplicação de linhas.
  - `GET /api/jornadas`: lista as jornadas do usuário com cálculo de progresso geral e contagem de tópicos.
  - `GET /api/jornadas/[id]`: busca verticalizada da jornada agrupada por disciplinas com tópicos ordenados, vinculando estritamente `user_id = session.userId`.
  - `DELETE /api/jornadas/[id]`: exclusão segura com proteção anti-IDOR.
- **Convergência Determinística ao Iniciar Tópico (`/api/jornadas/[id]/topicos/[topicoId]/iniciar`):**
  - Atribuição determinística do ID da trilha: `trilha_${topicoId.slice(0, 30)}`.
  - Inserção atômica em batch no D1: cria o stub em `trilhas` se não existir e vincula `trilha_id` em `jornada_topicos`.
  - Cliques simultâneos, retentativas ou concorrência convergem com segurança para a mesma trilha, sem criar registros órfãos.
- **Conclusão Explícita e Próximo Passo Linear (`/api/jornadas/[id]/topicos/[topicoId]/concluir`):**
  - Tópico só é concluído mediante evento explícito persistido (`POST /concluir`), alterando status para `concluido` e registrando timestamp `concluido_em`.
  - Retorna o progresso atualizado e calcula linearmente o próximo tópico recomendado para estudo contínuo.
- **Frontend e Experiência do Usuário:**
  - `EmentaReviewModal.tsx`: modal de conferência humana permitindo adicionar, remover, editar nomes de disciplinas e tópicos antes de salvar.
  - `CriarJornadaView.tsx`: importação fluida via texto ou PDF com extração no cliente, pré-validação e geração assistida.
  - `JornadaView.tsx`: visão verticalizada do edital com barra de progresso, card de "Próximo Tópico Recomendado", accordions colapsáveis por disciplina e ações de "Estudar Tópico" e "Marcar como Concluído".
  - `UserJornadasSection.tsx`: listagem de editais ativos na página principal de `/trilhas`.
- **Proteção Evolutiva (Regression Gate):**
  - 8 novos casos automatizados em `tests/regression/jornadas/api.case.mjs`:
    - `REG-JORNADA-001`: Validação Zod dos contratos da Jornada de Edital.
    - `REG-JORNADA-002`: Autenticação e integridade de sessão em todas as rotas (401 controlado).
    - `REG-JORNADA-003`: Extração de ementa com limites de entrada e orçamento de tokens.
    - `REG-JORNADA-004`: Resiliência contra JSON malformado e rejeição de respostas truncadas.
    - `REG-JORNADA-005`: Criação persistida no D1 e idempotência por `ementa_hash`.
    - `REG-JORNADA-006`: Isolamento estrito anti-IDOR.
    - `REG-JORNADA-007`: Concorrência e convergência determinística ao iniciar tópico sem órfãos.
    - `REG-JORNADA-008`: Conclusão explícita de tópico e cálculo do próximo passo.
  - **Placar oficial:** 45/45 PASS (`npm run regression`).
