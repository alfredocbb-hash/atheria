import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LogIn, Plus, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { setActingTenant } from "@/lib/acting-tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateTenant,
  usePlansAdmin,
  useTenantMembers,
  useTenantsList,
  useUpdateTenant,
} from "@/hooks/use-super-admin";

export const Route = createFileRoute("/_authenticated/super/tenants")({
  component: TenantsPage,
});

const STATUSES = ["trial", "active", "past_due", "suspended", "cancelled"] as const;

function TenantsPage() {
  const q = useTenantsList();
  const plansQ = usePlansAdmin();
  const update = useUpdateTenant();
  const create = useCreateTenant();
  const [editing, setEditing] = useState<any | null>(null);
  const [membersOf, setMembersOf] = useState<string | null>(null);
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
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo tenant
            </Button>
          </DialogTrigger>
          <CreateTenantDialog
            plans={plansQ.data?.plans ?? []}
            onCreate={(payload) =>
              create.mutateAsync(payload).then(() => setCreating(false))
            }
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
                  <TableRow key={t.id}>
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
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => impersonate(t)}
                        title="Acceder al backoffice como esta cooperativa"
                      >
                        <LogIn className="mr-1 h-4 w-4" /> Acceder
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMembersOf(t.id)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(t)}
                      >
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

      <Sheet open={!!membersOf} onOpenChange={(o) => !o && setMembersOf(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Miembros del tenant</SheetTitle>
          </SheetHeader>
          <MembersList tenantId={membersOf} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MembersList({ tenantId }: { tenantId: string | null }) {
  const q = useTenantMembers(tenantId);
  if (!tenantId) return null;
  if (q.isLoading)
    return (
      <div className="py-6 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  return (
    <ul className="mt-4 divide-y">
      {(q.data?.members ?? []).map((m: any) => (
        <li key={m.id} className="flex items-center justify-between py-3 text-sm">
          <span>{m.email}</span>
          <Badge variant="outline">{m.role}</Badge>
        </li>
      ))}
      {q.data && q.data.members.length === 0 && (
        <li className="py-6 text-center text-sm text-muted-foreground">
          Sin miembros asignados.
        </li>
      )}
    </ul>
  );
}

function CreateTenantDialog({
  plans,
  onCreate,
  pending,
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
      <DialogHeader>
        <DialogTitle>Nuevo tenant</DialogTitle>
      </DialogHeader>
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
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label>Días de prueba</Label>
          <Input
            type="number"
            value={trialDays}
            onChange={(e) => setTrialDays(parseInt(e.target.value || "0", 10))}
          />
        </div>
        <div className="grid gap-1">
          <Label>Email del admin inicial (opcional)</Label>
          <Input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@coop.com"
          />
          <p className="text-xs text-muted-foreground">
            Si el usuario ya existe, se asigna como admin. Si no, podés invitarlo después.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={pending || !name || !slug}
          onClick={() =>
            onCreate({
              name,
              slug,
              plan_id: planId === "none" ? null : planId,
              trial_days: trialDays,
              admin_email: adminEmail || undefined,
            })
          }
        >
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditTenantDialog({
  tenant,
  plans,
  onClose,
  onSave,
  pending,
}: {
  tenant: any;
  plans: any[];
  onClose: () => void;
  onSave: (patch: any) => Promise<void>;
  pending: boolean;
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
        <DialogHeader>
          <DialogTitle>Editar tenant</DialogTitle>
        </DialogHeader>
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
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Fin de trial</Label>
              <Input
                type="date"
                value={trialEnds}
                onChange={(e) => setTrialEnds(e.target.value)}
              />
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
            onClick={() =>
              onSave({
                name,
                slug,
                plan_id: planId === "none" ? null : planId,
                status,
                trial_ends_at: trialEnds ? new Date(trialEnds).toISOString() : null,
                billing_provider: provider,
              })
            }
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}