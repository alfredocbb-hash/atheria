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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateMeter, useMeters } from "@/hooks/use-padron";
import type { ViewComponentProps } from "../dynamic-views";

const Schema = z.object({
  supply_id: z.string().uuid(),
  serial_number: z.string().min(1).max(60),
  brand: z.string().max(60).optional(),
  model: z.string().max(60).optional(),
  installed_at: z.string().optional(),
  status: z.enum(["active", "removed", "faulty"]),
});

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
    create.mutate(vals, { onSuccess: () => form.reset({ ...form.getValues(), serial_number: "", brand: "", model: "", installed_at: "" }) });
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
              <TableHeader><TableRow><TableHead>Serie</TableHead><TableHead>Marca</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="py-6 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /></TableCell></TableRow>
                ) : (data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">Sin medidores.</TableCell></TableRow>
                ) : (data ?? []).map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.serial_number}</TableCell>
                    <TableCell className="text-xs">{m.brand ?? "—"}</TableCell>
                    <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge></TableCell>
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
                <FormItem><FormLabel>N° de serie</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="brand" render={({ field }) => (
                  <FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="installed_at" render={({ field }) => (
                <FormItem><FormLabel>Instalado</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
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
