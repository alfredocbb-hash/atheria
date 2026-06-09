import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateSupply, useMembers } from "@/hooks/use-padron";
import { useWorkspace } from "../workspace-context";
import type { ViewComponentProps } from "../dynamic-views";

const trim = (s: string) => s.trim();
const today = new Date().toISOString().slice(0, 10);

const Schema = z.object({
  supply_number: z
    .string()
    .min(1, "Requerido")
    .max(40)
    .transform(trim)
    .refine((v) => v.length > 0, "No puede contener solo espacios"),
  member_id: z.string().uuid("Seleccioná un cliente"),
  service_type: z.enum(["water", "gas", "electricity"]),
  status: z.enum(["active", "suspended", "inactive", "pending"]),
  tariff_category: z
    .string()
    .max(60)
    .transform(trim)
    .optional(),
  activated_at: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "Fecha inválida"
    )
    .refine(
      (v) => !v || v <= today,
      "La fecha de activación no puede ser futura"
    ),
  address: z.object({
    street: z
      .string()
      .min(1, "Requerido")
      .max(160)
      .transform(trim)
      .refine((v) => v.length > 0, "No puede contener solo espacios"),
    street_number: z
      .string()
      .max(20)
      .transform(trim)
      .refine(
        (v) => v === "" || /^[a-zA-Z0-9\s\-]+$/.test(v),
        "Solo letras, números y guiones"
      )
      .optional(),
    floor: z.string().max(10).transform(trim).optional(),
    apartment: z.string().max(10).transform(trim).optional(),
    city: z
      .string()
      .min(1, "Requerido")
      .max(120)
      .transform(trim)
      .refine((v) => v.length > 0, "No puede contener solo espacios"),
    province: z
      .string()
      .min(1, "Requerido")
      .max(120)
      .transform(trim)
      .refine((v) => v.length > 0, "No puede contener solo espacios"),
    postal_code: z
      .string()
      .max(20)
      .transform(trim)
      .refine(
        (v) => v === "" || /^\d{4}$/.test(v),
        "Código postal argentino (4 dígitos)"
      )
      .optional(),
    notes: z.string().max(500).optional(),
  }),
});

export function SuministroNewView({ tabId }: ViewComponentProps) {
  const ws = useWorkspace();
  const create = useCreateSupply();
  const members = useMembers("");
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      supply_number: "", member_id: "", service_type: "water", status: "pending",
      tariff_category: "", activated_at: "",
      address: { street: "", street_number: "", floor: "", apartment: "", city: "", province: "", postal_code: "", notes: "" },
    },
  });
  const onSubmit = form.handleSubmit((vals) => {
    create.mutate(vals, { onSuccess: () => ws.closeTab(tabId) });
  });
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Padrones · Servicios</p>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo servicio</h1>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Alta de servicio</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-3 max-w-3xl">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="supply_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° servicio <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input {...field} placeholder="0001" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="service_type" render={({ field }) => (
                  <FormItem><FormLabel>Tipo de servicio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="water">Agua</SelectItem>
                        <SelectItem value="gas">Gas</SelectItem>
                        <SelectItem value="electricity">Electricidad</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="member_id" render={({ field }) => (
                <FormItem><FormLabel>Cliente titular <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar cliente…" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(members.data ?? []).map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>{m.member_number} — {m.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="suspended">Suspendido</SelectItem>
                        <SelectItem value="inactive">Dado de baja</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tariff_category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría tarifaria</FormLabel>
                    <FormControl><Input placeholder="R1 / R2 / Comercial…" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="activated_at" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de activación</FormLabel>
                  <FormControl><Input type="date" max={today} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Dirección */}
              <div className="rounded-md border p-3 space-y-3">
                <p className="text-sm font-medium">Dirección del servicio</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <FormField control={form.control} name="address.street" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calle <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} placeholder="Av. San Martín" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="address.street_number" render={({ field }) => (
                    <FormItem>
                      <FormLabel>N°</FormLabel>
                      <FormControl><Input {...field} placeholder="123" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="address.floor" render={({ field }) => (
                    <FormItem><FormLabel>Piso</FormLabel><FormControl><Input {...field} placeholder="1" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address.apartment" render={({ field }) => (
                    <FormItem><FormLabel>Depto.</FormLabel><FormControl><Input {...field} placeholder="A" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="address.city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address.province" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="address.postal_code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código postal</FormLabel>
                    <FormControl><Input {...field} placeholder="3000" inputMode="numeric" maxLength={4} /></FormControl>
                    <FormDescription className="text-[11px]">4 dígitos (ej: 3000)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear servicio
                </Button>
                <Button type="button" variant="outline" onClick={() => ws.closeTab(tabId)}>Cancelar</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
