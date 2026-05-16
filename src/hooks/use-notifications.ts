import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  listAuditLog,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications.functions";

export function useMyNotifications() {
  const auth = useAuth();
  const qc = useQueryClient();
  const fn = useServerFn(listMyNotifications);
  const query = useQuery({
    queryKey: ["notifications", "mine"],
    queryFn: () => fn({}),
    enabled: !!auth.session?.access_token,
  });

  useEffect(() => {
    if (!auth.user) return;
    const channel = supabase
      .channel(`notif-${auth.user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${auth.user.id}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["notifications", "mine"] });
          const n: any = payload.new;
          toast.info(n.title, { description: n.body ?? undefined });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [auth.user?.id, qc]);

  return query;
}

export function useMarkNotificationRead() {
  const fn = useServerFn(markNotificationRead);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "mine"] }),
  });
}

export function useMarkAllRead() {
  const fn = useServerFn(markAllNotificationsRead);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fn({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "mine"] }),
  });
}

export function useAuditLog(filters: { entity_type?: string; action?: string; search?: string }) {
  const fn = useServerFn(listAuditLog);
  return useQuery({
    queryKey: ["audit", filters],
    queryFn: () => fn({ data: filters as any }),
  });
}