"use client";

import { FloorElementView } from "@/components/FloorElementView";
import { TableElement } from "@/components/TableElement";
import { useLanguage } from "@/context/LanguageContext";
import { Guest, SeatingPlan } from "@/types/seating";
import { Maximize, Minus, Plus } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.15;

/**
 * A read-only variant of FloorCanvas for the public share page: same zoom / pan /
 * fit-to-room and the same hover tooltips, but no editing (no drag, select, add, or
 * guest assignment) and no PlanProvider dependency — the plan comes in as a prop.
 */
export function ReadOnlyCanvas({ plan }: { plan: SeatingPlan }) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const scale = fitScale * zoom;

  const guestsById = useMemo(() => {
    const map = new Map<string, Guest>();
    for (const g of plan.guests) map.set(g.id, g);
    return map;
  }, [plan.guests]);

  const childAgeLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of plan.childAgeCategories) map.set(c.id, c.label);
    return map;
  }, [plan.childAgeCategories]);

  const computeScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const availableWidth = container.clientWidth - 48;
    const availableHeight = container.clientHeight - 48;
    const s = Math.min(1, availableWidth / plan.room.width, availableHeight / plan.room.height);
    setFitScale(s > 0 ? s : 1);
  }, [plan.room.width, plan.room.height]);

  const containerRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (node) {
        computeScale();
        const observer = new ResizeObserver(() => computeScale());
        observer.observe(node);
      }
    },
    [computeScale]
  );

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2))));
  const zoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const handleBackgroundPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (!target.dataset.pannable || e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startOffset = panOffset;
    setIsPanning(true);

    const handleMove = (moveEvent: PointerEvent) => {
      setPanOffset({
        x: startOffset.x + (moveEvent.clientX - startX),
        y: startOffset.y + (moveEvent.clientY - startY),
      });
    };
    const handleUp = () => {
      setIsPanning(false);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <div
      ref={containerRefCallback}
      data-pannable
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gray-100 p-6 ${
        isPanning ? "cursor-grabbing" : "cursor-grab"
      }`}
      onWheel={handleWheel}
      onPointerDown={handleBackgroundPointerDown}
    >
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-0.5 rounded-lg bg-white p-1 shadow-md ring-1 ring-gray-200">
        <button
          onClick={zoomOut}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label={t("canvas.zoomOutAria")}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={zoomReset}
          className="min-w-[3.5rem] rounded-md px-1.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
          aria-label={t("canvas.zoomResetAria")}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={zoomIn}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label={t("canvas.zoomInAria")}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={zoomReset}
          className="ml-0.5 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label={t("canvas.fitAria")}
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>

      <div
        data-pannable
        onPointerDown={handleBackgroundPointerDown}
        className="relative flex-shrink-0 rounded-xl bg-white shadow-inner ring-1 ring-gray-200"
        style={{
          width: plan.room.width * scale,
          height: plan.room.height * scale,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
      >
        <div
          data-pannable
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: plan.room.width, height: plan.room.height, transform: `scale(${scale})` }}
        >
          {plan.floorElements.map((el) => (
            <FloorElementView key={el.id} element={el} />
          ))}
          {plan.tables.map((table) => (
            <TableElement
              key={table.id}
              table={table}
              guestsById={guestsById}
              childAgeLabelById={childAgeLabelById}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
