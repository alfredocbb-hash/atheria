import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTariff } from "@/hooks/use-billing";
import { useWorkspace } from "../workspace-context";
import type { ViewComponentProps } from "../dynamic-views";
import { useDraftState } from "@/hooks/use-draft-state";
import { useState } from "react";

const CURRENCIES = ["ARS", "USD", "EUR", "UYU"] as const;

type FormErrors = Partial<Record<string, string>>;

function validate(form: any): FormErrors {
  const errors: FormErrors = {};
  if (!form.name?.trim()) errors.name = "Requerido";
  if (!form.category?.trim()) errors.category = "Requerido";
  const fixed = Number(form.fixed_charge);
  if (isNaN(fixed) || fixed < 0) errors.fixed_charge = "Debe ser un número ≥ 0";
  const unit = Number(form.unit_price);
  if (isNaN(unit) || unit < 0) errors.unit_price = "Debe ser un número ≥ 0";
  if (!form.valid_from) errors.valid_from = "Requerido";
  if (form.valid_to && form.valid_from && form.valid_to <= form.valid_from)
    errors.valid_to = "Debe ser posterior a 'Vigente desde'";
  return errors;
}

export function TarifaNewView({ tabId }: ViewComponentProps) {
  const ws = useWorkspace();
  const create = useCreateTariff();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm, clearDraft] = useDraftState<any>(tabId, {
    name: "", service_type: "water", category: "",
    fixed_charge: "", unit_price: "", currency: "ARS",
    valid_from: new Date().toISOString().slice(0, 10), valid_to: "", is_active: true,
  });

  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));
  const err = (field: string) => touched[field] ? errors[field] : undefined;

  const submit = async () => {
    // touch all fields to show all errors
    setTouched({ name: true, category: true, fixed_charge: true, unit_price: true, valid_from: true, valid_to: true });
    if (hasErrors) return;
    await create.mutateAsync({
      ...form,
      name: form.name.trim(),
      category: form.category.trim(),
      fixed_charge: Number(form.fixed_charge),
      unit_price: Number(form.unit_price),
    });
    clearDraft();
    ws.closeTab(tabId);
  };

  const cancel = () => { clearDraft(); ws.closeTab(tabId); };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Facturación · Tarifas</p>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva tarifa</h1>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Datos de la tarifa</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-xl">
            <div>
              <Label>Nombre <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={() => touch("name")}
                placeholder="Tarifa residencial R1"
              />
              {err("name") && <p className="mt-1 text-xs text-destructive">{err("name")}</p>}
            </div>
            <div>
              <Label>Servicio</Label>
              <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="water">Agua</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="electricity">Electricidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoría <span className="text-destructive">*</span></Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                onBlur={() => touch("category")}
                placeholder="residencial"
              />
              {err("category") && <p className="mt-1 text-xs text-destructive">{err("category")}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cargo fijo</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.fixed_charge}
                  onChange={(e) => setForm({ ...form, fixed_charge: e.target.value })}
                  onBlur={() => touch("fixed_charge")}
                  placeholder="0.00"
                />
                {err("fixed_charge") && <p className="mt-1 text-xs text-destructive">{err("fixed_charge")}</p>}
              </div>
              <div>
                <Label>Precio por unidad</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                  onBlur={() => touch("unit_price")}
                  placeholder="0.0000"
                />
                {err("unit_price") && <p className="mt-1 text-xs text-destructive">{err("unit_price")}</p>}
              </div>
            </div>
            <div>
              <Label>Moneda</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Vigente desde <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.valid_from}
                  onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                  onBlur={() => touch("valid_from")}
                />
                {err("valid_from") && <p className="mt-1 text-xs text-destructive">{err("valid_from")}</p>}
              </div>
              <div>
                <Label>Hasta (opc.)</Label>
                <Input
                  type="date"
                  value={form.valid_to}
                  min={form.valid_from || undefined}
                  onChange={(e) => setForm({ ...form, valid_to: e.target.value })}
                  onBlur={() => touch("valid_to")}
                />
                {err("valid_to") && <p className="mt-1 text-xs text-destructive">{err("valid_to")}</p>}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={submit} disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear
              </Button>
              <Button variant="outline" onClick={cancel}>Cancelar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
