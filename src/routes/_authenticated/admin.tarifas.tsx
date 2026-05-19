import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTariffs, useToggleTariff, useDeleteTariff } from "@/hooks/use-billing";
import { DeleteButton } from "@/components/admin/delete-button";
import { useEnsureTab, useWorkspace } from "@/components/workspace/workspace-context";

export const Route = createFileRoute("/_authenticated/admin/tarifas")({
  head: () => ({ meta: [{ title: "Tarifas — Coopecur 2.0" }] }),
  component: TarifasPageTrigger,
});

const fmtMoney = (n: number, c = "ARS") =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: c }).format(Number(n || 0));

export function TarifasPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.isLoading && !auth.isAdminOrOperator) navigate({ to: "/cliente", replace: true });
  }, [auth, navigate]);

  const { data: tariffs = [], isLoading } = useTariffs();
  const toggle = useToggleTariff();
  const del = useDeleteTariff();
  const ws = useWorkspace();

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <Button
            variant="tech"
            size="sm"
            className="ml-auto"
            onClick={() =>
              ws.openView({
                id: "view:tarifa.new",
                viewKey: "tarifa.new",
                title: "Nueva tarifa",
                iconKey: "wallet",
                parentModule: "tarifas",
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Nueva tarifa
          </Button>
      </div>
      <CardContent className="pt-4">
          {isLoading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Cargo fijo</TableHead>
                  <TableHead className="text-right">$/unidad</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Activa</TableHead>
                  <TableHead className="w-12 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tariffs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      Sin tarifas cargadas.
                    </TableCell>
                  </TableRow>
                )}
                {tariffs.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.service_type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.category ?? "—"}</TableCell>
                    <TableCell className="text-right">{fmtMoney(t.fixed_charge, t.currency)}</TableCell>
                    <TableCell className="text-right">{fmtMoney(t.unit_price, t.currency)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t.valid_from}
                      {t.valid_to ? ` → ${t.valid_to}` : ""}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={t.is_active}
                        onCheckedChange={(v) => toggle.mutate({ id: t.id, is_active: v })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        iconOnly
                        title={`¿Eliminar tarifa "${t.name}"?`}
                        description="No se podrá eliminar si está siendo usada por alguna factura."
                        onConfirm={() => del.mutate(t.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
    </Card>
  );
}

function TarifasPageTrigger() {
  useEnsureTab("tarifas");
  return null;
}