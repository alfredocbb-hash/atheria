import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateSupply, useMembers } from "@/hooks/use-padron";
import { useWorkspace } from "../workspace-context";
import type { ViewComponentProps } from "../dynamic-views";

const Schema = z.object({
  supply_number: z.string().min(1).max(40),
  member_id: z.string().uuid("Seleccioná un socio"),
  service_type: z.enum(["water", "gas", "electricity"]),
  status: z.enum(["active", "suspended", "inactive", "pending"]),
  tariff_category: z.string().max(60).optional(),
  activated_at: z.string().optional(),
  address: z.object({
    street: z.string().min(1, "Requerido").max(160),
    street_number: z.string().max(20).optional(),
    floor: z.string().max(10).optional(),
    apartment: z.string().max(10).optional(),
    city: z.string().min(1, "Requerido").max(120),
    province: z.string().min(1, "Requerido").max(120),
    postal_code: z.string().max(20).optional(),
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
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Padrones · Suministros</p>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo suministro</h1>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Alta de suministro</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-3 max-w-3xl">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="supply_number" render={({ field }) => (
                  <FormItem><FormLabel>N° suministro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="service_type" render={({ field }) => (
                  <FormItem><FormLabel>Servicio</FormLabel>
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
                <FormItem><FormLabel>Socio titular</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar socio…" /></SelectTrigger></FormControl>
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
                  <FormItem><FormLabel>Categoría tarifaria</FormLabel><FormControl><Input placeholder="R1 / R2 / Comercial…" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="activated_at" render={({ field }) => (
                <FormItem><FormLabel>Fecha de activación</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="rounded-md border p-3 space-y-3">
                <p className="text-sm font-medium">Dirección del suministro</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <FormField control={form.control} name="address.street" render={({ field }) => (
                      <FormItem><FormLabel>Calle</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="address.street_number" render={({ field }) => (
                    <FormItem><FormLabel>N°</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="address.floor" render={({ field }) => (
                    <FormItem><FormLabel>Piso</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address.apartment" render={({ field }) => (
                    <FormItem><FormLabel>Depto.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="address.city" render={({ field }) => (
                    <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address.province" render={({ field }) => (
                    <FormItem><FormLabel>Provincia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="address.postal_code" render={({ field }) => (
                  <FormItem><FormLabel>Código postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear suministro
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
