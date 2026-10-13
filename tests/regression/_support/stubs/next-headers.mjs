// Stub de teste de `next/headers`. O jar é controlado por cada caso via globalThis.__REG_COOKIES.
export async function cookies() {
  const jar = globalThis.__REG_COOKIES || {};
  return {
    get(name) {
      return Object.prototype.hasOwnProperty.call(jar, name) ? { name, value: jar[name] } : undefined;
    },
  };
}
