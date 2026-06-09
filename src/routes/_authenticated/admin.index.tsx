import { createFileRoute } from "@tanstack/react-router";
import { useEnsureTab } from "@/components/workspace/workspace-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  BadgeDollarSign,
  FileWarning,
  Loader2,
  Users,
  Zap,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { useAdminDashboard } from "@/hooks/use-dashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")(({
  head: () => ({ meta: [{ title: "Dashboard — Atheria" }] }),
  component: AdminDashboardTrigger,
}));

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);

const fmtMoneyShort = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return fmtMoney(n);
};

const STATUS_LABEL: Record<string, string> = {
  open: "Abierto",
  assigned: "Asignado",
  in_progress: "En proceso",
  resolved: "Resuelto",
  cancelled: "Cancelado",
  paid: "Pagado",
  pending: "Pendiente",
  overdue: "Vencido",
  void: "Anulado",
};

const INVOICE_BADGE: Record<string, string> = {
  paid: "bg-[var(--status-paid)]/15 text-[var(--status-paid-foreground)] border-[var(--status-paid)]/30",
  pending: "bg-[var(--status-pending)]/15 text-[var(--status-pending-foreground)] border-[var(--status-pending)]/30",
  overdue: "bg-[var(--status-expired)]/15 text-[var(--status-expired-foreground)] border-[var(--status-expired)]/30",
};

const CLAIM_BADGE: Record<string, string> = {
  open: "bg-[var(--status-expired)]/15 text-[var(--status-expired-foreground)] border-[var(--status-expired)]/30",
  assigned: "bg-[var(--status-pending)]/15 text-[var(--status-pending-foreground)] border-[var(--status-pending)]/30",
  in_progress: "bg-[var(--priority-low)]/15 text-[var(--brand-blue)] border-[var(--priority-low)]/30",
  resolved: "bg-[var(--status-paid)]/15 text-[var(--status-paid-foreground)] border-[var(--status-paid)]/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-[var(--priority-critical)]/15 text-[var(--priority-critical)] border-[var(--priority-critical)]/30",
  high: "bg-[var(--priority-high)]/15 text-[var(--priority-high)] border-[var(--priority-high)]/30",
  medium: "bg-[var(--priority-medium)]/15 text-[var(--priority-medium)] border-[var(--priority-medium)]/30",
  low: "bg-[var(--priority-low)]/15 text-[var(--brand-blue)] border-[var(--priority-low)]/30",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgente", high: "Alta", medium: "Media", low: "Baja",
};

function StatusBadge({ status, map }: { status: string; map: Record<string, string> }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  alert,
}: {
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ElementType;
  accent: string;
  alert?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      {/* accent stripe */}
      <div className={`absolute left-0 top-0 h-full w-1 ${accent}`} />
      <CardContent className="pl-6 pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{title}</p>
            <p className="mt-1.5 text-3xl font-bold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${alert ? "bg-[var(--status-expired)]/10" : "bg-[var(--surface)]"}`}
          >
            <Icon className={`h-5 w-5 ${alert ? "text-[var(--status-expired-foreground)]" : "text-[var(--brand-blue)]"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();

  // Build bar chart data from supplies health
  const suppliesChartData = data
    ? [
        { name: "Activos", value: data.supplies_active, color: "var(--brand-lime)" },
        { name: "Suspendidos", value: data.supplies_suspended, color: "var(--status-expired)" },
      ]
    : [];

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Panel de operaciones
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Dashboard general
        </h1>
        <p className="text-sm text-muted-foreground">
          Vista consolidada de la operación de la cooperativa.
        </p>
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Socios activos"
              value={data.members_active}
              sub={`${data.supplies_active} suministros activos`}
              icon={Users}
              accent="bg-[var(--brand-cyan)]"
            />
            <KpiCard
              title="Facturado del mes"
              value={fmtMoneyShort(data.month_billed)}
              sub={fmtMoney(data.month_billed)}
              icon={TrendingUp}
              accent="bg-[var(--brand-lime)]"
            />
            <KpiCard
              title="Facturas vencidas"
              value={data.invoices_overdue_count}
              sub={`${fmtMoney(data.invoices_overdue_amount)} adeudado`}
              icon={FileWarning}
              accent="bg-[var(--status-expired)]"
              alert={data.invoices_overdue_count > 0}
            />
            <KpiCard
              title="Reclamos abiertos"
              value={data.claims_open}
              sub={
                data.claims_urgent > 0 ? (
                  <span className="font-semibold text-[var(--status-expired-foreground)]">
                    {data.claims_urgent} urgentes
                  </span>
                ) : (
                  "Sin urgentes"
                )
              }
              icon={AlertTriangle}
              accent="bg-[var(--status-pending)]"
              alert={data.claims_urgent > 0}
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Supplies health bar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Zap className="h-4 w-4 text-[var(--brand-cyan)]" />
                  Estado de suministros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={suppliesChartData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                        cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {suppliesChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Health ratio */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Cobertura activa</span>
                    <span className="font-semibold text-foreground">
                      {data.supplies_active + data.supplies_suspended > 0
                        ? Math.round((data.supplies_active / (data.supplies_active + data.supplies_suspended)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${data.supplies_active + data.supplies_suspended > 0
                          ? (data.supplies_active / (data.supplies_active + data.supplies_suspended)) * 100
                          : 0}%`,
                        background: "var(--brand-lime)",
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing summary */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <BadgeDollarSign className="h-4 w-4 text-[var(--brand-lime)]" />
                  Resumen de cobranza
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Facturado", value: data.month_billed, color: "var(--brand-cyan)" },
                        { name: "Adeudado", value: data.invoices_overdue_amount, color: "var(--status-expired)" },
                      ]}
                      barSize={48}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        width={50}
                        tickFormatter={(v) => fmtMoneyShort(v)}
                      />
                      <Tooltip
                        formatter={(v: number) => [fmtMoney(v)]}
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                        cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        <Cell fill="var(--brand-cyan)" />
                        <Cell fill="var(--status-expired)" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-cyan)]" />
                    Facturado del mes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-expired)]" />
                    Deuda vencida
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tables row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Recent invoices */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-[var(--brand-lime)]" />
                  Últimas facturas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {data.recent_invoices.length === 0 ? (
                  <p className="px-6 pb-5 text-sm text-muted-foreground">Aún no hay facturas emitidas.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {data.recent_invoices.map((i: any) => (
                      <div key={i.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{i.member?.full_name ?? "—"}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{i.invoice_number} · vence {i.due_date}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <p className="text-sm font-semibold tabular-nums">{fmtMoney(Number(i.total))}</p>
                          <StatusBadge status={i.status} map={INVOICE_BADGE} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent claims */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="h-4 w-4 text-[var(--status-pending)]" />
                  Últimos reclamos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {data.recent_claims.length === 0 ? (
                  <p className="px-6 pb-5 text-sm text-muted-foreground">Aún no hay reclamos.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {data.recent_claims.map((c: any) => (
                      <div key={c.id} className="flex items-start justify-between px-6 py-3 hover:bg-muted/40 transition-colors">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{c.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {c.member?.full_name ?? "—"} · {new Date(c.created_at).toLocaleDateString("es-AR")}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                          <StatusBadge status={c.status} map={CLAIM_BADGE} />
                          {c.priority && c.priority !== "low" && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE[c.priority] ?? ""}`}>
                              {PRIORITY_LABEL[c.priority] ?? c.priority}
                            </span>
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
