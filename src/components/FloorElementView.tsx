"use client";

import { useLanguage } from "@/context/LanguageContext";
import { FLOOR_ELEMENT_LABEL_KEYS, FloorElementItem } from "@/types/seating";

export function FloorElementView({
  element,
  selected,
  onSelect,
  onPointerDownDrag,
}: {
  element: FloorElementItem;
  selected: boolean;
  onSelect: () => void;
  onPointerDownDrag: (e: React.PointerEvent) => void;
}) {
  const { t } = useLanguage();
  const isText = element.type === "text";

  return (
    <div
      onPointerDown={(e) => {
        onSelect();
        onPointerDownDrag(e);
      }}
      className={`absolute flex cursor-grab items-center justify-center rounded-lg border-2 border-dashed shadow-sm active:cursor-grabbing ${
        selected ? "border-indigo-500 ring-2 ring-indigo-300" : "border-gray-400"
      }`}
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
