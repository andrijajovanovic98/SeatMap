"use client";

import { createBlankPlan, createDemoPlan } from "@/lib/demoPlan";
import { PlanAction, planReducer } from "@/lib/planReducer";
import {
  applyAccountData,
  claimCacheFor,
  collectAccountData,
  deleteEvent as deleteEventStorage,
  getEventShareId,
  loadActiveEventId,
  loadEvent,
  loadEventsIndex,
  migrateToMultiEvent,
  saveActiveEventId,
  saveEvent,
  setEventShareId as setEventShareIdStorage,
} from "@/lib/storage";
import { EventMeta, SeatingPlan } from "@/types/seating";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type SaveStatus = "idle" | "saving" | "saved";
export type SyncStatus = "synced" | "syncing" | "offline";

type PlanContextValue = {
  plan: SeatingPlan;
  dispatch: (action: PlanAction) => void;
  saveStatus: SaveStatus;
  syncStatus: SyncStatus;
  undo: () => void;
  canUndo: boolean;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  // Multi-event
  events: EventMeta[];
  activeEventId: string;
  switchEvent: (id: string) => void;
  createEvent: (name: string) => void;
  addEvent: (plan: SeatingPlan) => void;
  deleteEvent: (id: string) => void;
  setEventShareId: (id: string, shareId: string | undefined) => void;
  /** Ask the provider to push the whole account to the server (debounced). */
  requestSync: () => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);

const HISTORY_LIMIT = 50;
const SAVE_DEBOUNCE_MS = 500;
const SYNC_DEBOUNCE_MS = 1500;
const SYNC_RETRY_MS = 15000;

