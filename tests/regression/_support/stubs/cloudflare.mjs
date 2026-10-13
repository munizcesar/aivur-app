// Stub de teste de `@cloudflare/next-on-pages`: fora do runtime Cloudflare não há contexto,
// exatamente como no `next dev` local; a rota cai para process.env.
export function getRequestContext() {
  throw new Error("Sem contexto Cloudflare em teste.");
}
