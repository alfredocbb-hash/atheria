# Fase 2 — Estructura de billing sin credenciales MP

Migración A+B ya aplicadas (super_admin sin tenant, tablas billing agnósticas, 3 planes vacíos). Ahora dejamos toda la **estructura de pagos lista** sin pedir credenciales todavía. Cuando tengas `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET`, basta con cargarlas para activar el flujo real.

## Qué se construye

### 1. Capa abstracta `src/lib/billing/`
- `provider.ts` — interface `BillingProvider` (`createCheckout`, `cancelSubscription`, `verifyWebhook`, `mapEvent`).
- `mercadopago.ts` — implementación contra MP Pre-approval. Si `MP_ACCESS_TOKEN` no está definido, todas las llamadas lanzan `Error("MP_ACCESS_TOKEN not configured")` con mensaje claro.
- `index.ts` — `getBillingProvider(tenant)` switch por `tenant.billing_provider` (hoy siempre MP).

### 2. Server functions `src/lib/billing-saas.functions.ts`
- `getCurrentSubscription()` — funciona ya (lee `tenants` + último `subscription_events`). No requiere credenciales.
- `createCheckoutSession({planId})` — implementada pero lanza error explicativo si falta el secret.
- `cancelSubscription()` — idem.

### 3. Webhook público `src/routes/api/public/billing-webhook.$provider.ts`
- Endpoint listo. Verifica firma con `MP_WEBHOOK_SECRET`; si el secret no está, responde 503 "billing not configured".
- Idempotencia por `subscription_events.provider_event_id`.
- Actualiza `tenants.status / plan_id / billing_subscription_id`.

### 4. UI mínima de suscripción
- `/admin/facturacion-suscripcion` (solo admin del tenant): muestra plan actual, estado y `trial_ends_at`. CTA "Suscribirme" deshabilitada con tooltip "Pagos pendientes de activación" mientras no haya `MP_ACCESS_TOKEN`.
- Banner global de trial countdown + pantalla de bloqueo cuando `status in ('suspended','cancelled')` — ya activo independiente de MP.

### 5. README breve en `src/lib/billing/README.md`
Pasos para activar:
1. Crear app en Mercado Pago → copiar Access Token.
2. Configurar webhook MP → copiar Secret.
3. Cargar `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET` como secrets en Lovable Cloud.
4. Crear `preapproval_plan` por cada plan y pegar el id en `plans.mp_preapproval_plan_id` desde el panel super_admin (Fase 3).

## Fuera de alcance ahora
- Llamadas reales a la API de MP (quedan en código pero inactivas sin token).
- Panel super_admin para editar planes (Fase 3).
- Stripe.

## Orden
1. `src/lib/billing/provider.ts` + `mercadopago.ts` + `index.ts`.
2. `src/lib/billing-saas.functions.ts`.
3. `src/routes/api/public/billing-webhook.$provider.ts`.
4. UI `/admin/facturacion-suscripcion` + banner de trial + pantalla de bloqueo.
5. README.

¿Avanzo así?