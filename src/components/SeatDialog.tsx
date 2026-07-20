"use client";

import { GuestAttributesFields, GuestAttributesValue } from "@/components/GuestAttributesFields";
import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { generateId } from "@/lib/id";
import { UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";

export function SeatDialog({ seatId, onClose }: { seatId: string; onClose: () => void }) {
  const { plan, dispatch } = usePlan();
  const { t } = useLanguage();

  const table = plan.tables.find((t) => t.seats.some((s) => s.id === seatId));
  const seat = table?.seats.find((s) => s.id === seatId);
  const guest = seat?.guestId ? plan.guests.find((g) => g.id === seat.guestId) : undefined;

  const [name, setName] = useState(guest?.name ?? "");
  const [note, setNote] = useState(guest?.note ?? "");
  const [attrs, setAttrs] = useState<GuestAttributesValue>({
    glutenFree: guest?.glutenFree ?? false,
    lactoseFree: guest?.lactoseFree ?? false,
    vegan: guest?.vegan ?? false,
    vegetarian: guest?.vegetarian ?? false,
    otherAllergy: guest?.otherAllergy ?? false,
    childAgeId: guest?.childAgeId ?? "",
    highChair: guest?.highChair ?? false,
  });
  const [guestQuery, setGuestQuery] = useState("");

  /** Where each already-seated guest sits, so the list can say so. */
  const seatLabelByGuestId = useMemo(() => {
    const map = new Map<string, string>();
    for (const tbl of plan.tables) {
      for (const s of tbl.seats) {
        if (s.guestId) {
          map.set(s.guestId, t("seat.label", { table: tbl.name, seatNumber: s.seatNumber }));
        }
      }
    }
    return map;
  }, [plan.tables, t]);

  // Unseated guests first: those are the ones usually being placed.
  const seatableGuests = useMemo(() => {
    const unseated = plan.guests.filter((g) => !seatLabelByGuestId.has(g.id));
    const seated = plan.guests.filter((g) => seatLabelByGuestId.has(g.id));
    return [...unseated, ...seated];
  }, [plan.guests, seatLabelByGuestId]);

  const filteredGuests = useMemo(() => {
    const q = guestQuery.trim().toLowerCase();
    return q ? seatableGuests.filter((g) => g.name.toLowerCase().includes(q)) : seatableGuests;
  }, [seatableGuests, guestQuery]);

  if (!table || !seat) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      if (guest) dispatch({ type: "UNASSIGN_SEAT", seatId: seat.id });
      onClose();
      return;
    }
    const attributes = { ...attrs, childAgeId: attrs.childAgeId === "" ? undefined : attrs.childAgeId };
    if (guest) {
      dispatch({ type: "RENAME_GUEST", id: guest.id, name: trimmed });
      dispatch({ type: "SET_GUEST_NOTE", id: guest.id, note });
      dispatch({ type: "UPDATE_GUEST_ATTRIBUTES", id: guest.id, attributes });
    } else {
      const newGuestId = generateId("guest");
      dispatch({ type: "ADD_GUEST", id: newGuestId, name: trimmed, note });
      dispatch({ type: "UPDATE_GUEST_ATTRIBUTES", id: newGuestId, attributes });
      dispatch({ type: "ASSIGN_GUEST_TO_SEAT", guestId: newGuestId, seatId: seat.id });
    }
    onClose();
  };

  const handleRemove = () => {
    dispatch({ type: "UNASSIGN_SEAT", seatId: seat.id });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {t("seat.label", { table: table.name, seatNumber: seat.seatNumber })}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 overflow-y-auto">
          {/* Seating an existing guest was only possible by dragging them from the
              guest list, which never works on a touchscreen. On an empty seat the
              existing guests are offered here instead. */}
          {!guest && seatableGuests.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500">{t("guestPicker.title")}</span>
              {seatableGuests.length > 6 && (
                <input
                  value={guestQuery}
                  onChange={(e) => setGuestQuery(e.target.value)}
                  placeholder={t("guestPicker.search")}
                  className="input"
                  aria-label={t("guestPicker.search")}
                />
              )}
              <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-200">
                {filteredGuests.length === 0 ? (
                  <p className="px-3 py-3 text-center text-xs text-gray-400">{t("guestPicker.noMatch")}</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {filteredGuests.map((g) => (
                      <li key={g.id}>
                        <button
                          onClick={() => {
                            dispatch({ type: "ASSIGN_GUEST_TO_SEAT", guestId: g.id, seatId: seat.id });
                            onClose();
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50"
                        >
                          <UserRound className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span className="min-w-0 flex-1 truncate">{g.name}</span>
                          {seatLabelByGuestId.get(g.id) && (
                            <span className="flex-shrink-0 text-xs text-gray-400">
                              {t("guestPicker.alreadySeated", { seat: seatLabelByGuestId.get(g.id)! })}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span className="mt-1 text-xs font-medium text-gray-500">{t("guestPicker.newGuest")}</span>
            </div>
          )}

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            {t("seatDialog.nameLabel")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("seatDialog.namePlaceholder")}
              className="input"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            {t("seatDialog.noteLabel")}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("seatDialog.notePlaceholder")}
              rows={2}
              className="input resize-none"
            />
          </label>

          <GuestAttributesFields value={attrs} onChange={setAttrs} />
        </div>

        <div className="mt-5 flex justify-between gap-2">
          {guest ? (
            <button
              onClick={handleRemove}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              {t("seatDialog.remove")}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
              {t("seatDialog.cancel")}
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t("seatDialog.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
