// Harness de testes de API da Regression Gate.
// Importa a rota REAL (src/app/api/ai/gerar-trilha/route.ts) e substitui SOMENTE a rede
// (globalThis.fetch). Nenhuma chamada real à Groq é possível: qualquer URL inesperada falha o teste.
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "../../..");

/** Teto funcional de chamadas à IA por requisição (retries/fallback/fixer). Ver README. */
export const AI_CALL_CAP = 8;
/** Limite TPM do provedor usado como referência de orçamento. */
export const TPM_LIMIT = 8000;

process.env.GROQ_API_KEY = "reg-test-key-not-real";

let routeModule;
export async function loadRoute() {
  // REG_ROUTE_FILE existe apenas para o autoteste de mutação (README); por padrão usa a rota real.
  const file = process.env.REG_ROUTE_FILE || path.join(ROOT, "src/app/api/ai/gerar-trilha/route.ts");
  routeModule ||= await import(pathToFileURL(file).href);
  return routeModule;
}

let schemaModule;
export async function loadSchemas() {
  schemaModule ||= await import(pathToFileURL(path.join(ROOT, "src/lib/validations/trilha.ts")).href);
  return schemaModule;
}

// ─── Fixtures ──────────────────────────────────────────────────────────────
export function validAiOutput() {
  const q = (n) => ({
    enunciado: `Pergunta ${n} sobre o tema?`,
    opcoes: ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
    corretaIdx: n % 4,
    justificativa: `Justificativa da pergunta ${n}.`,
  });
  return {
    disciplina: "Legislação de Trânsito",
    video: {
      titulo: "Aula de teste",
      resumo: "Resumo curto.",
      resumo_markdown: "## Tópico\n- item um\n- item dois",
    },
    flashcards: [1, 2, 3, 4].map((n) => ({ frente: `Frente ${n}`, verso: `Verso ${n}` })),
    questoes: [1, 2, 3].map(q),
  };
}

/** JSON sintaticamente válido, porém fora do contrato (3 alternativas) → deve acionar o Fixer. */
export function schemaInvalidAiOutput() {
  const out = validAiOutput();
  out.questoes[0].opcoes = ["A", "B", "C"];
  return out;
}

// ─── Respostas simuladas do provedor ───────────────────────────────────────
export const ok = (obj) => ({ kind: "ok", content: JSON.stringify(obj) });
export const raw = (content) => ({ kind: "ok", content });
export const truncated = (obj) => ({ kind: "ok", content: JSON.stringify(obj).slice(0, 120) });
export const fail = (status, message = "provider error") => ({ kind: "fail", status, message });

function toResponse(step) {
  if (step.kind === "ok") {
    return Response.json({ choices: [{ message: { content: step.content } }] });
  }
  return new Response(JSON.stringify({ error: { message: step.message } }), {
    status: step.status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Instala o fetch simulado. `script(n, body)` recebe o nº (1-based) da chamada à IA e o corpo
 * enviado, e devolve um passo (ok/raw/truncated/fail).
 */
export function installFetch(script) {
  const original = globalThis.fetch;
  const calls = { groq: [], rag: 0 };
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url ?? String(input);
    if (url.startsWith("https://api.groq.com/")) {
      const body = JSON.parse(init.body);
      calls.groq.push(body);
      return toResponse(script(calls.groq.length, body));
    }
    if (url.includes("/api/rag/search")) {
      calls.rag++;
      return new Response("{}", { status: 404 });
    }
    throw new Error(`[Regression Gate] Chamada de rede inesperada em teste: ${url}`);
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

let ipCounter = 0;
function silenceConsole() {
  const saved = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  console.log = console.warn = console.error = console.info = () => {};
  return () => Object.assign(console, saved);
}

/**
 * Executa a rota real. Retorna { res, body, calls }.
 * Cada chamada usa um IP exclusivo para não colidir com o rate limit em memória da rota.
 */
export async function callGenerate({ script, cookie = "reg-user", title = "Concurso de Teste", text = "Conteúdo programático de teste." } = {}) {
  const { POST } = await loadRoute();
  const net = installFetch(script ?? (() => ok(validAiOutput())));

  let sessionCookieValue = cookie;
  if (cookie === "reg-user") {
    const { signSession } = await import("@/lib/session.ts");
    sessionCookieValue = await signSession("reg-user");
  }

  globalThis.__REG_COOKIES = sessionCookieValue === null ? {} : { aivur_session: sessionCookieValue };
  const form = new FormData();
  form.append("title", title);
  form.append("text", text);
  const req = new Request("http://localhost/api/ai/gerar-trilha", {
    method: "POST",
    headers: { "x-forwarded-for": `10.0.${Math.floor(++ipCounter / 250)}.${(ipCounter % 250) + 1}` },
    body: form,
  });
  const unsilence = silenceConsole();
  try {
    const res = await POST(req);
    const body = await res.json().catch(() => null);
    return { res, body, calls: net.calls };
  } finally {
    unsilence();
    net.restore();
    delete globalThis.__REG_COOKIES;
  }
}

/** Verificação estrutural do contrato de uma trilha gerada (independente do Zod do projeto). */
export function assertTrilhaContract(assert, body, title) {
  assert.equal(typeof body.id, "string");
  assert.ok(body.id.length > 0);
  assert.equal(body.titulo, title);
  assert.equal(typeof body.disciplina, "string");
  assert.equal(body.progresso, 0);
  assert.equal(typeof body.video?.titulo, "string");
  assert.equal(typeof body.video?.resumo, "string");
  assert.ok(Array.isArray(body.flashcards) && body.flashcards.length >= 3, "flashcards >= 3");
  for (const f of body.flashcards) {
    assert.ok(f.id !== undefined && typeof f.frente === "string" && typeof f.verso === "string");
  }
  assert.ok(Array.isArray(body.questoes) && body.questoes.length >= 3, "questoes >= 3");
  for (const q of body.questoes) {
    assert.ok(q.id !== undefined);
    assert.equal(typeof q.enunciado, "string");
    assert.ok(Array.isArray(q.opcoes) && q.opcoes.length >= 4 && q.opcoes.every((o) => typeof o === "string"));
    assert.ok(Number.isInteger(q.corretaIdx) && q.corretaIdx >= 0 && q.corretaIdx < q.opcoes.length);
    assert.equal(typeof q.justificativa, "string");
  }
}
