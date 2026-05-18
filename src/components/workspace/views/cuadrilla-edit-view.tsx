import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpsertCrew } from "@/hooks/use-claims";
import { useWorkspace } from "../workspace-context";
import type { ViewComponentProps } from "../dynamic-views";

export function CuadrillaEditView({ tabId, payload }: ViewComponentProps) {
  const ws = useWorkspace();
  const upsert = useUpsertCrew();
  const editing = payload?.crew;
  const [name, setName] = useState<string>(editing?.name ?? "");
  const [specialty, setSpecialty] = useState<string>(editing?.specialty ?? "general");
  const [isActive, setIsActive] = useState<boolean>(editing?.is_active ?? true);
  const [notes, setNotes] = useState<string>(editing?.notes ?? "");
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Reclamos · Cuadrillas</p>
        <h1 className="text-2xl font-semibold tracking-tight">{editing ? "Editar cuadrilla" : "Nueva cuadrilla"}</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3 max-w-xl">
            <div><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Especialidad</Label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="water">Agua</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="electricity">Electricidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Activa
            </label>
            <div><Label>Notas</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
            <div className="flex gap-2 pt-2">
              <Button
                disabled={!name.trim() || upsert.isPending}
                onClick={() =>
                  upsert.mutate(
                    { id: editing?.id, patch: { name, specialty, is_active: isActive, notes } },
                    { onSuccess: () => ws.closeTab(tabId) },
                  )
                }
              >
                {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar
              </Button>
              <Button variant="outline" onClick={() => ws.closeTab(tabId)}>Cancelar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
