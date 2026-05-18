import { mercadopagoProvider } from "./mercadopago";
import type { BillingProvider, BillingTenant } from "./provider";

export * from "./provider";
export { mercadopagoProvider };

/**
 * Resolve the billing provider implementation for a tenant.
 * Today only MercadoPago is wired; other providers will be added later.
 */
export function getBillingProvider(
  tenant: Pick<BillingTenant, "billing_provider">,
): BillingProvider {
  switch (tenant.billing_provider) {
    case "mercadopago":
    case "manual":
      return mercadopagoProvider;
    case "stripe":
      throw new Error("Stripe billing provider no implementado todavía");
    default:
      return mercadopagoProvider;
  }
}

export function getProviderById(id: string): BillingProvider {
  switch (id) {
    case "mercadopago":
      return mercadopagoProvider;
    default:
      throw new Error(`Billing provider desconocido: ${id}`);
  }
}