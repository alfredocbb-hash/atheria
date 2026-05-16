import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEnsureTab } from "@/components/workspace/workspace-context";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuditLog } from "@/hooks/use-notifications";

export const Route = createFileRoute("/_authenticated/admin/auditoria")({
  head: () => ({ meta: [{ title: "Auditoría — Coopecur 2.0" }] }),
  component: AuditPageTrigger,
});

const ENTITY_LABEL: Record<string, string> = {
  claim: "Reclamo", work_order: "Orden de trabajo", invoice: "Factura", payment: "Pago",
};

export function AuditPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.isLoading && !auth.hasRole("admin")) navigate({ to: "/admin", replace: true });
  }, [auth, navigate]);

  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("all");
  const filters = useMemo(
    () => ({ search: search || undefined, entity_type: entity === "all" ? undefined : entity }),
    [search, entity],
  );
  const { data: rows = [], isLoading } = useAuditLog(filters);

  return (
    
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Cumplimiento</p>
          <h1 className="text-2xl font-semibold tracking-tight">Registro de auditoría</h1>
          <p className="text-sm text-muted-foreground">Trazabilidad inmutable de eventos del sistema (solo admin).</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">Eventos recientes</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar acción o email..." className="w-64 pl-8" />
                </div>
                <Select value={entity} onValueChange={setEntity}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las entidades</SelectItem>
                    {Object.entries(ENTITY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin eventos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{r.actor_email ?? <span className="text-muted-foreground">sistema</span>}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-[10px]">{r.action}</Badge></TableCell>
                      <TableCell className="text-xs">{ENTITY_LABEL[r.entity_type] ?? r.entity_type}</TableCell>
                      <TableCell className="max-w-md">
                        <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[10px] text-muted-foreground">{JSON.stringify(r.metadata, null, 0)}</pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    
  );
}

function AuditPageTrigger() {
  useEnsureTab("auditoria");
  return null;
}
