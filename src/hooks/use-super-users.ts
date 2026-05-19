import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  createUserWithRole,
  listAllUsers,
  listGlobalPermissions,
  listModules,
  listTenantPermissions,
  setAppRole,
  setGlobalPermission,
  setSuperAdmin,
  setTenantMembership,
  setTenantPermission,
} from "@/lib/super-users.functions";

export function useAllUsers(search: string) {
  const fn = useServerFn(listAllUsers);
  return useQuery({
    queryKey: ["super-users", "list", search],
    queryFn: () => fn({ data: { search: search || undefined } }),
  });
}

export function useCreateUser() {
  const fn = useServerFn(createUserWithRole);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      full_name: string;
      app_roles?: Array<"admin" | "operator" | "client">;
      is_super_admin?: boolean;
    }) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-users"] });
      toast.success("Usuario creado");
    },
    onError: (e: Error) => toast.error("No se pudo crear", { description: e.message }),
  });
}

export function useSetAppRole() {
  const fn = useServerFn(setAppRole);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { user_id: string; role: "admin" | "operator" | "client"; enabled: boolean }) =>
      fn({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["super-users"] }),
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}

export function useSetSuperAdmin() {
  const fn = useServerFn(setSuperAdmin);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { user_id: string; enabled: boolean }) => fn({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["super-users"] }),
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}

export function useSetTenantMembership() {
  const fn = useServerFn(setTenantMembership);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      user_id: string;
      tenant_id: string;
      role: "admin" | "operador" | "user" | null;
    }) => fn({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["super-users"] }),
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}

export function useModulesList() {
  const fn = useServerFn(listModules);
  return useQuery({ queryKey: ["super-modules"], queryFn: () => fn({}) });
}

export function useGlobalPermissions() {
  const fn = useServerFn(listGlobalPermissions);
  return useQuery({ queryKey: ["super-perms", "global"], queryFn: () => fn({}) });
}

export function useSetGlobalPermission() {
  const fn = useServerFn(setGlobalPermission);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      module_key: string;
      role_scope: "app_role" | "tenant_role";
      role: string;
      enabled: boolean;
    }) => fn({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["super-perms", "global"] }),
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}

export function useTenantPermissions(tenantId: string | null) {
  const fn = useServerFn(listTenantPermissions);
  return useQuery({
    queryKey: ["super-perms", "tenant", tenantId],
    queryFn: () => fn({ data: { tenant_id: tenantId! } }),
    enabled: !!tenantId,
  });
}

export function useSetTenantPermission() {
  const fn = useServerFn(setTenantPermission);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tenant_id: string;
      module_key: string;
      role_scope: "app_role" | "tenant_role";
      role: string;
      enabled: boolean | null;
    }) => fn({ data }),
    onSuccess: (_r, vars) =>
      qc.invalidateQueries({ queryKey: ["super-perms", "tenant", vars.tenant_id] }),
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}