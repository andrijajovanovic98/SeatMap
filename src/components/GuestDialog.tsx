"use client";

import { GuestAttributesFields, GuestAttributesValue } from "@/components/GuestAttributesFields";
import { useLanguage } from "@/context/LanguageContext";
import { Guest } from "@/types/seating";
import { X } from "lucide-react";
import { useState } from "react";

export function GuestDialog({
  guest,
  onSave,
  onClose,
}: {
  guest: Guest | null;
  onSave: (name: string, note: string, attributes: GuestAttributesValue) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState(guest?.name ?? "");
  const [note, setNote] = useState(guest?.note ?? "");
  const [attrs, setAttrs] = useState<GuestAttributesValue>({
    glutenFree: guest?.glutenFree ?? false,
    lactoseFree: guest?.lactoseFree ?? false,
    otherAllergy: guest?.otherAllergy ?? false,
    childAge: guest?.childAge ?? "",
    highChair: guest?.highChair ?? false,
  });

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, note, attrs);
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
            {guest ? t("guestDialog.editHeading") : t("guestDialog.addHeading")}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 overflow-y-auto">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            {t("guestDialog.nameLabel")}
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("guestDialog.namePlaceholder")}
              className="input"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
            {t("guestDialog.noteLabelOptional")}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="input resize-none"
            />
          </label>

          <GuestAttributesFields value={attrs} onChange={setAttrs} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
            {t("guestDialog.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t("guestDialog.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
