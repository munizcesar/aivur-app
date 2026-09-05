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
- Zustand para estado assíncrono e sessão de estudo.
- Rota isolada do Cockpit: `/sala-de-aula`.
- Orquestrador principal: `src/components/Cockpit/StudyCockpit.tsx`.
- Estado global: `src/store/useStudyStore.ts`.
- Dados locais de trilha: `src/mocks/studyPathMock.ts`.
- Skeleton de questões: `src/components/UI/QuestionSkeleton.tsx`.
- A rota do Cockpit não depende de API ou backend para sua validação visual atual.

## 3. Estado Validado

- Cockpit renderiza Header, Sidebar responsiva e abas de Resumo, Flashcards e Questões.
- Sidebar é fixa no desktop e off-canvas no mobile.
- Questões possuem seleção, resposta, bloqueio pós-envio e feedback dinâmico.
- Gabarito comentado aparece após a resposta com `role="status"` e `aria-live`.
- Loading assíncrono mock usa `isLoading` no Zustand e latência simulada de 1,5s.
- Skeletons preservam Grid, badge `40x40px`, altura de `72px` e scroll interno.
- Alternativas inativas mantêm fundo branco, texto Slate e opacidade reduzida.
- TypeScript isolado do Cockpit deve ser validado com `tsconfig.cockpit.json`.

## 4. Backlog Vivo

1. Modularização do Cockpit: extrair Sidebar, Tabs, QuestionList e QuestionCard.
