import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  assignRole,
  listUsersWithRoles,
  revokeRole,
} from "@/lib/users.functions";

export function useUsersWithRoles(search: string) {
  const fn = useServerFn(listUsersWithRoles);
  return useQuery({
    queryKey: ["admin", "users", { search }],
    queryFn: () => fn({ data: { search: search || undefined } }),
  });
}

export function useAssignRole() {
  const fn = useServerFn(assignRole);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: string; role: "admin" | "operator" | "client" }) =>
      fn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Rol asignado");
    },
    onError: (e: Error) => toast.error("No se pudo asignar", { description: e.message }),
  });
}

export function useRevokeRole() {
  const fn = useServerFn(revokeRole);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: string; role: "admin" | "operator" | "client" }) =>
      fn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Rol revocado");
    },
    onError: (e: Error) => toast.error("No se pudo revocar", { description: e.message }),
  });
}