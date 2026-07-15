"use client";

import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { buildGuestCsv } from "@/lib/csvExport";
import { isValidPlan } from "@/lib/storage";
import { SeatingPlan } from "@/types/seating";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

export function ExportImportDialog({ onClose }: { onClose: () => void }) {
  const { plan, replacePlan } = usePlan();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeFileName = () =>
    plan.eventName.trim().replace(/[^\p{L}\p{N}\-_ ]/gu, "") || t("exportImport.filenameFallback");

  const downloadBlob = (content: string, mimeType: string, extension: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFileName()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    downloadBlob(JSON.stringify(plan, null, 2), "application/json", "json");
  };

  const handleExportCsv = () => {
    downloadBlob(buildGuestCsv(plan, t), "text/csv;charset=utf-8", "csv");
  };

  const handleImportClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!isValidPlan(data)) {
        setError(t("exportImport.invalidFile"));
        return;
      }
      replacePlan(data as SeatingPlan);
      onClose();
    } catch {
      setError(t("exportImport.unreadableFile"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{t("exportImport.heading")}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <button
            onClick={handleExport}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Download className="h-4 w-4" />
            {t("exportImport.exportButton")}
          </button>

          <button
            onClick={handleExportCsv}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {t("exportImport.csvButton")}
          </button>

          <button
            onClick={handleImportClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            {t("exportImport.importButton")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <p className="text-xs text-gray-500">{t("exportImport.warning")}</p>
        </div>
      </div>
    </div>
  );
}
