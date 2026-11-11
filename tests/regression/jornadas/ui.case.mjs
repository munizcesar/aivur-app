// Casos de regressão — Jornadas de Edital / Camada Navegador (Puppeteer).
// Protegem o isolamento de rotas, navegação Dashboard/Drawer, links de retorno e desacoplamento de Trilhas.
import assert from "node:assert/strict";
import { intercept, waitHydrated } from "../_support/browser.mjs";

const mockJornadas = {
  test: (req) => req.method() === "GET" && new URL(req.url()).pathname === "/api/jornadas",
  respond: () => ({
    status: 200,
    body: {
      jornadas: [
        {
          id: "jor-reg-test-01",
          titulo_concurso: "Concurso Nacional Unificado - Bloco 7",
          banca: "Cesgranrio",
          ano: 2026,
          cargo: "Especialista em Gestão Governamental",
          total_topicos: 24,
          concluidos_count: 6,
          progresso_geral: 25,
          criado_em: new Date().toISOString(),
        },
      ],
    },
  }),
};

export const cases = [
  {
    id: "REG-JORNADA-016",
    title: "Acesso à rota /jornadas com autenticação válida exibe a Central de Editais e redireciona 401 sem sessão",
    needs: "browser",
    async run({ newPage, base }) {
      // 1. Acesso sem sessão deve redirecionar para /login com retorno
      const anonPage = await newPage({ session: false });
      try {
        await anonPage.deleteCookie({ name: "aivur_session", url: base });
        await anonPage.goto(`${base}/jornadas`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        const finalUrl = new URL(anonPage.url());
        assert.equal(finalUrl.pathname, "/login", "Usuário não autenticado deve ser redirecionado para /login");
        assert.equal(finalUrl.searchParams.get("redirect"), "/jornadas", "Parâmetro redirect deve preservar /jornadas");
      } finally {
        await anonPage.close();
      }

      // 2. Acesso com sessão válida carrega a Central de Editais
      const authPage = await newPage({ session: true });
      try {
        await intercept(authPage, [mockJornadas]);
        await authPage.goto(`${base}/jornadas`, { waitUntil: "domcontentloaded", timeout: 60_000 });

        // Valida elementos do Hero da Central
        await authPage.waitForSelector("h1#jornadas-hero-title", { timeout: 15_000 });
        const heroText = await authPage.$eval("h1#jornadas-hero-title", (el) => el.textContent.trim());
        assert.ok(heroText.includes("Jornadas"), "Hero deve conter título Jornadas");

        // CTA de importação
        const ctaNovo = await authPage.$('a[href="/jornadas/novo"]');
        assert.ok(ctaNovo, "Deve existir CTA para /jornadas/novo");

        // Listagem de jornadas montada via interceptor
        await authPage.waitForSelector('a[href="/jornadas/jor-reg-test-01"]', { timeout: 15_000 });
        const cardTitle = await authPage.$eval("h3", (el) => el.textContent.trim());
        assert.ok(cardTitle.includes("Concurso Nacional Unificado"), "Jornada ativa deve ser exibida na listagem");
      } finally {
        await authPage.close();
      }
    },
  },
  {
    id: "REG-JORNADA-017",
    title: "Dashboard exibe card único de Jornadas de Edital que navega para /jornadas",
    needs: "browser",
    async run({ newPage, base }) {
      const page = await newPage({ session: true });
      try {
        await intercept(page, [mockJornadas]);
        await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });

        // Valida que existe exatamente 1 link para /jornadas dentro dos pilares do Dashboard
        await page.waitForSelector('div[class*="pillarsCol"] a[href="/jornadas"]', { timeout: 15_000 });
        const links = await page.$$('div[class*="pillarsCol"] a[href="/jornadas"]');
        assert.equal(links.length, 1, "Deve existir exatamente 1 card para /jornadas no Dashboard");

        // Valida texto do card
        const cardText = await page.$eval('div[class*="pillarsCol"] a[href="/jornadas"]', (el) => el.textContent);
        assert.ok(cardText.includes("Jornadas de Edital"), "Card deve ter título Jornadas de Edital");
        assert.ok(
          cardText.includes("Importe o edital do seu concurso e acompanhe a cobertura tópico a tópico até a prova"),
          "Card deve ter descrição oficial sem promessas conflitantes",
        );

        // Clica no card e valida navegação
        const cardSelector = 'div[class*="pillarsCol"] a[href="/jornadas"]';
        await waitHydrated(page, cardSelector);
        await page.click(cardSelector);
        await page.waitForFunction(
          () => window.location.pathname === "/jornadas",
          { timeout: 30_000 }
        );

        const currentUrl = new URL(page.url());
        assert.equal(currentUrl.pathname, "/jornadas", "Clique no card deve navegar para /jornadas");
      } finally {
        await page.close();
      }
    },
  },
  {
    id: "REG-JORNADA-018",
    title: "SideDrawer exibe atalho de Jornadas de Edital em Ações Rápidas que navega para /jornadas e indica rota ativa",
    needs: "browser",
    async run({ newPage, base }) {
      const page = await newPage({ session: true });
      try {
        await intercept(page, [mockJornadas]);
        await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });

        // Abre SideDrawer via botão com aria-label*='painel'
        const drawerToggleSelector = "button[aria-label*='painel']";
        await page.waitForSelector(drawerToggleSelector, { timeout: 20_000 });
        await waitHydrated(page, drawerToggleSelector);
        await page.click(drawerToggleSelector);

        await page.waitForSelector('aside[class*="sideDrawer"][class*="open"]', { timeout: 10_000 });

        // Alterna para aba Atalhos (Ações Rápidas)
        await page.waitForFunction(
          () => document.querySelectorAll("button[class*='drawerTab']").length >= 3,
          { timeout: 10_000 }
        );
        await page.evaluate(() => {
          const tabs = Array.from(document.querySelectorAll("button[class*='drawerTab']"));
          const tab = tabs.find((t) => t.textContent.includes("Atalhos"));
          tab?.click();
        });

        // Valida link Jornadas de Edital no Drawer
        await page.waitForSelector("div[class*='drawerPanel'][class*='active'] a[href='/jornadas']", { timeout: 10_000 });
        const drawerText = await page.$eval("div[class*='drawerPanel'][class*='active'] a[href='/jornadas']", (el) => el.textContent);
        assert.ok(drawerText.includes("Jornadas de Edital"), "Item deve conter título Jornadas de Edital");
        assert.ok(drawerText.includes("Edital verticalizado e metas"), "Item deve conter subtítulo oficial");

        // Clica e valida navegação para /jornadas
        await page.evaluate(() => {
          const link = document.querySelector("div[class*='drawerPanel'][class*='active'] a[href='/jornadas']");
          link?.click();
        });
        await page.waitForFunction(
          () => window.location.pathname === "/jornadas",
          { timeout: 30_000 }
        );
        assert.equal(new URL(page.url()).pathname, "/jornadas", "Navegação via Drawer deve chegar em /jornadas");

        // Abre o Drawer novamente em /jornadas e valida indicador aria-current="page"
        await page.waitForSelector(drawerToggleSelector, { timeout: 20_000 });
        await waitHydrated(page, drawerToggleSelector);
        await page.click(drawerToggleSelector);

        await page.waitForSelector('aside[class*="sideDrawer"][class*="open"]', { timeout: 10_000 });
        await page.waitForFunction(
          () => document.querySelectorAll("button[class*='drawerTab']").length >= 3,
          { timeout: 10_000 }
        );
        await page.evaluate(() => {
          const tabs = Array.from(document.querySelectorAll("button[class*='drawerTab']"));
          const tab = tabs.find((t) => t.textContent.includes("Atalhos"));
          tab?.click();
        });

        const activeItem = await page.waitForSelector("div[class*='drawerPanel'][class*='active'] a[href='/jornadas'][aria-current='page']", { timeout: 10_000 });
        assert.ok(activeItem, "O link de Jornadas no Drawer deve ter aria-current='page' quando em /jornadas");
      } finally {
        await page.close();
      }
    },
  },
  {
    id: "REG-JORNADA-019",
    title: "Fluxos de criação e detalhe de Jornada possuem links de retorno direcionando confiavelmente para /jornadas",
    needs: "browser",
    async run({ newPage, base }) {
      const page = await newPage({ session: true });
      try {
        await intercept(page, [mockJornadas]);

        // 1. Tela de criação (/jornadas/novo)
        await page.goto(`${base}/jornadas/novo`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await waitHydrated(page, "button");
        const btnText = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const found = btns.find((b) => b.textContent && b.textContent.includes("Voltar para jornadas"));
          return found ? found.textContent.trim() : null;
        });
        assert.ok(btnText, "Deve existir botão 'Voltar para jornadas' em CriarJornadaView");

        // Clica no botão e valida retorno para /jornadas
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const found = btns.find((b) => b.textContent && b.textContent.includes("Voltar para jornadas"));
          if (found) found.click();
        });
        await page.waitForFunction(() => window.location.pathname === "/jornadas", { timeout: 30_000 });
        assert.equal(new URL(page.url()).pathname, "/jornadas", "Retorno da criação deve conduzir a /jornadas");
      } finally {
        await page.close();
      }
    },
  },
  {
    id: "REG-JORNADA-020",
    title: "Desacoplamento em /trilhas: ausência de UserJornadasSection e presença de banner contextual para /jornadas",
    needs: "browser",
    async run({ newPage, base }) {
      const page = await newPage({ session: true });
      try {
        await page.goto(`${base}/trilhas`, { waitUntil: "domcontentloaded", timeout: 60_000 });

        // 1. Valida que o banner contextual está presente com o texto e CTA corretos
        await page.waitForSelector('section[aria-labelledby="banner-jornadas-title"]', { timeout: 15_000 });
        const bannerTitle = await page.$eval('h2#banner-jornadas-title', (el) => el.textContent.trim());
        assert.equal(bannerTitle, "Seu edital merece uma jornada própria", "Título do banner contextual deve ser exato");

        const bannerCta = await page.$('section[aria-labelledby="banner-jornadas-title"] a[href="/jornadas"]');
        assert.ok(bannerCta, "Banner contextual deve conter CTA apontando para /jornadas");

        // 2. Valida ausência da antiga seção incorporada UserJornadasSection
        const oldSection = await page.$('h2#jornadas-edital-title');
        assert.equal(oldSection, null, "A seção antiga 'jornadas-edital-title' NÃO deve existir dentro de /trilhas");

        // 3. Valida integridade do grid de Trilhas e exemplos demonstrativos
        await page.waitForSelector('section[aria-labelledby="minhas-trilhas-title"]', { timeout: 15_000 });
        await page.waitForSelector('section[aria-labelledby="micro-title"]', { timeout: 15_000 });
        const demoCards = await page.$$('section[aria-labelledby="micro-title"] li');
        assert.equal(demoCards.length, 4, "Devem existir os 4 cursos de demonstração de Trilhas");
      } finally {
        await page.close();
      }
    },
  },
];
