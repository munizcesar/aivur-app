/**
 * test-ai-route.mjs — Testa 3 cenários da rota POST /api/ai/gerar-questoes
 * Uso: node scratch/test-ai-route.mjs
 */
const BASE_URL = "http://localhost:3000";
const ENDPOINT = `${BASE_URL}/api/ai/gerar-questoes`;
let passed = 0, failed = 0;

const log  = (icon, msg) => console.log(`${icon}  ${msg}`);
const assert = (cond, label, detail = "") => {
  if (cond) { log("?", `PASS: ${label}`); passed++; }
  else       { log("?", `FAIL: ${label}${detail ? " — " + detail : ""}`); failed++; }
};

function validateShape(data, label) {
  assert(Array.isArray(data?.questoes),                        `${label}: questoes é array`);
  assert(data.questoes.length >= 1,                            `${label}: ao menos 1 questão`);
  const q = data.questoes[0];
  assert(typeof q?.id !== "undefined",                         `${label}: q[0].id existe`);
  assert(typeof q?.enunciado === "string",                     `${label}: q[0].enunciado string`);
  assert(Array.isArray(q?.opcoes),                             `${label}: q[0].opcoes array`);
  assert(q?.opcoes.length === 4,                               `${label}: q[0].opcoes length=4`, `got ${q?.opcoes?.length}`);
  assert(typeof q?.corretaIdx === "number",                    `${label}: q[0].corretaIdx number`);
  assert(q?.corretaIdx >= 0 && q?.corretaIdx <= 3,             `${label}: corretaIdx in [0-3]`);
  assert(typeof q?.justificativa === "string",                 `${label}: q[0].justificativa string`);
}

async function scenario1() {
  console.log("\n??? CENÁRIO 1: Chamada normal (Groq real OU mock se chave inválida) ???");
  const res = await fetch(ENDPOINT, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trilhaId: "t-001", topico: "Direito Administrativo — Atos Administrativos", erros: ["discricionariedade", "vinculação"] }),
  });
  assert(res.ok, "C1: HTTP 200", `status=${res.status}`);
  const data = await res.json();
  const source = data.questoes?.[0]?.id?.toString().startsWith("q-ia-") ? "MOCK FALLBACK" : "GROQ REAL";
  log("??", `C1: fonte detectada = ${source}`);
  validateShape(data, "C1");
}

async function scenario2_guard() {
  console.log("\n??? CENÁRIO 2: Body sem trilhaId ? runtime guard deve retornar 400 ???");
  const res = await fetch(ENDPOINT, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topico: "Direito Constitucional" }),
  });
  assert(res.status === 400, "C2: HTTP 400 (guard ativo)", `status=${res.status}`);
  const data = await res.json();
  assert(typeof data.error === "string", "C2: campo error presente");
  assert(!data.questoes, "C2: sem questoes no erro (guard correto)");
  log("??", `C2: mensagem="${data.error}"`);
}

async function scenario2b_mockFallback() {
  console.log("\n??? CENÁRIO 2B: Groq 401 ? fallback mock deve disparar com 3 questões ???");
  const res = await fetch(ENDPOINT, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trilhaId: "t-002", topico: "Direito Constitucional — Direitos Fundamentais", erros: [] }),
  });
  assert(res.ok, "C2B: HTTP 200 mesmo com Groq offline", `status=${res.status}`);
  const data = await res.json();
  const isMock = data.questoes?.every(q => q.id?.toString().startsWith("q-ia-"));
  assert(isMock, "C2B: mock ativado (IDs com prefixo q-ia-)");
  assert(data.questoes?.length === 3, "C2B: mock retorna exatamente 3 questões", `got ${data.questoes?.length}`);
  validateShape(data, "C2B");
}

async function scenario3_errosVazio() {
  console.log("\n??? CENÁRIO 3: erros=[] e erros=undefined ? prompt adaptativo ???");
  // 3a: erros array vazio
  const r1 = await fetch(ENDPOINT, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trilhaId: "t-003", topico: "Língua Portuguesa", erros: [] }),
  });
  assert(r1.ok, "C3a (erros=[]): HTTP 200", `status=${r1.status}`);
  validateShape(await r1.json(), "C3a");

  // 3b: campo erros ausente (undefined ? Array.isArray ? [])
  const r2 = await fetch(ENDPOINT, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trilhaId: "t-004", topico: "Raciocínio Lógico" }),
  });
  assert(r2.ok, "C3b (erros=undefined): HTTP 200", `status=${r2.status}`);
  validateShape(await r2.json(), "C3b");
  log("??", "C3: Array.isArray guard converte undefined?[] corretamente");
}

async function run() {
  console.log("?? AIVUR — Teste de Regressão: /api/ai/gerar-questoes");
  console.log(`   Endpoint: ${ENDPOINT}\n   ${new Date().toISOString()}\n`);
  try {
    await fetch(BASE_URL, { method: "HEAD" });
    log("??", "Servidor respondendo em localhost:3000");
  } catch {
    log("?", "FATAL: servidor não está rodando — inicie com npm run dev");
    process.exit(1);
  }
  await scenario1();
  await scenario2_guard();
  await scenario2b_mockFallback();
  await scenario3_errosVazio();
  console.log(`\n${"-".repeat(52)}`);
  console.log(`?? RESULTADO: ${passed} passou | ${failed} falhou`);
  if (failed > 0) { console.log("?? STATUS: FALHOU — não commitar"); process.exit(1); }
  else            { console.log("?? STATUS: APROVADO — seguro para commitar"); process.exit(0); }
}
run().catch(err => { console.error("FATAL:", err); process.exit(1); });
