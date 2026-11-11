// Infra de testes de navegador da Regression Gate.
// Sobe um servidor `next dev` isolado em porta efêmera própria (ou conecta ao AIVUR_BASE_URL explícito),
// valida prontidão real e aquece as rotas antes de executar os casos Puppeteer.
// Todas as chamadas de IA/banco são interceptadas no navegador: NENHUMA chamada real à Groq/D1 acontece aqui.
import { spawn, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { signSession } from "@/lib/session.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const EXPLICIT_BASE = process.env.AIVUR_BASE_URL ? process.env.AIVUR_BASE_URL.replace(/\/$/, "") : null;

let activeBase = EXPLICIT_BASE || "http://127.0.0.1:3000";

const WARMUP_ROUTES = [
  { path: "/login", auth: false },
  { path: "/", auth: false },
  { path: "/material", auth: false },
  { path: "/redacao", auth: false },
  { path: "/trilhas", auth: false },
  { path: "/trilhas/novo", auth: true },
  { path: "/jornadas", auth: true },
  { path: "/jornadas/novo", auth: true },
];

const CLIENT_WARMUP_ROUTES = ["/", "/material", "/redacao", "/trilhas", "/jornadas"];

const pageDiagnostics = new WeakMap();

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (!addr || typeof addr === "string") {
        srv.close(() => reject(new Error("Não foi possível alocar porta efêmera livre.")));
        return;
      }
      const { port } = addr;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

async function checkServerIdentity(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/login`, {
      signal: AbortSignal.timeout(5000),
      redirect: "manual",
    });
    if (res.status >= 500) {
      return { ok: false, reason: `HTTP ${res.status} em /login` };
    }
    const contentType = res.headers.get("content-type") || "";
    const html = await res.text();
    const isHtml = contentType.includes("text/html") || html.includes("<html");
    const isAivur = /AIVUR|__next|next-route-announcer|aivur/i.test(html);
    if (!isHtml || !isAivur) {
      return {
        ok: false,
        reason: `Resposta em ${baseUrl}/login não corresponde ao servidor AIVUR (content-type="${contentType}", status=${res.status})`,
      };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, reason: err?.message || String(err) };
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    if (err && err.code === "ESRCH") {
      return false;
    }
    return true;
  }
}

async function terminateChildProcess(child) {
  if (!child || !child.pid) return;
  try {
    child.stdout?.destroy();
    child.stderr?.destroy();
  } catch (_) {}

  if (process.platform === "win32") {
    const res = spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    if (res.error) {
      console.error(`AVISO: Falha ao executar taskkill no processo PID ${child.pid}:`, res.error.message);
    } else if (res.status !== 0 && res.status !== 128) {
      console.error(`AVISO: taskkill retornou código ${res.status} para o processo PID ${child.pid}.`);
    }
  } else {
    try {
      child.kill("SIGTERM");
    } catch (err) {
      console.error(`AVISO: Falha ao enviar SIGTERM para o processo PID ${child.pid}:`, err?.message || err);
    }
  }

  const deadline = Date.now() + 3000;
  while (isProcessAlive(child.pid) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
  }

  if (isProcessAlive(child.pid)) {
    try {
      child.kill("SIGKILL");
    } catch (_) {}
  }
}

function createLogBuffer(maxLines = 80) {
  const lines = [];
  let partial = "";
  const push = (prefix, chunk) => {
    partial += chunk.toString("utf8");
    const parts = partial.split(/\r?\n/);
    partial = parts.pop() ?? "";
    for (const line of parts) {
      if (!line.trim()) continue;
      lines.push(`${prefix}${line}`);
      if (lines.length > maxLines) lines.shift();
    }
  };
  return {
    pushStdout: (c) => push("", c),
    pushStderr: (c) => push("[stderr] ", c),
    dump: () => (partial.trim() ? [...lines, partial.trim()] : [...lines]).join("\n"),
  };
}

async function warmupServerRoutes(baseUrl, logs) {
  const warmCookie = await signSession("reg-warmup-user");
  for (const route of WARMUP_ROUTES) {
    const headers = route.auth ? { cookie: `aivur_session=${warmCookie}` } : {};
    let res;
    try {
      res = await fetch(`${baseUrl}${route.path}`, {
        headers,
        redirect: "manual",
        signal: AbortSignal.timeout(90_000),
      });
    } catch (err) {
      throw new Error(
        `Warmup HTTP falhou na rota ${route.path} (${baseUrl}): ${err?.message || err}\n--- Logs do servidor ---\n${logs?.dump() || "(externo)"}`,
      );
    }
    // Drenar o corpo garante término da compilação SSR/RSC da rota antes da próxima
    await res.text().catch(() => {});
    if (res.status !== 200) {
      throw new Error(
        `Warmup da rota ${route.path} retornou HTTP ${res.status} (esperado 200) em ${baseUrl}.\n--- Logs do servidor ---\n${logs?.dump() || "(externo)"}`,
      );
    }
  }
}

async function warmupClientBundles(browser, baseUrl) {
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    const cookieValue = await signSession("reg-client-warmup");
    await page.setCookie({ name: "aivur_session", value: cookieValue, url: baseUrl });
    page.setDefaultTimeout(90_000);

    for (const routePath of CLIENT_WARMUP_ROUTES) {
      const pageErrors = [];
      const failedReqs = [];
      const onPageErr = (e) => pageErrors.push(e.message);
      const onReqFail = (req) => failedReqs.push(`${req.method()} ${req.url()} (${req.failure()?.errorText})`);
      page.on("pageerror", onPageErr);
      page.on("requestfailed", onReqFail);

      const res = await page.goto(`${baseUrl}${routePath}`, { waitUntil: "networkidle2", timeout: 90_000 });
      const status = res?.status() ?? 0;
      const finalPath = new URL(page.url()).pathname;

      page.off("pageerror", onPageErr);
      page.off("requestfailed", onReqFail);

      if (status >= 400 || status === 0) {
        throw new Error(`Warmup de bundle client em ${routePath} retornou HTTP ${status} (URL final: ${page.url()}).`);
      }
      if (finalPath !== routePath) {
        throw new Error(`Warmup de bundle client em ${routePath} redirecionou inesperadamente para ${page.url()}.`);
      }
      if (pageErrors.length > 0) {
        throw new Error(`Erro de execução client durante warmup de ${routePath}: ${pageErrors.join(" | ")}`);
      }
      if (failedReqs.length > 0) {
        throw new Error(`Falha de rede durante warmup de ${routePath}: ${failedReqs.join(" | ")}`);
      }
    }
  } finally {
    await context.close().catch(() => {});
  }
}

async function ensureServer() {
  if (EXPLICIT_BASE) {
    try {
      new URL(EXPLICIT_BASE);
    } catch {
      throw new Error(`AIVUR_BASE_URL inválido: "${EXPLICIT_BASE}"`);
    }
    const identity = await checkServerIdentity(EXPLICIT_BASE);
    if (!identity.ok) {
      throw new Error(`Servidor explícito AIVUR_BASE_URL (${EXPLICIT_BASE}) não está pronto ou não é o AIVUR: ${identity.reason}`);
    }
    await warmupServerRoutes(EXPLICIT_BASE, null);
    return {
      base: EXPLICIT_BASE,
      owned: false,
      getLogs: () => "(servidor externo via AIVUR_BASE_URL)",
      stop: async () => {},
    };
  }

  const port = await getFreePort();
  const base = `http://127.0.0.1:${port}`;
  const miniflareDir = path.join(os.tmpdir(), `aivur-reg-miniflare-${process.pid}-${port}`);
  const nextBin = path.join(ROOT, "node_modules/next/dist/bin/next");
  const logs = createLogBuffer(80);

  let detectedBoundPort = null;
  let sawReadyLine = false;

  const child = spawn(process.execPath, [nextBin, "dev", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NEXT_TELEMETRY_DISABLED: "1",
      MINIFLARE_PERSIST_PATH: miniflareDir,
    },
  });

  const inspectChunk = (chunk) => {
    const text = chunk.toString("utf8");
    const localMatch = text.match(/Local:\s+https?:\/\/[^:\s]+:(\d+)/i);
    if (localMatch) detectedBoundPort = Number(localMatch[1]);
    if (/Ready in/i.test(text)) sawReadyLine = true;
  };

  child.stdout?.on("data", (c) => {
    logs.pushStdout(c);
    inspectChunk(c);
  });
  child.stderr?.on("data", (c) => {
    logs.pushStderr(c);
    inspectChunk(c);
  });

  let exitInfo = null;
  child.on("exit", (code, signal) => {
    exitInfo = { code, signal };
  });

  const cleanupOnBootError = async () => {
    await terminateChildProcess(child);
    try {
      rmSync(miniflareDir, { recursive: true, force: true });
    } catch (_) {}
  };

  try {
    const deadline = Date.now() + 180_000;
    let lastReason = "aguardando inicialização";
    while (Date.now() < deadline) {
      if (exitInfo) {
        throw new Error(
          `Servidor isolado next dev (PID ${child.pid}, porta ${port}) encerrou prematuramente (code=${exitInfo.code}, signal=${exitInfo.signal}).\n--- Logs ---\n${logs.dump()}`,
        );
      }
      if (detectedBoundPort !== null && detectedBoundPort !== port) {
        throw new Error(
          `Servidor next dev iniciou na porta ${detectedBoundPort} em vez da porta isolada ${port}.\n--- Logs ---\n${logs.dump()}`,
        );
      }
      const identity = await checkServerIdentity(base);
      if (identity.ok && (sawReadyLine || detectedBoundPort === port)) {
        await warmupServerRoutes(base, logs);
        return {
          base,
          owned: true,
          pid: child.pid,
          getLogs: () => logs.dump(),
          stop: async () => {
            await terminateChildProcess(child);
            try {
              rmSync(miniflareDir, { recursive: true, force: true });
            } catch (_) {}
          },
        };
      }
      lastReason = identity.ok ? "aguardando sinal Ready do Next.js" : identity.reason;
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error(
      `Timeout (180s) aguardando servidor isolado next dev em ${base} (último estado: ${lastReason}).\n--- Logs ---\n${logs.dump()}`,
    );
  } catch (err) {
    await cleanupOnBootError();
    throw err;
  }
}

function attachPageTelemetry(page, diagBag) {
  const state = {
    url: "",
    httpStatus: null,
    expectedSelector: null,
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
    domSnapshot: null,
  };
  diagBag.pages.push(state);

  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      state.url = frame.url();
    }
  });
  page.on("response", (res) => {
    const req = res.request();
    if (req.isNavigationRequest() && res.frame() === page.mainFrame()) {
      state.httpStatus = res.status();
      state.url = res.url();
    }
    if (res.status() >= 400) {
      state.httpErrors.push(`${res.status()} ${req.method()} ${res.url()}`);
    }
  });
  page.on("requestfailed", (req) => {
    state.failedRequests.push(`${req.method()} ${req.url()} (${req.failure()?.errorText || "failed"})`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      state.consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    state.pageErrors.push(err?.message || String(err));
  });

  const trackSelector = (sel) => {
    if (typeof sel === "string" && sel.trim()) {
      state.expectedSelector = sel;
    }
  };

  for (const methodName of ["waitForSelector", "$", "$$", "$eval", "$$eval"]) {
    const orig = page[methodName].bind(page);
    page[methodName] = (...args) => {
      trackSelector(args[0]);
      return orig(...args);
    };
  }

  const origClick = page.click.bind(page);
  page.click = async (...args) => {
    const sel = args[0];
    trackSelector(sel);
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await origClick(...args);
      } catch (err) {
        const msg = err?.message || String(err);
        const isTransientNodeSwap = /not clickable|not an Element|detached/i.test(msg);
        if (!isTransientNodeSwap || attempt === maxAttempts || typeof sel !== "string") {
          throw err;
        }
        await waitHydrated(page, sel, { timeout: 10_000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  };

  const captureDomSnapshot = async () => {
    if (page.isClosed()) return;
    try {
      state.url = page.url();
      state.domSnapshot = await page.evaluate(() => {
        const h1s = Array.from(document.querySelectorAll("h1")).map((e) => e.innerText.trim()).filter(Boolean);
        const portalRoot = document.querySelector("nextjs-portal")?.shadowRoot;
        let nextPortal = null;
        if (portalRoot) {
          const textParts = Array.from(portalRoot.children || [])
            .filter((el) => el.tagName !== "STYLE" && el.tagName !== "LINK")
            .map((el) => el.textContent || "");
          nextPortal = textParts.join(" ").replace(/\s+/g, " ").trim().slice(0, 300) || null;
        }
        const bodyText = (document.body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 350);
        return {
          title: document.title,
          readyState: document.readyState,
          h1s,
          bodySnippet: bodyText,
          nextErrorOverlay: nextPortal,
        };
      });
    } catch (err) {
      state.domSnapshot = {
        title: "(indisponível)",
        readyState: "unknown",
        h1s: [],
        bodySnippet: `Erro ao capturar DOM: ${err?.message || String(err)}`,
        nextErrorOverlay: null,
      };
    }
  };

  pageDiagnostics.set(page, { state, trackSelector, captureDomSnapshot });

  const origClose = page.close.bind(page);
  page.close = async (...args) => {
    await captureDomSnapshot();
    return await origClose(...args);
  };
}

export async function startBrowserEnv() {
  let server = null;
  let browser = null;
  const diagBag = {
    caseId: null,
    caseTitle: null,
    pages: [],
  };

  try {
    server = await ensureServer();
    activeBase = server.base;
    const puppeteer = (await import("puppeteer")).default;
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    await warmupClientBundles(browser, server.base);

    return {
      base: server.base,
      async newPage({ session = true } = {}) {
        const page = await browser.newPage();
        attachPageTelemetry(page, diagBag);
        await page.setViewport({ width: 1280, height: 900 });
        if (session) {
          const cookieValue = typeof session === "string" ? session : await signSession("reg-test-user");
          await page.setCookie({ name: "aivur_session", value: cookieValue, url: server.base });
        }
        page.setDefaultTimeout(60_000);
        return page;
      },
      resetCaseDiagnostics(caseMeta) {
        diagBag.caseId = caseMeta?.id ?? null;
        diagBag.caseTitle = caseMeta?.title ?? null;
        diagBag.pages = [];
      },
      async getCaseDiagnostics() {
        for (const p of await browser.pages().catch(() => [])) {
          const entry = pageDiagnostics.get(p);
          if (entry) await entry.captureDomSnapshot();
        }
        return {
          caseId: diagBag.caseId,
          caseTitle: diagBag.caseTitle,
          base: server.base,
          serverPid: server.pid ?? null,
          pages: diagBag.pages,
          serverLogsTail: server.getLogs().split("\n").slice(-20).join("\n"),
        };
      },
      async stop() {
        if (browser) {
          await Promise.race([
            browser.close().catch(() => {}),
            new Promise((r) => setTimeout(r, 5000)),
          ]);
          const proc = browser.process?.();
          if (proc?.pid && isProcessAlive(proc.pid)) {
            await terminateChildProcess(proc);
          }
          browser = null;
        }
        if (server) {
          await server.stop();
          server = null;
        }
      },
    };
  } catch (err) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (server) {
      await server.stop().catch(() => {});
    }
    throw err;
  }
}

/** Intercepta requisições. `handlers`: [{ test(req) => bool, respond(req) => {status,body} }]. O resto segue normal. */
export async function intercept(page, handlers) {
  await page.setRequestInterception(true);
  const seen = [];
  page.on("request", (req) => {
    if (req.isInterceptResolutionHandled()) return;
    const h = handlers.find((x) => x.test(req));
    if (!h) return void req.continue().catch(() => {});
    seen.push({ url: req.url(), method: req.method(), postData: req.postData() });
    const r = h.respond(req);
    req.respond({ status: r.status, contentType: "application/json", body: JSON.stringify(r.body) }).catch(() => {});
  });
  return seen;
}

export const isGenerate = (req) => req.method() === "POST" && new URL(req.url()).pathname === "/api/ai/gerar-trilha";

/**
 * Espera hidratação React, conexão ao DOM, visibilidade, bounding box válido
 * e estabilidade geométrica em frames consecutivos antes de interações.
 */
export async function waitHydrated(page, selector, { timeout = 30_000 } = {}) {
  pageDiagnostics.get(page)?.trackSelector(selector);
  const deadline = Date.now() + timeout;

  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      if (!el || !el.isConnected) return false;
      const hydrated = Object.keys(el).some((k) => k.startsWith("__reactProps$"));
      if (!hydrated) return false;
      const cs = window.getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") {
        return false;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || el.getClientRects().length === 0) {
        return false;
      }
      return true;
    },
    { timeout },
    selector,
  );

  // Confirma estabilidade de layout em dois animation frames consecutivos para evitar erro de clique durante re-render
  while (Date.now() < deadline) {
    const stable = await page.evaluate((sel) => {
      return new Promise((resolve) => {
        const readState = () => {
          const el = document.querySelector(sel);
          if (!el || !el.isConnected) return null;
          const hydrated = Object.keys(el).some((k) => k.startsWith("__reactProps$"));
          if (!hydrated) return null;
          const cs = window.getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden") return null;
          const r = el.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0 || el.getClientRects().length === 0) return null;
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        };
        const firstEl = document.querySelector(sel);
        const a = readState();
        if (!a || !firstEl) return resolve(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const secondEl = document.querySelector(sel);
            const b = readState();
            if (!b || secondEl !== firstEl) return resolve(false);
            const same =
              Math.abs(a.x - b.x) < 1 &&
              Math.abs(a.y - b.y) < 1 &&
              Math.abs(a.w - b.w) < 1 &&
              Math.abs(a.h - b.h) < 1;
            resolve(same);
          });
        });
      });
    }, selector);

    if (stable) return;
    await new Promise((r) => setTimeout(r, 50));
  }

  throw new Error(`Elemento "${selector}" não estabilizou para interação dentro de ${timeout}ms.`);
}

export async function openCreation(page) {
  await page.goto(`${activeBase}/trilhas/novo`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitHydrated(page, "input[type='text']");
  await waitHydrated(page, "textarea");
}

export async function fillCreation(page, { title, text }) {
  await page.click("input[type='text']", { clickCount: 3 });
  await page.keyboard.type(title, { delay: 2 });
  await page.click("textarea", { clickCount: 3 });
  await page.keyboard.type(text, { delay: 2 });
}

export async function submitCreation(page) {
  await page.click("button[type='submit']");
}

export const bodyIncludes = (page, text, timeout = 60_000) =>
  page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text);
