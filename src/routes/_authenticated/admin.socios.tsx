import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEnsureTab, useWorkspace } from "@/components/workspace/workspace-context";
import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, n° socio, documento, email…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="ml-auto" onClick={() => ws.openView({ id: "view:socio.new", viewKey: "socio.new", title: "Nuevo socio", iconKey: "plus", parentModule: "socios" })}>
          <Plus className="mr-1 h-4 w-4" />Nuevo socio
        </Button>
      </div>
      <CardContent className="pt-4">
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
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Editar"
                            onClick={() => ws.openView({
                              id: `view:socio.edit:${m.id}`,
                              viewKey: "socio.edit",
                              title: `Editar · ${m.full_name}`,
                              iconKey: "pencil",
                              parentModule: "socios",
                              payload: { member: m },
                            })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DeleteButton
                            iconOnly
                            title={`¿Eliminar socio ${m.full_name}?`}
                            description="Se eliminará el socio definitivamente. Si tiene suministros, facturas o reclamos, la operación será rechazada."
                            onConfirm={() => del.mutate(m.id)}
                          />
                        </div>
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

function SociosPageTrigger() { useEnsureTab("socios"); return null; }
