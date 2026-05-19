## Plan

Voy a corregir el flujo de login/super admin atacando el error que muestra la captura: no parece ser un 404 de ruta, sino un fallo cargando el módulo dinámico de la ruta autenticada (`_authenticated-*.js`) justo después del login, combinado con redirecciones/refetches repetidos.

### 1. Corregir redirección de login para super admin
- Revisar `src/routes/login.tsx`.
- Quitar o ajustar el `useEffect` que actualmente redirige usuarios autenticados solo con `isAdminOrOperator`, porque un super admin con rol `admin` puede terminar en `/admin` en vez de `/super`.
- Mantener una única decisión de destino basada en:
  - super admin → `/super`
  - admin/operator → `/admin`
  - cliente → `/cliente`
- Limpiar parámetros internos de preview como `__lovable_sha` si vienen dentro del redirect, para no navegar a URLs stale después de cambios de build.

### 2. Hacer robusto el error de “dynamic import”
- Ajustar el `errorComponent` raíz en `src/routes/__root.tsx`.
- Detectar errores tipo `error loading dynamically imported module` / chunk load failure.
- Para ese caso, el botón “Try again” hará una recarga limpia del navegador en vez de solo `router.invalidate()`, porque invalidar el router no vuelve a descargar correctamente un chunk stale.
- Mostrar un mensaje más claro en español para este caso.

### 3. Estabilizar el guard de super admin
- Revisar `src/hooks/use-super-admin.ts` y `src/routes/_authenticated/super.tsx`.
- Hacer que `useIsSuperAdmin()` solo consulte cuando la sesión y los roles ya estén listos.
- Desactivar refetches innecesarios en foco/reconexión para la consulta `super_admins`, porque el usuario super admin ya fue confirmado y ahora se ve que se consulta repetidamente.
- Mantener la redirección fuera de `/super` solo cuando haya una respuesta final confirmada negativa, no durante loading/error transitorio.

### 4. Completar guards admin que quedaron inconsistentes
- Revisar las rutas admin restantes (`tarifas`, `usuarios`, `auditoria`, etc.).
- Asegurar que todas esperen `rolesLoaded === true` antes de redirigir.
- Reemplazar dependencias de `useEffect` basadas en el objeto `auth` completo por dependencias primitivas, para evitar loops.

### 5. Verificación
- Revisar consola/network para confirmar que desaparece el error de módulo dinámico.
- Confirmar que login como super admin navega y permanece en `/super`.
- Confirmar que `/super`, `/super/tenants`, `/super/planes`, `/super/eventos`, `/super/health` y `/super/facturacion` existen y no producen pantalla genérica.
- Confirmar que las consultas `super_admins` no se disparan cada pocos segundos sin interacción.

### No tocaré
- Base de datos.
- Roles existentes.
- Políticas de seguridad.
- `src/routeTree.gen.ts` manualmente, porque es generado automáticamente.