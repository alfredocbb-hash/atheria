# Sistema de Gestión de Servicios — Multitenant + Suscripciones

Renombrar el proyecto a **Sistema de Gestión de Servicios** (SGS) y convertirlo en SaaS multitenant. **Coopecur Connect** pasa a ser el primer tenant (semilla) dentro de la plataforma. Panel de **super_admin** global, suscripciones vía Stripe gestionado por Lovable, trial de 14 días al alta.

---

## 0. Rebranding (plataforma)

- Nombre de producto: **Sistema de Gestión de Servicios**.
- Cambios cosméticos: `index.html` `<title>`, layouts (`client-portal-layout`, `admin-portal-layout`), landing `src/routes/index.tsx`, emails de auth, `head()` meta de cada ruta.
- **Coopecur 2.0 / Coopecur Connect** deja de ser el nombre de la app y pasa a ser el `name` del tenant semilla en la tabla `tenants`. Su logo/identidad se muestran solo cuando ese tenant está activo (base para white-label futuro).
- No se renombra el repo ni el Lovable project ID — solo strings visibles.

---

## 1. Modelo de datos (migración única)

### Tablas nuevas

- **`tenants`** — una fila por cooperativa/cliente del SaaS.
  - `id`, `name`, `slug` (único), `status` (`trial` | `active` | `past_due` | `suspended` | `cancelled`), `trial_ends_at`, `plan_id` (FK→`plans`), `stripe_customer_id`, `stripe_subscription_id`, `created_at`, `updated_at`.
  - Seed: insertar `('Coopecur Connect', 'coopecur', 'active', ...)` como tenant inicial.
- **`plans`** — catálogo de planes.
  - `id`, `code` (`basic`|`pro`|`enterprise`), `name`, `description`, `price_cents`, `currency`, `stripe_price_id`, `features` jsonb (flags por módulo: `billing`, `claims`, `meters`, ...), `limits` jsonb (`max_members`, `max_supplies`...), `is_active`.
- **`tenant_members`** — relación usuario↔tenant con rol dentro del tenant.
  - `id`, `tenant_id`, `user_id`, `role` (`admin`|`operador`|`user`), `created_at`. UNIQUE(`tenant_id`,`user_id`).
- **`subscription_events`** — log de webhooks Stripe (idempotencia/auditoría).
  - `id`, `tenant_id`, `stripe_event_id` (unique), `type`, `payload` jsonb, `created_at`.

### Enum
- `app_role` se extiende con `super_admin` (rol global, vive en `user_roles`). Los roles operativos por tenant viven en `tenant_members.role`.

### Cambios en tablas existentes
A todas las tablas de dominio (`members`, `supplies`, `supply_addresses`, `meters`, `meter_readings`, `invoices`, `invoice_items`, `payments`, `tariffs`, `claims`, `claim_comments`, `crews`, `work_orders`, `notifications`, `audit_log`) se agrega:
- `tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`
- índice en `tenant_id`.

`profiles` y `user_roles` quedan **globales** (un usuario puede pertenecer a varios tenants).

### Reset de datos
Como acordamos empezar de cero: `TRUNCATE ... CASCADE` sobre las tablas de dominio antes de agregar `tenant_id NOT NULL`. Auth (`auth.users`, `profiles`, `user_roles`) no se toca. Se crea el tenant **Coopecur Connect** vacío y se asigna como miembro `admin` al usuario `alfredocbb@gmail.com` (que además recibe `super_admin` global).

---

## 2. RLS — aislamiento por tenant

Funciones security-definer:
- `current_tenant_id()` — MVP: primer tenant del user logueado.
- `is_tenant_member(_tenant uuid, _role text default null)`.
- `is_super_admin()`.

Reglas por tabla de dominio:
- **SELECT**: `tenant_id = current_tenant_id() OR is_super_admin()`.
- **INSERT/UPDATE/DELETE**: `is_tenant_member(tenant_id, 'admin'|'operador') OR is_super_admin()`. `user` solo lee lo propio (igual que el `client` actual).

`tenants`/`plans`/`tenant_members`: lectura propia + ALL para `super_admin`.

---

## 3. Auth, tenant context y onboarding

