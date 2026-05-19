import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEnsureTab, useWorkspace } from "@/components/workspace/workspace-context";
import { useEffect, useState } from "react";
import { Droplets, Flame, Loader2, Plus, Search, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSupplies, useUpdateSupplyStatus, useDeleteSupply } from "@/hooks/use-padron";
import { DeleteButton } from "@/components/admin/delete-button";

export const Route = createFileRoute("/_authenticated/admin/suministros")({
  head: () => ({ meta: [{ title: "Suministros — Coopecur 2.0" }] }),
  component: SuministrosPageTrigger,
});

const ServiceIcon = ({ t }: { t: string }) =>
  t === "water" ? <Droplets className="h-3.5 w-3.5" /> :
  t === "gas" ? <Flame className="h-3.5 w-3.5" /> :
  <Zap className="h-3.5 w-3.5" />;

export function SuministrosPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const ws = useWorkspace();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [svcFilter, setSvcFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { if (!auth.isLoading && !auth.isAdminOrOperator) navigate({ to: "/cliente", replace: true }); }, [auth, navigate]);

  const filters = {
    search: debounced || undefined,
    service_type: svcFilter !== "all" ? svcFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  };
  const { data, isLoading } = useSupplies(filters);
  const updateStatus = useUpdateSupplyStatus();
  const del = useDeleteSupply();

  if (auth.isLoading || !auth.isAdminOrOperator) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por n° servicio o tarifa…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={svcFilter} onValueChange={setSvcFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Servicio" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los servicios</SelectItem>
            <SelectItem value="water">Agua</SelectItem>
            <SelectItem value="gas">Gas</SelectItem>
            <SelectItem value="electricity">Electricidad</SelectItem>
          </SelectContent>
        </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
                <SelectItem value="inactive">Baja</SelectItem>
              </SelectContent>
            </Select>
        <Button variant="tech" size="sm" className="ml-auto" onClick={() => ws.openView({ id: "view:suministro.new", viewKey: "suministro.new", title: "Nuevo servicio", iconKey: "plus", parentModule: "suministros" })}>
          <Plus className="mr-1 h-4 w-4" />Nuevo servicio
        </Button>
      </div>
      <CardContent className="pt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead><TableHead>Tipo</TableHead><TableHead>Cliente</TableHead>
                  <TableHead>Dirección</TableHead><TableHead>Tarifa</TableHead><TableHead>Estado</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /></TableCell></TableRow>
                ) : (data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Sin servicios.</TableCell></TableRow>
                ) : (
                  (data ?? []).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.supply_number}</TableCell>
                      <TableCell><Badge variant="outline" className="gap-1"><ServiceIcon t={s.service_type} />{s.service_type}</Badge></TableCell>
                      <TableCell className="text-sm">{s.member?.full_name ?? "—"}<div className="text-xs text-muted-foreground">{s.member?.member_number}</div></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.address ? `${s.address.street} ${s.address.street_number ?? ""}, ${s.address.city}` : "—"}</TableCell>
                      <TableCell className="text-xs">{s.tariff_category ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === "active" ? "default" : s.status === "suspended" ? "destructive" : "secondary"}>{s.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">···</Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                            {["active", "suspended", "inactive", "pending"].filter((v) => v !== s.status).map((v) => (
                              <DropdownMenuItem key={v} onClick={() => updateStatus.mutate({ id: s.id, status: v })}>→ {v}</DropdownMenuItem>
                            ))}
                            <DropdownMenuItem onClick={() => ws.openView({
                              id: `view:suministro.meters:${s.id}`,
                              viewKey: "suministro.meters",
                              title: `Medidores · ${s.supply_number}`,
                              iconKey: "gauge",
                              parentModule: "suministros",
                              payload: { supplyId: s.id, supplyNumber: s.supply_number },
                            })}>Gestionar medidores</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DeleteButton
                          iconOnly
                          title={`¿Eliminar servicio ${s.supply_number}?`}
                          description="Si tiene medidores o facturas activas, la operación será rechazada."
                          onConfirm={() => del.mutate(s.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
    </Card>
  );
}

function SuministrosPageTrigger() { useEnsureTab("suministros"); return null; }
