import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Activity, Building2, CreditCard, LayoutDashboard, LayoutGrid, ListTree, Loader2, LogOut, Receipt } from "lucide-react";
import { useState } from "react";
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
  const [hasActing, setHasActing] = useState(false);
  useEffect(() => {
    const sync = () => setHasActing(!!getActingTenantId());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("acting-tenant-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("acting-tenant-changed", sync);
    };
  }, []);

  useEffect(() => {
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
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Plataforma</p>
            <p className="text-[11px] text-sidebar-foreground/70">Super admin</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {hasActing && (
            <Link
              to="/admin"
              className="mt-6 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/60"
            >
              <CreditCard className="h-4 w-4" />
              Volver al backoffice
            </Link>
          )}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <p className="px-2 pb-2 text-[11px] text-sidebar-foreground/60">{auth.user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
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