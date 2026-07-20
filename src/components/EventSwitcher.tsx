"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { EventMeta } from "@/types/seating";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function EventSwitcher() {
  const { plan, dispatch, events, activeEventId, switchEvent, createEvent, deleteEvent } = usePlan();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<EventMeta | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const sorted = [...events].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1 sm:max-w-xs">
      <div className="flex items-center gap-1">
        <input
          value={plan.eventName}
          onChange={(e) => dispatch({ type: "SET_EVENT_NAME", name: e.target.value })}
          placeholder={t("events.eventNamePlaceholder")}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-gray-700 hover:border-gray-200 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          aria-label={t("events.eventNamePlaceholder")}
        />
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          aria-label={t("events.switchAria")}
          aria-expanded={open}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-72 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <ul className="max-h-72 overflow-y-auto py-1">
            {sorted.map((ev) => {
              const active = ev.id === activeEventId;
              return (
                <li key={ev.id} className="group flex items-center">
                  <button
                    onClick={() => {
                      switchEvent(ev.id);
                      setOpen(false);
                    }}
                    className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm ${
                      active ? "font-semibold text-indigo-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-4 flex-shrink-0">
                      {active && <Check className="h-4 w-4" />}
                    </span>
                    <span className="truncate">{ev.eventName || t("events.untitled")}</span>
                  </button>
                  {/* Hover-gated, so unreachable on touch without touch-action-btn. */}
                  <button
                    onClick={() => setDeleting(ev)}
                    className="touch-action-btn mr-1 flex flex-shrink-0 items-center justify-center rounded p-1.5 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    aria-label={t("events.deleteAria")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={() => {
                createEvent(t("events.newEvent.defaultName"));
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4" />
              {t("events.newEvent")}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={t("events.delete.title")}
        message={t("events.delete.message", {
          name: deleting?.eventName || t("events.untitled"),
        })}
        confirmLabel={t("events.delete.confirm")}
        danger
        onConfirm={() => {
          if (deleting) deleteEvent(deleting.id);
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
