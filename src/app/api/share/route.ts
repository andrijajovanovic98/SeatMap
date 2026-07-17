import { NextResponse } from "next/server";
import { isValidPlan, migratePlan } from "@/lib/storage";
import { generateShareId, isShareStorageConfigured, saveSharedPlan } from "@/lib/shareStore";
import { SeatingPlan } from "@/types/seating";

export const runtime = "nodejs";

// Guard against oversized payloads (a very large plan is still only tens of KB).
const MAX_BODY_BYTES = 1_000_000;

/**
 * Creates or updates a shared, read-only copy of a seating plan.
 * Auth-gated by middleware (only the logged-in owner can share).
 * Body: { id?: string, plan: SeatingPlan }. Reusing `id` refreshes the same link.
 */
export async function POST(req: Request) {
  if (!isShareStorageConfigured()) {
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
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

  const { id: rawId, plan } = (body ?? {}) as { id?: unknown; plan?: unknown };

  if (!isValidPlan(plan)) {
    return NextResponse.json({ ok: false, error: "invalid_plan" }, { status: 400 });
  }

  // Reuse a client-supplied id (link refresh) only if it is a plausible token; otherwise mint one.
  const id =
    typeof rawId === "string" && /^[a-z0-9]{6,32}$/.test(rawId) ? rawId : generateShareId();

  try {
    await saveSharedPlan(id, migratePlan(plan as SeatingPlan));
  } catch {
    return NextResponse.json({ ok: false, error: "storage_error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id });
}
