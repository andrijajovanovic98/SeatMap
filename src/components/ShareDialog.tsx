"use client";

import { useLanguage } from "@/context/LanguageContext";
import { usePlan } from "@/context/PlanContext";
import { Check, Copy, ExternalLink, Link2, X } from "lucide-react";
import { useState } from "react";

export function ShareDialog({ onClose }: { onClose: () => void }) {
  const { plan, events, activeEventId, setEventShareId } = usePlan();
  const { t } = useLanguage();

  // The share id lives per-event in the events index.
  const existingId = events.find((e) => e.id === activeEventId)?.shareId ?? null;
  const [shareUrl, setShareUrl] = useState<string | null>(() =>
    existingId ? `${window.location.origin}/share/${existingId}` : null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setBusy(true);
    setError(false);
    try {
      const currentId = events.find((e) => e.id === activeEventId)?.shareId ?? undefined;
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentId, plan }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      const data = (await res.json()) as { ok: boolean; id?: string };
      if (!data.ok || !data.id) {
        setError(true);
        return;
      }
      setEventShareId(activeEventId, data.id);
      setShareUrl(`${window.location.origin}/share/${data.id}`);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked; ignore — user can select the text manually
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
          <h2 className="text-base font-semibold text-gray-900">{t("share.heading")}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-500">{t("share.description")}</p>

        <div className="mt-4 space-y-3">
          <button
            onClick={handleGenerate}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Link2 className="h-4 w-4" />
            {busy ? t("share.generating") : shareUrl ? t("share.regenerate") : t("share.generate")}
          </button>

          {error && <p className="text-sm text-red-600">{t("share.error")}</p>}

          {shareUrl && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">{t("share.linkLabel")}</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                  className="input flex-1 text-xs"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("share.copied") : t("share.copy")}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("share.open")}
                </a>
              </div>
              <p className="text-xs text-gray-400">{t("share.updateHint")}</p>
            </div>
          )}

          <p className="text-xs text-gray-400">{t("share.expiryNote")}</p>
        </div>
      </div>
    </div>
  );
}
