"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FloorElementView } from "@/components/FloorElementView";
import { TableElement } from "@/components/TableElement";
import { ToolItem } from "@/components/EditorSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { Guest } from "@/types/seating";
import { Minus, Plus, Maximize } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.15;

export function FloorCanvas({ onSeatClick }: { onSeatClick: (seatId: string) => void }) {
  const { plan, dispatch, selectedId, setSelectedId } = usePlan();
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [pendingSwap, setPendingSwap] = useState<{ guestId: string; seatId: string } | null>(null);
  const dragState = useRef<{ id: string; startX: number; startY: number; originX: number; originY: number } | null>(
    null
  );

  const scale = fitScale * zoom;

  const guestsById = useMemo(() => {
    const map = new Map<string, Guest>();
    for (const g of plan.guests) map.set(g.id, g);
    return map;
  }, [plan.guests]);

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

  const startDrag = (id: string) => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const item =
      plan.tables.find((t) => t.id === id) ?? plan.floorElements.find((f) => f.id === id);
    if (!item) return;
    dragState.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      originX: item.x,
      originY: item.y,
    };
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const handleMove = (moveEvent: PointerEvent) => {
      const drag = dragState.current;
      if (!drag) return;
      const dx = (moveEvent.clientX - drag.startX) / scale;
      const dy = (moveEvent.clientY - drag.startY) / scale;
      dispatch({ type: "MOVE_ITEM", id: drag.id, x: drag.originX + dx, y: drag.originY + dy });
    };
    const handleUp = () => {
      dragState.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.pannable) {
      setSelectedId(null);
    }
  };

  const [isPanning, setIsPanning] = useState(false);

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

  const allSeats = useMemo(() => plan.tables.flatMap((t) => t.seats), [plan.tables]);

  const handleDropGuestOnSeat = (seatId: string, guestId: string) => {
    const targetSeat = allSeats.find((s) => s.id === seatId);
    if (targetSeat?.guestId && targetSeat.guestId !== guestId) {
      setPendingSwap({ guestId, seatId });
      return;
    }
    dispatch({ type: "ASSIGN_GUEST_TO_SEAT", guestId, seatId });
  };

  const roomRef = useRef<HTMLDivElement>(null);

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
      dispatch({ type: "ADD_TABLE", shape: tool.shape });
    } else {
      dispatch({ type: "ADD_FLOOR_ELEMENT", elementType: tool.elementType });
    }
  };

  return (
    <div
      ref={containerRefCallback}
      data-pannable
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gray-100 p-6 ${
        isPanning ? "cursor-grabbing" : "cursor-grab"
      }`}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
      onPointerDown={handleBackgroundPointerDown}
    >
      <div className="no-print absolute bottom-4 right-4 z-10 flex items-center gap-0.5 rounded-lg bg-white p-1 shadow-md ring-1 ring-gray-200">
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
        ref={roomRef}
        data-pannable
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
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
            <FloorElementView
              key={el.id}
              element={el}
              selected={selectedId === el.id}
              onSelect={() => setSelectedId(el.id)}
              onPointerDownDrag={startDrag(el.id)}
            />
          ))}
          {plan.tables.map((table) => (
            <TableElement
              key={table.id}
              table={table}
              guestsById={guestsById}
              selected={selectedId === table.id}
              onSelect={() => setSelectedId(table.id)}
              onPointerDownDrag={startDrag(table.id)}
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
