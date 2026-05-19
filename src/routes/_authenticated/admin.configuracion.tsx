import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemParamsForm } from "@/components/settings/SystemParamsForm";
import { CompanyInfoForm } from "@/components/settings/CompanyInfoForm";
import {
  useTenantSettings,
  useUpdateTenantSettings,
} from "@/hooks/use-tenant-settings";
import { useEnsureTab } from "@/components/workspace/workspace-context";

export const Route = createFileRoute("/_authenticated/admin/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — Coopecur 2.0" }] }),
  component: ConfiguracionPageTrigger,
});

export function ConfiguracionPage() {
  const { data, isLoading } = useTenantSettings();
  const update = useUpdateTenantSettings();

  return (
    <div className="space-y-4 p-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Parámetros del sistema y datos de la empresa.
        </p>
      </header>
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
    </div>
  );
}

function ConfiguracionPageTrigger() {
  useEnsureTab("configuracion");
  return null;
}