import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SystemParamsForm } from "@/components/settings/SystemParamsForm";
import { CompanyInfoForm } from "@/components/settings/CompanyInfoForm";
import { PlatformSettingsForm } from "@/components/settings/PlatformSettingsForm";
import { useAppSettings, useUpdateAppSettings, useTenantsLite } from "@/hooks/use-app-settings";
import { useTenantSettings, useUpdateTenantSettings } from "@/hooks/use-tenant-settings";

export const Route = createFileRoute("/_authenticated/super/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — Plataforma" }] }),
  component: SuperConfigPage,
});

function SuperConfigPage() {
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Ajustes globales de la plataforma y configuración por cooperativa.
        </p>
      </header>
      <Tabs defaultValue="platform">
        <TabsList>
          <TabsTrigger value="platform">Plataforma</TabsTrigger>
          <TabsTrigger value="tenant">Por cooperativa</TabsTrigger>
        </TabsList>
        <TabsContent value="platform" className="mt-4">
          <PlatformPanel />
        </TabsContent>
        <TabsContent value="tenant" className="mt-4">
          <TenantPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlatformPanel() {
  const { data, isLoading } = useAppSettings();
  const update = useUpdateAppSettings();
  return (
    <PlatformSettingsForm
      initial={data}
      isLoading={isLoading}
      isSaving={update.isPending}
      onSubmit={(values) => update.mutate(values)}
    />
  );
}

function TenantPanel() {
  const tenants = useTenantsLite();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const { data, isLoading } = useTenantSettings(tenantId);
  const update = useUpdateTenantSettings(tenantId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cooperativa</CardTitle>
          <CardDescription>Seleccioná un tenant para editar su configuración.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={tenantId ?? undefined} onValueChange={setTenantId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Elegir cooperativa..." />
            </SelectTrigger>
            <SelectContent>
              {(tenants.data ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {tenantId && (
        <Tabs defaultValue="system">
          <TabsList>
            <TabsTrigger value="system">Parámetros del sistema</TabsTrigger>
            <TabsTrigger value="company">Datos de la empresa</TabsTrigger>
          </TabsList>
          <TabsContent value="system" className="mt-4">
            <SystemParamsForm
              initial={data}
              isLoading={isLoading}
              isSaving={update.isPending}
              onSubmit={(values) => update.mutate(values)}
            />
          </TabsContent>
          <TabsContent value="company" className="mt-4">
            <CompanyInfoForm
              initial={data}
              isLoading={isLoading}
              isSaving={update.isPending}
              onSubmit={(values) => update.mutate(values)}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}