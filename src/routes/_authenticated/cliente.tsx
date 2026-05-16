import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ClientPortalLayout } from "@/components/layouts/client-portal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, FileWarning, Wrench, Droplets, Flame, Zap, Gauge, Loader2 } from "lucide-react";
import { useMyPadron } from "@/hooks/use-padron";
import { useMyInvoices } from "@/hooks/use-billing";

export const Route = createFileRoute("/_authenticated/cliente")({
  head: () => ({ meta: [{ title: "Mi cuenta — Coopecur 2.0" }] }),
  component: ClientPortal,
});

function ClientPortal() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useMyPadron();
  const { data: invoices = [], isLoading: invLoading } = useMyInvoices();

  useEffect(() => {
    if (auth.isAdminOrOperator && !auth.hasRole("client")) {
      navigate({ to: "/admin", replace: true });
    }
  }, [auth, navigate]);

  const supplies = data?.supplies ?? [];
  const pending = invoices.filter((i: any) => Number(i.balance) > 0 && i.status !== "void");
  const totalDue = pending.reduce((acc: number, i: any) => acc + Number(i.balance || 0), 0);
  const fmt = (n: number, c = "ARS") => new Intl.NumberFormat("es-AR", { style: "currency", currency: c }).format(n);

  return (
    <ClientPortalLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Oficina Virtual</p>
          <h1 className="text-2xl font-semibold tracking-tight">Hola, {data?.member?.full_name?.split(" ")[0] ?? auth.user?.email?.split("@")[0] ?? "socio/a"}</h1>
          <p className="text-sm text-muted-foreground">
            {data?.member ? `Socio N° ${data.member.member_number}` : "Bienvenido/a a su panel personal de Coopecur 2.0."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Saldo deudor</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{fmt(totalDue)}</div>
              <p className="mt-1 text-xs text-muted-foreground">{pending.length} factura(s) pendiente(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Facturas pendientes</CardTitle>
              <FileWarning className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{pending.length}</div>
              <p className="mt-1 text-xs text-muted-foreground">de {invoices.length} totales</p>
            </CardContent>
          </Card>
          <Kpi icon={<Wrench className="h-4 w-4" />} label="Reclamos activos" hint="Fase 4" />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Suministros</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{supplies.length}</div>
              <p className="mt-1 text-xs text-muted-foreground">activos / totales</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Mis suministros</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : !data?.member ? (
              <p className="text-sm text-muted-foreground">Tu cuenta aún no está vinculada a un socio. Contactá a la cooperativa para asociar tu padrón.</p>
            ) : supplies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tenés suministros registrados.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {supplies.map((s: any) => (
                  <div key={s.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="gap-1">
                        {s.service_type === "water" ? <Droplets className="h-3 w-3" /> : s.service_type === "gas" ? <Flame className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                        {s.service_type}
                      </Badge>
                      <Badge variant={s.status === "active" ? "default" : s.status === "suspended" ? "destructive" : "secondary"}>{s.status}</Badge>
                    </div>
                    <p className="mt-2 font-mono text-xs text-muted-foreground">N° {s.supply_number}</p>
                    {s.address && (
                      <p className="mt-1 text-sm">{s.address.street} {s.address.street_number ?? ""}, {s.address.city}</p>
                    )}
                    {s.meters?.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">Medidor: {s.meters[0].serial_number}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Mis facturas</CardTitle></CardHeader>
          <CardContent>
            {invLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay facturas emitidas.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{i.invoice_number}</p>
                      <p className="font-medium">{i.supply?.supply_number} · {i.supply?.service_type}</p>
                      <p className="text-xs text-muted-foreground">{i.period_start} → {i.period_end} · vence {i.due_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{fmt(Number(i.total), i.currency)}</p>
                      <p className="text-xs">Saldo: <span className={Number(i.balance) > 0 ? "text-destructive" : "text-primary"}>{fmt(Number(i.balance), i.currency)}</span></p>
                      <Badge variant={i.status === "paid" ? "default" : i.status === "overdue" ? "destructive" : "secondary"} className="mt-1">{i.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
