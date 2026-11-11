// REGRESSION GATE — runner único. Uso: `npm run regression` (ver tests/regression/README.md)
//   --no-browser   pula casos de navegador (resultado fica INCOMPLETE, nunca PASS)
//   --only <ID>    executa apenas um caso (ex.: --only REG-TRILHAS-004)
//   --list         lista a baseline
import { register } from "node:module";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

register("./_support/hooks.mjs", import.meta.url);

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Sincroniza variáveis de ambiente do .env.local (ex: ADMIN_SECRET) com o servidor next dev
try {
  const envPath = path.resolve(HERE, "../../.env.local");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (_) {}
const args = process.argv.slice(2);
const noBrowser = args.includes("--no-browser");
const listOnly = args.includes("--list");
const onlyIdx = args.indexOf("--only");
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

if (onlyIdx >= 0 && (!only || only.startsWith("-"))) {
  console.error("ERRO: O parâmetro --only exige um ID de teste válido (ex: --only REG-MAT-001). Use --list para listar os IDs.");
  process.exit(1);
}

const CASE_TIMEOUT = { api: 30_000, browser: 240_000 };

function findCaseFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith("_") || name === "node_modules") continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...findCaseFiles(full));
    else if (name.endsWith(".case.mjs")) out.push(full);
  }
  return out.sort();
}

function withTimeout(promise, ms, id) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${id}: timeout de ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const baseline = JSON.parse(readFileSync(path.join(HERE, "baseline.json"), "utf8"));
const baselineTotal = Object.keys(baseline.cases).length;
const cases = [];
for (const file of findCaseFiles(HERE)) {
  const mod = await import(pathToFileURL(file).href);
  for (const c of mod.cases ?? []) cases.push({ ...c, file: path.relative(HERE, file) });
}

if (only) {
  const exists = cases.some((c) => c.id === only);
  if (!exists) {
    console.error(`ERRO: O ID "${only}" fornecido em --only não existe no catálogo de testes. Use --list para ver os IDs disponíveis.`);
    process.exit(1);
  }
}

// ─── Integridade da baseline (anti "apagar teste para passar") ─────────────
const registryErrors = [];
const seen = new Set();
for (const c of cases) {
  if (seen.has(c.id)) registryErrors.push(`ID duplicado: ${c.id}`);
  seen.add(c.id);
  if (!baseline.cases[c.id]) {
    registryErrors.push(`${c.id} existe no código mas não está em baseline.json (registre-o conscientemente — ver README, "Adicionar caso")`);
  }
}
for (const id of Object.keys(baseline.cases)) {
  if (!seen.has(id)) {
    registryErrors.push(`${id} consta na baseline mas o caso FOI REMOVIDO/RENOMEADO. Remover exige processo de mudança intencional (README) e registro no CHANGELOG.`);
  }
}

if (listOnly) {
  for (const [id, meta] of Object.entries(baseline.cases)) console.log(`${id}  ${meta.title}`);
  process.exit(0);
}

console.log("REGRESSION GATE — AIVUR\n");

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];
const selected = cases
  .filter((c) => !only || c.id === only)
  .sort((a, b) => a.id.localeCompare(b.id));

