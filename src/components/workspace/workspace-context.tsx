import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_TAB, MODULE_REGISTRY, type ModuleKey } from "./module-registry";

interface WorkspaceState {
  openTabs: ModuleKey[];
  activeTab: ModuleKey;
  openTab: (key: ModuleKey, opts?: { focus?: boolean }) => void;
  setActive: (key: ModuleKey) => void;
  closeTab: (key: ModuleKey) => void;
  closeOthers: (key: ModuleKey) => void;
  closeToRight: (key: ModuleKey) => void;
  closeAll: () => void;
}

const WorkspaceCtx = createContext<WorkspaceState | null>(null);

interface Persisted {
  tabs: ModuleKey[];
  active: ModuleKey;
}

function storageKey(userId: string | undefined) {
  return `workspace:admin:${userId ?? "anon"}`;
}

function loadPersisted(userId: string | undefined): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const data = JSON.parse(raw) as Persisted;
    const tabs = (data.tabs ?? []).filter((k): k is ModuleKey => k in MODULE_REGISTRY);
    if (!tabs.includes(DEFAULT_TAB)) tabs.unshift(DEFAULT_TAB);
    const active = (data.active && tabs.includes(data.active) ? data.active : DEFAULT_TAB) as ModuleKey;
    return { tabs, active };
  } catch {
    return null;
  }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const userId = auth.user?.id;

  const [openTabs, setOpenTabs] = useState<ModuleKey[]>(() => {
    const p = loadPersisted(userId);
    return p?.tabs ?? [DEFAULT_TAB];
  });
  const [activeTab, setActiveTab] = useState<ModuleKey>(() => {
    const p = loadPersisted(userId);
    return p?.active ?? DEFAULT_TAB;
  });

  // Persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        storageKey(userId),
        JSON.stringify({ tabs: openTabs, active: activeTab } satisfies Persisted),
      );
    } catch { /* ignore */ }
  }, [openTabs, activeTab, userId]);

  // Avoid navigate loop: only navigate when we change active programmatically
  const skipNav = useRef(false);

  const setActive = useCallback((key: ModuleKey) => {
    setActiveTab((cur) => {
      if (cur === key) return cur;
      const mod = MODULE_REGISTRY[key];
      if (mod) {
        skipNav.current = true;
        navigate({ to: mod.routeTo, replace: true });
      }
      return key;
    });
  }, [navigate]);

  const openTab = useCallback((key: ModuleKey, opts?: { focus?: boolean }) => {
    const focus = opts?.focus ?? true;
    setOpenTabs((cur) => (cur.includes(key) ? cur : [...cur, key]));
    if (focus) setActiveTab(key);
  }, []);

  const closeTab = useCallback((key: ModuleKey) => {
    if (MODULE_REGISTRY[key]?.pinned) return;
    setOpenTabs((cur) => {
      const idx = cur.indexOf(key);
      if (idx < 0) return cur;
      const next = cur.filter((k) => k !== key);
      if (activeTab === key) {
        const fallback = next[idx - 1] ?? next[0] ?? DEFAULT_TAB;
        setActiveTab(fallback);
        const mod = MODULE_REGISTRY[fallback];
        if (mod) {
          skipNav.current = true;
          navigate({ to: mod.routeTo, replace: true });
        }
      }
      return next.length ? next : [DEFAULT_TAB];
    });
  }, [activeTab, navigate]);

  const closeOthers = useCallback((key: ModuleKey) => {
    setOpenTabs((cur) => cur.filter((k) => k === key || MODULE_REGISTRY[k]?.pinned));
    setActive(key);
  }, [setActive]);

  const closeToRight = useCallback((key: ModuleKey) => {
    setOpenTabs((cur) => {
      const idx = cur.indexOf(key);
      if (idx < 0) return cur;
      return cur.filter((k, i) => i <= idx || MODULE_REGISTRY[k]?.pinned);
    });
    setActive(key);
  }, [setActive]);

  const closeAll = useCallback(() => {
    setOpenTabs([DEFAULT_TAB]);
    setActive(DEFAULT_TAB);
  }, [setActive]);

  // Keyboard: Ctrl/Cmd+W to close current
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "w") {
        if (MODULE_REGISTRY[activeTab]?.pinned) return;
        e.preventDefault();
        closeTab(activeTab);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, closeTab]);

  const value = useMemo<WorkspaceState>(() => ({
    openTabs, activeTab, openTab, setActive, closeTab, closeOthers, closeToRight, closeAll,
  }), [openTabs, activeTab, openTab, setActive, closeTab, closeOthers, closeToRight, closeAll]);

  // Consume the navigation skip flag once route effects fire
  useEffect(() => { skipNav.current = false; });

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

/**
 * Route-side hook: each admin.<module>.tsx route uses this in a useEffect to
 * ensure the workspace tab exists and is focused when that URL loads.
 */
export function useEnsureTab(key: ModuleKey) {
  const ws = useContext(WorkspaceCtx);
  useEffect(() => {
    if (!ws) return;
    ws.openTab(key, { focus: true });
  }, [ws, key]);
}