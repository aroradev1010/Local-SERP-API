// app/hooks/useQueryHistory.ts
"use client";

import { useCallback, useEffect, useState } from "react";

export type HistoryItem = {
  q: string;
  at: number; // epoch ms
};

const LOCAL_KEY = "localserp:history";
const DEFAULT_LIMIT = 10;

/**
 * A small, reusable hook to manage query history in localStorage.
 */
export function useQueryHistory(limit = DEFAULT_LIMIT) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as HistoryItem[];
      if (Array.isArray(parsed)) {
        setHistory(parsed.slice(0, limit));
      }
    } catch (e) {
      // corrupt data? clear it to avoid future errors
      console.warn("Failed to load query history", e);
      localStorage.removeItem(LOCAL_KEY);
    }
  }, [limit]);

  // helper to persist
  const persist = useCallback(
    (items: HistoryItem[]) => {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, limit)));
      } catch (e) {
        console.warn("Failed to persist query history", e);
      }
    },
    [limit]
  );

  const addQuery = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setHistory((prev) => {
        // put newest first, avoid duplicates (case-insensitive)
        const next = [
          { q: trimmed, at: Date.now() },
          ...prev.filter((p) => p.q.toLowerCase() !== trimmed.toLowerCase()),
        ];
        const limited = next.slice(0, limit);
        persist(limited);
        return limited;
      });
    },
    [limit, persist]
  );

  const removeQuery = useCallback(
    (index: number) => {
      setHistory((prev) => {
        const next = prev.slice();
        next.splice(index, 1);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(LOCAL_KEY);
    } catch (e) {
      /* ignore */
    }
  }, []);

  return {
    history,
    addQuery,
    removeQuery,
    clearHistory,
  } as const;
}
