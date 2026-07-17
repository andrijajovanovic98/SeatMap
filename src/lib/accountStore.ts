import { getRedis, isRedisConfigured } from "@/lib/redisClient";
import { AccountData } from "@/types/seating";

// Single shared login → one fixed account key. No TTL: account data must not expire.
const ACCOUNT_KEY = "account:default:v1";

/** True when account storage is configured (Redis env present). */
export function isAccountStorageConfigured(): boolean {
  return isRedisConfigured();
}

/** Persists the whole account document (no expiry). Throws if storage is unavailable. */
export async function saveAccount(data: AccountData): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("account_storage_unavailable");
  await redis.set(ACCOUNT_KEY, JSON.stringify(data));
}

/** Loads the account document, or null if nothing has been saved yet. */
export async function loadAccount(): Promise<AccountData | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get<string | AccountData>(ACCOUNT_KEY);
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
