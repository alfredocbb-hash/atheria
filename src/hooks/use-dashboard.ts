import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminDashboardStats } from "@/lib/dashboard.functions";

export function useAdminDashboard() {
  const fn = useServerFn(getAdminDashboardStats);
  return useQuery({ queryKey: ["dashboard", "admin"], queryFn: () => fn({}) });
}