"use client";

import { generateId } from "@/lib/id";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const COMMENTS_STORAGE_KEY = "seatflow.comments.v1";

export type Comment = {
  id: string;
  text: string;
  createdAt: string;
  seen: boolean;
};

type CommentContextValue = {
  comments: Comment[];
  unseenCount: number;
  addComment: (text: string) => void;
  markSeen: (id: string) => void;
  markAllSeen: () => void;
  deleteComment: (id: string) => void;
};

const CommentContext = createContext<CommentContextValue | null>(null);

function loadComments(): Comment[] {
  try {
    const raw = window.localStorage.getItem(COMMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function CommentProvider({ children }: { children: React.ReactNode }) {
  const [comments, setComments] = useState<Comment[]>(() => loadComments());

  useEffect(() => {
    window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
  }, [comments]);

  const addComment = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const comment: Comment = {
      id: generateId("comment"),
      text: trimmed,
      createdAt: new Date().toISOString(),
      seen: false,
    };
    setComments((prev) => [comment, ...prev]);
  }, []);

  const markSeen = useCallback((id: string) => {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, seen: true } : c)));
  }, []);

  const markAllSeen = useCallback(() => {
    setComments((prev) => prev.map((c) => ({ ...c, seen: true })));
  }, []);

  const deleteComment = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const unseenCount = comments.filter((c) => !c.seen).length;

  return (
    <CommentContext.Provider
      value={{ comments, unseenCount, addComment, markSeen, markAllSeen, deleteComment }}
    >
      {children}
    </CommentContext.Provider>
  );
}

export function useComments() {
  const ctx = useContext(CommentContext);
  if (!ctx) throw new Error("useComments must be used within CommentProvider");
  return ctx;
}
