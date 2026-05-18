## Problema

El super admin `alfredocbb@gmail.com` (rol `admin` + `super_admin`, sin `tenant_members`) queda atrapado en `/super`:

- `/admin` lo detecta como `isSuperAdmin && !hasTenant` y lo redirige a `/super`.
- El link "Volver al backoffice" en `src/routes/_authenticated/super.tsx` lo manda a `/admin` → rebota a `/super`.
- Aunque entrara, todas las RLS dependen de `current_tenant_id()`, que devuelve `NULL` para un usuario sin `tenant_members`, y los hooks del backoffice fallan.

## Solución: "Acceder como tenant" (impersonación desde /super)

El super admin elige un tenant en `/super/tenants`, queda "actuando como" ese tenant, y el backoffice opera como si fuera miembro admin de esa cooperativa.

### 1. Backend — overrideable `current_tenant_id()`

Migración:

- Modificar la función `public.current_tenant_id()` para que, si el caller es super admin, lea el tenant desde un GUC de sesión (`app.acting_tenant_id`). Si no hay GUC válido, cae al comportamiento actual (primer tenant_member).

```sql
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$
DECLARE v uuid;
BEGIN
  IF public.is_super_admin() THEN
    BEGIN
      v := nullif(current_setting('app.acting_tenant_id', true), '')::uuid;
    EXCEPTION WHEN others THEN v := NULL; END;
    IF v IS NOT NULL THEN RETURN v; END IF;
  END IF;
  RETURN (SELECT tenant_id FROM public.tenant_members
          WHERE user_id = auth.uid()
          ORDER BY created_at ASC LIMIT 1);
END$$;
```

- Nueva función `public.set_acting_tenant(uuid)` (`SECURITY DEFINER`) que valida `is_super_admin()` y hace `set_config('app.acting_tenant_id', $1::text, true)` (alcance de transacción).

### 2. Middleware — propagar tenant en cada request del super admin

`src/integrations/supabase/auth-middleware.ts` no se toca (es read-only auto-generado). En su lugar:

- Nuevo `src/lib/acting-tenant.ts` con helpers cliente para leer/escribir `localStorage["lovable.actingTenantId"]`.
- Nuevo `src/integrations/supabase/acting-tenant-attacher.ts` (middleware `.client`) que, si hay valor en localStorage, agrega header `x-acting-tenant: <uuid>` a cada serverFn.
- Registrar el attacher en `src/start.ts` junto a `attachSupabaseAuth` en `functionMiddleware`.
- En cada serverFn que use `requireSupabaseAuth` y opere sobre datos de tenant, llamar `await supabase.rpc("set_acting_tenant", { _tid: header })` al inicio del handler cuando el header está presente y el usuario es super. Para no tocar cada función, se añade un wrapper `withActingTenant(supabase)` invocado desde los handlers de mayor impacto: hooks de `padron`, `claims`, `billing`, `users`, `dashboard`, `notifications`.

### 3. UI — selector + estado "actuando como"

- `src/routes/_authenticated/super.tenants.tsx`: agregar acción **"Acceder al backoffice"** por fila → guarda el `tenant_id` en localStorage, invalida React Query y navega a `/admin`.
- `src/routes/_authenticated/admin.tsx`: si `isSuperAdmin`, dejar de redirigir a `/super`; en lugar de eso, si no hay `actingTenantId` mostrar una pantalla mínima "Elegí una cooperativa para gestionar" con botón a `/super/tenants`.
- `src/components/layouts/admin-portal-layout.tsx`: barra superior cuando el usuario es super admin → chip "Actuando como: {tenant.name}" + botón "Salir" que limpia el localStorage e invalida queries.
- `src/routes/_authenticated/super.tsx`: el link "Volver al backoffice" solo se muestra si hay `actingTenantId`.

### 4. Login flow

`src/routes/login.tsx`: si el usuario es super admin sin tenant propio y sin `actingTenantId`, redirigir a `/super` (no a `/admin`). El resto del flujo queda igual.

## Archivos a tocar

- `supabase/migrations/<nuevo>.sql` (current_tenant_id, set_acting_tenant)
- `src/lib/acting-tenant.ts` (nuevo)
- `src/integrations/supabase/acting-tenant-attacher.ts` (nuevo)
- `src/start.ts`
- `src/routes/_authenticated/admin.tsx`
- `src/routes/_authenticated/super.tsx`
- `src/routes/_authenticated/super.tenants.tsx`
- `src/components/layouts/admin-portal-layout.tsx`
- `src/routes/login.tsx`
- Server fns con `requireSupabaseAuth` que tocan tablas tenant-scoped: invocación de `set_acting_tenant` al inicio del handler usando el header.

## Fuera de alcance

- No se modifican RLS (siguen usando `current_tenant_id()` y `is_super_admin()`).
- No se cambia el onboarding ni la creación de tenants.
- No se altera el portal `/cliente`.