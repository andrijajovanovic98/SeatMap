"use client";

import { CommentsDialog } from "@/components/CommentsDialog";
import { EventSwitcher } from "@/components/EventSwitcher";
import { ExportImportDialog } from "@/components/ExportImportDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { SaveIndicator } from "@/components/SaveIndicator";
import { StatsBar } from "@/components/StatsBar";
import { useComments } from "@/context/CommentContext";
import { usePlan } from "@/context/PlanContext";
import { useLanguage } from "@/context/LanguageContext";
import { saveEvent } from "@/lib/storage";
import { FileDown, LayoutGrid, LogOut, MessageSquare, Menu, Plus, Printer, Save, Settings, Share2 } from "lucide-react";
import { useState } from "react";

export function AppHeader({
  onOpenGuestList,
  onOpenToolbar,
}: {
  onOpenGuestList?: () => void;
  onOpenToolbar?: () => void;
}) {
  const { plan, saveStatus, createEvent } = usePlan();
  const { language, setLanguage, t } = useLanguage();
  const { unseenCount } = useComments();
  const [showExportImport, setShowExportImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);

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

      <EventSwitcher />

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
          onClick={() => createEvent(t("events.newEvent.defaultName"))}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("events.newEvent")}</span>
        </button>
        <button
          onClick={() => setShowExportImport(true)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.exportImport")}</span>
        </button>
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.share")}</span>
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          aria-label={t("header.settings")}
          title={t("header.settings")}
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.print")}</span>
        </button>
        <button
          onClick={() => saveEvent(plan)}
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

      {showExportImport && <ExportImportDialog onClose={() => setShowExportImport(false)} />}
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showShare && <ShareDialog onClose={() => setShowShare(false)} />}
      {showComments && <CommentsDialog onClose={() => setShowComments(false)} />}
    </header>
  );
}
