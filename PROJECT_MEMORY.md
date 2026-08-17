# PROJECT_MEMORY.md — Memória Persistente do Projeto AIVUR/StudyMaster

> **INSTRUÇÃO OBRIGATÓRIA PARA QUALQUER IA TRABALHANDO NESTE REPOSITÓRIO:**
> 1. Leia este arquivo INTEIRO antes de executar qualquer tarefa.
> 2. Ao final de qualquer mudança relevante (feature concluída, bug corrigido, decisão de arquitetura tomada), ATUALIZE este arquivo antes de encerrar a resposta.
> 3. Nunca reescreva o histórico — adicione novas entradas nas seções corretas, mantendo o que já existe.
> 4. Se encontrar uma tarefa "aberta" listada em "Pendências", trate como prioridade conhecida, não como descoberta nova.

---

## 1. Visão Geral do Projeto

Site de preparação para concursos (AIVUR), migrando de um HTML puro de 11.000+ linhas para uma arquitetura Next.js nova, construída do zero em pasta separada. O produto atende tanto alunos de concurso público quanto alunos de vestibular/ENEM/estudo livre.

## 2. Arquitetura Atual (dois sistemas coexistindo)

- **Novo (Next.js)** — pasta do projeto novo. Onde vive a feature "Trilha/Mentor": checklist de curso, teoria, questões, flashcards, revisão de erros, progressão. Local-first via IndexedDB.
- **Legado (Cloudflare Worker)** — repositório `studymaster-agent` (GitHub: munizcesar/studymaster-agent), deploy em `studymaster-agent.pages.dev`. Contém:
  - `worker.js` — worker principal `studymaster-worker`, com `wrangler.toml` configurado com bindings reais: D1 (`DB_EDITAIS`), Queues (ingestão de PDF), KV (`RAG_CACHE`), e **dois índices Vectorize populados**: `studymaster-provas` (340 vetores, vazio de conteúdo real) e `studymaster-knowledge` (4.732 vetores, leis secas reais — 8.112/90, LGPD, CPC, CPP, CLT — domínio público, seguro para uso).
  - `mentor-class-backend/` — worker simples e separado, só com rotas `/api/parse-edital` e `/api/gerar-sessao`, geração zero-shot via Groq, sem uso de D1/R2/Vectorize.
  - Documentação extensa sobre um pipeline de RAG que foi **desenhado mas nunca conectado** ao fluxo real de produção (branch `feature/quality-protocols`, nunca integrada ao main). O `rag-handler.js` existe isolado.
  - `ARCHITECTURE_STATUS.md` (o doc mais confiável do repo) declara o projeto "congelado" após a Sprint 4. O R2 estava bloqueado (código 10042), mas a restrição de billing foi resolvida e a infra está liberada para uso.

## 3. Decisões de Arquitetura Já Tomadas (não reabrir sem motivo novo)

- **Multi-dispositivo (login + sync D1/R2)**: ✅ IMPLEMENTADO. Sincronização LWW (Last Write Wins) baseada em timestamp via API Worker (`/api/sync/push` e `pull`) e D1/R2. Autenticação via Magic Link (`/api/auth/magic-link`) usando cookie HttpOnly gerenciado pelo Next.js. Implementada lógica de debounce (5s) para push automático local-first. Salvaguarda de pull implementada (Push Compulsório + Backup local pre-sync) para evitar perda de dados offline durante recarregamentos.
- **Geração de conteúdo (Teoria/Questões/Flashcards)**: sempre on-demand, nunca no momento de criar o curso. Cache-first no IndexedDB antes de chamar a Groq.
- **Exclusão de curso**: usa Abordagem C (varredura cirúrgica via JSON do curso) + garbage collector de órfãos, sem precisar de Object Stores/índices nativos — implementado e testado.
- **Filtro de banca**: só aparece para cursos com `sourceType: "edital"`. Cursos `sourceType: "livre"` (vestibular, tema livre) nunca mostram esse filtro. Regras de formato específicas por banca (Cebraspe = Certo/Errado obrigatório, FGV = analítico, FCC = monotemático, Vunesp = objetivo/literal, Cesgranrio = direto, IADES = complexo) devem estar embutidas no prompt de geração, não só o nome da banca solto.
- **Bancas cobertas**: Cebraspe, FGV, FCC, Vunesp, Cesgranrio, IADES, IBFC, IDECAN, Consulplan, Quadrix (10 bancas) + opção "Padrão/Geral" como default. Detecção automática de banca a partir do edital colado é a meta (evitar obrigar escolha manual).
- **RAG**: decidido reaproveitar a infraestrutura já existente no worker legado (Vectorize `studymaster-knowledge`) em vez de construir do zero. RAG deve ser tratado como REFORÇO opcional (fallback para zero-shot se não houver match relevante), nunca dependência obrigatória — muitas matérias (Português, RLM, Informática) não têm cobertura no índice atual de leis.
- **Banco de questões reais (verbatim)**: evitado por risco de direitos autorais de bancas organizadoras. Caminho seguro: linkar PDFs oficiais de provas anteriores, ou usar poucas questões reais só como calibração interna de estilo (não exibidas ao aluno).

