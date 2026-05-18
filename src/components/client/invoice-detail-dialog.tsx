import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer } from "lucide-react";
import { useInvoiceDetail } from "@/hooks/use-billing";

type Props = {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const fmt = (n: number, c = "ARS") =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: c }).format(n || 0);

export function InvoiceDetailDialog({ invoiceId, open, onOpenChange }: Props) {
  const { data, isLoading } = useInvoiceDetail(open ? invoiceId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl print:max-w-none print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Detalle de factura</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div id="invoice-print-area" className="space-y-4 text-sm">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <p className="text-lg font-semibold">Cooperativa Coopecur</p>
                <p className="text-xs text-muted-foreground">Servicios públicos</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-muted-foreground">{(data as any).invoice_number}</p>
                <Badge
                  variant={
                    (data as any).status === "paid"
                      ? "default"
                      : (data as any).status === "overdue"
                      ? "destructive"
                      : "secondary"
                  }
                  className="mt-1"
                >
                  {(data as any).status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Socio/a</p>
                <p className="font-medium">{(data as any).member?.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  N° {(data as any).member?.member_number}
                  {(data as any).member?.document_id ? ` · DNI ${(data as any).member.document_id}` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Suministro</p>
                <p className="font-medium">
                  {(data as any).supply?.supply_number} · {(data as any).supply?.service_type}
                </p>
                {(data as any).supply?.address && (
                  <p className="text-xs text-muted-foreground">
                    {(data as any).supply.address.street} {(data as any).supply.address.street_number ?? ""},{" "}
                    {(data as any).supply.address.city}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Período</p>
                <p>{(data as any).period_start} → {(data as any).period_end}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Vencimiento</p>
                <p>{(data as any).due_date}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase text-muted-foreground">Conceptos</p>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-1">Descripción</th>
                    <th className="py-1 text-right">Cantidad</th>
                    <th className="py-1 text-right">P. unit.</th>
                    <th className="py-1 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {((data as any).items ?? []).map((it: any) => (
                    <tr key={it.id} className="border-b last:border-0">
                      <td className="py-1">{it.description}</td>
                      <td className="py-1 text-right">{Number(it.quantity)}</td>
                      <td className="py-1 text-right">{fmt(Number(it.unit_price), (data as any).currency)}</td>
                      <td className="py-1 text-right">{fmt(Number(it.amount), (data as any).currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-full max-w-xs space-y-1 border-t pt-2">
              <Row label="Subtotal" value={fmt(Number((data as any).subtotal), (data as any).currency)} />
              <Row label="Impuestos" value={fmt(Number((data as any).tax_amount), (data as any).currency)} />
              <Row label="Total" value={fmt(Number((data as any).total), (data as any).currency)} bold />
              <Row
                label="Saldo"
                value={fmt(Number((data as any).balance), (data as any).currency)}
                bold
                highlight={Number((data as any).balance) > 0}
              />
            </div>

            {((data as any).payments ?? []).length > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase text-muted-foreground">Pagos registrados</p>
                <ul className="space-y-1 text-xs">
                  {(data as any).payments.map((p: any) => (
                    <li key={p.id} className="flex justify-between border-b py-1 last:border-0">
                      <span>{p.payment_date} · {p.method}{p.reference ? ` · ${p.reference}` : ""}</span>
                      <span className="font-medium">{fmt(Number(p.amount), (data as any).currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          <Button onClick={() => window.print()} disabled={!data}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
          #invoice-print-area { position: fixed; inset: 0; padding: 24px; background: white; color: black; }
        }
      `}</style>
    </Dialog>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "text-destructive" : ""}>{value}</span>
    </div>
  );
}