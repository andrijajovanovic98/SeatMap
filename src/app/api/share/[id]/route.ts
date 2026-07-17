import { NextResponse } from "next/server";
import { deleteSharedPlan, isShareStorageConfigured } from "@/lib/shareStore";

export const runtime = "nodejs";

/**
 * Deletes a shared plan. Auth-gated by middleware (only the logged-in owner can
 * delete their links — this route is under /api/share which is NOT excluded).
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isShareStorageConfigured()) {
    return NextResponse.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
  }
  if (!/^[a-z0-9]{6,32}$/.test(id)) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }
  try {
    await deleteSharedPlan(id);
  } catch {
    return NextResponse.json({ ok: false, error: "storage_error" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
