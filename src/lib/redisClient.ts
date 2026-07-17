import { Redis } from "@upstash/redis";

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

/** Returns the shared Redis client, or null when storage is not configured. */
export function getRedis(): Redis | null {
  if (client) return client;
  if (!REST_URL || !REST_TOKEN) return null;
  client = new Redis({ url: REST_URL, token: REST_TOKEN });
  return client;
}

/** True when Redis storage is configured (env present). Callers surface a clear error otherwise. */
export function isRedisConfigured(): boolean {
  return Boolean(REST_URL && REST_TOKEN);
}
