"use client";

import { GuestAttributesFields, GuestAttributesValue } from "@/components/GuestAttributesFields";
import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { generateId } from "@/lib/id";
import { X } from "lucide-react";
import { useState } from "react";

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
    otherAllergy: guest?.otherAllergy ?? false,
    childAge: guest?.childAge ?? "",
    highChair: guest?.highChair ?? false,
  });

  if (!table || !seat) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      if (guest) dispatch({ type: "UNASSIGN_SEAT", seatId: seat.id });
      onClose();
      return;
    }
    const attributes = { ...attrs, childAge: attrs.childAge === "" ? undefined : attrs.childAge };
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
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            {t("seatDialog.nameLabel")}
            <input
              autoFocus
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
