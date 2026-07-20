"use client";

import { AppHeader } from "@/components/AppHeader";
import { EditorSidebar } from "@/components/EditorSidebar";
import { FloorCanvas } from "@/components/FloorCanvas";
import { GuestList } from "@/components/GuestList";
import { PrintView } from "@/components/PrintView";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { SeatDialog } from "@/components/SeatDialog";
import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

export function SeatFlowApp() {
  const { plan, dispatch, selectedId, setSelectedId, undo } = usePlan();
  const { t } = useLanguage();
  const [activeSeatId, setActiveSeatId] = useState<string | null>(null);
  const [showToolbarDrawer, setShowToolbarDrawer] = useState(false);
  const [showGuestDrawer, setShowGuestDrawer] = useState(false);
  // On touch the properties sheet covers most of the canvas, so a single tap only
  // selects (showing the highlight) and a double tap opens the sheet. Desktop is
  // unaffected: its panel sits beside the canvas and follows selectedId directly.
  const [showPropertiesSheet, setShowPropertiesSheet] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isTyping) return;

      if (e.key === "Delete" && selectedId) {
        dispatch({ type: "DELETE_ITEM", id: selectedId });
        setSelectedId(null);
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setActiveSeatId(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selectedId) {
        e.preventDefault();
        dispatch({ type: "DUPLICATE_ITEM", id: selectedId, copySuffix: t("properties.copySuffix") });
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (selectedId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 5;
        const deltas: Record<string, [number, number]> = {
          ArrowUp: [0, -step],
          ArrowDown: [0, step],
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
        };
        const [dx, dy] = deltas[e.key];
        dispatch({ type: "NUDGE_ITEM", id: selectedId, dx, dy });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, dispatch, setSelectedId, undo, t]);

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader onOpenGuestList={() => setShowGuestDrawer(true)} onOpenToolbar={() => setShowToolbarDrawer(true)} />

      <div className="no-print flex flex-1 overflow-hidden">
        <div
          className={`relative hidden lg:block lg:h-full lg:flex-shrink-0 lg:transition-all lg:duration-150 ${
            toolbarCollapsed ? "lg:w-0" : "lg:w-56"
          }`}
        >
          <div className={`h-full overflow-hidden ${toolbarCollapsed ? "lg:invisible" : ""}`}>
            <EditorSidebar />
          </div>
          <button
            onClick={() => setToolbarCollapsed((c) => !c)}
            className="absolute top-1/2 -right-3 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1 text-gray-400 shadow-sm hover:text-gray-600 lg:flex"
            aria-label={toolbarCollapsed ? t("header.openToolbarAria") : t("app.closeToolbarAria")}
          >
            {toolbarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <FloorCanvas
            onSeatClick={setActiveSeatId}
            // A single tap changing the selection closes the sheet, so it never shows
            // a different item than the one just tapped.
            onSelectionTap={() => setShowPropertiesSheet(false)}
            onItemDoubleTap={() => setShowPropertiesSheet(true)}
          />
        </div>

        <div
          className={`relative hidden lg:block lg:h-full lg:flex-shrink-0 lg:transition-all lg:duration-150 ${
            rightPanelCollapsed ? "lg:w-0" : "lg:w-64"
          }`}
        >
          <button
            onClick={() => setRightPanelCollapsed((c) => !c)}
            className="absolute top-1/2 -left-3 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1 text-gray-400 shadow-sm hover:text-gray-600 lg:flex"
            aria-label={rightPanelCollapsed ? t("app.openPanelsAria") : t("app.closePanelsAria")}
          >
            {rightPanelCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <div className={`h-full overflow-hidden ${rightPanelCollapsed ? "lg:invisible" : ""}`}>
            <PropertiesPanel />
          </div>
        </div>

        <div
          className={`hidden lg:block lg:h-full lg:flex-shrink-0 lg:border-l lg:border-gray-200 lg:transition-all lg:duration-150 ${
            rightPanelCollapsed ? "lg:w-0 lg:overflow-hidden lg:border-l-0" : "lg:w-72"
          }`}
        >
          <div className={`h-full overflow-hidden ${rightPanelCollapsed ? "lg:invisible" : ""}`}>
            <GuestList />
          </div>
        </div>
      </div>

      {activeSeatId && <SeatDialog key={activeSeatId} seatId={activeSeatId} onClose={() => setActiveSeatId(null)} />}

      {showToolbarDrawer && (
        <MobileDrawer title={t("sidebar.elements")} onClose={() => setShowToolbarDrawer(false)}>
          {/* Opening the sheet here is the confirmation that something was added: the
              new item lands at room centre, which is often off-screen on a phone. */}
          <EditorSidebar
            onItemAdded={() => {
              setShowToolbarDrawer(false);
              setShowPropertiesSheet(true);
            }}
          />
        </MobileDrawer>
      )}

      {showGuestDrawer && (
        <MobileDrawer title={t("header.guests")} onClose={() => setShowGuestDrawer(false)}>
          <GuestList />
        </MobileDrawer>
      )}

      {selectedId && showPropertiesSheet && (
        // Closing leaves the item selected: the sheet was covering the canvas, and
        // dismissing it should not also undo the selection.
        <MobilePropertiesSheet onClose={() => setShowPropertiesSheet(false)} />
      )}

      <div className="hidden print:block">
        <PrintView plan={plan} />
      </div>
    </div>
  );
}

function MobileDrawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex lg:hidden">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-3">
          <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="safe-bottom flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function MobilePropertiesSheet({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      {/* dvh so the sheet is measured against the visible viewport, not the larger
          one hidden behind the mobile URL bar. */}
      <div className="safe-bottom max-h-[70dvh] overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-3">
          <h2 className="text-sm font-semibold text-gray-700">{t("properties.heading")}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
}
