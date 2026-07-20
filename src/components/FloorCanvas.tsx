"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FloorElementView } from "@/components/FloorElementView";
import { TableElement } from "@/components/TableElement";
import { ToolItem } from "@/components/EditorSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { useCanvasGestures } from "@/lib/useCanvasGestures";
import { Guest } from "@/types/seating";
import { Minus, Plus, Maximize } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

export function FloorCanvas({
  onSeatClick,
  onSelectionTap,
  onItemDoubleTap,
}: {
  onSeatClick: (seatId: string) => void;
  /** A tap that only changed the selection, so the mobile sheet can close itself. */
  onSelectionTap?: () => void;
  /** Touch-only: opens the mobile properties sheet, which a single tap no longer does. */
  onItemDoubleTap?: (id: string) => void;
}) {
  const { plan, dispatch, selectedId, setSelectedId } = usePlan();
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [pendingSwap, setPendingSwap] = useState<{ guestId: string; seatId: string } | null>(null);

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
      // Without this the observer outlives the node — noticeable on mobile, where the
      // collapsing URL bar fires resize constantly.
      return () => observer.disconnect();
    },
    [computeScale]
  );

  const zoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  /** Room-space origin of a table or floor element, for drag bookkeeping. */
  const itemOrigin = useCallback(
    (id: string) => {
      const item =
        plan.tables.find((t) => t.id === id) ?? plan.floorElements.find((f) => f.id === id);
      return item ? { x: item.x, y: item.y } : undefined;
    },
    [plan.tables, plan.floorElements]
  );

  const gestures = useCanvasGestures({
    roomRef,
    containerRef,
    zoom,
    panOffset,
    scale,
    setZoom,
    setPanOffset,
    getItemOrigin: itemOrigin,
    onMoveItem: (id, x, y) => dispatch({ type: "MOVE_ITEM", id, x, y }),
    // Selection is deferred to the drag threshold or to pointerup, never fired on
    // pointerdown: on mobile that opened the properties sheet over the canvas the
    // instant a finger touched a table — covering the very item being dragged.
    onDragStart: setSelectedId,
    onTap: (id) => {
      setSelectedId(id);
      onSelectionTap?.();
    },
    onDoubleTap: onItemDoubleTap,
  });

  const [isPanning, setIsPanning] = useState(false);

  const allSeats = useMemo(() => plan.tables.flatMap((t) => t.seats), [plan.tables]);

  const handleDropGuestOnSeat = (seatId: string, guestId: string) => {
    const targetSeat = allSeats.find((s) => s.id === seatId);
    if (targetSeat?.guestId && targetSeat.guestId !== guestId) {
      setPendingSwap({ guestId, seatId });
      return;
    }
    dispatch({ type: "ASSIGN_GUEST_TO_SEAT", guestId, seatId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-seatflow-tool")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    const raw = e.dataTransfer.getData("application/x-seatflow-tool");
    if (!raw) return;
    e.preventDefault();
    const tool = JSON.parse(raw) as ToolItem;
    if (tool.kind === "table") {
      const defaultName = t("table.defaultName", { number: plan.tables.length + 1 });
      dispatch({ type: "ADD_TABLE", shape: tool.shape, defaultName });
    } else {
      dispatch({ type: "ADD_FLOOR_ELEMENT", elementType: tool.elementType });
    }
  };

  return (
    <div
      ref={containerRefCallback}
      data-pannable
      // data-canvas-surface switches on touch-action: none, without which the browser
      // claims touch gestures for scrolling and cancels every drag.
      data-canvas-surface
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gray-100 p-6 ${
        isPanning ? "cursor-grabbing" : "cursor-grab"
      }`}
      onPointerDown={(e) => {
        setIsPanning((e.target as HTMLElement).dataset.pannable === "");
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
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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
            <FloorElementView
              key={el.id}
              element={el}
              selected={selectedId === el.id}
              onPointerDownDrag={(e) => gestures.onPointerDown(e, el.id)}
            />
          ))}
          {plan.tables.map((table) => (
            <TableElement
              key={table.id}
              table={table}
              guestsById={guestsById}
              childAgeLabelById={childAgeLabelById}
              selected={selectedId === table.id}
              onPointerDownDrag={(e) => gestures.onPointerDown(e, table.id)}
              onSeatClick={onSeatClick}
              onDropGuestOnSeat={handleDropGuestOnSeat}
            />
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={pendingSwap !== null}
        title={t("canvas.swapGuest.title")}
        message={t("canvas.swapGuest.message")}
        confirmLabel={t("canvas.swapGuest.confirm")}
        onConfirm={() => {
          if (pendingSwap) {
            dispatch({ type: "ASSIGN_GUEST_TO_SEAT", guestId: pendingSwap.guestId, seatId: pendingSwap.seatId });
          }
          setPendingSwap(null);
        }}
        onCancel={() => setPendingSwap(null)}
      />
    </div>
  );
}
