import {
  listAppModules,
  getTenantPermissions,
  setTenantPermission,
  resetTenantPermissions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listAppModules,
  getTenantPermissions,
  setTenantPermission,
  resetTenantPermissions, useServerFn } from "@tanstack/react-start";
import {
  listAppModules,
  getTenantPermissions,
  setTenantPermission,
  resetTenantPermissions, toast } from "sonner";
import {
  listAppModules,
  getTenantPermissions,
  setTenantPermission,
  resetTenantPermissions, supabase } from "@/integrations/supabase/client";
import {
  listAppModules,
  getTenantPermissions,
  setTenantPermission,
  resetTenantPermissions, useAuth } from "@/hooks/use-auth";
import {
  listAppModules,
  getTenantPermissions,
  setTenantPermission,
  resetTenantPermissions,
  createTenant,
  getSuperDashboard,
  getTenantBillingConfig,
  getPlatformHealth,
  listPlansAdmin,
  listSubscriptionEvents,
  listTenantMembers,
  listTenants,
  togglePlanActive,
  updateTenant,
  upsertPlan,
  upsertTenantBillingConfig,
} from "@/lib/super-admin.functions";

type UpdateTenantInput = {
  id: string;
  name?: string;
  slug?: string;
  plan_id?: string | null;
  status?: "trial" | "active" | "past_due" | "suspended" | "cancelled";
  trial_ends_at?: string | null;
  billing_provider?: "mercadopago" | "stripe" | "manual";
};

type CreateTenantInput = {
  name: string;
  slug: string;
  plan_id?: string | null;
  trial_days?: number;
  admin_email?: string;
};

type UpsertPlanInput = {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  price_cents: number;
  currency?: string;
  is_active?: boolean;
  features?: Record<string, unknown>;
  limits?: Record<string, unknown>;
  provider_price_id?: string | null;
  mp_preapproval_plan_id?: string | null;
};

export function useIsSuperAdmin() {
  const auth = useAuth();
  const userId = auth.user?.id;
  return useQuery({
    queryKey: ["super", "whoami", userId ?? "anon"],
    enabled: !!userId && auth.rolesLoaded,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    queryFn: async () => {
      if (!userId) return { isSuperAdmin: false };
      const { data, error } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return { isSuperAdmin: !!data };
    },
  });
}

export function useTenantsList() {
  const fn = useServerFn(listTenants);
  return useQuery({ queryKey: ["super", "tenants"], queryFn: () => fn({}) });
}

export function useTenantMembers(tenantId: string | null) {
  const fn = useServerFn(listTenantMembers);
  return useQuery({
    queryKey: ["super", "tenant-members", tenantId],
    queryFn: () => fn({ data: { tenantId: tenantId! } }),
    enabled: !!tenantId,
  });
}

export function useUpdateTenant() {
  const fn = useServerFn(updateTenant);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTenantInput) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super", "tenants"] });
      toast.success("Tenant actualizado");
    },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}

export function useCreateTenant() {
  const fn = useServerFn(createTenant);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantInput) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super", "tenants"] });
      toast.success("Tenant creado");
    },
    onError: (e: Error) => toast.error("No se pudo crear", { description: e.message }),
  });
}

export function usePlansAdmin() {
  const fn = useServerFn(listPlansAdmin);
  return useQuery({ queryKey: ["super", "plans"], queryFn: () => fn({}) });
}

export function useUpsertPlan() {
  const fn = useServerFn(upsertPlan);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertPlanInput) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super", "plans"] });
      toast.success("Plan guardado");
    },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}

export function useTogglePlanActive() {
  const fn = useServerFn(togglePlanActive);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; is_active: boolean }) => fn({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["super", "plans"] }),
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}

export function useSubscriptionEvents(filters: {
  tenantId?: string | null;
  type?: string | null;
}) {
  const fn = useServerFn(listSubscriptionEvents);
  return useQuery({
    queryKey: ["super", "events", filters],
    queryFn: () => fn({ data: { ...filters, limit: 100 } }),
  });
}

export function usePlatformHealth() {
  const fn = useServerFn(getPlatformHealth);
  return useQuery({ queryKey: ["super", "health"], queryFn: () => fn({}) });
}

export function useSuperDashboard() {
  const fn = useServerFn(getSuperDashboard);
  return useQuery({ queryKey: ["super", "dashboard"], queryFn: () => fn({}) });
}

export function useTenantBillingConfig(tenantId: string | null) {
  const fn = useServerFn(getTenantBillingConfig);
  return useQuery({
    queryKey: ["super", "tenant-billing", tenantId],
    queryFn: () => fn({ data: { tenantId: tenantId! } }),
    enabled: !!tenantId,
  });
}

export function useUpsertTenantBillingConfig() {
  const fn = useServerFn(upsertTenantBillingConfig);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tenantId: string;
      provider?: "mercadopago";
      accessToken?: string | null;
      webhookSecret?: string | null;
      preapprovalPlanId?: string | null;
    }) => fn({ data: { provider: "mercadopago", ...data } }),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["super", "tenant-billing", vars.tenantId] });
      toast.success("Credenciales guardadas");
    },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}
// ---------- Module Permissions ----------

export function useAppModules() {
  const fn = useServerFn(listAppModules);
  return useQuery({ queryKey: ["super", "app-modules"], queryFn: () => fn({}) });
}

export function useTenantPermissions(tenantId: string | null) {
  const fn = useServerFn(getTenantPermissions);
  return useQuery({
    queryKey: ["super", "tenant-permissions", tenantId],
    queryFn: () => fn({ data: { tenantId: tenantId! } }),
    enabled: !!tenantId,
  });
}

export function useSetTenantPermission() {
  const fn = useServerFn(setTenantPermission);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tenantId: string;
      moduleKey: string;
      roleScope: "app_role" | "tenant_role";
      role: string;
      enabled: boolean;
    }) => fn({ data }),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["super", "tenant-permissions", vars.tenantId] });
    },
    onError: (e: Error) => toast.error("Error al guardar permiso", { description: e.message }),
  });
}

export function useResetTenantPermissions() {
  const fn = useServerFn(resetTenantPermissions);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { tenantId: string }) => fn({ data }),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["super", "tenant-permissions", vars.tenantId] });
      toast.success("Permisos restablecidos a los valores globales");
    },
    onError: (e: Error) => toast.error("Error", { description: e.message }),
  });
}
