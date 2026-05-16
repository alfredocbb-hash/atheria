import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, FileText, Wallet, Gauge, Ban } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateReading, useCreateTariff, useGenerateInvoice, useInvoiceDetail, useInvoices,
  useMyInvoices, useReadings, useRegisterPayment, useSuppliesLite, useTariffs,
  useToggleTariff, useVoidInvoice,
} from "@/hooks/use-billing";

export const Route = createFileRoute("/_authenticated/admin/facturacion")({
  head: () => ({ meta: [{ title: "Facturación — Coopecur 2.0" }] }),
  component: FacturacionPage,
});

const fmtMoney = (n: number, c = "ARS") =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: c }).format(Number(n || 0));

function FacturacionPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.isLoading && !auth.isAdminOrOperator) navigate({ to: "/cliente", replace: true });
  }, [auth, navigate]);

  return (
    
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Operaciones</p>
          <h1 className="text-2xl font-semibold tracking-tight">Facturación</h1>
          <p className="text-sm text-muted-foreground">Tarifas, lecturas, facturas y pagos.</p>
        </div>
        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices"><FileText className="mr-2 h-4 w-4" />Facturas</TabsTrigger>
            <TabsTrigger value="readings"><Gauge className="mr-2 h-4 w-4" />Lecturas</TabsTrigger>
            <TabsTrigger value="tariffs"><Wallet className="mr-2 h-4 w-4" />Tarifas</TabsTrigger>
          </TabsList>
          <TabsContent value="invoices"><InvoicesTab /></TabsContent>
          <TabsContent value="readings"><ReadingsTab /></TabsContent>
          <TabsContent value="tariffs"><TariffsTab /></TabsContent>
        </Tabs>
      </div>
    
  );
}

