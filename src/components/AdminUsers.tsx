"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowLeft, LayoutGrid, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PublicUser = {
  username: string;
  role: "admin" | "user";
  createdAt: string;
};

export function AdminUsers() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  /** Maps an API error code to a translated message. */
  const messageFor = useCallback(
    (code: string | undefined) => {
      switch (code) {
        case "invalid_username":
          return t("admin.error.invalidUsername");
        case "invalid_password":
          return t("admin.error.invalidPassword");
        case "user_exists":
          return t("admin.error.userExists");
        case "forbidden":
          return t("admin.error.forbidden");
        default:
          return t("admin.error.generic");
      }
    },
    [t]
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) {
        setError(messageFor(res.status === 403 ? "forbidden" : undefined));
        return;
      }
      const data = (await res.json()) as { users?: PublicUser[]; currentUser?: string };
      setUsers(data.users ?? []);
      setCurrentUser(data.currentUser ?? null);
      setError(null);
    } catch {
      setError(messageFor(undefined));
    } finally {
      setLoading(false);
    }
  }, [messageFor]);

  // Load the list once on mount. Deferred to a microtask so the first state update
  // lands after the initial render rather than synchronously inside the effect.
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) return refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(messageFor(data.error));
        return;
      }
      setUsername("");
      setPassword("");
      setRole("user");
      await refresh();
    } catch {
      setError(messageFor(undefined));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (target: string) => {
    setPendingDelete(null);
    setError(null);
    try {
      const res = await fetch(`/api/users?username=${encodeURIComponent(target)}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(messageFor(data.error));
        return;
      }
      await refresh();
    } catch {
      setError(messageFor(undefined));
    }
  };

  return (
    <div className="min-h-full bg-[#f6f7fb]">
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-indigo-600">
          <LayoutGrid className="h-5 w-5" />
          <span className="text-base font-bold tracking-tight">{t("app.name")}</span>
        </div>
        <Link
          href="/"
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("admin.back")}
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">{t("admin.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("admin.subtitle")}</p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <section className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <UserPlus className="h-4 w-4 text-indigo-600" />
            {t("admin.newUser")}
          </h2>

          <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                {t("admin.username")}
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  required
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                {t("admin.password")}
                {/* Deliberately a text input: the admin types the password and reads it
                    back to hand it over, and it is never retrievable afterwards. */}
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                {t("admin.role")}
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value === "admin" ? "admin" : "user")}
                  className="input"
                >
                  <option value="user">{t("admin.role.user")}</option>
                  <option value="admin">{t("admin.role.admin")}</option>
                </select>
              </label>
            </div>

            <p className="text-xs text-gray-400">
              {t("admin.usernameHint")} {t("admin.passwordHint")}
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t("admin.creating") : t("admin.create")}
            </button>
          </form>
        </section>

        <section className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          {loading ? (
            <p className="px-5 py-6 text-sm text-gray-500">{t("admin.loading")}</p>
          ) : users.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">{t("admin.empty")}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {users.map((user) => {
                const isSelf = user.username === currentUser;
                return (
                  <li key={user.username} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {user.username}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-gray-400">
                            ({t("admin.you")})
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {user.role === "admin" ? t("admin.role.admin") : t("admin.role.user")}
                        {" · "}
                        {t("admin.created")}: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* An admin cannot delete themselves — the server enforces this too. */}
                    {!isSelf && (
                      <button
                        onClick={() => setPendingDelete(user.username)}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={t("admin.delete")}
                        title={t("admin.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("admin.deleteConfirm.title")}
        message={t("admin.deleteConfirm.message")}
        confirmLabel={t("admin.delete")}
        danger
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
