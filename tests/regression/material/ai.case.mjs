// Casos de regressão — Meu Material / Rota de Síntese de IA (Fase 2, Passo 2.2)
import assert from "node:assert/strict";
import {
  installFetch,
  ok,
  fail,
} from "../_support/harness.mjs";
import { MaterialGeneratedContentSchema } from "@/lib/validations/material-ai.ts";
import {
  InMemoryRateLimiter,
  materialRateLimiter,
  resolveClientRateLimitKey,
} from "@/lib/material-rate-limit.ts";
import { signSession, verifySessionCookie } from "@/lib/session.ts";
import { intercept, waitHydrated } from "../_support/browser.mjs";

let routeModule;
async function loadMaterialGenerateRoute() {
  routeModule ||= await import("@/app/api/ai/material/gerar/route.ts");
  return routeModule;
}

let ipCounter = 2000;

function validAiPayload() {
  return {
    disciplina_sugerida: "Direito Constitucional",
    resumo: {
      tema_central: "Garantias fundamentais da pessoa humana e direitos de propriedade na CF/88.",
      pontos_chave: [
        "Inviolabilidade do direito à vida e à segurança.",
        "Propriedade condicionada à sua função social.",
      ],
      conteudo_markdown: "## Resumo Estruturado\n\nO artigo 5º da CF/88 estabelece direitos fundamentais...",
    },
    flashcards: [
      {
        frente: "Qual é a exigência para o direito de propriedade?",
        verso: "Atender a sua função social (Art. 5º, XXIII).",
      },
      {
        frente: "O que diz o princípio da legalidade?",
        verso: "Ninguém será obrigado a fazer ou deixar de fazer algo senão em virtude de lei.",
      },
    ],
    questoes: [
      {
        enunciado: "Segundo a CF/88, o direito de propriedade atenderá:",
        opcoes: [
          "À sua função social.",
          "Apenas aos interesses do proprietário.",
          "A critério exclusivo do município.",
          "À finalidade comercial obrigatória.",
        ],
        corretaIdx: 0,
        justificativa: "A propriedade atenderá a sua função social (Art. 5º, XXIII).",
      },
      {
        enunciado: "Ninguém será submetido a tortura nem a tratamento desumano ou degradante, segundo a CF/88:",
        opcoes: [
          "Regra absoluta que veda qualquer forma de tortura.",
          "Exceção aplicável em estado de sítio.",
          "Permitida com autorização judicial.",
          "Aplicável apenas a cidadãos natos.",
        ],
        corretaIdx: 0,
        justificativa: "A vedação à tortura é categórica no Art. 5º, III da CF.",
      },
    ],
  };
}

