import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type AppSettingsRow = {
  id: number;
  platform_name: string | null;
  support_email: string | null;
  support_phone: string | null;
  support_whatsapp: string | null;
  default_billing_day: number | null;
  default_first_due_day: number | null;
  default_second_due_day: number | null;
  default_interest_after_first: number | null;
  default_interest_after_second: number | null;
  terms_url: string | null;
  privacy_url: string | null;
};

export function useAppSettings() {
  return useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data as AppSettingsRow | null) ?? null;
    },
  });
}

export function useUpdateAppSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<AppSettingsRow>) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ id: 1, ...patch }, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app_settings"] });
      toast.success("Configuración guardada");
    },
    onError: (e: Error) => toast.error("No se pudo guardar", { description: e.message }),
  });
}

export function useTenantsLite() {
  return useQuery({
    queryKey: ["tenants_lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Array<{ id: string; name: string }>;
    },
  });
}