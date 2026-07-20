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
import { clearLocalAccount, saveEvent } from "@/lib/storage";
import { FileDown, LayoutGrid, LogOut, MessageSquare, Menu, MoreVertical, Plus, Printer, Save, Settings, Share2, Users, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function AppHeader({
  onOpenGuestList,
  onOpenToolbar,
}: {
  onOpenGuestList?: () => void;
  onOpenToolbar?: () => void;
}) {
  const { plan, saveStatus, syncStatus, createEvent } = usePlan();
  const { language, setLanguage, t } = useLanguage();
  const { unseenCount } = useComments();
  const [showExportImport, setShowExportImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Decides whether to show the admin shortcut. Purely cosmetic: /api/users
  // verifies the role server-side on every request.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const data = (await res.json()) as { role?: string };
        if (!cancelled) setIsAdmin(data.role === "admin");
      } catch {
        // offline or unauthenticated; leave the admin button hidden
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      // Drop this browser's cached plans so the next user to sign in here starts
      // from their own server-side account, not the previous user's leftovers.
      clearLocalAccount();
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

      {/* The wordmark costs ~100px of a 320px-wide header; the mark alone still
          identifies the app, so the text only appears once there is room for it. */}
      <div className="flex items-center gap-1.5 text-indigo-600">
        <LayoutGrid className="h-5 w-5" />
        <span className="hidden text-lg font-bold tracking-tight sm:inline">{t("app.name")}</span>
      </div>

      <EventSwitcher />

      <div className="hidden md:block">
        <StatsBar />
      </div>

      <SaveIndicator status={saveStatus} syncStatus={syncStatus} />

      <div className="ml-auto flex items-center gap-1.5">
        {/* Thirteen controls cannot fit a phone's width, so below lg: only Guests,
            Share and Comments stay out here and the rest move into the ⋯ menu.
            Everything is still rendered at lg: and up, unchanged. */}
        <div
          className="hidden items-center rounded-lg border border-gray-200 p-0.5 text-xs font-medium lg:flex"
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
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 sm:flex lg:hidden"
          aria-label={t("header.guests")}
          title={t("header.guests")}
        >
          <UsersRound className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.guests")}</span>
        </button>
        <button
          onClick={() => createEvent(t("events.newEvent.defaultName"))}
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 lg:flex"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("events.newEvent")}</span>
        </button>
        <button
          onClick={() => setShowExportImport(true)}
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 lg:flex"
        >
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.exportImport")}</span>
        </button>
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          aria-label={t("header.share")}
          title={t("header.share")}
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.share")}</span>
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:block"
          aria-label={t("header.settings")}
          title={t("header.settings")}
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          onClick={handlePrint}
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 lg:flex"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.print")}</span>
        </button>
        <button
          onClick={() => saveEvent(plan)}
          className="hidden items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 lg:flex"
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
        {isAdmin && (
          <a
            href="/admin"
            className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:block"
            aria-label={t("header.users")}
            title={t("header.users")}
          >
            <Users className="h-4 w-4" />
          </a>
        )}

        <HeaderOverflowMenu
          isAdmin={isAdmin}
          language={language}
          setLanguage={setLanguage}
          onOpenGuestList={onOpenGuestList}
          onNewEvent={() => createEvent(t("events.newEvent.defaultName"))}
          onExportImport={() => setShowExportImport(true)}
          onSettings={() => setShowSettings(true)}
          onPrint={handlePrint}
          onSave={() => saveEvent(plan)}
          onLogout={handleLogout}
        />

        <button
          onClick={handleLogout}
          className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:block"
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

/**
 * The actions that do not fit a phone header, behind a ⋯ button. Hidden at lg: and up,
 * where every control has room to sit in the header itself.
 */
function HeaderOverflowMenu({
  isAdmin,
  language,
  setLanguage,
  onOpenGuestList,
  onNewEvent,
  onExportImport,
  onSettings,
  onPrint,
  onSave,
  onLogout,
}: {
  isAdmin: boolean;
  language: string;
  setLanguage: (lang: "hu" | "en") => void;
  onOpenGuestList?: () => void;
  onNewEvent: () => void;
  onExportImport: () => void;
  onSettings: () => void;
  onPrint: () => void;
  onSave: () => void;
  onLogout: () => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside tap and on Escape, the two ways a user expects to dismiss a menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /** Every item closes the menu, so callers pass only their own action. */
  const item = (icon: React.ReactNode, label: string, action: () => void) => (
    <button
      onClick={() => {
        setOpen(false);
        action();
      }}
      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </button>
  );

  return (
    <div ref={rootRef} className="relative lg:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        aria-label={t("header.more")}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {/* Guests has its own header button from sm: up; on the narrowest phones
              there is no room for it, so it lives here too. */}
          {onOpenGuestList && (
            <div className="sm:hidden">
              {item(<UsersRound className="h-4 w-4" />, t("header.guests"), onOpenGuestList)}
            </div>
          )}
          {item(<Plus className="h-4 w-4" />, t("events.newEvent"), onNewEvent)}
          {item(<Save className="h-4 w-4" />, t("header.save"), onSave)}
          {item(<FileDown className="h-4 w-4" />, t("header.exportImport"), onExportImport)}
          {item(<Printer className="h-4 w-4" />, t("header.print"), onPrint)}
          {item(<Settings className="h-4 w-4" />, t("header.settings"), onSettings)}
          {isAdmin && (
            <a
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="text-gray-400">
                <Users className="h-4 w-4" />
              </span>
              {t("header.users")}
            </a>
          )}

          <div className="my-1 border-t border-gray-100" />

          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-sm text-gray-500">{t("header.language")}</span>
            <div className="ml-auto flex items-center rounded-lg border border-gray-200 p-0.5 text-xs font-medium">
              <button
                onClick={() => setLanguage("hu")}
                className={`rounded-md px-2.5 py-1.5 ${
                  language === "hu" ? "bg-indigo-600 text-white" : "text-gray-500"
                }`}
              >
                HU
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`rounded-md px-2.5 py-1.5 ${
                  language === "en" ? "bg-indigo-600 text-white" : "text-gray-500"
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <div className="my-1 border-t border-gray-100" />

          {item(<LogOut className="h-4 w-4" />, t("header.logout"), onLogout)}
        </div>
      )}
    </div>
  );
}
