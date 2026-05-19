import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenantsList } from "@/hooks/use-super-admin";
import {
  useAllUsers,
  useCreateUser,
  useGlobalPermissions,
  useModulesList,
  useSetAppRole,
  useSetGlobalPermission,
  useSetSuperAdmin,
  useSetTenantMembership,
  useSetTenantPermission,
  useTenantPermissions,
} from "@/hooks/use-super-users";

export const Route = createFileRoute("/_authenticated/super/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios y Permisos — Plataforma" }] }),
  component: SuperUsuariosPage,
});

const APP_ROLES = ["admin", "operator", "client"] as const;
const TENANT_ROLES = ["admin", "operador", "user"] as const;

function SuperUsuariosPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Usuarios y Permisos</h1>
        <p className="text-sm text-muted-foreground">
          Gestioná usuarios, asignaciones de rol y qué módulos puede usar cada rol.
        </p>
      </div>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="global">Permisos globales</TabsTrigger>
          <TabsTrigger value="tenant">Permisos por cooperativa</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="global" className="mt-4">
          <GlobalPermsTab />
        </TabsContent>
        <TabsContent value="tenant" className="mt-4">
          <TenantPermsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Users tab ----------
function UsersTab() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAllUsers(search);
  const tenants = useTenantsList();
  const setRole = useSetAppRole();
  const setSuper = useSetSuperAdmin();
  const setMember = useSetTenantMembership();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <Input
          placeholder="Buscar por email, nombre, documento…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <CreateUserDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles globales</TableHead>
              <TableHead>Cooperativas</TableHead>
              <TableHead>Super</TableHead>
              <TableHead className="w-40">Agregar a tenant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              data?.users.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {APP_ROLES.map((r) => {
                        const has = u.app_roles.includes(r);
                        return (
                          <button
                            key={r}
                            onClick={() =>
                              setRole.mutate({ user_id: u.id, role: r, enabled: !has })
                            }
                            className="cursor-pointer"
                          >
                            <Badge variant={has ? "default" : "outline"}>{r}</Badge>
                          </button>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.tenant_memberships.map((m: any) => (
                        <Badge
                          key={m.tenant_id}
                          variant="secondary"
                          className="gap-1"
                          title={m.role}
                        >
                          {m.tenant_name} · {m.role}
                          <button
                            type="button"
                            onClick={() =>
                              setMember.mutate({
                                user_id: u.id,
                                tenant_id: m.tenant_id,
                                role: null,
                              })
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {u.tenant_memberships.length === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={u.is_super_admin}
                      onCheckedChange={(v) =>
                        setSuper.mutate({ user_id: u.id, enabled: !!v })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <AddMembershipInline userId={u.id} tenants={tenants.data?.tenants ?? []} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AddMembershipInline({
  userId,
  tenants,
}: {
  userId: string;
  tenants: Array<{ id: string; name: string }>;
}) {
  const [tid, setTid] = useState("");
  const [role, setRole] = useState<"admin" | "operador" | "user">("user");
  const setMember = useSetTenantMembership();
  return (
    <div className="flex items-center gap-1">
      <Select value={tid} onValueChange={setTid}>
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue placeholder="Tenant…" />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={role} onValueChange={(v) => setRole(v as any)}>
        <SelectTrigger className="h-8 w-24 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TENANT_ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        disabled={!tid}
        onClick={() => {
          setMember.mutate({ user_id: userId, tenant_id: tid, role });
          setTid("");
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [roles, setRoles] = useState<Array<"admin" | "operator" | "client">>([]);
  const [isSuper, setIsSuper] = useState(false);
  const create = useCreateUser();

  function toggleRole(r: "admin" | "operator" | "client") {
    setRoles((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" /> Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>
            Se crea con email confirmado y la contraseña que indiques.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nombre completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <Label>Roles globales</Label>
            <div className="flex gap-3 mt-1">
              {APP_ROLES.map((r) => (
                <label key={r} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={roles.includes(r)}
                    onCheckedChange={() => toggleRole(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isSuper} onCheckedChange={(v) => setIsSuper(!!v)} />
            Marcar como super admin
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={create.isPending || !email || password.length < 8 || !fullName}
            onClick={() =>
              create.mutate(
                {
                  email,
                  password,
                  full_name: fullName,
                  app_roles: roles,
                  is_super_admin: isSuper,
                },
                {
                  onSuccess: () => {
                    setOpen(false);
                    setEmail("");
                    setPassword("");
                    setFullName("");
                    setRoles([]);
                    setIsSuper(false);
                  },
                },
              )
            }
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Permissions matrices ----------

type Module = { key: string; title: string; category: string };
type Perm = { module_key: string; role_scope: string; role: string; enabled: boolean };

function MatrixTable({
  modules,
  roles,
  scope,
  getValue,
  onToggle,
  renderCell,
}: {
  modules: Module[];
  roles: readonly string[];
  scope: "app_role" | "tenant_role";
  getValue: (moduleKey: string, role: string) => boolean | null;
  onToggle: (moduleKey: string, role: string, current: boolean | null) => void;
  renderCell?: (moduleKey: string, role: string) => React.ReactNode;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Módulo</TableHead>
          {roles.map((r) => (
            <TableHead key={r} className="text-center capitalize">
              {r}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {modules.map((m) => (
          <TableRow key={m.key}>
            <TableCell>
              <div className="font-medium">{m.title}</div>
              <div className="text-xs text-muted-foreground">{m.key}</div>
            </TableCell>
            {roles.map((r) => {
              const v = getValue(m.key, r);
              return (
                <TableCell key={r} className="text-center">
                  {renderCell ? (
                    renderCell(m.key, r)
                  ) : (
                    <Checkbox
                      checked={!!v}
                      onCheckedChange={() => onToggle(m.key, r, v)}
                    />
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function useModulesByCategory() {
  const { data, isLoading } = useModulesList();
  const groups = useMemo(() => {
    const byCat: Record<string, Module[]> = {};
    for (const m of (data?.modules ?? []) as Module[]) {
      (byCat[m.category] ??= []).push(m);
    }
    return byCat;
  }, [data]);
  return { groups, isLoading };
}

function GlobalPermsTab() {
  const { groups, isLoading } = useModulesByCategory();
  const perms = useGlobalPermissions();
  const setPerm = useSetGlobalPermission();

  const map = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const p of (perms.data?.permissions ?? []) as Perm[]) {
      m.set(`${p.module_key}|${p.role_scope}|${p.role}`, p.enabled);
    }
    return m;
  }, [perms.data]);

  if (isLoading || perms.isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  function get(scope: "app_role" | "tenant_role", moduleKey: string, role: string) {
    return map.get(`${moduleKey}|${scope}|${role}`) ?? false;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="app">
        <TabsList>
          <TabsTrigger value="app">Roles globales (admin/operator/client)</TabsTrigger>
          <TabsTrigger value="tenant">Roles de cooperativa (admin/operador/user)</TabsTrigger>
        </TabsList>
        {(["app", "tenant"] as const).map((kind) => {
          const scope = kind === "app" ? "app_role" : "tenant_role";
          const roles = kind === "app" ? APP_ROLES : TENANT_ROLES;
          return (
            <TabsContent value={kind} key={kind} className="mt-4 space-y-6">
              {Object.entries(groups).map(([cat, mods]) => (
                <Card key={cat}>
                  <CardHeader>
                    <CardTitle className="text-sm capitalize">{cat}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MatrixTable
                      modules={mods}
                      roles={roles}
                      scope={scope}
                      getValue={(mk, r) => get(scope, mk, r)}
                      onToggle={(mk, r, current) =>
                        setPerm.mutate({
                          module_key: mk,
                          role_scope: scope,
                          role: r,
                          enabled: !current,
                        })
                      }
                    />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function TenantPermsTab() {
  const tenants = useTenantsList();
  const [tid, setTid] = useState<string | null>(null);
  const { groups, isLoading } = useModulesByCategory();
  const global = useGlobalPermissions();
  const tenant = useTenantPermissions(tid);
  const setT = useSetTenantPermission();

  const globalMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const p of (global.data?.permissions ?? []) as Perm[]) {
      m.set(`${p.module_key}|${p.role_scope}|${p.role}`, p.enabled);
    }
    return m;
  }, [global.data]);

  const tenantMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const p of (tenant.data?.permissions ?? []) as Perm[]) {
      m.set(`${p.module_key}|${p.role_scope}|${p.role}`, p.enabled);
    }
    return m;
  }, [tenant.data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <div>
          <CardTitle className="text-sm">Cooperativa</CardTitle>
        </div>
        <Select value={tid ?? ""} onValueChange={(v) => setTid(v || null)}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Elegí una cooperativa…" />
          </SelectTrigger>
          <SelectContent>
            {(tenants.data?.tenants ?? []).map((t: any) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {!tid ? (
          <p className="text-sm text-muted-foreground">
            Seleccioná una cooperativa para configurar overrides. Si no hay override,
            se usa el default global.
          </p>
        ) : isLoading || tenant.isLoading || global.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Tabs defaultValue="app">
            <TabsList>
              <TabsTrigger value="app">Roles globales</TabsTrigger>
              <TabsTrigger value="tenant">Roles de cooperativa</TabsTrigger>
            </TabsList>
            {(["app", "tenant"] as const).map((kind) => {
              const scope = kind === "app" ? "app_role" : "tenant_role";
              const roles = kind === "app" ? APP_ROLES : TENANT_ROLES;
              return (
                <TabsContent value={kind} key={kind} className="mt-4 space-y-6">
                  {Object.entries(groups).map(([cat, mods]) => (
                    <Card key={cat}>
                      <CardHeader>
                        <CardTitle className="text-sm capitalize">{cat}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MatrixTable
                          modules={mods}
                          roles={roles}
                          scope={scope}
                          getValue={(mk, r) => tenantMap.get(`${mk}|${scope}|${r}`) ?? null}
                          onToggle={() => {}}
                          renderCell={(mk, r) => {
                            const override = tenantMap.get(`${mk}|${scope}|${r}`);
                            const fallback = globalMap.get(`${mk}|${scope}|${r}`) ?? false;
                            const effective = override ?? fallback;
                            const hasOverride = override !== undefined;
                            return (
                              <div className="flex items-center justify-center gap-1">
                                <Checkbox
                                  checked={effective}
                                  onCheckedChange={() =>
                                    setT.mutate({
                                      tenant_id: tid,
                                      module_key: mk,
                                      role_scope: scope,
                                      role: r,
                                      enabled: !effective,
                                    })
                                  }
                                />
                                {hasOverride ? (
                                  <button
                                    type="button"
                                    title="Limpiar override (heredar default)"
                                    onClick={() =>
                                      setT.mutate({
                                        tenant_id: tid,
                                        module_key: mk,
                                        role_scope: scope,
                                        role: r,
                                        enabled: null,
                                      })
                                    }
                                    className="text-[10px] text-muted-foreground underline"
                                  >
                                    override
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/60">
                                    hereda
                                  </span>
                                )}
                              </div>
                            );
                          }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}