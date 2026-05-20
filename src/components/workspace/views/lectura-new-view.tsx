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

export function LecturaNewView({ tabId }: ViewComponentProps) {
  const ws = useWorkspace();
  const { data: supplies = [] } = useSuppliesLite();
  const create = useCreateReading();
  const [form, setForm, clearDraft] = useDraftState<any>(tabId, {
    meter_id: "", reading_date: new Date().toISOString().slice(0, 10),
    reading_value: 0, source: "manual", notes: "",
  });
  const meters = useMemo(
    () => supplies.flatMap((s: any) => (s.meters || []).map((m: any) => ({
      id: m.id, label: `${s.supply_number} · ${m.serial_number} · ${s.member?.full_name ?? ""}`,
    }))),
    [supplies],
  );
  const submit = async () => { await create.mutateAsync(form); clearDraft(); ws.closeTab(tabId); };
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
            <div className="flex gap-2 pt-2">
              <Button onClick={submit} disabled={create.isPending || !form.meter_id}>
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
