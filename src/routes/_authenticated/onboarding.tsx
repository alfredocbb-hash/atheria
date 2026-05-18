import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Check, Building2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useMyContext, useCheckSlug, useCreateMyTenant } from "@/hooks/use-onboarding";
import { usePlans } from "@/hooks/use-subscription";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Crear cooperativa — Coopecur 2.0" }] }),
  component: OnboardingPage,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function OnboardingPage() {
  const ctx = useMyContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (ctx.data?.hasTenant || ctx.data?.isSuperAdmin) {
      navigate({ to: "/admin", replace: true });
    }
  }, [ctx.data, navigate]);

  if (ctx.isLoading || !ctx.data || ctx.data.hasTenant || ctx.data.isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <Wizard />;
}

const fmtMoney = (cents: number, currency = "ARS") =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    (cents || 0) / 100,
  );

function Wizard() {
  const navigate = useNavigate();
  const plansQ = usePlans();
  const create = useCreateMyTenant();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [locality, setLocality] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);

  const computedSlug = useMemo(() => (slugTouched ? slug : slugify(name)), [name, slug, slugTouched]);
  const slugCheck = useCheckSlug(computedSlug);

  const activePlans = (plansQ.data?.plans ?? []).filter((p: any) => p.is_active);
  const selectedPlan = activePlans.find((p: any) => p.id === planId) ?? null;

  const step1Valid =
    name.trim().length >= 2 &&
    /^[a-z0-9-]{2,60}$/.test(computedSlug) &&
    slugCheck.data?.available === true;
  const step2Valid = !!planId || activePlans.length === 0;

  const onSubmit = () => {
    create.mutate(
      { name: name.trim(), slug: computedSlug, planId, locality: locality.trim() || undefined },
      {
        onSuccess: (res) => {
          if (res && (res as any).ok === false) {
            toast.error("No se pudo crear", { description: (res as any).error });
            return;
          }
          toast.success("Cooperativa creada");
          navigate({ to: "/admin", replace: true });
        },
        onError: (e: Error) => toast.error("No se pudo crear", { description: e.message }),
      },
    );
  };

  return (
    <div className="min-h-screen bg-secondary/40 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Crear tu cooperativa</h1>
          <p className="text-sm text-muted-foreground">
            Configurá tu espacio de trabajo. Comenzás con 14 días de prueba gratis.
          </p>
        </header>

        <Stepper step={step} />

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Datos de la cooperativa</CardTitle>
              <CardDescription>Estos datos identifican a tu organización en la plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Cooperativa de Servicios..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Identificador (URL)</Label>
                <Input
                  id="slug"
                  placeholder="mi-cooperativa"
                  value={computedSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase());
                  }}
                  maxLength={60}
                />
                <SlugFeedback slug={computedSlug} q={slugCheck} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locality">Localidad (opcional)</Label>
                <Input
                  id="locality"
                  placeholder="Ciudad, Provincia"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  maxLength={160}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Elegí un plan</CardTitle>
              <CardDescription>
                Todos los planes incluyen 14 días de prueba. Podés cambiarlo cuando se active el cobro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plansQ.isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : activePlans.length === 0 ? (
                <Alert>
                  <AlertTitle>Sin planes disponibles</AlertTitle>
                  <AlertDescription>
                    El administrador aún no configuró planes. Podés continuar y se asignará luego.
                  </AlertDescription>
                </Alert>
              ) : (
                activePlans.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      planId === p.id ? "border-primary bg-primary/5" : "hover:bg-secondary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        {p.description && (
                          <div className="text-sm text-muted-foreground">{p.description}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {fmtMoney(p.price_cents, p.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">por mes</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Confirmá los datos</CardTitle>
              <CardDescription>Revisá antes de crear tu cooperativa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Nombre" value={name} />
              <Row label="Identificador" value={computedSlug} />
              {locality && <Row label="Localidad" value={locality} />}
              <Row
                label="Plan"
                value={
                  selectedPlan
                    ? `${selectedPlan.name} — ${fmtMoney(selectedPlan.price_cents, selectedPlan.currency)}/mes`
                    : "Sin plan asignado"
                }
              />
              <Row label="Período de prueba" value="14 días" />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3)))}
            disabled={step === 1 || create.isPending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => ((s + 1) as 1 | 2 | 3))}
              disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
            >
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onSubmit} disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear cooperativa
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { n: 1, label: "Datos" },
    { n: 2, label: "Plan" },
    { n: 3, label: "Confirmar" },
  ];
  return (
    <div className="flex items-center justify-center gap-2">
      {items.map((it, i) => (
        <div key={it.n} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium ${
              step >= it.n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30 text-muted-foreground"
            }`}
          >
            {step > it.n ? <Check className="h-3.5 w-3.5" /> : it.n}
          </div>
          <span
            className={`text-sm ${step >= it.n ? "font-medium" : "text-muted-foreground"}`}
          >
            {it.label}
          </span>
          {i < items.length - 1 && <span className="mx-1 h-px w-8 bg-border" />}
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SlugFeedback({ slug, q }: { slug: string; q: ReturnType<typeof useCheckSlug> }) {
  if (!slug) return <p className="text-xs text-muted-foreground">Se genera desde el nombre.</p>;
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) {
    return <p className="text-xs text-destructive">Solo minúsculas, números y guiones (2-60).</p>;
  }
  if (q.isLoading) return <p className="text-xs text-muted-foreground">Verificando disponibilidad…</p>;
  if (q.data?.available === false)
    return <p className="text-xs text-destructive">Ya está en uso, probá otro.</p>;
  if (q.data?.available === true)
    return (
      <p className="text-xs text-emerald-600 dark:text-emerald-400">
        Disponible <Badge variant="outline" className="ml-1">/{slug}</Badge>
      </p>
    );
  return null;
}
