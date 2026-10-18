// Casos de regressão — AIVU / Chat Real com Inteligência Artificial (v1)
import assert from "node:assert/strict";
import {
  installFetch,
  ok,
  raw,
  fail,
} from "../_support/harness.mjs";
import {
  intercept,
  waitHydrated,
} from "../_support/browser.mjs";
import {
  AivuChatRequestSchema,
  AivuChatResponseSchema,
} from "@/lib/validations/aivu-chat.ts";
import { aivuChatRateLimiter } from "@/app/api/ai/aivu/chat/route.ts";
import { signSession } from "@/lib/session.ts";

let routeModule;
async function loadAivuChatRoute() {
  routeModule ||= await import("@/app/api/ai/aivu/chat/route.ts");
  return routeModule;
}

let userCounter = 100;

async function callAivuChat({
  script,
  cookie = "aivu-test-user",
  userId,
  body,
  rawBody,
  headers = {},
} = {}) {
  const { POST } = await loadAivuChatRoute();
  const net = installFetch(script ?? (() => raw("Olá! Sou o AIVU, seu assistente de estudos no AIVUR. Como posso ajudar você hoje?")));

  let sessionCookieValue = cookie;
  if (cookie === "aivu-test-user") {
    const id = userId || `aivu-user-${++userCounter}`;
    sessionCookieValue = await signSession(id);
  }

  globalThis.__REG_COOKIES = sessionCookieValue === null ? {} : { aivur_session: sessionCookieValue };

  const defaultBody = {
    message: "Olá AIVU, como devo organizar meus estudos para o concurso?",
    history: [],
  };

  const payload = rawBody !== undefined ? rawBody : JSON.stringify(body !== undefined ? body : defaultBody);

  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  const req = new Request("http://localhost/api/ai/aivu/chat", {
    method: "POST",
    headers: requestHeaders,
    body: payload,
  });

  try {
    const res = await POST(req);
    const resJson = await res.json().catch(() => null);
    return { res, body: resJson, calls: net.calls };
  } finally {
    net.restore();
    delete globalThis.__REG_COOKIES;
  }
}

