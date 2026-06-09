import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEnsureTab } from "@/components/workspace/workspace-context";
import { useEffect, useState } from "react";
import { Loader2, Search, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAssignRole, useRevokeRole, useUsersWithRoles } from "@/hooks/use-users";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios y Roles" }] }),
  component: AdminUsersPageTrigger,
});

// Roles disponibles para asignar — el admin NO puede crear nuevos roles
const AVAILABLE_ROLES: Array<{ value: "admin" | "operator" | "client"; label: string; description: string }> = [
  { value: "admin", label: "Administrador", description: "Acceso completo al backoffice" },
  { value: "operator", label: "Operador", description: "Gestión operativa sin configuración" },
  { value: "client", label: "Cliente / Socio", description: "Solo portal del cliente" },
];

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-[var(--brand-deep)]/10 text-[var(--brand-deep)] border-[var(--brand-deep)]/20",
  operator: "bg-[var(--brand-cyan)]/10 text-[var(--brand-blue)] border-[var(--brand-cyan)]/20",
  client: "bg-[var(--brand-lime)]/10 text-[var(--status-paid-foreground)] border-[var(--brand-lime)]/20",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  operator: "Operador",
  client: "Cliente",
};

export function AdminUsersPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [assignTarget, setAssignTarget] = useState<any | null>(null);

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

  const users = data ?? [];
  const adminCount = users.filter((u: any) => u.roles.includes("admin")).length;
  const operatorCount = users.filter((u: any) => u.roles.includes("operator")).length;
  const clientCount = users.filter((u: any) => u.roles.includes("client")).length;

  if (auth.isLoading || !auth.hasRole("admin")) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Administración
          </p>
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Usuarios y Roles
          </h1>
          <p className="text-sm text-muted-foreground">
            Asigná roles existentes a los usuarios de tu cooperativa.
          </p>
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Administradores", count: adminCount, role: "admin", icon: ShieldCheck },
          { label: "Operadores", count: operatorCount, role: "operator", icon: Users },
          { label: "Clientes", count: clientCount, role: "client", icon: UserPlus },
        ].map(({ label, count, role, icon: Icon }) => (
          <div
            key={role}
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className="h-4 w-4 text-[var(--brand-blue)]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notice: roles are defined by the platform */}
      <div className="flex items-start gap-2 rounded-lg border border-[var(--brand-cyan)]/30 bg-[var(--brand-cyan)]/5 px-4 py-3 text-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-blue)]" />
        <p className="text-muted-foreground">
          Los roles disponibles son definidos por la plataforma. Como administrador podés <strong className="text-foreground">asignar o quitar roles</strong> a usuarios existentes, pero no crear roles nuevos.
        </p>
      </div>

      {/* Table */}
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, nombre o documento…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Roles asignados</TableHead>
                <TableHead className="text-right">Gestionar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Sin resultados.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u: any) => (
                  <TableRow key={u.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      {u.full_name || "—"}
                      {u.id === auth.user?.id && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">(vos)</span>
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
                            <span
                              key={r}
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[r] ?? "bg-muted text-muted-foreground border-border"}`}
                            >
                              {ROLE_LABEL[r] ?? r}
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignTarget(u)}
                      >
                        Gestionar roles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign/revoke role dialog */}
      {assignTarget && (
        <ManageRolesDialog
          user={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssign={(role) => assign.mutate({ userId: assignTarget.id, role }, { onSuccess: () => setAssignTarget(null) })}
          onRevoke={(role) => revoke.mutate({ userId: assignTarget.id, role }, { onSuccess: () => setAssignTarget(null) })}
          pending={assign.isPending || revoke.isPending}
          isSelf={assignTarget.id === auth.user?.id}
        />
      )}
    </div>
  );
}

// ─── Manage roles dialog ──────────────────────────────────────────────────────

function ManageRolesDialog({
  user, onClose, onAssign, onRevoke, pending, isSelf,
}: {
  user: any;
  onClose: () => void;
  onAssign: (role: "admin" | "operator" | "client") => void;
  onRevoke: (role: "admin" | "operator" | "client") => void;
  pending: boolean;
  isSelf: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<"admin" | "operator" | "client" | "">("");
  const [action, setAction] = useState<"assign" | "revoke">("assign");

  const rolesNotAssigned = AVAILABLE_ROLES.filter((r) => !user.roles.includes(r.value));
  const rolesAssigned = AVAILABLE_ROLES.filter((r) => user.roles.includes(r.value));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar roles — {user.full_name || user.email}</DialogTitle>
        </DialogHeader>

        {/* Current roles */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Roles actuales</p>
          {user.roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este usuario no tiene roles asignados.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.roles.map((r: string) => (
                <span
                  key={r}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${ROLE_BADGE[r] ?? ""}`}
                >
                  {ROLE_LABEL[r] ?? r}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Role definitions */}
        <div className="rounded-lg border divide-y">
          {AVAILABLE_ROLES.map((r) => (
            <div key={r.value} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
              {user.roles.includes(r.value) ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive text-xs"
                  disabled={pending || (isSelf && r.value === "admin")}
                  onClick={() => {
                    if (confirm(`¿Quitar el rol "${r.label}" a ${user.email}?`)) {
                      onRevoke(r.value);
                    }
                  }}
                >
                  Quitar
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled={pending}
                  onClick={() => onAssign(r.value)}
                >
                  Asignar
                </Button>
              )}
            </div>
          ))}
        </div>

        {isSelf && (
          <p className="text-xs text-muted-foreground">
            No podés quitarte el rol de Administrador a vos mismo.
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminUsersPageTrigger() {
  useEnsureTab("usuarios");
  return null;
}
