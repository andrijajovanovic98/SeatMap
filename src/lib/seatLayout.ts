import { Seat, TableItem, TableShape } from "@/types/seating";

export type SeatPosition = {
  seat: Seat;
  x: number; // relative to table center, in table-local (unrotated) coordinates
  y: number;
};

/**
 * Computes seat positions relative to the table's own center, before rotation.
 * Circle: seats evenly spaced around the perimeter.
 * Rectangle: seats along the two longer (top/bottom) sides.
 * Long: seats along the two long sides.
 */
export function computeSeatPositions(
  shape: TableShape,
  width: number,
  height: number,
  seats: Seat[]
): SeatPosition[] {
  const count = seats.length;
  if (count === 0) return [];

  if (shape === "circle") {
    const radius = Math.max(width, height) / 2 + 26;
    return seats.map((seat, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      return {
        seat,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      };
    });
  }

  // rectangle / long: distribute along top and bottom edges
  const perSide = Math.ceil(count / 2);
  const topCount = perSide;
  const bottomCount = count - perSide;
  const positions: SeatPosition[] = [];
  const margin = 24;

  const placeOnEdge = (n: number, edgeY: number, startIndex: number) => {
    for (let i = 0; i < n; i++) {
      const seat = seats[startIndex + i];
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = -width / 2 + t * width;
      positions.push({ seat, x, y: edgeY });
    }
  };

  placeOnEdge(topCount, -height / 2 - margin, 0);
  placeOnEdge(bottomCount, height / 2 + margin, topCount);

  return positions;
}

export function rotatePoint(x: number, y: number, rotationDeg: number): { x: number; y: number } {
  const rad = (rotationDeg * Math.PI) / 180;
  return {
    x: x * Math.cos(rad) - y * Math.sin(rad),
    y: x * Math.sin(rad) + y * Math.cos(rad),
  };
}

/** Rebuilds the seats array for a table when capacity changes, preserving existing guest assignments. */
export function resizeSeats(table: TableItem, newCapacity: number): Seat[] {
  const capacity = Math.max(1, newCapacity);
  const existing = table.seats;
  const seats: Seat[] = [];
  for (let i = 0; i < capacity; i++) {
    const prior = existing[i];
    seats.push({
      id: prior?.id ?? `${table.id}-seat-${i}-${Math.random().toString(36).slice(2, 8)}`,
      tableId: table.id,
      seatNumber: i + 1,
      guestId: prior?.guestId,
    });
  }
  return seats;
}
