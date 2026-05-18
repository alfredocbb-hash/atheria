import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Building2,
  CreditCard,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSuperDashboard } from "@/hooks/use-super-admin";

export const Route = createFileRoute("/_authenticated/super/")({
  head: () => ({ meta: [{ title: "Dashboard plataforma" }] }),
  component: SuperDashboardPage,
});

const fmtMoney = (cents: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100);

const STATUS_LABEL: Record<string, string> = {
  trial: "Trial",
  active: "Activos",
  past_due: "Pago pendiente",
  suspended: "Suspendidos",
  cancelled: "Cancelados",
};

function SuperDashboardPage() {
  const { data, isLoading } = useSuperDashboard();

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { kpis, atRisk, recentEvents, recentAudit } = data;

  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Plataforma
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Resumen general</h1>
        <p className="text-sm text-muted-foreground">
          Estado del negocio y de los tenants en la plataforma.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Building2}
          label="Tenants totales"
          value={kpis.totalTenants.toString()}
          hint={`${kpis.byStatus.active ?? 0} activos · ${kpis.byStatus.trial ?? 0} en trial`}
        />
        <Kpi
          icon={TrendingUp}
          label="MRR estimado"
          value={fmtMoney(kpis.mrrCents)}
          hint="Suma de planes activos"
        />
        <Kpi
          icon={AlertTriangle}
          label="Trials por vencer (7d)"
          value={kpis.trialsEndingSoon.toString()}
          hint="Riesgo de churn temprano"
        />
        <Kpi
          icon={Activity}
          label="Eventos billing (7d)"
          value={kpis.eventsLast7d.toString()}
          hint="Webhooks recibidos"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.keys(STATUS_LABEL).map((s) => (
              <div key={s} className="flex items-center justify-between">
                <span className="text-muted-foreground">{STATUS_LABEL[s]}</span>
                <Badge variant={s === "active" ? "default" : "secondary"}>
                  {kpis.byStatus[s] ?? 0}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Tenants en riesgo</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {atRisk.length === 0 ? (
              <p className="text-muted-foreground">Sin tenants en riesgo.</p>
            ) : (
              atRisk.slice(0, 8).map((t: any) => (
                <Link
                  key={`${t.id}-${t.reason}`}
                  to="/super/tenants"
                  className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-secondary"
                >
                  <span className="truncate font-medium">{t.name}</span>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {t.reason === "trial_ending"
                      ? t.trial_ends_at
                        ? `Vence ${new Date(t.trial_ends_at).toLocaleDateString("es-AR")}`
                        : "Trial"
                      : t.status === "past_due"
                        ? "Pago pendiente"
                        : "Suspendido"}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" /> Eventos billing recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin eventos.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentEvents.map((e: any) => (
                  <li key={e.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="font-medium">{e.type}</span>
                      <span className="ml-2 text-muted-foreground">
                        {e.tenant_name ?? "—"}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleString("es-AR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Actividad reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin actividad.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentAudit.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="font-medium">{a.action}</span>
                      <span className="ml-2 text-muted-foreground">
                        {a.actor_email ?? "sistema"}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("es-AR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
