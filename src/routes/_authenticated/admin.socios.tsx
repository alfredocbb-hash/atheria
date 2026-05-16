import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEnsureTab } from "@/components/workspace/workspace-context";
import { useEffect, useState } from "react";
import { Loader2, Plus, Search, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateMember, useMembers } from "@/hooks/use-padron";

export const Route = createFileRoute("/_authenticated/admin/socios")({
  head: () => ({ meta: [{ title: "Socios — Coopecur 2.0" }] }),
  component: SociosPageTrigger,
});

const Schema = z.object({
  member_number: z.string().min(1, "Requerido").max(40),
  full_name: z.string().min(1, "Requerido").max(160),
  document_id: z.string().max(40).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(40).optional(),
  status: z.enum(["active", "inactive", "suspended"]),
  notes: z.string().max(2000).optional(),
});

export function SociosPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAdminOrOperator) navigate({ to: "/cliente", replace: true });
  }, [auth, navigate]);

  const { data, isLoading } = useMembers(debounced);
  const create = useCreateMember();

  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { member_number: "", full_name: "", document_id: "", email: "", phone: "", status: "active", notes: "" },
  });

  const onSubmit = form.handleSubmit((vals) => {
    create.mutate(vals, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  });

  if (auth.isLoading || !auth.isAdminOrOperator) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Padrones</p>
            <h1 className="text-2xl font-semibold tracking-tight">Socios</h1>
            <p className="text-sm text-muted-foreground">Padrón de asociados de la cooperativa.</p>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nuevo socio</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
              <SheetHeader><SheetTitle>Nuevo socio</SheetTitle></SheetHeader>
              <Form {...form}>
                <form onSubmit={onSubmit} className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="member_number" render={({ field }) => (
                      <FormItem><FormLabel>N° socio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                  <SheetFooter className="mt-4">
                    <Button type="submit" disabled={create.isPending}>
                      {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear socio
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Padrón</CardTitle>
            <div className="relative mt-2 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, n° socio, documento, email…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° socio</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /></TableCell></TableRow>
                  ) : (data ?? []).length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Sin socios cargados.</TableCell></TableRow>
                  ) : (
                    (data ?? []).map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs">{m.member_number}</TableCell>
                        <TableCell className="font-medium">{m.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{m.document_id ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {m.email ?? "—"}{m.phone ? <><br />{m.phone}</> : null}
                        </TableCell>
                        <TableCell>{m.user_id ? <Badge variant="outline">Vinculada</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          <Badge variant={m.status === "active" ? "default" : m.status === "suspended" ? "destructive" : "secondary"}>{m.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
}

function SociosPageTrigger() {
  useEnsureTab("socios");
  return null;
}