/** Resolves the initial plan + events index, running the one-time legacy migration. */
function bootstrap(): { plan: SeatingPlan; events: EventMeta[] } {
  migrateToMultiEvent();
  const events = loadEventsIndex();

  if (events.length === 0) {
    // Brand-new user (or nothing to migrate): seed a demo event.
    const demo = createDemoPlan();
    saveEvent(demo);
    saveActiveEventId(demo.id);
    return { plan: demo, events: loadEventsIndex() };
  }

  const activeId = loadActiveEventId() ?? events[0].id;
  const plan = loadEvent(activeId) ?? loadEvent(events[0].id);
  if (plan) return { plan, events };

  // Index row exists but the plan blob is gone — reseed a demo.
  const demo = createDemoPlan();
  saveEvent(demo);
  saveActiveEventId(demo.id);
  return { plan: demo, events: loadEventsIndex() };
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [{ plan: initialPlan, events: initialEvents }] = useState(bootstrap);
  const [plan, setPlan] = useState<SeatingPlan>(initialPlan);
  const [events, setEvents] = useState<EventMeta[]>(initialEvents);
  const [activeEventId, setActiveEventId] = useState<string>(initialPlan.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [canUndo, setCanUndo] = useState(false);
  const historyRef = useRef<SeatingPlan[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  // Always-current plan ref so switch/delete can flush without stale closures.
  const planRef = useRef(plan);
  useEffect(() => {
    planRef.current = plan;
  }, [plan]);

  const dispatch = useCallback((action: PlanAction) => {
    setPlan((prev) => {
      const next = planReducer(prev, action);
      if (next !== prev) {
        historyRef.current = [...historyRef.current, prev].slice(-HISTORY_LIMIT);
        setCanUndo(true);
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPlan((current) => {
      const history = historyRef.current;
      if (history.length === 0) return current;
      const previous = history[history.length - 1];
      historyRef.current = history.slice(0, -1);
      setCanUndo(historyRef.current.length > 0);
      return previous;
    });
  }, []);

  // --- Server sync ---------------------------------------------------------

  // Holds the latest pushToServer so the retry timer can call it without a
  // self-referential closure (keeps the callback stable).
  const pushRef = useRef<() => void>(() => {});

  /** Pushes the whole account (from the local cache) to the server. */
  const pushToServer = useCallback(async () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setSyncStatus("syncing");
    try {
      const account = collectAccountData();
      const res = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account),
      });
      if (!res.ok) throw new Error("sync_failed");
      setSyncStatus("synced");
    } catch {
      // Offline / server error: keep working from the local cache, retry later.
      setSyncStatus("offline");
      if (!retryTimerRef.current) {
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          pushRef.current();
        }, SYNC_RETRY_MS);
      }
    }
  }, []);

  useEffect(() => {
    pushRef.current = pushToServer;
  }, [pushToServer]);

  /** Debounced request to push the account to the server. */
  const requestSync = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      pushToServer();
    }, SYNC_DEBOUNCE_MS);
  }, [pushToServer]);

  // Debounced autosave of the active plan to its own key (also refreshes the index
  // row) and requests a server sync of the whole account.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const stamped = { ...plan, updatedAt: new Date().toISOString() };
      saveEvent(stamped);
      setEvents(loadEventsIndex());
      setSaveStatus("saved");
      requestSync();
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [plan, requestSync]);

  // On mount: the server is the source of truth. Load it into the local cache,
  // or push the current local cache up if the account is empty (first ever sync).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Establish who is signed in first. If this browser's cache belongs to a
        // different user, drop it before the sync below could upload their plans
        // into this account.
        let cacheWasWiped = false;
        try {
          const meRes = await fetch("/api/me");
          if (meRes.ok) {
            const me = (await meRes.json()) as { username?: string };
            if (me.username) cacheWasWiped = claimCacheFor(me.username);
          }
        } catch {
          // Identity unknown: fall through and let the server copy win below.
        }
        if (cancelled) return;

        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("load_failed");
        const data = (await res.json()) as {
          ok: boolean;
          account: import("@/types/seating").AccountData | null;
        };
        if (cancelled) return;
        if (data.account && data.account.events.length > 0) {
          // Server wins: mirror into the local cache, then re-read into state.
          applyAccountData(data.account);
          const events = loadEventsIndex();
          const activeId = loadActiveEventId() ?? events[0]?.id;
          const nextPlan = activeId ? loadEvent(activeId) : null;
          if (nextPlan) {
            setEvents(events);
            setActiveEventId(nextPlan.id);
            historyRef.current = [];
            setCanUndo(false);
            setSelectedId(null);
            setPlan(nextPlan);
          }
          setSyncStatus("synced");
        } else if (cacheWasWiped) {
          // The cache we just discarded belonged to someone else, so there is nothing
          // of this user's to preserve. Starting empty is correct — uploading here
          // would hand them the previous user's plans. State still holds the plan read
          // from the old cache at init, so replace it with a fresh blank one.
          const blank = createBlankPlan("Új rendezvény");
          saveEvent(blank);
          saveActiveEventId(blank.id);
          setEvents(loadEventsIndex());
          setActiveEventId(blank.id);
          historyRef.current = [];
          setCanUndo(false);
          setSelectedId(null);
          setPlan(blank);
          setSyncStatus("synced");
        } else {
          // Empty account: push the current local cache up so nothing is lost.
          await pushToServer();
        }
      } catch {
        if (!cancelled) setSyncStatus("offline");
      }
    })();
    return () => {
      cancelled = true;
    };
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Immediately persist the current plan (used before switching away). */
  const flush = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveEvent({ ...planRef.current, updatedAt: new Date().toISOString() });
  }, []);

  const loadInto = useCallback((next: SeatingPlan) => {
    historyRef.current = [];
    setCanUndo(false);
    setSelectedId(null);
    setPlan(next);
  }, []);

  const switchEvent = useCallback(
    (id: string) => {
      if (id === activeEventId) return;
      flush();
      const next = loadEvent(id);
      if (!next) return;
      saveActiveEventId(id);
      setActiveEventId(id);
      loadInto(next);
      setEvents(loadEventsIndex());
      requestSync();
    },
    [activeEventId, flush, loadInto, requestSync]
  );

  const addEvent = useCallback(
    (next: SeatingPlan) => {
      flush();
      saveEvent(next);
      saveActiveEventId(next.id);
      setActiveEventId(next.id);
      loadInto(next);
      setEvents(loadEventsIndex());
      requestSync();
    },
    [flush, loadInto, requestSync]
  );

  const createEvent = useCallback(
    (name: string) => {
      addEvent(createBlankPlan(name));
    },
    [addEvent]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      // Best-effort server-side removal of the shared link for this event.
      const shareId = getEventShareId(id);
      if (shareId) {
        fetch(`/api/share/${shareId}`, { method: "DELETE" }).catch(() => {});
      }

      const remaining = deleteEventStorage(id);

      if (id !== activeEventId) {
        setEvents(remaining);
        requestSync();
        return;
      }

      // Deleted the active event — switch to another, or seed a fresh one.
      if (remaining.length > 0) {
        const nextId = remaining[0].id;
        const next = loadEvent(nextId);
        if (next) {
          saveActiveEventId(nextId);
          setActiveEventId(nextId);
          loadInto(next);
          setEvents(remaining);
          requestSync();
          return;
        }
      }
      const demo = createDemoPlan();
      saveEvent(demo);
      saveActiveEventId(demo.id);
      setActiveEventId(demo.id);
      loadInto(demo);
      setEvents(loadEventsIndex());
      requestSync();
    },
    [activeEventId, loadInto, requestSync]
  );

  const setEventShareId = useCallback(
    (id: string, shareId: string | undefined) => {
      setEventShareIdStorage(id, shareId);
      setEvents(loadEventsIndex());
      requestSync();
    },
    [requestSync]
  );

  // Clean up any pending sync/retry timers on unmount.
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const value = useMemo<PlanContextValue>(
    () => ({
      plan,
      dispatch,
      saveStatus,
      syncStatus,
      undo,
      canUndo,
      selectedId,
      setSelectedId,
      events,
      activeEventId,
      switchEvent,
      createEvent,
      addEvent,
      deleteEvent,
      setEventShareId,
      requestSync,
    }),
    [
      plan,
      dispatch,
      saveStatus,
      syncStatus,
      undo,
      canUndo,
      selectedId,
      events,
      activeEventId,
      switchEvent,
      createEvent,
      addEvent,
      deleteEvent,
      setEventShareId,
      requestSync,
    ]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
