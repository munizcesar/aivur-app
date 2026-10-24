// Infra de testes de navegador da Regression Gate.
// Reutiliza um servidor já em execução (AIVUR_BASE_URL, padrão http://localhost:3000) ou sobe
// `next dev` temporário. Todas as chamadas de IA/banco são interceptadas no navegador:
// NENHUMA chamada real à Groq/D1 acontece nesta camada.
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { signSession } from "@/lib/session.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const BASE = (process.env.AIVUR_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const PORT = new URL(BASE).port || "3000";

async function isUp() {
  try {
    const r = await fetch(`${BASE}/login`, { signal: AbortSignal.timeout(5000), redirect: "manual" });
    return r.status < 500;
  } catch {
    return false;
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // Apenas ESRCH prova conclusivamente que o PID não existe no sistema.
    // EPERM indica que o processo existe mas não há permissão para sinalizá-lo.
    if (err && err.code === "ESRCH") {
      return false;
    }
    return true;
  }
}

async function terminateChildProcess(child) {
  if (!child || !child.pid) return;

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

  // Aguarda até 3 segundos para confirmar encerramento real do processo filho
  const deadline = Date.now() + 3000;
  while (isProcessAlive(child.pid) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
  }

  if (isProcessAlive(child.pid)) {
    console.error(`AVISO: Não foi possível confirmar o encerramento do processo PID ${child.pid}.`);
  }
}

async function ensureServer() {
  if (await isUp()) return { owned: false, stop: async () => {} };
  const nextBin = path.join(ROOT, "node_modules/next/dist/bin/next");
  const child = spawn(process.execPath, [nextBin, "dev", "-p", PORT], { cwd: ROOT, stdio: "ignore", windowsHide: true });
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (await isUp()) {
      // Pré-aquece rotas principais sequencialmente para evitar timeout de compilação a frio no primeiro teste de navegador
      await fetch(`${BASE}/material`, { signal: AbortSignal.timeout(60_000) }).catch(() => {});
      await fetch(`${BASE}/trilhas`, { signal: AbortSignal.timeout(60_000) }).catch(() => {});
      const warmCookie = await signSession("reg-warmup-user");
      await fetch(`${BASE}/trilhas/novo`, { headers: { cookie: `aivur_session=${warmCookie}` }, signal: AbortSignal.timeout(90_000) }).catch(() => {});
      return {
        owned: true,
        stop: async () => {
          await terminateChildProcess(child);
        },
      };
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  await terminateChildProcess(child);
  throw new Error(`Servidor de desenvolvimento não ficou pronto em ${BASE} (180s).`);
}

export async function startBrowserEnv() {
  const server = await ensureServer();
  const puppeteer = (await import("puppeteer")).default;
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  return {
    base: BASE,
    async newPage({ session = true } = {}) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      if (session) {
        const cookieValue = typeof session === "string" ? session : await signSession("reg-test-user");
        await page.setCookie({ name: "aivur_session", value: cookieValue, url: BASE });
      }
      page.setDefaultTimeout(60_000);
      return page;
    },
    async stop() {
      await browser.close().catch(() => {});
      await server.stop();
    },
  };
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

/** Espera a hidratação do React no elemento (digitar antes disso perde o estado controlado). */
export async function waitHydrated(page, selector) {
  await page.waitForSelector(selector);
  await page.waitForFunction(
    (sel) => Object.keys(document.querySelector(sel) || {}).some((k) => k.startsWith("__reactProps$")),
    {},
    selector,
  );
}

export async function openCreation(page) {
  await page.goto(`${BASE}/trilhas/novo`, { waitUntil: "domcontentloaded", timeout: 120_000 });
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
