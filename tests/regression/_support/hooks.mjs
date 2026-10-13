// Loader hooks da Regression Gate (somente infraestrutura de teste).
// Permite importar o código REAL de src/ (TypeScript, alias "@/") em Node puro e
// substitui apenas as fronteiras do framework que não existem fora do runtime Next/Cloudflare.
import { pathToFileURL, fileURLToPath } from "node:url";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const SRC = path.join(ROOT, "src");
const SRC_URL = pathToFileURL(SRC).href;
const STUBS = path.join(HERE, "stubs");

const STUB_MAP = {
  "next/headers": "next-headers.mjs",
  "next/server": "next-server.mjs",
  "@cloudflare/next-on-pages": "cloudflare.mjs",
};
const SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx", ".js", ".mjs"];

function isFile(p) {
  try {
    return existsSync(p) && statSync(p).isFile();
  } catch {
    return false;
  }
}

function tryResolve(base) {
  for (const suffix of SUFFIXES) {
    if (isFile(base + suffix)) return base + suffix;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (STUB_MAP[specifier]) {
    return { url: pathToFileURL(path.join(STUBS, STUB_MAP[specifier])).href, shortCircuit: true };
  }
  if (specifier.startsWith("@/")) {
    const found = tryResolve(path.join(SRC, specifier.slice(2)));
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true };
  }
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  if (isRelative && context.parentURL && context.parentURL.startsWith(SRC_URL)) {
    const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    const found = tryResolve(base);
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
