import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTariffs, useUpdateTariff } from "@/hooks/use-billing";
import { useWorkspace } from "../workspace-context";
import type { ViewComponentProps } from "../dynamic-views";

export function TarifaEditView({ tabId, payload }: ViewComponentProps) {
  const ws = useWorkspace();
  const id: string | undefined = payload?.id;
  const { data: tariffs = [], isLoading } = useTariffs();
  const update = useUpdateTariff();
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (form || !id) return;
    const t = (tariffs as any[]).find((x) => x.id === id);
    if (t) {
      setForm({
        name: t.name ?? "",
        service_type: t.service_type ?? "water",
        category: t.category ?? "",
        fixed_charge: t.fixed_charge ?? 0,
        unit_price: t.unit_price ?? 0,
        currency: t.currency ?? "ARS",
        valid_from: t.valid_from ?? "",
        valid_to: t.valid_to ?? "",
        is_active: !!t.is_active,
      });
    }
  }, [tariffs, id, form]);

  const submit = async () => {
    if (!id || !form) return;
    const patch = { ...form };
    if (!patch.valid_to) delete patch.valid_to;
    if (!patch.category) delete patch.category;
    await update.mutateAsync({ id, patch });
    ws.closeTab(tabId);
  };

  if (isLoading || !form) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando tarifa…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Facturación · Tarifas</p>
        <h1 className="text-2xl font-semibold tracking-tight">Editar tarifa</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3 max-w-xl">
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
              <div><Label>Hasta (opc.)</Label><Input type="date" value={form.valid_to ?? ""} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} /></div>
            </div>
            <div><Label>Moneda</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={submit} disabled={update.isPending}>
                {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar cambios
              </Button>
              <Button variant="outline" onClick={() => ws.closeTab(tabId)}>Cancelar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}