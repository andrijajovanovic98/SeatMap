"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Guest, Seat } from "@/types/seating";
import { Armchair } from "lucide-react";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SeatTooltipContent({
  seat,
  guest,
  tableName,
  childAgeLabel,
}: {
  seat: Seat;
  guest: Guest | undefined;
  tableName: string;
  childAgeLabel?: string;
}) {
  const { t } = useLanguage();
  const occupied = Boolean(guest);
  const seatLabel = t("seat.label", { table: tableName, seatNumber: seat.seatNumber });

  const dietaryTags = occupied
    ? [
        guest!.glutenFree && { label: t("seat.glutenFree"), color: "#fde047" },
        guest!.lactoseFree && { label: t("seat.lactoseFree"), color: "#f97316" },
        guest!.vegan && { label: t("seat.vegan"), color: "#22c55e" },
        guest!.vegetarian && { label: t("seat.vegetarian"), color: "#84cc16" },
        guest!.otherAllergy && { label: t("seat.otherAllergy"), color: "#ef4444" },
      ].filter((tag): tag is { label: string; color: string } => Boolean(tag))
    : [];

  if (!occupied) {
    return <p className="text-xs text-gray-300">{seatLabel}</p>;
  }

  return (
    <>
      <p className="text-xs font-semibold text-white">{guest!.name}</p>
      <p className="text-[11px] text-gray-300">{seatLabel}</p>
      {dietaryTags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {dietaryTags.map((tag) => (
            <span
              key={tag.label}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-900"
              style={{ backgroundColor: tag.color }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}
      {childAgeLabel && <p className="mt-1 text-[11px] text-sky-300">{childAgeLabel}</p>}
      {guest!.highChair && <p className="text-[11px] text-amber-300">{t("seat.highChair")}</p>}
      {guest!.note && <p className="mt-1 text-[11px] italic text-gray-400">{guest!.note}</p>}
    </>
  );
}

export function SeatElement({
  seat,
  guest,
  x,
  y,
  childAgeLabel,
  onClick,
  onDropGuest,
  onHoverChange,
}: {
  seat: Seat;
  guest: Guest | undefined;
  x: number;
  y: number;
  childAgeLabel?: string;
  onClick: () => void;
  onDropGuest?: (guestId: string) => void;
  onHoverChange?: (hovering: boolean) => void;
}) {
  const occupied = Boolean(guest);

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-seatflow-guest")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    const guestId = e.dataTransfer.getData("application/x-seatflow-guest");
    if (guestId && onDropGuest) {
      e.preventDefault();
      e.stopPropagation();
      onDropGuest(guestId);
    }
  };

  const dietaryDots = occupied
    ? [
        guest!.glutenFree && "#fde047",
        guest!.lactoseFree && "#f97316",
        guest!.vegan && "#22c55e",
        guest!.vegetarian && "#84cc16",
        guest!.otherAllergy && "#ef4444",
      ].filter((color): color is string => Boolean(color))
    : [];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-semibold shadow-sm transition hover:scale-110 hover:z-10 ${
        occupied
          ? "border-emerald-600 bg-emerald-500 text-white"
          : "border-gray-300 bg-gray-200 text-gray-500"
      }`}
      style={{ left: x, top: y }}
    >
      {occupied ? getInitials(guest!.name) : seat.seatNumber}

      {occupied && guest!.highChair && (
        <span className="pointer-events-none absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-1 ring-gray-300">
          <Armchair className="h-3 w-3 text-amber-700" />
        </span>
      )}

      {occupied && childAgeLabel && (
        <span className="pointer-events-none absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-0.5 text-[8px] font-bold leading-none text-sky-600 ring-1 ring-gray-300">
          {childAgeLabel}
        </span>
      )}

      {dietaryDots.length > 0 && (
        <span className="pointer-events-none absolute -bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
          {dietaryDots.map((color, i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full border border-white"
              style={{ backgroundColor: color }}
            />
          ))}
        </span>
      )}
    </button>
  );
}
