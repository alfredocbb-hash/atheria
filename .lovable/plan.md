## Fase 3 — Panel Super Admin

Hasta ahora tenemos: multitenancy, super_admin global (alfredocbb@gmail.com), tenants con estado de trial/billing, planes vacíos y la estructura de Mercado Pago lista (sin credenciales). Falta una **consola para que el super_admin gestione la plataforma** sin tocar SQL.

## Qué se construye

### 1. Layout y guardas
- Nueva ruta layout `src/routes/_authenticated/super.tsx` que valida `auth.isSuperAdmin` (hook nuevo `useIsSuperAdmin` que consulta `super_admins`) y redirige a `/` si no lo es.
- Sidebar propio "Plataforma" con: Tenants, Planes, Eventos de facturación, Health.
- Entrada al panel desde el avatar del admin layout, visible solo si `is_super_admin`.

### 2. Tenants — `super/tenants`
- Listado: nombre, slug, plan, status, `trial_ends_at`, último evento, miembros count.
- Acciones por fila:
  - Editar nombre / slug / plan_id / status (`trial|active|past_due|suspended|cancelled`) / `trial_ends_at` / `billing_provider`.
  - Ver miembros (drawer) con email y rol.
  - "Impersonar tenant" (setear `localStorage` `current_tenant_id` y abrir `/admin` en nueva pestaña — super_admin ya pasa las RLS).
- Crear nuevo tenant (nombre + slug + plan + admin inicial por email — si el usuario existe se agrega como `tenant_members.admin`, si no, se invita).

### 3. Planes — `super/planes`
- Editor de la tabla `plans`: code, name, description, price_cents, currency, features (JSON editor simple key=value), limits (idem), `is_active`, `mp_preapproval_plan_id`, `provider_price_id`.
- Botón "Activar" / "Desactivar".
- Vista previa de cómo lo ve el tenant.

### 4. Eventos de billing — `super/eventos`
- Tabla `subscription_events` paginada: fecha, provider, tenant, type, `provider_event_id`, payload (expandible).
- Filtros por tenant y por type. Útil para debuggear webhooks de MP cuando se activen.

### 5. Health — `super/health`
- Tarjetas: # tenants por status, # trials por vencer en 7d, MP configurado (sí/no según server fn que chequea `MP_ACCESS_TOKEN` sin exponerlo), último evento recibido.

### 6. Server functions (`src/lib/super-admin.functions.ts`)
Todas con middleware `requireSupabaseAuth` + guard server-side `is_super_admin()`:
- `listTenants`, `getTenant`, `updateTenant`, `createTenant`, `listTenantMembers`, `addTenantMember`, `removeTenantMember`.
- `listPlans` (full), `upsertPlan`, `togglePlanActive`.
- `listSubscriptionEvents({tenantId?, type?, cursor})`.
- `getPlatformHealth()` — agregados + `billingConfigured: !!process.env.MP_ACCESS_TOKEN`.

### 7. Migración SQL
- Función `public.is_super_admin_for(uuid)` ya existe (`is_super_admin()`). Sin cambios de schema, salvo:
  - Permitir que super_admin escriba `plans` y `tenants` — ya cubierto por policies existentes.
  - Agregar índice `subscription_events(tenant_id, created_at desc)` para el listado.

## Fuera de alcance
- Edición de roles dentro de un tenant (sigue en `/admin/usuarios` del tenant).
- Cobros manuales / refunds (cuando se active MP).
- Métricas históricas (Fase 4).

## Orden de implementación
1. Migración (índice + verificar policies super_admin sobre `plans`/`tenants`).
2. `src/lib/super-admin.functions.ts` + hooks.
3. Layout `super.tsx` + sidebar + guard.
4. Páginas: tenants → planes → eventos → health.
5. Entrada en el avatar admin.

¿Avanzo así?