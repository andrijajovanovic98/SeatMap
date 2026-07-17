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

  if (status === "saving" || syncStatus === "syncing") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("sync.syncing")}
      </span>
    );
  }

  if (status === "idle") return null;

  return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-600">
      <Check className="h-3.5 w-3.5" />
      {t("sync.synced")}
    </span>
  );
}
