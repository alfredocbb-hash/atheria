import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateReading, useSuppliesLite } from "@/hooks/use-billing";
import { useWorkspace } from "../workspace-context";
import type { ViewComponentProps } from "../dynamic-views";
import { useDraftState } from "@/hooks/use-draft-state";
import { useState } from "react";

const today = new Date().toISOString().slice(0, 10);

type FormErrors = Partial<Record<string, string>>;

function validate(form: any): FormErrors {
  const errors: FormErrors = {};
  if (!form.meter_id) errors.meter_id = "Seleccioná un medidor";
  if (!form.reading_date) errors.reading_date = "Requerido";
  if (form.reading_date && form.reading_date > today) errors.reading_date = "No puede ser una fecha futura";
  const val = Number(form.reading_value);
  if (form.reading_value === "" || form.reading_value === null) errors.reading_value = "Requerido";
  else if (isNaN(val) || val < 0) errors.reading_value = "Debe ser un número ≥ 0";
  return errors;
}

export function LecturaNewView({ tabId }: ViewComponentProps) {
  const ws = useWorkspace();
  const { data: supplies = [] } = useSuppliesLite();
  const create = useCreateReading();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm, clearDraft] = useDraftState<any>(tabId, {
    meter_id: "", reading_date: today,
    reading_value: "", source: "manual", notes: "",
  });

  const errors = validate(form);
  const touch = (f: string) => setTouched((t) => ({ ...t, [f]: true }));
  const err = (f: string) => touched[f] ? errors[f] : undefined;

  const meters = useMemo(
    () => supplies.flatMap((s: any) => (s.meters || []).map((m: any) => ({
      id: m.id, label: `${s.supply_number} · ${m.serial_number} · ${s.member?.full_name ?? ""}`,
    }))),
    [supplies],
  );

  const submit = async () => {
    setTouched({ meter_id: true, reading_date: true, reading_value: true });
    if (Object.keys(errors).length > 0) return;
    await create.mutateAsync({ ...form, reading_value: Number(form.reading_value) });
    clearDraft();
    ws.closeTab(tabId);
  };

  const cancel = () => { clearDraft(); ws.closeTab(tabId); };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Facturación · Lecturas</p>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva lectura</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3 max-w-xl">
            <div>
              <Label>Medidor <span className="text-destructive">*</span></Label>
              <Select
                value={form.meter_id}
                onValueChange={(v) => { setForm({ ...form, meter_id: v }); touch("meter_id"); }}
              >
                <SelectTrigger><SelectValue placeholder="Elegir medidor…" /></SelectTrigger>
                <SelectContent>{meters.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
              {err("meter_id") && <p className="mt-1 text-xs text-destructive">{err("meter_id")}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Fecha <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  max={today}
                  value={form.reading_date}
                  onChange={(e) => setForm({ ...form, reading_date: e.target.value })}
                  onBlur={() => touch("reading_date")}
                />
                {err("reading_date") && <p className="mt-1 text-xs text-destructive">{err("reading_date")}</p>}
              </div>
              <div>
                <Label>Lectura <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.reading_value}
                  onChange={(e) => setForm({ ...form, reading_value: e.target.value })}
                  onBlur={() => touch("reading_value")}
                  placeholder="0.000"
                />
                {err("reading_value") && <p className="mt-1 text-xs text-destructive">{err("reading_value")}</p>}
              </div>
            </div>
            <div>
              <Label>Origen</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="estimated">Estimada</SelectItem>
                  <SelectItem value="remote">Remota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                maxLength={500}
                placeholder="Observaciones opcionales…"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">{(form.notes ?? "").length}/500</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={submit} disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Registrar
              </Button>
              <Button variant="outline" onClick={cancel}>Cancelar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
