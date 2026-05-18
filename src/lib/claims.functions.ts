import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withActingTenant } from "@/lib/acting-tenant-middleware";

async function getTenantId(supabase: any): Promise<string> {
  const { data, error } = await supabase.rpc("current_tenant_id");
  if (error) throw new Error(`Tenant: ${error.message}`);
  if (!data) throw new Error("No tenés una cooperativa activa");
  return data as string;
}
async function isStaff(supabase: any, _userId: string): Promise<boolean> {
  try {
    const tid = await getTenantId(supabase);
    const [{ data: ok }, { data: sa }] = await Promise.all([
      supabase.rpc("is_tenant_member", { _tenant: tid, _role: "staff" }),
      supabase.rpc("is_super_admin"),
    ]);
    return !!ok || !!sa;
  } catch {
    return false;
  }
}
async function ensureStaff(supabase: any, _userId: string): Promise<string> {
  const tid = await getTenantId(supabase);
  const [{ data: ok }, { data: sa }] = await Promise.all([
    supabase.rpc("is_tenant_member", { _tenant: tid, _role: "staff" }),
    supabase.rpc("is_super_admin"),
  ]);
  if (!ok && !sa) throw new Error("Forbidden: solo personal autorizado");
  return tid;
}
async function ensureAdmin(supabase: any, _userId: string): Promise<string> {
  const tid = await getTenantId(supabase);
  const [{ data: ok }, { data: sa }] = await Promise.all([
    supabase.rpc("is_tenant_member", { _tenant: tid, _role: "admin" }),
    supabase.rpc("is_super_admin"),
  ]);
  if (!ok && !sa) throw new Error("Forbidden: requiere rol de administrador");
  return tid;
}

const Category = z.enum(["water_outage", "gas_outage", "electricity_outage", "leak", "meter", "billing", "other"]);
const Priority = z.enum(["low", "medium", "high", "urgent"]);
const Status = z.enum(["open", "assigned", "in_progress", "resolved", "cancelled"]);
const Specialty = z.enum(["water", "gas", "electricity", "general"]);
const WOStatus = z.enum(["scheduled", "in_progress", "completed", "cancelled"]);

// ---------- Claims ----------
const ClaimCreateInput = z.object({
  member_id: z.string().uuid(),
  supply_id: z.string().uuid().nullable().optional(),
  category: Category.default("other"),
  priority: Priority.default("medium"),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  location: z.string().trim().max(240).optional().or(z.literal("")),
});

