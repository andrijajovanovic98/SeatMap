"use client";

import { PrintView } from "@/components/PrintView";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { SeatingPlan } from "@/types/seating";
import { Eye } from "lucide-react";

function ViewHeader() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <header className="mb-6 flex flex-wrap items-center gap-3 border-b border-gray-200 pb-3">
      <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
        <Eye className="h-3.5 w-3.5" />
        {t("share.viewOnlyBadge")}
      </div>
      <div
        className="ml-auto flex items-center rounded-lg border border-gray-200 p-0.5 text-xs font-medium"
        role="group"
        aria-label={t("header.language")}
      >
        <button
          onClick={() => setLanguage("hu")}
          className={`rounded-md px-2 py-1 ${
            language === "hu" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          HU
        </button>
        <button
          onClick={() => setLanguage("en")}
          className={`rounded-md px-2 py-1 ${
            language === "en" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          EN
        </button>
      </div>
    </header>
  );
}

export function SharedPlanView({ plan }: { plan: SeatingPlan }) {
  return (
    <LanguageProvider>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <ViewHeader />
        <PrintView plan={plan} screen />
      </div>
    </LanguageProvider>
  );
}
