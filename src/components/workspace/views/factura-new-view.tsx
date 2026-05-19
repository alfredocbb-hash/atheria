import { useMemo, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenerateInvoice, useSuppliesLite } from "@/hooks/use-billing";
import { useWorkspace } from "../workspace-context";
import type { ViewComponentProps } from "../dynamic-views";

export function FacturaNewView({ tabId }: ViewComponentProps) {
  const ws = useWorkspace();
  const { data: supplies = [] } = useSuppliesLite();
  const gen = useGenerateInvoice();
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const inTen = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState<any>({
    member_id: "", supply_id: "", period_start: monthAgo, period_end: today, due_date: inTen, tax_rate: 0, notes: "",
  });

  const members = useMemo(() => {
    const map = new Map<string, { id: string; full_name: string; member_number: string }>();
    for (const s of supplies as any[]) {
      const m = s.member;
      if (m?.id && !map.has(m.id)) {
        map.set(m.id, { id: m.id, full_name: m.full_name, member_number: m.member_number });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.member_number || "").localeCompare(b.member_number || "", "es", { numeric: true })
    );
  }, [supplies]);

  const memberSupplies = useMemo(
    () => (supplies as any[]).filter((s) => s.member?.id === form.member_id),
    [supplies, form.member_id]
  );

  // Autoselect supply when the member has only one
  useEffect(() => {
    if (form.member_id && memberSupplies.length === 1 && form.supply_id !== memberSupplies[0].id) {
      setForm((f: any) => ({ ...f, supply_id: memberSupplies[0].id }));
    }
  }, [form.member_id, memberSupplies, form.supply_id]);

  const submit = async () => {
    try {
      await gen.mutateAsync({
        ...form,
        tax_rate: Math.min(1, Math.max(0, Number(form.tax_rate) || 0)),
      });
      ws.closeTab(tabId);
    } catch {
      // El hook muestra el error; mantener la pestaña abierta evita pantalla en blanco.
    }
  };
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Facturación</p>
        <h1 className="text-2xl font-semibold tracking-tight">Generar factura</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3 max-w-2xl">
            <div>
              <Label>Cliente</Label>
              <Select
                value={form.member_id}
                onValueChange={(v) => setForm({ ...form, member_id: v, supply_id: "" })}
              >
                <SelectTrigger><SelectValue placeholder="Elegir cliente…" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.member_number} — {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Servicio</Label>
              <Select
                value={form.supply_id}
                onValueChange={(v) => setForm({ ...form, supply_id: v })}
                disabled={!form.member_id || memberSupplies.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !form.member_id
                        ? "Elegí primero un cliente"
                        : memberSupplies.length === 0
                        ? "Este cliente no tiene servicios"
                        : "Elegir servicio…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {memberSupplies.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.service_type} — {s.supply_number}
                      {s.tariff_category ? ` (${s.tariff_category})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.member_id && memberSupplies.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Este cliente no tiene servicios cargados. Cargá uno desde el ABM de servicios.
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Desde</Label><Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} /></div>
              <div><Label>Hasta</Label><Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} /></div>
              <div><Label>Vence</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div><Label>Impuesto (0–1, ej 0.21)</Label><Input type="number" step="0.01" min="0" max="1" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value === "" ? 0 : Number(e.target.value) })} /></div>
            <div><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={submit} disabled={gen.isPending || !form.supply_id}>
                {gen.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Generar
              </Button>
              <Button variant="outline" onClick={() => ws.closeTab(tabId)}>Cancelar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
