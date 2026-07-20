import { generateId } from "@/lib/id";
import {
  AccountData,
  ChildAgeCategory,
  Comment,
  createDefaultChildAgeCategories,
  EventMeta,
  Guest,
  SeatingPlan,
} from "@/types/seating";

// --- Storage keys ---------------------------------------------------------
// Legacy single-plan key (pre multi-event). Read once during migration.
export const LEGACY_PLAN_KEY = "seatflow.plan.v1";
export const LEGACY_SHARE_ID_KEY = "seatflow.share.id";

// Multi-event schema.
export const EVENTS_INDEX_KEY = "seatflow.events.index.v1";
export const ACTIVE_EVENT_KEY = "seatflow.events.active.v1";
const EVENT_KEY_PREFIX = "seatflow.event.v1.";

// Which user the cached plans belong to. Guards the case where two people share a
// browser: without it, the mount-time sync would upload one user's leftover cache
// into the next user's empty account.
const CACHE_OWNER_KEY = "seatflow.cache.owner.v1";

function eventKey(id: string): string {
  return `${EVENT_KEY_PREFIX}${id}`;
}

// --- Plan validation / migration (schema-level, key-agnostic) -------------

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

/**
 * Brings an older stored/imported plan up to the current schema.
 * - Ensures a stable `id` exists (multi-event key).
 * - Ensures `childAgeCategories` exists (seeds defaults if missing).
 * - Converts the legacy fixed `guest.childAge` enum ("under3"/"age3to12") into a
 *   `guest.childAgeId` referencing the seeded default categories, so no data is lost.
 * Idempotent: a plan that already matches the current schema passes through unchanged.
 */
export function migratePlan(plan: SeatingPlan): SeatingPlan {
  const id = plan.id || generateId("event");

  const hasCategories = Array.isArray(plan.childAgeCategories) && plan.childAgeCategories.length > 0;
  const categories: ChildAgeCategory[] = hasCategories
    ? plan.childAgeCategories
    : createDefaultChildAgeCategories();

  // Map legacy enum values to the default seeded category ids.
  const legacyMap: Record<string, string> = {
    under3: categories[0]?.id,
    age3to12: categories[1]?.id ?? categories[0]?.id,
  };

  const guests = plan.guests.map((g) => {
    const legacy = (g as { childAge?: string }).childAge;
    if (!legacy) return g;
    // Drop the stray legacy `childAge` field; map it to `childAgeId` if not already set.
    const rest = { ...g } as Guest & { childAge?: string };
    delete rest.childAge;
    if (!rest.childAgeId) rest.childAgeId = legacyMap[legacy];
    return rest;
  });

  return { ...plan, id, childAgeCategories: categories, guests };
}

// --- Events index ---------------------------------------------------------

export function loadEventsIndex(): EventMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(EVENTS_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is EventMeta => e && typeof e.id === "string" && typeof e.eventName === "string"
    );
  } catch {
    return [];
  }
}

export function saveEventsIndex(list: EventMeta[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EVENTS_INDEX_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable or full; ignore, matches single-user local-only scope
  }
}

function toMeta(plan: SeatingPlan, shareId?: string): EventMeta {
  return { id: plan.id, eventName: plan.eventName, updatedAt: plan.updatedAt, shareId };
}

/** Inserts or updates the index row for a plan, preserving any existing shareId. */
export function upsertEventMeta(plan: SeatingPlan) {
  const index = loadEventsIndex();
  const existing = index.find((e) => e.id === plan.id);
  const next = toMeta(plan, existing?.shareId);
  const merged = existing
    ? index.map((e) => (e.id === plan.id ? next : e))
    : [...index, next];
  saveEventsIndex(merged);
}

export function setEventShareId(id: string, shareId: string | undefined) {
  const index = loadEventsIndex();
  saveEventsIndex(index.map((e) => (e.id === id ? { ...e, shareId } : e)));
}

export function getEventShareId(id: string): string | undefined {
  return loadEventsIndex().find((e) => e.id === id)?.shareId;
}

