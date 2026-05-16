import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Droplets, Flame, Gauge, Loader2, Plus, Search, Zap } from "lucide-react";
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCreateMeter, useCreateSupply, useMembers, useMeters, useSupplies, useUpdateSupplyStatus,
} from "@/hooks/use-padron";

export const Route = createFileRoute("/_authenticated/admin/suministros")({
  head: () => ({ meta: [{ title: "Suministros — Coopecur 2.0" }] }),
  component: SuministrosPage,
});

const ServiceIcon = ({ t }: { t: string }) =>
  t === "water" ? <Droplets className="h-3.5 w-3.5" /> :
  t === "gas" ? <Flame className="h-3.5 w-3.5" /> :
  <Zap className="h-3.5 w-3.5" />;

const SupplySchema = z.object({
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

const MeterSchema = z.object({
  supply_id: z.string().uuid(),
  serial_number: z.string().min(1).max(60),
  brand: z.string().max(60).optional(),
  model: z.string().max(60).optional(),
  installed_at: z.string().optional(),
  status: z.enum(["active", "removed", "faulty"]),
});

function SuministrosPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [svcFilter, setSvcFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [meterSupplyId, setMeterSupplyId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAdminOrOperator) navigate({ to: "/cliente", replace: true });
  }, [auth, navigate]);

  const filters = {
    search: debounced || undefined,
    service_type: svcFilter !== "all" ? svcFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  };
  const { data, isLoading } = useSupplies(filters);
  const members = useMembers("");
  const create = useCreateSupply();
  const updateStatus = useUpdateSupplyStatus();

  const form = useForm<z.infer<typeof SupplySchema>>({
    resolver: zodResolver(SupplySchema),
    defaultValues: {
      supply_number: "", member_id: "", service_type: "water", status: "pending",
      tariff_category: "", activated_at: "",
      address: { street: "", street_number: "", floor: "", apartment: "", city: "", province: "", postal_code: "", notes: "" },
    },
  });

  const onSubmit = form.handleSubmit((vals) => {
    create.mutate(vals, { onSuccess: () => { setOpen(false); form.reset(); } });
  });

  if (auth.isLoading || !auth.isAdminOrOperator) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Padrones</p>
            <h1 className="text-2xl font-semibold tracking-tight">Suministros</h1>
            <p className="text-sm text-muted-foreground">Cuentas de servicio (agua, gas, electricidad) por socio.</p>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nuevo suministro</Button></SheetTrigger>
            <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
              <SheetHeader><SheetTitle>Nuevo suministro</SheetTitle></SheetHeader>
              <Form {...form}>
                <form onSubmit={onSubmit} className="mt-4 space-y-3">
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

                  <SheetFooter className="mt-4">
                    <Button type="submit" disabled={create.isPending}>
                      {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear suministro
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Gauge className="h-4 w-4" />Listado</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por n° suministro o tarifa…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={svcFilter} onValueChange={setSvcFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Servicio" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los servicios</SelectItem>
                  <SelectItem value="water">Agua</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="electricity">Electricidad</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                  <SelectItem value="inactive">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Socio</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Tarifa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="py-10 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /></TableCell></TableRow>
                  ) : (data ?? []).length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Sin suministros.</TableCell></TableRow>
                  ) : (
                    (data ?? []).map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.supply_number}</TableCell>
                        <TableCell><Badge variant="outline" className="gap-1"><ServiceIcon t={s.service_type} />{s.service_type}</Badge></TableCell>
                        <TableCell className="text-sm">{s.member?.full_name ?? "—"}<div className="text-xs text-muted-foreground">{s.member?.member_number}</div></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.address ? `${s.address.street} ${s.address.street_number ?? ""}, ${s.address.city}` : "—"}</TableCell>
                        <TableCell className="text-xs">{s.tariff_category ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === "active" ? "default" : s.status === "suspended" ? "destructive" : "secondary"}>{s.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">···</Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                              {["active", "suspended", "inactive", "pending"].filter((v) => v !== s.status).map((v) => (
                                <DropdownMenuItem key={v} onClick={() => updateStatus.mutate({ id: s.id, status: v })}>→ {v}</DropdownMenuItem>
                              ))}
                              <DropdownMenuItem onClick={() => setMeterSupplyId(s.id)}>Gestionar medidores</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <MetersSheet supplyId={meterSupplyId} onClose={() => setMeterSupplyId(null)} />
      </div>
    
  );
}

function MetersSheet({ supplyId, onClose }: { supplyId: string | null; onClose: () => void }) {
  const { data, isLoading } = useMeters(supplyId);
  const create = useCreateMeter();
  const form = useForm<z.infer<typeof MeterSchema>>({
    resolver: zodResolver(MeterSchema),
    defaultValues: { supply_id: "", serial_number: "", brand: "", model: "", installed_at: "", status: "active" },
  });

  useEffect(() => {
    if (supplyId) form.reset({ supply_id: supplyId, serial_number: "", brand: "", model: "", installed_at: "", status: "active" });
  }, [supplyId, form]);

  const onSubmit = form.handleSubmit((vals) => {
    create.mutate(vals, { onSuccess: () => form.reset({ ...form.getValues(), serial_number: "", brand: "", model: "", installed_at: "" }) });
  });

  return (
    <Sheet open={!!supplyId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Medidores</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
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

          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-3 rounded-md border p-3">
              <p className="text-sm font-medium">Nuevo medidor</p>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}