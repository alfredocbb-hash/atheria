import { createFileRoute } from "@tanstack/react-router";
import { useEnsureTab } from "@/components/workspace/workspace-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, BadgeDollarSign, Power, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Coopecur 2.0" }] }),
  component: AdminDashboardTrigger,
});

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Panel de Operaciones</p>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard general</h1>
        <p className="text-sm text-muted-foreground">Vista consolidada de la operación de la cooperativa.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<AlertTriangle className="h-4 w-4" />} label="Reclamos críticos" hint="Fase 4" />
        <Kpi icon={<BadgeDollarSign className="h-4 w-4" />} label="Facturado del mes" hint="Fase 3" />
        <Kpi icon={<Power className="h-4 w-4" />} label="Suministros suspendidos" hint="Fase 2" />
        <Kpi icon={<Users className="h-4 w-4" />} label="Titulares activos" hint="Fase 2" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Bienvenido al sistema</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Los módulos de Padrones, Facturación y Despacho de Cuadrillas se habilitarán en las siguientes fases del plan.
        </CardContent>
      </Card>
    </div>
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


function AdminDashboardTrigger() {
  useEnsureTab("dashboard");
  return null;
}
