import { X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { MODULE_REGISTRY } from "./module-registry";
import { ICONS } from "./dynamic-views";
import { useWorkspace } from "./workspace-context";

export function WorkspaceTabsBar() {
  const ws = useWorkspace();
  const auth = useAuth();
  return (
    <div className="flex h-10 items-center gap-px overflow-x-auto border-b bg-card px-2">
      {ws.openTabs.map((tab) => {
        const isActive = ws.activeId === tab.id;
        let title = "";
        let Icon = FileText;
        let pinned = false;
        if (tab.kind === "module") {
          const mod = MODULE_REGISTRY[tab.moduleKey];
          if (!mod) return null;
          if (mod.adminOnly && !auth.hasRole("admin")) return null;
          title = mod.title;
          Icon = mod.icon;
          pinned = !!mod.pinned;
        } else {
          title = tab.title;
          Icon = (tab.iconKey && ICONS[tab.iconKey]) || FileText;
        }
        return (
          <ContextMenu key={tab.id}>
            <ContextMenuTrigger asChild>
              <div
                role="tab"
                aria-selected={isActive}
                onClick={() => ws.setActive(tab.id)}
                onAuxClick={(e) => { if (e.button === 1 && !pinned) ws.closeTab(tab.id); }}
                className={cn(
                  "group flex h-8 cursor-pointer items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{title}</span>
                {!pinned && (
                  <button
                    type="button"
                    aria-label={`Cerrar ${title}`}
                    onClick={(e) => { e.stopPropagation(); ws.closeTab(tab.id); }}
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
              <ContextMenuItem disabled={pinned} onClick={() => ws.closeTab(tab.id)}>Cerrar</ContextMenuItem>
              <ContextMenuItem onClick={() => ws.closeOthers(tab.id)}>Cerrar las demás</ContextMenuItem>
              <ContextMenuItem onClick={() => ws.closeToRight(tab.id)}>Cerrar a la derecha</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => ws.closeAll()}>Cerrar todas</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
}
