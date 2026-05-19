import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, CreditCard, FileText, Gauge, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Receipt, Server, ShieldCheck, Users, Wallet, Wrench, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/notifications-bell";
import { WorkspaceProvider } from "@/components/workspace/workspace-context";
import { WorkspaceTabsBar } from "@/components/workspace/workspace-tabs-bar";
import { WorkspacePanels } from "@/components/workspace/workspace-panels";
import { SubscriptionGate, SubscriptionGuard } from "@/components/billing/subscription-gate";
import { useIsSuperAdmin } from "@/hooks/use-super-admin";
import { clearActingTenant, getActingTenantId, getActingTenantName } from "@/lib/acting-tenant";

const SIDEBAR_KEY = "atheria.sidebar.collapsed";

export function AdminPortalLayout({ children }: { children?: React.ReactNode }) {
  const auth = useAuth();
  const sa = useIsSuperAdmin();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_KEY) === "1";
  });
  const toggleSidebar = () => {
    setCollapsed((c) => {
      const next = !c;
      try { window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  };
  const [acting, setActing] = useState<{ id: string | null; name: string | null }>(() => ({
    id: typeof window !== "undefined" ? getActingTenantId() : null,
    name: typeof window !== "undefined" ? getActingTenantName() : null,
  }));
  useEffect(() => {
    const sync = () => setActing({ id: getActingTenantId(), name: getActingTenantName() });
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("acting-tenant-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("acting-tenant-changed", sync);
    };
  }, []);
  const stopActing = () => {
    clearActingTenant();
    window.dispatchEvent(new Event("acting-tenant-changed"));
    qc.invalidateQueries();
    navigate({ to: "/super" });
  };
  const NAV: Array<{ label: string; icon: any; to?: string; enabled: boolean; adminOnly?: boolean }> = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/admin", enabled: true },
    { label: "Usuarios y Roles", icon: ShieldCheck, to: "/admin/usuarios", enabled: true, adminOnly: true },
    { label: "Clientes", icon: Users, to: "/admin/socios", enabled: true },
    { label: "Servicios", icon: Gauge, to: "/admin/suministros", enabled: true },
    { label: "Facturación", icon: Receipt, to: "/admin/facturacion", enabled: true },
    { label: "Tarifas", icon: Wallet, to: "/admin/tarifas", enabled: true },
    { label: "Reclamos", icon: Wrench, to: "/admin/reclamos", enabled: true },
    { label: "Auditoría", icon: FileText, to: "/admin/auditoria", enabled: true, adminOnly: true },
    { label: "Suscripción", icon: CreditCard, to: "/admin/facturacion-suscripcion", enabled: true, adminOnly: true },
  ];
  return (
    <div className="flex min-h-screen bg-secondary/40">
      <aside
        className={cn(
          "hidden shrink-0 flex-col text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-64",
        )}
        style={{ background: "var(--gradient-sidebar)", borderRight: "1px solid color-mix(in oklab, var(--brand-cyan) 18%, transparent)" }}
      >
        <div className={cn("flex items-center gap-3 border-b border-white/5 py-5", collapsed ? "justify-center px-2" : "px-5")}>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white shadow-[0_4px_14px_-4px_rgba(91,200,230,0.55)]"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Building2 className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight flex-1 min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/55">Atheria</p>
              <p className="font-display text-sm font-semibold tracking-wide text-white">Backoffice</p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
              title="Colapsar menú"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {!collapsed && (
            <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Operación</p>
          )}
          {NAV.map((item) => {
            const Icon = item.icon;
            const base =
              cn(
                "group relative flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors duration-200",
                collapsed ? "justify-center px-2" : "px-3",
              );
            if (item.adminOnly && !auth.hasRole("admin")) return null;
            if (!item.enabled) {
              return (
                <span
                  key={item.label}
                  className={cn(base, "cursor-not-allowed text-white/30")}
                  title={collapsed ? item.label : "Disponible en próximas fases"}
                >
                  <Icon className="h-4 w-4" />
                  {!collapsed && item.label}
                </span>
              );
            }
            return (
              <Link
                key={item.label}
                to={item.to!}
                title={collapsed ? item.label : undefined}
                className={cn(
                  base,
                  "text-white/75 hover:bg-white/[0.06] hover:text-white [&_svg]:text-white/60 [&_svg]:hover:text-[var(--brand-cyan)]",
                )}
                activeProps={{
                  className:
                    "bg-white/[0.08] text-white before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[2px] before:-translate-y-1/2 before:rounded-full before:bg-[var(--brand-lime)] before:shadow-[0_0_8px_var(--brand-lime)] [&_svg]:!text-[var(--brand-cyan)]",
                }}
              >
                <Icon className="h-4 w-4 transition-colors" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/5 p-3">
          {!collapsed && (
            <p className="truncate px-2 pb-2 text-[11px] text-white/55">{auth.user?.email}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-white/80 hover:bg-white/[0.06] hover:text-white",
              collapsed ? "justify-center px-0" : "justify-start",
            )}
            onClick={() => auth.signOut()}
            title={collapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && "Cerrar sesión"}
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-card/75 px-6 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
              title={collapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <Link to="/admin" className="flex items-center gap-2 md:hidden">
              <Building2 className="h-5 w-5 text-accent" />
              <span className="font-display text-sm font-semibold tracking-wide">Atheria</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {sa.data?.isSuperAdmin && acting.id && (
              <div className="mr-1 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--brand-cyan)]/40 bg-[color:var(--brand-cyan)]/10 px-2.5 py-1 text-xs font-medium text-[color:var(--brand-cyan)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand-lime)] shadow-[0_0_6px_var(--brand-lime)]" />
                <span className="text-foreground/80">Actuando como</span>
                <span className="font-semibold text-foreground">{acting.name ?? acting.id.slice(0, 8)}</span>
                <button
                  type="button"
                  onClick={stopActing}
                  className="ml-1 rounded-full p-0.5 text-foreground/60 transition-colors hover:bg-[color:var(--brand-cyan)]/20 hover:text-foreground"
                  title="Salir de la cooperativa"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {sa.data?.isSuperAdmin && (
              <Link
                to="/super/tenants"
                className="mr-1 inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-1 text-xs font-medium text-foreground/80 transition-colors hover:border-[color:var(--brand-cyan)]/60 hover:text-[color:var(--brand-cyan)]"
              >
                <Server className="h-3.5 w-3.5" /> Plataforma
              </Link>
            )}
            <NotificationsBell />
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => auth.signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <SubscriptionGate />
        <SubscriptionGuard>
        <WorkspaceProvider>
          {/* Route-side triggers (return null) — must live inside the
              provider so they can call useEnsureTab() to open/focus tabs
              when the URL changes. */}
          {children}
          <main className="flex flex-1 flex-col overflow-hidden">
            <WorkspaceTabsBar />
            <WorkspacePanels />
          </main>
        </WorkspaceProvider>
        </SubscriptionGuard>
      </div>
    </div>
  );
}
