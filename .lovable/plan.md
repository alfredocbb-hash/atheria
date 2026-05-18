## Fase 4 — Onboarding de tenants + dashboard super admin + scaffolding de billing por tenant

Dejamos Mercado Pago "real" para más adelante. Esta fase cierra el loop de **alta de cooperativas sin intervención manual**, da al super admin un **dashboard de negocio**, y deja preparada en el panel super una **configuración de billing por tenant** (donde más adelante cada tenant cargará su token de MP) sin activar todavía el flujo de pagos.

## Qué se construye

### 1. Onboarding self-service de tenant — `/onboarding`
- Nueva ruta `_authenticated/onboarding.tsx`.
- Guard en `admin.tsx`: si el usuario no es super admin y no pertenece a ningún tenant → redirect a `/onboarding`.
- Wizard de 3 pasos:
  1. Datos de la cooperativa: nombre, slug (autogenerado desde el nombre, editable, validación de unicidad en vivo), provincia/localidad.
  2. Plan: lista de `plans` activos con precios. Todos arrancan con trial de 14 días automático, independientemente del plan.
  3. Confirmación + creación.
- Server fn `createMyTenant({name, slug, planId, locality})`:
  - Valida que el usuario NO tenga ya un tenant.
  - Crea `tenants` (status='trial', `trial_ends_at = now + 14 days`, `billing_provider='mercadopago'`, `plan_id`).
  - Crea `tenant_members(user_id=auth.uid(), role='admin')`.
  - Loguea en `audit_log`.
  - Devuelve el `tenant_id` para que el cliente refresque y entre a `/admin`.

### 2. Dashboard del super admin — `super.index.tsx`
- Reemplazar el index actual de `/super` por un dashboard con:
  - KPIs: tenants totales, activos, en trial, suspendidos/cancelados; trials por vencer en 7d; MRR estimado (suma `price_cents` de planes asignados a tenants con status='active'); eventos de webhook últimos 7d.
  - Tabla "Tenants en riesgo": trials que vencen en ≤3 días + tenants en `past_due`.
  - Tabla "Actividad reciente": últimos 10 `audit_log` cross-tenant + últimos 10 `subscription_events`.
- Server fn `getSuperDashboard()` agregando todo en una sola llamada.

### 3. Configuración de billing por tenant (scaffolding, sin activar MP)
- Nueva pestaña en `super/tenants/$id` (o drawer desde la fila): **"Facturación"**.
- Campos editables por el super admin:
  - `billing_provider` (select: solo `mercadopago` por ahora, dejar el select listo para `stripe`).
  - `mp_access_token` (text, write-only — al guardar se escribe en una tabla nueva `tenant_billing_credentials`; al leer solo muestra "configurado/no configurado", nunca el valor).
  - `mp_webhook_secret` (idem).
  - Botón "Probar credenciales" (deshabilitado, placeholder "Disponible cuando se active la integración").
- Migración nueva tabla:
  - `tenant_billing_credentials(tenant_id PK FK, provider text, access_token text, webhook_secret text, updated_at)`.
  - RLS: solo super admin lee/escribe. **Nunca** accesible desde el lado del tenant.
  - El billing provider sigue leyendo `process.env.MP_ACCESS_TOKEN` como fallback; cuando se active la fase real, leerá de esta tabla con prioridad.
- Server fns en `super-admin.functions.ts`: `getTenantBillingConfig`, `upsertTenantBillingConfig` (ambas guard `is_super_admin`).
- UI clara: "Los pagos están deshabilitados a nivel plataforma. Estos datos quedan guardados para cuando se active." (sin botones de checkout funcionales en `/admin/facturacion-suscripcion`, ya está así).

### 4. Notificaciones automáticas al admin del tenant
- Función SQL `notify_tenant_admins(_tenant uuid, _kind text, _title text, _body text, _link text)` análoga a `notify_member_user`: inserta en `notifications` para cada `tenant_members` con role='admin' del tenant.
- Trigger en `tenants` para `UPDATE OF status` que llama a `notify_tenant_admins` con mensajes según el cambio (`trial→active`, `→past_due`, `→suspended`, `→cancelled`).
- Al crear un tenant nuevo en onboarding: notificar al admin con "Bienvenido a la plataforma, tu trial vence el X".

### 5. Migración SQL
- Asegurar índice único `tenants(slug)` (verificar; crear si falta).
- Tabla `tenant_billing_credentials` + RLS super-only.
- Función `notify_tenant_admins` + trigger en `tenants`.

## Fuera de alcance (Fase 5+)
- Activación real de Mercado Pago (checkout + webhook que mueva status según pagos).
- Cron de "trial por vencer en 3 días" (requiere pg_cron o scheduler externo).
- Facturas SaaS descargables (PDF de cobro de la plataforma al tenant).
- Multi-plan switching con prorrateo.
- Dunning / recuperación de pagos fallidos.

## Orden de implementación
1. Migración: tabla `tenant_billing_credentials` + RLS, `notify_tenant_admins` + trigger en `tenants`, índice único `slug`.
2. `createMyTenant` server fn + wizard `/onboarding` + guard de redirección desde `admin.tsx`.
3. Dashboard super admin (`super.index.tsx`).
4. Pestaña "Facturación" en super/tenants ($id) + server fns + UI con avisos de "no activado".
5. QA: usuario nuevo → onboarding → /admin con trial countdown; super admin → dashboard + edición de credenciales del tenant (guardado y read-back como "configurado").

¿Avanzo así?