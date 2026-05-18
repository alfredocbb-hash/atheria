import { createFileRoute } from "@tanstack/react-router";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePlatformHealth } from "@/hooks/use-super-admin";

export const Route = createFileRoute("/_authenticated/super/health")({
  component: HealthPage,
});

function HealthPage() {
  const q = usePlatformHealth();
  if (q.isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const h = q.data!;
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Salud de la plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Métricas básicas y estado de las integraciones.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Tenants totales</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{h.totalTenants}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Trials por vencer (7d)</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{h.trialsEndingSoon}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Mercado Pago</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ConfigRow label="Access token" ok={h.mercadopagoConfigured} />
            <ConfigRow label="Webhook secret" ok={h.mercadopagoWebhookConfigured} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Tenants por estado</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(h.byStatus).map(([k, v]) => (
            <Badge key={k} variant="outline" className="text-sm">
              {k}: {String(v)}
            </Badge>
          ))}
          {Object.keys(h.byStatus).length === 0 && (
            <span className="text-sm text-muted-foreground">Sin datos.</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Último evento de facturación</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {h.lastEvent ? (
            <div className="space-y-1">
              <div>Tipo: <span className="font-mono">{h.lastEvent.type}</span></div>
              <div>Provider: {h.lastEvent.provider}</div>
              <div className="text-muted-foreground">
                {new Date(h.lastEvent.created_at).toLocaleString("es-AR")}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Sin eventos todavía.</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      {ok ? (
        <span className="flex items-center gap-1 text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> Configurado
        </span>
      ) : (
        <span className="flex items-center gap-1 text-muted-foreground">
          <XCircle className="h-4 w-4" /> Pendiente
        </span>
      )}
    </div>
  );
}