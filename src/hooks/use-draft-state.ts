import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

function key(userId: string | undefined, tabId: string) {
  return `draft:${userId ?? "anon"}:${tabId}`;
}

/**
 * Drop-in replacement for useState that auto-persists the value in
 * sessionStorage scoped by user + workspace tab id, so a user that
 * accidentally closes/refreshes the browser tab (or hits a chunk-reload)
 * gets their unsaved form back when they return.
 *
 * Call `clear()` after a successful save or explicit cancel.
 */
export function useDraftState<T>(tabId: string, initial: T) {
  const auth = useAuth();
  const userId = auth.user?.id;
  const storageKey = key(userId, tabId);
  const hydrated = useRef(false);

  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = sessionStorage.getItem(key(undefined, tabId));
      // We don't know userId yet at module init; we re-hydrate below.
      if (raw) return JSON.parse(raw) as T;
    } catch {}
    return initial;
  });

  // Hydrate from user-scoped key once auth is known.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {}
  }, [storageKey]);

  // Persist on change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {}
  }, [storageKey, value]);

  // Warn on tab close while there's a draft.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: BeforeUnloadEvent) => {
      try {
        if (sessionStorage.getItem(storageKey)) {
          e.preventDefault();
          e.returnValue = "";
        }
      } catch {}
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [storageKey]);

  const clear = useCallback(() => {
    try { sessionStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);

  return [value, setValue, clear] as const;
}