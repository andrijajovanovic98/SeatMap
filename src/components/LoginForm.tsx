"use client";

import { LoginScene } from "@/components/LoginScene";
import { useLanguage } from "@/context/LanguageContext";
import { LayoutGrid } from "lucide-react";
import { useState } from "react";

export function LoginForm() {
  const { language, setLanguage, t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      if (res.status === 429) {
        setError(t("login.error.rateLimited"));
      } else if (res.status === 401) {
        setError(t("login.error.invalid"));
      } else {
        setError(t("login.error.generic"));
      }
    } catch {
      setError(t("login.error.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-[#eef0fb]">
      {/* decorative party scene fills the entire page, not just a top band */}
      <LoginScene />

      {/* language toggle, pinned top-right above the scene */}
      <div
        className="absolute right-4 top-4 z-20 flex items-center rounded-lg border border-gray-200 bg-white/85 p-0.5 text-xs font-medium backdrop-blur"
        role="group"
        aria-label={t("header.language")}
      >
        <button
          type="button"
          onClick={() => setLanguage("hu")}
          className={`rounded-md px-2 py-1 ${
            language === "hu" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          HU
        </button>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`rounded-md px-2 py-1 ${
            language === "en" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          EN
        </button>
      </div>

      {/* login card, overlapping the lower part of the scene */}
      <div className="relative z-10 mx-auto mt-[210px] w-full max-w-sm flex-1 px-4 pb-16">
        <div className="rounded-2xl bg-white p-6 shadow-[0_16px_44px_rgba(31,41,55,0.16)] ring-1 ring-black/5">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-2 flex items-center gap-1.5 text-indigo-600">
              <LayoutGrid className="h-6 w-6" />
              <span className="text-xl font-bold tracking-tight">{t("app.name")}</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">{t("login.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("login.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              {t("login.username")}
              <input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="input"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              {t("login.password")}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="input"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t("login.submitting") : t("login.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
