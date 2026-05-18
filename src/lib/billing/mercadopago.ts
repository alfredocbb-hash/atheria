import {
  type BillingProvider,
  type BillingTenant,
  type BillingPlan,
  type CheckoutResult,
  type MappedEvent,
  type SubscriptionStatus,
  BillingNotConfiguredError,
} from "./provider";

const MP_API = "https://api.mercadopago.com";

function requireAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new BillingNotConfiguredError("mercadopago");
  return token;
}

function requireWebhookSecret(): string {
  const sec = process.env.MP_WEBHOOK_SECRET;
  if (!sec) throw new BillingNotConfiguredError("mercadopago");
  return sec;
}

function mapMpStatus(s: string | undefined | null): SubscriptionStatus | null {
  switch (s) {
    case "authorized":
    case "active":
      return "active";
    case "paused":
      return "past_due";
    case "cancelled":
    case "finished":
      return "cancelled";
    case "pending":
      return "trial";
    default:
      return null;
  }
}

export const mercadopagoProvider: BillingProvider = {
  id: "mercadopago",

  isConfigured() {
    return !!process.env.MP_ACCESS_TOKEN;
  },

  async createCheckout({
    tenant,
    plan,
    payerEmail,
    successUrl,
  }: {
    tenant: BillingTenant;
    plan: BillingPlan;
    payerEmail: string;
    successUrl: string;
  }): Promise<CheckoutResult> {
    const token = requireAccessToken();
    const body: Record<string, unknown> = {
      reason: `${plan.name} — ${tenant.name}`,
      external_reference: `${tenant.id}:${plan.id}`,
      payer_email: payerEmail,
      back_url: successUrl,
      status: "pending",
    };
    if (plan.mp_preapproval_plan_id) {
      body.preapproval_plan_id = plan.mp_preapproval_plan_id;
    } else {
      body.auto_recurring = {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plan.price_cents / 100,
        currency_id: plan.currency,
      };
    }

    const res = await fetch(`${MP_API}/preapproval`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`MP preapproval failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as {
      id: string;
      init_point?: string;
      payer_id?: number | string;
    };
    return {
      url: json.init_point ?? "",
      subscriptionId: json.id,
      customerId: json.payer_id ? String(json.payer_id) : undefined,
    };
  },

  async cancelSubscription(subscriptionId: string) {
    const token = requireAccessToken();
    const res = await fetch(`${MP_API}/preapproval/${subscriptionId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (!res.ok) {
      throw new Error(`MP cancel failed: ${res.status} ${await res.text()}`);
    }
  },

  async verifyWebhook(request: Request, rawBody: string): Promise<unknown> {
    const secret = requireWebhookSecret();
    // MP sends `x-signature: ts=...,v1=...` and `x-request-id`.
    const sigHeader = request.headers.get("x-signature") ?? "";
    const requestId = request.headers.get("x-request-id") ?? "";
    const url = new URL(request.url);
    const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";
    const parts = Object.fromEntries(
      sigHeader.split(",").map((p) => {
        const [k, v] = p.split("=");
        return [k?.trim() ?? "", v?.trim() ?? ""];
      }),
    );
    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) throw new Error("Missing MP signature");

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", secret).update(manifest).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(v1);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("Invalid MP signature");
    }
    try {
      return JSON.parse(rawBody);
    } catch {
      return { raw: rawBody };
    }
  },

  mapEvent(event: unknown): MappedEvent {
    const e = (event ?? {}) as {
      id?: string | number;
      type?: string;
      action?: string;
      data?: { id?: string };
      external_reference?: string;
      status?: string;
    };
    const tenantId = e.external_reference?.split(":")[0] ?? null;
    const type = e.type ?? e.action ?? "";
    let mappedType: MappedEvent["type"] = "unknown";
    if (type.startsWith("subscription") || type.startsWith("preapproval")) {
      if (type.includes("cancel")) mappedType = "subscription.cancelled";
      else if (type.includes("create")) mappedType = "subscription.created";
      else mappedType = "subscription.updated";
    } else if (type.startsWith("payment")) {
      mappedType = "payment.succeeded";
    }
    return {
      providerEventId: String(e.id ?? e.data?.id ?? crypto.randomUUID()),
      type: mappedType,
      tenantId,
      subscriptionId: e.data?.id ?? null,
      customerId: null,
      status: mapMpStatus(e.status),
      raw: event,
    };
  },
};