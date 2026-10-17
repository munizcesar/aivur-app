import { getRequestContext } from "@cloudflare/next-on-pages";

export interface SessionPayload {
  sub: string;
  exp: number;
  iat: number;
}

export type SessionVerificationResult =
  | { valid: true; userId: string; expiresAt: number }
  | { valid: false; error: "missing" | "invalid_format" | "invalid_signature" | "expired" | "malformed_payload" };

const DEFAULT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms

/**
 * Converte Uint8Array para Base64URL segura para cookies/URLs.
 */
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decodifica string Base64URL para Uint8Array.
 */
function fromBase64Url(str: string): Uint8Array {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Obtém a chave de segredo da sessão respeitando os runtimes Cloudflare Edge, Node.js e Dev.
 */
export function resolveSessionSecret(customSecret?: string): string {
  if (customSecret && customSecret.trim()) {
    return customSecret.trim();
  }

  // 1. Edge Runtime (Cloudflare Pages)
  try {
    const ctx = getRequestContext();
    const env = (ctx?.env as unknown as Record<string, unknown>) ?? {};
    if (env.AUTH_SECRET) return String(env.AUTH_SECRET).trim();
    if (env.ADMIN_SECRET) return String(env.ADMIN_SECRET).trim();
  } catch (_) {
    // Contexto Edge não disponível (ex: execução pura Node.js ou test runner)
  }

  // 2. Global bindings (Workers / Tests)
  const g = globalThis as any;
  if (g.AUTH_SECRET) return String(g.AUTH_SECRET).trim();
  if (g.ADMIN_SECRET) return String(g.ADMIN_SECRET).trim();

  // 3. process.env (Node.js / Dev local / CI)
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET.trim();
  if (process.env.ADMIN_SECRET) return process.env.ADMIN_SECRET.trim();

  // 4. Fallback exclusivo de desenvolvimento local (rejeitado em produção)
  if (process.env.NODE_ENV !== "production") {
    return "aivur-dev-session-secret-local-not-for-production";
  }

  throw new Error("AUTH_SECRET ou ADMIN_SECRET não configurado no ambiente de produção.");
}

/**
 * Importa o segredo como CryptoKey HMAC-SHA256.
 */
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Emite uma sessão assinada com HMAC-SHA256.
 * Formato: base64url(payload).base64url(assinatura)
 */
export async function signSession(
  userId: string,
  options: { maxAgeMs?: number; customSecret?: string } = {}
): Promise<string> {
  const trimmedId = userId.trim();
  if (!trimmedId) {
    throw new Error("userId não pode ser vazio.");
  }

  const secret = resolveSessionSecret(options.customSecret);
  const now = Date.now();
  const maxAge = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;

  const payload: SessionPayload = {
    sub: trimmedId,
    iat: now,
    exp: now + maxAge,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadBytes = new TextEncoder().encode(payloadJson);
  const payloadB64 = toBase64Url(payloadBytes);

  const key = await getCryptoKey(secret);
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  const sigB64 = toBase64Url(new Uint8Array(sigBuffer));

  return `${payloadB64}.${sigB64}`;
}

/**
 * Valida rigorosamente uma sessão assinada.
 * Rejeita cookies ausentes, forjados, adulterados, malformados ou expirados.
 */
export async function verifySessionCookie(
  cookieValue: string | undefined | null,
  options: { customSecret?: string; now?: number } = {}
): Promise<SessionVerificationResult> {
  if (!cookieValue || typeof cookieValue !== "string") {
    return { valid: false, error: "missing" };
  }

  const parts = cookieValue.trim().split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, error: "invalid_format" };
  }

  const [payloadB64, sigB64] = parts;

  let secret: string;
  try {
    secret = resolveSessionSecret(options.customSecret);
  } catch {
    return { valid: false, error: "invalid_signature" };
  }

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = fromBase64Url(sigB64);
  } catch {
    return { valid: false, error: "invalid_format" };
  }

  try {
    const key = await getCryptoKey(secret);
    const isValidSig = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      new TextEncoder().encode(payloadB64)
    );

    if (!isValidSig) {
      return { valid: false, error: "invalid_signature" };
    }
  } catch {
    return { valid: false, error: "invalid_signature" };
  }

  // Assinatura válida: agora inspecionamos o payload
  let payload: SessionPayload;
  try {
    const payloadBytes = fromBase64Url(payloadB64);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    payload = JSON.parse(payloadJson);
  } catch {
    return { valid: false, error: "malformed_payload" };
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    !payload.sub.trim() ||
    typeof payload.exp !== "number"
  ) {
    return { valid: false, error: "malformed_payload" };
  }

  const currentTime = options.now ?? Date.now();
  if (currentTime > payload.exp) {
    return { valid: false, error: "expired" };
  }

  return {
    valid: true,
    userId: payload.sub.trim(),
    expiresAt: payload.exp,
  };
}
