"use client";

import { useCallback, useEffect, useRef } from "react";

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2.5;
export const ZOOM_STEP = 0.15;

/**
 * How far a pointer may travel before the gesture counts as a drag rather than a tap.
 * 10px matches Android's touch slop — above finger jitter, still feels immediate. A
 * mouse does not wobble, so it gets a much smaller threshold.
 */
const DRAG_SLOP_TOUCH = 10;
const DRAG_SLOP_MOUSE = 3;

export type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export type CanvasGestureOptions = {
  /** The transformed room element; its centre is the anchor for zoom maths. */
  roomRef: React.RefObject<HTMLDivElement | null>;
  /** The scrolling/gesture surface the listeners attach to. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  panOffset: Point;
  /** fitScale * zoom — converts screen pixels to room units while dragging. */
  scale: number;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: Point) => void;
  /** Editor only. Omit to make every one-finger gesture a background pan. */
  getItemOrigin?: (id: string) => Point | undefined;
  onMoveItem?: (id: string, x: number, y: number) => void;
  /** Fires once, when the slop threshold is crossed — not on every pointerdown. */
  onDragStart?: (id: string) => void;
  /** Slop was never crossed. `null` means the background was tapped. */
  onTap?: (id: string | null) => void;
  /** Two taps on the same item in quick succession, by touch or pen only. */
  onDoubleTap?: (id: string) => void;
};

/** Longest gap between two taps that still reads as a double-tap. */
const DOUBLE_TAP_MS = 300;
/** How far the second tap may land from the first and still count as the same spot. */
const DOUBLE_TAP_SLOP = 30;

/**
 * Unified mouse and touch handling for the floor canvases: one-finger drag and pan,
 * two-finger pinch-zoom and pan, with tap/drag disambiguation.
 *
 * Zoom only ever mutates `zoom` and `panOffset`; `fitScale` stays owned by the
 * container's ResizeObserver. Anchoring uses the ratio of successive zooms, in which
 * fitScale cancels, so this hook never needs to know about it.
 *
 * All gesture bookkeeping lives in refs: a pointermove that re-rendered on every frame
 * would make dragging visibly stutter. Pointer capture plus React's own handlers replace
 * the previous window-level listeners, which leaked whenever a gesture was cancelled.
 */