async function nextClaimNumber(supabase: any) {
  const year = new Date().getFullYear();
  const prefix = `R-${year}-`;
  const { data } = await supabase
    .from("claims")
    .select("claim_number")
    .like("claim_number", `${prefix}%`)
    .order("claim_number", { ascending: false })
    .limit(1);
  let n = 1;
  if (data && data[0]) {
    const m = /-(\d+)$/.exec(data[0].claim_number);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `${prefix}${String(n).padStart(5, "0")}`;
}

export const listClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        status: Status.optional(),
        priority: Priority.optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    let q = supabase
      .from("claims")
      .select("*, members:member_id(id, member_number, full_name), supplies:supply_id(id, supply_number, service_type)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status) q = q.eq("status", data.status);
    if (data.priority) q = q.eq("priority", data.priority);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(`claim_number.ilike.${s},title.ilike.${s},location.ilike.${s}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getClaim = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: claim, error } = await supabase
      .from("claims")
      .select(
        "*, members:member_id(id, member_number, full_name), supplies:supply_id(id, supply_number, service_type)",
      )
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const [{ data: wos }, { data: comments }] = await Promise.all([
      supabase
        .from("work_orders")
        .select("*, crews:crew_id(id, name, specialty)")
        .eq("claim_id", data.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("claim_comments")
        .select("*")
        .eq("claim_id", data.id)
        .order("created_at", { ascending: true }),
    ]);
    return { claim, work_orders: wos ?? [], comments: comments ?? [] };
  });

export const createClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) => ClaimCreateInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tenant_id = await getTenantId(supabase);
    // If not staff, force member_id to belong to caller
    if (!(await isStaff(supabase, userId))) {
      const { data: m } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", userId)
        .eq("id", data.member_id)
        .maybeSingle();
      if (!m) throw new Error("Forbidden: no podés crear reclamos para este socio");
    }
    const claim_number = await nextClaimNumber(supabase);
    const payload = {
      claim_number,
      member_id: data.member_id,
      supply_id: data.supply_id || null,
      category: data.category,
      priority: data.priority,
      title: data.title,
      description: data.description || null,
      location: data.location || null,
      opened_by: userId,
      status: "open" as const,
      tenant_id,
    };
    const { data: row, error } = await supabase.from("claims").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateClaimStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), status: Status, priority: Priority.optional() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const patch: any = { status: data.status };
    if (data.priority) patch.priority = data.priority;
    if (data.status === "resolved") patch.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("claims").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ClaimPatch = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  category: Category.optional(),
  priority: Priority.optional(),
  location: z.string().trim().max(240).optional().or(z.literal("")),
  supply_id: z.string().uuid().nullable().optional(),
});

export const updateClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), patch: ClaimPatch }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const patch: any = { ...data.patch };
    if (patch.description === "") patch.description = null;
    if (patch.location === "") patch.location = null;
    const { error } = await supabase.from("claims").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    await supabase.from("work_orders").delete().eq("claim_id", data.id);
    await supabase.from("claim_comments").delete().eq("claim_id", data.id);
    const { error } = await supabase.from("claims").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteClaimComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { error } = await supabase.from("claim_comments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addClaimComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) =>
    z
      .object({
        claim_id: z.string().uuid(),
        body: z.string().trim().min(1).max(2000),
        is_internal: z.boolean().default(false),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tenant_id = await getTenantId(supabase);
    const staff = await isStaff(supabase, userId);
    const payload = {
      claim_id: data.claim_id,
      body: data.body,
      author_id: userId,
      is_internal: staff ? data.is_internal : false,
      tenant_id,
    };
    const { data: row, error } = await supabase.from("claim_comments").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Crews ----------
const CrewInput = z.object({
  name: z.string().trim().min(1).max(120),
  specialty: Specialty.default("general"),
  is_active: z.boolean().default(true),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const listCrews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const { data, error } = await supabase
      .from("crews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCrew = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid().optional(), patch: CrewInput }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tenant_id = await ensureStaff(supabase, userId);
    const payload = { ...data.patch, notes: data.patch.notes || null, tenant_id };
    if (data.id) {
      const { error } = await supabase.from("crews").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabase.from("crews").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCrew = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { count } = await supabase
      .from("work_orders").select("id", { count: "exact", head: true })
      .eq("crew_id", data.id).in("status", ["scheduled", "in_progress"]);
    if ((count ?? 0) > 0) throw new Error(`No se puede eliminar: tiene ${count} orden(es) activa(s).`);
    const { error } = await supabase.from("crews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Work Orders ----------
const WOInput = z.object({
  claim_id: z.string().uuid(),
  crew_id: z.string().uuid(),
  scheduled_at: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const createWorkOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) => WOInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tenant_id = await ensureStaff(supabase, userId);
    const payload = {
      claim_id: data.claim_id,
      crew_id: data.crew_id,
      scheduled_at: data.scheduled_at ? new Date(data.scheduled_at).toISOString() : null,
      notes: data.notes || null,
      created_by: userId,
      status: "scheduled" as const,
      tenant_id,
    };
    const { data: row, error } = await supabase.from("work_orders").insert(payload).select().single();
    if (error) throw new Error(error.message);
    // Sync claim status to assigned (only if currently open)
    await supabase.from("claims").update({ status: "assigned" }).eq("id", data.claim_id).eq("status", "open");
    return row;
  });

export const updateWorkOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: WOStatus,
        notes: z.string().trim().max(2000).optional().or(z.literal("")),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const patch: any = { status: data.status };
    const now = new Date().toISOString();
    if (data.status === "in_progress") patch.started_at = now;
    if (data.status === "completed") patch.completed_at = now;
    if (data.notes !== undefined) patch.notes = data.notes || null;
    const { data: wo, error } = await supabase
      .from("work_orders")
      .update(patch)
      .eq("id", data.id)
      .select("claim_id")
      .single();
    if (error) throw new Error(error.message);
    // Sync claim status
    if (data.status === "in_progress") {
      await supabase.from("claims").update({ status: "in_progress" }).eq("id", wo.claim_id);
    } else if (data.status === "completed") {
      await supabase
        .from("claims")
        .update({ status: "resolved", resolved_at: now })
        .eq("id", wo.claim_id);
    }
    return { ok: true };
  });

const WOPatch = z.object({
  crew_id: z.string().uuid().optional(),
  scheduled_at: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const updateWorkOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), patch: WOPatch }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const patch: any = { ...data.patch };
    if (patch.scheduled_at === "") patch.scheduled_at = null;
    else if (patch.scheduled_at) patch.scheduled_at = new Date(patch.scheduled_at).toISOString();
    if (patch.notes === "") patch.notes = null;
    const { error } = await supabase.from("work_orders").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWorkOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { error } = await supabase.from("work_orders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Client-facing ----------
export const listMyClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth, withActingTenant])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: member } = await supabase
      .from("members")
      .select("id, member_number, full_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (!member) return { member: null, claims: [] };
    const { data: claims, error } = await supabase
      .from("claims")
      .select("*, supplies:supply_id(supply_number, service_type)")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { member, claims: claims ?? [] };
  });