// ---------- TARIFFS ----------
function TariffsTab() {
  const { data: tariffs = [], isLoading } = useTariffs();
  const create = useCreateTariff();
  const toggle = useToggleTariff();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    name: "", service_type: "water", category: "",
    fixed_charge: 0, unit_price: 0, currency: "ARS",
    valid_from: new Date().toISOString().slice(0, 10), valid_to: "", is_active: true,
  });
  const submit = async () => {
    await create.mutateAsync(form);
    setOpen(false);
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Tarifas vigentes</CardTitle>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" />Nueva tarifa</Button></SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Nueva tarifa</SheetTitle></SheetHeader>
            <div className="space-y-3 py-4">
              <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Servicio</Label>
                <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="water">Agua</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                    <SelectItem value="electricity">Electricidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Categoría</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="residencial" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Cargo fijo</Label><Input type="number" step="0.01" value={form.fixed_charge} onChange={(e) => setForm({ ...form, fixed_charge: e.target.value })} /></div>
                <div><Label>Precio por unidad</Label><Input type="number" step="0.0001" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Vigente desde</Label><Input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} /></div>
                <div><Label>Hasta (opc.)</Label><Input type="date" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} /></div>
              </div>
              <div><Label>Moneda</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
            </div>
            <SheetFooter><Button onClick={submit} disabled={create.isPending}>{create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear</Button></SheetFooter>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nombre</TableHead><TableHead>Servicio</TableHead><TableHead>Categoría</TableHead>
              <TableHead className="text-right">Cargo fijo</TableHead><TableHead className="text-right">$/unidad</TableHead>
              <TableHead>Vigencia</TableHead><TableHead>Activa</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {tariffs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">Sin tarifas cargadas.</TableCell></TableRow>}
              {tariffs.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge variant="outline">{t.service_type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{t.category ?? "—"}</TableCell>
                  <TableCell className="text-right">{fmtMoney(t.fixed_charge, t.currency)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(t.unit_price, t.currency)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.valid_from}{t.valid_to ? ` → ${t.valid_to}` : ""}</TableCell>
                  <TableCell><Switch checked={t.is_active} onCheckedChange={(v) => toggle.mutate({ id: t.id, is_active: v })} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- READINGS ----------
function ReadingsTab() {
  const { data: supplies = [] } = useSuppliesLite();
  const { data: readings = [], isLoading } = useReadings();
  const create = useCreateReading();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    meter_id: "", reading_date: new Date().toISOString().slice(0, 10),
    reading_value: 0, source: "manual", notes: "",
  });
  const meters = useMemo(
    () => supplies.flatMap((s: any) => (s.meters || []).map((m: any) => ({
      id: m.id, label: `${s.supply_number} · ${m.serial_number} · ${s.member?.full_name ?? ""}`,
    }))),
    [supplies],
  );
  const submit = async () => { await create.mutateAsync(form); setOpen(false); };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Lecturas de medidores</CardTitle>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" />Cargar lectura</Button></SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Nueva lectura</SheetTitle></SheetHeader>
            <div className="space-y-3 py-4">
              <div><Label>Medidor</Label>
                <Select value={form.meter_id} onValueChange={(v) => setForm({ ...form, meter_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Elegir medidor…" /></SelectTrigger>
                  <SelectContent>{meters.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Fecha</Label><Input type="date" value={form.reading_date} onChange={(e) => setForm({ ...form, reading_date: e.target.value })} /></div>
                <div><Label>Lectura</Label><Input type="number" step="0.001" value={form.reading_value} onChange={(e) => setForm({ ...form, reading_value: e.target.value })} /></div>
              </div>
              <div><Label>Origen</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="estimated">Estimada</SelectItem>
                    <SelectItem value="remote">Remota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <SheetFooter><Button onClick={submit} disabled={create.isPending || !form.meter_id}>{create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Registrar</Button></SheetFooter>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Fecha</TableHead><TableHead>Suministro</TableHead><TableHead>Medidor</TableHead>
              <TableHead className="text-right">Lectura</TableHead><TableHead className="text-right">Consumo</TableHead><TableHead>Origen</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {readings.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Sin lecturas.</TableCell></TableRow>}
              {readings.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.reading_date}</TableCell>
                  <TableCell className="text-sm">{r.meter?.supply?.supply_number} — {r.meter?.supply?.member?.full_name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.meter?.serial_number}</TableCell>
                  <TableCell className="text-right">{r.reading_value}</TableCell>
                  <TableCell className="text-right">{r.consumption ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- INVOICES ----------
function InvoicesTab() {
  const [status, setStatus] = useState<string>("");
  const { data: invoices = [], isLoading } = useInvoices({ status: status || undefined });
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Facturas</CardTitle>
        <div className="flex items-center gap-2">
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
          <GenerateInvoiceDialog />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>N°</TableHead><TableHead>Socio</TableHead><TableHead>Suministro</TableHead>
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
                  <TableCell><Button variant="outline" size="sm" onClick={() => setOpenId(i.id)}>Ver</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <InvoiceDetailDialog id={openId} onClose={() => setOpenId(null)} />
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

function GenerateInvoiceDialog() {
  const { data: supplies = [] } = useSuppliesLite();
  const gen = useGenerateInvoice();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const inTen = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState<any>({
    supply_id: "", period_start: monthAgo, period_end: today, due_date: inTen, tax_rate: 0, notes: "",
  });
  const submit = async () => { await gen.mutateAsync(form); setOpen(false); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" />Generar factura</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Generar factura</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Suministro</Label>
            <Select value={form.supply_id} onValueChange={(v) => setForm({ ...form, supply_id: v })}>
              <SelectTrigger><SelectValue placeholder="Elegir…" /></SelectTrigger>
              <SelectContent>{supplies.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.supply_number} — {s.member?.full_name} ({s.service_type})</SelectItem>
              ))}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Desde</Label><Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} /></div>
            <div><Label>Hasta</Label><Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} /></div>
            <div><Label>Vence</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
          <div><Label>Impuesto (0–1, ej 0.21)</Label><Input type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} /></div>
          <div><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={gen.isPending || !form.supply_id}>{gen.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Generar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: inv, isLoading } = useInvoiceDetail(id);
  const pay = useRegisterPayment();
  const voidInv = useVoidInvoice();
  const [payment, setPayment] = useState<any>({
    amount: 0, payment_date: new Date().toISOString().slice(0, 10), method: "cash", reference: "", notes: "",
  });
  useEffect(() => { if (inv) setPayment((p: any) => ({ ...p, amount: Number(inv.balance) || 0 })); }, [inv]);
  const submitPay = async () => {
    if (!inv) return;
    await pay.mutateAsync({ ...payment, invoice_id: inv.id });
  };
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{inv?.invoice_number ?? "Factura"}</DialogTitle></DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
