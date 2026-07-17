"use client";

import { usePlan } from "@/context/PlanContext";
import { generateId } from "@/lib/id";
import { commentsKey } from "@/lib/storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

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

function loadComments(eventId: string): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(commentsKey(eventId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Inner provider: its state is seeded from the given event's comments and persists
 * back to that event's key. Remounted (via `key`) whenever the active event changes,
 * so switching events cleanly reloads the right comment set with no effect-driven setState.
 */
function CommentProviderInner({ eventId, children }: { eventId: string; children: React.ReactNode }) {
  const [comments, setComments] = useState<Comment[]>(() => loadComments(eventId));

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(commentsKey(eventId), JSON.stringify(comments));
  }, [comments, eventId]);

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

export function CommentProvider({ children }: { children: React.ReactNode }) {
  const { activeEventId } = usePlan();
  return (
    <CommentProviderInner key={activeEventId} eventId={activeEventId}>
      {children}
    </CommentProviderInner>
  );
}

export function useComments() {
  const ctx = useContext(CommentContext);
  if (!ctx) throw new Error("useComments must be used within CommentProvider");
  return ctx;
}
