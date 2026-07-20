import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Reports who is signed in, so the UI can show admin-only controls.
 * Hiding a button is cosmetic only — /api/users re-checks the role on every call.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, username: session.sub, role: session.role });
}
