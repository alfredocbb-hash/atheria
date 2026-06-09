import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpsertCrew } from "@/hooks/use-claims";
import { useWorkspace } from "../workspace-context";
import type { ViewComponentProps } from "../dynamic-views";

const MAX_NOTES = 1000;

export function CuadrillaEditView({ tabId, payload }: ViewComponentProps) {
  const ws = useWorkspace();
  const upsert = useUpsertCrew();
  const editing = payload?.crew;
  const [name, setName] = useState<string>(editing?.name ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const [specialty, setSpecialty] = useState<string>(editing?.specialty ?? "general");
  const [isActive, setIsActive] = useState<boolean>(editing?.is_active ?? true);
  const [notes, setNotes] = useState<string>(editing?.notes ?? "");

  const nameError = nameTouched && !name.trim() ? "El nombre es requerido" : undefined;

  const handleSubmit = () => {
    setNameTouched(true);
    if (!name.trim()) return;
    upsert.mutate(
      { id: editing?.id, patch: { name: name.trim(), specialty, is_active: isActive, notes: notes.trim() } },
      { onSuccess: () => ws.closeTab(tabId) },
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Reclamos · Cuadrillas</p>
        <h1 className="text-2xl font-semibold tracking-tight">{editing ? "Editar cuadrilla" : "Nueva cuadrilla"}</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3 max-w-xl">
            <div>
              <Label>Nombre <span className="text-destructive">*</span></Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setNameTouched(true)}
                placeholder="Cuadrilla Norte"
              />
              {nameError && <p className="mt-1 text-xs text-destructive">{nameError}</p>}
            </div>
            <div>
              <Label>Especialidad</Label>
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
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="cuadrilla-active" />
              <Label htmlFor="cuadrilla-active" className="cursor-pointer">
                {isActive ? "Activa" : "Inactiva"}
              </Label>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
                rows={3}
                placeholder="Observaciones opcionales…"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">{notes.length}/{MAX_NOTES}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button disabled={upsert.isPending} onClick={handleSubmit}>
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
