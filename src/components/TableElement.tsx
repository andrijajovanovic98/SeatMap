"use client";

import { SeatElement, SeatTooltipContent } from "@/components/SeatElement";
import { computeSeatPositions } from "@/lib/seatLayout";
import { Guest, TableItem } from "@/types/seating";
import { AlertTriangle, Armchair, Baby, MilkOff, PersonStanding, WheatOff } from "lucide-react";
import { useState } from "react";

function GuestNoticeIcons({ guest }: { guest: Guest }) {
  return (
    <>
      {guest.glutenFree && <WheatOff className="h-3 w-3 flex-shrink-0 text-amber-400" />}
      {guest.lactoseFree && <MilkOff className="h-3 w-3 flex-shrink-0 text-sky-300" />}
      {guest.otherAllergy && <AlertTriangle className="h-3 w-3 flex-shrink-0 text-red-400" />}
      {guest.childAge === "under3" && <Baby className="h-3 w-3 flex-shrink-0 text-sky-400" />}
      {guest.childAge === "age3to12" && <PersonStanding className="h-3 w-3 flex-shrink-0 text-sky-400" />}
      {guest.highChair && <Armchair className="h-3 w-3 flex-shrink-0 text-amber-600" />}
    </>
  );
}

export function TableElement({
  table,
  guestsById,
  selected,
  onSelect,
  onPointerDownDrag,
  onSeatClick,
  onDropGuestOnSeat,
}: {
  table: TableItem;
  guestsById: Map<string, Guest>;
  selected: boolean;
  onSelect: () => void;
  onPointerDownDrag: (e: React.PointerEvent) => void;
  onSeatClick: (seatId: string) => void;
  onDropGuestOnSeat: (seatId: string, guestId: string) => void;
}) {
  const [tableTooltipPos, setTableTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);
  const seatPositions = computeSeatPositions(table.shape, table.width, table.height, table.seats);
  const isCircle = table.shape === "circle";

  const seatedGuests = table.seats
    .map((seat) => (seat.guestId ? guestsById.get(seat.guestId) : undefined))
    .filter((guest): guest is Guest => Boolean(guest));

  return (
    <div
      className="absolute"
      style={{
        left: table.x,
        top: table.y,
        width: table.width,
        height: table.height,
        transform: `translate(-50%, -50%) rotate(${table.rotation}deg)`,
      }}
    >
      <div
        onPointerDown={(e) => {
          onSelect();
          onPointerDownDrag(e);
        }}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setTableTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseLeave={() => setTableTooltipPos(null)}
        className={`relative flex h-full w-full cursor-grab items-center justify-center border-2 shadow-sm active:cursor-grabbing ${
          isCircle ? "rounded-full" : "rounded-lg"
        } ${selected ? "border-indigo-500 ring-2 ring-indigo-300" : "border-gray-300"}`}
        style={{ backgroundColor: table.color, opacity: 0.85 }}
      >
        <span
          className="pointer-events-none select-none px-2 text-center text-xs font-semibold text-white drop-shadow"
          style={{ transform: `rotate(${-table.rotation}deg)` }}
        >
          {table.name}
        </span>
      </div>

      {seatPositions.map(({ seat, x, y }) => {
        const px = table.width / 2 + x;
        const py = table.height / 2 + y;
        return (
          <div
            key={seat.id}
            className="absolute"
            style={{
              left: 0,
              top: 0,
              width: 0,
              height: 0,
              transform: `translate(${px}px, ${py}px) rotate(${-table.rotation}deg)`,
            }}
          >
            <SeatElement
              seat={seat}
              guest={seat.guestId ? guestsById.get(seat.guestId) : undefined}
              x={0}
              y={0}
              onClick={() => onSeatClick(seat.id)}
              onDropGuest={(guestId) => onDropGuestOnSeat(seat.id, guestId)}
              onHoverChange={(hovering) => setHoveredSeatId(hovering ? seat.id : null)}
            />
          </div>
        );
      })}

      {tableTooltipPos && seatedGuests.length > 0 && (
        <div
          className="pointer-events-none absolute z-30 w-max max-w-[240px] rounded-lg bg-gray-900 px-3 py-2 text-left shadow-lg"
          style={{
            left: tableTooltipPos.x,
            top: tableTooltipPos.y,
            transform: `rotate(${-table.rotation}deg) translate(-100%, -100%) translate(-14px, -14px)`,
            transformOrigin: "bottom right",
          }}
          role="tooltip"
        >
          <p className="mb-1 text-xs font-semibold text-white">{table.name}</p>
          <ul className="flex flex-col gap-0.5">
            {seatedGuests.map((guest) => (
              <li key={guest.id} className="flex items-center gap-1 text-[11px] text-gray-300">
                <span className="truncate">{guest.name}</span>
                <GuestNoticeIcons guest={guest} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {seatPositions.map(({ seat, x, y }) => {
        if (seat.id !== hoveredSeatId) return null;
        const px = table.width / 2 + x;
        const py = table.height / 2 + y;
        return (
          <div
            key={`tooltip-${seat.id}`}
            className="pointer-events-none absolute z-30 w-max max-w-[220px] rounded-lg bg-gray-900 px-3 py-2 text-left shadow-lg"
            style={{
              left: px,
              top: py,
              transform: `rotate(${-table.rotation}deg) translate(-50%, -100%) translate(0, -26px)`,
              transformOrigin: "bottom center",
            }}
            role="tooltip"
          >
            <SeatTooltipContent
              seat={seat}
              guest={seat.guestId ? guestsById.get(seat.guestId) : undefined}
              tableName={table.name}
            />
          </div>
        );
      })}
    </div>
  );
}