function printBrowserDiagnostics(diag) {
  if (!diag) return;
  console.log(`    [DIAG] Teste: ${diag.caseId} — ${diag.caseTitle}`);
  console.log(`    [DIAG] Servidor: ${diag.base}${diag.serverPid ? ` (PID ${diag.serverPid})` : ""}`);
  if (!diag.pages?.length) {
    console.log("    [DIAG] Nenhuma página aberta registrada.");
  }
  for (let i = 0; i < diag.pages.length; i++) {
    const p = diag.pages[i];
    const tag = diag.pages.length > 1 ? `[Pág ${i + 1}] ` : "";
    console.log(`    [DIAG] ${tag}URL: ${p.url || "(não navegada)"}`);
    console.log(`    [DIAG] ${tag}HTTP Status: ${p.httpStatus ?? "(sem resposta)"}`);
    console.log(`    [DIAG] ${tag}Seletor esperado: ${p.expectedSelector ?? "(não registrado)"}`);
    console.log(`    [DIAG] ${tag}Console errors: ${p.consoleErrors.length ? p.consoleErrors.slice(0, 5).join(" | ") : "nenhum"}`);
    console.log(`    [DIAG] ${tag}Page errors: ${p.pageErrors.length ? p.pageErrors.slice(0, 5).join(" | ") : "nenhum"}`);
    console.log(`    [DIAG] ${tag}Failed requests: ${p.failedRequests.length ? p.failedRequests.slice(0, 5).join(" | ") : "nenhuma"}`);
    if (p.httpErrors.length) {
      console.log(`    [DIAG] ${tag}HTTP >= 400: ${p.httpErrors.slice(0, 5).join(" | ")}`);
    }
    if (p.domSnapshot) {
      console.log(`    [DIAG] ${tag}DOM title="${p.domSnapshot.title}" readyState="${p.domSnapshot.readyState}" h1=${JSON.stringify(p.domSnapshot.h1s)}`);
      console.log(`    [DIAG] ${tag}DOM snippet: ${p.domSnapshot.bodySnippet || "(vazio)"}`);
      if (p.domSnapshot.nextErrorOverlay) {
        console.log(`    [DIAG] ${tag}Next error overlay: ${p.domSnapshot.nextErrorOverlay}`);
      }
    }
  }
  if (diag.serverLogsTail) {
    console.log("    [DIAG] Últimas linhas do servidor:");
    for (const line of diag.serverLogsTail.split("\n")) {
      console.log(`      ${line}`);
    }
  }
}

let browserCtx = null;
let browserBootError = null;
let cleaningUp = false;
async function cleanup() {
  if (cleaningUp) return;
  cleaningUp = true;
  if (browserCtx) {
    await browserCtx.stop().catch(() => {});
    browserCtx = null;
  }
}

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    await cleanup();
    process.exit(130);
  });
}

try {
  for (const c of selected) {
    if (c.needs === "browser" && noBrowser) {
      skipped++;
      console.log(`${c.id} –  SKIPPED (browser)  ${c.title}`);
      continue;
    }
    try {
      const ctx = {};
      if (c.needs === "browser") {
        if (browserBootError) throw browserBootError;
        if (!browserCtx) {
          try {
            browserCtx = await (await import("./_support/browser.mjs")).startBrowserEnv();
          } catch (bootErr) {
            browserBootError = bootErr;
            throw bootErr;
          }
        }
        browserCtx.resetCaseDiagnostics?.(c);
        Object.assign(ctx, browserCtx);
      }
      await withTimeout(Promise.resolve(c.run(ctx)), CASE_TIMEOUT[c.needs] ?? 30_000, c.id);
      passed++;
      console.log(`${c.id} ✓  ${c.title}`);
    } catch (err) {
      failed++;
      failures.push(c.id);
      console.log(`${c.id} ✗  ${c.title}`);
      const msg = String(err?.message ?? err).split("\n").slice(0, 6).join("\n    ");
      console.log(`    ${msg}`);
      if (c.needs === "browser" && browserCtx?.getCaseDiagnostics) {
        const diag = await browserCtx.getCaseDiagnostics().catch(() => null);
        printBrowserDiagnostics(diag);
      }
    }
  }
} finally {
  await cleanup();
}

const manual = selected.flatMap((c) => (c.manual ?? []).map((m) => `${c.id}: ${m}`));
if (manual.length) {
  console.log("\nVERIFICAÇÕES MANUAIS (não contam no placar):");
  for (const m of manual) console.log(`  • ${m}`);
}

if (registryErrors.length) {
  console.log("\nBASELINE ✗");
  for (const e of registryErrors) console.log(`  - ${e}`);
}

const total = passed + failed;
console.log("");
let exit = 0;
if (failed > 0 || registryErrors.length > 0) {
  console.log(`REGRESSION GATE: FAIL — ${passed}/${total}${registryErrors.length ? ` (+${registryErrors.length} erro(s) de baseline)` : ""}`);
  exit = 1;
} else if (skipped > 0) {
  console.log(`REGRESSION GATE: INCOMPLETE — ${passed}/${passed + skipped} (${skipped} pulado(s); isto NÃO é PASS)`);
  exit = 2;
} else if (only || selected.length < baselineTotal) {
  console.log(`REGRESSION GATE: PARTIAL — ${passed}/${baselineTotal} (execução restrita a ${selected.length} caso(s); isto NÃO é PASS de suíte completa)`);
  exit = 2;
} else {
  console.log(`REGRESSION GATE: PASS — ${passed}/${total}`);
}
process.exit(exit);
