import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEnsureTab, useWorkspace } from "@/components/workspace/workspace-context";
import { useEffect, useState } from "react";
import { Loader2, Plus, Search, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMembers } from "@/hooks/use-padron";
import { useDeleteMember } from "@/hooks/use-padron";
import { DeleteButton } from "@/components/admin/delete-button";

export const Route = createFileRoute("/_authenticated/admin/socios")({
  head: () => ({ meta: [{ title: "Socios — Coopecur 2.0" }] }),
  component: SociosPageTrigger,
});

export function SociosPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const ws = useWorkspace();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { if (!auth.isLoading && !auth.isAdminOrOperator) navigate({ to: "/cliente", replace: true }); }, [auth, navigate]);

  const { data, isLoading } = useMembers(debounced);
  const del = useDeleteMember();

  if (auth.isLoading || !auth.isAdminOrOperator) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Padrones</p>
          <h1 className="text-2xl font-semibold tracking-tight">Socios</h1>
          <p className="text-sm text-muted-foreground">Padrón de asociados de la cooperativa.</p>
        </div>
        <Button onClick={() => ws.openView({ id: "view:socio.new", viewKey: "socio.new", title: "Nuevo socio", iconKey: "plus", parentModule: "socios" })}>
          <Plus className="mr-2 h-4 w-4" />Nuevo socio
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Padrón</CardTitle>
          <div className="relative mt-2 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, n° socio, documento, email…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° socio</TableHead><TableHead>Nombre</TableHead><TableHead>Documento</TableHead>
                  <TableHead>Contacto</TableHead><TableHead>Cuenta</TableHead><TableHead>Estado</TableHead>
                  <TableHead className="w-20 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /></TableCell></TableRow>
                ) : (data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Sin socios cargados.</TableCell></TableRow>
                ) : (
                  (data ?? []).map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.member_number}</TableCell>
                      <TableCell className="font-medium">{m.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{m.document_id ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {m.email ?? "—"}{m.phone ? <><br />{m.phone}</> : null}
                      </TableCell>
                      <TableCell>{m.user_id ? <Badge variant="outline">Vinculada</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <Badge variant={m.status === "active" ? "default" : m.status === "suspended" ? "destructive" : "secondary"}>{m.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DeleteButton
                          iconOnly
                          title={`¿Eliminar socio ${m.full_name}?`}
                          description="Se eliminará el socio definitivamente. Si tiene suministros, facturas o reclamos, la operación será rechazada."
                          onConfirm={() => del.mutate(m.id)}
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
    </div>
  );
}

function SociosPageTrigger() { useEnsureTab("socios"); return null; }
