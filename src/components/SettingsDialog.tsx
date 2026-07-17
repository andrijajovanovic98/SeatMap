"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { plan, dispatch } = usePlan();
  const { t } = useLanguage();

  const [width, setWidth] = useState(String(plan.room.width));
  const [height, setHeight] = useState(String(plan.room.height));
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const commitRoomSize = () => {
    const w = Number(width);
    const h = Number(height);
    if (!Number.isFinite(w) || !Number.isFinite(h)) return;
    dispatch({ type: "SET_ROOM_SIZE", width: w, height: h });
  };

  const guestsUsingCategory = (id: string) => plan.guests.filter((g) => g.childAgeId === id).length;

  const handleDeleteCategory = (id: string) => {
    if (guestsUsingCategory(id) > 0) {
      setDeletingId(id);
    } else {
      dispatch({ type: "DELETE_CHILD_AGE_CATEGORY", id });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{t("settings.heading")}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-5 overflow-y-auto">
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t("settings.roomHeading")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                {t("settings.roomWidth")}
                <input
                  type="number"
                  min={400}
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  onBlur={commitRoomSize}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRoomSize();
                  }}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                {t("settings.roomHeight")}
                <input
                  type="number"
                  min={300}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  onBlur={commitRoomSize}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRoomSize();
                  }}
                  className="input"
                />
              </label>
            </div>
            <p className="text-xs text-gray-400">{t("settings.roomHint")}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t("settings.childAgeHeading")}
            </h3>
            <p className="text-xs text-gray-400">{t("settings.childAgeHint")}</p>
            <ul className="flex flex-col gap-1.5">
              {plan.childAgeCategories.map((category) => (
                <li key={category.id} className="flex items-center gap-2">
                  <input
                    value={category.label}
                    onChange={(e) =>
                      dispatch({ type: "RENAME_CHILD_AGE_CATEGORY", id: category.id, label: e.target.value })
                    }
                    placeholder={t("settings.childAgePlaceholder")}
                    className="input flex-1"
                  />
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={t("settings.deleteChildAgeAria")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => dispatch({ type: "ADD_CHILD_AGE_CATEGORY" })}
              className="flex items-center gap-1.5 self-start rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("settings.addChildAge")}
            </button>
          </section>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t("settings.done")}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        title={t("settings.deleteChildAge.title")}
        message={t("settings.deleteChildAge.message", {
          count: deletingId ? guestsUsingCategory(deletingId) : 0,
        })}
        confirmLabel={t("settings.deleteChildAge.confirm")}
        danger
        onConfirm={() => {
          if (deletingId) dispatch({ type: "DELETE_CHILD_AGE_CATEGORY", id: deletingId });
          setDeletingId(null);
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
