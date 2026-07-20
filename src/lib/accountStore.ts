import { getRedis, isRedisConfigured } from "@/lib/redisClient";
import { AccountData } from "@/types/seating";

// Each user owns one account document, keyed by username. No TTL: account data must not expire.
function accountKey(username: string): string {
  return `account:${username}:v1`;
}

/**
 * The pre-multi-user key, when a single shared login owned all data. Kept so the
 * first admin can adopt the existing plans; never written to again.
 */
export const LEGACY_ACCOUNT_KEY = "account:default:v1";

/** True when account storage is configured (Redis env present). */
export function isAccountStorageConfigured(): boolean {
  return isRedisConfigured();
}

function parseAccount(raw: string | AccountData | null): AccountData | null {
  if (!raw) return null;
  // Upstash may auto-deserialize JSON depending on how it was stored; handle both.
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as AccountData;
    } catch {
      return null;
    }
  }
  return raw;
}

/** Persists a user's account document (no expiry). Throws if storage is unavailable. */
export async function saveAccount(username: string, data: AccountData): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("account_storage_unavailable");
  await redis.set(accountKey(username), JSON.stringify(data));
}

/** Loads a user's account document, or null if they have not saved anything yet. */
export async function loadAccount(username: string): Promise<AccountData | null> {
  const redis = getRedis();
  if (!redis) return null;
  return parseAccount(await redis.get<string | AccountData>(accountKey(username)));
}

/** Deletes a user's account document, used when their user is removed. */
export async function deleteAccount(username: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(accountKey(username));
}

/** Loads the legacy shared-login account, or null when there is none. */
export async function loadLegacyAccount(): Promise<AccountData | null> {
  const redis = getRedis();
  if (!redis) return null;
  return parseAccount(await redis.get<string | AccountData>(LEGACY_ACCOUNT_KEY));
}

/**
 * Copies the legacy shared account to `username` the first time that user logs in,
 * so the data predating multi-user support stays reachable. The legacy key is left
 * in place as a backup, and an existing account is never overwritten.
 */
export async function adoptLegacyAccount(username: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  if (await loadAccount(username)) return;
  const legacy = await loadLegacyAccount();
  if (!legacy) return;
  await saveAccount(username, legacy);
}
