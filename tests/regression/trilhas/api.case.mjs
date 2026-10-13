// Casos de regressão — Trilhas / API de geração (rota REAL, rede simulada).
// Protegem COMPORTAMENTOS e CONTRATOS, não modelo/prompt/arquivos. Ver ../README.md.
import assert from "node:assert/strict";
import {
  AI_CALL_CAP, TPM_LIMIT, callGenerate, assertTrilhaContract, loadSchemas,
  validAiOutput, schemaInvalidAiOutput, ok, raw, truncated, fail,
} from "../_support/harness.mjs";

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
      for (const cookie of [null, "   "]) {
        const { res, body, calls } = await callGenerate({ cookie, script: () => ok(validAiOutput()) });
        assert.equal(res.status, 401);
        assert.equal(typeof body.error, "string");
        assert.ok(body.error.length > 0);
        assert.equal(calls.groq.length, 0, "sem sessão não pode haver chamada à IA");
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
