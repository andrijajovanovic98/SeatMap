export const SESSION_COOKIE_NAME = "seatflow_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export type SessionRole = "admin" | "user";

export type SessionPayload = {
  // the logged-in username; the server keys account data off this and never trusts the request body
  sub: string;
  role: SessionRole;
  // expiry timestamp in seconds since epoch
  exp: number;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return new Uint8Array(signature);
}

/** Constant-time comparison of two strings. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

/** Builds a signed session token: base64url(payload).base64url(hmac). */
export async function signToken(
  secret: string,
  subject: string,
  role: SessionRole,
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const payload: SessionPayload = {
    sub: subject,
    role,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const payloadPart = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signaturePart = base64UrlEncode(await hmac(secret, payloadPart));
  return `${payloadPart}.${signaturePart}`;
}

/**
 * Verifies a session token's signature and expiry, returning its payload — or null
 * when the token is missing, tampered with, expired, or predates the `sub` field.
 * Because `role` is inside the signed payload it cannot be forged client-side.
 */
export async function readToken(
  token: string | undefined,
  secret: string
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadPart, signaturePart] = parts;

  const expectedSignature = base64UrlEncode(await hmac(secret, payloadPart));
  if (!timingSafeEqual(signaturePart, expectedSignature)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    // Legacy tokens (issued before per-user accounts) carry no subject: treat them as invalid
    // so their holders re-authenticate and get a token bound to a real user.
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    if (payload.role !== "admin" && payload.role !== "user") return null;
    return payload;
  } catch {
    return null;
  }
}

/** Convenience wrapper for call sites that only need a yes/no answer. */
export async function verifyToken(token: string | undefined, secret: string): Promise<boolean> {
  return (await readToken(token, secret)) !== null;
}

/** Constant-time credential check against configured env values. */
export function credentialsMatch(
  username: string,
  password: string,
  expectedUsername: string,
  expectedPassword: string
): boolean {
  // Evaluate both comparisons regardless of the first result to avoid short-circuit timing leaks.
  const userOk = timingSafeEqual(username, expectedUsername);
  const passOk = timingSafeEqual(password, expectedPassword);
  return userOk && passOk;
}
