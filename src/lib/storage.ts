import { SeatingPlan } from "@/types/seating";

export const STORAGE_KEY = "seatflow.plan.v1";

export function loadPlan(): SeatingPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidPlan(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePlan(plan: SeatingPlan) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // storage unavailable or full — silently ignore, matches single-user local-only scope
  }
}

export function clearPlan() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function isValidPlan(data: unknown): data is SeatingPlan {
  if (!data || typeof data !== "object") return false;
  const p = data as Record<string, unknown>;
  return (
    typeof p.eventName === "string" &&
    typeof p.room === "object" &&
    p.room !== null &&
    Array.isArray(p.tables) &&
    Array.isArray(p.floorElements) &&
    Array.isArray(p.guests)
  );
}
