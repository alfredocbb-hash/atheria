import { useAuth } from "@/hooks/use-auth";
import { MODULE_REGISTRY } from "./module-registry";
import { VIEW_REGISTRY } from "./dynamic-views";
import { useWorkspace } from "./workspace-context";
import { ViewErrorBoundary } from "./view-error-boundary";

export function WorkspacePanels() {
  const ws = useWorkspace();
  const auth = useAuth();
  return (
    <div className="flex-1 overflow-auto">
      {ws.openTabs.map((tab) => {
        const isActive = ws.activeId === tab.id;
        if (tab.kind === "module") {
          const mod = MODULE_REGISTRY[tab.moduleKey];
          if (!mod) return null;
          if (mod.adminOnly && !auth.hasRole("admin")) return null;
          const C = mod.Component;
          return (
            <div key={tab.id} role="tabpanel" hidden={!isActive} className="p-6">
              <ViewErrorBoundary tabId={tab.id} title={mod.title} onClose={ws.closeTab}>
                <C />
              </ViewErrorBoundary>
            </div>
          );
        }
        const V = VIEW_REGISTRY[tab.viewKey];
        if (!V) return null;
        return (
          <div key={tab.id} role="tabpanel" hidden={!isActive} className="p-6">
            <ViewErrorBoundary tabId={tab.id} title={tab.title} onClose={ws.closeTab}>
              <V tabId={tab.id} payload={tab.payload} />
            </ViewErrorBoundary>
          </div>
        );
      })}
    </div>
  );
}
