import { Redis } from "@upstash/redis";
import { SeatingPlan } from "@/types/seating";

/** Shared plans expire 90 days after their last write. */
export const SHARE_TTL_SECONDS = 90 * 24 * 60 * 60;

const KEY_PREFIX = "share:";

// The Upstash/Vercel integration exposes the REST URL/token under a few possible
// env names depending on how it was provisioned. Accept any of them so the same
// code works locally and on Vercel without hand-editing.
function readEnv(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

const REST_URL = readEnv([
  "UPSTASH_REDIS_REST_KV_REST_API_URL",
  "UPSTASH_REDIS_REST_URL",
  "KV_REST_API_URL",
]);

const REST_TOKEN = readEnv([
  "UPSTASH_REDIS_REST_KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_TOKEN",
]);

let client: Redis | null = null;

/** Returns the Redis client, or null when storage is not configured. */
function getClient(): Redis | null {
  if (client) return client;
  if (!REST_URL || !REST_TOKEN) return null;
  client = new Redis({ url: REST_URL, token: REST_TOKEN });
  return client;
}

/** True when share storage is configured (env present). Callers surface a clear error otherwise. */
export function isShareStorageConfigured(): boolean {
  return Boolean(REST_URL && REST_TOKEN);
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
  const redis = getClient();
  if (!redis) throw new Error("share_storage_unavailable");
  await redis.set(`${KEY_PREFIX}${id}`, JSON.stringify(plan), { ex: SHARE_TTL_SECONDS });
}

/** Removes a shared plan by id (e.g. when its event is deleted). No-op if unconfigured. */
export async function deleteSharedPlan(id: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  await redis.del(`${KEY_PREFIX}${id}`);
}

/** Loads a shared plan by id, or null if it does not exist / has expired. */
export async function loadSharedPlan(id: string): Promise<SeatingPlan | null> {
  const redis = getClient();
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
