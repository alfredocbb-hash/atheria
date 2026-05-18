import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  cancelSubscription,
  createCheckoutSession,
  getCurrentSubscription,
  listPlans,
} from "@/lib/billing-saas.functions";

export function useCurrentSubscription() {
  const fn = useServerFn(getCurrentSubscription);
  return useQuery({
    queryKey: ["billing-saas", "current"],
    queryFn: () => fn({}),
    retry: false,
  });
}

export function usePlans() {
  const fn = useServerFn(listPlans);
  return useQuery({
    queryKey: ["billing-saas", "plans"],
    queryFn: () => fn({}),
  });
}

export function useCreateCheckout() {
  const fn = useServerFn(createCheckoutSession);
  return useMutation({
    mutationFn: (planId: string) => fn({ data: { planId } }),
    onSuccess: (res) => {
      if (res?.url) window.location.href = res.url;
    },
    onError: (e: Error) => toast.error("No se pudo iniciar el pago", { description: e.message }),
  });
}

export function useCancelSubscription() {
  const fn = useServerFn(cancelSubscription);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fn({}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing-saas"] });
      toast.success("Suscripción cancelada");
    },
    onError: (e: Error) => toast.error("No se pudo cancelar", { description: e.message }),
  });
}