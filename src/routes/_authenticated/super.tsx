import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Activity, Building2, CreditCard, LayoutDashboard, LayoutGrid, ListTree, Loader2, LogOut, Receipt } from "lucide-react";
import { getActingTenantId } from "@/lib/acting-tenant";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useIsSuperAdmin } from "@/hooks/use-super-admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/super")({
  head: () => ({ meta: [{ title: "Plataforma — Sistema de Gestión de Servicios" }] }),
  component: SuperLayoutRoute,
});

function SuperLayoutRoute() {
  const auth = useAuth();
  const navigate = useNavigate();
  const sa = useIsSuperAdmin();
  const [hasActing, setHasActing] = React.useState(false);
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
    if (!sa.isLoading && sa.data && !sa.data.isSuperAdmin) {
      navigate({ to: "/", replace: true });
    }
  }, [sa.isLoading, sa.data, navigate]);

  if (sa.isLoading || !sa.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!sa.data.isSuperAdmin) return null;

  const NAV = [
    { label: "Dashboard", to: "/super", icon: LayoutDashboard },
    { label: "Tenants", to: "/super/tenants", icon: Building2 },
    { label: "Planes", to: "/super/planes", icon: LayoutGrid },
    { label: "Eventos", to: "/super/eventos", icon: ListTree },
    { label: "Health", to: "/super/health", icon: Activity },
    { label: "Facturación", to: "/super/facturacion", icon: CreditCard },
  ] as const;

  return (
    <div className="flex min-h-screen bg-secondary/40">
      <aside
        className="hidden w-64 shrink-0 flex-col text-sidebar-foreground md:flex"
        style={{ background: "var(--gradient-sidebar)", borderRight: "1px solid color-mix(in oklab, var(--brand-cyan) 18%, transparent)" }}
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md text-white shadow-[0_4px_14px_-4px_rgba(91,200,230,0.55)]"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Receipt className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/55">Atheria</p>
            <p className="font-display text-sm font-semibold tracking-wide text-white">Plataforma</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Super admin</p>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/75 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white [&_svg]:text-white/60 [&_svg]:hover:text-[var(--brand-cyan)]",
                )}
                activeProps={{
                  className:
                    "bg-white/[0.08] text-white before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[2px] before:-translate-y-1/2 before:rounded-full before:bg-[var(--brand-lime)] before:shadow-[0_0_8px_var(--brand-lime)] [&_svg]:!text-[var(--brand-cyan)]",
                }}
              >
                <Icon className="h-4 w-4 transition-colors" />
                {item.label}
              </Link>
            );
          })}
          {hasActing && (
            <Link
              to="/admin"
              className="mt-6 flex items-center gap-3 rounded-md border border-[color:var(--brand-cyan)]/30 px-3 py-2 text-sm font-medium text-[color:var(--brand-cyan)] transition-colors hover:bg-[color:var(--brand-cyan)]/10"
            >
              <CreditCard className="h-4 w-4" />
              Volver al backoffice
            </Link>
          )}
        </nav>
        <div className="border-t border-white/5 p-3">
          <p className="truncate px-2 pb-2 text-[11px] text-white/55">{auth.user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/80 hover:bg-white/[0.06] hover:text-white"
            onClick={() => auth.signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}