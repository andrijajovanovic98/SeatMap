"use client";

import { useLanguage } from "@/context/LanguageContext";
import { SaveStatus } from "@/context/PlanContext";
import { Check, Loader2 } from "lucide-react";

export function SaveIndicator({ status }: { status: SaveStatus }) {
  const { t } = useLanguage();

  if (status === "idle") return null;

  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("save.saving")}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-600">
      <Check className="h-3.5 w-3.5" />
      {t("save.saved")}
    </span>
  );
}