- `useAuth` extendido: `tenants[]`, `activeTenant`, `tenantRole`, `switchTenant(id)`, `isSuperAdmin`.
- Login: tras autenticarse se cargan los `tenant_members` + `tenants`. Si tiene >1 → selector. Si 0 y no es super_admin → pantalla "esperando invitación".
- Tenant activo persistido en `localStorage`, validado en server-side.
- **Signup nuevo (self-service SaaS)**: form pide nombre cooperativa + datos del admin. Server-fn crea en una transacción: `auth.users` + `profiles` + `tenants` + `tenant_members(admin)` + arranca trial.

---

## 4. Suscripciones (Stripe gestionado por Lovable)

1. Crear tenant → `stripe_customer`, `status='trial'`, `trial_ends_at = now() + 14 days`. Sin tarjeta requerida.
2. Página **Plan & Facturación** (solo `admin` del tenant): muestra los 3 planes → checkout Stripe (`mode: subscription`, `trial_period_days` si aún en trial).
3. Webhook `src/routes/api/public/stripe-webhook.ts` (verifica firma con `STRIPE_WEBHOOK_SECRET`, usa `supabaseAdmin`):
   - `customer.subscription.created/updated` → guarda `stripe_subscription_id`, `plan_id`, status.
   - `customer.subscription.deleted` → `cancelled`.
   - `invoice.payment_failed` → `past_due`.
   - Idempotencia via `subscription_events.stripe_event_id`.
4. Si `status='trial'` y `trial_ends_at < now()` sin suscripción → `suspended`.
5. Si `status in ('suspended','cancelled')` → pantalla de bloqueo con CTA "Suscribirme". El `super_admin` puede entrar igual (impersonación).

Server fns (`src/lib/billing-saas.functions.ts`): `createCheckoutSession({planId})`, `createBillingPortalSession()`, `getCurrentSubscription()`.

---

## 5. Panel super_admin (`/_authenticated/super/*`)

Guard: `isSuperAdmin`. Layout propio.

Páginas:
- **Tenants** — listado (plan, estado, miembros, último pago). Acciones: crear, suspender/reactivar, cambiar plan manualmente, extender trial, impersonar.
- **Planes** — CRUD de `plans`. Los `stripe_price_id` se pegan manualmente desde el dashboard de Stripe.
- **Suscripciones** — vista cross-tenant del estado de facturación.
- **Usuarios** — buscar globales, asignar `super_admin`, ver tenants a los que pertenecen.
- **Auditoría global** — `audit_log` cross-tenant.

---

## 6. UI del tenant

- **Header**: nombre del tenant activo + selector si tiene varios + countdown del trial.
- **Admin → Equipo**: invitar usuarios al tenant por email con rol (`admin`/`operador`/`user`). Reemplaza `admin.usuarios.tsx` actual.
- Rutas existentes (`admin.socios`, `admin.facturacion`, etc.) siguen funcionando — solo cambia el filtrado por `tenant_id` vía RLS.
- **Feature gates**: `useFeature('claims')` lee `plan.features` y oculta módulos no incluidos.

---

## 7. Orden de implementación

1. **DB migration** (tablas + enum + truncate + RLS + funciones + seed Coopecur Connect).
2. **Rebrand strings** (título, layouts, landing).
3. **Stripe enable** + secret webhook + page de planes (los 3 planes se definen luego por módulos).
4. **Auth/tenant context** (useAuth extendido, signup nuevo, selector).
5. **Webhook + checkout + billing portal**.
6. **Panel super_admin**.
7. **Equipo del tenant** (invitaciones) + feature gates.
8. **Bloqueo por suscripción vencida**.

---

## Detalles técnicos

- Roles: `super_admin` (global) · `admin`/`operador`/`user` (por tenant).
- `current_tenant_id()` MVP lee de `tenant_members`. V2: `set_config('app.tenant_id', ...)` por request.
- Webhook con `supabaseAdmin`, firma Stripe verificada.
- Stripe price IDs se ingresan manualmente para que controles el catálogo desde Stripe.
- Trial: `trial_ends_at` en `tenants`; si el user agrega tarjeta antes del vencimiento se mantiene via `trial_period_days` de Stripe.
- Coopecur Connect = tenant semilla, status `active`, plan a definir más adelante.

## Fuera de alcance

- Definir los 3 planes y sus features concretas (lo armás luego por módulos).
- White-labeling visual por tenant (logo/colores) — la estructura queda lista pero no se implementa la UI.
- Multi-moneda / impuestos automáticos.
- SSO por tenant.
- Migración de datos existentes (se resetea).