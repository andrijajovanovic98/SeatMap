"use client";

import { FloorElementView } from "@/components/FloorElementView";
import { TableElement } from "@/components/TableElement";
import { useLanguage } from "@/context/LanguageContext";
import { useCanvasGestures } from "@/lib/useCanvasGestures";
import { Guest, SeatingPlan } from "@/types/seating";
import { Maximize, Minus, Plus } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

/**
 * A read-only variant of FloorCanvas for the public share page: same zoom / pan /
 * fit-to-room and the same tooltips, but no editing (no drag, select, add, or
 * guest assignment) and no PlanProvider dependency — the plan comes in as a prop.
 */
export function ReadOnlyCanvas({ plan }: { plan: SeatingPlan }) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
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
      if (!node) return;
      computeScale();
      const observer = new ResizeObserver(() => computeScale());
      observer.observe(node);
      return () => observer.disconnect();
    },
    [computeScale]
  );

  const zoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // No getItemOrigin/onMoveItem: with editing off, every one-finger gesture is a pan.
  const gestures = useCanvasGestures({
    roomRef,
    containerRef,
    zoom,
    panOffset,
    scale,
    setZoom,
    setPanOffset,
  });

  return (
    <div
      ref={containerRefCallback}
      data-pannable
      data-canvas-surface
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gray-100 p-6 ${
        isPanning ? "cursor-grabbing" : "cursor-grab"
      }`}
      onPointerDown={(e) => {
        setIsPanning(true);
        gestures.onPointerDown(e);
      }}
      onPointerMove={gestures.onPointerMove}
      onPointerUp={(e) => {
        setIsPanning(false);
        gestures.onPointerUp(e);
      }}
      onPointerCancel={(e) => {
        setIsPanning(false);
        gestures.onPointerUp(e);
      }}
      onLostPointerCapture={(e) => {
        setIsPanning(false);
        gestures.onPointerUp(e);
      }}
    >
      {/* no-print: these controls are chrome, not part of the plan being printed. */}
      <div className="no-print absolute bottom-4 right-4 z-10 flex items-center gap-0.5 rounded-lg bg-white p-1 shadow-md ring-1 ring-gray-200">
        <button
          onClick={() => gestures.zoomByStep(-1)}
          className="rounded-md p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label={t("canvas.zoomOutAria")}
        >
          <Minus className="h-5 w-5" />
        </button>
        <button
          onClick={zoomReset}
          className="min-w-[3.5rem] rounded-md px-1.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
          aria-label={t("canvas.zoomResetAria")}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => gestures.zoomByStep(1)}
          className="rounded-md p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label={t("canvas.zoomInAria")}
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          onClick={zoomReset}
          className="ml-0.5 rounded-md p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label={t("canvas.fitAria")}
        >
          <Maximize className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={roomRef}
        data-pannable
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
