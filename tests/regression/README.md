# Regression Gate — AIVUR

> **O AIVUR pode evoluir livremente. Nenhuma alteração pode quebrar silenciosamente um comportamento já validado.**

A Gate protege **comportamentos e contratos** já aprovados — não a implementação. Modelo de IA, prompts,
organização de arquivos, bibliotecas e número exato de chamadas (quando não é requisito) **podem mudar**
sem tocar nos testes, desde que o comportamento observável continue válido.

## Executar

```bash
npm run regression        # Gate COMPLETA (API + navegador). Resultado oficial.
npm run regression:fast   # Só API, sem navegador. Termina como INCOMPLETE (exit 2), nunca como PASS.
node tests/regression/run.mjs --only REG-TRILHAS-004   # um caso
node tests/regression/run.mjs --list                   # baseline
```

Saída:

```
REG-TRILHAS-001 ✓  ...
REG-TRILHAS-007 ✗  ...
REGRESSION GATE: PASS — 15/15      (exit 0)
REGRESSION GATE: FAIL — 14/15      (exit 1)
REGRESSION GATE: INCOMPLETE — ...  (exit 2, casos pulados; NÃO é PASS)
```

Requisitos: nenhum além do que o projeto já tem (Node 22.18+/24, `puppeteer`). **Sem dependências novas.**
Casos de navegador reutilizam o servidor em `AIVUR_BASE_URL` (padrão `http://localhost:3000`) ou sobem
um `next dev` temporário.

## Como funciona (camadas)

| Camada | O que roda de verdade | O que é simulado |
|---|---|---|
| **API** (`needs: "api"`) | O `route.ts` **real**, validação Zod **real** | Apenas a rede (`fetch` → Groq/RAG) e as fronteiras do framework (`next/headers`, `next/server`, `@cloudflare/next-on-pages`) em `_support/stubs/` |
| **Navegador** (`needs: "browser"`) | UI **real** (`next dev` + Chrome headless) | Respostas de `/api/ai/gerar-trilha`, `/api/trilhas` interceptadas no navegador |

- **Nenhuma chamada real à Groq ou ao banco** acontece. Qualquer URL inesperada na camada de API **derruba o teste**.
- Mocks vivem **somente** em `tests/regression/_support/`; nada foi introduzido no código de produção.

## Baseline (casos protegidos)

Lista autoritativa: [`baseline.json`](./baseline.json) (append-only). A Gate **falha** se:
- um caso existe no código mas não está na baseline; ou
- um caso está na baseline mas sumiu/foi renomeado (**proteção contra "apagar o teste para passar"**).

| ID | Comportamento protegido | Camada |
|---|---|---|
| REG-TRILHAS-001 | Geração normal com sessão válida conclui (1 chamada à IA) | API |
| REG-TRILHAS-002 | Resposta respeita o contrato estrutural | API |
| REG-TRILHAS-003 | Zod aceita o válido e rejeita o inválido | API |
| REG-TRILHAS-004 | Sessão ausente/inválida → 401 controlado, sem consumir IA | API |
| REG-TRILHAS-005 | 401 orienta o login e preserva título/conteúdo | Navegador |
| REG-TRILHAS-006 | CTA leva a `/login?redirect=/trilhas/novo`, sem loop; retorno restaura o rascunho | Navegador |
| REG-TRILHAS-007 | 429 não gera cascata; erro 429 controlado | API |
| REG-TRILHAS-008 | 5xx ainda permite recuperação por fallback | API |
| REG-TRILHAS-009 | JSON truncado nunca vira sucesso; JSON fora do contrato aciona o Fixer | API |
| REG-TRILHAS-010 | Fixer termina (sem loop) | API |
| REG-TRILHAS-011 | Falha definitiva do Fixer → 422 controlado | API |
| REG-TRILHAS-012 | Tentativas permanecem finitas (teto `AI_CALL_CAP`) | API |
| REG-TRILHAS-013 | Após geração válida, salvar envia a trilha completa e abre a trilha | Navegador |
| REG-TRILHAS-014 | CTA Iniciar/Continuar aponta para `/trilhas/{id}` | Navegador |
| REG-TRILHAS-015 | Entrada extensa limitada; prompt + saída cabem no TPM; saída não trunca | API |

