export const SESSION_COOKIE_NAME = "seatflow_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

type SessionPayload = {
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
export async function signToken(secret: string, maxAgeSeconds = SESSION_MAX_AGE_SECONDS): Promise<string> {
  const payload: SessionPayload = { exp: Math.floor(Date.now() / 1000) + maxAgeSeconds };
  const payloadPart = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signaturePart = base64UrlEncode(await hmac(secret, payloadPart));
  return `${payloadPart}.${signaturePart}`;
}

/** Verifies a session token's signature and expiry. Returns true only if valid and unexpired. */
export async function verifyToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadPart, signaturePart] = parts;

  const expectedSignature = base64UrlEncode(await hmac(secret, payloadPart));
  if (!timingSafeEqual(signaturePart, expectedSignature)) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart))) as SessionPayload;
    if (typeof payload.exp !== "number") return false;
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
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
