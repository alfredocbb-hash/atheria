import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LogIn, Plus, Users, ShieldCheck, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { setActingTenant } from "@/lib/acting-tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useCreateTenant,
  usePlansAdmin,
  useTenantMembers,
  useTenantsList,
  useUpdateTenant,
  useAppModules,
  useTenantPermissions,
  useSetTenantPermission,
  useResetTenantPermissions,
} from "@/hooks/use-super-admin";

export const Route = createFileRoute("/_authenticated/super/tenants")({
  component: TenantsPage,
});

const STATUSES = ["trial", "active", "past_due", "suspended", "cancelled"] as const;

// Roles que se muestran en la grilla de permisos
const TENANT_ROLES = [
  { scope: "tenant_role" as const, role: "admin", label: "Admin" },
  { scope: "tenant_role" as const, role: "operador", label: "Operador" },
  { scope: "tenant_role" as const, role: "user", label: "Usuario" },
];

const CATEGORY_LABEL: Record<string, string> = {
  tenant: "Módulos de cooperativa",
  super: "Módulos de plataforma",
  client: "Portal cliente",
};

function TenantsPage() {
  const q = useTenantsList();
  const plansQ = usePlansAdmin();
  const update = useUpdateTenant();
  const create = useCreateTenant();
  const [editing, setEditing] = useState<any | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const impersonate = (t: any) => {
    setActingTenant(t.id, t.name);
    qc.invalidateQueries();
    navigate({ to: "/admin" });
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de cooperativas / instalaciones del sistema.
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nuevo tenant</Button>
          </DialogTrigger>
          <CreateTenantDialog
            plans={plansQ.data?.plans ?? []}
            onCreate={(payload) => create.mutateAsync(payload).then(() => setCreating(false))}
            pending={create.isPending}
          />
        </Dialog>
      </header>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Trial</TableHead>
                  <TableHead>Miembros</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data?.tenants ?? []).map((t: any) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setSelectedTenant(t)}
                  >
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="font-mono text-xs">{t.slug}</TableCell>
                    <TableCell>{t.plan_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "active" ? "default" : "secondary"}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t.trial_ends_at
                        ? new Date(t.trial_ends_at).toLocaleDateString("es-AR")
                        : "—"}
                    </TableCell>
                    <TableCell>{t.members_count}</TableCell>
                    <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="secondary" onClick={() => impersonate(t)}>
                        <LogIn className="mr-1 h-4 w-4" /> Acceder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(t)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {q.data && q.data.tenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No hay tenants todavía.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      {editing && (
        <EditTenantDialog
          tenant={editing}
          plans={plansQ.data?.plans ?? []}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            await update.mutateAsync({ id: editing.id, ...patch });
            setEditing(null);
          }}
          pending={update.isPending}
        />
      )}

      {/* Tenant detail drawer */}
      <Sheet open={!!selectedTenant} onOpenChange={(o) => !o && setSelectedTenant(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedTenant && (
            <TenantDrawer tenant={selectedTenant} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Tenant Drawer ───────────────────────────────────────────────────────────

function TenantDrawer({ tenant }: { tenant: any }) {
  return (
    <>
      <SheetHeader className="pb-4 border-b">
        <SheetTitle className="flex items-center gap-2">
          <span>{tenant.name}</span>
          <Badge variant={tenant.status === "active" ? "default" : "secondary"} className="text-xs">
            {tenant.status}
          </Badge>
        </SheetTitle>
        <p className="text-xs text-muted-foreground font-mono">{tenant.slug}</p>
      </SheetHeader>

      <Tabs defaultValue="members" className="mt-4">
        <TabsList className="w-full">
          <TabsTrigger value="members" className="flex-1 gap-1.5">
            <Users className="h-3.5 w-3.5" /> Miembros
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex-1 gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Permisos de módulos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <MembersList tenantId={tenant.id} />
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <PermissionsGrid tenantId={tenant.id} tenantName={tenant.name} />
        </TabsContent>
      </Tabs>
    </>
  );
}

// ─── Members list ─────────────────────────────────────────────────────────────

function MembersList({ tenantId }: { tenantId: string }) {
  const q = useTenantMembers(tenantId);
  if (q.isLoading)
    return (
      <div className="py-10 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  return (
    <ul className="divide-y">
      {(q.data?.members ?? []).map((m: any) => (
        <li key={m.id} className="flex items-center justify-between py-3 text-sm">
          <span className="text-foreground">{m.email}</span>
          <Badge variant="outline">{m.role}</Badge>
        </li>
      ))}
      {q.data && q.data.members.length === 0 && (
        <li className="py-8 text-center text-sm text-muted-foreground">
          Sin miembros asignados.
        </li>
      )}
    </ul>
  );
}

// ─── Permissions grid ─────────────────────────────────────────────────────────

function PermissionsGrid({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const modulesQ = useAppModules();
  const permsQ = useTenantPermissions(tenantId);
  const setPermission = useSetTenantPermission();
  const resetPermissions = useResetTenantPermissions();

  const isLoading = modulesQ.isLoading || permsQ.isLoading;

  // Build effective permissions map: override wins over default
  const effectiveMap = new Map<string, boolean>();
  const overrideSet = new Set<string>();

  for (const d of permsQ.data?.defaults ?? []) {
    const key = `${d.module_key}__${d.role_scope}__${d.role}`;
    effectiveMap.set(key, d.enabled);
  }
  for (const o of permsQ.data?.overrides ?? []) {
    const key = `${o.module_key}__${o.role_scope}__${o.role}`;
    effectiveMap.set(key, o.enabled);
    overrideSet.add(key);
  }

  const getEnabled = (moduleKey: string, scope: string, role: string) =>
    effectiveMap.get(`${moduleKey}__${scope}__${role}`) ?? false;

  const isOverride = (moduleKey: string, scope: string, role: string) =>
    overrideSet.has(`${moduleKey}__${scope}__${role}`);

  const toggle = (moduleKey: string, scope: "app_role" | "tenant_role", role: string, current: boolean) => {
    setPermission.mutate({ tenantId, moduleKey, roleScope: scope, role, enabled: !current });
  };

  // Group modules by category
  const modules = modulesQ.data?.modules ?? [];
  const byCategory = modules.reduce((acc: Record<string, any[]>, m: any) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  const hasOverrides = (permsQ.data?.overrides ?? []).length > 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium">Overrides de permisos para <span className="font-semibold">{tenantName}</span></p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Los toggles en <span className="font-semibold text-[var(--brand-cyan)]">azul</span> son overrides de este tenant.
            El resto hereda los valores globales.
          </p>
        </div>
        {hasOverrides && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5 text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm(`¿Restablecer todos los permisos de ${tenantName} a los valores globales?`)) {
                resetPermissions.mutate({ tenantId });
              }
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer
          </Button>
        )}
      </div>

      {/* Tables by category */}
      {Object.entries(byCategory).map(([category, mods]) => (
        <div key={category}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {CATEGORY_LABEL[category] ?? category}
          </p>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-44">Módulo</TableHead>
                  {TENANT_ROLES.map((r) => (
                    <TableHead key={r.role} className="w-24 text-center">{r.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(mods as any[]).map((mod) => (
                  <TableRow key={mod.key}>
                    <TableCell className="text-sm font-medium">{mod.title}</TableCell>
                    {TENANT_ROLES.map((r) => {
                      const enabled = getEnabled(mod.key, r.scope, r.role);
                      const override = isOverride(mod.key, r.scope, r.role);
                      return (
                        <TableCell key={r.role} className="text-center">
                          <Switch
                            checked={enabled}
                            disabled={setPermission.isPending}
                            onCheckedChange={() => toggle(mod.key, r.scope, r.role, enabled)}
                            className={override ? "data-[state=checked]:bg-[var(--brand-cyan)]" : ""}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Create tenant dialog ─────────────────────────────────────────────────────

function CreateTenantDialog({
  plans, onCreate, pending,
}: {
  plans: any[];
  onCreate: (p: { name: string; slug: string; plan_id?: string | null; trial_days?: number; admin_email?: string }) => Promise<unknown>;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [planId, setPlanId] = useState<string>("none");
  const [trialDays, setTrialDays] = useState(30);
  const [adminEmail, setAdminEmail] = useState("");
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Nuevo tenant</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid gap-1">
          <Label>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Slug</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            placeholder="coopecur"
          />
        </div>
        <div className="grid gap-1">
          <Label>Plan inicial</Label>
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin plan</SelectItem>
              {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label>Días de prueba</Label>
          <Input type="number" value={trialDays} onChange={(e) => setTrialDays(parseInt(e.target.value || "0", 10))} />
        </div>
        <div className="grid gap-1">
          <Label>Email del admin inicial (opcional)</Label>
          <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@coop.com" />
          <p className="text-xs text-muted-foreground">Si el usuario ya existe, se asigna como admin.</p>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={pending || !name || !slug}
          onClick={() => onCreate({ name, slug, plan_id: planId === "none" ? null : planId, trial_days: trialDays, admin_email: adminEmail || undefined })}
        >
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Edit tenant dialog ───────────────────────────────────────────────────────

function EditTenantDialog({
  tenant, plans, onClose, onSave, pending,
}: {
  tenant: any; plans: any[]; onClose: () => void;
  onSave: (patch: any) => Promise<void>; pending: boolean;
}) {
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [planId, setPlanId] = useState<string>(tenant.plan_id ?? "none");
  const [status, setStatus] = useState<string>(tenant.status);
  const [trialEnds, setTrialEnds] = useState<string>(
    tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toISOString().slice(0, 10) : "",
  );
  const [provider, setProvider] = useState<string>(tenant.billing_provider ?? "mercadopago");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar tenant — {tenant.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin plan</SelectItem>
                  {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Fin de trial</Label>
              <Input type="date" value={trialEnds} onChange={(e) => setTrialEnds(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Proveedor pagos</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="stripe">Stripe (futuro)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={pending}
            onClick={() => onSave({ name, slug, plan_id: planId === "none" ? null : planId, status, trial_ends_at: trialEnds ? new Date(trialEnds).toISOString() : null, billing_provider: provider })}
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
