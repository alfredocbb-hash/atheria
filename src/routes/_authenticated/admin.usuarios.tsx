import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MoreHorizontal, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AdminPortalLayout } from "@/components/layouts/admin-portal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAssignRole,
  useRevokeRole,
  useUsersWithRoles,
} from "@/hooks/use-users";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios y Roles — Coopecur 2.0" }] }),
  component: AdminUsersPage,
});

const ALL_ROLES: Array<"admin" | "operator" | "client"> = ["admin", "operator", "client"];

function AdminUsersPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!auth.isLoading && !auth.hasRole("admin")) {
      navigate({ to: "/admin", replace: true });
    }
  }, [auth.isLoading, auth, navigate]);

  const { data, isLoading } = useUsersWithRoles(debounced);
  const assign = useAssignRole();
  const revoke = useRevokeRole();

  if (auth.isLoading || !auth.hasRole("admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminPortalLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Administración
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Usuarios y Roles
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestioná los permisos del personal y los clientes registrados.
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="h-3 w-3" /> Solo admin
          </Badge>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Padrón de usuarios</CardTitle>
            <div className="relative mt-2 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nombre o documento…"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : (data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        Sin resultados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data ?? []).map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.full_name || "—"}
                          {u.id === auth.user?.id && (
                            <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                              (vos)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{u.document_id ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 ? (
                              <span className="text-xs text-muted-foreground">sin rol</span>
                            ) : (
                              u.roles.map((r: string) => (
                                <Badge
                                  key={r}
                                  variant={r === "admin" ? "default" : r === "operator" ? "secondary" : "outline"}
                                >
                                  {r}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel>Asignar rol</DropdownMenuLabel>
                              {ALL_ROLES.filter((r) => !u.roles.includes(r)).map((r) => (
                                <DropdownMenuItem
                                  key={`assign-${r}`}
                                  onClick={() => assign.mutate({ userId: u.id, role: r })}
                                >
                                  + {r}
                                </DropdownMenuItem>
                              ))}
                              {u.roles.length > 0 && <DropdownMenuSeparator />}
                              {u.roles.length > 0 && <DropdownMenuLabel>Quitar rol</DropdownMenuLabel>}
                              {u.roles.map((r: any) => (
                                <DropdownMenuItem
                                  key={`revoke-${r}`}
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (confirm(`¿Quitar el rol "${r}" a ${u.email}?`)) {
                                      revoke.mutate({ userId: u.id, role: r });
                                    }
                                  }}
                                >
                                  − {r}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </AdminPortalLayout>
  );
}