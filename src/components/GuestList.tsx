"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { GuestAttributesValue } from "@/components/GuestAttributesFields";
import { GuestDialog } from "@/components/GuestDialog";
import { SeatPickerDialog } from "@/components/SeatPickerDialog";
import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { generateId } from "@/lib/id";
import { Guest } from "@/types/seating";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

export function GuestList() {
  const { plan, dispatch } = usePlan();
  const { t } = useLanguage();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null);
  const [seatingGuest, setSeatingGuest] = useState<Guest | null>(null);

  const seatLabelByGuestId = useMemo(() => {
    const map = new Map<string, string>();
    for (const table of plan.tables) {
      for (const seat of table.seats) {
        if (seat.guestId) {
          map.set(seat.guestId, t("seat.label", { table: table.name, seatNumber: seat.seatNumber }));
        }
      }
    }
    return map;
  }, [plan.tables, t]);

  const unassigned = plan.guests.filter((g) => !g.seatId);
  const assigned = plan.guests.filter((g) => g.seatId);

  const handleAddGuest = (name: string, note: string, attrs: GuestAttributesValue) => {
    const id = generateId("guest");
    const attributes = { ...attrs, childAgeId: attrs.childAgeId === "" ? undefined : attrs.childAgeId };
    dispatch({ type: "ADD_GUEST", id, name, note });
    dispatch({ type: "UPDATE_GUEST_ATTRIBUTES", id, attributes });
  };

  const handleEditGuest = (name: string, note: string, attrs: GuestAttributesValue) => {
    if (!editingGuest) return;
    const attributes = { ...attrs, childAgeId: attrs.childAgeId === "" ? undefined : attrs.childAgeId };
    dispatch({ type: "RENAME_GUEST", id: editingGuest.id, name });
    dispatch({ type: "SET_GUEST_NOTE", id: editingGuest.id, note });
    dispatch({ type: "UPDATE_GUEST_ATTRIBUTES", id: editingGuest.id, attributes });
  };

  const handleDelete = () => {
    if (!deletingGuest) return;
    dispatch({ type: "DELETE_GUEST", id: deletingGuest.id });
    setDeletingGuest(null);
  };

  const handleGuestDragStart = (e: React.DragEvent, guestId: string) => {
    e.dataTransfer.setData("application/x-seatflow-guest", guestId);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t("guestList.heading")}</h2>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("guestList.addButton")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <GuestGroup
          title={t("guestList.unassigned", { count: unassigned.length })}
          guests={unassigned}
          seatLabel={seatLabelByGuestId}
          onDragStart={handleGuestDragStart}
          onSeat={setSeatingGuest}
          onEdit={setEditingGuest}
          onDelete={setDeletingGuest}
        />
        <GuestGroup
          title={t("guestList.assigned", { count: assigned.length })}
          guests={assigned}
          seatLabel={seatLabelByGuestId}
          onDragStart={handleGuestDragStart}
          onSeat={setSeatingGuest}
          onEdit={setEditingGuest}
          onDelete={setDeletingGuest}
        />
        {plan.guests.length === 0 && (
          <p className="mt-4 text-center text-sm text-gray-400">{t("guestList.empty")}</p>
        )}
      </div>

      {showAddDialog && (
        <GuestDialog guest={null} onSave={handleAddGuest} onClose={() => setShowAddDialog(false)} />
      )}
      {editingGuest && (
        <GuestDialog guest={editingGuest} onSave={handleEditGuest} onClose={() => setEditingGuest(null)} />
      )}
      {seatingGuest && (
        <SeatPickerDialog guest={seatingGuest} onClose={() => setSeatingGuest(null)} />
      )}

      <ConfirmDialog
        open={deletingGuest !== null}
        title={t("guestList.deleteGuest.title")}
        message={t("guestList.deleteGuest.message", {
          name: deletingGuest?.name ?? t("guestList.deleteGuest.fallbackName"),
        })}
        confirmLabel={t("guestList.deleteGuest.confirm")}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingGuest(null)}
      />
    </div>
  );
}

function GuestGroup({
  title,
  guests,
  seatLabel,
  onDragStart,
  onSeat,
  onEdit,
  onDelete,
}: {
  title: string;
  guests: Guest[];
  seatLabel: Map<string, string>;
  onDragStart: (e: React.DragEvent, guestId: string) => void;
  onSeat: (guest: Guest) => void;
  onEdit: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
}) {
  const { t } = useLanguage();

  if (guests.length === 0) {
    return (
      <div className="mb-4">
        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
        <p className="px-1 text-xs text-gray-300">{t("guestList.emptyGroup")}</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
      <ul className="flex flex-col gap-1">
        {guests.map((guest) => (
          <li
            key={guest.id}
            draggable
            onDragStart={(e) => onDragStart(e, guest.id)}
            className="group flex cursor-grab items-center gap-2 rounded-lg border border-gray-100 px-2.5 py-2 text-sm hover:bg-gray-50 active:cursor-grabbing"
          >
            <UserRound className="h-4 w-4 flex-shrink-0 text-gray-400" />
            {/* Tapping the name opens the seat picker — dragging onto the canvas is
                mouse-only, so this is the only way to seat someone by touch. */}
            <button
              onClick={() => onSeat(guest)}
              className="min-w-0 flex-1 text-left"
              aria-label={t("seatPicker.forGuest", { name: guest.name })}
            >
              <p className="truncate font-medium text-gray-800">{guest.name}</p>
              {seatLabel.get(guest.id) && (
                <p className="truncate text-xs text-emerald-600">{seatLabel.get(guest.id)}</p>
              )}
              {guest.note && <p className="truncate text-xs text-gray-400">{guest.note}</p>}
            </button>
            {/* touch-action-btn keeps these visible and thumb-sized on touch devices,
                where group-hover never fires and they would be unreachable. */}
            <button
              onClick={() => onEdit(guest)}
              className="touch-action-btn flex items-center justify-center rounded p-1 text-gray-400 opacity-0 hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
              aria-label={t("guestList.editAria")}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(guest)}
              className="touch-action-btn flex items-center justify-center rounded p-1 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              aria-label={t("guestList.deleteAria")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
