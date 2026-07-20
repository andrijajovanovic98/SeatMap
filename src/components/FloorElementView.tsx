"use client";

import { useLanguage } from "@/context/LanguageContext";
import { FLOOR_ELEMENT_LABEL_KEYS, FloorElementItem } from "@/types/seating";

export function FloorElementView({
  element,
  selected = false,
  onPointerDownDrag,
}: {
  element: FloorElementItem;
  selected?: boolean;
  onPointerDownDrag?: (e: React.PointerEvent) => void;
}) {
  const { t } = useLanguage();
  const isText = element.type === "text";
  const interactive = Boolean(onPointerDownDrag);

  return (
    <div
      // Selection is owned by the gesture hook, which fires it on tap or once a drag
      // passes its threshold. Selecting here on pointerdown made the mobile properties
      // sheet spring open over the canvas the moment a finger landed on an element.
      onPointerDown={onPointerDownDrag}
      className={`absolute flex items-center justify-center rounded-lg border-2 border-dashed shadow-sm ${
        interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      } ${selected ? "border-indigo-500 ring-2 ring-indigo-300" : "border-gray-400"}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
        backgroundColor: isText ? "transparent" : element.color,
        opacity: isText ? 1 : 0.5,
        borderStyle: isText ? "none" : "dashed",
      }}
    >
      <span
        className={`pointer-events-none select-none px-2 text-center text-sm font-semibold ${
          isText ? "" : "text-white drop-shadow"
        }`}
        style={{ color: isText ? element.color : undefined }}
      >
        {element.name || t(FLOOR_ELEMENT_LABEL_KEYS[element.type])}
      </span>
    </div>
  );
}
