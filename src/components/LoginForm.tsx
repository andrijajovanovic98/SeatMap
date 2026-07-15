"use client";

import { useLanguage } from "@/context/LanguageContext";
import { LayoutGrid, Lock } from "lucide-react";
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
    <div className="flex min-h-full flex-1 items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-indigo-600">
            <LayoutGrid className="h-6 w-6" />
            <span className="text-xl font-bold tracking-tight">{t("app.name")}</span>
          </div>
          <div
            className="flex items-center rounded-lg border border-gray-200 p-0.5 text-xs font-medium"
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
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Lock className="h-5 w-5" />
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
              className="mt-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t("login.submitting") : t("login.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
