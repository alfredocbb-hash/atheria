
# Plan: Gestión de usuarios y permisos para el Super Admin

Dos features unificadas en un nuevo módulo del portal super: **Usuarios** y **Permisos por módulo**.

---

## 1. Base de datos

### Catálogo de módulos (extensible)
Tabla `app_modules` — fuente única de verdad. Cuando se agregue un módulo nuevo, se inserta aquí y aparece automáticamente en la matriz.

- `key` (text, PK) — ej. `facturacion`, `reclamos`, `configuracion`
- `title` (text), `description` (text), `category` (text: `tenant` | `super` | `client`)
- `is_active` (bool), `sort_order` (int)

Se siembra inicialmente con los módulos actuales del `module-registry.ts` (dashboard, usuarios, socios, suministros, facturacion, tarifas, reclamos, auditoria, configuracion) + los del portal super (tenants, planes, eventos, health, configuracion) + los del cliente.

### Matriz de permisos global (defaults)
Tabla `module_role_permissions`:
- `module_key` → `app_modules.key`
- `role_scope` (`app_role` | `tenant_role`) — para distinguir las dos jerarquías
- `role` (text) — `admin/operator/client` o `admin/operador/user`
- `enabled` (bool)
- PK: (`module_key`, `role_scope`, `role`)

### Overrides por cooperativa
Tabla `tenant_module_role_permissions`:
- `tenant_id`, `module_key`, `role_scope`, `role`, `enabled`
- PK compuesta. Si no hay fila → se usa el default global.

### Función helper
`public.can_access_module(_user uuid, _tenant uuid, _module text) returns bool` — security definer, resuelve override de tenant → default global → false. Se usa desde el frontend y opcionalmente desde RLS en el futuro.

RLS:
- `app_modules`: SELECT autenticados; ALL solo super admin.
- `module_role_permissions` y `tenant_module_role_permissions`: SELECT autenticados; ALL solo super admin.

---

## 2. Server functions (`src/lib/super-users.functions.ts`)

Todas con `requireSupabaseAuth` + chequeo `is_super_admin()`:

- `createUserWithRole({ email, password, full_name, app_role? })` — usa `supabaseAdmin.auth.admin.createUser` + insert en `user_roles`.
- `assignTenantMembership({ user_id, tenant_id, role })` — insert/update en `tenant_members`.
- `removeTenantMembership({ user_id, tenant_id })`.
- `listAllUsers({ search })` — join de `profiles` + `user_roles` + `tenant_members` + `super_admins`.
- `listModules()` / `listGlobalPermissions()` / `listTenantPermissions(tenant_id)`.
- `setGlobalPermission({ module_key, role_scope, role, enabled })` — upsert.
- `setTenantPermission({ tenant_id, module_key, role_scope, role, enabled | null })` — upsert; `null` = limpiar override.

Auditoría: cada cambio registra `log_audit('permissions.changed' | 'user.created' | ...)`.

---

## 3. UI Super Admin — nuevo `/super/usuarios`

Pestañas:
1. **Usuarios** — tabla con buscador, roles globales (badges), tenants donde es miembro. Acciones:
   - Crear usuario (dialog: email, password, nombre, checkbox de roles globales).
   - Asignar/quitar rol global (`admin`/`operator`/`client`).
   - Asignar membresía a tenant (selector de tenant + rol).
   - Marcar/desmarcar super admin.
2. **Permisos globales** — matriz checkbox:
   - Sub-tab "Roles globales" (filas: módulos, columnas: admin/operator/client).
   - Sub-tab "Roles de tenant" (filas: módulos, columnas: admin/operador/user).
3. **Permisos por cooperativa** — selector de tenant + misma matriz; cada celda muestra el default global y permite override (estados: hereda ✓, hereda ✗, override ✓, override ✗, botón "limpiar").

Hooks nuevos en `src/hooks/use-super-users.ts` y `src/hooks/use-permissions.ts` con React Query.

---

## 4. Integración con el sistema de módulos existente

- `src/components/workspace/module-registry.ts` ya define los módulos del admin. Se agrega un campo opcional `permissionKey` (default = `key`) y se sincroniza con `app_modules`.
- En `admin-portal-layout` y `super.tsx`, los ítems de menú se filtran usando `can_access_module(user, tenant, module)` vía un hook `useModuleAccess()` que cachea la respuesta.
- Cuando se cree un módulo nuevo en el futuro: basta con agregarlo al `module-registry.ts` **y** insertar la fila en `app_modules` (se puede automatizar con un seed/migration helper o un botón "Sincronizar módulos" en el super que detecta los que faltan).

---

## 5. Detalles técnicos

- Toda la UI de matriz usa `<Checkbox>` de shadcn con mutaciones optimistas.
- Validación con zod en server functions (`email`, `password >= 8`, roles enum, etc.).
- No se modifican archivos preconfigurados (`client.ts`, `types.ts`, `routeTree.gen.ts`).
- El menú lateral del super admin recibe entrada **Usuarios** (icono `Users`) y el de Configuración global gana una pestaña adicional opcional "Módulos" (catálogo de `app_modules` por si se quiere renombrar / desactivar uno).

## Fuera de alcance

- Enforcement automático en RLS de cada tabla de negocio (queda como evolución; por ahora `can_access_module` se usa para mostrar/ocultar UI y como guard en server functions críticas).
- Invitaciones por email / magic link (se puede sumar luego).
- Permisos a nivel acción (ver/crear/editar/borrar) — esta iteración es a nivel módulo.
