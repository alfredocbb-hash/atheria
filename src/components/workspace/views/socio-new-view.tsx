import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateMember, useUpdateMember } from "@/hooks/use-padron";
import { useWorkspace } from "../workspace-context";
import type { ViewComponentProps } from "../dynamic-views";

const Schema = z.object({
  member_number: z.string().min(1, "Requerido").max(40),
  full_name: z.string().min(1, "Requerido").max(160),
  document_id: z.string().max(40).optional(),
  email: z.union([z.literal(""), z.string().email("Email inválido")]).optional(),
  phone: z.string().max(40).optional(),
  status: z.enum(["active", "inactive", "suspended"]),
  notes: z.string().max(2000).optional(),
});

export function SocioNewView({ tabId, payload }: ViewComponentProps) {
  const ws = useWorkspace();
  const editing = payload?.member as
    | { id: string; member_number: string; full_name: string; document_id?: string | null; email?: string | null; phone?: string | null; status: "active" | "inactive" | "suspended"; notes?: string | null }
    | undefined;
  const create = useCreateMember();
  const update = useUpdateMember();
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: editing
      ? {
          member_number: editing.member_number,
          full_name: editing.full_name,
          document_id: editing.document_id ?? "",
          email: editing.email ?? "",
          phone: editing.phone ?? "",
          status: editing.status,
          notes: editing.notes ?? "",
        }
      : { member_number: "", full_name: "", document_id: "", email: "", phone: "", status: "active", notes: "" },
  });
  const pending = editing ? update.isPending : create.isPending;
  const onSubmit = form.handleSubmit((vals) => {
    if (editing) {
      const { member_number: _ignored, ...patch } = vals;
      update.mutate({ id: editing.id, patch }, { onSuccess: () => ws.closeTab(tabId) });
    } else {
      create.mutate(vals, { onSuccess: () => ws.closeTab(tabId) });
    }
  });
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Padrones · Clientes</p>
        <h1 className="text-2xl font-semibold tracking-tight">{editing ? `Editar cliente · ${editing.full_name}` : "Nuevo cliente"}</h1>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Datos del cliente</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-3 max-w-2xl">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="member_number" render={({ field }) => (
                  <FormItem><FormLabel>N° cliente</FormLabel><FormControl><Input {...field} disabled={!!editing} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="document_id" render={({ field }) => (
                  <FormItem><FormLabel>Documento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem><FormLabel>Nombre completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                      <SelectItem value="suspended">Suspendido</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Guardar cambios" : "Crear cliente"}
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