// --- Active event pointer -------------------------------------------------

export function loadActiveEventId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_EVENT_KEY);
}

export function saveActiveEventId(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_EVENT_KEY, id);
  } catch {
    // ignore
  }
}

// --- Per-event plan storage ----------------------------------------------

export function loadEvent(id: string): SeatingPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(eventKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidPlan(parsed)) return null;
    return migratePlan(parsed);
  } catch {
    return null;
  }
}

/** Persists a plan under its own key and keeps the index row in sync. */
export function saveEvent(plan: SeatingPlan) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(eventKey(plan.id), JSON.stringify(plan));
    upsertEventMeta(plan);
  } catch {
    // ignore
  }
}

/** Removes a plan and its index row. Returns the updated index. */
export function deleteEvent(id: string): EventMeta[] {
  if (typeof window === "undefined") return [];
  try {
    window.localStorage.removeItem(eventKey(id));
    window.localStorage.removeItem(commentsKey(id));
  } catch {
    // ignore
  }
  const remaining = loadEventsIndex().filter((e) => e.id !== id);
  saveEventsIndex(remaining);
  return remaining;
}

// --- Per-event comments key (used by CommentContext) ----------------------

const COMMENTS_KEY_PREFIX = "seatflow.comments.v1.";
export const LEGACY_COMMENTS_KEY = "seatflow.comments.v1";

export function commentsKey(eventId: string): string {
  return `${COMMENTS_KEY_PREFIX}${eventId}`;
}

export function loadComments(eventId: string): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(commentsKey(eventId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveComments(eventId: string, comments: Comment[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(commentsKey(eventId), JSON.stringify(comments));
  } catch {
    // ignore
  }
}

// --- Account aggregation (localStorage <-> server sync) -------------------

/** Collects the whole account (all events + comments + active id) from localStorage. */
export function collectAccountData(): AccountData {
  const index = loadEventsIndex();
  const events: SeatingPlan[] = [];
  const comments: Record<string, Comment[]> = {};
  for (const meta of index) {
    const plan = loadEvent(meta.id);
    if (plan) {
      events.push(plan);
      const c = loadComments(meta.id);
      if (c.length) comments[meta.id] = c;
    }
  }
  return {
    version: 1,
    activeEventId: loadActiveEventId(),
    events,
    comments,
    updatedAt: new Date().toISOString(),
  };
}

/** Overwrites the local cache with a server account document (server is source of truth). */
export function applyAccountData(data: AccountData) {
  if (typeof window === "undefined") return;
  try {
    // Remove any local events/comments not present on the server, then write the server set.
    const localIndex = loadEventsIndex();
    const serverIds = new Set(data.events.map((e) => e.id));
    for (const meta of localIndex) {
      if (!serverIds.has(meta.id)) {
        window.localStorage.removeItem(eventKey(meta.id));
        window.localStorage.removeItem(commentsKey(meta.id));
      }
    }

    const index: EventMeta[] = [];
    for (const plan of data.events) {
      const migrated = migratePlan(plan);
      window.localStorage.setItem(eventKey(migrated.id), JSON.stringify(migrated));
      // Preserve any shareId the server carried for this event.
      const priorShareId = localIndex.find((m) => m.id === migrated.id)?.shareId;
      index.push({
        id: migrated.id,
        eventName: migrated.eventName,
        updatedAt: migrated.updatedAt,
        shareId: priorShareId,
      });
      saveComments(migrated.id, data.comments?.[migrated.id] ?? []);
    }
    saveEventsIndex(index);

    const active = data.activeEventId && serverIds.has(data.activeEventId)
      ? data.activeEventId
      : index[0]?.id;
    if (active) saveActiveEventId(active);
  } catch {
    // ignore — cache write is best-effort
  }
}

// --- Migration from the legacy single-plan schema -------------------------

/**
 * Migrates the pre-multi-event storage into the events schema, once.
 * If an events index already exists, this is a no-op. Otherwise it adopts the
 * legacy single plan as the first event (no data loss), carries over its share id
 * and comments, and sets it active. Returns the active event id (or null if nothing).
 * Idempotent.
 */
export function migrateToMultiEvent(): string | null {
  if (typeof window === "undefined") return null;

  const existingIndex = loadEventsIndex();
  if (existingIndex.length > 0) {
    return loadActiveEventId() ?? existingIndex[0].id;
  }

  // No index yet — look for a legacy single plan to adopt.
  let legacyPlan: SeatingPlan | null = null;
  try {
    const raw = window.localStorage.getItem(LEGACY_PLAN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidPlan(parsed)) legacyPlan = migratePlan(parsed);
    }
  } catch {
    legacyPlan = null;
  }

  if (!legacyPlan) return null;

  const legacyShareId = window.localStorage.getItem(LEGACY_SHARE_ID_KEY) ?? undefined;

  // Persist as the first event.
  window.localStorage.setItem(eventKey(legacyPlan.id), JSON.stringify(legacyPlan));
  saveEventsIndex([toMeta(legacyPlan, legacyShareId)]);
  saveActiveEventId(legacyPlan.id);

  // Carry legacy comments over to this event, then drop the global key.
  try {
    const legacyComments = window.localStorage.getItem(LEGACY_COMMENTS_KEY);
    if (legacyComments) {
      window.localStorage.setItem(commentsKey(legacyPlan.id), legacyComments);
      window.localStorage.removeItem(LEGACY_COMMENTS_KEY);
    }
  } catch {
    // ignore
  }

  // Clean up the legacy single-plan keys now that they're adopted.
  try {
    window.localStorage.removeItem(LEGACY_PLAN_KEY);
    window.localStorage.removeItem(LEGACY_SHARE_ID_KEY);
  } catch {
    // ignore
  }

  return legacyPlan.id;
}

// --- Cache ownership ------------------------------------------------------

export function getCacheOwner(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CACHE_OWNER_KEY);
  } catch {
    return null;
  }
}

