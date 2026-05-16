import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AdminPortalLayout } from "@/components/layouts/admin-portal-layout";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Operaciones — Coopecur 2.0" }] }),
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAdminOrOperator) {
      navigate({ to: "/cliente", replace: true });
    }
  }, [auth.isLoading, auth.isAdminOrOperator, navigate]);

  if (auth.isLoading || !auth.isAdminOrOperator) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminPortalLayout>
      <Outlet />
    </AdminPortalLayout>
  );
}