export function useCanvasGestures({
  roomRef,
  containerRef,
  zoom,
  panOffset,
  scale,
  setZoom,
  setPanOffset,
  getItemOrigin,
  onMoveItem,
  onDragStart,
  onTap,
  onDoubleTap,
}: CanvasGestureOptions) {
  const pointers = useRef(new Map<number, Point>());
  const mode = useRef<"idle" | "pan" | "drag" | "pinch">("idle");
  /** The previous tap, for double-tap detection. */
  const lastTap = useRef<{ id: string; at: number; x: number; y: number } | null>(null);

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
    slop: number;
  } | null>(null);

  const panRef = useRef<{ startX: number; startY: number; origin: Point } | null>(null);

  const pinchRef = useRef<{
    startDist: number;
    startZoom: number;
    startPan: Point;
    roomCentre: Point;
    startCentroid: Point;
  } | null>(null);

  /**
   * Mirrors zoom/pan so a fast gesture reads the value it just wrote instead of the
   * one from the last committed render. Kept in sync with the zoom buttons below.
   */
  const live = useRef({ zoom, pan: panOffset });
  useEffect(() => {
    live.current = { zoom, pan: panOffset };
  }, [zoom, panOffset]);

  const roomCentre = useCallback((): Point => {
    const rect = roomRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, [roomRef]);

  /** Applies a zoom change while holding `anchor` fixed on screen. */
  const zoomAround = useCallback(
    (nextZoom: number, anchor: Point, centre: Point) => {
      const current = live.current;
      const clamped = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const k = clamped / current.zoom;
      const pan = {
        x: current.pan.x + (anchor.x - centre.x) * (1 - k),
        y: current.pan.y + (anchor.y - centre.y) * (1 - k),
      };
      live.current = { zoom: clamped, pan };
      setZoom(clamped);
      setPanOffset(pan);
    },
    [setZoom, setPanOffset]
  );

  const beginPinch = useCallback(() => {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return;
    pinchRef.current = {
      startDist: Math.hypot(a.x - b.x, a.y - b.y),
      startZoom: live.current.zoom,
      startPan: live.current.pan,
      roomCentre: roomCentre(),
      startCentroid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
    dragRef.current = null;
    panRef.current = null;
    mode.current = "pinch";
  }, [roomCentre]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, itemId?: string) => {
      // Ignore right/middle mouse buttons; touch and pen always report button 0.
      if (e.pointerType === "mouse" && e.button !== 0) return;

      // An item's own pointerdown runs first, then the same event bubbles to the
      // container, which calls this again without an itemId. Re-entering would count
      // one finger twice — reading as a two-finger pinch — and overwrite the drag that
      // was just set up. The first call for a pointer is the one that decides.
      if (pointers.current.has(e.pointerId)) return;

      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // Capture on the container, never on the pressed item: capture redirects all
      // subsequent pointer events to the capturing element, and items only bind
      // pointerdown — so capturing there would silently swallow every pointermove
      // and the drag would never happen.
      containerRef.current?.setPointerCapture(e.pointerId);

      if (pointers.current.size === 2) {
        // A second finger converts whatever was running into a pinch. Pixels already
        // moved are kept rather than rolled back, matching how Figma and Miro behave.
        beginPinch();
        return;
      }
      if (pointers.current.size > 2) return;

      if (itemId && onMoveItem) {
        const origin = getItemOrigin?.(itemId);
        if (!origin) return;
        dragRef.current = {
          id: itemId,
          startX: e.clientX,
          startY: e.clientY,
          originX: origin.x,
          originY: origin.y,
          moved: false,
          slop: e.pointerType === "mouse" ? DRAG_SLOP_MOUSE : DRAG_SLOP_TOUCH,
        };
        mode.current = "drag";
        return;
      }

      // Background: only pan from the canvas itself, never from an item. A press that
      // lands on neither still has to reach pointerup as a background press, or
      // clicking empty space would no longer clear the selection.
      const target = e.target as HTMLElement;
      if (target.dataset.pannable !== undefined) {
        panRef.current = { startX: e.clientX, startY: e.clientY, origin: live.current.pan };
      }
      mode.current = "pan";
    },
    [beginPinch, containerRef, getItemOrigin, onMoveItem]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (mode.current === "pinch") {
        const pinch = pinchRef.current;
        const [a, b] = [...pointers.current.values()];
        if (!pinch || !a || !b || pinch.startDist === 0) return;

        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const nextZoom = clamp(pinch.startZoom * (dist / pinch.startDist), MIN_ZOOM, MAX_ZOOM);
        const k = nextZoom / pinch.startZoom;
        const centroid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

        // Two independent terms: anchoring holds the *starting* centroid fixed under
        // the fingers (using the live centroid here would make the plan drift as the
        // fingers rotate), and the second carries the centroid's own translation so
        // pinch and two-finger pan compose naturally.
        const pan = {
          x:
            pinch.startPan.x +
            (pinch.startCentroid.x - pinch.roomCentre.x) * (1 - k) +
            (centroid.x - pinch.startCentroid.x),
          y:
            pinch.startPan.y +
            (pinch.startCentroid.y - pinch.roomCentre.y) * (1 - k) +
            (centroid.y - pinch.startCentroid.y),
        };
        live.current = { zoom: nextZoom, pan };
        setZoom(nextZoom);
        setPanOffset(pan);
        return;
      }

      if (mode.current === "drag") {
        const drag = dragRef.current;
        if (!drag) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (!drag.moved) {
          if (Math.hypot(dx, dy) < drag.slop) return; // still a tap
          drag.moved = true;
          onDragStart?.(drag.id);
        }
        // Screen pixels to room units, so the item tracks the pointer exactly.
        onMoveItem?.(drag.id, drag.originX + dx / scale, drag.originY + dy / scale);
        return;
      }

      if (mode.current === "pan") {
        const pan = panRef.current;
        if (!pan) return;
        const next = {
          x: pan.origin.x + (e.clientX - pan.startX),
          y: pan.origin.y + (e.clientY - pan.startY),
        };
        live.current = { ...live.current, pan: next };
        setPanOffset(next);
      }
    },
    [onDragStart, onMoveItem, scale, setPanOffset, setZoom]
  );

  /** Shared by pointerup, pointercancel and lostpointercapture — see the note above. */
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const wasDrag = dragRef.current;
      const wasMode = mode.current;
      const cancelled = e.type === "pointercancel";
      pointers.current.delete(e.pointerId);

      if (pointers.current.size === 0) {
        // A cancelled gesture is not a tap: the browser took the pointer away, the
        // user did not choose to lift it.
        if (!cancelled) {
          if (wasMode === "drag" && wasDrag && !wasDrag.moved) {
            // Double-tap is touch-only: a mouse has a hover-driven side panel that
            // does not cover the canvas, so desktop keeps single-click-to-open.
            const previous = lastTap.current;
            const isSecondTap =
              e.pointerType !== "mouse" &&
              previous !== null &&
              previous.id === wasDrag.id &&
              Date.now() - previous.at < DOUBLE_TAP_MS &&
              Math.hypot(e.clientX - previous.x, e.clientY - previous.y) < DOUBLE_TAP_SLOP;

            onTap?.(wasDrag.id);
            if (isSecondTap) {
              onDoubleTap?.(wasDrag.id);
              lastTap.current = null; // a third tap starts a fresh pair
            } else {
              lastTap.current = { id: wasDrag.id, at: Date.now(), x: e.clientX, y: e.clientY };
            }
          } else if (wasMode === "pan") {
            onTap?.(null);
            lastTap.current = null;
          }
        }
        mode.current = "idle";
        dragRef.current = null;
        panRef.current = null;
        pinchRef.current = null;
        return;
      }

      if (pointers.current.size === 1 && wasMode === "pinch") {
        // One finger lifted out of a pinch: hand over to a one-finger pan so the
        // canvas keeps responding instead of freezing until the last finger leaves.
        const [only] = [...pointers.current.values()];
        panRef.current = { startX: only.x, startY: only.y, origin: live.current.pan };
        pinchRef.current = null;
        mode.current = "pan";
      }
    },
    [onDoubleTap, onTap]
  );

  // React attaches wheel passively at the root, so preventDefault() on the synthetic
  // event is a silent no-op and the page scrolls/zooms instead of the canvas. A native
  // non-passive listener is the only way to take the gesture.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpad pinch arrives as ctrl+wheel with small deltas; a mouse wheel sends
      // large discrete steps. Same zoom, different gain.
      const factor = e.ctrlKey ? 0.01 : 0.0015;
      const next = live.current.zoom * Math.exp(-e.deltaY * factor);
      zoomAround(next, { x: e.clientX, y: e.clientY }, roomCentre());
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [containerRef, roomCentre, zoomAround]);

  /** Zoom one step, keeping the viewport centre fixed. Used by the toolbar buttons. */
  const zoomByStep = useCallback(
    (direction: 1 | -1) => {
      const element = containerRef.current;
      const rect = element?.getBoundingClientRect();
      const anchor = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : roomCentre();
      zoomAround(live.current.zoom + direction * ZOOM_STEP, anchor, roomCentre());
    },
    [containerRef, roomCentre, zoomAround]
  );

  return { onPointerDown, onPointerMove, onPointerUp, zoomByStep };
}
