import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertSuper(supabase: any) {
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: requiere super admin");
}

// ---------- Whoami ----------
export const amISuperAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data } = await supabase.rpc("is_super_admin");
    return { isSuperAdmin: !!data };
  });

// ---------- Tenants ----------
export const listTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    const { data, error } = await supabase
      .from("tenants")
      .select(
        "id, name, slug, status, trial_ends_at, plan_id, billing_provider, billing_subscription_id, created_at, plans(name, code)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // counts
    const ids = (data ?? []).map((t: any) => t.id);
    const memberCounts: Record<string, number> = {};
    if (ids.length) {
      const { data: mems } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .in("tenant_id", ids);
      for (const m of mems ?? []) {
        memberCounts[m.tenant_id] = (memberCounts[m.tenant_id] ?? 0) + 1;
      }
    }
    return {
      tenants: (data ?? []).map((t: any) => ({
        ...t,
        plan_name: t.plans?.name ?? null,
        plan_code: t.plans?.code ?? null,
        members_count: memberCounts[t.id] ?? 0,
      })),
    };
  });

const UpdateTenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  plan_id: z.string().uuid().nullable().optional(),
  status: z.enum(["trial", "active", "past_due", "suspended", "cancelled"]).optional(),
  trial_ends_at: z.string().datetime().nullable().optional(),
  billing_provider: z.enum(["mercadopago", "stripe", "manual"]).optional(),
});

export const updateTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UpdateTenantSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    const { id, ...rest } = data;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) patch[k] = v;
    }
    const { error } = await supabase.from("tenants").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const CreateTenantSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  plan_id: z.string().uuid().nullable().optional(),
  trial_days: z.number().int().min(0).max(365).default(30),
  admin_email: z.string().email().optional(),
});

export const createTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CreateTenantSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    const trialEndsAt = new Date(Date.now() + data.trial_days * 86_400_000).toISOString();
    const { data: t, error } = await supabase
      .from("tenants")
      .insert({
        name: data.name,
        slug: data.slug,
        plan_id: data.plan_id ?? null,
        status: "trial",
        trial_ends_at: trialEndsAt,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (data.admin_email) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      // try find existing user via profiles
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", data.admin_email.toLowerCase())
        .maybeSingle();
      if (prof?.id) {
        await supabaseAdmin.from("tenant_members").insert({
          tenant_id: t.id,
          user_id: prof.id,
          role: "admin",
        });
      }
    }
    return { id: t.id };
  });

export const listTenantMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tenantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: mems, error } = await supabaseAdmin
      .from("tenant_members")
      .select("id, user_id, role, created_at")
      .eq("tenant_id", data.tenantId);
    if (error) throw new Error(error.message);
    const ids = (mems ?? []).map((m: any) => m.user_id);
    const emails: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", ids);
      for (const p of profs ?? []) emails[p.id] = p.email ?? p.full_name ?? "";
    }
    return {
      members: (mems ?? []).map((m: any) => ({
        ...m,
        email: emails[m.user_id] ?? "(sin email)",
      })),
    };
  });

// ---------- Plans ----------
export const listPlansAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("price_cents", { ascending: true });
    if (error) throw new Error(error.message);
    return { plans: data ?? [] };
  });

const UpsertPlanSchema = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  price_cents: z.number().int().min(0).max(100_000_000),
  currency: z.string().length(3).default("ARS"),
  is_active: z.boolean().default(false),
  features: z.record(z.string(), z.any()).default({}),
  limits: z.record(z.string(), z.any()).default({}),
  provider_price_id: z.string().max(120).nullable().optional(),
  mp_preapproval_plan_id: z.string().max(120).nullable().optional(),
});

export const upsertPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UpsertPlanSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await supabase.from("plans").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await supabase
      .from("plans")
      .insert(data)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const togglePlanActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    const { error } = await supabase
      .from("plans")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Subscription Events ----------
export const listSubscriptionEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid().nullable().optional(),
        type: z.string().max(80).nullable().optional(),
        limit: z.number().int().min(1).max(200).default(50),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    let q = supabase
      .from("subscription_events")
      .select("id, tenant_id, provider, type, provider_event_id, payload, created_at, tenants(name)")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.tenantId) q = q.eq("tenant_id", data.tenantId);
    if (data.type) q = q.eq("type", data.type);
    const { data: events, error } = await q;
    if (error) throw new Error(error.message);
    return {
      events: (events ?? []).map((e: any) => ({
        ...e,
        tenant_name: e.tenants?.name ?? null,
      })),
    };
  });

