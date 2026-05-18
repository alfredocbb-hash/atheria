import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  addClaimComment,
  createClaim,
  createWorkOrder,
  deleteClaim,
  deleteClaimComment,
  deleteCrew,
  deleteWorkOrder,
  getClaim,
  listClaims,
  listCrews,
  listMyClaims,
  updateClaim,
  updateClaimStatus,
  updateWorkOrder,
  updateWorkOrderStatus,
  upsertCrew,
} from "@/lib/claims.functions";

export function useClaims(filters: { search?: string; status?: string; priority?: string }) {
  const fn = useServerFn(listClaims);
  return useQuery({
    queryKey: ["claims", "list", filters],
    queryFn: () => fn({ data: filters as any }),
  });
}

export function useClaim(id: string | null) {
  const fn = useServerFn(getClaim);
  return useQuery({
    queryKey: ["claims", "detail", id],
    queryFn: () => fn({ data: { id: id! } }),
    enabled: !!id,
  });
}

export function useCreateClaim() {
  const fn = useServerFn(createClaim);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["claims"] });
      toast.success("Reclamo creado");
    },
    onError: (e: Error) => toast.error("No se pudo crear", { description: e.message }),
  });
}

export function useUpdateClaimStatus() {
  const fn = useServerFn(updateClaimStatus);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["claims"] });
      toast.success("Reclamo actualizado");
    },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}

export function useUpdateClaim() {
  const fn = useServerFn(updateClaim);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: any }) => fn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["claims"] }); toast.success("Reclamo actualizado"); },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}

export function useDeleteClaim() {
  const fn = useServerFn(deleteClaim);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["claims"] }); toast.success("Reclamo eliminado"); },
    onError: (e: Error) => toast.error("No se pudo eliminar", { description: e.message }),
  });
}

export function useDeleteClaimComment() {
  const fn = useServerFn(deleteClaimComment);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; claim_id: string }) => fn({ data: { id: v.id } }),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["claims", "detail", v.claim_id] }); toast.success("Comentario eliminado"); },
    onError: (e: Error) => toast.error("No se pudo eliminar", { description: e.message }),
  });
}

export function useAddClaimComment() {
  const fn = useServerFn(addClaimComment);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fn({ data }),
    onSuccess: (_d, v: any) => {
      qc.invalidateQueries({ queryKey: ["claims", "detail", v.claim_id] });
    },
    onError: (e: Error) => toast.error("No se pudo comentar", { description: e.message }),
  });
}

export function useCrews() {
  const fn = useServerFn(listCrews);
  return useQuery({ queryKey: ["crews"], queryFn: () => fn({}) });
}

export function useUpsertCrew() {
  const fn = useServerFn(upsertCrew);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crews"] });
      toast.success("Cuadrilla guardada");
    },
    onError: (e: Error) => toast.error("No se pudo guardar", { description: e.message }),
  });
}

export function useDeleteCrew() {
  const fn = useServerFn(deleteCrew);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crews"] }); toast.success("Cuadrilla eliminada"); },
    onError: (e: Error) => toast.error("No se pudo eliminar", { description: e.message }),
  });
}

export function useCreateWorkOrder() {
  const fn = useServerFn(createWorkOrder);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fn({ data }),
    onSuccess: (_d, v: any) => {
      qc.invalidateQueries({ queryKey: ["claims"] });
      qc.invalidateQueries({ queryKey: ["claims", "detail", v.claim_id] });
      toast.success("Orden de trabajo creada");
    },
    onError: (e: Error) => toast.error("No se pudo despachar", { description: e.message }),
  });
}

export function useUpdateWorkOrderStatus() {
  const fn = useServerFn(updateWorkOrderStatus);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}

export function useUpdateWorkOrder() {
  const fn = useServerFn(updateWorkOrder);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: any }) => fn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["claims"] }); toast.success("Orden actualizada"); },
    onError: (e: Error) => toast.error("No se pudo actualizar", { description: e.message }),
  });
}

export function useDeleteWorkOrder() {
  const fn = useServerFn(deleteWorkOrder);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["claims"] }); toast.success("Orden eliminada"); },
    onError: (e: Error) => toast.error("No se pudo eliminar", { description: e.message }),
  });
}

export function useMyClaims() {
  const fn = useServerFn(listMyClaims);
  return useQuery({ queryKey: ["claims", "mine"], queryFn: () => fn({}) });
}