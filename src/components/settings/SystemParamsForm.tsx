import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { systemParamsSchema, type SystemParamsValues } from "@/lib/settings-schemas";
import type { TenantSettingsRow } from "@/hooks/use-tenant-settings";

type Props = {
  initial: TenantSettingsRow | null | undefined;
  isLoading?: boolean;
  isSaving?: boolean;
  onSubmit: (values: SystemParamsValues) => void;
};

export function SystemParamsForm({ initial, isLoading, isSaving, onSubmit }: Props) {
  const form = useForm<SystemParamsValues>({
    resolver: zodResolver(systemParamsSchema) as unknown as Resolver<SystemParamsValues>,
    defaultValues: {
      billing_day: null,
      first_due_day: null,
      second_due_day: null,
      interest_rate_after_first: null,
      interest_rate_after_second: null,
      cesp_code: null,
    },
  });

  useEffect(() => {
    if (initial) {
      form.reset({
        billing_day: initial.billing_day,
        first_due_day: initial.first_due_day,
        second_due_day: initial.second_due_day,
        interest_rate_after_first: initial.interest_rate_after_first,
        interest_rate_after_second: initial.interest_rate_after_second,
        cesp_code: initial.cesp_code,
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
          <CardTitle>Fechas de facturación</CardTitle>
          <CardDescription>Día del mes para emisión y vencimientos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Día de facturación" error={errs.billing_day?.message}>
            <Input type="number" min={1} max={31} {...form.register("billing_day")} />
          </Field>
          <Field label="Primer vencimiento" error={errs.first_due_day?.message}>
            <Input type="number" min={1} max={31} {...form.register("first_due_day")} />
          </Field>
          <Field label="Segundo vencimiento" error={errs.second_due_day?.message}>
            <Input type="number" min={1} max={31} {...form.register("second_due_day")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intereses por mora</CardTitle>
          <CardDescription>% diario aplicado luego de cada vencimiento.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="% diario tras 1er vencimiento" error={errs.interest_rate_after_first?.message}>
            <Input type="number" step="0.0001" min={0} {...form.register("interest_rate_after_first")} />
          </Field>
          <Field label="% diario tras 2do vencimiento" error={errs.interest_rate_after_second?.message}>
            <Input type="number" step="0.0001" min={0} {...form.register("interest_rate_after_second")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Otros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Código CESP" error={errs.cesp_code?.message}>
            <Input {...form.register("cesp_code")} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar parámetros
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