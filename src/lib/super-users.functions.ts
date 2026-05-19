import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertSuper(supabase: any) {
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: requiere super admin");
}

const AppRole = z.enum(["admin", "operator", "client"]);
const TenantRole = z.enum(["admin", "operador", "user"]);
const RoleScope = z.enum(["app_role", "tenant_role"]);

// ---------- Users ----------

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string } | undefined) =>
    z.object({ search: z.string().trim().max(120).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);

    let q = supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, document_id, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(`email.ilike.${s},full_name.ilike.${s},document_id.ilike.${s}`);
    }
    const { data: profiles, error } = await q;
    if (error) throw new Error(error.message);

    const ids = (profiles ?? []).map((p: any) => p.id);
    if (ids.length === 0) return { users: [] };

    const [{ data: appRoles }, { data: tenantMembers }, { data: supers }, { data: tenants }] =
      await Promise.all([
        supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
        supabaseAdmin.from("tenant_members").select("user_id, tenant_id, role").in("user_id", ids),
        supabaseAdmin.from("super_admins").select("user_id").in("user_id", ids),
        supabaseAdmin.from("tenants").select("id, name, slug"),
      ]);

    const tenantMap = new Map((tenants ?? []).map((t: any) => [t.id, t]));
    const rolesBy: Record<string, string[]> = {};
    for (const r of appRoles ?? []) {
      (rolesBy[r.user_id] ??= []).push(r.role);
    }
    const membersBy: Record<string, Array<{ tenant_id: string; tenant_name: string; role: string }>> = {};
    for (const m of tenantMembers ?? []) {
      const t = tenantMap.get(m.tenant_id);
      (membersBy[m.user_id] ??= []).push({
        tenant_id: m.tenant_id,
        tenant_name: t?.name ?? m.tenant_id,
        role: m.role,
      });
    }
    const superSet = new Set((supers ?? []).map((s: any) => s.user_id));

    return {
      users: (profiles ?? []).map((p: any) => ({
        ...p,
        app_roles: rolesBy[p.id] ?? [],
        tenant_memberships: membersBy[p.id] ?? [],
        is_super_admin: superSet.has(p.id),
      })),
    };
  });

export const createUserWithRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().email().max(255),
        password: z.string().min(8).max(128),
        full_name: z.string().trim().min(1).max(120),
        app_roles: z.array(AppRole).default([]),
        is_super_admin: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertSuper(supabase);

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    const newId = created.user!.id;

    if (data.app_roles.length > 0) {
      await supabaseAdmin
        .from("user_roles")
        .insert(data.app_roles.map((r) => ({ user_id: newId, role: r })));
    }
    if (data.is_super_admin) {
      await supabaseAdmin.from("super_admins").insert({ user_id: newId });
    }
    await supabaseAdmin.rpc("log_audit", {
      _action: "user.created",
      _entity_type: "user",
      _entity_id: newId,
      _actor: userId,
      _metadata: { email: data.email, app_roles: data.app_roles, is_super_admin: data.is_super_admin },
    });
    return { user_id: newId };
  });

export const setAppRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().uuid(), role: AppRole, enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    if (data.enabled) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.user_id, role: data.role });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const setSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().uuid(), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertSuper(supabase);
    if (!data.enabled && data.user_id === userId) {
      throw new Error("No podés quitarte tu propio super admin");
    }
    if (data.enabled) {
      const { error } = await supabaseAdmin
        .from("super_admins")
        .insert({ user_id: data.user_id });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("super_admins").delete().eq("user_id", data.user_id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const setTenantMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        tenant_id: z.string().uuid(),
        role: TenantRole.nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    if (data.role === null) {
      const { error } = await supabaseAdmin
        .from("tenant_members")
        .delete()
        .eq("user_id", data.user_id)
        .eq("tenant_id", data.tenant_id);
      if (error) throw new Error(error.message);
    } else {
      const { error: delErr } = await supabaseAdmin
        .from("tenant_members")
        .delete()
        .eq("user_id", data.user_id)
        .eq("tenant_id", data.tenant_id);
      if (delErr) throw new Error(delErr.message);
      const { error } = await supabaseAdmin
        .from("tenant_members")
        .insert({ user_id: data.user_id, tenant_id: data.tenant_id, role: data.role });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ---------- Modules & permissions ----------

export const listModules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    const { data, error } = await supabaseAdmin
      .from("app_modules")
      .select("key, title, description, category, is_active, sort_order")
      .order("category")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return { modules: data ?? [] };
  });

export const listGlobalPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    const { data, error } = await supabaseAdmin
      .from("module_role_permissions")
      .select("module_key, role_scope, role, enabled");
    if (error) throw new Error(error.message);
    return { permissions: data ?? [] };
  });

export const setGlobalPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        module_key: z.string().min(1).max(60),
        role_scope: RoleScope,
        role: z.string().min(1).max(40),
        enabled: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertSuper(supabase);
    const { error } = await supabaseAdmin.from("module_role_permissions").upsert(
      {
        module_key: data.module_key,
        role_scope: data.role_scope,
        role: data.role,
        enabled: data.enabled,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "module_key,role_scope,role" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTenantPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tenant_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    await assertSuper(supabase);
    const { data: rows, error } = await supabaseAdmin
      .from("tenant_module_role_permissions")
      .select("module_key, role_scope, role, enabled")
      .eq("tenant_id", data.tenant_id);
    if (error) throw new Error(error.message);
    return { permissions: rows ?? [] };
  });

export const setTenantPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        tenant_id: z.string().uuid(),
        module_key: z.string().min(1).max(60),
        role_scope: RoleScope,
        role: z.string().min(1).max(40),
        enabled: z.boolean().nullable(), // null = clear override
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertSuper(supabase);
    if (data.enabled === null) {
      const { error } = await supabaseAdmin
        .from("tenant_module_role_permissions")
        .delete()
        .eq("tenant_id", data.tenant_id)
        .eq("module_key", data.module_key)
        .eq("role_scope", data.role_scope)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("tenant_module_role_permissions").upsert(
        {
          tenant_id: data.tenant_id,
          module_key: data.module_key,
          role_scope: data.role_scope,
          role: data.role,
          enabled: data.enabled,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,module_key,role_scope,role" },
      );
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });