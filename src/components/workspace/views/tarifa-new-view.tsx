import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTariff } from "@/hooks/use-billing";
import { useWorkspace } from "../workspace-context";
import type { ViewComponentProps } from "../dynamic-views";

export function TarifaNewView({ tabId }: ViewComponentProps) {
  const ws = useWorkspace();
  const create = useCreateTariff();
  const [form, setForm] = useState<any>({
    name: "", service_type: "water", category: "",
    fixed_charge: 0, unit_price: 0, currency: "ARS",
    valid_from: new Date().toISOString().slice(0, 10), valid_to: "", is_active: true,
  });
  const submit = async () => { await create.mutateAsync(form); ws.closeTab(tabId); };
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Facturación · Tarifas</p>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva tarifa</h1>
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
              <div><Label>Hasta (opc.)</Label><Input type="date" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} /></div>
            </div>
            <div><Label>Moneda</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={submit} disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear
              </Button>
              <Button variant="outline" onClick={() => ws.closeTab(tabId)}>Cancelar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
