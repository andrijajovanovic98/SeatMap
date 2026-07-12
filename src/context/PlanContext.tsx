"use client";

import { createDemoPlan } from "@/lib/demoPlan";
import { PlanAction, planReducer } from "@/lib/planReducer";
import { loadPlan, savePlan } from "@/lib/storage";
import { SeatingPlan } from "@/types/seating";
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
  replacePlan: (plan: SeatingPlan) => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);

const HISTORY_LIMIT = 50;
const SAVE_DEBOUNCE_MS = 500;

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<SeatingPlan>(() => loadPlan() ?? createDemoPlan());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [canUndo, setCanUndo] = useState(false);
  const historyRef = useRef<SeatingPlan[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      savePlan({ ...plan, updatedAt: new Date().toISOString() });
      setSaveStatus("saved");
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [plan]);

  const replacePlan = useCallback((next: SeatingPlan) => {
    historyRef.current = [];
    setCanUndo(false);
    setSelectedId(null);
    setPlan(next);
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
      replacePlan,
    }),
    [plan, dispatch, saveStatus, undo, canUndo, selectedId, replacePlan]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
