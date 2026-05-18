import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  createReading,
  createTariff,
  deleteReading,
  deleteTariff,
  generateInvoice,
  getInvoiceDetail,
  listInvoices,
  listMyInvoices,
  listReadings,
  listSuppliesLite,
  listTariffs,
  registerPayment,
  toggleTariffActive,
  updateInvoice,
  updatePayment,
  updateReading,
  updateTariff,
  voidPayment,
  voidInvoice,
} from "@/lib/billing.functions";

export function useTariffs() {
  const fn = useServerFn(listTariffs);
  return useQuery({ queryKey: ["billing", "tariffs"], queryFn: () => fn({}) });
}
export function useCreateTariff() {
  const fn = useServerFn(createTariff);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: any) => fn({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing", "tariffs"] }); toast.success("Tarifa creada"); },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}
export function useToggleTariff() {
  const fn = useServerFn(toggleTariffActive);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => fn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["billing", "tariffs"] }),
  });
}
export function useUpdateTariff() {
  const fn = useServerFn(updateTariff);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: any }) => fn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing", "tariffs"] }); toast.success("Tarifa actualizada"); },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}
export function useDeleteTariff() {
  const fn = useServerFn(deleteTariff);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing", "tariffs"] }); toast.success("Tarifa eliminada"); },
    onError: (e: Error) => toast.error("No se pudo eliminar", { description: e.message }),
  });
}

export function useReadings(meterId?: string) {
  const fn = useServerFn(listReadings);
  return useQuery({
    queryKey: ["billing", "readings", meterId ?? "all"],
    queryFn: () => fn({ data: { meter_id: meterId } }),
  });
}
export function useCreateReading() {
  const fn = useServerFn(createReading);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: any) => fn({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing", "readings"] }); toast.success("Lectura registrada"); },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}
export function useUpdateReading() {
  const fn = useServerFn(updateReading);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: any }) => fn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing", "readings"] }); toast.success("Lectura actualizada"); },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}
export function useDeleteReading() {
  const fn = useServerFn(deleteReading);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing", "readings"] }); toast.success("Lectura eliminada"); },
    onError: (e: Error) => toast.error("No se pudo eliminar", { description: e.message }),
  });
}

export function useInvoices(filters: { search?: string; status?: string } = {}) {
  const fn = useServerFn(listInvoices);
  return useQuery({
    queryKey: ["billing", "invoices", filters],
    queryFn: () => fn({ data: filters }),
  });
}
export function useInvoiceDetail(id: string | null) {
  const fn = useServerFn(getInvoiceDetail);
  return useQuery({
    queryKey: ["billing", "invoice", id],
    queryFn: () => fn({ data: { id: id! } }),
    enabled: !!id,
  });
}
export function useGenerateInvoice() {
  const fn = useServerFn(generateInvoice);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: any) => fn({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing", "invoices"] }); toast.success("Factura generada"); },
    onError: (e: Error) => toast.error("No se pudo generar", { description: e.message }),
  });
}
export function useVoidInvoice() {
  const fn = useServerFn(voidInvoice);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing"] }); toast.success("Factura anulada"); },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}
export function useUpdateInvoice() {
  const fn = useServerFn(updateInvoice);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: any }) => fn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing"] }); toast.success("Factura actualizada"); },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}
export function useRegisterPayment() {
  const fn = useServerFn(registerPayment);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: any) => fn({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing"] }); toast.success("Pago registrado"); },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}
export function useUpdatePayment() {
  const fn = useServerFn(updatePayment);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: any }) => fn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing"] }); toast.success("Pago actualizado"); },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}
export function useVoidPayment() {
  const fn = useServerFn(voidPayment);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["billing"] }); toast.success("Pago eliminado"); },
    onError: (e: Error) => toast.error("No se pudo eliminar", { description: e.message }),
  });
}

export function useSuppliesLite() {
  const fn = useServerFn(listSuppliesLite);
  return useQuery({ queryKey: ["billing", "supplies-lite"], queryFn: () => fn({}) });
}

export function useMyInvoices() {
  const fn = useServerFn(listMyInvoices);
  return useQuery({ queryKey: ["billing", "my-invoices"], queryFn: () => fn({}) });
}
