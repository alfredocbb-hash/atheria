import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getProviderById, BillingNotConfiguredError } from "@/lib/billing";

export const Route = createFileRoute("/api/public/billing-webhook/$provider")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const providerId = params.provider;
        let provider;
        try {
          provider = getProviderById(providerId);
        } catch {
          return new Response("Unknown provider", { status: 404 });
        }
        if (!provider.isConfigured()) {
          return new Response("Billing not configured", { status: 503 });
        }

        const rawBody = await request.text();
        let event: unknown;
        try {
          event = await provider.verifyWebhook(request, rawBody);
        } catch (e) {
          if (e instanceof BillingNotConfiguredError) {
            return new Response("Billing not configured", { status: 503 });
          }
          return new Response("Invalid signature", { status: 401 });
        }

        const mapped = provider.mapEvent(event);

        // Idempotency: skip if already processed.
        const { data: existing } = await supabaseAdmin
          .from("subscription_events")
          .select("id")
          .eq("provider_event_id", mapped.providerEventId)
          .maybeSingle();
        if (existing) return new Response("ok", { status: 200 });

        await supabaseAdmin.from("subscription_events").insert({
          tenant_id: mapped.tenantId,
          provider: provider.id,
          provider_event_id: mapped.providerEventId,
          type: mapped.type,
          payload: mapped.raw as any,
        });

        if (mapped.tenantId) {
          const update: Record<string, unknown> = {};
          if (mapped.status) update.status = mapped.status;
          if (mapped.subscriptionId) update.billing_subscription_id = mapped.subscriptionId;
          if (mapped.customerId) update.billing_customer_id = mapped.customerId;
          if (Object.keys(update).length > 0) {
            await supabaseAdmin.from("tenants").update(update).eq("id", mapped.tenantId);
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});