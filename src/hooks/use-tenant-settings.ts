import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type TenantSettingsRow = {
  tenant_id: string;
  billing_day: number | null;
  first_due_day: number | null;
  second_due_day: number | null;
  interest_rate_after_first: number | null;
  interest_rate_after_second: number | null;
  cesp_code: string | null;
  legal_name: string | null;
  cuit: string | null;
  trade_name: string | null;
  legal_address: string | null;
  fiscal_address: string | null;
  email: string | null;
  phone_main: string | null;
  phone_mobile: string | null;
  whatsapp: string | null;
  website: string | null;
  email_services: string | null;
  email_inquiries: string | null;
  email_collections: string | null;
  iibb: string | null;
};

/**
 * If `tenantId` is omitted, uses the current tenant (RLS scopes via current_tenant_id()).
 */
export function useTenantSettings(tenantId?: string | null) {
  return useQuery({
    queryKey: ["tenant_settings", tenantId ?? "current"],
    queryFn: async () => {
      let q = supabase.from("tenant_settings").select("*").limit(1);
      if (tenantId) q = q.eq("tenant_id", tenantId);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return (data as TenantSettingsRow | null) ?? null;
    },
  });
}

export function useUpdateTenantSettings(tenantId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<TenantSettingsRow>) => {
      // Get target tenant id
      let tid = tenantId ?? null;
      if (!tid) {
        const { data, error } = await supabase
          .from("tenant_settings")
          .select("tenant_id")
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        tid = data?.tenant_id ?? null;
      }
      if (!tid) throw new Error("No se encontró la cooperativa actual");

      // Upsert (insert if missing)
      const { error } = await supabase
        .from("tenant_settings")
        .upsert({ tenant_id: tid, ...patch }, { onConflict: "tenant_id" });
      if (error) throw error;
      return tid;
    },
    onSuccess: (tid) => {
      qc.invalidateQueries({ queryKey: ["tenant_settings", tenantId ?? "current"] });
      qc.invalidateQueries({ queryKey: ["tenant_settings", tid] });
      toast.success("Configuración guardada");
    },
    onError: (e: Error) => toast.error("No se pudo guardar", { description: e.message }),
  });
}