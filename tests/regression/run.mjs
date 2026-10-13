// REGRESSION GATE — runner único. Uso: `npm run regression` (ver tests/regression/README.md)
//   --no-browser   pula casos de navegador (resultado fica INCOMPLETE, nunca PASS)
//   --only <ID>    executa apenas um caso (ex.: --only REG-TRILHAS-004)
//   --list         lista a baseline
import { register } from "node:module";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

register("./_support/hooks.mjs", import.meta.url);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const noBrowser = args.includes("--no-browser");
const listOnly = args.includes("--list");
const onlyIdx = args.indexOf("--only");
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
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
const cases = [];
for (const file of findCaseFiles(HERE)) {
  const mod = await import(pathToFileURL(file).href);
  for (const c of mod.cases ?? []) cases.push({ ...c, file: path.relative(HERE, file) });
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

let browserCtx = null;
for (const c of selected) {
  if (c.needs === "browser" && noBrowser) {
    skipped++;
    console.log(`${c.id} –  SKIPPED (browser)  ${c.title}`);
    continue;
  }
  try {
    const ctx = {};
    if (c.needs === "browser") {
      browserCtx ||= await (await import("./_support/browser.mjs")).startBrowserEnv();
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
  }
}

if (browserCtx) await browserCtx.stop();

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
} else {
  console.log(`REGRESSION GATE: PASS — ${passed}/${total}`);
}
process.exit(exit);
