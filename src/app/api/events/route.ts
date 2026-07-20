import { NextResponse } from "next/server";
import { isAccountStorageConfigured, loadAccount, saveAccount } from "@/lib/accountStore";
import { getSession } from "@/lib/session";
import { isValidPlan, migratePlan } from "@/lib/storage";
import { AccountData, SeatingPlan } from "@/types/seating";

export const runtime = "nodejs";

// The whole account (all events + comments) is small, but cap generously.
const MAX_BODY_BYTES = 5_000_000;

/** Loads the signed-in user's own account document. The username comes from the session only. */
export async function GET() {
  if (!isAccountStorageConfigured()) {
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const account = await loadAccount(session.sub);
    return NextResponse.json({ ok: true, account });
  } catch {
    return NextResponse.json({ ok: false, error: "storage_error" }, { status: 502 });
  }
}

/** Persists the signed-in user's own account document. */
export async function PUT(req: Request) {
  if (!isAccountStorageConfigured()) {
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const data = body as Partial<AccountData>;
  if (!data || !Array.isArray(data.events)) {
    return NextResponse.json({ ok: false, error: "invalid_account" }, { status: 400 });
  }

  // Validate + migrate each event; reject the whole write if any event is malformed.
  const events: SeatingPlan[] = [];
  for (const ev of data.events) {
    if (!isValidPlan(ev)) {
      return NextResponse.json({ ok: false, error: "invalid_plan" }, { status: 400 });
    }
    events.push(migratePlan(ev as SeatingPlan));
  }

  const account: AccountData = {
    version: 1,
    activeEventId: typeof data.activeEventId === "string" ? data.activeEventId : null,
    events,
    comments:
      data.comments && typeof data.comments === "object" ? (data.comments as AccountData["comments"]) : {},
    updatedAt: new Date().toISOString(),
  };

  try {
    await saveAccount(session.sub, account);
  } catch {
    return NextResponse.json({ ok: false, error: "storage_error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, updatedAt: account.updatedAt });
}
