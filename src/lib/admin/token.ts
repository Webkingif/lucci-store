// Admin session tokens: compact HS256 JWTs signed with Web Crypto, so the same
// code runs in proxy.ts, Server Components, Server Actions and plain Node
// tests. Pure: no cookies, no env reads; callers pass the secret in.

export const ADMIN_COOKIE = "admin_session";

/** Sessions last one working day; signing in again issues a fresh one. */
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

export type AdminSession = {
  role: "admin";
  /** Issued at, in seconds since the epoch. */
  iat: number;
  /** Expires at, in seconds since the epoch. */
  exp: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return null;
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function importKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

const HEADER = toBase64Url(
  encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })),
);

/** Sign a new admin session token. */
export async function signAdminToken(
  secret: string,
  now = Date.now(),
): Promise<string> {
  const iat = Math.floor(now / 1000);
  const session: AdminSession = {
    role: "admin",
    iat,
    exp: iat + ADMIN_SESSION_TTL_SECONDS,
  };
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)));
  const signingInput = `${HEADER}.${payload}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importKey(secret),
    encoder.encode(signingInput),
  );
  return `${signingInput}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * Verify a token's signature, expiry and role. Returns the session, or null
 * for anything invalid. Never throws.
 */
export async function verifyAdminToken(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
): Promise<AdminSession | null> {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  // Only our own header is accepted, which rules out `alg: none` and friends.
  if (header !== HEADER) return null;

  const signatureBytes = fromBase64Url(signature);
  if (!signatureBytes) return null;

  try {
    // HMAC verify compares in constant time.
    const valid = await crypto.subtle.verify(
      "HMAC",
      await importKey(secret),
      signatureBytes,
      encoder.encode(`${header}.${payload}`),
    );
    if (!valid) return null;

    const payloadBytes = fromBase64Url(payload);
    if (!payloadBytes) return null;
    const claims: unknown = JSON.parse(decoder.decode(payloadBytes));
    if (!isAdminSession(claims)) return null;
    if (claims.exp <= Math.floor(now / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

function isAdminSession(value: unknown): value is AdminSession {
  if (typeof value !== "object" || value === null) return false;
  const claims = value as Record<string, unknown>;
  return (
    claims.role === "admin" &&
    Number.isInteger(claims.iat) &&
    Number.isInteger(claims.exp)
  );
}

/** The signing secret from the environment, or undefined when unusable. */
export function readSessionSecret(): string | undefined {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : undefined;
}