// ---------- Health ----------
export const getPlatformHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    const { data: tenants } = await supabase
      .from("tenants")
      .select("status, trial_ends_at");
    const byStatus: Record<string, number> = {};
    let trialsEndingSoon = 0;
    const soon = Date.now() + 7 * 86_400_000;
    for (const t of tenants ?? []) {
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
      if (
        t.status === "trial" &&
        t.trial_ends_at &&
        new Date(t.trial_ends_at).getTime() <= soon
      ) {
        trialsEndingSoon += 1;
      }
    }
    const { data: last } = await supabase
      .from("subscription_events")
      .select("created_at, type, provider")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return {
      totalTenants: (tenants ?? []).length,
      byStatus,
      trialsEndingSoon,
      lastEvent: last ?? null,
      mercadopagoConfigured: !!process.env.MP_ACCESS_TOKEN,
      mercadopagoWebhookConfigured: !!process.env.MP_WEBHOOK_SECRET,
    };
  });

// ---------- Super Dashboard ----------
export const getSuperDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);

    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const inThreeDays = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const inSevenDays = new Date(Date.now() + 7 * 86_400_000).toISOString();

    const [
      { data: tenants },
      { data: events7d, count: events7dCount },
      { data: recentEvents },
      { data: recentAudit },
      { data: atRiskTrials },
      { data: atRiskPastDue },
    ] = await Promise.all([
      supabase
        .from("tenants")
        .select("id, name, status, trial_ends_at, plan_id, plans(price_cents, currency)"),
      supabase
        .from("subscription_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("subscription_events")
        .select("id, type, provider, created_at, tenants(name)")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("audit_log")
        .select("id, action, entity_type, actor_email, created_at, tenant_id")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("tenants")
        .select("id, name, status, trial_ends_at")
        .eq("status", "trial")
        .not("trial_ends_at", "is", null)
        .lte("trial_ends_at", inThreeDays)
        .order("trial_ends_at", { ascending: true })
        .limit(20),
      supabase
        .from("tenants")
        .select("id, name, status, trial_ends_at")
        .in("status", ["past_due", "suspended"])
        .limit(20),
    ]);

    const byStatus: Record<string, number> = {};
    let mrrCents = 0;
    let trialsEndingSoon = 0;
    const now = Date.now();
    const soon = now + 7 * 86_400_000;
    for (const t of (tenants ?? []) as any[]) {
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
      if (t.status === "active" && t.plans?.price_cents) {
        mrrCents += t.plans.price_cents;
      }
      if (
        t.status === "trial" &&
        t.trial_ends_at &&
        new Date(t.trial_ends_at).getTime() <= soon &&
        new Date(t.trial_ends_at).getTime() >= now
      ) {
        trialsEndingSoon += 1;
      }
    }

    void events7d;
    void inSevenDays;

    return {
      kpis: {
        totalTenants: (tenants ?? []).length,
        byStatus,
        trialsEndingSoon,
        mrrCents,
        eventsLast7d: events7dCount ?? 0,
      },
      atRisk: [
        ...((atRiskTrials ?? []) as any[]).map((t) => ({ ...t, reason: "trial_ending" as const })),
        ...((atRiskPastDue ?? []) as any[]).map((t) => ({ ...t, reason: "billing" as const })),
      ],
      recentEvents: ((recentEvents ?? []) as any[]).map((e) => ({
        ...e,
        tenant_name: e.tenants?.name ?? null,
      })),
      recentAudit: recentAudit ?? [],
    };
  });

// ---------- Per-tenant billing credentials (scaffolding) ----------
export const getTenantBillingConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tenantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("tenant_billing_credentials")
      .select("tenant_id, provider, access_token, webhook_secret, preapproval_plan_id, updated_at")
      .eq("tenant_id", data.tenantId)
      .maybeSingle();
    return {
      provider: row?.provider ?? "mercadopago",
      hasAccessToken: !!row?.access_token,
      hasWebhookSecret: !!row?.webhook_secret,
      preapprovalPlanId: row?.preapproval_plan_id ?? null,
      updatedAt: row?.updated_at ?? null,
    };
  });

const UpsertBillingSchema = z.object({
  tenantId: z.string().uuid(),
  provider: z.enum(["mercadopago"]).default("mercadopago"),
  accessToken: z.string().max(500).nullable().optional(),
  webhookSecret: z.string().max(500).nullable().optional(),
  preapprovalPlanId: z.string().max(120).nullable().optional(),
});

export const upsertTenantBillingConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UpsertBillingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertSuper(supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, unknown> = {
      tenant_id: data.tenantId,
      provider: data.provider,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };
    if (data.accessToken !== undefined) patch.access_token = data.accessToken || null;
    if (data.webhookSecret !== undefined) patch.webhook_secret = data.webhookSecret || null;
    if (data.preapprovalPlanId !== undefined)
      patch.preapproval_plan_id = data.preapprovalPlanId || null;

    const { error } = await supabaseAdmin
      .from("tenant_billing_credentials")
      .upsert(patch as any, { onConflict: "tenant_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });