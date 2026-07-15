"use client";

import { CommentsDialog } from "@/components/CommentsDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ExportImportDialog } from "@/components/ExportImportDialog";
import { SaveIndicator } from "@/components/SaveIndicator";
import { StatsBar } from "@/components/StatsBar";
import { useComments } from "@/context/CommentContext";
import { usePlan } from "@/context/PlanContext";
import { useLanguage } from "@/context/LanguageContext";
import { createDemoPlan } from "@/lib/demoPlan";
import { clearPlan, savePlan } from "@/lib/storage";
import { FileDown, LayoutGrid, LogOut, MessageSquare, Menu, Plus, Printer, Save } from "lucide-react";
import { useState } from "react";

export function AppHeader({
  onOpenGuestList,
  onOpenToolbar,
}: {
  onOpenGuestList?: () => void;
  onOpenToolbar?: () => void;
}) {
  const { plan, dispatch, saveStatus, replacePlan } = usePlan();
  const { language, setLanguage, t } = useLanguage();
  const { unseenCount } = useComments();
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleNewPlan = () => {
    clearPlan();
    replacePlan(createDemoPlan());
    setShowNewConfirm(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <header className="no-print flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-2.5 shadow-sm">
      <button
        onClick={onOpenToolbar}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label={t("header.openToolbarAria")}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1.5 text-indigo-600">
        <LayoutGrid className="h-5 w-5" />
        <span className="text-lg font-bold tracking-tight">{t("app.name")}</span>
      </div>

      <input
        value={plan.eventName}
        onChange={(e) => dispatch({ type: "SET_EVENT_NAME", name: e.target.value })}
        className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-gray-700 hover:border-gray-200 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:max-w-xs"
        aria-label={t("app.eventNameAriaLabel")}
      />

      <div className="hidden md:block">
        <StatsBar />
      </div>

      <SaveIndicator status={saveStatus} />

      <div className="ml-auto flex items-center gap-1.5">
        <div
          className="flex items-center rounded-lg border border-gray-200 p-0.5 text-xs font-medium"
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
        <button
          onClick={onOpenGuestList}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          {t("header.guests")}
        </button>
        <button
          onClick={() => setShowNewConfirm(true)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.newPlan")}</span>
        </button>
        <button
          onClick={() => setShowExportImport(true)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.exportImport")}</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.print")}</span>
        </button>
        <button
          onClick={() => savePlan(plan)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.save")}</span>
        </button>
        <button
          onClick={() => setShowComments(true)}
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          aria-label={t("comments.heading")}
          title={t("comments.heading")}
        >
          <MessageSquare className="h-4 w-4" />
          {unseenCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
              {unseenCount}
            </span>
          )}
        </button>
        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          aria-label={t("header.logout")}
          title={t("header.logout")}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <ConfirmDialog
        open={showNewConfirm}
        title={t("header.newPlan.title")}
        message={t("header.newPlan.message")}
        confirmLabel={t("header.newPlan.confirm")}
        danger
        onConfirm={handleNewPlan}
        onCancel={() => setShowNewConfirm(false)}
      />

      {showExportImport && <ExportImportDialog onClose={() => setShowExportImport(false)} />}
      {showComments && <CommentsDialog onClose={() => setShowComments(false)} />}
    </header>
  );
}
