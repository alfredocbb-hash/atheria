import { useEffect, useState } from "react";
import { Ban, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInvoiceDetail, useRegisterPayment, useVoidInvoice } from "@/hooks/use-billing";
import { useWorkspace } from "../workspace-context";
import type { ViewComponentProps } from "../dynamic-views";

const fmtMoney = (n: number, c = "ARS") => new Intl.NumberFormat("es-AR", { style: "currency", currency: c }).format(Number(n || 0));

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline", issued: "secondary", paid: "default", overdue: "destructive", void: "outline",
  };
  const labels: Record<string, string> = {
    draft: "Borrador", issued: "Emitida", paid: "Pagada", overdue: "Vencida", void: "Anulada",
  };
  return <Badge variant={map[status] ?? "outline"}>{labels[status] ?? status}</Badge>;
}

export function FacturaDetailView({ tabId, payload }: ViewComponentProps) {
  const ws = useWorkspace();
  const id: string = payload?.invoiceId;
  const { data: inv, isLoading } = useInvoiceDetail(id);
  const pay = useRegisterPayment();
  const voidInv = useVoidInvoice();
  const [payment, setPayment] = useState<any>({
    amount: 0, payment_date: new Date().toISOString().slice(0, 10), method: "cash", reference: "", notes: "",
  });
  useEffect(() => { if (inv) setPayment((p: any) => ({ ...p, amount: Number(inv.balance) || 0 })); }, [inv]);
  useEffect(() => {
    if (inv?.invoice_number) ws.updateTab(tabId, { title: `Factura ${inv.invoice_number}` });
  }, [inv?.invoice_number]);
  const submitPay = async () => { if (!inv) return; await pay.mutateAsync({ ...payment, invoice_id: inv.id }); };
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Facturación</p>
        <h1 className="text-2xl font-semibold tracking-tight">{inv?.invoice_number ?? "Factura"}</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          {isLoading || !inv ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div><span className="font-medium text-foreground">Socio:</span> {inv.member?.full_name} ({inv.member?.member_number})</div>
                <div><span className="font-medium text-foreground">Suministro:</span> {inv.supply?.supply_number} · {inv.supply?.service_type}</div>
                <div><span className="font-medium text-foreground">Período:</span> {inv.period_start} → {inv.period_end}</div>
                <div><span className="font-medium text-foreground">Vence:</span> {inv.due_date}</div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Concepto</TableHead><TableHead className="text-right">Cant.</TableHead><TableHead className="text-right">P. unit.</TableHead><TableHead className="text-right">Importe</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(inv.items ?? []).map((it: any) => (
                    <TableRow key={it.id}><TableCell>{it.description}</TableCell><TableCell className="text-right">{it.quantity}</TableCell><TableCell className="text-right">{fmtMoney(it.unit_price, inv.currency)}</TableCell><TableCell className="text-right">{fmtMoney(it.amount, inv.currency)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                <div className="flex gap-4">
                  <span>Subtotal: <strong>{fmtMoney(inv.subtotal, inv.currency)}</strong></span>
                  <span>Impuestos: <strong>{fmtMoney(inv.tax_amount, inv.currency)}</strong></span>
                </div>
                <div className="flex gap-4">
                  <span>Total: <strong>{fmtMoney(inv.total, inv.currency)}</strong></span>
                  <span>Saldo: <strong className={Number(inv.balance) > 0 ? "text-destructive" : "text-primary"}>{fmtMoney(inv.balance, inv.currency)}</strong></span>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
              {inv.payments?.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Pagos registrados</p>
                  <Table>
                    <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Método</TableHead><TableHead>Ref</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {inv.payments.map((p: any) => (
                        <TableRow key={p.id}><TableCell>{p.payment_date}</TableCell><TableCell>{p.method}</TableCell><TableCell className="text-xs">{p.reference ?? "—"}</TableCell><TableCell className="text-right">{fmtMoney(p.amount, inv.currency)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {inv.status !== "void" && inv.status !== "paid" && (
                <div className="rounded-md border p-3">
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Registrar pago</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label>Fecha</Label><Input type="date" value={payment.payment_date} onChange={(e) => setPayment({ ...payment, payment_date: e.target.value })} /></div>
                    <div><Label>Monto</Label><Input type="number" step="0.01" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} /></div>
                    <div><Label>Método</Label>
                      <Select value={payment.method} onValueChange={(v) => setPayment({ ...payment, method: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="transfer">Transferencia</SelectItem>
                          <SelectItem value="card">Tarjeta</SelectItem>
                          <SelectItem value="debit">Débito</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-2"><Label>Referencia</Label><Input value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} /></div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => voidInv.mutate(inv.id)}><Ban className="mr-1 h-4 w-4" />Anular</Button>
                    <Button size="sm" onClick={submitPay} disabled={pay.isPending}>{pay.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Registrar pago</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
