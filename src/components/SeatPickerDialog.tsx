"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { Guest } from "@/types/seating";
import { Armchair, Check, UserMinus, X } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * Picks a seat for a guest, table by table. This is the only way to seat someone by
 * touch: the canvas uses HTML5 drag-and-drop, which never fires on a touchscreen.
 */
export function SeatPickerDialog({ guest, onClose }: { guest: Guest; onClose: () => void }) {
  const { plan, dispatch } = usePlan();
  const { t } = useLanguage();
  const [pendingSwap, setPendingSwap] = useState<{ seatId: string; occupantName: string } | null>(null);

  const guestsById = useMemo(() => {
    const map = new Map<string, Guest>();
    for (const g of plan.guests) map.set(g.id, g);
    return map;
  }, [plan.guests]);

  // The seat this guest currently occupies, if any — drives both the "currently
  // seated at" line and the unseat button, which needs the seat id.
  const currentSeat = useMemo(() => {
    for (const table of plan.tables) {
      const seat = table.seats.find((s) => s.guestId === guest.id);
      if (seat) {
        return { id: seat.id, label: t("seat.label", { table: table.name, seatNumber: seat.seatNumber }) };
      }
    }
    return null;
  }, [plan.tables, guest.id, t]);

  const seatGuest = (seatId: string) => {
    dispatch({ type: "ASSIGN_GUEST_TO_SEAT", guestId: guest.id, seatId });
    onClose();
  };

  const handleSeatClick = (seatId: string, occupantId: string | undefined) => {
    // Assigning over an occupied seat displaces whoever is there, so confirm first —
    // the same guard the canvas drop path uses.
    if (occupantId && occupantId !== guest.id) {
      setPendingSwap({ seatId, occupantName: guestsById.get(occupantId)?.name ?? "" });
      return;
    }
    seatGuest(seatId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      {/* Full-height sheet on phones, centred card from sm: up. dvh so the mobile URL
          bar cannot push the action row off-screen. */}
      <div
        className="flex max-h-[85dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-gray-100 p-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">{t("seatPicker.title")}</h2>
            <p className="mt-0.5 truncate text-sm text-gray-500">
              {t("seatPicker.forGuest", { name: guest.name })}
            </p>
            {currentSeat && (
              <p className="mt-0.5 truncate text-xs text-emerald-600">
                {t("seatPicker.currentSeat", { seat: currentSeat.label })}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-2 flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100"
            aria-label={t("confirm.defaultCancel")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="safe-bottom flex-1 overflow-y-auto p-3">
          {plan.tables.length === 0 && (
            <p className="px-1 py-6 text-center text-sm text-gray-400">{t("seatPicker.noTables")}</p>
          )}

          {plan.tables.map((table) => (
            <div key={table.id} className="mb-4">
              <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {table.name}
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {table.seats.map((seat) => {
                  const occupant = seat.guestId ? guestsById.get(seat.guestId) : undefined;
                  const isThisGuest = seat.guestId === guest.id;
                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat.id, seat.guestId)}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2.5 text-left text-sm ${
                        isThisGuest
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : occupant
                            ? "border-gray-200 bg-gray-50 text-gray-500"
                            : "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      <span className="flex-shrink-0 text-gray-400">
                        {isThisGuest ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Armchair className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{seat.seatNumber}.</span>
                        <span className="block truncate text-xs">
                          {occupant
                            ? t("seatPicker.occupiedBy", { name: occupant.name })
                            : t("seatPicker.free")}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {table.seats.length === 0 && (
                <p className="px-1 text-xs text-gray-300">{t("seatPicker.allFull")}</p>
              )}
            </div>
          ))}
        </div>

        {currentSeat && (
          <div className="safe-bottom border-t border-gray-100 p-3">
            <button
              onClick={() => {
                dispatch({ type: "UNASSIGN_SEAT", seatId: currentSeat.id });
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <UserMinus className="h-4 w-4" />
              {t("seatPicker.unseat")}
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingSwap !== null}
        title={t("seatPicker.swapTitle")}
        message={t("seatPicker.swapMessage", { name: guest.name })}
        confirmLabel={t("seatPicker.swapConfirm")}
        onConfirm={() => {
          if (pendingSwap) seatGuest(pendingSwap.seatId);
          setPendingSwap(null);
        }}
        onCancel={() => setPendingSwap(null)}
      />
    </div>
  );
}
