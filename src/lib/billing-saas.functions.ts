import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withActingTenant } from "@/lib/acting-tenant-middleware";
import {
  getBillingProvider,
  BillingNotConfiguredError,
  type BillingTenant,
  type BillingPlan,
} from "@/lib/billing";

async function getTenantId(supabase: any): Promise<string> {
  const { data, error } = await supabase.rpc("current_tenant_id");
  if (error) throw new Error(`Tenant: ${error.message}`);
  if (!data) throw new Error("No tenés una cooperativa activa");
  return data as string;
}

async function ensureAdmin(supabase: any): Promise<string> {
  const tid = await getTenantId(supabase);
  const [{ data: ok }, { data: sa }] = await Promise.all([
    supabase.rpc("is_tenant_member", { _tenant: tid, _role: "admin" }),
    supabase.rpc("is_super_admin"),
  ]);
  if (!ok && !sa) throw new Error("Forbidden: requiere rol de administrador");
  return tid;
}

// ---------- Read current subscription ----------
export const getCurrentSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data: tid, error: tidErr } = await supabase.rpc("current_tenant_id");
    if (tidErr) throw new Error(`Tenant: ${tidErr.message}`);
    if (!tid) {
      // Super admin or user without tenant — return empty state
      return {
        tenant: null,
        plan: null,
        lastEvent: null,
        trialDaysLeft: null,
        providerConfigured: false,
        providerId: null as string | null,
        noTenant: true as const,
      };
    }
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select(
        "id, name, slug, status, trial_ends_at, plan_id, billing_provider, billing_customer_id, billing_subscription_id",
      )
      .eq("id", tid)
      .single();
    if (error) throw new Error(error.message);

    let plan: any = null;
    if (tenant.plan_id) {
      const { data: p } = await supabase
        .from("plans")
        .select("id, code, name, price_cents, currency, features")
        .eq("id", tenant.plan_id)
        .single();
      plan = p ?? null;
    }

    const { data: lastEvent } = await supabase
      .from("subscription_events")
      .select("type, created_at, provider")
      .eq("tenant_id", tid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = Date.now();
    const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at).getTime() : null;
    const trialDaysLeft =
      trialEndsAt !== null ? Math.max(0, Math.ceil((trialEndsAt - now) / 86_400_000)) : null;

    const provider = getBillingProvider(tenant);
    return {
      tenant,
      plan,
      lastEvent: lastEvent ?? null,
      trialDaysLeft,
      providerConfigured: provider.isConfigured(),
      providerId: provider.id,
    };
  });

// ---------- List available plans ----------
export const listPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase
      .from("plans")
      .select(
        "id, code, name, description, price_cents, currency, is_active, features, limits, provider_price_id, mp_preapproval_plan_id",
      )
      .order("price_cents", { ascending: true });
    if (error) throw new Error(error.message);
    return { plans: data ?? [] };
  });

// ---------- Create checkout session ----------
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator(
    z.object({
      planId: z.string().uuid(),
      successUrl: z.string().url().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, claims } = context as any;
    const tid = await ensureAdmin(supabase);

    const [{ data: tenant, error: tErr }, { data: plan, error: pErr }] = await Promise.all([
      supabase
        .from("tenants")
        .select(
          "id, name, billing_provider, billing_customer_id, billing_subscription_id",
        )
        .eq("id", tid)
        .single(),
      supabase
        .from("plans")
        .select(
          "id, code, name, price_cents, currency, provider_price_id, mp_preapproval_plan_id",
        )
        .eq("id", data.planId)
        .single(),
    ]);
    if (tErr) throw new Error(tErr.message);
    if (pErr) throw new Error(pErr.message);

    const provider = getBillingProvider(tenant as BillingTenant);
    if (!provider.isConfigured()) throw new BillingNotConfiguredError(provider.id);

    const payerEmail = (claims?.email as string | undefined) ?? "";
    const result = await provider.createCheckout({
      tenant: tenant as BillingTenant,
      plan: plan as BillingPlan,
      payerEmail,
      successUrl: data.successUrl ?? "/admin/facturacion-suscripcion",
    });

    if (result.subscriptionId || result.customerId) {
      await supabase
        .from("tenants")
        .update({
          billing_subscription_id: result.subscriptionId ?? null,
          billing_customer_id: result.customerId ?? null,
        })
        .eq("id", tid);
    }

    return { url: result.url };
  });

// ---------- Cancel ----------
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const tid = await ensureAdmin(supabase);
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, billing_provider, billing_subscription_id")
      .eq("id", tid)
      .single();
    if (error) throw new Error(error.message);
    if (!tenant.billing_subscription_id) {
      throw new Error("No hay suscripción activa");
    }
    const provider = getBillingProvider(tenant as BillingTenant);
    if (!provider.isConfigured()) throw new BillingNotConfiguredError(provider.id);
    await provider.cancelSubscription(tenant.billing_subscription_id);
    await supabase.from("tenants").update({ status: "cancelled" }).eq("id", tid);
    return { ok: true };
  });