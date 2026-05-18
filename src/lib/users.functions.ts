import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withActingTenant } from "@/lib/acting-tenant-middleware";

const RoleSchema = z.enum(["admin", "operator", "client"]);
const UserIdSchema = z.string().uuid();

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(`No se pudo verificar permisos: ${error.message}`);
  if (!data) throw new Error("Forbidden: solo administradores");
}

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((input: { search?: string }) =>
    z.object({ search: z.string().trim().max(120).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    let query = supabase
      .from("profiles")
      .select("id, full_name, email, document_id, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (data.search) {
      const s = `%${data.search}%`;
      query = query.or(
        `email.ilike.${s},full_name.ilike.${s},document_id.ilike.${s}`,
      );
    }

    const { data: profiles, error } = await query;
    if (error) throw new Error(error.message);

    const ids = (profiles ?? []).map((p: any) => p.id);
    let rolesByUser: Record<string, string[]> = {};
    if (ids.length > 0) {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      if (rolesErr) throw new Error(rolesErr.message);
      rolesByUser = (roles ?? []).reduce((acc: any, r: any) => {
        acc[r.user_id] = [...(acc[r.user_id] ?? []), r.role];
        return acc;
      }, {});
    }

    return (profiles ?? []).map((p: any) => ({
      ...p,
      roles: rolesByUser[p.id] ?? [],
    }));
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((input: { userId: string; role: string }) =>
    z.object({ userId: UserIdSchema, role: RoleSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });

    if (error && !error.message.includes("duplicate")) {
      throw new Error(error.message);
    }
    console.log(JSON.stringify({ event: "role.assign", actor: userId, target: data.userId, role: data.role }));
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((input: { userId: string; role: string }) =>
    z.object({ userId: UserIdSchema, role: RoleSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    if (data.role === "admin") {
      const { count, error: countErr } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if (countErr) throw new Error(countErr.message);
      if ((count ?? 0) <= 1) {
        throw new Error("No se puede quitar el último administrador del sistema");
      }
      if (data.userId === userId) {
        throw new Error("No podés quitarte tu propio rol de administrador");
      }
    }

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);

    console.log(JSON.stringify({ event: "role.revoke", actor: userId, target: data.userId, role: data.role }));
    return { ok: true };
  });