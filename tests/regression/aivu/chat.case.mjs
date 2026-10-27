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
  {
    id: "REG-AIVU-008",
    title: "Isolamento de contexto e retrocompatibilidade com contexto ausente ou geral",
    needs: "api",
    async run() {
      // 1. Requisição legada sem o campo 'context' deve funcionar normalmente (retrocompatibilidade)
      const { res: noCtxRes, body: noCtxBody, calls: noCtxCalls } = await callAivuChat({
        body: {
          message: "Como funciona o concurso público pela CF/88?",
          history: [],
        },
      });
      assert.equal(noCtxRes.status, 200, "Requisição sem context deve retornar 200");
      assert.ok(noCtxBody?.reply);
      assert.equal(noCtxCalls.groq.length, 1);
      const systemMsgNoCtx = noCtxCalls.groq[0].messages.find((m) => m.role === "system")?.content || "";
      assert.ok(systemMsgNoCtx.includes("Professor Particular Inteligente"), "Deve conter a persona do AIVU");
      assert.equal(
        systemMsgNoCtx.includes("=== CONTEXTO DA PÁGINA ATUAL DO ALUNO ==="),
        false,
        "Não deve injetar bloco de contexto de página quando ausente"
      );

      // 2. Requisição com contexto 'geral' deve manter a persona sem poluição de contexto
      const { res: generalRes, calls: generalCalls } = await callAivuChat({
        body: {
          message: "Qual a melhor técnica de estudos?",
          history: [],
          context: {
            pathname: "/dashboard",
            modulo: "geral",
            atividade: "navegando",
          },
        },
      });
      assert.equal(generalRes.status, 200);
      assert.equal(generalCalls.groq.length, 1);
      const systemMsgGeneral = generalCalls.groq[0].messages.find((m) => m.role === "system")?.content || "";
      assert.equal(
        systemMsgGeneral.includes("=== CONTEXTO DA PÁGINA ATUAL DO ALUNO ==="),
        false,
        "Módulo 'geral' não deve poluir o system prompt"
      );
    },
  },
  {
    id: "REG-AIVU-009",
    title: "Contexto tipado por módulo e troca dinâmica de contexto pedagógico",
    needs: "api",
    async run() {
      // 1. Contexto no módulo Trilhas com disciplina jurídica (injeta protocolo de domínio)
      const { res: trilhaRes, calls: trilhaCalls } = await callAivuChat({
        body: {
          message: "O que é controle difuso de constitucionalidade?",
          history: [],
          context: {
            pathname: "/dashboard/trilhas/direito-constitucional",
            modulo: "trilhas",
            atividade: "lendo_teoria",
            disciplina: "Direito Constitucional",
            titulo: "Controle de Constitucionalidade",
            topico: "Controle Difuso no STF",
          },
        },
      });
      assert.equal(trilhaRes.status, 200);
      assert.equal(trilhaCalls.groq.length, 1);
      const trilhaSystem = trilhaCalls.groq[0].messages.find((m) => m.role === "system")?.content || "";
      assert.ok(trilhaSystem.includes("Módulo Atual: TRILHAS"));
      assert.ok(trilhaSystem.includes("Controle de Constitucionalidade"));
      assert.ok(trilhaSystem.includes("PROTOCOLO DE CONFIABILIDADE DE DOMÍNIO"), "Deve carregar regras de Direito Constitucional");

      // 2. Troca dinâmica para módulo Questões com foco em item de prova
      const { res: questaoRes, calls: questaoCalls } = await callAivuChat({
        body: {
          message: "Por que a alternativa C está errada?",
          history: [],
          context: {
            pathname: "/dashboard/questoes/q101",
            modulo: "questoes",
            atividade: "resolvendo_questao",
            disciplina: "Direito Administrativo",
            titulo: "Princípios da Administração Pública",
            trecho_foco: "A autoexecutoriedade autoriza o Poder Público a compelir o administrado sem prévia autorização judicial.",
          },
        },
      });
      assert.equal(questaoRes.status, 200);
      assert.equal(questaoCalls.groq.length, 1);
      const questaoSystem = questaoCalls.groq[0].messages.find((m) => m.role === "system")?.content || "";
      assert.ok(questaoSystem.includes("Módulo Atual: QUESTOES"));
      assert.ok(questaoSystem.includes("DIRETRIZ PARA QUESTÕES DE CONCURSO"));
      assert.ok(questaoSystem.includes("autoexecutoriedade"));
    },
  },
  {
    id: "REG-AIVU-010",
    title: "Regra restritiva de ancoragem no Meu Material: base estrita na fonte e rejeição de extrapolações",
    needs: "api",
    async run() {
      const { res, calls } = await callAivuChat({
        body: {
          message: "Qual o prazo estabelecido na apostila?",
          history: [],
          context: {
            pathname: "/dashboard/material/caderno-1",
            modulo: "material",
            atividade: "estudando_material",
            titulo: "Apostila de Licitações Lei 14.133",
            trecho_foco: "O prazo mínimo para apresentação de propostas no pregão é de 8 dias úteis para bens comuns.",
          },
        },
      });
      assert.equal(res.status, 200);
      assert.equal(calls.groq.length, 1);
      const systemContent = calls.groq[0].messages.find((m) => m.role === "system")?.content || "";
      assert.ok(systemContent.includes("DIRETRIZ RESTRITIVA DE FONTE (MEU MATERIAL)"));
      assert.ok(systemContent.includes("ESTRITAMENTE no trecho"));
      assert.ok(systemContent.includes("Informação não encontrada no material fornecido."));
      assert.ok(systemContent.includes("pregão é de 8 dias úteis"));
    },
  },
  {
    id: "REG-AIVU-011",
    title: "Privacidade e orçamento de tokens: limites Zod em trecho_foco e poda defensiva de histórico",
    needs: "api",
    async run() {
      // 1. Zod rejeita trecho_foco > 1.500 caracteres com 400 sem chamar o Groq (privacidade / token budget)
      const excessiveTrecho = "X".repeat(1501);
      const { res: rejRes, body: rejBody, calls: rejCalls } = await callAivuChat({
        body: {
          message: "Explique esse trecho",
          history: [],
          context: {
            pathname: "/dashboard/material/doc",
            modulo: "material",
            atividade: "estudando_material",
            trecho_foco: excessiveTrecho,
          },
        },
      });
      assert.equal(rejRes.status, 400, "trecho_foco > 1500 chars deve retornar 400");
      assert.ok(rejBody?.error);
      assert.ok(JSON.stringify(rejBody).includes("1.500 caracteres"));
      assert.equal(rejCalls.groq.length, 0, "Não deve consumir Groq");

      // 2. trecho_foco no limite exato de 1.500 caracteres é aceito
      const validBoundaryTrecho = "Y".repeat(1500);
      const { res: boundRes, calls: boundCalls } = await callAivuChat({
        body: {
          message: "Trecho no limite de segurança",
          history: [],
          context: {
            pathname: "/dashboard/material/doc",
            modulo: "material",
            atividade: "estudando_material",
            trecho_foco: validBoundaryTrecho,
          },
        },
      });
      assert.equal(boundRes.status, 200, "trecho_foco com 1500 caracteres deve ser aceito");
      assert.equal(boundCalls.groq.length, 1);

      // 3. Orçamento de tokens e poda de histórico: mensagens que excedem o limite seguro são podadas
      // Cada mensagem com 800 chars consome ~222 tokens. 6 mensagens = ~1332 tokens (> reserva de 1100).
      const heavyHistory = Array.from({ length: 6 }, (_, idx) => ({
        role: idx % 2 === 0 ? "user" : "assistant",
        content: `MENSAGEM_${idx + 1}_` + "Z".repeat(780),
      }));
      const { res: histRes, calls: histCalls } = await callAivuChat({
        body: {
          message: "Pergunta com histórico pesado",
          history: heavyHistory,
        },
      });
      assert.equal(histRes.status, 200);
      assert.equal(histCalls.groq.length, 1);
      const sentMessages = histCalls.groq[0].messages;
      // Não deve incluir todas as 6 mensagens históricas por causa da contenção de tokens
      const historicRolesInCall = sentMessages.filter((m) => m.role === "user" || m.role === "assistant");
      // A última é a mensagem atual, as anteriores são o histórico podado
      const historyInCall = historicRolesInCall.slice(0, -1);
      assert.ok(
        historyInCall.length < heavyHistory.length,
        `Histórico deve ser podado para respeitar reserva de tokens. Enviados: ${historyInCall.length}, Original: ${heavyHistory.length}`
      );
      // Deve preservar a mensagem mais recente do histórico
      assert.ok(
        historyInCall[historyInCall.length - 1].content.includes("MENSAGEM_6_"),
        "Deve manter as mensagens mais recentes do histórico"
      );
    },
  },
  {
    id: "REG-AIVU-012",
    title: "Transição dinâmica de contexto entre telas (Questões -> Meu Material -> Reset): isolamento estrito sem resíduos",
    needs: "api",
    async run() {
      const { useAivoStore } = await import("@/store/useAivoStore.ts");

      // 1. Aluno na tela de Questões com questão ativa em foco
      useAivoStore.getState().setActiveContext({
        pathname: "/questoes",
        modulo: "questoes",
        atividade: "resolvendo_questao",
        disciplina: "Direito Constitucional",
        topico: "Direitos e Garantias Fundamentais",
        titulo: "Questão 1 de 10",
        trecho_foco: "Acerca dos direitos individuais na CF/88, assinale a correta.\nAlternativas:\n(A) A prisão legal...\n(B) É inviolável...",
        metadados: {
          banca: "CESPE",
          indiceQuestao: "1",
        },
      });

      const questoesCtx = useAivoStore.getState().activeContext;
      assert.equal(questoesCtx?.modulo, "questoes");
      assert.ok(questoesCtx?.trecho_foco?.includes("CF/88"));

      const { res: qRes, calls: qCalls } = await callAivuChat({
        body: {
          message: "Qual o gabarito dessa questão?",
          history: [],
          context: questoesCtx,
        },
      });
      assert.equal(qRes.status, 200);
      assert.equal(qCalls.groq.length, 1);
      const qSystem = qCalls.groq[0].messages.find((m) => m.role === "system")?.content || "";
      assert.ok(qSystem.includes("Módulo Atual: QUESTOES"));
      assert.ok(qSystem.includes("DIRETRIZ PARA QUESTÕES DE CONCURSO"));
      assert.ok(qSystem.includes("CF/88"));

      // 2. Aluno sai de Questões e entra em Meu Material: desmonta tela anterior
      useAivoStore.getState().setActiveContext(null);
      assert.equal(useAivoStore.getState().activeContext, null, "Contexto deve ser zerado ao sair da tela");

      // Monta tela de Meu Material com documento próprio
      useAivoStore.getState().setActiveContext({
        pathname: "/material",
        modulo: "material",
        atividade: "estudando_material",
        titulo: "Apostila de Licitações Lei 14.133",
        disciplina: "Meu Material",
        trecho_foco: "O pregão é modalidade de licitação obrigatória para aquisição de bens e serviços comuns.",
        metadados: {
          origem: "pdf",
          abaAtiva: "Resumo Estruturado",
        },
      });

      const materialCtx = useAivoStore.getState().activeContext;
      assert.equal(materialCtx?.modulo, "material");

      const { res: mRes, calls: mCalls } = await callAivuChat({
        body: {
          message: "O que diz a apostila sobre o pregão?",
          history: [],
          context: materialCtx,
        },
      });
      assert.equal(mRes.status, 200);
      assert.equal(mCalls.groq.length, 1);
      const mSystem = mCalls.groq[0].messages.find((m) => m.role === "system")?.content || "";
      assert.ok(mSystem.includes("Módulo Atual: MATERIAL"));
      assert.ok(mSystem.includes("DIRETRIZ RESTRITIVA DE FONTE (MEU MATERIAL)"));
      assert.ok(mSystem.includes("pregão é modalidade de licitação obrigatória"));
      // Confirma que NÃO HÁ NENHUM RESÍDUO da questão anterior no prompt
      assert.equal(mSystem.includes("CF/88"), false, "Não deve haver resíduo da questão anterior no Meu Material");
      assert.equal(mSystem.includes("DIRETRIZ PARA QUESTÕES DE CONCURSO"), false);

      // 3. Aluno reinicia material / navega para Dashboard
      useAivoStore.getState().setActiveContext(null);
      assert.equal(useAivoStore.getState().activeContext, null);

      const { res: dashRes, calls: dashCalls } = await callAivuChat({
        body: {
          message: "O que devo estudar agora?",
          history: [],
          context: undefined,
        },
      });
      assert.equal(dashRes.status, 200);
      assert.equal(dashCalls.groq.length, 1);
      const dashSystem = dashCalls.groq[0].messages.find((m) => m.role === "system")?.content || "";
      assert.equal(dashSystem.includes("=== CONTEXTO DA PÁGINA ATUAL DO ALUNO ==="), false);
      assert.equal(dashSystem.includes("pregão"), false);
      assert.equal(dashSystem.includes("CF/88"), false);
    },
  },
  {
    id: "REG-AIVU-013",
    title: "Preservação do histórico pedagógico da conversa durante a navegação entre telas de estudo",
    needs: "api",
    async run() {
      const { useAivoStore } = await import("@/store/useAivoStore.ts");

      // Inicia conversa na tela de Questões
      useAivoStore.getState().clearMessages();
      useAivoStore.getState().addMessage({ sender: "user", text: "Estou com dúvida nesta questão de Administrativo" });
      useAivoStore.getState().addMessage({ sender: "aivo", text: "Claro! Vamos analisar os requisitos do ato administrativo." });

      // Troca de tela para Jornadas (o contexto muda, mas as mensagens permanecem)
      useAivoStore.getState().setActiveContext({
        pathname: "/jornadas/j1",
        modulo: "jornadas",
        atividade: "analisando_edital",
        titulo: "Jornada TRT",
        disciplina: "Direito Administrativo",
        topico: "Atos Administrativos",
        trecho_foco: "Tópico atual da jornada: Direito Administrativo - Atos Administrativos.",
      });

      // Confirma que o histórico na store não foi apagado pela troca de contexto
      const currentMessages = useAivoStore.getState().messages;
      assert.equal(currentMessages.length, 2, "Histórico da conversa deve persistir após troca de tela");
      assert.equal(currentMessages[0].text, "Estou com dúvida nesta questão de Administrativo");

      // Monta payload com o histórico mantido e o novo contexto da Jornada
      const historyPayload = currentMessages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const { res, calls } = await callAivuChat({
        body: {
          message: "Como esse tópico é cobrado no TRT?",
          history: historyPayload,
          context: useAivoStore.getState().activeContext,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(calls.groq.length, 1);
      const sentGroqMessages = calls.groq[0].messages;

      // 1 system + 2 histórico + 1 nova pergunta = 4 mensagens
      assert.equal(sentGroqMessages.length, 4, "Groq deve receber histórico anterior + novo contexto de página");
      assert.ok(sentGroqMessages[0].content.includes("Módulo Atual: JORNADAS"));
      assert.ok(sentGroqMessages[1].content.includes("dúvida nesta questão"));
      assert.ok(sentGroqMessages[2].content.includes("ato administrativo"));
      assert.ok(sentGroqMessages[3].content.includes("cobrado no TRT"));

      // Limpa estado para não interferir em outros testes
      useAivoStore.getState().setActiveContext(null);
    },
  },
  {
    id: "REG-AIVU-014",
    title: "Trilhas: alternância dinâmica de contexto entre teoria, flashcards e questões sem retenção de estado anterior",
    needs: "api",
    async run() {
      const { useAivoStore } = await import("@/store/useAivoStore.ts");

      // 1. Aluno na Trilha lendo o resumo (teoria)
      useAivoStore.getState().setActiveContext({
        pathname: "/trilhas/trilha-123",
        modulo: "trilhas",
        atividade: "lendo_teoria",
        titulo: "Controle de Constitucionalidade",
        disciplina: "Direito Constitucional",
        metadados: { secaoAtiva: "resumo" },
      });

      const { res: rTeoria, calls: cTeoria } = await callAivuChat({
        body: {
          message: "Como funciona a ADI genérica?",
          history: [],
          context: useAivoStore.getState().activeContext,
        },
      });
      assert.equal(rTeoria.status, 200);
      assert.equal(cTeoria.groq.length, 1);
      const sysTeoria = cTeoria.groq[0].messages.find((m) => m.role === "system")?.content || "";
      assert.ok(sysTeoria.includes("Atividade em Andamento: lendo_teoria"));
      assert.ok(sysTeoria.includes("Módulo Atual: TRILHAS"));
      assert.ok(sysTeoria.includes("Controle de Constitucionalidade"));
      assert.ok(sysTeoria.includes("ATUE COMO JURISTA EXAMINADOR"));
      assert.equal(sysTeoria.includes("DIRETRIZ PARA QUESTÕES DE CONCURSO"), false);

      // 2. Aluno clica no gaveteiro de flashcards
      useAivoStore.getState().setActiveContext({
        pathname: "/trilhas/trilha-123",
        modulo: "trilhas",
        atividade: "revisando_flashcard",
        titulo: "Controle de Constitucionalidade",
        disciplina: "Direito Constitucional",
        metadados: { secaoAtiva: "flashcards" },
      });

      const { res: rFlash, calls: cFlash } = await callAivuChat({
        body: {
          message: "Qual o mnemônico para os legitimados da ADI?",
          history: [],
          context: useAivoStore.getState().activeContext,
        },
      });
      assert.equal(rFlash.status, 200);
      assert.equal(cFlash.groq.length, 1);
      const sysFlash = cFlash.groq[0].messages.find((m) => m.role === "system")?.content || "";
      assert.ok(sysFlash.includes("Atividade em Andamento: revisando_flashcard"));
      assert.equal(sysFlash.includes("lendo_teoria"), false, "Contexto anterior não deve persistir");

      // 3. Aluno clica no gaveteiro de questões
      useAivoStore.getState().setActiveContext({
        pathname: "/trilhas/trilha-123",
        modulo: "trilhas",
        atividade: "resolvendo_questao",
        titulo: "Controle de Constitucionalidade",
        disciplina: "Direito Constitucional",
        metadados: { secaoAtiva: "questoes" },
      });

      const { res: rQuest, calls: cQuest } = await callAivuChat({
        body: {
          message: "Qual a pegadinha clássica da banca sobre legitimados?",
          history: [],
          context: useAivoStore.getState().activeContext,
        },
      });
      assert.equal(rQuest.status, 200);
      assert.equal(cQuest.groq.length, 1);
      const sysQuest = cQuest.groq[0].messages.find((m) => m.role === "system")?.content || "";
      assert.ok(sysQuest.includes("Atividade em Andamento: resolvendo_questao"));
      assert.ok(sysQuest.includes("DIRETRIZ PARA QUESTÕES DE CONCURSO"));
      assert.equal(sysQuest.includes("revisando_flashcard"), false);

      // 4. Cleanup ao sair da Trilha
      useAivoStore.getState().setActiveContext(null);
      assert.equal(useAivoStore.getState().activeContext, null);
    },
  },
  {
    id: "REG-AIVU-015",
    title: "Widget AIVU no navegador: compatibilidade visual de estilos no DOM para sender 'aivu', 'aivo' e 'user'",
    needs: "browser",
    async run({ base, newPage }) {
      const page = await newPage();
      try {
        // Pré-carrega o sessionStorage com mensagens das variantes de sender (legado aivo, moderno aivu e user)
        await page.evaluateOnNewDocument(() => {
          sessionStorage.setItem(
            "aivo-storage",
            JSON.stringify({
              state: {
                isOpen: false,
                messages: [
                  { id: "msg-legacy-aivo", sender: "aivo", text: "Mensagem histórica AIVO", timestamp: 1000 },
                  { id: "msg-new-aivu", sender: "aivu", text: "Mensagem moderna AIVU", timestamp: 2000 },
                  { id: "msg-user-1", sender: "user", text: "Mensagem do estudante", timestamp: 3000 },
                ],
              },
              version: 0,
            })
          );
        });

        await page.goto(`${base}/material`, { waitUntil: "domcontentloaded", timeout: 120_000 });

        // Clica no mascote para abrir a janela do chat
        const mascotSelector = "[class*='mascotWrap']";
        await page.waitForSelector(mascotSelector, { timeout: 20_000 });
        await waitHydrated(page, mascotSelector);
        await page.click(mascotSelector);

        // Aguarda o input e o corpo de mensagens do chat estarem visíveis
        const inputSelector = "input[placeholder*='AIVU']";
        await page.waitForSelector(inputSelector, { timeout: 15_000 });
        await waitHydrated(page, inputSelector);

        // Aguarda que as mensagens estejam presentes no DOM
        await page.waitForFunction(
          () => document.querySelectorAll("[class*='message']").length >= 3,
          { timeout: 15_000 }
        );

        // Valida classes e estilos computados no DOM real do navegador
        const messageStyles = await page.evaluate(() => {
          const nodes = Array.from(document.querySelectorAll("[class*='message']"));
          return nodes.map((el) => {
            const cs = window.getComputedStyle(el);
            return {
              text: el.innerText.trim(),
              className: el.className,
              alignSelf: cs.alignSelf,
              borderBottomLeftRadius: cs.borderBottomLeftRadius,
              borderBottomRightRadius: cs.borderBottomRightRadius,
              backgroundColor: cs.backgroundColor,
              color: cs.color,
            };
          });
        });

        const legacyAivo = messageStyles.find((m) => m.text.includes("Mensagem histórica AIVO"));
        assert.ok(legacyAivo, "Mensagem com sender 'aivo' deve estar presente no DOM");
        assert.equal(legacyAivo.alignSelf, "flex-start", "Mensagem 'aivo' deve alinhar à esquerda");
        assert.equal(legacyAivo.borderBottomLeftRadius, "4px", "Mensagem 'aivo' deve ter borda inferior esquerda arredondada do assistente");

        const modernAivu = messageStyles.find((m) => m.text.includes("Mensagem moderna AIVU"));
        assert.ok(modernAivu, "Mensagem com sender 'aivu' deve estar presente no DOM");
        assert.equal(modernAivu.alignSelf, "flex-start", "Mensagem 'aivu' deve alinhar à esquerda");
        assert.equal(modernAivu.borderBottomLeftRadius, "4px", "Mensagem 'aivu' deve ter borda inferior esquerda arredondada do assistente");
        assert.equal(
          modernAivu.backgroundColor,
          legacyAivo.backgroundColor,
          "Mensagem 'aivu' deve ter a mesma cor de fundo visual que a mensagem 'aivo'"
        );
        assert.equal(
          modernAivu.color,
          legacyAivo.color,
          "Mensagem 'aivu' deve ter a mesma cor de texto que a mensagem 'aivo'"
        );

        const userMsg = messageStyles.find((m) => m.text.includes("Mensagem do estudante"));
        assert.ok(userMsg, "Mensagem com sender 'user' deve estar presente no DOM");
        assert.equal(userMsg.alignSelf, "flex-end", "Mensagem 'user' deve alinhar à direita");
        assert.equal(userMsg.borderBottomRightRadius, "4px", "Mensagem 'user' deve ter borda inferior direita arredondada do usuário");
        assert.notEqual(
          userMsg.backgroundColor,
          modernAivu.backgroundColor,
          "Mensagem do usuário deve ter cor de fundo distinta do assistente"
        );
      } finally {
        await page.close();
      }
    },
  },
  {
    id: "REG-AIVU-016",
    title: "Navegação e Drawer global (/material e /redacao): abertura, fechamento por overlay/Escape, indicação de rota ativa e harmonia com o widget AIVU",
    needs: "browser",
    async run({ base, newPage }) {
      const page = await newPage();
      try {
        // 1. Rota /material: abertura do drawer, indicação de rota ativa e fechamento por Escape
        await page.goto(`${base}/material`, { waitUntil: "domcontentloaded", timeout: 120_000 });

        const drawerToggleSelector = "button[aria-label*='painel']";
        await page.waitForSelector(drawerToggleSelector, { timeout: 20_000 });
        await waitHydrated(page, drawerToggleSelector);

        // Abre o drawer pelo botão do Header
        await page.click(drawerToggleSelector);

        // Aguarda drawer e overlay abertos no DOM
        const drawerSelector = "aside[class*='sideDrawer'][class*='open']";
        await page.waitForSelector(drawerSelector, { timeout: 10_000 });

        const overlaySelector = "div[class*='drawerOverlay'][class*='open']";
        await page.waitForSelector(overlaySelector, { timeout: 10_000 });

        // Muda para a aba "atalhos" via DOM
        await page.waitForFunction(
          () => document.querySelectorAll("button[class*='drawerTab']").length >= 3,
          { timeout: 10_000 }
        );
        await page.evaluate(() => {
          const tabs = Array.from(document.querySelectorAll("button[class*='drawerTab']"));
          const tab = tabs.find((t) => t.textContent.includes("Atalhos"));
          tab?.click();
        });

        // Aguarda os links do painel de atalhos
        await page.waitForSelector("div[class*='drawerPanel'][class*='active'] a[href='/material']", { timeout: 10_000 });

        // Valida que o link para /material possui indicação de rota ativa
        const materialActiveLink = await page.$("a[href='/material'][aria-current='page']");
        assert.ok(materialActiveLink, "Link para /material no drawer deve possuir aria-current='page'");

        // Fecha o drawer pressionando a tecla Escape
        await page.keyboard.press("Escape");
        await page.waitForFunction(
          () => !document.querySelector("aside[class*='sideDrawer']").classList.contains("open"),
          { timeout: 10_000 }
        );

        // 2. Rota /redacao: abertura do drawer, indicação de rota ativa e fechamento por clique no overlay
        await page.goto(`${base}/redacao`, { waitUntil: "domcontentloaded", timeout: 120_000 });

        await page.waitForSelector(drawerToggleSelector, { timeout: 20_000 });
        await waitHydrated(page, drawerToggleSelector);

        // Abre o drawer pelo botão do Header
        await page.click(drawerToggleSelector);
        await page.waitForSelector(drawerSelector, { timeout: 10_000 });

        // Muda para a aba "atalhos"
        await page.waitForFunction(
          () => document.querySelectorAll("button[class*='drawerTab']").length >= 3,
          { timeout: 10_000 }
        );
        await page.evaluate(() => {
          const tabs = Array.from(document.querySelectorAll("button[class*='drawerTab']"));
          const tab = tabs.find((t) => t.textContent.includes("Atalhos"));
          tab?.click();
        });
        await page.waitForSelector("div[class*='drawerPanel'][class*='active'] a[href='/redacao']", { timeout: 10_000 });

        // Valida que o link para /redacao possui indicação de rota ativa
        const redacaoActiveLink = await page.$("a[href='/redacao'][aria-current='page']");
        assert.ok(redacaoActiveLink, "Link para /redacao no drawer deve possuir aria-current='page'");

        // Fecha o drawer clicando no overlay
        await page.evaluate(() => {
          const overlay = document.querySelector("div[class*='drawerOverlay']");
          overlay?.click();
        });
        await page.waitForFunction(
          () => !document.querySelector("aside[class*='sideDrawer']").classList.contains("open"),
          { timeout: 10_000 }
        );

        // 3. Valida harmonia e posicionamento do mascote AIVU após fechamento do drawer
        const mascotSelector = "[class*='mascotWrap']";
        await page.waitForSelector(mascotSelector, { timeout: 15_000 });

        const widgetStyles = await page.evaluate(() => {
          const widget = document.querySelector("[class*='widgetContainer']");
          if (!widget) return null;
          const cs = window.getComputedStyle(widget);
          return {
            bottom: cs.bottom,
            right: cs.right,
            zIndex: cs.zIndex,
            hasInDrawer: widget.className.includes("inDrawer"),
          };
        });

        assert.ok(widgetStyles, "Widget AIVU deve estar presente no DOM");
        assert.equal(widgetStyles.hasInDrawer, false, "Widget AIVU não deve possuir classe inDrawer com o drawer fechado");
        assert.equal(widgetStyles.bottom, "24px", "Widget AIVU deve permanecer ancorado em bottom: 24px");
        assert.equal(widgetStyles.right, "24px", "Widget AIVU deve permanecer ancorado em right: 24px");
      } finally {
        await page.close();
      }
    },
  },
  {
    id: "REG-AIVU-017",
    title: "Chat mobile AIVU (360px e 390px): limites horizontais, densidade de mensagens e visibilidade sob viewport reduzido",
    needs: "browser",
    async run({ base, newPage }) {
      const page = await newPage();
      try {
        // Pré-carrega conversa demonstrativa no sessionStorage
        await page.evaluateOnNewDocument(() => {
          sessionStorage.setItem(
            "aivo-storage",
            JSON.stringify({
              state: {
                isOpen: false,
                messages: [
                  { id: "msg-user-1", sender: "user", text: "Qual a diferença entre dolo eventual e culpa consciente no Direito Penal?", timestamp: 1000 },
                  { id: "msg-aivu-1", sender: "aivu", text: "No dolo eventual, o agente assume o risco de produzir o resultado lesivo ('se acontecer, tudo bem'). Na culpa consciente, o agente prevê o resultado, mas acredita sinceramente que ele não ocorrerá com base em sua habilidade.", timestamp: 2000 },
                ],
              },
              version: 0,
            })
          );
        });

        // 1. Validação em viewport compacto 360x740 (Android baseline)
        await page.setViewport({ width: 360, height: 740 });
        await page.goto(`${base}/material`, { waitUntil: "domcontentloaded", timeout: 120_000 });

        const mascotSelector = "[class*='mascotWrap']";
        await page.waitForSelector(mascotSelector, { timeout: 20_000 });
        await waitHydrated(page, mascotSelector);

        // Abre o chat pelo mascote
        await page.click(mascotSelector);

        const chatPanelSelector = "[class*='chatPanel']";
        await page.waitForSelector(chatPanelSelector, { timeout: 10_000 });
        await new Promise((r) => setTimeout(r, 400));

        // Valida limites horizontais e ausência de overflow na viewport de 360px
        const metrics360 = await page.evaluate(() => {
          const panel = document.querySelector("[class*='chatPanel']");
          const header = document.querySelector("[class*='chatHeader']");
          const inputWrap = document.querySelector("[class*='chatInputWrap']");
          const closeBtn = document.querySelector("[class*='chatHeader'] button[aria-label*='Fechar']");
          const sendBtn = document.querySelector("button[aria-label*='Enviar']");
          const aivuMsg = Array.from(document.querySelectorAll("[class*='message']")).find(el => el.textContent.includes("dolo eventual"));

          const panelRect = panel.getBoundingClientRect();
          const headerRect = header.getBoundingClientRect();
          const inputWrapRect = inputWrap.getBoundingClientRect();
          const aivuMsgRect = aivuMsg ? aivuMsg.getBoundingClientRect() : null;

          return {
            hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            panelLeft: panelRect.left,
            panelRight: panelRect.right,
            panelWidth: panelRect.width,
            headerTop: headerRect.top,
            headerBottom: headerRect.bottom,
            inputWrapTop: inputWrapRect.top,
            inputWrapBottom: inputWrapRect.bottom,
            hasCloseBtn: Boolean(closeBtn),
            hasSendBtn: Boolean(sendBtn),
            aivuMsgWidth: aivuMsgRect ? aivuMsgRect.width : 0,
          };
        });

        assert.equal(metrics360.hasHorizontalScroll, false, "Não deve haver overflow horizontal no documento em 360px");
        assert.ok(metrics360.panelLeft >= 0, "Painel não deve vazar pela borda esquerda em 360px");
        assert.ok(metrics360.panelRight <= 360, "Painel não deve vazar pela borda direita em 360px");
        assert.ok(metrics360.headerTop >= 0, "Cabeçalho deve estar visível e dentro da tela");
        assert.ok(
          metrics360.inputWrapBottom <= 740,
          `Campo de envio deve estar visível e dentro da tela (esperado <= 740px, obtido: ${metrics360.inputWrapBottom}px)`
        );
        assert.ok(metrics360.aivuMsgWidth >= 250, `Largura da mensagem deve ter boa densidade (>= 250px), obtido: ${metrics360.aivuMsgWidth}px`);
        assert.ok(metrics360.hasCloseBtn, "Botão de fechar deve estar presente");
        assert.ok(metrics360.hasSendBtn, "Botão de envio deve estar presente");

        // 2. Simulação de viewport reduzido por teclado virtual (360x440)
        await page.setViewport({ width: 360, height: 440 });
        await new Promise((r) => setTimeout(r, 400));

        const metricsReduced = await page.evaluate(() => {
          const header = document.querySelector("[class*='chatHeader']");
          const inputWrap = document.querySelector("[class*='chatInputWrap']");
          const headerRect = header.getBoundingClientRect();
          const inputWrapRect = inputWrap.getBoundingClientRect();

          return {
            headerTop: headerRect.top,
            headerVisible: headerRect.top >= 0 && headerRect.bottom <= 440,
            inputVisible: inputWrapRect.bottom <= 440,
          };
        });

        assert.ok(metricsReduced.headerTop >= 0, "Cabeçalho não pode ser ejetado para fora do topo sob viewport reduzido");
        assert.ok(metricsReduced.inputVisible, "Campo de envio deve permanecer visível sob viewport reduzido");

        // 3. Cenário extremo de pouca altura (< 284px: 360x260)
        await page.setViewport({ width: 360, height: 260 });
        await new Promise((r) => setTimeout(r, 400));

        const metricsExtreme = await page.evaluate(() => {
          const panel = document.querySelector("[class*='chatPanel']");
          const header = document.querySelector("[class*='chatHeader']");
          const inputWrap = document.querySelector("[class*='chatInputWrap']");
          const panelRect = panel.getBoundingClientRect();
          const headerRect = header.getBoundingClientRect();
          const inputWrapRect = inputWrap.getBoundingClientRect();

          return {
            panelHeight: panelRect.height,
            panelTop: panelRect.top,
            panelBottom: panelRect.bottom,
            headerTop: headerRect.top,
            inputBottom: inputWrapRect.bottom,
          };
        });

        assert.ok(metricsExtreme.panelHeight <= 260, `Painel não pode ultrapassar a altura da viewport (260px), obtido: ${metricsExtreme.panelHeight}px`);
        assert.ok(metricsExtreme.headerTop >= 0, "Cabeçalho não pode ser ejetado acima do topo da tela em altura extrema");
        assert.ok(metricsExtreme.inputBottom <= 260, "Campo de envio deve permanecer contido dentro da viewport em altura extrema");

        // 4. Validação em viewport moderno 390x844 (iPhone baseline)
        await page.setViewport({ width: 390, height: 844 });
        await new Promise((r) => setTimeout(r, 400));

        const metrics390 = await page.evaluate(() => {
          const panel = document.querySelector("[class*='chatPanel']");
          const header = document.querySelector("[class*='chatHeader']");
          const inputWrap = document.querySelector("[class*='chatInputWrap']");
          const aivuMsg = Array.from(document.querySelectorAll("[class*='message']")).find(el => el.textContent.includes("dolo eventual"));

          const panelRect = panel.getBoundingClientRect();
          const headerRect = header.getBoundingClientRect();
          const inputWrapRect = inputWrap.getBoundingClientRect();
          const aivuMsgRect = aivuMsg ? aivuMsg.getBoundingClientRect() : null;

          return {
            hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            panelLeft: panelRect.left,
            panelRight: panelRect.right,
            headerTop: headerRect.top,
            inputWrapBottom: inputWrapRect.bottom,
            aivuMsgWidth: aivuMsgRect ? aivuMsgRect.width : 0,
          };
        });

        assert.equal(metrics390.hasHorizontalScroll, false, "Não deve haver overflow horizontal no documento em 390px");
        assert.ok(metrics390.panelLeft >= 0 && metrics390.panelRight <= 390, "Painel deve respeitar limites horizontais de 390px");
        assert.ok(metrics390.headerTop >= 0, "Cabeçalho deve estar visível em 390px");
        assert.ok(metrics390.inputWrapBottom <= 844, "Campo de envio deve estar visível em 390px");
        assert.ok(metrics390.aivuMsgWidth >= 270, `Largura da mensagem deve ter boa densidade (>= 270px), obtido: ${metrics390.aivuMsgWidth}px`);

        // 5. Preservação do comportamento desktop (1280x900)
        await page.setViewport({ width: 1280, height: 900 });
        await new Promise((r) => setTimeout(r, 400));

        const desktopMetrics = await page.evaluate(() => {
          const panel = document.querySelector("[class*='chatPanel']");
          if (!panel) return null;
          const cs = window.getComputedStyle(panel);
          const panelRect = panel.getBoundingClientRect();
          return {
            position: cs.position,
            width: Math.round(panelRect.width),
            hasInlineBottom: Boolean(panel.style.bottom),
            hasInlineMaxHeight: Boolean(panel.style.maxHeight),
          };
        });

        assert.ok(desktopMetrics, "Painel deve estar presente no desktop");
        assert.equal(desktopMetrics.position, "absolute", "No desktop o painel deve usar position: absolute");
        assert.equal(desktopMetrics.width, 340, "No desktop o painel deve ter largura exata de 340px");
        assert.equal(desktopMetrics.hasInlineBottom, false, "No desktop não deve haver estilo inline de bottom");
        assert.equal(desktopMetrics.hasInlineMaxHeight, false, "No desktop não deve haver estilo inline de maxHeight");

        // Fecha o chat pelo botão de fechar do cabeçalho
        const closeBtnSelector = "[class*='chatHeader'] button[aria-label*='Fechar']";
        await page.click(closeBtnSelector);
        await page.waitForFunction(() => !document.querySelector("[class*='chatPanel']"), { timeout: 5000 });
      } finally {
        await page.close();
      }
    },
  },
];
