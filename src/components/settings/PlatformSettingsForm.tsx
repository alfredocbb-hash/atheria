import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { platformSettingsSchema, type PlatformSettingsValues } from "@/lib/settings-schemas";
import type { AppSettingsRow } from "@/hooks/use-app-settings";

type Props = {
  initial: AppSettingsRow | null | undefined;
  isLoading?: boolean;
  isSaving?: boolean;
  onSubmit: (values: PlatformSettingsValues) => void;
};

const empty: PlatformSettingsValues = {
  platform_name: null,
  support_email: null,
  support_phone: null,
  support_whatsapp: null,
  default_billing_day: null,
  default_first_due_day: null,
  default_second_due_day: null,
  default_interest_after_first: null,
  default_interest_after_second: null,
  terms_url: null,
  privacy_url: null,
};

export function PlatformSettingsForm({ initial, isLoading, isSaving, onSubmit }: Props) {
  const form = useForm<PlatformSettingsValues>({
    resolver: zodResolver(platformSettingsSchema) as unknown as Resolver<PlatformSettingsValues>,
    defaultValues: empty,
  });

  useEffect(() => {
    if (initial) {
      form.reset({
        platform_name: initial.platform_name,
        support_email: initial.support_email,
        support_phone: initial.support_phone,
        support_whatsapp: initial.support_whatsapp,
        default_billing_day: initial.default_billing_day,
        default_first_due_day: initial.default_first_due_day,
        default_second_due_day: initial.default_second_due_day,
        default_interest_after_first: initial.default_interest_after_first,
        default_interest_after_second: initial.default_interest_after_second,
        terms_url: initial.terms_url,
        privacy_url: initial.privacy_url,
      });
    }
  }, [initial, form]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const errs = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plataforma</CardTitle>
          <CardDescription>Marca y enlaces legales del SaaS.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre de la plataforma" error={errs.platform_name?.message}>
            <Input {...form.register("platform_name")} />
          </Field>
          <Field label="URL Términos y condiciones" error={errs.terms_url?.message}>
            <Input placeholder="https://..." {...form.register("terms_url")} />
          </Field>
          <Field label="URL Política de privacidad" error={errs.privacy_url?.message}>
            <Input placeholder="https://..." {...form.register("privacy_url")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Soporte</CardTitle>
          <CardDescription>Datos de contacto que verán los tenants.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Email de soporte" error={errs.support_email?.message}>
            <Input type="email" {...form.register("support_email")} />
          </Field>
          <Field label="Teléfono" error={errs.support_phone?.message}>
            <Input {...form.register("support_phone")} />
          </Field>
          <Field label="WhatsApp" error={errs.support_whatsapp?.message}>
            <Input {...form.register("support_whatsapp")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valores por defecto para nuevas cooperativas</CardTitle>
          <CardDescription>Se sugieren al onboarding pero pueden ajustarse por tenant.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Día de facturación" error={errs.default_billing_day?.message}>
            <Input type="number" min={1} max={31} {...form.register("default_billing_day")} />
          </Field>
          <Field label="1er vencimiento" error={errs.default_first_due_day?.message}>
            <Input type="number" min={1} max={31} {...form.register("default_first_due_day")} />
          </Field>
          <Field label="2do vencimiento" error={errs.default_second_due_day?.message}>
            <Input type="number" min={1} max={31} {...form.register("default_second_due_day")} />
          </Field>
          <Field label="% diario tras 1er venc." error={errs.default_interest_after_first?.message}>
            <Input type="number" step="0.0001" min={0} {...form.register("default_interest_after_first")} />
          </Field>
          <Field label="% diario tras 2do venc." error={errs.default_interest_after_second?.message}>
            <Input type="number" step="0.0001" min={0} {...form.register("default_interest_after_second")} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar configuración
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}