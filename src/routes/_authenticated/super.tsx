import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Activity, Building2, CreditCard, LayoutDashboard, LayoutGrid, ListTree, Loader2, LogOut, PanelLeftClose, PanelLeftOpen, Receipt, Settings, Users } from "lucide-react";
import { getActingTenantId } from "@/lib/acting-tenant";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useIsSuperAdmin } from "@/hooks/use-super-admin";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "atheria.sidebar.super.collapsed";

export const Route = createFileRoute("/_authenticated/super")({
  head: () => ({ meta: [{ title: "Plataforma — Sistema de Gestión de Servicios" }] }),
  component: SuperLayoutRoute,
});

function SuperLayoutRoute() {
  const auth = useAuth();
  const navigate = useNavigate();
  const sa = useIsSuperAdmin();
  const [hasActing, setHasActing] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
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
  React.useEffect(() => {
    const sync = () => setHasActing(!!getActingTenantId());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("acting-tenant-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("acting-tenant-changed", sync);
    };
  }, []);

  React.useEffect(() => {
    if (auth.isLoading || !auth.rolesLoaded) return;
    if (!auth.isAuthenticated) return; // _authenticated layout handles it
    if (sa.isLoading || sa.isFetching) return;
    // Only redirect when we have a confirmed negative answer.
    if (sa.data && sa.data.isSuperAdmin === false) {
      navigate({ to: "/", replace: true });
    }
  }, [auth.isLoading, auth.rolesLoaded, auth.isAuthenticated, sa.isLoading, sa.isFetching, sa.data, navigate]);

  if (auth.isLoading || !auth.rolesLoaded || sa.isLoading || (!sa.data && !sa.isError)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!sa.data?.isSuperAdmin) return null;

  const NAV = [
    { label: "Dashboard", to: "/super", icon: LayoutDashboard },
    { label: "Tenants", to: "/super/tenants", icon: Building2 },
    { label: "Usuarios", to: "/super/usuarios", icon: Users },
    { label: "Planes", to: "/super/planes", icon: LayoutGrid },
    { label: "Eventos", to: "/super/eventos", icon: ListTree },
    { label: "Health", to: "/super/health", icon: Activity },
    { label: "Facturación", to: "/super/facturacion", icon: CreditCard },
    { label: "Configuración", to: "/super/configuracion", icon: Settings },
  ] as const;

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
            <Receipt className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight flex-1 min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/55">Atheria</p>
              <p className="font-display text-sm font-semibold tracking-wide text-white">Plataforma</p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {!collapsed && (
            <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Super admin</p>
          )}
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md py-2 text-sm font-medium text-white/75 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white [&_svg]:text-white/60 [&_svg]:hover:text-[var(--brand-cyan)]",
                  collapsed ? "justify-center px-2" : "px-3",
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
          {hasActing && !collapsed && (
            <Link
              to="/admin"
              className="mt-6 flex items-center gap-3 rounded-md border border-[color:var(--brand-cyan)]/30 px-3 py-2 text-sm font-medium text-[color:var(--brand-cyan)] transition-colors hover:bg-[color:var(--brand-cyan)]/10"
            >
              <CreditCard className="h-4 w-4" />
              Volver al backoffice
            </Link>
          )}
          {hasActing && collapsed && (
            <Link
              to="/admin"
              title="Volver al backoffice"
              className="mt-6 flex items-center justify-center rounded-md border border-[color:var(--brand-cyan)]/30 px-2 py-2 text-[color:var(--brand-cyan)] transition-colors hover:bg-[color:var(--brand-cyan)]/10"
            >
              <CreditCard className="h-4 w-4" />
            </Link>
          )}
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
            <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} /> {!collapsed && "Cerrar sesión"}
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}