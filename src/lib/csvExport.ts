import { TranslationKey } from "@/lib/translations";
import { CHILD_AGE_LABEL_KEYS, SeatingPlan } from "@/types/seating";

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

/** Escapes a single CSV field per RFC 4180 (wrap in quotes, double internal quotes). */
function csvField(value: string): string {
  const needsQuoting = /[",\n\r;]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

/**
 * Builds a CSV string with one row per guest. Placed guests show their table name and
 * seat number; unplaced guests get "-" in those columns. Dietary/child/high-chair flags
 * are their own columns so they stay filterable in a spreadsheet.
 */
export function buildGuestCsv(plan: SeatingPlan, t: Translate): string {
  // Map guestId -> { tableName, seatNumber } for placed guests.
  const placement = new Map<string, { table: string; seat: number }>();
  for (const table of plan.tables) {
    for (const seat of table.seats) {
      if (seat.guestId) {
        placement.set(seat.guestId, { table: table.name, seat: seat.seatNumber });
      }
    }
  }

  const yes = t("csv.yes");
  const no = t("csv.no");
  const empty = "-";

  const header = [
    t("csv.header.name"),
    t("csv.header.table"),
    t("csv.header.seat"),
    t("csv.header.gluten"),
    t("csv.header.lactose"),
    t("csv.header.otherAllergy"),
    t("csv.header.childAge"),
    t("csv.header.highChair"),
    t("csv.header.comment"),
  ];

  const rows = plan.guests.map((guest) => {
    const seatInfo = placement.get(guest.id);
    return [
      guest.name,
      seatInfo ? seatInfo.table : empty,
      seatInfo ? String(seatInfo.seat) : empty,
      guest.glutenFree ? yes : no,
      guest.lactoseFree ? yes : no,
      guest.otherAllergy ? yes : no,
      guest.childAge ? t(CHILD_AGE_LABEL_KEYS[guest.childAge]) : empty,
      guest.highChair ? yes : no,
      guest.note ?? "",
    ];
  });

  const lines = [header, ...rows].map((cells) => cells.map(csvField).join(","));
  // UTF-8 BOM so Excel renders accented names (e.g. Kovács Anna) correctly.
  return "﻿" + lines.join("\r\n");
}
