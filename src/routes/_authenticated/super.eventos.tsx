import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubscriptionEvents, useTenantsList } from "@/hooks/use-super-admin";

export const Route = createFileRoute("/_authenticated/super/eventos")({
  component: EventsPage,
});

function EventsPage() {
  const [tenantId, setTenantId] = useState<string>("all");
  const [type, setType] = useState<string>("");
  const tenants = useTenantsList();
  const q = useSubscriptionEvents({
    tenantId: tenantId === "all" ? null : tenantId,
    type: type || null,
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Eventos de facturación</h1>
        <p className="text-sm text-muted-foreground">
          Webhooks recibidos de los proveedores de pago.
        </p>
      </header>

      <div className="flex gap-3">
        <div className="w-64">
          <Select value={tenantId} onValueChange={setTenantId}>
            <SelectTrigger><SelectValue placeholder="Tenant" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tenants</SelectItem>
              {(tenants.data?.tenants ?? []).map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Filtrar por type (ej: subscription.updated)"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Event id</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data?.events ?? []).map((e: any) => (
                  <>
                    <TableRow
                      key={e.id}
                      className="cursor-pointer"
                      onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                    >
                      <TableCell className="text-xs">
                        {new Date(e.created_at).toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell><Badge variant="outline">{e.provider}</Badge></TableCell>
                      <TableCell>{e.tenant_name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="font-mono text-xs">{e.type}</TableCell>
                      <TableCell className="font-mono text-xs">{e.provider_event_id}</TableCell>
                    </TableRow>
                    {expanded === e.id && (
                      <TableRow key={`${e.id}-p`}>
                        <TableCell colSpan={5} className="bg-muted/40">
                          <pre className="overflow-auto text-xs">
                            {JSON.stringify(e.payload, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
                {q.data && q.data.events.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Sin eventos registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}