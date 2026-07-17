import { getRedis, isRedisConfigured } from "@/lib/redisClient";
import { SeatingPlan } from "@/types/seating";

/** Shared plans expire 90 days after their last write. */
export const SHARE_TTL_SECONDS = 90 * 24 * 60 * 60;

const KEY_PREFIX = "share:";

/** True when share storage is configured (env present). Callers surface a clear error otherwise. */
export function isShareStorageConfigured(): boolean {
  return isRedisConfigured();
}

/** Generates a short, URL-safe id for a shared plan. */
export function generateShareId(): string {
  // 128 bits of randomness, base36-encoded → ~12-13 url-safe chars, collision-safe at this scope.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let out = "";
  for (const b of bytes) out += b.toString(36).padStart(2, "0");
  return out.slice(0, 12);
}

/** Stores (creates or overwrites) a shared plan under `id`, refreshing its 90-day TTL. */
export async function saveSharedPlan(id: string, plan: SeatingPlan): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("share_storage_unavailable");
  await redis.set(`${KEY_PREFIX}${id}`, JSON.stringify(plan), { ex: SHARE_TTL_SECONDS });
}

/** Removes a shared plan by id (e.g. when its event is deleted). No-op if unconfigured. */
export async function deleteSharedPlan(id: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(`${KEY_PREFIX}${id}`);
}

/** Loads a shared plan by id, or null if it does not exist / has expired. */
export async function loadSharedPlan(id: string): Promise<SeatingPlan | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get<string | SeatingPlan>(`${KEY_PREFIX}${id}`);
  if (!raw) return null;
  // Upstash may auto-deserialize JSON depending on how it was stored; handle both.
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as SeatingPlan;
    } catch {
      return null;
    }
  }
  return raw;
}
