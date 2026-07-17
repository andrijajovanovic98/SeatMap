"use client";

import { useLanguage } from "@/context/LanguageContext";
import { computeSeatPositions } from "@/lib/seatLayout";
import { TranslationKey } from "@/lib/translations";
import { FLOOR_ELEMENT_LABEL_KEYS, Guest, SeatingPlan } from "@/types/seating";
import { useMemo } from "react";

function guestFlagsSummary(
  t: (key: TranslationKey) => string,
  guest: Guest,
  childAgeLabelById: Map<string, string>
): string {
  const parts: string[] = [];
  if (guest.glutenFree) parts.push(t("print.flag.gluten"));
  if (guest.lactoseFree) parts.push(t("print.flag.lactose"));
  if (guest.vegan) parts.push(t("print.flag.vegan"));
  if (guest.vegetarian) parts.push(t("print.flag.vegetarian"));
  if (guest.otherAllergy) parts.push(t("print.flag.allergy"));
  if (guest.childAgeId) {
    const label = childAgeLabelById.get(guest.childAgeId);
    if (label) parts.push(label);
  }
  if (guest.highChair) parts.push(t("print.flag.highChair"));
  return parts.length ? ` (${parts.join(", ")})` : "";
}

export function PrintView({ plan, screen = false }: { plan: SeatingPlan; screen?: boolean }) {
  const { t } = useLanguage();

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

  return (
    <div className={screen ? "" : "print-only hidden print:block"}>
      <h1 className="text-2xl font-bold text-gray-900">{plan.eventName}</h1>
      <p className="mb-4 text-sm text-gray-500">{t("print.subtitle")}</p>

      <div
        className="relative border border-gray-300"
        style={{ width: plan.room.width / 2, height: plan.room.height / 2 }}
      >
        <div className="absolute left-0 top-0 origin-top-left" style={{ transform: "scale(0.5)" }}>
          {plan.floorElements.map((el) => (
            <div
              key={el.id}
              className="absolute flex items-center justify-center border border-dashed border-gray-400 text-xs font-semibold text-gray-600"
              style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
              }}
            >
              {el.name || t(FLOOR_ELEMENT_LABEL_KEYS[el.type])}
            </div>
          ))}
          {plan.tables.map((table) => {
            const seatPositions = computeSeatPositions(table.shape, table.width, table.height, table.seats);
            return (
              <div key={table.id}>
                <div
                  className={`absolute flex items-center justify-center border border-gray-500 text-xs font-semibold text-gray-800 ${
                    table.shape === "circle" ? "rounded-full" : "rounded"
                  }`}
                  style={{
                    left: table.x,
                    top: table.y,
                    width: table.width,
                    height: table.height,
                    transform: `translate(-50%, -50%) rotate(${table.rotation}deg)`,
                  }}
                >
                  {table.name}
                </div>
                {seatPositions.map(({ seat, x, y }) => {
                  const guest = seat.guestId ? guestsById.get(seat.guestId) : undefined;
                  const px = table.x + x;
                  const py = table.y + y;
                  return (
                    <div
                      key={seat.id}
                      className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-500 text-[8px]"
                      style={{ left: px, top: py }}
                      title={guest?.name}
                    >
                      {guest ? seat.seatNumber : ""}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-gray-300 px-2 py-1 text-left">{t("print.tableHeader")}</th>
            <th className="border border-gray-300 px-2 py-1 text-left">{t("print.seatHeader")}</th>
            <th className="border border-gray-300 px-2 py-1 text-left">{t("print.guestHeader")}</th>
          </tr>
        </thead>
        <tbody>
          {plan.tables.flatMap((table) =>
            table.seats.map((seat) => {
              const guest = seat.guestId ? guestsById.get(seat.guestId) : undefined;
              return (
                <tr key={seat.id}>
                  <td className="border border-gray-300 px-2 py-1">{table.name}</td>
                  <td className="border border-gray-300 px-2 py-1">{seat.seatNumber}</td>
                  <td className="border border-gray-300 px-2 py-1">
                    {guest
                      ? `${guest.name}${guestFlagsSummary(t, guest, childAgeLabelById)}`
                      : t("print.emptySeat")}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
