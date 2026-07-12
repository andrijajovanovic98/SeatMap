"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useComments } from "@/context/CommentContext";
import { Check, Trash2, X } from "lucide-react";
import { useState } from "react";

export function CommentsDialog({ onClose }: { onClose: () => void }) {
  const { t, language } = useLanguage();
  const { comments, addComment, markSeen, deleteComment } = useComments();
  const [text, setText] = useState("");

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addComment(trimmed);
    setText("");
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(language === "hu" ? "hu-HU" : "en-US", {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{t("comments.heading")}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("comments.placeholder")}
            rows={2}
            className="input resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAdd();
            }}
          />
          <button
            onClick={handleAdd}
            className="self-end rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t("comments.add")}
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto border-t border-gray-100 pt-3">
          {comments.length === 0 ? (
            <p className="text-center text-sm text-gray-400">{t("comments.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className={`flex items-start gap-2 rounded-lg border p-2.5 text-sm ${
                    comment.seen ? "border-gray-100 bg-white" : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap break-words text-gray-800">{comment.text}</p>
                    <p className="mt-1 text-[11px] text-gray-400">{formatDate(comment.createdAt)}</p>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    {!comment.seen && (
                      <button
                        onClick={() => markSeen(comment.id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-emerald-600"
                        aria-label={t("comments.markSeenAria")}
                        title={t("comments.markSeenAria")}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={t("comments.deleteAria")}
                      title={t("comments.deleteAria")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
