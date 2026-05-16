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

// ---------- Tariffs ----------
const TariffInput = z.object({
  name: z.string().trim().min(1).max(120),
  service_type: z.enum(["water", "gas", "electricity"]),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  fixed_charge: z.coerce.number().min(0).max(1e9),
  unit_price: z.coerce.number().min(0).max(1e9),
  currency: z.string().trim().min(1).max(8).default("ARS"),
  valid_from: z.string().min(1),
  valid_to: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export const listTariffs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("tariffs").select("*").order("valid_from", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createTariff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TariffInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const payload = {
      ...data,
      category: data.category || null,
      valid_to: data.valid_to || null,
    };
    const { data: row, error } = await supabase.from("tariffs").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const toggleTariffActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const { error } = await supabase.from("tariffs").update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Readings ----------
const ReadingInput = z.object({
  meter_id: z.string().uuid(),
  reading_date: z.string().min(1),
  reading_value: z.coerce.number().min(0),
  source: z.enum(["manual", "estimated", "remote"]).default("manual"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const listReadings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { meter_id?: string }) =>
    z.object({ meter_id: z.string().uuid().optional() }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    let q = supabase
      .from("meter_readings")
      .select("id, meter_id, reading_date, reading_value, consumption, source, notes, created_at, meter:meters(serial_number, supply:supplies(supply_number, member:members(full_name)))")
      .order("reading_date", { ascending: false })
      .limit(200);
    if (data.meter_id) q = q.eq("meter_id", data.meter_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ReadingInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    // get previous reading
    const { data: prev } = await supabase
      .from("meter_readings")
      .select("reading_value, reading_date")
      .eq("meter_id", data.meter_id)
      .lt("reading_date", data.reading_date)
      .order("reading_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    const consumption = prev ? Math.max(0, Number(data.reading_value) - Number(prev.reading_value)) : 0;
    const { data: row, error } = await supabase
      .from("meter_readings")
      .insert({
        meter_id: data.meter_id,
        reading_date: data.reading_date,
        reading_value: data.reading_value,
        consumption,
        source: data.source,
        notes: data.notes || null,
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Invoices ----------
const GenerateInvoiceInput = z.object({
  supply_id: z.string().uuid(),
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  due_date: z.string().min(1),
  reading_current_id: z.string().uuid().optional(),
  tariff_id: z.string().uuid().optional(),
  tax_rate: z.coerce.number().min(0).max(1).default(0),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const generateInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => GenerateInvoiceInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);

    // Load supply
    const { data: supply, error: supErr } = await supabase
      .from("supplies")
      .select("id, supply_number, member_id, service_type, tariff_category, meters(id)")
      .eq("id", data.supply_id)
      .single();
    if (supErr || !supply) throw new Error("Suministro no encontrado");

    // Resolve tariff
    let tariff: any = null;
    if (data.tariff_id) {
      const { data: t } = await supabase.from("tariffs").select("*").eq("id", data.tariff_id).single();
      tariff = t;
    } else {
      const { data: t } = await supabase
        .from("tariffs")
        .select("*")
        .eq("service_type", supply.service_type)
        .eq("is_active", true)
        .lte("valid_from", data.period_end)
        .order("valid_from", { ascending: false })
        .limit(1)
        .maybeSingle();
      tariff = t;
    }
    if (!tariff) throw new Error("No hay tarifa vigente para este servicio");

    // Resolve readings: previous (last before period_start) and current
    const meterIds = (supply.meters || []).map((m: any) => m.id);
    let prevReading: any = null;
    let currentReading: any = null;
    if (meterIds.length > 0) {
      const { data: cur } = data.reading_current_id
        ? await supabase.from("meter_readings").select("*").eq("id", data.reading_current_id).single()
        : await supabase
            .from("meter_readings")
            .select("*")
            .in("meter_id", meterIds)
            .lte("reading_date", data.period_end)
            .gte("reading_date", data.period_start)
            .order("reading_date", { ascending: false })
            .limit(1)
            .maybeSingle();
      currentReading = cur;
      if (currentReading) {
        const { data: prev } = await supabase
          .from("meter_readings")
          .select("*")
          .eq("meter_id", currentReading.meter_id)
          .lt("reading_date", currentReading.reading_date)
          .order("reading_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        prevReading = prev;
      }
    }

    const consumption = currentReading
      ? Math.max(0, Number(currentReading.reading_value) - Number(prevReading?.reading_value ?? currentReading.reading_value))
      : 0;

    const fixed = Number(tariff.fixed_charge);
    const unitPrice = Number(tariff.unit_price);
    const consumptionAmount = +(consumption * unitPrice).toFixed(2);
    const subtotal = +(fixed + consumptionAmount).toFixed(2);
    const taxAmount = +(subtotal * Number(data.tax_rate)).toFixed(2);
    const total = +(subtotal + taxAmount).toFixed(2);

    // Generate invoice number
    const yr = new Date(data.issue_date ?? Date.now()).getFullYear?.() ?? new Date().getFullYear();
    const invoiceNumber = `F-${yr}-${Date.now().toString().slice(-8)}`;

    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        supply_id: supply.id,
        member_id: supply.member_id,
        period_start: data.period_start,
        period_end: data.period_end,
        due_date: data.due_date,
        subtotal,
        tax_amount: taxAmount,
        total,
        balance: total,
        currency: tariff.currency,
        status: "issued",
        reading_previous_id: prevReading?.id ?? null,
        reading_current_id: currentReading?.id ?? null,
        notes: data.notes || null,
      })
      .select()
      .single();
    if (invErr) throw new Error(invErr.message);

    const items: any[] = [
      {
        invoice_id: inv.id,
        kind: "fixed_charge",
        description: `Cargo fijo ${tariff.name}`,
        quantity: 1,
        unit_price: fixed,
        amount: fixed,
      },
    ];
    if (consumption > 0 || currentReading) {
      items.push({
        invoice_id: inv.id,
        kind: "consumption",
        description: `Consumo (${consumption} unidades × ${unitPrice})`,
        quantity: consumption,
        unit_price: unitPrice,
        amount: consumptionAmount,
      });
    }
    if (taxAmount > 0) {
      items.push({
        invoice_id: inv.id,
        kind: "tax",
        description: `Impuestos (${(Number(data.tax_rate) * 100).toFixed(2)}%)`,
        quantity: 1,
        unit_price: taxAmount,
        amount: taxAmount,
      });
    }
    const { error: itErr } = await supabase.from("invoice_items").insert(items);
    if (itErr) throw new Error(itErr.message);

    return inv;
  });

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { search?: string; status?: string; supply_id?: string }) =>
    z.object({
      search: z.string().trim().max(120).optional(),
      status: z.enum(["draft", "issued", "paid", "overdue", "void"]).optional(),
      supply_id: z.string().uuid().optional(),
    }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    let q = supabase
      .from("invoices")
      .select("id, invoice_number, period_start, period_end, issue_date, due_date, subtotal, tax_amount, total, balance, currency, status, member:members(full_name, member_number), supply:supplies(supply_number, service_type)")
      .order("issue_date", { ascending: false })
      .limit(300);
    if (data.status) q = q.eq("status", data.status);
    if (data.supply_id) q = q.eq("supply_id", data.supply_id);
    if (data.search) q = q.ilike("invoice_number", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getInvoiceDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, member:members(full_name, member_number, document_id, email), supply:supplies(supply_number, service_type, address:supply_addresses(street, street_number, city, province)), items:invoice_items(*), payments(*)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return invoice;
  });

export const voidInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const { error } = await supabase.from("invoices").update({ status: "void", balance: 0 }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Payments ----------
const PaymentInput = z.object({
  invoice_id: z.string().uuid(),
  amount: z.coerce.number().positive().max(1e12),
  payment_date: z.string().min(1),
  method: z.enum(["cash", "transfer", "card", "debit", "other"]).default("cash"),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const registerPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PaymentInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const { data: row, error } = await supabase
      .from("payments")
      .insert({
        invoice_id: data.invoice_id,
        amount: data.amount,
        payment_date: data.payment_date,
        method: data.method,
        reference: data.reference || null,
        notes: data.notes || null,
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Client-facing ----------
export const listMyInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: member } = await supabase
      .from("members").select("id").eq("user_id", userId).maybeSingle();
    if (!member) return [];
    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, period_start, period_end, issue_date, due_date, total, balance, currency, status, supply:supplies(supply_number, service_type)")
      .eq("member_id", member.id)
      .order("issue_date", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Helper for selectors
export const listSuppliesLite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureStaff(supabase, userId);
    const { data, error } = await supabase
      .from("supplies")
      .select("id, supply_number, service_type, member:members(full_name), meters(id, serial_number)")
      .order("supply_number")
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
