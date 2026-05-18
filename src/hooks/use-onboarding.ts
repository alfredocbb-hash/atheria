import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  checkSlugAvailable,
  createMyTenant,
  getMyContext,
} from "@/lib/onboarding.functions";

export function useMyContext() {
  const fn = useServerFn(getMyContext);
  return useQuery({
    queryKey: ["onboarding", "my-context"],
    queryFn: () => fn({}),
    retry: false,
    staleTime: 30_000,
  });
}

export function useCheckSlug(slug: string) {
  const fn = useServerFn(checkSlugAvailable);
  return useQuery({
    queryKey: ["onboarding", "slug", slug],
    queryFn: () => fn({ data: { slug } }),
    enabled: !!slug && /^[a-z0-9-]{2,60}$/.test(slug),
    staleTime: 5_000,
  });
}

export function useCreateMyTenant() {
  const fn = useServerFn(createMyTenant);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; slug: string; planId?: string | null; locality?: string }) =>
      fn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding"] });
      qc.invalidateQueries({ queryKey: ["billing-saas"] });
    },
  });
}
