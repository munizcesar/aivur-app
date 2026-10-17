// Casos de regressão — Trilhas / API de geração (rota REAL, rede simulada).
// Protegem COMPORTAMENTOS e CONTRATOS, não modelo/prompt/arquivos. Ver ../README.md.
import assert from "node:assert/strict";
import {
  AI_CALL_CAP, TPM_LIMIT, callGenerate, assertTrilhaContract, loadSchemas,
  validAiOutput, schemaInvalidAiOutput, ok, raw, truncated, fail,
} from "../_support/harness.mjs";
import { signSession } from "@/lib/session.ts";

const TITLE = "Concurso de Teste";

export const cases = [
  {
    id: "REG-TRILHAS-001",
    title: "Geração normal com sessão válida conclui com sucesso e custo mínimo (1 chamada à IA)",
    needs: "api",
    async run() {
      const { res, body, calls } = await callGenerate({ title: TITLE, script: () => ok(validAiOutput()) });
      assert.equal(res.status, 200);
      assert.equal(body.titulo, TITLE);
      assert.equal(calls.groq.length, 1, "geração válida não deve gastar chamadas extras");
    },
  },
  {
    id: "REG-TRILHAS-002",
    title: "Resposta da geração respeita o contrato estrutural esperado",
    needs: "api",
    async run() {
      const { res, body } = await callGenerate({ title: TITLE, script: () => ok(validAiOutput()) });
      assert.equal(res.status, 200);
      assertTrilhaContract(assert, body, TITLE);
    },
  },
  {
    id: "REG-TRILHAS-003",
    title: "Validação Zod aceita resposta válida (e continua rejeitando a inválida)",
    needs: "api",
    async run() {
      const { TrilhaSchema } = await loadSchemas();
      const Strict = TrilhaSchema.omit({ id: true, progresso: true });
      const withIds = (o) => ({
        ...o, titulo: TITLE,
        flashcards: o.flashcards.map((f, i) => ({ id: `f${i}`, ...f })),
        questoes: o.questoes.map((q, i) => ({ id: `q${i}`, ...q })),
      });
      assert.equal(Strict.safeParse(withIds(validAiOutput())).success, true, "schema deve aceitar o válido");
      assert.equal(Strict.safeParse(withIds(schemaInvalidAiOutput())).success, false, "schema deve rejeitar o inválido");
      const { body } = await callGenerate({ title: TITLE, script: () => ok(validAiOutput()) });
      assert.equal(TrilhaSchema.safeParse(body).success, true, "resposta da API deve passar no TrilhaSchema");
    },
  },
  {
    id: "REG-TRILHAS-004",
    title: "Sessão ausente/inválida retorna 401 controlado sem consumir IA",
    needs: "api",
    async run() {
      // 1. Cookie ausente e vazio em /api/ai/gerar-trilha
      for (const cookie of [null, "   "]) {
        const { res, body, calls } = await callGenerate({ cookie, script: () => ok(validAiOutput()) });
        assert.equal(res.status, 401);
        assert.equal(typeof body.error, "string");
        assert.ok(body.error.length > 0);
        assert.equal(calls.groq.length, 0, "sem sessão não pode haver chamada à IA");
      }

      // 2. Cookie forjado sem assinatura válida em /api/ai/gerar-trilha
      const { res: resForged, body: bodyForged, calls: callsForged } = await callGenerate({
        cookie: "forged-trilha-session-123",
        script: () => ok(validAiOutput()),
      });
      assert.equal(resForged.status, 401, "cookie forjado deve ser rejeitado com 401");
      assert.match(bodyForged.error, /sessão/i);
      assert.equal(callsForged.groq.length, 0, "cookie forjado não pode consumir IA");

      // 3. Cookie com assinatura adulterada em /api/ai/gerar-trilha
      const validToken = await signSession("trilha-user@aivur.com");
      const [payloadB64, sigB64] = validToken.split(".");
      const alteredSig = sigB64.slice(0, -2) + (sigB64.endsWith("x") ? "y" : "x");
      const { res: resTampered, calls: callsTampered } = await callGenerate({
        cookie: `${payloadB64}.${alteredSig}`,
        script: () => ok(validAiOutput()),
      });
      assert.equal(resTampered.status, 401, "assinatura adulterada deve ser rejeitada com 401");
      assert.equal(callsTampered.groq.length, 0, "assinatura adulterada não pode consumir IA");

      // 4. Cookie com sessão expirada em /api/ai/gerar-trilha
      const expiredToken = await signSession("trilha-user@aivur.com", { maxAgeMs: -1000 });
      const { res: resExpired, calls: callsExpired } = await callGenerate({
        cookie: expiredToken,
        script: () => ok(validAiOutput()),
      });
      assert.equal(resExpired.status, 401, "sessão expirada deve ser rejeitada com 401");
      assert.equal(callsExpired.groq.length, 0, "sessão expirada não pode consumir IA");

      // 5. Proteção de rotas D1 de Trilhas (/api/trilhas e /api/trilhas/[id]/gerar-mais)
      const { GET: getTrilhasRoute, POST: postTrilhasRoute } = await import("@/app/api/trilhas/route.ts");
      const { POST: gerarMaisRoute } = await import("@/app/api/trilhas/[id]/gerar-mais/route.ts");

      // GET /api/trilhas com cookie forjado
      globalThis.__REG_COOKIES = { aivur_session: "untrusted-cookie" };
      const getTrilhasRes = await getTrilhasRoute();
      assert.equal(getTrilhasRes.status, 401, "GET /api/trilhas deve rejeitar cookie forjado com 401");

      // POST /api/trilhas com cookie forjado
      const postTrilhasReq = new Request("http://localhost/api/trilhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: "Trilha Teste", disciplina: "Direito", video: {}, flashcards: [], questoes: [] }),
      });
      const postTrilhasRes = await postTrilhasRoute(postTrilhasReq);
      assert.equal(postTrilhasRes.status, 401, "POST /api/trilhas deve rejeitar cookie forjado com 401");

      // POST /api/trilhas/[id]/gerar-mais com cookie forjado
      const gerarMaisReq = new Request("http://localhost/api/trilhas/t-001/gerar-mais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "flashcards" }),
      });
      const gerarMaisRes = await gerarMaisRoute(gerarMaisReq, { params: Promise.resolve({ id: "t-001" }) });
      assert.equal(gerarMaisRes.status, 401, "POST /api/trilhas/[id]/gerar-mais deve rejeitar cookie forjado com 401");

      // 6. Proteção de rotas de Sincronização (/api/sync/push e /api/sync/pull)
      const { POST: syncPushRoute } = await import("@/app/api/sync/push/route.ts");
      const { POST: syncPullRoute } = await import("@/app/api/sync/pull/route.ts");

      // POST /api/sync/push com cookie forjado
      const pushReq = new Request("http://localhost/api/sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REGISTER_ANSWER", payload: { questionId: "q1", isCorrect: true } }),
      });
      const pushRes = await syncPushRoute(pushReq);
      assert.equal(pushRes.status, 401, "POST /api/sync/push deve rejeitar cookie forjado com 401");

      // POST /api/sync/pull com cookie forjado
      const pullReq = new Request("http://localhost/api/sync/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const pullRes = await syncPullRoute(pullReq);
      const pullData = await pullRes.json();
      assert.equal(pullData.success, false, "POST /api/sync/pull não pode autenticar cookie forjado");
      assert.equal(pullData.reason, "unauthorized");

      // 7. Isolamento de Dados entre Usuários (Anti-IDOR) em /api/trilhas/[id]
      const { GET: getTrilhaIdRoute } = await import("@/app/api/trilhas/[id]/route.ts");
      const validUserASession = await signSession("user-a@aivur.com");
      globalThis.__REG_COOKIES = { aivur_session: validUserASession };

      // Simula banco D1 com trilha pertencente exclusivamente a user-b
      const mockD1 = {
        prepare: (sql) => ({
          bind: (...args) => ({
            first: async () => {
              // Se a query busca por id e user_id
              const [idParam, userParam] = args;
              if (idParam === "trilha-user-b" && userParam === "user-b@aivur.com") {
                return { id: "trilha-user-b", user_id: "user-b@aivur.com", titulo: "Privada de B" };
              }
              // Se o usuário que pediu for user-a, não encontra
              return null;
            },
            all: async () => ({ results: [] }),
          }),
        }),
      };
      globalThis.__REG_CF_CONTEXT = { env: { D1_DB: mockD1 } };

      try {
        const idorReq = new Request("http://localhost/api/trilhas/trilha-user-b");
        const idorRes = await getTrilhaIdRoute(idorReq, { params: Promise.resolve({ id: "trilha-user-b" }) });
        assert.equal(idorRes.status, 404, "Usuário A não pode acessar trilha de Usuário B (anti-IDOR)");
        const idorData = await idorRes.json();
        assert.match(idorData.error, /não encontrada/i);
      } finally {
        delete globalThis.__REG_CF_CONTEXT;
        delete globalThis.__REG_COOKIES;
      }
    },
  },
  {
    id: "REG-TRILHAS-007",
    title: "HTTP 429 do provedor é tratado sem cascata de chamadas e com erro 429 controlado",
    needs: "api",
    async run() {
      const { res, body, calls } = await callGenerate({ script: () => fail(429, "rate limit") });
      assert.equal(res.status, 429);
      assert.equal(typeof body.error, "string");
      assert.ok(calls.groq.length <= 1, `429 não pode disparar cascata (chamadas: ${calls.groq.length})`);
    },
  },
  {
    id: "REG-TRILHAS-008",
    title: "Erro 5xx do provedor ainda permite recuperação por fallback",
    needs: "api",
    async run() {
      const { res, body, calls } = await callGenerate({
        title: TITLE,
        script: (n) => (n === 1 ? fail(503, "unavailable") : ok(validAiOutput())),
      });
      assert.equal(res.status, 200, "deve recuperar após falha 5xx inicial");
      assertTrilhaContract(assert, body, TITLE);
      assert.ok(calls.groq.length >= 2, "recuperação exige nova tentativa");
    },
  },
  {
    id: "REG-TRILHAS-009",
    title: "JSON truncado nunca vira sucesso; JSON fora do contrato aciona correção (Fixer)",
    needs: "api",
    async run() {
      // (a) truncado/ilegível: erro controlado, jamais sucesso nem trilha parcial.
      for (const step of [truncated(validAiOutput()), raw("resposta sem json algum")]) {
        const { res, body } = await callGenerate({ script: () => step });
        assert.ok(res.status >= 400 && res.status < 500, `esperado erro controlado, veio ${res.status}`);
        assert.equal(typeof body.error, "string");
        assert.equal(body.video, undefined, "trilha parcial não pode vazar como sucesso");
        assert.equal(body.questoes, undefined);
      }
      // (b) JSON válido porém fora do contrato: correção é acionada e o resultado final é válido.
      const { res, body, calls } = await callGenerate({
        title: TITLE,
        script: (n) => (n === 1 ? ok(schemaInvalidAiOutput()) : ok(validAiOutput())),
      });
      assert.equal(res.status, 200);
      assertTrilhaContract(assert, body, TITLE);
      assert.ok(calls.groq.length >= 2, "o Fixer deveria ter sido acionado");
    },
  },
  {
    id: "REG-TRILHAS-010",
    title: "Fixer não entra em loop: termina com número finito de chamadas",
    needs: "api",
    async run() {
      const { res, calls } = await callGenerate({ script: () => ok(schemaInvalidAiOutput()) });
      assert.ok(res.status >= 400, "nunca pode ser sucesso");
      assert.ok(calls.groq.length <= AI_CALL_CAP, `chamadas ${calls.groq.length} > teto ${AI_CALL_CAP}`);
    },
  },
  {
    id: "REG-TRILHAS-011",
    title: "Falha definitiva do Fixer produz erro 422 controlado (nunca sucesso)",
    needs: "api",
    async run() {
      const scenarios = [
        (n) => ok(schemaInvalidAiOutput()),                                // fixer devolve ainda inválido
        (n) => (n === 1 ? ok(schemaInvalidAiOutput()) : truncated(validAiOutput())), // fixer truncado
        (n) => (n === 1 ? ok(schemaInvalidAiOutput()) : fail(500, "down")),          // provedor cai no fixer
      ];
      for (const script of scenarios) {
        const { res, body } = await callGenerate({ script });
        assert.equal(res.status, 422);
        assert.equal(typeof body.error, "string");
        assert.equal(body.video, undefined, "resposta parcial não pode ser entregue");
      }
    },
  },
  {
    id: "REG-TRILHAS-012",
    title: "Limite de tentativas permanece finito em qualquer tipo de falha persistente",
    needs: "api",
    async run() {
      for (const script of [() => fail(500, "down"), () => fail(503, "down"), () => ok(schemaInvalidAiOutput())]) {
        const { res, calls } = await callGenerate({ script });
        assert.ok(res.status >= 400);
        assert.ok(calls.groq.length <= AI_CALL_CAP, `chamadas ${calls.groq.length} > teto ${AI_CALL_CAP}`);
      }
    },
  },
  {
    id: "REG-TRILHAS-015",
    title: "Entrada extensa respeita o orçamento de tokens (cabe no TPM e não trunca a saída)",
    needs: "api",
    async run() {
      const huge = "Art. 1º O trânsito de qualquer natureza nas vias terrestres do território nacional. ".repeat(900); // ~75k chars
      const { calls } = await callGenerate({
        text: huge,
        // força também a requisição do Fixer para auditar as DUAS formas de chamada
        script: (n) => (n === 1 ? ok(schemaInvalidAiOutput()) : ok(validAiOutput())),
      });
      assert.ok(calls.groq.length >= 2);
      for (const body of calls.groq) {
        const promptChars = body.messages.reduce((s, m) => s + String(m.content).length, 0);
        const promptTokens = Math.ceil(promptChars / 3.5); // estimativa conservadora pt-BR
        assert.ok(promptChars < huge.length, "o conteúdo de entrada deve ser limitado antes de ir à IA");
        assert.ok(promptTokens + body.max_tokens <= TPM_LIMIT,
          `prompt~${promptTokens} + max_tokens ${body.max_tokens} excede ${TPM_LIMIT} TPM`);
        assert.ok(body.max_tokens >= 1600,
          `max_tokens ${body.max_tokens} < 1600: pode truncar uma trilha completa (payload medido ~1,2–1,6k tokens)`);
      }
    },
  },
];
