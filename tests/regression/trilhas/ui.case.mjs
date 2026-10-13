// Casos de regressão — Trilhas / navegador (Puppeteer). IA e banco são interceptados no navegador:
// nenhuma chamada real à Groq ou ao D1. Protegem comportamento visível ao usuário.
import assert from "node:assert/strict";
import {
  intercept, isGenerate, openCreation, fillCreation, submitCreation, bodyIncludes, waitHydrated,
} from "../_support/browser.mjs";
import { assertTrilhaContract } from "../_support/harness.mjs";

const clickByText = (page, selector, text) =>
  page.evaluate(
    (sel, t) => {
      const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(t));
      if (!el) throw new Error(`Elemento ${sel} com texto "${t}" não encontrado`);
      el.click();
    },
    selector,
    text,
  );

const trilha = (id, titulo) => ({
  id, titulo, disciplina: "Teste", progresso: 0,
  video: { titulo: "Aula", resumo: "Resumo" },
  flashcards: [0, 1, 2].map((i) => ({ id: `${id}-fc-${i}`, frente: `F${i}`, verso: `V${i}` })),
  questoes: [0, 1, 2].map((i) => ({
    id: `${id}-q-${i}`, enunciado: `Q${i}`, opcoes: ["A", "B", "C", "D"], corretaIdx: 0, justificativa: "J",
  })),
});

const unauthorized = { test: isGenerate, respond: () => ({ status: 401, body: { error: "Sessão ausente ou inválida" } }) };

export const cases = [
  {
    id: "REG-TRILHAS-005",
    title: "401 orienta o usuário a fazer login e preserva título e conteúdo do rascunho",
    needs: "browser",
    async run({ newPage }) {
      const page = await newPage();
      try {
        await intercept(page, [unauthorized]);
        await openCreation(page);
        await fillCreation(page, { title: "Concurso REG 005", text: "Conteudo do edital REG 005" });
        await submitCreation(page);
        await bodyIncludes(page, "Fazer Login");
        const visible = await page.evaluate(() => document.body.innerText);
        assert.match(visible, /sess[aã]o/i, "mensagem deve explicar a sessão");
        assert.match(visible, /login/i, "mensagem deve orientar o login");
        // Voltar à criação (mesma aba): o rascunho precisa estar de volta.
        await openCreation(page);
        await page.waitForFunction(
          () => document.querySelector("input[type='text']").value === "Concurso REG 005"
            && document.querySelector("textarea").value === "Conteudo do edital REG 005",
        );
      } finally {
        await page.close();
      }
    },
  },
  {
    id: "REG-TRILHAS-006",
    title: "Login após 401 leva a /login?redirect=/trilhas/novo sem loop e permite retornar à criação",
    needs: "browser",
    manual: [
      "O login real (magic link, /login e /auth/callback) hoje IGNORA ?redirect= — o retorno automático pós-login a /trilhas/novo NÃO está implementado nem protegido (lacuna conhecida). Este caso protege o destino do CTA e o retorno manual com rascunho restaurado.",
    ],
    async run({ newPage, base }) {
      const page = await newPage();
      try {
        await intercept(page, [unauthorized]);
        await openCreation(page);
        await fillCreation(page, { title: "Concurso REG 006", text: "Conteudo do edital REG 006" });
        await submitCreation(page);
        await bodyIncludes(page, "Fazer Login");
        await clickByText(page, "button", "Fazer Login");
        await page.waitForFunction(() => location.pathname === "/login", { timeout: 90_000 });
        const url = new URL(page.url());
        assert.equal(url.searchParams.get("redirect"), "/trilhas/novo");
        // Sem loop: a navegação automática agendada não pode afastar o usuário do login.
        await new Promise((r) => setTimeout(r, 3500));
        assert.equal(new URL(page.url()).pathname, "/login");
        // Retorno ao destino solicitado com sessão restabelecida: formulário disponível e rascunho de volta.
        await page.goto(`${base}${url.searchParams.get("redirect")}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
        await waitHydrated(page, "input[type='text']");
        assert.equal(new URL(page.url()).pathname, "/trilhas/novo");
        await page.waitForFunction(() => document.querySelector("input[type='text']").value === "Concurso REG 006");
      } finally {
        await page.close();
      }
    },
  },
  {
    id: "REG-TRILHAS-013",
    title: "Após geração válida, salvar envia a trilha completa ao servidor e abre a trilha salva",
    needs: "browser",
    manual: [
      "A persistência real no D1 (POST /api/trilhas) não é exercitada aqui (sem banco em teste). Este caso protege o contrato do frontend; validar a persistência manualmente em ambiente com D1.",
    ],
    async run({ newPage }) {
      const gerada = trilha("t-gerada-reg013", "Concurso REG 013");
      const page = await newPage();
      try {
        const seen = await intercept(page, [
          { test: isGenerate, respond: () => ({ status: 200, body: gerada }) },
          {
            test: (r) => r.method() === "POST" && new URL(r.url()).pathname === "/api/trilhas",
            respond: () => ({ status: 201, body: { trilha: { ...gerada, id: "reg-saved-013" } } }),
          },
        ]);
        await openCreation(page);
        await fillCreation(page, { title: "Concurso REG 013", text: "Conteudo do edital REG 013" });
        await submitCreation(page);
        await bodyIncludes(page, "Salvar e Iniciar Trilha");
        const opened = page.waitForRequest((r) => new URL(r.url()).pathname.startsWith("/trilhas/reg-saved-013"), { timeout: 90_000 });
        await clickByText(page, "button", "Salvar e Iniciar Trilha");
        await opened;
        const save = seen.find((s) => s.method === "POST" && new URL(s.url).pathname === "/api/trilhas");
        assert.ok(save, "o salvamento deve chamar POST /api/trilhas");
        const payload = JSON.parse(save.postData);
        assertTrilhaContract(assert, payload, "Concurso REG 013");
        assert.equal(payload.questoes.length, gerada.questoes.length);
        assert.equal(payload.flashcards.length, gerada.flashcards.length);
      } finally {
        await page.close();
      }
    },
  },
  {
    id: "REG-TRILHAS-014",
    title: "CTA do card mantém o destino /trilhas/{id} e o rótulo Iniciar/Continuar conforme o progresso",
    needs: "browser",
    async run({ newPage, base }) {
      const page = await newPage();
      try {
        await intercept(page, [
          {
            test: (r) => r.method() === "GET" && new URL(r.url()).pathname === "/api/trilhas",
            respond: () => ({ status: 200, body: { trilhas: [trilha("reg-014-a", "Trilha A nova"), trilha("reg-014-b", "Trilha B em andamento")] } }),
          },
        ]);
        // Estado local persistido: B tem vídeo selecionado (= iniciada); A não.
        await page.evaluateOnNewDocument(() => {
          localStorage.setItem("aivur-study-store", JSON.stringify({
            state: { selectedVideoByTrilha: { "reg-014-b": "video-1" } },
            version: 0,
          }));
        });
        await page.goto(`${base}/trilhas`, { waitUntil: "domcontentloaded", timeout: 120_000 });
        await page.waitForSelector('a[href="/trilhas/reg-014-a"]');
        await page.waitForSelector('a[href="/trilhas/reg-014-b"]');
        const label = (id) => page.$eval(`a[href="/trilhas/${id}"]`, (a) => a.textContent.trim());
        assert.match(await label("reg-014-a"), /Iniciar trilha/);
        assert.match(await label("reg-014-b"), /Continuar trilha/);
      } finally {
        await page.close();
      }
    },
  },
];
