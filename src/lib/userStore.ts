import { getRedis, isRedisConfigured } from "@/lib/redisClient";

const USER_KEY_PREFIX = "user:";
const USER_INDEX_KEY = "users:v1";

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

export type UserRole = "admin" | "user";

/** A stored user record. `passwordHash`/`salt` never leave the server. */
export type UserRecord = {
  username: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  createdAt: string;
};

/** The safe projection of a user, for API responses and the admin list. */
export type PublicUser = {
  username: string;
  role: UserRole;
  createdAt: string;
};

/** Usernames are lowercase, so lookups and uniqueness are case-insensitive. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Usernames must be short, url-safe and predictable: letters, digits, dot, dash, underscore. */
export function isValidUsername(raw: string): boolean {
  return /^[a-z0-9._-]{3,32}$/.test(normalizeUsername(raw));
}

/** Minimum viable password policy; the admin picks passwords by hand for a handful of users. */
export function isValidPassword(raw: string): boolean {
  return typeof raw === "string" && raw.length >= 8 && raw.length <= 200;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return { username: user.username, role: user.role, createdAt: user.createdAt };
}

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/** Derives a PBKDF2-SHA256 hash of `password` with `saltHex`, hex-encoded. */
async function derivePasswordHash(password: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const salt = new Uint8Array(saltHex.match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? []);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    HASH_BITS
  );
  return toHex(new Uint8Array(bits));
}

/** Constant-time comparison, so a wrong hash cannot be discovered byte by byte. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

/** True when user storage is configured (Redis env present). */
export function isUserStorageConfigured(): boolean {
  return isRedisConfigured();
}

/** Loads a single user by username, or null when unknown. */
export async function loadUser(rawUsername: string): Promise<UserRecord | null> {
  const redis = getRedis();
  if (!redis) return null;
  const username = normalizeUsername(rawUsername);
  const raw = await redis.get<string | UserRecord>(`${USER_KEY_PREFIX}${username}`);
  if (!raw) return null;
  // Upstash may auto-deserialize JSON depending on how it was stored; handle both.
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as UserRecord;
    } catch {
      return null;
    }
  }
  return raw;
}

/** Lists every user, newest first. Skips index entries whose record is missing. */
export async function listUsers(): Promise<PublicUser[]> {
  const redis = getRedis();
  if (!redis) return [];
  const usernames = await redis.smembers(USER_INDEX_KEY);
  const users: PublicUser[] = [];
  for (const username of usernames) {
    const user = await loadUser(username);
    if (user) users.push(toPublicUser(user));
  }
  return users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** True when no user has been created yet — the app is still on env-only bootstrap login. */
export async function hasAnyUser(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  return (await redis.scard(USER_INDEX_KEY)) > 0;
}

/**
 * Creates a user. Throws `user_exists` if the username is taken, so a create can
 * never silently overwrite an existing account (and its data).
 */
export async function createUser(
  rawUsername: string,
  password: string,
  role: UserRole
): Promise<PublicUser> {
  const redis = getRedis();
  if (!redis) throw new Error("user_storage_unavailable");

  const username = normalizeUsername(rawUsername);
  if (await loadUser(username)) throw new Error("user_exists");

  const salt = toHex(crypto.getRandomValues(new Uint8Array(SALT_BYTES)));
  const user: UserRecord = {
    username,
    passwordHash: await derivePasswordHash(password, salt),
    salt,
    role,
    createdAt: new Date().toISOString(),
  };

  await redis.set(`${USER_KEY_PREFIX}${username}`, JSON.stringify(user));
  await redis.sadd(USER_INDEX_KEY, username);
  return toPublicUser(user);
}

/** Removes a user record and its index entry. Account data is deleted separately by the caller. */
export async function deleteUser(rawUsername: string): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("user_storage_unavailable");
  const username = normalizeUsername(rawUsername);
  await redis.del(`${USER_KEY_PREFIX}${username}`);
  await redis.srem(USER_INDEX_KEY, username);
}

/** Verifies a password against a stored user. Returns the user on success, else null. */
export async function verifyUserPassword(
  rawUsername: string,
  password: string
): Promise<UserRecord | null> {
  const user = await loadUser(rawUsername);
  if (!user) return null;
  const candidate = await derivePasswordHash(password, user.salt);
  return timingSafeEqual(candidate, user.passwordHash) ? user : null;
}
