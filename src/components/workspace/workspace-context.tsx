import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_TAB, MODULE_REGISTRY, type ModuleKey } from "./module-registry";

export type ModuleTab = {
  kind: "module";
  id: string;
  moduleKey: ModuleKey;
};

export type ViewTab = {
  kind: "view";
  id: string;
  viewKey: string;
  title: string;
  iconKey?: string;
  parentModule?: ModuleKey;
  payload?: Record<string, any>;
};

export type WorkspaceTab = ModuleTab | ViewTab;

export const moduleId = (k: ModuleKey) => `mod:${k}`;

interface WorkspaceState {
  openTabs: WorkspaceTab[];
  activeId: string;
  openModule: (key: ModuleKey, opts?: { focus?: boolean }) => void;
  openView: (spec: Omit<ViewTab, "kind">, opts?: { focus?: boolean }) => void;
  setActive: (id: string) => void;
  closeTab: (id: string) => void;
  updateTab: (id: string, patch: Partial<Omit<ViewTab, "kind" | "id">>) => void;
  closeOthers: (id: string) => void;
  closeToRight: (id: string) => void;
  closeAll: () => void;
}

const WorkspaceCtx = createContext<WorkspaceState | null>(null);

interface Persisted {
  tabs: WorkspaceTab[];
  active: string;
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
    const tabs = (data.tabs ?? []).filter((t: any): t is WorkspaceTab => {
      if (!t || typeof t !== "object") return false;
      if (t.kind === "module") return t.moduleKey in MODULE_REGISTRY;
      if (t.kind === "view") return typeof t.viewKey === "string" && typeof t.id === "string";
      return false;
    });
    const hasDefault = tabs.some((t) => t.kind === "module" && t.moduleKey === DEFAULT_TAB);
    if (!hasDefault) tabs.unshift({ kind: "module", id: moduleId(DEFAULT_TAB), moduleKey: DEFAULT_TAB });
    const active = tabs.some((t) => t.id === data.active) ? data.active : moduleId(DEFAULT_TAB);
    return { tabs, active };
  } catch {
    return null;
  }
}

const initialTabs = (): WorkspaceTab[] => [
  { kind: "module", id: moduleId(DEFAULT_TAB), moduleKey: DEFAULT_TAB },
];

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const userId = auth.user?.id;

  const [openTabs, setOpenTabs] = useState<WorkspaceTab[]>(() => {
    const p = loadPersisted(userId);
    return p?.tabs ?? initialTabs();
  });
  const [activeId, setActiveId] = useState<string>(() => {
    const p = loadPersisted(userId);
    return p?.active ?? moduleId(DEFAULT_TAB);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        storageKey(userId),
        JSON.stringify({ tabs: openTabs, active: activeId } satisfies Persisted),
      );
    } catch { /* ignore */ }
  }, [openTabs, activeId, userId]);

  const skipNav = useRef(false);
  const tabsRef = useRef(openTabs);
  useEffect(() => { tabsRef.current = openTabs; }, [openTabs]);

  const setActive = useCallback((id: string) => {
    setActiveId((cur) => {
      if (cur === id) return cur;
      const tab = tabsRef.current.find((t) => t.id === id);
      if (tab?.kind === "module") {
        const mod = MODULE_REGISTRY[tab.moduleKey];
        if (mod) {
          skipNav.current = true;
          navigate({ to: mod.routeTo, replace: true });
        }
      }
      return id;
    });
  }, [navigate]);

  const openModule = useCallback((key: ModuleKey, opts?: { focus?: boolean }) => {
    const focus = opts?.focus ?? true;
    const id = moduleId(key);
    setOpenTabs((cur) => (cur.some((t) => t.id === id) ? cur : [...cur, { kind: "module", id, moduleKey: key }]));
    if (focus) setActiveId(id);
  }, []);

  const openView = useCallback((spec: Omit<ViewTab, "kind">, opts?: { focus?: boolean }) => {
    const focus = opts?.focus ?? true;
    setOpenTabs((cur) => (cur.some((t) => t.id === spec.id) ? cur : [...cur, { kind: "view", ...spec }]));
    if (focus) setActiveId(spec.id);
  }, []);

  const updateTab = useCallback((id: string, patch: Partial<Omit<ViewTab, "kind" | "id">>) => {
    setOpenTabs((cur) => cur.map((t) => (t.id === id && t.kind === "view" ? { ...t, ...patch } : t)));
  }, []);

  const closeTab = useCallback((id: string) => {
    setOpenTabs((cur) => {
      const idx = cur.findIndex((t) => t.id === id);
      if (idx < 0) return cur;
      const tab = cur[idx];
      if (tab.kind === "module" && MODULE_REGISTRY[tab.moduleKey]?.pinned) return cur;
      const next = cur.filter((t) => t.id !== id);
      if (activeId === id) {
        const fallback = next[idx - 1] ?? next[0] ?? { kind: "module" as const, id: moduleId(DEFAULT_TAB), moduleKey: DEFAULT_TAB };
        setActiveId(fallback.id);
        if (fallback.kind === "module") {
          const mod = MODULE_REGISTRY[fallback.moduleKey];
          if (mod) {
            skipNav.current = true;
            navigate({ to: mod.routeTo, replace: true });
          }
        }
      }
      return next.length ? next : initialTabs();
    });
  }, [activeId, navigate]);

  const closeOthers = useCallback((id: string) => {
    setOpenTabs((cur) =>
      cur.filter((t) => t.id === id || (t.kind === "module" && MODULE_REGISTRY[t.moduleKey]?.pinned)),
    );
    setActive(id);
  }, [setActive]);

  const closeToRight = useCallback((id: string) => {
    setOpenTabs((cur) => {
      const idx = cur.findIndex((t) => t.id === id);
      if (idx < 0) return cur;
      return cur.filter((t, i) => i <= idx || (t.kind === "module" && MODULE_REGISTRY[t.moduleKey]?.pinned));
    });
    setActive(id);
  }, [setActive]);

  const closeAll = useCallback(() => {
    setOpenTabs(initialTabs());
    const id = moduleId(DEFAULT_TAB);
    setActiveId(id);
    const mod = MODULE_REGISTRY[DEFAULT_TAB];
    if (mod) {
      skipNav.current = true;
      navigate({ to: mod.routeTo, replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "w") {
        const tab = tabsRef.current.find((t) => t.id === activeId);
        if (!tab) return;
        if (tab.kind === "module" && MODULE_REGISTRY[tab.moduleKey]?.pinned) return;
        e.preventDefault();
        closeTab(activeId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeId, closeTab]);

  const value = useMemo<WorkspaceState>(() => ({
    openTabs, activeId, openModule, openView, setActive, closeTab, updateTab, closeOthers, closeToRight, closeAll,
  }), [openTabs, activeId, openModule, openView, setActive, closeTab, updateTab, closeOthers, closeToRight, closeAll]);

  useEffect(() => { skipNav.current = false; });

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

export function useEnsureTab(key: ModuleKey) {
  const ws = useContext(WorkspaceCtx);
  useEffect(() => {
    if (!ws) return;
    ws.openModule(key, { focus: true });
  }, [ws, key]);
}

/** Hook for view components to find their own tab id from context. */
export const ViewTabContext = createContext<{ tabId: string } | null>(null);

export function useViewTab() {
  return useContext(ViewTabContext);
}
