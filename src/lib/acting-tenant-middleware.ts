import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getActingTenantId } from "./acting-tenant";

/**
 * Client middleware: attaches the locally-stored "acting tenant" header
 * to every serverFn call so super admins can act as a chosen tenant.
 */
export const attachActingTenant = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const id = getActingTenantId();
    if (!id) return next();
    return next({ headers: { "x-acting-tenant": id } });
  });

/**
 * Server middleware: if an `x-acting-tenant` header is present, rebuild
 * the supabase client so PostgREST receives the header on every query.
 * Should run AFTER `requireSupabaseAuth`.
 */
export const withActingTenant = createMiddleware({ type: "function" }).server(
  async ({ next, context }) => {
    const acting = getRequestHeader("x-acting-tenant");
    if (!acting) return next() as never;
    const authHeader =
      getRequestHeader("authorization") || getRequestHeader("Authorization");
    if (!authHeader) return next() as never;

    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
          "x-acting-tenant": acting,
        },
      },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const merged = { ...(context as object), supabase };
    return next({ context: merged }) as never;
  },
);