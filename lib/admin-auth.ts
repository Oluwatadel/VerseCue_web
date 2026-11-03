/**
 * Minimal MVP session auth for the /admin waitlist dashboard.
 *
 * This is a single shared-password gate, not a full authentication
 * system: there are no user accounts, no password hashing/salting on
 * disk (the password lives only in an env var), and no rate limiting
 * on login attempts. It is enough to keep the waitlist data out of
 * casual/unauthenticated reach for an MVP, but it should be replaced
 * with a proper auth provider (e.g. NextAuth, Clerk) plus rate
 * limiting before this handles real production traffic.
 *
 * Uses the Web Crypto API (crypto.subtle) rather than Node's `crypto`
 * module so the same code runs in both the Node.js API route runtime
 * and the Edge runtime used by middleware.
 */

export const ADMIN_SESSION_COOKIE = "vc_admin_session";
const DEFAULT_TTL_SECONDS = 60 * 60 * 8; // 8 hours

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(
  secret: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + ttlSeconds * 1000 });
  const payloadB64 = base64UrlEncode(encoder.encode(payload));
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  return `${payloadB64}.${signatureB64}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  secret: string
): Promise<boolean> {
  if (!token || token.length > 2048 || token.split(".").length !== 2) return false;
  const [payloadB64, signatureB64] = token.split(".");
  if (!payloadB64 || !signatureB64) return false;

  try {
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signatureB64) as BufferSource,
      encoder.encode(payloadB64)
    );
    if (!valid) return false;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

/** Constant-time string comparison to avoid trivial password timing attacks. */
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}
