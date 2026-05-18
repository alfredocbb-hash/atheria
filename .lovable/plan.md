# Ajustes y Fase 2 — Pagos

## A. Ajuste super_admin (corrige Fase 1)

`alfredocbb@gmail.com` queda **solo como super_admin global**, sin pertenecer a ningún tenant.

- Migración corta:
  - `DELETE FROM tenant_members WHERE user_id = <uid de alfredocbb>;`
  - Confirmar que sigue en `super_admins`.
- Coopecur Connect queda como tenant semilla **sin admin asignado**. Cuando se necesite operar dentro de él, el super_admin:
  - lo administra desde el panel `/super/*`, o
  - se autoasigna `admin` puntualmente vía panel (impersonación / "agregar miembro").
- `current_tenant_id()` para el super_admin devolverá `NULL` (no tiene membresías). Las queries del super_admin van por la rama `is_super_admin()` de las RLS — ya está cubierto.

Impacto en UI (a tener en cuenta en fases siguientes):
- Si `isSuperAdmin && tenants.length === 0` → entra directo al panel `/super`, no al portal admin del tenant.
- El selector de tenant del super_admin lista **todos** los tenants (no solo los suyos).

## B. Fase 2 — Pagos con Mercado Pago (estructura provider-agnostic)

Objetivo: implementar **solo Mercado Pago** ahora, pero dejar la capa de billing abstracta para sumar Stripe u otros después sin reescribir.

### 1. Modelo de datos (migración)

- Renombrar/relajar campos en `tenants`:
  - `stripe_customer_id` → `billing_customer_id text`
  - `stripe_subscription_id` → `billing_subscription_id text`
  - Nuevo: `billing_provider text NOT NULL DEFAULT 'mercadopago'` (`'mercadopago' | 'stripe' | 'manual'`).
- `plans`:
  - `stripe_price_id` → `provider_price_id text` (id genérico que cada provider interpreta).
  - Nuevo: `mp_preapproval_plan_id text` (opcional, específico MP) para el caso de pre-approval.
- `subscription_events`:
  - `stripe_event_id` → `provider_event_id text UNIQUE`.
  - Nuevo: `provider text NOT NULL DEFAULT 'mercadopago'`.
- Seed: 3 planes vacíos (`basic`, `pro`, `enterprise`) con `is_active=false` para definir luego por módulos.

### 2. Capa abstracta de billing

`src/lib/billing/` (nuevo):
- `provider.ts` — interface `BillingProvider`:
  - `createCheckout({tenant, plan}) → { url }`
  - `createCustomerPortal({tenant}) → { url }` (opcional, MP no tiene equivalente directo)
  - `verifyWebhook(request) → { event, raw }`
  - `mapEvent(event) → { type, tenantId, status, subscriptionId, ... }`
- `mercadopago.ts` — implementación MP usando **Pre-approval (suscripciones)**:
  - Checkout: crea `preapproval` (`POST /preapproval`) → devuelve `init_point`.
  - Webhook: valida con `x-signature` HMAC + `MP_WEBHOOK_SECRET`.
  - Mapea `preapproval.updated` / `payment.created` a status interno.
- `index.ts` — `getBillingProvider(tenant)` devuelve la implementación según `tenant.billing_provider`. Hoy siempre MP.

### 3. Server functions y rutas

- `src/lib/billing-saas.functions.ts`:
  - `createCheckoutSession({planId})` → llama al provider del tenant activo.
  - `getCurrentSubscription()` → lee `tenants` + último evento.
  - `cancelSubscription()` → MP `PUT /preapproval/{id}` con `status=cancelled`.
- Webhook público: `src/routes/api/public/billing-webhook.$provider.ts` (splat por provider).
  - Hoy responde solo a `provider='mercadopago'`.
  - Verifica firma → guarda en `subscription_events` (idempotencia por `provider_event_id`) → actualiza `tenants.status` / `plan_id` / `billing_subscription_id`.
- Trial: al crear tenant, `status='trial'`, `trial_ends_at = now() + 14 days`. Job/cron simple (server fn invocado por pg_cron o por un endpoint) marca `suspended` los vencidos sin suscripción activa.

### 4. Secrets necesarios

Pediré con `add_secret` antes de codear:
- `MP_ACCESS_TOKEN` (production o test según corresponda).
- `MP_WEBHOOK_SECRET` (clave secreta del webhook MP, panel de Mercado Pago → Webhooks).

`stripe_*` no se pide; queda listo para sumar después.

### 5. UI mínima

- Página `/admin/facturacion-suscripcion` (solo `admin` del tenant):
  - Muestra plan actual, estado, `trial_ends_at`.
  - Botón "Suscribirme / Cambiar plan" → llama `createCheckoutSession` → redirige al `init_point` de MP.
  - Banner global de trial countdown + bloqueo si `status in ('suspended','cancelled')`.
- En el panel super_admin (se construye en Fase 3): CRUD de `plans` con campo `provider_price_id` + `mp_preapproval_plan_id`.

### 6. Fuera de alcance ahora

- Stripe real (queda la interface lista).
- Customer portal estilo Stripe (MP no lo tiene; se reemplaza con "cancelar suscripción" desde la app).
- Definir los precios/features concretos de los 3 planes.
- Multi-moneda.

## Orden de ejecución

1. Migración A (limpiar membresía de alfredocbb).
2. Migración B (renombrar columnas billing + agregar provider).
3. Pedir secrets MP.
4. Implementar capa `billing/` + provider MP.
5. Webhook público + server fns de checkout/estado.
6. UI de suscripción del tenant + bloqueo por estado.

¿Avanzo con esto?