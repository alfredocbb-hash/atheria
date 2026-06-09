import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useCreateMeter, useMeters } from "@/hooks/use-padron";
import type { ViewComponentProps } from "../dynamic-views";

const today = new Date().toISOString().slice(0, 10);
const trim = (s: string) => s.trim();

const Schema = z.object({
  supply_id: z.string().uuid(),
  serial_number: z
    .string()
    .min(1, "Requerido")
    .max(60)
    .transform(trim)
    .refine((v) => v.length > 0, "No puede contener solo espacios"),
  brand: z.string().max(60).transform(trim).optional(),
  model: z.string().max(60).transform(trim).optional(),
  installed_at: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "Fecha inválida"
    )
    .refine(
      (v) => !v || v <= today,
      "La fecha de instalación no puede ser futura"
    ),
  status: z.enum(["active", "removed", "faulty"]),
});

const STATUS_LABEL: Record<string, string> = {
  active: "Activo", removed: "Retirado", faulty: "Con falla",
};

export function SuministroMetersView({ payload }: ViewComponentProps) {
  const supplyId: string = payload?.supplyId;
  const supplyNumber: string | undefined = payload?.supplyNumber;
  const { data, isLoading } = useMeters(supplyId);
  const create = useCreateMeter();
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { supply_id: supplyId, serial_number: "", brand: "", model: "", installed_at: "", status: "active" },
  });
  useEffect(() => {
    form.reset({ supply_id: supplyId, serial_number: "", brand: "", model: "", installed_at: "", status: "active" });
  }, [supplyId]);
  const onSubmit = form.handleSubmit((vals) => {
    create.mutate(vals, {
      onSuccess: () => form.reset({ ...form.getValues(), serial_number: "", brand: "", model: "", installed_at: "" }),
    });
  });
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Servicios</p>
        <h1 className="text-2xl font-semibold tracking-tight">Medidores {supplyNumber ? `· ${supplyNumber}` : ""}</h1>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Listado</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° de serie</TableHead>
                  <TableHead>Marca / Modelo</TableHead>
                  <TableHead>Instalado</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="py-6 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /></TableCell></TableRow>
                ) : (data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">Sin medidores.</TableCell></TableRow>
                ) : (data ?? []).map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.serial_number}</TableCell>
                    <TableCell className="text-xs">{[m.brand, m.model].filter(Boolean).join(" / ") || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.installed_at ? new Date(m.installed_at).toLocaleDateString("es-AR") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === "active" ? "default" : m.status === "faulty" ? "destructive" : "secondary"}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Nuevo medidor</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
              <FormField control={form.control} name="serial_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>N° de serie <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input {...field} placeholder="SN-00001" /></FormControl>
                  <FormDescription className="text-[11px]">Sin espacios al inicio o al final</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="brand" render={({ field }) => (
                  <FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} placeholder="Elster" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} placeholder="V100" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="installed_at" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de instalación</FormLabel>
                  <FormControl><Input type="date" max={today} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" size="sm" disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Agregar medidor
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
