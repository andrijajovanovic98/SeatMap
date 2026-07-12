"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { FLOOR_ELEMENT_LABEL_KEYS, TABLE_SHAPE_LABEL_KEYS, TableShape } from "@/types/seating";
import { Copy, Trash2 } from "lucide-react";
import { useState } from "react";

const TABLE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6"];

export function PropertiesPanel() {
  const { plan, selectedId, setSelectedId, dispatch } = usePlan();
  const { t } = useLanguage();
  const [pendingCapacity, setPendingCapacity] = useState<{ id: string; capacity: number } | null>(null);

  const table = plan.tables.find((t) => t.id === selectedId);
  const floorElement = plan.floorElements.find((f) => f.id === selectedId);

  if (!table && !floorElement) {
    return (
      <aside className="hidden h-full w-64 flex-col border-l border-gray-200 bg-white p-4 lg:flex">
        <p className="text-sm text-gray-400">{t("properties.emptyState")}</p>
      </aside>
    );
  }

  const handleDelete = () => {
    if (!selectedId) return;
    dispatch({ type: "DELETE_ITEM", id: selectedId });
    setSelectedId(null);
  };

  const handleDuplicate = () => {
    if (!selectedId) return;
    dispatch({ type: "DUPLICATE_ITEM", id: selectedId, copySuffix: t("properties.copySuffix") });
  };

  const handleCapacityChange = (value: number) => {
    if (!table) return;
    const seatedCountBeyond = table.seats.slice(value).filter((s) => s.guestId).length;
    if (value < table.capacity && seatedCountBeyond > 0) {
      setPendingCapacity({ id: table.id, capacity: value });
      return;
    }
    dispatch({ type: "SET_TABLE_CAPACITY", id: table.id, capacity: value });
  };

  return (
    <aside className="flex h-full w-full flex-col gap-4 overflow-y-auto bg-white p-4 lg:w-64 lg:border-l lg:border-gray-200">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t("properties.heading")}</h2>

      {table && (
        <>
          <Field label={t("properties.tableName")}>
            <input
              value={table.name}
              onChange={(e) => dispatch({ type: "RENAME_ITEM", id: table.id, name: e.target.value })}
              className="input"
            />
          </Field>

          <Field label={t("properties.tableType")}>
            <select
              value={table.shape}
              onChange={(e) =>
                dispatch({ type: "SET_TABLE_SHAPE", id: table.id, shape: e.target.value as TableShape })
              }
              className="input"
            >
              {(Object.keys(TABLE_SHAPE_LABEL_KEYS) as TableShape[]).map((shape) => (
                <option key={shape} value={shape}>
                  {t(TABLE_SHAPE_LABEL_KEYS[shape])}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("properties.seatCount")}>
            <input
              type="number"
              min={1}
              max={30}
              value={table.capacity}
              onChange={(e) => handleCapacityChange(Number(e.target.value))}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label={t("properties.width")}>
              <input
                type="number"
                min={40}
                value={Math.round(table.width)}
                onChange={(e) =>
                  dispatch({ type: "RESIZE_ITEM", id: table.id, width: Number(e.target.value), height: table.height })
                }
                className="input"
              />
            </Field>
            <Field label={t("properties.height")}>
              <input
                type="number"
                min={40}
                value={Math.round(table.height)}
                onChange={(e) =>
                  dispatch({ type: "RESIZE_ITEM", id: table.id, width: table.width, height: Number(e.target.value) })
                }
                className="input"
              />
            </Field>
          </div>

          <Field label={t("properties.rotation", { degrees: Math.round(table.rotation) })}>
            <input
              type="range"
              min={0}
              max={359}
              value={table.rotation}
              onChange={(e) => dispatch({ type: "ROTATE_ITEM", id: table.id, rotation: Number(e.target.value) })}
              className="w-full"
            />
          </Field>

          <Field label={t("properties.tableColor")}>
            <div className="flex gap-2">
              {TABLE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => dispatch({ type: "RECOLOR_ITEM", id: table.id, color })}
                  className={`h-6 w-6 rounded-full border-2 ${
                    table.color === color ? "border-gray-800" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                />
              ))}
            </div>
          </Field>
        </>
      )}

      {floorElement && (
        <>
          <Field label={t("properties.elementName")}>
            <input
              value={floorElement.name}
              onChange={(e) => dispatch({ type: "RENAME_ITEM", id: floorElement.id, name: e.target.value })}
              placeholder={t(FLOOR_ELEMENT_LABEL_KEYS[floorElement.type])}
              className="input"
            />
          </Field>

          <p className="text-xs text-gray-400">{t(FLOOR_ELEMENT_LABEL_KEYS[floorElement.type])}</p>

          <div className="grid grid-cols-2 gap-2">
            <Field label={t("properties.width")}>
              <input
                type="number"
                min={40}
                value={Math.round(floorElement.width)}
                onChange={(e) =>
                  dispatch({
                    type: "RESIZE_ITEM",
                    id: floorElement.id,
                    width: Number(e.target.value),
                    height: floorElement.height,
                  })
                }
                className="input"
              />
            </Field>
            <Field label={t("properties.height")}>
              <input
                type="number"
                min={40}
                value={Math.round(floorElement.height)}
                onChange={(e) =>
                  dispatch({
                    type: "RESIZE_ITEM",
                    id: floorElement.id,
                    width: floorElement.width,
                    height: Number(e.target.value),
                  })
                }
                className="input"
              />
            </Field>
          </div>

          <Field label={t("properties.rotation", { degrees: Math.round(floorElement.rotation) })}>
            <input
              type="range"
              min={0}
              max={359}
              value={floorElement.rotation}
              onChange={(e) =>
                dispatch({ type: "ROTATE_ITEM", id: floorElement.id, rotation: Number(e.target.value) })
              }
              className="w-full"
            />
          </Field>

          <Field label={t("properties.color")}>
            <input
              type="color"
              value={floorElement.color}
              onChange={(e) => dispatch({ type: "RECOLOR_ITEM", id: floorElement.id, color: e.target.value })}
              className="h-8 w-full cursor-pointer rounded border border-gray-300"
            />
          </Field>
        </>
      )}

      <div className="mt-auto flex gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={handleDuplicate}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Copy className="h-4 w-4" />
          {t("properties.duplicate")}
        </button>
        <button
          onClick={handleDelete}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          {t("properties.delete")}
        </button>
      </div>

      <ConfirmDialog
        open={pendingCapacity !== null}
        title={t("properties.capacityWarning.title")}
        message={t("properties.capacityWarning.message")}
        confirmLabel={t("properties.capacityWarning.confirm")}
        danger
        onConfirm={() => {
          if (pendingCapacity) {
            dispatch({ type: "SET_TABLE_CAPACITY", id: pendingCapacity.id, capacity: pendingCapacity.capacity });
          }
          setPendingCapacity(null);
        }}
        onCancel={() => setPendingCapacity(null)}
      />
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
      {label}
      {children}
    </label>
  );
}
