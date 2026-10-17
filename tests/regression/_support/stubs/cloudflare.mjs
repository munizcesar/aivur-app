// Stub de teste de `@cloudflare/next-on-pages`: fora do runtime Cloudflare não há contexto,
// a menos que injetado pontualmente para testes via globalThis.__REG_CF_CONTEXT.
export function getRequestContext() {
  if (globalThis.__REG_CF_CONTEXT) return globalThis.__REG_CF_CONTEXT;
  throw new Error("Sem contexto Cloudflare em teste.");
}
