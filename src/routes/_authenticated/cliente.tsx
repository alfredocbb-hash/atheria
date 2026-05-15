import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ClientPortalLayout } from "@/components/layouts/client-portal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, FileWarning, Wrench, BellRing } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cliente")({
  head: () => ({ meta: [{ title: "Mi cuenta — Coopecur 2.0" }] }),
  component: ClientPortal,
});

function ClientPortal() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAdminOrOperator && !auth.hasRole("client")) {
      navigate({ to: "/admin", replace: true });
    }
  }, [auth, navigate]);

  return (
    <ClientPortalLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Oficina Virtual</p>
          <h1 className="text-2xl font-semibold tracking-tight">Hola, {auth.user?.email?.split("@")[0] ?? "socio/a"}</h1>
          <p className="text-sm text-muted-foreground">Bienvenido/a a su panel personal de Coopecur 2.0.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<Wallet className="h-4 w-4" />} label="Saldo deudor" hint="Fase 3" />
          <Kpi icon={<FileWarning className="h-4 w-4" />} label="Facturas pendientes" hint="Fase 3" />
          <Kpi icon={<Wrench className="h-4 w-4" />} label="Reclamos activos" hint="Fase 4" />
          <Kpi icon={<BellRing className="h-4 w-4" />} label="Suministros" hint="Fase 2" />
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Estado de Coopecur 2.0</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            La plataforma se está implementando por fases. Los módulos de suministros, facturación y reclamos se habilitarán en las próximas actualizaciones.
          </CardContent>
        </Card>
      </div>
    </ClientPortalLayout>
  );
}

function Kpi({ icon, label, hint }: { icon: React.ReactNode; label: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">—</div>
        <p className="mt-1 text-xs text-muted-foreground">Próximamente ({hint})</p>
      </CardContent>
    </Card>
  );
}