## 4. Status por Fase (Trilha/Mentor, projeto Next.js)

- **Fase 1** — Checklist com dados reais (curso gm-hortolandia-2026 como teste). ✅ Concluída.
- **Fase 2** — Geração de curso a partir de edital colado/PDF via IA, tela de revisão antes de salvar. ✅ Concluída e validada (Puppeteer, edital real de Limeira).
- **Fase 3** — Teoria (protocolo anti-alucinação por prompt), Flashcards, Questões com filtro de dificuldade/banca, cache IndexedDB. ✅ Concluída.
- **Redesign ChecklistItem** — 3 botões inline (YouTube/Questões/Flashcards), números dinâmicos com lazy loading via IntersectionObserver. ✅ Concluído.
- **Fase 4** — Controle de progressão + revisão de erros (questões erradas + flashcards "não sei"), por matéria. Métrica de % de acerto deduplicada (última tentativa por questão, não acumulada). ✅ Concluída.
- **Rodada de polimento** — corrigida race condition na geração Groq (cliques duplos), corrigidos órfãos no painel de revisão ao regerar questões, eliminado prop drilling do `courseId` via `CourseContext`. ✅ Concluída.
- **Fase 5a** — Gerenciamento de cursos: listagem (já existia), exclusão segura com GC de órfãos, edição de nome do curso. ✅ Concluída.
- **sourceType edital/livre** — implementado, filtro de banca condicional. ✅ Concluído.
- **Conexão RAG (studymaster-knowledge → Trilha)** — ✅ CONCLUÍDO. Rota POST `/api/rag-search` no `worker.js` (repo: `C:\Users\Cesar Victor\Desktop\studymaster-worker`, deploy em `.workers.dev`) consultando o índice `studymaster-knowledge`. O Next.js consome essa rota antes de gerar Teoria/Questões. Retornos adicionais (`matchCount` e `topScore`) foram implementados. Filtro de qualidade (`score >= 0.70`) implementado no backend para descartar vetores fracos e impedir que conteúdo irrelevante contamine a geração do LLM em matérias não-jurídicas.
- **Sincronização Multi-dispositivo (D1/R2)** — ✅ CONCLUÍDO. Implementação de rotas de Push/Pull + Magic Link via Worker. Cliente Next.js adaptado com `useSyncManager`, salvaguardas contra reescrita acidental e debouncing local para IndexedDB. Envio de e-mail via API REST oficial do Resend implementado.
## 5. Bugs Conhecidos (verificar se já corrigidos)

- ✅ **Aba ativa do TopicDetails reseta ao fechar/reabrir o tópico** (perda de estado — filtros de dificuldade/banca voltam ao padrão). *Corrigido — estado elevado para CourseContext, compartilhado por sessão.*
- ✅ **Skeleton loader ausente** nos botões de ação enquanto o IntersectionObserver carrega as contagens. *Corrigido — CSS shimmer implementado.*
- ✅ **Layout "pulando"** no ReviewPanel ao remover item (sem fade-out). *Corrigido — Framer Motion integrado com AnimatePresence.*
- ✅ **Botão "Gerar Flashcards com IA" não dá feedback visual** quando clicado sem a Teoria do tópico já ter sido gerada — *Corrigido (mensagem inline adicionada)*.

## 6. Pendências / Próximos Passos Conhecidos

- Auditoria de cobertura do Vectorize por matéria do edital de teste (quais matérias não têm cobertura de leis, ex: Português/RLM/Informática) — fazer DEPOIS que o RAG estiver conectado e testado, não misturar com a integração atual.
- Avaliar expandir a base de conhecimento (Vectorize) para matérias não jurídicas, com cuidado de direitos autorais por fonte.
- Decidir sobre Fase 5b (edição de estrutura do curso — add/remover tópicos), que exige decisão sobre o que fazer com conteúdo/progresso órfão gerado.

## 7. Armadilhas Já Identificadas (não repetir)

- O relatório de uma IA sobre "o que está implementado" pode estar desatualizado ou incompleto — sempre que a suspeita for de funcionalidade não conectada (RAG, protocolos), pedir auditoria de leitura antes de assumir que não existe.
- Múltiplos sistemas (Next.js novo + worker legado) podem ter infraestrutura provisionada na Cloudflare (visível no dashboard) que não aparece numa busca de código simples — checar o dashboard da conta é uma fonte de verdade complementar ao código.
- Ao pedir correções, sempre restringir explicitamente que a IA NÃO deve alterar código de partes já validadas/testadas, só a área da tarefa pedida.

---
*Última atualização: 16/08/2026. Auditoria de RAG realizada; implementado filtro de score mínimo (0.70) direto na API do worker para evitar alucinações em disciplinas com baixa cobertura vetorial.*
