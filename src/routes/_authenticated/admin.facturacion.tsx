import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEnsureTab, useWorkspace } from "@/components/workspace/workspace-context";
import { useEffect, useState } from "react";
import { Loader2, Plus, FileText, Gauge } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInvoices, useReadings, useVoidInvoice, useDeleteReading } from "@/hooks/use-billing";
import { DeleteButton } from "@/components/admin/delete-button";

export const Route = createFileRoute("/_authenticated/admin/facturacion")({
  head: () => ({ meta: [{ title: "Facturación — Coopecur 2.0" }] }),
  component: FacturacionPageTrigger,
});

const fmtMoney = (n: number, c = "ARS") => new Intl.NumberFormat("es-AR", { style: "currency", currency: c }).format(Number(n || 0));

export function FacturacionPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!auth.isLoading && !auth.isAdminOrOperator) navigate({ to: "/cliente", replace: true }); }, [auth, navigate]);
  return (
    <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices"><FileText className="mr-2 h-4 w-4" />Facturas</TabsTrigger>
          <TabsTrigger value="readings"><Gauge className="mr-2 h-4 w-4" />Lecturas</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices"><InvoicesTab /></TabsContent>
        <TabsContent value="readings"><ReadingsTab /></TabsContent>
    </Tabs>
  );
}

function ReadingsTab() {
  const { data: readings = [], isLoading } = useReadings();
  const ws = useWorkspace();
  const del = useDeleteReading();
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <Button variant="tech" size="sm" className="ml-auto" onClick={() => ws.openView({ id: "view:lectura.new", viewKey: "lectura.new", title: "Nueva lectura", iconKey: "gauge", parentModule: "facturacion" })}>
          <Plus className="mr-1 h-4 w-4" />Cargar lectura
        </Button>
      </div>
      <CardContent className="pt-4">
        {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Fecha</TableHead><TableHead>Servicio</TableHead><TableHead>Medidor</TableHead>
              <TableHead className="text-right">Lectura</TableHead><TableHead className="text-right">Consumo</TableHead><TableHead>Origen</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {readings.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">Sin lecturas.</TableCell></TableRow>}
              {readings.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.reading_date}</TableCell>
                  <TableCell className="text-sm">{r.meter?.supply?.supply_number} — {r.meter?.supply?.member?.full_name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.meter?.serial_number}</TableCell>
                  <TableCell className="text-right">{r.reading_value}</TableCell>
                  <TableCell className="text-right">{r.consumption ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DeleteButton
                      iconOnly
                      title="¿Eliminar esta lectura?"
                      description="Se recalculará el consumo. No se podrá eliminar si la lectura fue usada en una factura."
                      onConfirm={() => del.mutate(r.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function InvoicesTab() {
  const [status, setStatus] = useState<string>("");
  const { data: invoices = [], isLoading } = useInvoices({ status: status || undefined });
  const ws = useWorkspace();
  const voidInv = useVoidInvoice();
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <Select value={status} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="issued">Emitidas</SelectItem>
              <SelectItem value="paid">Pagadas</SelectItem>
              <SelectItem value="overdue">Vencidas</SelectItem>
              <SelectItem value="void">Anuladas</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="tech" size="sm" className="ml-auto" onClick={() => ws.openView({ id: "view:factura.new", viewKey: "factura.new", title: "Generar factura", iconKey: "receipt", parentModule: "facturacion" })}>
            <Plus className="mr-1 h-4 w-4" />Generar factura
          </Button>
      </div>
      <CardContent className="pt-4">
        {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>N°</TableHead><TableHead>Cliente</TableHead><TableHead>Servicio</TableHead>
              <TableHead>Período</TableHead><TableHead>Vence</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Saldo</TableHead>
              <TableHead>Estado</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {invoices.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground">Sin facturas.</TableCell></TableRow>}
              {invoices.map((i: any) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                  <TableCell>{i.member?.full_name}</TableCell>
                  <TableCell className="text-sm">{i.supply?.supply_number} <Badge variant="outline" className="ml-1">{i.supply?.service_type}</Badge></TableCell>
                  <TableCell className="text-xs">{i.period_start} → {i.period_end}</TableCell>
                  <TableCell className="text-xs">{i.due_date}</TableCell>
                  <TableCell className="text-right">{fmtMoney(i.total, i.currency)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(i.balance, i.currency)}</TableCell>
                  <TableCell><StatusBadge status={i.status} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => ws.openView({
                        id: `view:factura.detail:${i.id}`,
                        viewKey: "factura.detail",
                        title: `Factura ${i.invoice_number}`,
                        iconKey: "receipt",
                        parentModule: "facturacion",
                        payload: { invoiceId: i.id },
                      })}>Ver</Button>
                      {i.status !== "void" && (
                        <DeleteButton
                          iconOnly
                          label="Anular"
                          title={`¿Anular factura ${i.invoice_number}?`}
                          description="La factura quedará marcada como anulada. Se conservará el historial."
                          onConfirm={() => voidInv.mutate(i.id)}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline", issued: "secondary", paid: "default", overdue: "destructive", void: "outline",
  };
  const labels: Record<string, string> = {
    draft: "Borrador", issued: "Emitida", paid: "Pagada", overdue: "Vencida", void: "Anulada",
  };
  return <Badge variant={map[status] ?? "outline"}>{labels[status] ?? status}</Badge>;
}

function FacturacionPageTrigger() { useEnsureTab("facturacion"); return null; }
