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
    <div className="flex h-10 items-center gap-1 overflow-x-auto border-b border-border/60 bg-card/70 px-3 backdrop-blur-sm">
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
                  "group relative flex h-9 cursor-pointer items-center gap-2 px-3 text-xs font-medium transition-colors",
                  isActive
                    ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-[2px] after:rounded-t-full after:bg-[var(--brand-cyan)] after:shadow-[0_0_8px_var(--brand-cyan)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0 transition-colors", isActive && "text-[var(--brand-cyan)]")} />
                <span className="whitespace-nowrap">{title}</span>
                {!pinned && (
                  <button
                    type="button"
                    aria-label={`Cerrar ${title}`}
                    onClick={(e) => { e.stopPropagation(); ws.closeTab(tab.id); }}
                    className={cn(
                      "ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground",
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
