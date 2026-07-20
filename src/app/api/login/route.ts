import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SessionRole,
  credentialsMatch,
  signToken,
} from "@/lib/auth";
import { adoptLegacyAccount } from "@/lib/accountStore";
import { hasAnyUser, normalizeUsername, verifyUserPassword } from "@/lib/userStore";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

// Per-instance in-memory attempt counter. Serverless instances each keep their own
// map, so this slows brute-force per instance; Vercel's platform bot/DDoS mitigation
// covers the distributed case.
const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const expectedUsername = process.env.AUTH_USERNAME;
  const expectedPassword = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!expectedUsername || !expectedPassword || !secret) {
    return NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }

  let username = "";
  let password = "";
  try {
    const body = await req.json();
    username = typeof body?.username === "string" ? body.username : "";
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  // Authenticate against the user table first. Until an admin has created the first
  // user, fall back to the AUTH_USERNAME/AUTH_PASSWORD env pair so the owner can always
  // get in and bootstrap. Once users exist, the env pair still works as the admin login.
  let subject: string;
  let role: SessionRole;

  const storedUser = await verifyUserPassword(username, password);
  if (storedUser) {
    subject = storedUser.username;
    role = storedUser.role;
    // If the bootstrap admin was later added to the user table, they still inherit the
    // pre-multi-user plans. `adoptLegacyAccount` skips users who already have an account.
    if (subject === normalizeUsername(expectedUsername)) {
      await adoptLegacyAccount(subject).catch(() => undefined);
    }
  } else if (credentialsMatch(username, password, expectedUsername, expectedPassword)) {
    subject = normalizeUsername(expectedUsername);
    role = "admin";
    // The bootstrap admin inherits the plans created before multi-user support.
    // No-op once they own an account of their own.
    if (!(await hasAnyUser().catch(() => false))) {
      await adoptLegacyAccount(subject).catch(() => undefined);
    }
  } else {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  const token = await signToken(secret, subject, role);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
