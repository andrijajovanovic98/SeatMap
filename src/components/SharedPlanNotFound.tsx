"use client";

import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { CalendarX } from "lucide-react";

function NotFoundInner() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <CalendarX className="h-10 w-10 text-gray-300" />
      <h1 className="text-lg font-semibold text-gray-800">{t("share.notFound.title")}</h1>
      <p className="max-w-sm text-sm text-gray-500">{t("share.notFound.message")}</p>
    </div>
  );
}

export function SharedPlanNotFound() {
  return (
    <LanguageProvider>
      <NotFoundInner />
    </LanguageProvider>
  );
}
