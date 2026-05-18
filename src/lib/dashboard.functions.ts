import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withActingTenant } from "@/lib/acting-tenant-middleware";

async function ensureStaff(supabase: any, userId: string) {
  const [{ data: isAdmin }, { data: isOp }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "operator" }),
  ]);
  if (!isAdmin && !isOp) throw new Error("Forbidden: solo personal autorizado");
}

export const getAdminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const [
      membersActive,
      suppliesActive,
      suppliesSuspended,
      overdueInvoices,
      monthInvoices,
      claimsOpen,
      claimsUrgent,
      recentInvoices,
      recentClaims,
    ] = await Promise.all([
      supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("supplies").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("supplies").select("id", { count: "exact", head: true }).eq("status", "suspended"),
      supabase.from("invoices").select("id, balance").gt("balance", 0).lt("due_date", today).neq("status", "void"),
      supabase.from("invoices").select("total").gte("issue_date", monthStart).lte("issue_date", monthEnd).neq("status", "void"),
      supabase.from("claims").select("id", { count: "exact", head: true }).in("status", ["open", "assigned", "in_progress"]),
      supabase.from("claims").select("id", { count: "exact", head: true }).eq("priority", "urgent").in("status", ["open", "assigned", "in_progress"]),
      supabase
        .from("invoices")
        .select("id, invoice_number, total, balance, status, issue_date, due_date, member:members(full_name)")
        .order("issue_date", { ascending: false })
        .limit(5),
      supabase
        .from("claims")
        .select("id, claim_number, title, status, priority, created_at, member:members(full_name)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const overdueAmount = (overdueInvoices.data ?? []).reduce(
      (acc: number, r: any) => acc + Number(r.balance || 0),
      0,
    );
    const monthBilled = (monthInvoices.data ?? []).reduce(
      (acc: number, r: any) => acc + Number(r.total || 0),
      0,
    );

    return {
      members_active: membersActive.count ?? 0,
      supplies_active: suppliesActive.count ?? 0,
      supplies_suspended: suppliesSuspended.count ?? 0,
      invoices_overdue_count: (overdueInvoices.data ?? []).length,
      invoices_overdue_amount: overdueAmount,
      month_billed: monthBilled,
      claims_open: claimsOpen.count ?? 0,
      claims_urgent: claimsUrgent.count ?? 0,
      recent_invoices: recentInvoices.data ?? [],
      recent_claims: recentClaims.data ?? [],
    };
  });