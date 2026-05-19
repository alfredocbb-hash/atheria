import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { companyInfoSchema, type CompanyInfoValues } from "@/lib/settings-schemas";
import type { TenantSettingsRow } from "@/hooks/use-tenant-settings";

type Props = {
  initial: TenantSettingsRow | null | undefined;
  isLoading?: boolean;
  isSaving?: boolean;
  onSubmit: (values: CompanyInfoValues) => void;
};

const empty: CompanyInfoValues = {
  legal_name: null,
  cuit: null,
  trade_name: null,
  legal_address: null,
  fiscal_address: null,
  email: null,
  phone_main: null,
  phone_mobile: null,
  whatsapp: null,
  website: null,
  email_services: null,
  email_inquiries: null,
  email_collections: null,
  iibb: null,
};

export function CompanyInfoForm({ initial, isLoading, isSaving, onSubmit }: Props) {
  const form = useForm<CompanyInfoValues>({
    resolver: zodResolver(companyInfoSchema) as unknown as Resolver<CompanyInfoValues>,
    defaultValues: empty,
  });

  useEffect(() => {
    if (initial) {
      form.reset({
        legal_name: initial.legal_name,
        cuit: initial.cuit,
        trade_name: initial.trade_name,
        legal_address: initial.legal_address,
        fiscal_address: initial.fiscal_address,
        email: initial.email,
        phone_main: initial.phone_main,
        phone_mobile: initial.phone_mobile,
        whatsapp: initial.whatsapp,
        website: initial.website,
        email_services: initial.email_services,
        email_inquiries: initial.email_inquiries,
        email_collections: initial.email_collections,
        iibb: initial.iibb,
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
          <CardTitle>Identificación</CardTitle>
          <CardDescription>Datos legales y fiscales de la empresa.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Razón social" error={errs.legal_name?.message}>
            <Input {...form.register("legal_name")} />
          </Field>
          <Field label="Nombre de fantasía" error={errs.trade_name?.message}>
            <Input {...form.register("trade_name")} />
          </Field>
          <Field label="CUIT" error={errs.cuit?.message}>
            <Input placeholder="30-12345678-9" {...form.register("cuit")} />
          </Field>
          <Field label="IIBB" error={errs.iibb?.message}>
            <Input {...form.register("iibb")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domicilios</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Domicilio legal" error={errs.legal_address?.message}>
            <Textarea rows={2} {...form.register("legal_address")} />
          </Field>
          <Field label="Domicilio fiscal" error={errs.fiscal_address?.message}>
            <Textarea rows={2} {...form.register("fiscal_address")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Mail principal" error={errs.email?.message}>
            <Input type="email" {...form.register("email")} />
          </Field>
          <Field label="Página web" error={errs.website?.message}>
            <Input placeholder="https://..." {...form.register("website")} />
          </Field>
          <Field label="Teléfono principal" error={errs.phone_main?.message}>
            <Input {...form.register("phone_main")} />
          </Field>
          <Field label="Teléfono móvil" error={errs.phone_mobile?.message}>
            <Input {...form.register("phone_mobile")} />
          </Field>
          <Field label="WhatsApp" error={errs.whatsapp?.message}>
            <Input {...form.register("whatsapp")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mails operativos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Mail de servicios" error={errs.email_services?.message}>
            <Input type="email" {...form.register("email_services")} />
          </Field>
          <Field label="Mail de consulta" error={errs.email_inquiries?.message}>
            <Input type="email" {...form.register("email_inquiries")} />
          </Field>
          <Field label="Mail de cobros" error={errs.email_collections?.message}>
            <Input type="email" {...form.register("email_collections")} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar datos de la empresa
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