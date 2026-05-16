import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, Wrench } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAddClaimComment,
  useClaim,
  useClaims,
  useCreateWorkOrder,
  useCrews,
  useUpdateClaimStatus,
  useUpdateWorkOrderStatus,
  useUpsertCrew,
} from "@/hooks/use-claims";

export const Route = createFileRoute("/_authenticated/admin/reclamos")({
  head: () => ({ meta: [{ title: "Reclamos — Coopecur 2.0" }] }),
  component: ReclamosPage,
});

const PRIORITY_LABEL: Record<string, string> = { low: "Baja", medium: "Media", high: "Alta", urgent: "Urgente" };
const STATUS_LABEL: Record<string, string> = {
  open: "Abierto", assigned: "Asignado", in_progress: "En proceso", resolved: "Resuelto", cancelled: "Cancelado",
};
const CATEGORY_LABEL: Record<string, string> = {
  water_outage: "Corte de agua", gas_outage: "Corte de gas", electricity_outage: "Corte de luz",
  leak: "Pérdida", meter: "Medidor", billing: "Facturación", other: "Otro",
};

function ReclamosPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.isLoading && !auth.isAdminOrOperator) navigate({ to: "/cliente", replace: true });
  }, [auth, navigate]);

  return (
    
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Operaciones</p>
          <h1 className="text-2xl font-semibold tracking-tight">Reclamos y despacho</h1>
          <p className="text-sm text-muted-foreground">Atención de incidentes, asignación a cuadrillas y seguimiento.</p>
        </div>
        <Tabs defaultValue="claims">
          <TabsList>
            <TabsTrigger value="claims">Reclamos</TabsTrigger>
            <TabsTrigger value="crews">Cuadrillas</TabsTrigger>
          </TabsList>
          <TabsContent value="claims" className="mt-4"><ClaimsTab /></TabsContent>
          <TabsContent value="crews" className="mt-4"><CrewsTab /></TabsContent>
        </Tabs>
      </div>
    
  );
}

function ClaimsTab() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: status === "all" ? undefined : status,
      priority: priority === "all" ? undefined : priority,
    }),
    [search, status, priority],
  );
  const { data: rows = [], isLoading } = useClaims(filters);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Listado de reclamos</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nº, título o ubicación..." className="w-64 pl-8" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(PRIORITY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin reclamos.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Socio</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.claim_number}</TableCell>
                  <TableCell className="max-w-xs truncate font-medium">{c.title}</TableCell>
                  <TableCell className="text-sm">
                    {c.members?.full_name ?? "—"}
                    {c.members?.member_number && <span className="ml-1 font-mono text-xs text-muted-foreground">#{c.members.member_number}</span>}
                  </TableCell>
                  <TableCell className="text-sm">{CATEGORY_LABEL[c.category]}</TableCell>
                  <TableCell><PriorityBadge value={c.priority} /></TableCell>
                  <TableCell><StatusBadge value={c.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelectedId(c.id)}>Abrir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <ClaimDetailSheet id={selectedId} onClose={() => setSelectedId(null)} />
    </Card>
  );
}

function PriorityBadge({ value }: { value: string }) {
  const variant = value === "urgent" ? "destructive" : value === "high" ? "default" : "secondary";
  return <Badge variant={variant as any}>{PRIORITY_LABEL[value]}</Badge>;
}
function StatusBadge({ value }: { value: string }) {
  const variant = value === "resolved" ? "default" : value === "cancelled" ? "secondary" : value === "open" ? "destructive" : "outline";
  return <Badge variant={variant as any}>{STATUS_LABEL[value]}</Badge>;
}

function ClaimDetailSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
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

  useEffect(() => {
    if (data?.claim) setNewStatus(data.claim.status);
  }, [data?.claim?.id]);

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{data?.claim?.claim_number ?? "Reclamo"}</SheetTitle>
        </SheetHeader>
        {isLoading || !data?.claim ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="mt-4 space-y-5">
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
        <SheetFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function CrewsTab() {
  const { data: crews = [], isLoading } = useCrews();
  const upsert = useUpsertCrew();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("general");
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");

  function openNew() {
    setEditing(null); setName(""); setSpecialty("general"); setIsActive(true); setNotes(""); setOpen(true);
  }
  function openEdit(c: any) {
    setEditing(c); setName(c.name); setSpecialty(c.specialty); setIsActive(c.is_active); setNotes(c.notes ?? ""); setOpen(true);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Cuadrillas</CardTitle>
          <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" />Nueva</Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : crews.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin cuadrillas registradas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crews.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium"><Wrench className="mr-1 inline h-3 w-3" />{c.name}</TableCell>
                  <TableCell><Badge variant="outline">{c.specialty}</Badge></TableCell>
                  <TableCell><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Activa" : "Inactiva"}</Badge></TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => openEdit(c)}>Editar</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>{editing ? "Editar cuadrilla" : "Nueva cuadrilla"}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
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
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              disabled={!name.trim() || upsert.isPending}
              onClick={() =>
                upsert.mutate(
                  { id: editing?.id, patch: { name, specialty, is_active: isActive, notes } },
                  { onSuccess: () => setOpen(false) },
                )
              }
            >
              Guardar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}