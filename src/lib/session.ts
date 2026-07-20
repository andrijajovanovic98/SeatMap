import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SessionPayload, readToken } from "@/lib/auth";

/**
 * Reads the verified session from the request cookie, or null when not signed in.
 * Route handlers must take the username from here — never from the request body —
 * so a client cannot ask for another user's account data.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return readToken(token, secret);
}
