import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  createMember,
  createMeter,
  createSupply,
  linkMyMember,
  listMembers,
  listMetersBySupply,
  listMyMemberAndSupplies,
  listSupplies,
  updateMember,
  updateSupplyStatus,
} from "@/lib/padron.functions";

export function useMembers(search: string) {
  const fn = useServerFn(listMembers);
  return useQuery({
    queryKey: ["padron", "members", { search }],
    queryFn: () => fn({ data: { search: search || undefined } }),
  });
}

export function useCreateMember() {
  const fn = useServerFn(createMember);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["padron", "members"] });
      toast.success("Socio creado");
    },
    onError: (e: Error) => toast.error("No se pudo crear", { description: e.message }),
  });
}

export function useUpdateMember() {
  const fn = useServerFn(updateMember);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: any }) => fn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["padron", "members"] });
      toast.success("Socio actualizado");
    },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}

export function useSupplies(filters: { search?: string; service_type?: string; status?: string }) {
  const fn = useServerFn(listSupplies);
  return useQuery({
    queryKey: ["padron", "supplies", filters],
    queryFn: () => fn({ data: filters }),
  });
}

export function useCreateSupply() {
  const fn = useServerFn(createSupply);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["padron", "supplies"] });
      toast.success("Suministro creado");
    },
    onError: (e: Error) => toast.error("No se pudo crear", { description: e.message }),
  });
}

export function useUpdateSupplyStatus() {
  const fn = useServerFn(updateSupplyStatus);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: string }) => fn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["padron", "supplies"] });
      toast.success("Estado actualizado");
    },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}

export function useMeters(supplyId: string | null) {
  const fn = useServerFn(listMetersBySupply);
  return useQuery({
    queryKey: ["padron", "meters", supplyId],
    queryFn: () => fn({ data: { supply_id: supplyId! } }),
    enabled: !!supplyId,
  });
}

export function useCreateMeter() {
  const fn = useServerFn(createMeter);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fn({ data }),
    onSuccess: (_d, vars: any) => {
      qc.invalidateQueries({ queryKey: ["padron", "meters", vars.supply_id] });
      toast.success("Medidor registrado");
    },
    onError: (e: Error) => toast.error("No se pudo registrar", { description: e.message }),
  });
}

export function useMyPadron() {
  const fn = useServerFn(listMyMemberAndSupplies);
  return useQuery({
    queryKey: ["padron", "self"],
    queryFn: () => fn({}),
  });
}

export function useLinkMyMember() {
  const fn = useServerFn(linkMyMember);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { member_number: string; document_id: string }) => fn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["padron", "self"] });
      qc.invalidateQueries({ queryKey: ["billing", "my-invoices"] });
      qc.invalidateQueries({ queryKey: ["claims", "mine"] });
      toast.success("Cuenta vinculada");
    },
    onError: (e: Error) => toast.error("No se pudo vincular", { description: e.message }),
  });
}