export function setCacheOwner(username: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_OWNER_KEY, username);
  } catch {
    // storage unavailable; the sync path falls back to trusting the server copy
  }
}

/**
 * Ensures the local cache belongs to `username`, discarding it otherwise. Returns
 * true when a wipe happened, so the caller knows the cache no longer holds anything
 * worth pushing to the server.
 *
 * An unlabelled cache holding data is treated as foreign, not as this user's: it was
 * written either by the pre-multi-user build (where every login shared one account)
 * or by a user whose label was cleared. Trusting it would let the sync path upload
 * one account's plans into another's — which is exactly what it did before this
 * check existed. An unlabelled *empty* cache is simply a first visit, so it is only
 * labelled, not reported as a wipe.
 */
export function claimCacheFor(username: string): boolean {
  const previous = getCacheOwner();
  if (previous === username) return false;

  const foreign = previous !== null || loadEventsIndex().length > 0;
  if (foreign) clearLocalAccount();
  setCacheOwner(username);
  return foreign;
}

// --- Sign-out cleanup -----------------------------------------------------

/**
 * Wipes every cached plan, index and comment in this browser.
 * Called on logout: the cache belongs to whoever was signed in, and the next user
 * on this browser must not inherit it — the mount-time sync uploads the local cache
 * whenever the server account is empty, which would hand a new user the previous
 * user's plans. The language preference and unrelated keys are left alone.
 */
export function clearLocalAccount() {
  if (typeof window === "undefined") return;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (
        key === EVENTS_INDEX_KEY ||
        key === ACTIVE_EVENT_KEY ||
        key === CACHE_OWNER_KEY ||
        key === LEGACY_PLAN_KEY ||
        key === LEGACY_SHARE_ID_KEY ||
        key === LEGACY_COMMENTS_KEY ||
        key.startsWith(EVENT_KEY_PREFIX) ||
        key.startsWith(COMMENTS_KEY_PREFIX)
      ) {
        doomed.push(key);
      }
    }
    for (const key of doomed) window.localStorage.removeItem(key);
  } catch {
    // storage unavailable; nothing to clear
  }
}
