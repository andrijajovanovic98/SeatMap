"use client";

import { useLanguage } from "@/context/LanguageContext";
import { SaveStatus, SyncStatus } from "@/context/PlanContext";
import { Check, CloudOff, Loader2 } from "lucide-react";

export function SaveIndicator({ status, syncStatus }: { status: SaveStatus; syncStatus: SyncStatus }) {
  const { t } = useLanguage();

  // Offline is the most important thing to surface — the user's work is safe
  // locally but not yet in the cloud.
  if (syncStatus === "offline") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-600" title={t("sync.offline.hint")}>
        <CloudOff className="h-3.5 w-3.5" />
        {t("sync.offline")}
      </span>
    );
  }

  // Below lg: only the icon shows. The label is reassurance, not information, and its
  // width is what pushed the phone header onto a second row. Offline above keeps its
  // text, because that one is a warning the user needs to read.
  if (status === "saving" || syncStatus === "syncing") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-500" title={t("sync.syncing")}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="hidden lg:inline">{t("sync.syncing")}</span>
      </span>
    );
  }

  if (status === "idle") return null;

  return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-600" title={t("sync.synced")}>
      <Check className="h-3.5 w-3.5" />
      <span className="hidden lg:inline">{t("sync.synced")}</span>
    </span>
  );
}
