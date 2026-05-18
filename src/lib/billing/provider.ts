/**
 * Billing provider abstraction.
 *
 * Today only MercadoPago is wired (see ./mercadopago). The interface is
 * deliberately kept provider-agnostic so Stripe (or others) can be added
 * later without touching server functions or the webhook route.
 */

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled";

export interface BillingTenant {
  id: string;
  name: string;
  billing_customer_id: string | null;
  billing_subscription_id: string | null;
  billing_provider: string;
}

export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  provider_price_id: string | null;
  mp_preapproval_plan_id: string | null;
}

export interface CheckoutResult {
  url: string;
  subscriptionId?: string;
  customerId?: string;
}

export interface MappedEvent {
  /** Provider event id — used for idempotency. */
  providerEventId: string;
  /** Domain event type (normalized across providers). */
  type:
    | "subscription.created"
    | "subscription.updated"
    | "subscription.cancelled"
    | "subscription.past_due"
    | "payment.succeeded"
    | "payment.failed"
    | "unknown";
  tenantId: string | null;
  subscriptionId: string | null;
  customerId: string | null;
  status: SubscriptionStatus | null;
  raw: unknown;
}

export interface BillingProvider {
  readonly id: string;
  isConfigured(): boolean;
  createCheckout(args: {
    tenant: BillingTenant;
    plan: BillingPlan;
    payerEmail: string;
    successUrl: string;
  }): Promise<CheckoutResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  /** Verify webhook signature and parse body. Throws on invalid signature. */
  verifyWebhook(request: Request, rawBody: string): Promise<unknown>;
  mapEvent(event: unknown): MappedEvent;
}

export class BillingNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`Pagos pendientes de activación (${provider})`);
    this.name = "BillingNotConfiguredError";
  }
}