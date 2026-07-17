import { TranslationKey } from "@/lib/translations";
import { SeatingPlan } from "@/types/seating";
import * as XLSX from "xlsx";

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

/**
 * Builds an .xlsx workbook (as a Blob) with one row per guest. Placed guests show their
 * table name and seat number; unplaced guests get "-" in those columns. Dietary/child/
 * high-chair flags are their own columns so they stay filterable in a spreadsheet.
 * The header row is bold and column widths are auto-sized to their content.
 */
export function buildGuestXlsx(plan: SeatingPlan, t: Translate): Blob {
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

  const childAgeLabelById = new Map(plan.childAgeCategories.map((c) => [c.id, c.label]));

  const header = [
    t("csv.header.name"),
    t("csv.header.table"),
    t("csv.header.seat"),
    t("csv.header.gluten"),
    t("csv.header.lactose"),
    t("csv.header.vegan"),
    t("csv.header.vegetarian"),
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
      seatInfo ? seatInfo.seat : empty,
      guest.glutenFree ? yes : no,
      guest.lactoseFree ? yes : no,
      guest.vegan ? yes : no,
      guest.vegetarian ? yes : no,
      guest.otherAllergy ? yes : no,
      guest.childAgeId ? childAgeLabelById.get(guest.childAgeId) ?? empty : empty,
      guest.highChair ? yes : no,
      guest.note ?? "",
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);

  // Bold the header row.
  for (let c = 0; c < header.length; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    const cell = worksheet[cellRef];
    if (cell) cell.s = { font: { bold: true } };
  }

  // Auto-size columns to the widest cell (with a small padding, capped).
  const allRows = [header, ...rows.map((r) => r.map(String))];
  worksheet["!cols"] = header.map((_, colIndex) => {
    const maxLen = allRows.reduce((max, row) => Math.max(max, String(row[colIndex] ?? "").length), 0);
    return { wch: Math.min(Math.max(maxLen + 2, 8), 40) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Guests");

  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