### Verificações MANUAIS e lacunas conhecidas (não automatizadas de propósito)

Documentadas em vez de simuladas com mocks enganosos (também impressas no fim da execução):

- **Login automático de retorno (lacuna real):** `/login` e `/auth/callback` **ignoram `?redirect=`**.
  Após o magic link o usuário cai em `/`, não em `/trilhas/novo`. O REG-006 protege apenas o destino do CTA e o
  retorno manual com rascunho restaurado. Se for implementado, **adicione um caso novo** (REG-TRILHAS-016+).
- **Persistência real no D1 (REG-013):** sem banco em teste; validar manualmente em ambiente com D1.
- **Truncamento real do provedor:** depende do modelo/Groq. O REG-015 protege o *orçamento* (`max_tokens`),
  mas só um teste real controlado confirma o comportamento do provedor.
- **JSON truncado na 1ª resposta** não aciona o Fixer (retorna erro 400 controlado). Comportamento atual protegido
  pelo REG-009; mudar isso é decisão de produto → processo de mudança intencional.

## Adicionar um novo caso (a Gate cresce sem reconstruir nada)

Quando uma funcionalidade for **criada e explicitamente validada**:

1. Escolha o próximo ID livre: `REG-<DOMINIO>-<NNN>` (ex.: `REG-TRILHAS-016`).
2. Adicione o objeto ao array `cases` do arquivo `tests/regression/<dominio>/*.case.mjs`
   (ou crie `tests/regression/<dominio>/<nome>.case.mjs`; qualquer `*.case.mjs` é descoberto sozinho):

   ```js
   {
     id: "REG-TRILHAS-016",
     title: "Comportamento observável em uma frase",
     needs: "api",            // "api" (rota real, rede simulada) ou "browser" (UI real)
     manual: ["parte não automatizável, se houver"],   // opcional
     async run(ctx) { /* assert.* — lance erro para falhar */ },
   }
   ```
3. Registre-o em [`baseline.json`](./baseline.json) (`id`, `domain`, `kind`, `title`, `validatedOn`).
4. Anote em [`CHANGELOG.md`](./CHANGELOG.md).
5. Rode `npm run regression`.

Novo domínio (ex.: `questoes`): crie `tests/regression/questoes/` e siga os mesmos passos.
Helpers: `_support/harness.mjs` (API) e `_support/browser.mjs` (navegador).

**Escreva o teste contra o comportamento**, nunca contra a implementação. ❌ "usa `openai/gpt-oss-120b`".
✅ "devolve uma trilha válida segundo o contrato".

## Mudança intencional de comportamento

Se uma mudança **proposital** fizer um caso falhar:

1. **NÃO apague** o teste.
2. **NÃO enfraqueça** o teste.
3. Identifique **qual comportamento mudou**.
4. **Explique a razão** da mudança.
5. **Valide** o novo comportamento.
6. Somente após **aprovação explícita do responsável**, atualize a baseline (expectativa do caso e/ou `baseline.json`).
7. **Registre** em [`CHANGELOG.md`](./CHANGELOG.md): ID, comportamento antigo → novo, motivo, quem aprovou, data.

## Regras obrigatórias contra "teste para passar"

- ❌ Não remover teste para fazer o código passar.
- ❌ Não reduzir verificações de um teste sem justificativa registrada.
- ❌ Não transformar teste real em mock apenas para evitar falha.
- ❌ Não alterar expectativa existente sem explicar a mudança.
- ❌ **"Build passou" ≠ "regressão passou".** `tsc`/`next build` não substituem `npm run regression`.
- ❌ Não considerar `INCOMPLETE` como sucesso.

## Teste da própria Gate (mutação)

Para confirmar que os testes não são vacuosos, copie `route.ts` para um arquivo temporário, introduza um defeito
(ex.: remover o `break` do 429) e rode com `REG_ROUTE_FILE=<caminho> npm run regression:fast`: o caso correspondente
deve falhar. Não faça isso editando o arquivo de produção.

## CI (sugestão futura — não implementada)

O projeto **não possui GitHub Actions** hoje. Quando fizer sentido, um job `ubuntu-latest` com
`npm ci && npm run regression` (Node 24) bloquearia merges. Fica fora do escopo desta etapa.
