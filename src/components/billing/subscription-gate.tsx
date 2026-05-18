import { Link } from "@tanstack/react-router";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCurrentSubscription } from "@/hooks/use-subscription";

/**
 * Renders a top-of-page banner reflecting subscription state:
 * - Trial: countdown.
 * - past_due / suspended / cancelled: hard block with CTA to subscribe.
 * Returns null when the tenant is healthy (status='active') or there is no tenant context.
 */
export function SubscriptionGate() {
  const { data, error } = useCurrentSubscription();
  if (error || !data) return null;
  const status = data.tenant.status;

  if (status === "active") return null;

  if (status === "trial") {
    const days = data.trialDaysLeft ?? 0;
    return (
      <Alert className="rounded-none border-x-0 border-t-0">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Período de prueba</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-2">
          <span>
            Te quedan <strong>{days}</strong> {days === 1 ? "día" : "días"} de prueba.
          </span>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/facturacion-suscripcion">
              <CreditCard className="mr-2 h-3.5 w-3.5" />
              Activar plan
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // past_due, suspended, cancelled → block
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-6">
      <div className="max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-destructive" />
        <h2 className="text-lg font-semibold">Acceso suspendido</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {status === "past_due"
            ? "Tu suscripción tiene pagos pendientes."
            : status === "cancelled"
              ? "Tu suscripción fue cancelada."
              : "Tu acceso fue suspendido. Activá un plan para continuar."}
        </p>
        <Button asChild className="mt-4">
          <Link to="/admin/facturacion-suscripcion">
            <CreditCard className="mr-2 h-4 w-4" />
            Suscribirme
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * Wraps children and renders the hard-block screen when the tenant is suspended/cancelled.
 * Use at layout level after auth resolves.
 */
export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { data } = useCurrentSubscription();
  const status = data?.tenant?.status;
  if (status === "past_due" || status === "suspended" || status === "cancelled") {
    return <SubscriptionGate />;
  }
  return <>{children}</>;
}