import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMyContext } from "@/hooks/use-onboarding";
import { AdminPortalLayout } from "@/components/layouts/admin-portal-layout";
import { getActingTenantId } from "@/lib/acting-tenant";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Operaciones — Coopecur 2.0" }] }),
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  const auth = useAuth();
  const navigate = useNavigate();
  const ctx = useMyContext();
  // Re-render when the localStorage acting tenant changes (set by /super)
  const [actingTenantId, setActingTenantId] = useState<string | null>(() =>
    typeof window !== "undefined" ? getActingTenantId() : null,
  );
  useEffect(() => {
    const sync = () => setActingTenantId(getActingTenantId());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("acting-tenant-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("acting-tenant-changed", sync);
    };
  }, []);

  useEffect(() => {
    if (auth.isLoading || !auth.rolesLoaded) return;
    if (!auth.isAdminOrOperator) {
      navigate({ to: "/cliente", replace: true });
      return;
    }
    if (
      ctx.data &&
      !ctx.data.isSuperAdmin &&
      !ctx.data.hasTenant
    ) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [auth.isLoading, auth.rolesLoaded, auth.isAdminOrOperator, ctx.data, navigate]);

  const needsOnboarding =
    ctx.data && !ctx.data.isSuperAdmin && !ctx.data.hasTenant;

  const superNoTenant =
    ctx.data && ctx.data.isSuperAdmin && !ctx.data.hasTenant && !actingTenantId;

  if (auth.isLoading || !auth.rolesLoaded || !auth.isAdminOrOperator || ctx.isLoading || needsOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (superNoTenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-6">
        <div className="max-w-md space-y-4 rounded-lg border bg-card p-6 text-center shadow-sm">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Elegí una cooperativa</h2>
          <p className="text-sm text-muted-foreground">
            Como super admin no tenés una cooperativa propia. Elegí una desde la
            plataforma para acceder a su backoffice.
          </p>
          <Button asChild>
            <Link to="/super/tenants">Ir a Tenants</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminPortalLayout>
      <Outlet />
    </AdminPortalLayout>
  );
}