async function callMaterialGenerate({
  script,
  cookie = "reg-test-user",
  body = {},
  headers = {},
} = {}) {
  const { POST } = await loadMaterialGenerateRoute();
  const net = installFetch(script ?? (() => ok(validAiPayload())));

  let sessionCookieValue = cookie;
  if (cookie === "reg-test-user") {
    sessionCookieValue = await signSession("reg-test-user");
  }

  globalThis.__REG_COOKIES = sessionCookieValue === null ? {} : { aivur_session: sessionCookieValue };

  const defaultBody = {
    titulo: "Constituição Federal - Artigo 5º",
    conteudo:
      "A Constituição Federal de 1988 assegura a todos a igualdade perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade, nos termos seguintes: a propriedade atenderá a sua função social.",
    disciplina: "Direito Constitucional",
    metadados: {
      origem: "texto",
      totalCaracteresMaterial: 336,
      tipoExtracao: "integral",
    },
  };

  const payload = { ...defaultBody, ...body };

  const requestHeaders = {
    "Content-Type": "application/json",
    "cf-connecting-ip": `10.10.${Math.floor(++ipCounter / 250)}.${(ipCounter % 250) + 1}`,
    ...headers,
  };

  if (
    headers &&
    Object.prototype.hasOwnProperty.call(headers, "cf-connecting-ip") &&
    (headers["cf-connecting-ip"] === null || headers["cf-connecting-ip"] === undefined)
  ) {
    delete requestHeaders["cf-connecting-ip"];
  }

  const req = new Request("http://localhost/api/ai/material/gerar", {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(payload),
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
    id: "REG-MAT-009",
    title: "Síntese de IA (/api/ai/material/gerar): sessão ausente ou inválida retorna 401 sem consumir IA",
    needs: "api",
    async run() {
      // 1. Cookies nulos, vazios ou espaços em branco
      for (const invalidCookie of [null, "", "   "]) {
        const { res, body, calls } = await callMaterialGenerate({
          cookie: invalidCookie,
          script: () => ok(validAiPayload()),
        });

        assert.equal(res.status, 401, "cookie ausente/vazio deve retornar 401");
        assert.match(body.error, /sessão/i);
        assert.equal(calls.groq.length, 0, "não pode haver chamadas à Groq em 401");
      }

      // 2. Cookies forjados / texto puro não assinado (rejeição de tokens arbitrários)
      for (const forged of ["forged-arbitrary-token", "cesa.muniz@gmail.com", "fake.token.value"]) {
        const { res, body, calls } = await callMaterialGenerate({
          cookie: forged,
          script: () => ok(validAiPayload()),
        });

        assert.equal(res.status, 401, "cookie forjado sem assinatura válida deve retornar 401");
        assert.match(body.error, /sessão/i);
        assert.equal(calls.groq.length, 0, "não pode haver chamadas à Groq com cookie forjado");
      }

      // 3. Cookie com assinatura adulterada (payload válido, mas assinatura violada)
      const validSigned = await signSession("aluno@aivur.com");
      const [payloadB64, sigB64] = validSigned.split(".");
      const alteredSig = sigB64.slice(0, -2) + (sigB64.endsWith("a") ? "b" : "a");
      const tamperedCookie = `${payloadB64}.${alteredSig}`;

      const { res: resTampered, body: bodyTampered, calls: callsTampered } = await callMaterialGenerate({
        cookie: tamperedCookie,
        script: () => ok(validAiPayload()),
      });
      assert.equal(resTampered.status, 401, "assinatura adulterada deve retornar 401");
      assert.match(bodyTampered.error, /sessão/i);
      assert.equal(callsTampered.groq.length, 0, "não pode consumir IA com assinatura adulterada");

      // 4. Sessão expirada
      const expiredSession = await signSession("aluno@aivur.com", { maxAgeMs: -1000 });
      const { res: resExpired, body: bodyExpired, calls: callsExpired } = await callMaterialGenerate({
        cookie: expiredSession,
        script: () => ok(validAiPayload()),
      });
      assert.equal(resExpired.status, 401, "sessão expirada deve retornar 401");
      assert.match(bodyExpired.error, /sessão/i);
      assert.equal(callsExpired.groq.length, 0, "não pode consumir IA com sessão expirada");

      // 5. Sessão válida: preservação do fluxo normal (autenticação OK)
      const legitimateSession = await signSession("aluno-legitimo@aivur.com");
      const { res: resValid, calls: callsValid } = await callMaterialGenerate({
        cookie: legitimateSession,
        script: () => ok(validAiPayload()),
      });
      assert.equal(resValid.status, 200, "sessão válida deve retornar 200");
      assert.equal(callsValid.groq.length, 1, "sessão válida deve permitir chamada à IA");

      // 6. Login / Magic link verify (/api/auth/verify): emite sessão válida e verificável
      const { POST: verifyRoute } = await import("@/app/api/auth/verify/route.ts");
      const originalFetch = globalThis.fetch;
      try {
        globalThis.fetch = async (url) => {
          if (String(url).includes("/api/auth/verify")) {
            return new Response(JSON.stringify({ userId: "verified-user@aivur.com" }), { status: 200 });
          }
          return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
        };
        const verifyReq = new Request("http://localhost/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: "magic-token-xyz" }),
        });
        const verifyRes = await verifyRoute(verifyReq);
        assert.equal(verifyRes.status, 200, "verify deve retornar 200 para token válido");
        const verifyData = await verifyRes.json();
        assert.equal(verifyData.userId, "verified-user@aivur.com");
        const emittedCookie = (globalThis.__REG_COOKIES || {}).aivur_session;
        assert.ok(emittedCookie, "cookie aivur_session deve ser emitido");
        const verification = await verifySessionCookie(emittedCookie);
        assert.equal(verification.valid, true, "sessão emitida pelo verify deve ser válida");
        assert.equal(verification.userId, "verified-user@aivur.com");
      } finally {
        globalThis.fetch = originalFetch;
      }

      // 7. Dev bypass (/api/auth/dev-bypass): bloqueado em produção
      const { POST: devBypassRoute } = await import("@/app/api/auth/dev-bypass/route.ts");
      const savedNodeEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = "production";
        const prodBypassRes = await devBypassRoute();
        assert.equal(prodBypassRes.status, 403, "dev-bypass deve retornar 403 em produção");
        const prodData = await prodBypassRes.json();
        assert.match(prodData.error, /desenvolvimento/i);
      } finally {
        process.env.NODE_ENV = savedNodeEnv;
      }
    },
  },
  {
    id: "REG-MAT-010",
    title: "Síntese de IA (/api/ai/material/gerar): validação de entrada rejeita texto insuficiente (<100) e vazio com 400",
    needs: "api",
    async run() {
      // 1. Conteúdo vazio
      const emptyRes = await callMaterialGenerate({
        body: { conteudo: "" },
      });
      assert.equal(emptyRes.res.status, 400);
      assert.equal(emptyRes.calls.groq.length, 0, "não deve invocar IA com payload vazio");

      // 2. Conteúdo insuficiente (< 100 caracteres)
      const shortRes = await callMaterialGenerate({
        body: { conteudo: "Texto curto de menos de cem caracteres." },
      });
      assert.equal(shortRes.res.status, 400);
      assert.equal(shortRes.calls.groq.length, 0, "não deve invocar IA com conteúdo insuficiente");

      // 3. Conteúdo acima de 8.000 caracteres
      const longRes = await callMaterialGenerate({
        body: { conteudo: "A".repeat(8001) },
      });
      assert.equal(longRes.res.status, 400);
      assert.equal(longRes.calls.groq.length, 0, "não deve invocar IA com conteúdo acima de 8.000");
    },
  },
  {
    id: "REG-MAT-011",
    title: "Síntese de IA (/api/ai/material/gerar): geração com material válido conclui com sucesso e contrato estrutural íntegro (1 chamada Groq)",
    needs: "api",
    async run() {
      const { res, body, calls } = await callMaterialGenerate({
        script: () => ok(validAiPayload()),
      });

      assert.equal(res.status, 200, "geração deve responder com HTTP 200");
      assert.equal(calls.groq.length, 1, "deve realizar exatamente 1 chamada Groq em sucesso");

      // Validação estrita contra o schema canônico
      const validation = MaterialGeneratedContentSchema.safeParse(body);
      assert.equal(validation.success, true, "deve respeitar MaterialGeneratedContentSchema");

      // Validações pontuais de segurança arquitetural
      assert.equal(body.titulo, "Constituição Federal - Artigo 5º");
      assert.equal(body.escopoProcessado.cobertura, "recorte", "cobertura deve ser conservadora (recorte), sem confiar em metadados do cliente");
      assert.ok(body.flashcards.length >= 2);
      assert.ok(body.flashcards[0].id.includes("fc-1"), "ID de flashcard deve ser gerado pelo servidor");
      assert.ok(body.questoes.length >= 2);
      assert.ok(body.questoes[0].id.includes("q-1"), "ID de questão deve ser gerado pelo servidor");
      assert.equal(body.questoes[0].opcoes.length, 4);
    },
  },
  {
    id: "REG-MAT-012",
    title: "Síntese de IA (/api/ai/material/gerar): JSON malformado ou fora do contrato aciona Fixer e recupera estrutura",
    needs: "api",
    async run() {
      // Primeira resposta tem questão com apenas 2 alternativas (inválida)
      const invalidAiPayload = validAiPayload();
      invalidAiPayload.questoes[0].opcoes = ["Opção 1", "Opção 2"];

      const { res, body, calls } = await callMaterialGenerate({
        script: (callIndex) => {
          if (callIndex === 1) return ok(invalidAiPayload); // Falha inicial
          return ok(validAiPayload()); // Fixer corrige
        },
      });

      assert.equal(res.status, 200, "deve recuperar com sucesso após o Fixer");
      assert.equal(calls.groq.length, 2, "deve ter executado exatamente 2 chamadas (1 falha + 1 fixer)");
      assert.equal(MaterialGeneratedContentSchema.safeParse(body).success, true);
    },
  },
  {
    id: "REG-MAT-013",
    title: "Síntese de IA (/api/ai/material/gerar): falha irrecuperável do Fixer retorna 422 e erro 429 do provedor retorna 429 sem cascata",
    needs: "api",
    async run() {
      // 1. Falha do Fixer (ambas as tentativas inválidas) -> 422
      const invalidAiPayload = validAiPayload();
      invalidAiPayload.questoes[0].opcoes = ["A", "B"];

      const fixerFail = await callMaterialGenerate({
        script: () => ok(invalidAiPayload), // Ambos chamam com JSON defeituoso
      });

      assert.equal(fixerFail.res.status, 422, "deve retornar 422 após falha do Fixer");
      assert.ok(fixerFail.calls.groq.length <= 2, "não deve exceder 2 chamadas na tentativa do Fixer");

      // 2. Erro 429 da Groq -> 429 imediato sem cascata
      const rateLimitFail = await callMaterialGenerate({
        script: () => fail(429, "Rate limit reached for TPM"),
      });

      assert.equal(rateLimitFail.res.status, 429, "deve retornar 429 controlado");
      assert.equal(rateLimitFail.calls.groq.length, 1, "429 não pode disparar cascata");
      assert.equal(rateLimitFail.body.details, undefined, "não deve vazar detalhes brutos do provedor");
    },
  },
  {
    id: "REG-MAT-014",
    title: "Síntese de IA (/api/ai/material/gerar): metadados do cliente não forçam cobertura integral; 429 durante Fixer preserva status 429",
    needs: "api",
    async run() {
      // 1. Cliente envia tipoExtracao: 'integral' e total igual ao trecho -> servidor mantém 'recorte'
      const spoofAttempt = await callMaterialGenerate({
        body: {
          conteudo:
            "A Constituição Federal de 1988 assegura a todos a igualdade perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade, nos termos seguintes: a propriedade atenderá a sua função social.",
          metadados: {
            origem: "texto",
            totalCaracteresMaterial: 336,
            tipoExtracao: "integral",
          },
        },
        script: () => ok(validAiPayload()),
      });

      assert.equal(spoofAttempt.res.status, 200);
      assert.equal(
        spoofAttempt.body.escopoProcessado.cobertura,
        "recorte",
        "enviar tipoExtracao: integral e total igual ao trecho não pode transformar recorte em integral"
      );

      // 2. Erro 429 durante tentativa do Fixer -> retorna 429 (não 422) e sem cascata
      const invalidAiPayload = validAiPayload();
      invalidAiPayload.questoes[0].opcoes = ["Apenas duas alternativas", "Segunda alternativa"];

      const fixer429 = await callMaterialGenerate({
        script: (callIndex) => {
          if (callIndex === 1) return ok(invalidAiPayload); // Falha inicial aciona o Fixer
          return fail(429, "Rate limit reached during fixer"); // Fixer recebe 429
        },
      });

      assert.equal(fixer429.res.status, 429, "429 durante Fixer deve ser preservado como 429");
      assert.equal(typeof fixer429.body.error, "string");
      assert.equal(fixer429.body.details, undefined, "não deve vazar detalhes brutos do provedor");
      assert.equal(fixer429.calls.groq.length, 2, "deve interromper imediatamente após 429 no Fixer");

      // 3. Resolução de identidade para rate limit: descarta x-forwarded-for e adota fallback:unknown
      // a) cf-connecting-ip ausente por completo
      const reqAbsent = new Request("http://localhost/api/ai/material/gerar", {
        headers: { "x-forwarded-for": "198.51.100.1" },
      });
      assert.equal(
        resolveClientRateLimitKey(reqAbsent),
        "fallback:unknown",
        "cf-connecting-ip ausente deve resolver para fallback:unknown descartando x-forwarded-for"
      );

      // b) cf-connecting-ip presente mas vazio ou apenas espaços
      const reqEmpty = new Request("http://localhost/api/ai/material/gerar", {
        headers: {
          "cf-connecting-ip": "   ",
          "x-forwarded-for": "198.51.100.2",
        },
      });
      assert.equal(
        resolveClientRateLimitKey(reqEmpty),
        "fallback:unknown",
        "cf-connecting-ip vazio deve resolver para fallback:unknown descartando x-forwarded-for"
      );

      // c) cf-connecting-ip válido é preservado
      const reqValid = new Request("http://localhost/api/ai/material/gerar", {
        headers: { "cf-connecting-ip": "203.0.113.50", "x-forwarded-for": "10.0.0.1" },
      });
      assert.equal(
        resolveClientRateLimitKey(reqValid),
        "ip:203.0.113.50",
        "cf-connecting-ip válido deve ser preservado"
      );

      // 4. Cota compartilhada conservadora via HTTP quando cf-connecting-ip está ausente/vazio
      materialRateLimiter.delete("fallback:unknown");

      // Requisições 1 a 3 com cf-connecting-ip ausente (null) e IPs falsos diferentes
      for (let i = 1; i <= 3; i++) {
        const resAbsent = await callMaterialGenerate({
          cookie: await signSession(`user-absent-${i}`),
          headers: {
            "cf-connecting-ip": null,
            "x-forwarded-for": `203.0.113.${i}`,
          },
          script: () => ok(validAiPayload()),
        });
        assert.equal(resAbsent.res.status, 200, `chamada ausente ${i} deve ser aceita`);
      }

      // Requisições 4 e 5 com cf-connecting-ip presente mas vazio ("") e outros IPs falsos
      for (let i = 4; i <= 5; i++) {
        const resEmpty = await callMaterialGenerate({
          cookie: await signSession(`user-empty-${i}`),
          headers: {
            "cf-connecting-ip": "",
            "x-forwarded-for": `198.51.100.${i}`,
          },
          script: () => ok(validAiPayload()),
        });
        assert.equal(resEmpty.res.status, 200, `chamada vazia ${i} deve ser aceita`);
      }

      // Requisição 6: Mesmo com nova sessão e novo x-forwarded-for falso, a cota compartilhada esgotou
      const blockedShared = await callMaterialGenerate({
        cookie: await signSession("user-new-attempt"),
        headers: {
          "cf-connecting-ip": null,
          "x-forwarded-for": "192.0.2.99",
        },
        script: () => ok(validAiPayload()),
      });
      assert.equal(
        blockedShared.res.status,
        429,
        "6ª chamada sem IP confiável deve receber 429 na cota compartilhada fallback:unknown"
      );
      assert.equal(blockedShared.calls.groq.length, 0, "não pode consumir IA após esgotar cota compartilhada");

      // 5. Contenção do Map: evicção determinística de entradas expiradas via relógio injetável
      const testLimiter = new InMemoryRateLimiter({ limit: 5, windowMs: 1000, maxEntries: 10 });
      const testKey = "test-eviction-key";
      const baseTime = 10_000_000;
      testLimiter.setEntry(testKey, { count: 3, resetTime: baseTime + 1000 });
      assert.equal(testLimiter.has(testKey), true);

      // Antes de expirar, a entrada ativa é preservada
      testLimiter.pruneExpired(baseTime + 500);
      assert.equal(testLimiter.has(testKey), true, "cota ativa não pode ser expurgada antes do resetTime");

      // Avança relógio virtual além do resetTime e executa poda determinística
      const prunedCount = testLimiter.pruneExpired(baseTime + 1001);
      assert.equal(prunedCount, 1, "exatamente 1 entrada expirada deve ser podada");
      assert.equal(
        testLimiter.has(testKey),
        false,
        "entradas expiradas devem ser expurgadas determinísticamente do Map"
      );

      // 6. Política conservadora de saturação: recusa admissão sem apagar cotas ativas (anti-quota reset)
      const testMaxLimit = 5;
      const nowVirtual = 20_000_000;
      const satLimiter = new InMemoryRateLimiter({
        limit: 2,
        windowMs: 3_600_000,
        maxEntries: testMaxLimit,
      });

      // Preenche o limitador com 5 entradas ativas
      for (let k = 1; k <= testMaxLimit; k++) {
        const admitted = satLimiter.check(`key-${k}`, nowVirtual);
        assert.equal(admitted, true, `chave key-${k} deve ser admitida`);
      }
      assert.equal(satLimiter.size, testMaxLimit, "mapa deve estar na capacidade máxima");

      // Tenta admitir uma 6ª chave enquanto todas as 5 existentes ainda estão ativas
      const sixthKeyAdmitted = satLimiter.check("key-6", nowVirtual);
      assert.equal(
        sixthKeyAdmitted,
        false,
        "quando saturado de cotas ativas, novas chaves devem ser recusadas (HTTP 429) por contenção"
      );
      assert.equal(satLimiter.size, testMaxLimit, "tamanho não pode ultrapassar maxEntries");

      // VERIFICAÇÃO CRÍTICA DE SEGURANÇA: nenhuma cota ativa foi apagada para dar lugar à nova chave (anti-FIFO/LRU reset)
      assert.equal(satLimiter.has("key-1"), true, "primeira chave ativa NÃO pode ser apagada (FIFO reset proibido)");
      assert.equal(satLimiter.has("key-5"), true, "última chave ativa deve permanecer intacta");

      // Chaves existentes ativas continuam operando normalmente
      assert.equal(satLimiter.check("key-1", nowVirtual), true, "chave ativa existente pode consumir cota restante");
      assert.equal(satLimiter.check("key-1", nowVirtual), false, "chave ativa no teto deve ser rejeitada por cota");

      // Quando uma chave expira no tempo, pruneExpired libera espaço e permite nova admissão com segurança
      const futureTime = nowVirtual + 3_600_001; // Após a janela de 1h
      const admittedAfterExpiry = satLimiter.check("key-new", futureTime);
      assert.equal(
        admittedAfterExpiry,
        true,
        "após a expiração natural da janela, novas chaves voltam a ser admitidas"
      );
    },
  },
  {
    id: "REG-MAT-015",
    title: "Meu Material: integração frontend da síntese de IA com preservação em erro (429), renderização do estúdio (resumo, flashcards, questões) e reset",
    needs: "browser",
    async run({ base, newPage }) {
      const page = await newPage();
      try {
        let aiResponseConfig = {
          status: 429,
          body: { error: "Limite temporário de requisições excedido." },
        };

        const isMaterialGenerate = (req) =>
          req.method() === "POST" && new URL(req.url()).pathname === "/api/ai/material/gerar";

        const interceptedRequests = await intercept(page, [
          {
            test: isMaterialGenerate,
            respond: () => aiResponseConfig,
          },
        ]);

        // 1. Acessar /material
        await page.goto(`${base}/material`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await page.waitForSelector("h1");

        // 2. Alternar para aba "Colar Texto"
        await waitHydrated(page, "button[role='tab']");
        const tabs = await page.$$("button[role='tab']");
        assert.ok(tabs.length >= 2, "deve renderizar as abas de modo de importação");
        await tabs[1].click();

        await waitHydrated(page, "textarea");

        // 3. Digitar conteúdo válido (> 100 caracteres)
        const validTextContent =
          "A Constituição Federal de 1988 assegura a todos a igualdade perante a lei, sem distinção de qualquer natureza, garantindo-se a inviolabilidade do direito à vida, à liberdade e à propriedade, atendendo à sua função social.";
        await page.click("textarea");
        await page.keyboard.type(validTextContent, { delay: 2 });

        // 4. Validar e Visualizar Texto (Fase 1)
        await page.evaluate(() => {
          const btns = [...document.querySelectorAll("button")];
          const btn = btns.find((b) => b.textContent.includes("Validar e Visualizar Texto"));
          btn?.click();
        });

        // 5. Verificar painel de conferência
        await page.waitForFunction(
          () => /conferência de importação/i.test(document.body.innerText),
          { timeout: 10_000 }
        );
        const conferenceText = await page.evaluate(() => document.body.innerText);
        assert.match(conferenceText, /Fase 1 Concluída/i);
        assert.match(conferenceText, /Texto Colado/i);
        assert.equal(
          interceptedRequests.length,
          0,
          "Importação e conferência não podem disparar requisição à IA automaticamente"
        );

        // 6. Testar Falha e Preservação de Estado: Clicar em "Sintetizar com IA" com retorno 429
        await page.evaluate(() => {
          const btns = [...document.querySelectorAll("button")];
          const btn = btns.find((b) => b.textContent.includes("Sintetizar com IA"));
          btn?.click();
        });

        await page.waitForFunction(
          () => /Limite temporário de requisições excedido/i.test(document.body.innerText),
          { timeout: 10_000 }
        );
        assert.equal(interceptedRequests.length, 1, "deve ter interceptado 1 requisição à IA");

        // Confirmar que o material validado continua preservado na tela após o erro 429
        const afterErrorText = await page.evaluate(() => document.body.innerText);
        assert.match(afterErrorText, /Conferência de Importação/i);
        assert.match(afterErrorText, /Texto Colado/i);
        assert.match(afterErrorText, /221 caracteres/i);

        // 7. Testar Geração com Sucesso e Renderização do Estúdio
        const validStudioData = {
          titulo: "Constituição Federal - Artigo 5º",
          disciplina: "Direito Constitucional",
          escopoProcessado: {
            caracteresProcessados: 221,
            totalCaracteresMaterial: 221,
            cobertura: "recorte",
          },
          resumo: {
            tema_central: "Garantias fundamentais da pessoa humana e função social da propriedade na CF/88.",
            pontos_chave: [
              "Inviolabilidade do direito à vida, à liberdade e à segurança.",
              "A propriedade atenderá obrigatoriamente a sua função social.",
            ],
            conteudo_markdown: "## Resumo Estruturado\n\nO artigo 5º da CF/88 estabelece direitos fundamentais...",
          },
          flashcards: [
            {
              id: "fc-101",
              frente: "Qual é a exigência constitucional para o direito de propriedade?",
              verso: "Atender a sua função social, conforme Art. 5º, XXIII da CF/88.",
            },
            {
              id: "fc-102",
              frente: "O que assegura o princípio da legalidade?",
              verso: "Ninguém será obrigado a fazer ou deixar de fazer algo senão em virtude de lei.",
            },
          ],
          questoes: [
            {
              id: "q-101",
              enunciado: "Segundo a CF/88, o direito de propriedade atenderá:",
              opcoes: [
                "À sua função social.",
                "Apenas aos interesses do proprietário.",
                "A critério discricionário do município.",
                "À finalidade comercial obrigatória.",
              ],
              corretaIdx: 0,
              justificativa: "A propriedade atenderá a sua função social (Art. 5º, XXIII).",
              trecho_referencia: "atendendo à sua função social",
            },
            {
              id: "q-102",
              enunciado: "Ninguém será submetido a tortura nem a tratamento desumano ou degradante, segundo a CF/88:",
              opcoes: [
                "Regra absoluta que veda qualquer forma de tortura.",
                "Exceção aplicável em estado de sítio.",
                "Permitida com autorização judicial.",
                "Aplicável apenas a cidadãos natos.",
              ],
              corretaIdx: 0,
              justificativa: "A vedação à tortura é categórica no Art. 5º, III da CF.",
              trecho_referencia: "inviolabilidade do direito à vida",
            },
          ],
        };

        aiResponseConfig = {
          status: 200,
          body: validStudioData,
        };

        // Disparar geração novamente
        await page.evaluate(() => {
          const btns = [...document.querySelectorAll("button")];
          const btn = btns.find((b) => b.textContent.includes("Sintetizar com IA"));
          btn?.click();
        });

        // Aguardar o estúdio pedagógico ser renderizado
        await page.waitForFunction(
          () => /Garantias fundamentais da pessoa humana/i.test(document.body.innerText),
          { timeout: 15_000 }
        );
        assert.equal(interceptedRequests.length, 2, "deve ter realizado a 2ª chamada");

        // Validar contrato do payload enviado pelo frontend
        const lastCall = interceptedRequests[1];
        const postedPayload = JSON.parse(lastCall.postData);
        assert.equal(postedPayload.disciplina, "Geral");
        assert.equal(postedPayload.metadados.origem, "texto");
        assert.equal(postedPayload.metadados.totalCaracteresMaterial, 221);

        // 8. Validar Aba Resumo
        const studioText = await page.evaluate(() => document.body.innerText);
        assert.match(studioText, /Constituição Federal - Artigo 5º/i);
        assert.match(studioText, /Recorte Pedagógico/i);
        assert.match(studioText, /Inviolabilidade do direito à vida/i);

        // 9. Validar Aba Flashcards
        await page.evaluate(() => {
          const tabs = [...document.querySelectorAll("button[role='tab']")];
          const tab = tabs.find((t) => t.textContent.includes("Flashcards"));
          tab?.click();
        });

        await page.waitForFunction(
          () => /Qual é a exigência constitucional para o direito de propriedade/i.test(document.body.innerText),
          { timeout: 5_000 }
        );

        // Virar o flashcard (frente -> verso)
        await page.click("[role='button'][aria-label*='flashcard']");
        await page.waitForFunction(
          () => /Atender a sua função social/i.test(document.body.innerText),
          { timeout: 5_000 }
        );

        // Clicar em "✅ Dominei"
        await page.evaluate(() => {
          const btns = [...document.querySelectorAll("button")];
          const btn = btns.find((b) => b.textContent.includes("Dominei"));
          btn?.click();
        });

        // Avançar para o próximo flashcard
        await page.waitForFunction(
          () => /princípio da legalidade/i.test(document.body.innerText),
          { timeout: 5_000 }
        );

        // 10. Validar Aba Questões
        await page.evaluate(() => {
          const tabs = [...document.querySelectorAll("button[role='tab']")];
          const tab = tabs.find((t) => t.textContent.includes("Questões"));
          tab?.click();
        });

        await page.waitForFunction(
          () => /Segundo a CF\/88, o direito de propriedade atenderá/i.test(document.body.innerText),
          { timeout: 5_000 }
        );

        // Selecionar Alternativa A
        await page.evaluate(() => {
          const optBtns = [...document.querySelectorAll("button")].filter((b) =>
            b.textContent.includes("À sua função social")
          );
          optBtns[0]?.click();
        });

        // Confirmar resposta
        await page.evaluate(() => {
          const btns = [...document.querySelectorAll("button")];
          const btn = btns.find((b) => b.textContent.includes("Confirmar Resposta"));
          btn?.click();
        });

        // Verificar justificativa fundamentada e trecho de referência
        await page.waitForFunction(
          () => /Justificativa Fundamentada/i.test(document.body.innerText),
          { timeout: 5_000 }
        );
        const quizFeedbackText = await page.evaluate(() => document.body.innerText);
        assert.match(quizFeedbackText, /A propriedade atenderá a sua função social/i);
        assert.match(quizFeedbackText, /atendendo à sua função social/i);

        // 11. Testar "Importar Outro Material" (Reset completo do fluxo)
        await page.evaluate(() => {
          const btns = [...document.querySelectorAll("button")];
          const btn = btns.find((b) => b.textContent.includes("Importar Outro Material"));
          btn?.click();
        });

        await page.waitForFunction(
          () => /Upload de PDF|Cofre Editorial/i.test(document.body.innerText),
          { timeout: 10_000 }
        );
        const resetText = await page.evaluate(() => document.body.innerText);
        assert.equal(
          /Garantias fundamentais da pessoa humana/i.test(resetText),
          false,
          "conteúdo gerado anterior deve ser desmontado"
        );
      } finally {
        await page.close();
      }
    },
  },
];
