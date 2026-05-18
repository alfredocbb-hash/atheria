import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAddClaimComment, useClaim, useCreateWorkOrder, useCrews, useUpdateClaimStatus, useUpdateWorkOrderStatus,
} from "@/hooks/use-claims";
import { useWorkspace } from "../workspace-context";
import type { ViewComponentProps } from "../dynamic-views";

const PRIORITY_LABEL: Record<string, string> = { low: "Baja", medium: "Media", high: "Alta", urgent: "Urgente" };
const STATUS_LABEL: Record<string, string> = {
  open: "Abierto", assigned: "Asignado", in_progress: "En proceso", resolved: "Resuelto", cancelled: "Cancelado",
};
const CATEGORY_LABEL: Record<string, string> = {
  water_outage: "Corte de agua", gas_outage: "Corte de gas", electricity_outage: "Corte de luz",
  leak: "Pérdida", meter: "Medidor", billing: "Facturación", other: "Otro",
};

function PriorityBadge({ value }: { value: string }) {
  const variant = value === "urgent" ? "destructive" : value === "high" ? "default" : "secondary";
  return <Badge variant={variant as any}>{PRIORITY_LABEL[value]}</Badge>;
}
function StatusBadge({ value }: { value: string }) {
  const variant = value === "resolved" ? "default" : value === "cancelled" ? "secondary" : value === "open" ? "destructive" : "outline";
  return <Badge variant={variant as any}>{STATUS_LABEL[value]}</Badge>;
}

export function ReclamoDetailView({ tabId, payload }: ViewComponentProps) {
  const ws = useWorkspace();
  const id: string = payload?.claimId;
  const { data, isLoading } = useClaim(id);
  const { data: crews = [] } = useCrews();
  const updateStatus = useUpdateClaimStatus();
  const createWO = useCreateWorkOrder();
  const updateWO = useUpdateWorkOrderStatus();
  const addComment = useAddClaimComment();

  const [crewId, setCrewId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [woNotes, setWoNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [comment, setComment] = useState("");
  const [internal, setInternal] = useState(false);

  useEffect(() => { if (data?.claim) setNewStatus(data.claim.status); }, [data?.claim?.id]);
  useEffect(() => {
    if (data?.claim?.claim_number) ws.updateTab(tabId, { title: `Reclamo ${data.claim.claim_number}` });
  }, [data?.claim?.claim_number]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Reclamos</p>
        <h1 className="text-2xl font-semibold tracking-tight">{data?.claim?.claim_number ?? "Reclamo"}</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          {isLoading || !data?.claim ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">{data.claim.title}</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  <PriorityBadge value={data.claim.priority} />
                  <StatusBadge value={data.claim.status} />
                  <Badge variant="outline">{CATEGORY_LABEL[data.claim.category]}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Socio: {data.claim.members?.full_name} · #{data.claim.members?.member_number}
                </p>
                {data.claim.supplies && (
                  <p className="text-sm text-muted-foreground">Suministro: {data.claim.supplies.supply_number} ({data.claim.supplies.service_type})</p>
                )}
                {data.claim.location && <p className="text-sm">📍 {data.claim.location}</p>}
                {data.claim.description && <p className="mt-2 text-sm whitespace-pre-wrap">{data.claim.description}</p>}
              </div>

              <div className="rounded-lg border p-3">
                <Label className="text-xs font-medium uppercase text-muted-foreground">Cambiar estado</Label>
                <div className="mt-2 flex gap-2">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => updateStatus.mutate({ id: data.claim.id, status: newStatus })} disabled={updateStatus.isPending}>
                    Guardar
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <Label className="text-xs font-medium uppercase text-muted-foreground">Despachar a cuadrilla</Label>
                <div className="mt-2 space-y-2">
                  <Select value={crewId} onValueChange={setCrewId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cuadrilla" /></SelectTrigger>
                    <SelectContent>
                      {crews.filter((c: any) => c.is_active).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.specialty})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                  <Textarea placeholder="Notas para la cuadrilla..." value={woNotes} onChange={(e) => setWoNotes(e.target.value)} rows={2} />
                  <Button
                    className="w-full"
                    disabled={!crewId || createWO.isPending}
                    onClick={() =>
                      createWO.mutate(
                        { claim_id: data.claim.id, crew_id: crewId, scheduled_at: scheduledAt, notes: woNotes },
                        { onSuccess: () => { setCrewId(""); setScheduledAt(""); setWoNotes(""); } },
                      )
                    }
                  >
                    Crear orden de trabajo
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium uppercase text-muted-foreground">Órdenes de trabajo</Label>
                {data.work_orders.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Sin órdenes.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {data.work_orders.map((wo: any) => (
                      <div key={wo.id} className="rounded-md border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{wo.crews?.name} <span className="text-xs text-muted-foreground">({wo.crews?.specialty})</span></p>
                          <Badge variant={wo.status === "completed" ? "default" : wo.status === "cancelled" ? "secondary" : "outline"}>{wo.status}</Badge>
                        </div>
                        {wo.scheduled_at && <p className="text-xs text-muted-foreground">Programada: {new Date(wo.scheduled_at).toLocaleString()}</p>}
                        {wo.notes && <p className="mt-1 text-xs">{wo.notes}</p>}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {wo.status === "scheduled" && (
                            <Button size="sm" variant="outline" onClick={() => updateWO.mutate({ id: wo.id, status: "in_progress" })}>Iniciar</Button>
                          )}
                          {wo.status === "in_progress" && (
                            <Button size="sm" onClick={() => updateWO.mutate({ id: wo.id, status: "completed" })}>Completar</Button>
                          )}
                          {wo.status !== "completed" && wo.status !== "cancelled" && (
                            <Button size="sm" variant="ghost" onClick={() => updateWO.mutate({ id: wo.id, status: "cancelled" })}>Cancelar</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium uppercase text-muted-foreground">Comentarios</Label>
                <div className="mt-2 space-y-2">
                  {data.comments.length === 0 && <p className="text-sm text-muted-foreground">Sin comentarios.</p>}
                  {data.comments.map((co: any) => (
                    <div key={co.id} className="rounded-md border bg-muted/30 p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{new Date(co.created_at).toLocaleString()}</span>
                        {co.is_internal && <Badge variant="secondary" className="text-[10px]">Interno</Badge>}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap">{co.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 space-y-2">
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Agregar comentario..." rows={2} />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                      Solo interno
                    </label>
                    <Button
                      size="sm"
                      disabled={!comment.trim() || addComment.isPending}
                      onClick={() =>
                        addComment.mutate(
                          { claim_id: data.claim.id, body: comment, is_internal: internal },
                          { onSuccess: () => setComment("") },
                        )
                      }
                    >
                      Publicar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
