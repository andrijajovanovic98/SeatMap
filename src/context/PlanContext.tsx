"use client";

import { createBlankPlan, createDemoPlan } from "@/lib/demoPlan";
import { PlanAction, planReducer } from "@/lib/planReducer";
import {
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

type PlanContextValue = {
  plan: SeatingPlan;
  dispatch: (action: PlanAction) => void;
  saveStatus: SaveStatus;
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
};

const PlanContext = createContext<PlanContextValue | null>(null);

const HISTORY_LIMIT = 50;
const SAVE_DEBOUNCE_MS = 500;

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
  const [canUndo, setCanUndo] = useState(false);
  const historyRef = useRef<SeatingPlan[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Debounced autosave of the active plan to its own key (also refreshes the index row).
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
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [plan]);

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
    },
    [activeEventId, flush, loadInto]
  );

  const addEvent = useCallback(
    (next: SeatingPlan) => {
      flush();
      saveEvent(next);
      saveActiveEventId(next.id);
      setActiveEventId(next.id);
      loadInto(next);
      setEvents(loadEventsIndex());
    },
    [flush, loadInto]
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
          return;
        }
      }
      const demo = createDemoPlan();
      saveEvent(demo);
      saveActiveEventId(demo.id);
      setActiveEventId(demo.id);
      loadInto(demo);
      setEvents(loadEventsIndex());
    },
    [activeEventId, loadInto]
  );

  const setEventShareId = useCallback((id: string, shareId: string | undefined) => {
    setEventShareIdStorage(id, shareId);
    setEvents(loadEventsIndex());
  }, []);

  const value = useMemo<PlanContextValue>(
    () => ({
      plan,
      dispatch,
      saveStatus,
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
    }),
    [
      plan,
      dispatch,
      saveStatus,
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
    ]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
