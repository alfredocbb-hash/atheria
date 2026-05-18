import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  usePlansAdmin,
  useTogglePlanActive,
  useUpsertPlan,
} from "@/hooks/use-super-admin";

export const Route = createFileRoute("/_authenticated/super/planes")({
  component: PlansPage,
});

function PlansPage() {
  const q = usePlansAdmin();
  const toggle = useTogglePlanActive();
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planes</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de planes ofrecidos a los tenants.
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nuevo plan</Button>
          </DialogTrigger>
          <PlanDialog
            initial={null}
            onClose={() => setCreating(false)}
            onDone={() => setCreating(false)}
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
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>MP plan id</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data?.plans ?? []).map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      {p.price_cents > 0
                        ? `$${(p.price_cents / 100).toLocaleString("es-AR")} ${p.currency}`
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.mp_preapproval_plan_id ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={(v) =>
                          toggle.mutate({ id: p.id, is_active: v })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editing && (
        <PlanDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onDone={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function PlanDialog({
  initial,
  onClose,
  onDone,
}: {
  initial: any | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const upsert = useUpsertPlan();
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? initial.price_cents / 100 : 0);
  const [currency, setCurrency] = useState(initial?.currency ?? "ARS");
  const [active, setActive] = useState(initial?.is_active ?? false);
  const [mpId, setMpId] = useState(initial?.mp_preapproval_plan_id ?? "");
  const [features, setFeatures] = useState(
    JSON.stringify(initial?.features ?? {}, null, 2),
  );
  const [limits, setLimits] = useState(
    JSON.stringify(initial?.limits ?? {}, null, 2),
  );
  const [err, setErr] = useState<string | null>(null);

  const body = (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{initial ? "Editar plan" : "Nuevo plan"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1">
          <Label>Código</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} disabled={!!initial} />
        </div>
        <div className="grid gap-1">
          <Label>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="md:col-span-2 grid gap-1">
          <Label>Descripción</Label>
          <Textarea
            rows={2}
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label>Precio</Label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value || "0"))}
          />
        </div>
        <div className="grid gap-1">
          <Label>Moneda</Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
        </div>
        <div className="md:col-span-2 grid gap-1">
          <Label>MP preapproval_plan_id</Label>
          <Input value={mpId} onChange={(e) => setMpId(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Features (JSON)</Label>
          <Textarea rows={5} value={features} onChange={(e) => setFeatures(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Limits (JSON)</Label>
          <Textarea rows={5} value={limits} onChange={(e) => setLimits(e.target.value)} />
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} />
          <Label>Activo</Label>
        </div>
        {err && <p className="md:col-span-2 text-sm text-destructive">{err}</p>}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          disabled={upsert.isPending || !code || !name}
          onClick={async () => {
            try {
              const f = JSON.parse(features || "{}");
              const l = JSON.parse(limits || "{}");
              setErr(null);
              await upsert.mutateAsync({
                id: initial?.id,
                code,
                name,
                description: description || null,
                price_cents: Math.round(price * 100),
                currency,
                is_active: active,
                features: f,
                limits: l,
                mp_preapproval_plan_id: mpId || null,
              });
              onDone();
            } catch (e: any) {
              setErr(e.message ?? "JSON inválido");
            }
          }}
        >
          {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  if (initial) {
    return (
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        {body}
      </Dialog>
    );
  }
  return body;
}