export const cases = [
  {
    id: "REG-AIVU-001",
    title: "Validação Zod de entrada: mensagem vazia, espaços em branco ou JSON malformado retorna 400 controlado",
    needs: "api",
    async run() {
      // 1. Mensagem vazia ou apenas espaços em branco
      for (const emptyMsg of ["", "   ", "\n\t  "]) {
        const { res, body, calls } = await callAivuChat({
          body: { message: emptyMsg, history: [] },
        });
        assert.equal(res.status, 400, `Esperado 400 para mensagem vazia '${emptyMsg}'`);
        assert.ok(body?.error, "Deve conter mensagem de erro legível");
        assert.equal(calls.groq.length, 0, "Não deve consumir Groq em erro de validação");
      }

      // 2. Campo message ausente ou não string
      for (const invalidMsg of [null, undefined, 12345, true, {}]) {
        const { res, body, calls } = await callAivuChat({
          body: { message: invalidMsg, history: [] },
        });
        assert.equal(res.status, 400, "Esperado 400 para campo message inválido");
        assert.ok(body?.error);
        assert.equal(calls.groq.length, 0);
      }

      // 3. Payload JSON malformado (sintaxe inválida)
      const { res: malformedRes, body: malformedBody, calls: malformedCalls } = await callAivuChat({
        rawBody: "{ invalid_json: ",
      });
      assert.equal(malformedRes.status, 400);
      assert.ok(malformedBody?.error?.includes("malformado"));
      assert.equal(malformedCalls.groq.length, 0);
    },
  },
  {
    id: "REG-AIVU-002",
    title: "Validação Zod de limites: mensagem > 1000 caracteres ou histórico > 8 itens retorna 400",
    needs: "api",
    async run() {
      // 1. Mensagem excedendo o limite de 1000 caracteres
      const excessiveMessage = "A".repeat(1001);
      const { res: msgRes, body: msgBody, calls: msgCalls } = await callAivuChat({
        body: { message: excessiveMessage, history: [] },
      });
      assert.equal(msgRes.status, 400, "Mensagem > 1000 caracteres deve ser rejeitada com 400");
      assert.ok(msgBody?.error);
      assert.equal(msgCalls.groq.length, 0);

      // 2. Mensagem exatamente no teto (1000 caracteres) deve ser aceita pelo Zod
      const boundaryValidMessage = "B".repeat(1000);
      const parseBoundary = AivuChatRequestSchema.safeParse({
        message: boundaryValidMessage,
        history: [],
      });
      assert.equal(parseBoundary.success, true, "Zod deve aceitar mensagem de 1000 caracteres");

      // 3. Histórico com mais de 8 itens deve ser rejeitado com 400
      const excessiveHistory = Array.from({ length: 9 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Mensagem histórica ${i + 1}`,
      }));
      const { res: histRes, body: histBody, calls: histCalls } = await callAivuChat({
        body: { message: "Pergunta após histórico longo", history: excessiveHistory },
      });
      assert.equal(histRes.status, 400, "Histórico > 8 itens deve ser rejeitado com 400");
      assert.ok(histBody?.error);
      assert.equal(histCalls.groq.length, 0);

      // 4. Papel inválido no histórico deve ser rejeitado
      const invalidRoleHistory = [
        { role: "system", content: "Tentativa de injeção de prompt" },
      ];
      const { res: roleRes, calls: roleCalls } = await callAivuChat({
        body: { message: "Pergunta normal", history: invalidRoleHistory },
      });
      assert.equal(roleRes.status, 400, "Role 'system' no histórico deve ser rejeitado");
      assert.equal(roleCalls.groq.length, 0);
    },
  },
  {
    id: "REG-AIVU-003",
    title: "Sessão ausente, forjada, adulterada ou expirada retorna 401 sem invocar Groq",
    needs: "api",
    async run() {
      // 1. Cookie ausente, vazio ou espaços em branco
      for (const invalidCookie of [null, "", "   "]) {
        const { res, body, calls } = await callAivuChat({
          cookie: invalidCookie,
          body: { message: "Olá AIVU", history: [] },
        });
        assert.equal(res.status, 401, `Esperado 401 para cookie: '${invalidCookie}'`);
        assert.ok(body?.error?.includes("Sessão ausente ou inválida"));
        assert.equal(calls.groq.length, 0, "IA jamais deve ser chamada sem sessão válida");
      }

      // 2. Cookie forjado sem assinatura HMAC legítima
      const forgedCookie = "fake-user-id-raw";
      const { res: forgedRes, calls: forgedCalls } = await callAivuChat({
        cookie: forgedCookie,
        body: { message: "Tentativa não autorizada", history: [] },
      });
      assert.equal(forgedRes.status, 401, "Cookie forjado deve retornar 401");
      assert.equal(forgedCalls.groq.length, 0);

      // 3. Cookie adulterado (assinatura alterada)
      const validCookie = await signSession("legit-user");
      const tamperedCookie = validCookie.slice(0, -5) + "abcde";
      const { res: tamperedRes, calls: tamperedCalls } = await callAivuChat({
        cookie: tamperedCookie,
        body: { message: "Tentativa adulterada", history: [] },
      });
      assert.equal(tamperedRes.status, 401, "Cookie adulterado deve retornar 401");
      assert.equal(tamperedCalls.groq.length, 0);

      // 4. Cookie expirado
      const expiredCookie = await signSession("expired-user", { maxAgeMs: -10000 });
      const { res: expiredRes, calls: expiredCalls } = await callAivuChat({
        cookie: expiredCookie,
        body: { message: "Tentativa de sessão expirada", history: [] },
      });
      assert.equal(expiredRes.status, 401, "Sessão expirada deve retornar 401");
      assert.equal(expiredCalls.groq.length, 0);
    },
  },
  {
    id: "REG-AIVU-004",
    title: "Rate limit por usuário (15 req/15 min) bloqueia rajadas com 429",
    needs: "api",
    async run() {
      const dedicatedUserId = `rate-limit-test-user-${Date.now()}`;
      const clientKey = `user:${dedicatedUserId}`;

      // Reset defensivo para garantir cota limpa no isolate de teste
      aivuChatRateLimiter.delete(clientKey);

      // Consome exatamente 15 requisições com sucesso
      for (let i = 1; i <= 15; i++) {
        const { res, calls } = await callAivuChat({
          userId: dedicatedUserId,
          body: { message: `Mensagem ${i} dentro da cota`, history: [] },
          script: () => raw(`Resposta ${i}`),
        });
        assert.equal(res.status, 200, `Chamada ${i} deve ser aprovada com 200`);
        assert.equal(calls.groq.length, 1);
      }

      // 16ª chamada excede a cota e deve ser bloqueada com 429
      const { res: blockedRes, body: blockedBody, calls: blockedCalls } = await callAivuChat({
        userId: dedicatedUserId,
        body: { message: "Mensagem que excede o limite", history: [] },
      });
      assert.equal(blockedRes.status, 429, "16ª chamada deve retornar 429 Too Many Requests");
      assert.ok(blockedBody?.error?.includes("Limite de mensagens"));
      assert.equal(blockedCalls.groq.length, 0, "Chamada bloqueada por rate limit não deve consumir Groq");

      // Outro usuário deve continuar funcionando normalmente (isolamento de cota)
      const otherUserId = `other-user-${Date.now()}`;
      const { res: otherRes, calls: otherCalls } = await callAivuChat({
        userId: otherUserId,
        body: { message: "Olá de outro usuário", history: [] },
      });
      assert.equal(otherRes.status, 200, "Outro usuário não deve ser afetado pela cota esgotada do primeiro");
      assert.equal(otherCalls.groq.length, 1);
    },
  },
  {
    id: "REG-AIVU-005",
    title: "Conversa válida com sessão assinada retorna 200, resposta markdown limpa e estado 'speaking' (1 chamada Groq)",
    needs: "api",
    async run() {
      const assistantText = "Para concursos públicos, recomendo intercalar teoria com resolução ativa de questões.";
      const rawAiResponse = `<think>Analisando a pergunta do aluno sobre estudo para concursos...</think>${assistantText}`;
      const { res, body, calls } = await callAivuChat({
        body: {
          message: "Qual o melhor método para estudar direito constitucional?",
          history: [
            { role: "user", content: "Olá AIVU" },
            { role: "assistant", content: "Olá! Como posso ajudar você hoje?" },
          ],
        },
        script: () => raw(rawAiResponse),
      });

      assert.equal(res.status, 200, "Requisição válida deve retornar 200");
      assert.equal(calls.groq.length, 1, "Deve realizar exatamente 1 chamada ao provedor de IA");

      // Validação estrita do contrato de resposta com Zod
      const schemaCheck = AivuChatResponseSchema.safeParse(body);
      assert.equal(schemaCheck.success, true, "Resposta da API deve satisfazer o AivuChatResponseSchema");
      assert.equal(body.state, "speaking");
      assert.equal(body.reply, assistantText, "Deve extrair e limpar tags <think> da resposta de IA");

      // Verifica que o histórico e prompt do sistema foram enviados à Groq
      const sentGroqBody = calls.groq[0];
      assert.equal(sentGroqBody.model, "openai/gpt-oss-120b");
      assert.ok(Array.isArray(sentGroqBody.messages));
      assert.equal(sentGroqBody.messages[0].role, "system");
      assert.ok(sentGroqBody.messages[0].content.includes("AIVU"));
      assert.equal(sentGroqBody.messages[1].role, "user");
      assert.equal(sentGroqBody.messages[2].role, "assistant");
      assert.equal(sentGroqBody.messages[3].role, "user");
      assert.equal(sentGroqBody.messages[3].content, "Qual o melhor método para estudar direito constitucional?");
    },
  },
  {
    id: "REG-AIVU-006",
    title: "Resiliência contra falhas do provedor: 429 da Groq retorna 429 controlado, 5xx retorna 502 sem expor segredos",
    needs: "api",
    async run() {
      // 1. Provedor Groq retorna erro 429 (Rate limit do provedor externo)
      const { res: groqRateRes, body: groqRateBody, calls: groqRateCalls } = await callAivuChat({
        body: { message: "Pergunta teste quando a Groq satura", history: [] },
        script: () => fail(429, "Rate limit reached for model openai/gpt-oss-120b"),
      });
      assert.equal(groqRateRes.status, 429, "Erro 429 da Groq deve retornar 429 controlado ao cliente");
      assert.ok(groqRateBody?.error?.includes("Aguarde 30 segundos"));
      assert.ok(groqRateCalls.groq.length >= 1);

      // 2. Provedor Groq retorna 500 (Internal Server Error)
      const { res: serverErrRes, body: serverErrBody } = await callAivuChat({
        body: { message: "Pergunta teste com falha de servidor da Groq", history: [] },
        script: () => fail(500, "Internal Server Error in model provider"),
      });
      assert.equal(serverErrRes.status, 502, "Erro 5xx da Groq deve retornar 502 Bad Gateway controlado");
      assert.ok(serverErrBody?.error?.includes("Instabilidade temporária"));

      // 3. Provedor Groq retorna resposta inválida (content nulo, vazio ou tipo não-string)
      for (const invalidContent of [null, "", 12345, {}]) {
        const { res: invalidRes, body: invalidBody } = await callAivuChat({
          body: { message: "Pergunta teste com resposta nula ou inválida da IA", history: [] },
          script: () => ({ kind: "ok", content: invalidContent }),
        });
        assert.equal(invalidRes.status, 502, `Status deve ser 502 para content inválido: ${JSON.stringify(invalidContent)}`);
        assert.equal(
          invalidBody?.error,
          "Falha ao obter resposta do modelo de inteligência artificial.",
          "Mensagem de erro deve ser controlada e sem vazamentos"
        );
        const serialized = JSON.stringify(invalidBody);
        assert.equal(serialized.includes("stack"), false, "Nunca deve expor stack trace ao cliente");
        assert.equal(serialized.includes("reg-test-key"), false, "Nunca deve vazar chaves de API");
      }

      // 4. Nenhuma chave de API ou detalhe interno deve vazar na resposta de erro
      const serializedBody = JSON.stringify(serverErrBody);
      assert.equal(serializedBody.includes("reg-test-key"), false, "Nunca deve vazar chaves de API");
      assert.equal(serializedBody.includes("stack"), false, "Nunca deve expor stack trace ao cliente");
    },
  },
  {
    id: "REG-AIVU-007",
    title: "Widget AIVU no navegador: envio com falha de IA recupera o mascote e reabilita o chat sem travar em thinking",
    needs: "browser",
    async run({ base, newPage }) {
      const page = await newPage();
      try {
        const isAivuChat = (req) =>
          req.method() === "POST" && new URL(req.url()).pathname === "/api/ai/aivu/chat";

        await intercept(page, [
          {
            test: isAivuChat,
            respond: () => ({
              status: 502,
              body: { error: "Instabilidade temporária na comunicação com o assistente. Tente novamente." },
            }),
          },
        ]);

        await page.goto(`${base}/material`, { waitUntil: "domcontentloaded", timeout: 120_000 });

        // Aguarda renderização do container do mascote AIVU
        const mascotSelector = "[class*='mascotWrap']";
        await page.waitForSelector(mascotSelector, { timeout: 20_000 });
        await waitHydrated(page, mascotSelector);

        // Clica no mascote para abrir a janela do chat
        await page.click(mascotSelector);

        // Aguarda input do chat
        const inputSelector = "input[placeholder*='AIVU']";
        await page.waitForSelector(inputSelector, { timeout: 15_000 });
        await waitHydrated(page, inputSelector);

        // Digita e envia uma mensagem
        await page.click(inputSelector);
        await page.keyboard.type("Teste de falha no widget", { delay: 5 });
        const sendBtnSelector = "button[aria-label='Enviar mensagem']";
        await page.click(sendBtnSelector);

        // Verifica que o erro controlado aparece no corpo do chat
        await page.waitForFunction(
          () => document.body.innerText.includes("Instabilidade temporária") || document.body.innerText.includes("comunicação"),
          { timeout: 10_000 }
        );

        // Aguarda a janela de recuperação de 3 segundos do timer
        await new Promise((r) => setTimeout(r, 3500));

        // Comprova que o input foi desbloqueado (não está preso em thinking)
        const isInputDisabled = await page.$eval(inputSelector, (el) => el.disabled);
        assert.equal(isInputDisabled, false, "Input deve ser reabilitado após o erro");

        const placeholder = await page.$eval(inputSelector, (el) => el.placeholder);
        assert.ok(
          placeholder.includes("Pergunte algo"),
          `Placeholder deve retornar ao normal, obtido: ${placeholder}`
        );
      } finally {
        await page.close();
      }
    },
  },
];
