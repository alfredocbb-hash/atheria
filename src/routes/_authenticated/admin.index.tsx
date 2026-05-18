import { createFileRoute } from "@tanstack/react-router";
import { useEnsureTab } from "@/components/workspace/workspace-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BadgeDollarSign, FileWarning, Loader2, Users } from "lucide-react";
import { useAdminDashboard } from "@/hooks/use-dashboard";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Coopecur 2.0" }] }),
  component: AdminDashboardTrigger,
});

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);

const STATUS_LABEL: Record<string, string> = {
  open: "Abierto", assigned: "Asignado", in_progress: "En proceso", resolved: "Resuelto", cancelled: "Cancelado",
};

export function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Panel de Operaciones</p>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard general</h1>
        <p className="text-sm text-muted-foreground">Vista consolidada de la operación de la cooperativa.</p>
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Reclamos abiertos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-semibold">{data.claims_open}</div>
                  {data.claims_urgent > 0 && (
                    <Badge variant="destructive" className="text-[10px]">{data.claims_urgent} urgentes</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Sin resolver</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Facturado del mes</CardTitle>
                <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{fmtMoney(data.month_billed)}</div>
                <p className="mt-1 text-xs text-muted-foreground">Emitido en el mes en curso</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Facturas vencidas</CardTitle>
                <FileWarning className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{data.invoices_overdue_count}</div>
                <p className="mt-1 text-xs text-muted-foreground">{fmtMoney(data.invoices_overdue_amount)} adeudado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Socios activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{data.members_active}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data.supplies_active} suministros · {data.supplies_suspended} suspendidos
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Últimas facturas</CardTitle></CardHeader>
              <CardContent>
                {data.recent_invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aún no hay facturas emitidas.</p>
                ) : (
                  <div className="space-y-2">
                    {data.recent_invoices.map((i: any) => (
                      <div key={i.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{i.invoice_number}</p>
                          <p className="font-medium">{i.member?.full_name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">vence {i.due_date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{fmtMoney(Number(i.total))}</p>
                          <Badge variant={i.status === "paid" ? "default" : i.status === "overdue" ? "destructive" : "secondary"} className="mt-1">
                            {i.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Últimos reclamos</CardTitle></CardHeader>
              <CardContent>
                {data.recent_claims.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aún no hay reclamos.</p>
                ) : (
                  <div className="space-y-2">
                    {data.recent_claims.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{c.claim_number}</p>
                          <p className="font-medium">{c.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.member?.full_name ?? "—"} · {new Date(c.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={c.status === "resolved" ? "default" : c.status === "open" ? "destructive" : "outline"}>
                            {STATUS_LABEL[c.status] ?? c.status}
                          </Badge>
                          {c.priority === "urgent" && (
                            <Badge variant="destructive" className="text-[10px]">urgente</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function AdminDashboardTrigger() {
  useEnsureTab("dashboard");
  return null;
}
