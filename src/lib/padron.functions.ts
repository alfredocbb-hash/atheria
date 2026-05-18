import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureStaff(supabase: any, userId: string) {
  const [{ data: isAdmin }, { data: isOp }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "operator" }),
  ]);
  if (!isAdmin && !isOp) throw new Error("Forbidden: solo personal autorizado");
}

async function ensureAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden: requiere rol de administrador");
}

// ---------- Members ----------
const MemberInput = z.object({
  member_number: z.string().trim().min(1).max(40),
  full_name: z.string().trim().min(1).max(160),
  document_id: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  user_id: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { search?: string }) =>
    z.object({ search: z.string().trim().max(120).optional() }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    let q = supabase
      .from("members")
      .select("id, member_number, full_name, document_id, email, phone, status, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(`member_number.ilike.${s},full_name.ilike.${s},document_id.ilike.${s},email.ilike.${s}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MemberInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const payload = {
      ...data,
      document_id: data.document_id || null,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null,
      user_id: data.user_id || null,
    };
    const { data: row, error } = await supabase.from("members").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), patch: MemberInput.partial() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const { error } = await supabase.from("members").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const [{ count: sup }, { count: inv }, { count: cl }] = await Promise.all([
      supabase.from("supplies").select("id", { count: "exact", head: true }).eq("member_id", data.id),
      supabase.from("invoices").select("id", { count: "exact", head: true }).eq("member_id", data.id),
      supabase.from("claims").select("id", { count: "exact", head: true }).eq("member_id", data.id),
    ]);
    const blockers: string[] = [];
    if ((sup ?? 0) > 0) blockers.push(`${sup} suministro(s)`);
    if ((inv ?? 0) > 0) blockers.push(`${inv} factura(s)`);
    if ((cl ?? 0) > 0) blockers.push(`${cl} reclamo(s)`);
    if (blockers.length) throw new Error(`No se puede eliminar: tiene ${blockers.join(", ")}. Marcalo como inactivo en su lugar.`);
    const { error } = await supabase.from("members").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Supplies ----------
const AddressInput = z.object({
  street: z.string().trim().min(1).max(160),
  street_number: z.string().trim().max(20).optional().or(z.literal("")),
  floor: z.string().trim().max(10).optional().or(z.literal("")),
  apartment: z.string().trim().max(10).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(120),
  province: z.string().trim().min(1).max(120),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const SupplyInput = z.object({
  supply_number: z.string().trim().min(1).max(40),
  member_id: z.string().uuid(),
  service_type: z.enum(["water", "gas", "electricity"]),
  status: z.enum(["active", "suspended", "inactive", "pending"]).default("pending"),
  tariff_category: z.string().trim().max(60).optional().or(z.literal("")),
  activated_at: z.string().optional().or(z.literal("")),
  address: AddressInput,
});

export const listSupplies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { search?: string; service_type?: string; status?: string }) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        service_type: z.enum(["water", "gas", "electricity"]).optional(),
        status: z.enum(["active", "suspended", "inactive", "pending"]).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    let q = supabase
      .from("supplies")
      .select(
        "id, supply_number, service_type, status, tariff_category, activated_at, created_at, member:members(id, member_number, full_name), address:supply_addresses(id, street, street_number, city, province)",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.service_type) q = q.eq("service_type", data.service_type);
    if (data.status) q = q.eq("status", data.status);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(`supply_number.ilike.${s},tariff_category.ilike.${s}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createSupply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SupplyInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);

    const addrPayload = {
      street: data.address.street,
      street_number: data.address.street_number || null,
      floor: data.address.floor || null,
      apartment: data.address.apartment || null,
      city: data.address.city,
      province: data.address.province,
      postal_code: data.address.postal_code || null,
      notes: data.address.notes || null,
    };
    const { data: addr, error: addrErr } = await supabase
      .from("supply_addresses")
      .insert(addrPayload)
      .select("id")
      .single();
    if (addrErr) throw new Error(addrErr.message);

    const { data: row, error } = await supabase
      .from("supplies")
      .insert({
        supply_number: data.supply_number,
        member_id: data.member_id,
        address_id: addr.id,
        service_type: data.service_type,
        status: data.status,
        tariff_category: data.tariff_category || null,
        activated_at: data.activated_at || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateSupplyStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["active", "suspended", "inactive", "pending"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const { error } = await supabase.from("supplies").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SupplyPatch = z.object({
  supply_number: z.string().trim().min(1).max(40).optional(),
  service_type: z.enum(["water", "gas", "electricity"]).optional(),
  status: z.enum(["active", "suspended", "inactive", "pending"]).optional(),
  tariff_category: z.string().trim().max(60).optional().or(z.literal("")),
  activated_at: z.string().optional().or(z.literal("")),
});

export const updateSupply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), patch: SupplyPatch }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const patch: any = { ...data.patch };
    if (patch.tariff_category === "") patch.tariff_category = null;
    if (patch.activated_at === "") patch.activated_at = null;
    const { error } = await supabase.from("supplies").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSupply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const [{ count: inv }, { count: cl }, { count: mt }] = await Promise.all([
      supabase.from("invoices").select("id", { count: "exact", head: true }).eq("supply_id", data.id),
      supabase.from("claims").select("id", { count: "exact", head: true }).eq("supply_id", data.id),
      supabase.from("meters").select("id", { count: "exact", head: true }).eq("supply_id", data.id),
    ]);
    const blockers: string[] = [];
    if ((inv ?? 0) > 0) blockers.push(`${inv} factura(s)`);
    if ((cl ?? 0) > 0) blockers.push(`${cl} reclamo(s)`);
    if ((mt ?? 0) > 0) blockers.push(`${mt} medidor(es)`);
    if (blockers.length) throw new Error(`No se puede eliminar: tiene ${blockers.join(", ")}.`);
    const { data: row } = await supabase.from("supplies").select("address_id").eq("id", data.id).single();
    const { error } = await supabase.from("supplies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (row?.address_id) {
      await supabase.from("supply_addresses").delete().eq("id", row.address_id);
    }
    return { ok: true };
  });

// ---------- Meters ----------
const MeterInput = z.object({
  supply_id: z.string().uuid(),
  serial_number: z.string().trim().min(1).max(60),
  brand: z.string().trim().max(60).optional().or(z.literal("")),
  model: z.string().trim().max(60).optional().or(z.literal("")),
  installed_at: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "removed", "faulty"]).default("active"),
});

export const listMetersBySupply = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { supply_id: string }) =>
    z.object({ supply_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("meters")
      .select("*")
      .eq("supply_id", data.supply_id)
      .order("installed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createMeter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MeterInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const { data: row, error } = await supabase
      .from("meters")
      .insert({
        supply_id: data.supply_id,
        serial_number: data.serial_number,
        brand: data.brand || null,
        model: data.model || null,
        installed_at: data.installed_at || null,
        status: data.status,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateMeter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), patch: MeterInput.partial() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const patch: any = { ...data.patch };
    if (patch.brand === "") patch.brand = null;
    if (patch.model === "") patch.model = null;
    if (patch.installed_at === "") patch.installed_at = null;
    const { error } = await supabase.from("meters").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMeter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { count } = await supabase
      .from("meter_readings")
      .select("id", { count: "exact", head: true })
      .eq("meter_id", data.id);
    if ((count ?? 0) > 0) throw new Error(`No se puede eliminar: el medidor tiene ${count} lectura(s).`);
    const { error } = await supabase.from("meters").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Client-facing ----------
export const listMyMemberAndSupplies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: member } = await supabase
      .from("members")
      .select("id, member_number, full_name, document_id, email, phone, status")
      .eq("user_id", userId)
      .maybeSingle();
    if (!member) return { member: null, supplies: [] };

    const { data: supplies, error } = await supabase
      .from("supplies")
      .select(
        "id, supply_number, service_type, status, tariff_category, activated_at, address:supply_addresses(street, street_number, city, province), meters(serial_number, status)",
      )
      .eq("member_id", member.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { member, supplies: supplies ?? [] };
  });

// ---------- Self-service link ----------
const LinkMyMemberInput = z.object({
  member_number: z.string().trim().min(1).max(40).regex(/^[0-9A-Za-z\-_.]+$/, "Formato inválido"),
  document_id: z.string().trim().min(6).max(20).regex(/^[0-9A-Za-z.\-]+$/, "Formato inválido"),
});

export const linkMyMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LinkMyMemberInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: memberId, error } = await supabase.rpc("link_my_member", {
      _member_number: data.member_number,
      _document_id: data.document_id,
    });
    if (error) throw new Error(error.message);
    return { member_id: memberId as string };
  });