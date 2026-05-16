import { useAuth } from "@/hooks/use-auth";
import { MODULE_REGISTRY } from "./module-registry";
import { useWorkspace } from "./workspace-context";

/**
 * Renders every open module simultaneously, hiding inactive ones via
 * `hidden` (display:none). This preserves React state, scroll position,
 * and React Query caches across tab switches. Effects/subscriptions of
 * inactive modules keep running by design (background notifications, etc).
 */
export function WorkspacePanels() {
  const ws = useWorkspace();
  const auth = useAuth();

  return (
    <div className="flex-1 overflow-auto">
      {ws.openTabs.map((key) => {
        const mod = MODULE_REGISTRY[key];
        if (!mod) return null;
        if (mod.adminOnly && !auth.hasRole("admin")) return null;
        const Component = mod.Component;
        const isActive = ws.activeTab === key;
        return (
          <div
            key={key}
            role="tabpanel"
            hidden={!isActive}
            className="p-6"
          >
            <Component />
          </div>
        );
      })}
    </div>
  );
}