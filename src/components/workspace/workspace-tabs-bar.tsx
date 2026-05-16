import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { MODULE_REGISTRY, type ModuleKey } from "./module-registry";
import { useWorkspace } from "./workspace-context";

export function WorkspaceTabsBar() {
  const ws = useWorkspace();
  const auth = useAuth();

  return (
    <div className="flex h-10 items-center gap-px overflow-x-auto border-b bg-card px-2">
      {ws.openTabs.map((key) => {
        const mod = MODULE_REGISTRY[key];
        if (!mod) return null;
        if (mod.adminOnly && !auth.hasRole("admin")) return null;
        const Icon = mod.icon;
        const isActive = ws.activeTab === key;
        return (
          <ContextMenu key={key}>
            <ContextMenuTrigger asChild>
              <div
                role="tab"
                aria-selected={isActive}
                onClick={() => ws.setActive(key)}
                onAuxClick={(e) => {
                  if (e.button === 1 && !mod.pinned) ws.closeTab(key);
                }}
                className={cn(
                  "group flex h-8 cursor-pointer items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{mod.title}</span>
                {!mod.pinned && (
                  <button
                    type="button"
                    aria-label={`Cerrar ${mod.title}`}
                    onClick={(e) => { e.stopPropagation(); ws.closeTab(key); }}
                    className={cn(
                      "ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-muted-foreground/20",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem disabled={mod.pinned} onClick={() => ws.closeTab(key)}>
                Cerrar
              </ContextMenuItem>
              <ContextMenuItem onClick={() => ws.closeOthers(key)}>
                Cerrar las demás
              </ContextMenuItem>
              <ContextMenuItem onClick={() => ws.closeToRight(key)}>
                Cerrar a la derecha
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => ws.closeAll()}>
                Cerrar todas
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
}