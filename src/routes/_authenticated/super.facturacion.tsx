import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CreditCard, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTenantsList,
  useTenantBillingConfig,
  useUpsertTenantBillingConfig,
} from "@/hooks/use-super-admin";

export const Route = createFileRoute("/_authenticated/super/facturacion")({
  head: () => ({ meta: [{ title: "Facturación por tenant" }] }),
  component: SuperBillingPage,
});

function SuperBillingPage() {
  const tenantsQ = useTenantsList();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const cfgQ = useTenantBillingConfig(tenantId);
  const upsert = useUpsertTenantBillingConfig();

  const [accessToken, setAccessToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [preapproval, setPreapproval] = useState("");

  useEffect(() => {
    setAccessToken("");
    setWebhookSecret("");
    setPreapproval(cfgQ.data?.preapprovalPlanId ?? "");
  }, [tenantId, cfgQ.data?.preapprovalPlanId]);

  const tenants = tenantsQ.data?.tenants ?? [];
  const selected = tenants.find((t: any) => t.id === tenantId);

  const onSave = () => {
    if (!tenantId) return;
    upsert.mutate({
      tenantId,
      accessToken: accessToken || undefined,
      webhookSecret: webhookSecret || undefined,
      preapprovalPlanId: preapproval || null,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Plataforma
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Facturación por tenant</h1>
        <p className="text-sm text-muted-foreground">
          Cargá las credenciales de Mercado Pago de cada cooperativa. Los pagos están deshabilitados
          a nivel plataforma — estos datos se usarán cuando se active la integración.
        </p>
      </header>

      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Pagos no activados</AlertTitle>
        <AlertDescription>
          Las credenciales se guardan cifradas en la base. El checkout real se habilitará en una
          próxima fase.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seleccioná un tenant</CardTitle>
          <CardDescription>Buscá la cooperativa a configurar.</CardDescription>
        </CardHeader>
        <CardContent>
          {tenantsQ.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Select value={tenantId ?? undefined} onValueChange={(v) => setTenantId(v)}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Elegir cooperativa…" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} <span className="ml-2 text-muted-foreground">/{t.slug}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {tenantId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credenciales de {selected?.name ?? "tenant"}
              </span>
              {cfgQ.data && (
                <Badge variant={cfgQ.data.hasAccessToken ? "default" : "secondary"}>
                  {cfgQ.data.hasAccessToken ? (
                    <>
                      <ShieldCheck className="mr-1 h-3 w-3" /> Configurado
                    </>
                  ) : (
                    "Sin configurar"
                  )}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Proveedor: Mercado Pago. Otros proveedores se habilitarán más adelante.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Access token</Label>
              <Input
                id="token"
                type="password"
                placeholder={
                  cfgQ.data?.hasAccessToken ? "•••• guardado — escribir reemplaza" : "APP_USR-…"
                }
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Por seguridad nunca se muestra el valor actual.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Webhook secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder={
                  cfgQ.data?.hasWebhookSecret
                    ? "•••• guardado — escribir reemplaza"
                    : "Secret del webhook"
                }
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prea">Preapproval plan ID (opcional)</Label>
              <Input
                id="prea"
                placeholder="ID del plan de Preapproval en MP"
                value={preapproval}
                onChange={(e) => setPreapproval(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={onSave} disabled={upsert.isPending}>
                {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar credenciales
              </Button>
              <Button variant="outline" disabled title="Disponible cuando se active la integración">
                Probar credenciales
              </Button>
            </div>

            {cfgQ.data?.updatedAt && (
              <p className="text-xs text-muted-foreground">
                Última actualización: {new Date(cfgQ.data.updatedAt).toLocaleString("es-AR")}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
