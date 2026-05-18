import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEnsureTab, useWorkspace } from "@/components/workspace/workspace-context";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, Wrench } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClaims, useCrews, useDeleteClaim, useDeleteCrew } from "@/hooks/use-claims";
import { DeleteButton } from "@/components/admin/delete-button";

export const Route = createFileRoute("/_authenticated/admin/reclamos")({
  head: () => ({ meta: [{ title: "Reclamos — Coopecur 2.0" }] }),
  component: ReclamosPageTrigger,
});

const PRIORITY_LABEL: Record<string, string> = { low: "Baja", medium: "Media", high: "Alta", urgent: "Urgente" };
const STATUS_LABEL: Record<string, string> = {
  open: "Abierto", assigned: "Asignado", in_progress: "En proceso", resolved: "Resuelto", cancelled: "Cancelado",
};
const CATEGORY_LABEL: Record<string, string> = {
  water_outage: "Corte de agua", gas_outage: "Corte de gas", electricity_outage: "Corte de luz",
  leak: "Pérdida", meter: "Medidor", billing: "Facturación", other: "Otro",
};

export function ReclamosPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!auth.isLoading && !auth.isAdminOrOperator) navigate({ to: "/cliente", replace: true }); }, [auth, navigate]);
  return (
    <Tabs defaultValue="claims" className="space-y-4">
        <TabsList>
          <TabsTrigger value="claims">Reclamos</TabsTrigger>
          <TabsTrigger value="crews">Cuadrillas</TabsTrigger>
        </TabsList>
        <TabsContent value="claims"><ClaimsTab /></TabsContent>
        <TabsContent value="crews"><CrewsTab /></TabsContent>
    </Tabs>
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

function ClaimsTab() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const ws = useWorkspace();
  const del = useDeleteClaim();
  const filters = useMemo(() => ({
    search: search || undefined,
    status: status === "all" ? undefined : status,
    priority: priority === "all" ? undefined : priority,
  }), [search, status, priority]);
  const { data: rows = [], isLoading } = useClaims(filters);
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
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
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin reclamos.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead><TableHead>Título</TableHead><TableHead>Socio</TableHead>
                <TableHead>Categoría</TableHead><TableHead>Prioridad</TableHead><TableHead>Estado</TableHead><TableHead></TableHead>
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
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => ws.openView({
                        id: `view:reclamo.detail:${c.id}`,
                        viewKey: "reclamo.detail",
                        title: `Reclamo ${c.claim_number}`,
                        iconKey: "wrench",
                        parentModule: "reclamos",
                        payload: { claimId: c.id },
                      })}>Abrir</Button>
                      <DeleteButton
                        iconOnly
                        title={`¿Eliminar reclamo ${c.claim_number}?`}
                        description="Se eliminarán también sus órdenes de trabajo y comentarios."
                        onConfirm={() => del.mutate(c.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function CrewsTab() {
  const { data: crews = [], isLoading } = useCrews();
  const ws = useWorkspace();
  const del = useDeleteCrew();
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <Button size="sm" className="ml-auto" onClick={() => ws.openView({ id: "view:cuadrilla.edit:new", viewKey: "cuadrilla.edit", title: "Nueva cuadrilla", iconKey: "wrench", parentModule: "reclamos" })}>
            <Plus className="mr-1 h-4 w-4" />Nueva
          </Button>
      </div>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : crews.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin cuadrillas registradas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Nombre</TableHead><TableHead>Especialidad</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {crews.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium"><Wrench className="mr-1 inline h-3 w-3" />{c.name}</TableCell>
                  <TableCell><Badge variant="outline">{c.specialty}</Badge></TableCell>
                  <TableCell><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Activa" : "Inactiva"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => ws.openView({
                        id: `view:cuadrilla.edit:${c.id}`,
                        viewKey: "cuadrilla.edit",
                        title: `Editar · ${c.name}`,
                        iconKey: "wrench",
                        parentModule: "reclamos",
                        payload: { crew: c },
                      })}>Editar</Button>
                      <DeleteButton
                        iconOnly
                        title={`¿Eliminar cuadrilla "${c.name}"?`}
                        description="No se podrá eliminar si tiene órdenes de trabajo activas."
                        onConfirm={() => del.mutate(c.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ReclamosPageTrigger() { useEnsureTab("reclamos"); return null; }
