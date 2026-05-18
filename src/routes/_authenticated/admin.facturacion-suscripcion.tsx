import { createFileRoute } from "@tanstack/react-router";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useCancelSubscription,
  useCreateCheckout,
  useCurrentSubscription,
  usePlans,
} from "@/hooks/use-subscription";

export const Route = createFileRoute("/_authenticated/admin/facturacion-suscripcion")({
  head: () => ({ meta: [{ title: "Suscripción — Sistema de Gestión de Servicios" }] }),
  component: SubscriptionPage,
});

const STATUS_LABELS: Record<string, string> = {
  trial: "Período de prueba",
  active: "Activa",
  past_due: "Con pagos pendientes",
  suspended: "Suspendida",
  cancelled: "Cancelada",
};

function SubscriptionPage() {
  const subQ = useCurrentSubscription();
  const plansQ = usePlans();
  const checkout = useCreateCheckout();
  const cancel = useCancelSubscription();

  if (subQ.isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (subQ.error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudo cargar la suscripción</AlertTitle>
          <AlertDescription>{(subQ.error as Error).message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const sub = subQ.data!;
  const t = sub.tenant;
  const providerConfigured = sub.providerConfigured;

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Plan y suscripción</h1>
        <p className="text-sm text-muted-foreground">
          Gestioná la suscripción de {t.name} a Sistema de Gestión de Servicios.
        </p>
      </header>

      {!providerConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pagos pendientes de activación</AlertTitle>
          <AlertDescription>
            La pasarela de pagos ({sub.providerId}) aún no está configurada en esta instalación.
            Podés ver tu plan y trial, pero todavía no podés iniciar el cobro.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Estado actual</span>
            <Badge variant={t.status === "active" ? "default" : "secondary"}>
              {STATUS_LABELS[t.status] ?? t.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium">{sub.plan?.name ?? "Sin plan asignado"}</span>
          </div>
          {t.status === "trial" && sub.trialDaysLeft !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Días restantes de prueba</span>
              <span className="font-medium">{sub.trialDaysLeft}</span>
            </div>
          )}
          {t.billing_subscription_id && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suscripción</span>
              <span className="font-mono text-xs">{t.billing_subscription_id}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planes disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {plansQ.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {(plansQ.data?.plans ?? []).map((p: any) => (
                <div key={p.id} className="rounded-lg border p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-semibold">{p.name}</h3>
                    {!p.is_active && <Badge variant="outline">Próximamente</Badge>}
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    {p.description ?? "Detalles a definir."}
                  </p>
                  <p className="mb-4 text-2xl font-bold">
                    {p.price_cents > 0
                      ? `$${(p.price_cents / 100).toLocaleString("es-AR")} ${p.currency}`
                      : "Por definir"}
                  </p>
                  <Button
                    className="w-full"
                    disabled={!providerConfigured || !p.is_active || checkout.isPending}
                    onClick={() => checkout.mutate(p.id)}
                    title={!providerConfigured ? "Pagos pendientes de activación" : undefined}
                  >
                    {checkout.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Suscribirme
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {t.billing_subscription_id && t.status !== "cancelled" && (
        <Card>
          <CardHeader>
            <CardTitle>Cancelar suscripción</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              {cancel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancelar suscripción
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}