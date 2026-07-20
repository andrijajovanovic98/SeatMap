import { NextResponse } from "next/server";
import { deleteAccount, loadAccount, saveAccount } from "@/lib/accountStore";
import { createStarterPlan } from "@/lib/demoPlan";
import { getSession } from "@/lib/session";
import {
  createUser,
  deleteUser,
  isUserStorageConfigured,
  isValidPassword,
  isValidUsername,
  listUsers,
  normalizeUsername,
} from "@/lib/userStore";

export const runtime = "nodejs";

/**
 * Middleware only proves someone is signed in, so every handler here re-checks the
 * role from the signed session before touching the user table.
 */
async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }) };
  if (session.role !== "admin") {
    return { error: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }) };
  }
  return { session };
}

/** Lists all users. Admin only. Password hashes are never included. */
export async function GET() {
  if (!isUserStorageConfigured()) {
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  }
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    return NextResponse.json({ ok: true, users: await listUsers(), currentUser: session.sub });
  } catch {
    return NextResponse.json({ ok: false, error: "storage_error" }, { status: 502 });
  }
}

/** Creates a user with an admin-chosen password. Admin only. */
export async function POST(req: Request) {
  if (!isUserStorageConfigured()) {
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  }
  const { error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const { username, password, role } = (body ?? {}) as {
    username?: unknown;
    password?: unknown;
    role?: unknown;
  };

  if (typeof username !== "string" || !isValidUsername(username)) {
    return NextResponse.json({ ok: false, error: "invalid_username" }, { status: 400 });
  }
  if (typeof password !== "string" || !isValidPassword(password)) {
    return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 400 });
  }

  try {
    const user = await createUser(username, password, role === "admin" ? "admin" : "user");

    // Seed the account server-side so the new user starts from a known two-table plan.
    // Without this their account reads as empty and the client would upload whatever
    // happens to sit in that browser's local cache — possibly a previous user's work.
    // Admins are provisioned for managing users rather than seating, so they get an
    // empty account instead of a starter plan they would only have to delete.
    //
    // Never seed over an account that already holds data: a username can already own
    // events before its user record exists — e.g. promoting the env-credential login
    // to a real user — and overwriting would destroy their plans.
    const existing = await loadAccount(user.username);
    if (!existing || existing.events.length === 0) {
      const starter = user.role === "admin" ? null : createStarterPlan("Új rendezvény");
      await saveAccount(user.username, {
        version: 1,
        activeEventId: starter?.id ?? null,
        events: starter ? [starter] : [],
        comments: {},
        updatedAt: new Date().toISOString(),
      });
    }
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    if (err instanceof Error && err.message === "user_exists") {
      return NextResponse.json({ ok: false, error: "user_exists" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "storage_error" }, { status: 502 });
  }
}

/** Deletes a user and their seating data. Admin only; an admin cannot delete themselves. */
export async function DELETE(req: Request) {
  if (!isUserStorageConfigured()) {
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  }
  const { error, session } = await requireAdmin();
  if (error) return error;

  const target = normalizeUsername(new URL(req.url).searchParams.get("username") ?? "");
  if (!target) {
    return NextResponse.json({ ok: false, error: "invalid_username" }, { status: 400 });
  }
  // Guards against an admin locking everyone out of the admin page by removing themselves.
  if (target === normalizeUsername(session.sub)) {
    return NextResponse.json({ ok: false, error: "cannot_delete_self" }, { status: 400 });
  }

  try {
    await deleteUser(target);
    await deleteAccount(target);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "storage_error" }, { status: 502 });
  }
}
