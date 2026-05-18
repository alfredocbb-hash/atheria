import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPublicPlans = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("plans")
      .select("id, code, name, description, price_cents, currency, features")
      .eq("is_active", true)
      .order("price_cents", { ascending: true });
    if (error) {
      console.error("getPublicPlans error", error);
      return { plans: [] };
    }
    return { plans: data ?? [] };
  }
);

const SearchInput = z.object({
  q: z.string().trim().min(1).max(80),
});

export const searchPublicTenants = createServerFn({ method: "POST" })
  .inputValidator((input) => SearchInput.parse(input))
  .handler(async ({ data }) => {
    const term = `%${data.q.toLowerCase()}%`;
    const { data: rows, error } = await supabaseAdmin
      .from("tenants")
      .select("id, name, slug, status")
      .in("status", ["active", "trial"])
      .or(`name.ilike.${term},slug.ilike.${term}`)
      .limit(10);
    if (error) {
      console.error("searchPublicTenants error", error);
      return { results: [] };
    }
    return {
      results: (rows ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        status: r.status,
      })),
    };
  });

const ContactInput = z.object({
  name: z.string().trim().min(2).max(120),
  organization: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(2000),
});

export const submitContactRequest = createServerFn({ method: "POST" })
  .inputValidator((input) => ContactInput.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("contact_requests").insert({
      name: data.name,
      organization: data.organization,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
      source: "marketing-site",
    });
    if (error) {
      console.error("submitContactRequest error", error);
      throw new Error("No pudimos enviar tu mensaje. Probá nuevamente.");
    }
    return { ok: true };
  });