# Problema

Al hacer click en cualquier opción del menú admin (Usuarios, Socios, Suministros, etc.) la URL cambia correctamente pero la vista sigue mostrando el dashboard. Quedan en blanco/sin actualizar.

**Causa raíz**: `src/routes/_authenticated/admin.tsx` es la ruta padre (layout) de `admin.usuarios.tsx`, `admin.socios.tsx`, etc. (convención flat dot de TanStack Router). Como ruta padre **debe renderizar `<Outlet />`** para mostrar las hijas, pero hoy renderiza el contenido del dashboard. Resultado: las hijas hacen match pero no tienen dónde renderizarse.

Además, cada hija envuelve su contenido en `<AdminPortalLayout>`, lo que provocaría doble layout si simplemente agregamos `<Outlet />` al padre.

# Solución

1. **Convertir `admin.tsx` en layout puro**
   - Mantener el guard de auth (`isAdminOrOperator`) y el loader.
   - Renderizar `<AdminPortalLayout><Outlet /></AdminPortalLayout>` en lugar del dashboard.

2. **Crear `admin.index.tsx`** (ruta `/admin`)
   - Mover ahí el contenido actual del dashboard (KPIs + tarjeta de bienvenida).
   - Sin volver a envolver en `AdminPortalLayout` (ya lo provee el padre).

3. **Quitar `<AdminPortalLayout>` de las 6 rutas hijas**
   - `admin.usuarios.tsx`, `admin.socios.tsx`, `admin.suministros.tsx`, `admin.facturacion.tsx`, `admin.reclamos.tsx`, `admin.auditoria.tsx`
   - Solo retornan su contenido interno; el layout ya envuelve por la ruta padre.

# Resultado esperado

- `/admin` → dashboard dentro del layout
- `/admin/usuarios`, `/admin/socios`, etc. → cada vista correcta dentro del mismo layout, con sidebar/menú persistente
- Sin doble wrapping ni regresiones de guard de auth
