import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Returns whether the current user is super admin and whether they belong to any tenant.
export const getMyContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const [{ data: isSuper }, { data: memberships }] = await Promise.all([
      supabase.rpc("is_super_admin"),
      supabase.from("tenant_members").select("tenant_id").eq("user_id", userId).limit(1),
    ]);
    return {
      isSuperAdmin: !!isSuper,
      hasTenant: (memberships ?? []).length > 0,
    };
  });

const SlugSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones");

export const checkSlugAvailable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: SlugSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: row, error } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { available: !row };
  });

const CreateMyTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: SlugSchema,
  planId: z.string().uuid().nullable().optional(),
  locality: z.string().max(160).optional(),
});

export const createMyTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CreateMyTenantSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context as any;

    // Guard: user must not have a tenant yet
    const { data: existing } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", userId)
      .limit(1);
    if ((existing ?? []).length > 0) {
      throw new Error("Ya pertenecés a una cooperativa");
    }

    // Use admin client to bypass RLS (no INSERT policy on tenants for regular users)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Slug uniqueness
    const { data: dup } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (dup) throw new Error("El identificador ya está en uso");

    const trialEndsAt = new Date(Date.now() + 14 * 86_400_000).toISOString();

    const { data: t, error } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: data.name,
        slug: data.slug,
        plan_id: data.planId ?? null,
        status: "trial",
        trial_ends_at: trialEndsAt,
        billing_provider: "mercadopago",
      })
      .select("id, name, trial_ends_at")
      .single();
    if (error) throw new Error(error.message);

    const { error: memErr } = await supabaseAdmin.from("tenant_members").insert({
      tenant_id: t.id,
      user_id: userId,
      role: "admin",
    });
    if (memErr) {
      // best-effort rollback
      await supabaseAdmin.from("tenants").delete().eq("id", t.id);
      throw new Error(memErr.message);
    }

    // Audit + welcome notification
    await supabaseAdmin.rpc("log_audit", {
      _action: "tenant.created",
      _entity_type: "tenant",
      _entity_id: t.id,
      _actor: userId,
      _metadata: { via: "onboarding", locality: data.locality ?? null },
    });
    await supabaseAdmin.rpc("notify_tenant_admins", {
      _tenant: t.id,
      _kind: "billing",
      _title: "Bienvenido a la plataforma",
      _body: `Tu período de prueba para ${t.name} vence el ${new Date(t.trial_ends_at ?? Date.now()).toLocaleDateString("es-AR")}.`,
      _link: "/admin/facturacion-suscripcion",
      _metadata: {},
    });

    return { id: t.id, slug: data.slug };
  });
