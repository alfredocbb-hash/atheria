# Plan de corrección: refresco constante, login y 404

## Hallazgos principales

El síntoma de “se refresca constantemente” parece más importante que el 404: puede estar provocando redirecciones intermedias, pantallas de carga infinitas o navegación a rutas incorrectas.

Puntos detectados:

- En `__root.tsx`, cada evento de auth ejecuta `router.invalidate()` y `queryClient.invalidateQueries()`. Si la sesión se rehidrata o cambia varias veces, puede disparar refetch global constante.
- En `super.tsx`, el guard de super admin consulta `useIsSuperAdmin()` y redirige a `/` si la respuesta dice que no es super. Si la primera consulta falla por sesión todavía no adjuntada, puede sacarte de `/super` aunque el usuario sea válido.
- En `admin.tsx`, el guard redirige según `auth.isAdminOrOperator` antes de esperar explícitamente `rolesLoaded`. Eso puede causar decisiones con roles incompletos.
- Varias rutas admin usan efectos con dependencia `[auth, navigate]`; como `auth` es un objeto, puede cambiar de identidad y volver a ejecutar efectos de navegación más de lo necesario.
- El menú admin y super tiene rutas existentes; el 404 probablemente no viene de un item principal del menú, sino de un loop/redirección o de un link interno específico.

## Cambios propuestos

### 1. Estabilizar el estado global de autenticación
Modificar `src/routes/__root.tsx` para que:

- `rolesLoaded` se trate como parte obligatoria del estado listo.
- Los cambios de auth no invaliden todo el router/query cache en cada evento si no cambió realmente el usuario.
- `router.invalidate()` y `queryClient.invalidateQueries()` se limiten a eventos relevantes (`SIGNED_IN`, `SIGNED_OUT`, cambio real de usuario), evitando loops.

Resultado esperado: admin y super dejan de refetchear constantemente.

### 2. Corregir guard de admin
Modificar `src/routes/_authenticated/admin.tsx` para que:

- No decida redirecciones hasta que `auth.isLoading === false` y `auth.rolesLoaded === true`.
- No redirija a `/cliente` mientras los roles todavía están cargando.
- Las dependencias de `useEffect` sean primitivas (`auth.isLoading`, `auth.rolesLoaded`, `auth.isAdminOrOperator`) en vez del objeto `auth` completo.

Resultado esperado: el usuario admin/operador no cae temporalmente en cliente ni queda en loading infinito.

### 3. Corregir guard de super admin
Modificar `src/routes/_authenticated/super.tsx` para que:

- Espere a que la sesión y roles estén listos antes de evaluar `useIsSuperAdmin()`.
- No redirija a `/` ante errores transitorios o datos todavía no listos.
- Si `useIsSuperAdmin()` falla, mostrar un estado de error recuperable en vez de navegar automáticamente.
- Sólo redirigir fuera de `/super` cuando la consulta terminó correctamente y confirmó `isSuperAdmin === false`.

Resultado esperado: el login del super admin redirige a `/super` sin ser expulsado ni caer en 404.

### 4. Corregir rutas admin que navegan con roles incompletos
Actualizar rutas admin con guards propios:

- `admin.socios.tsx`
- `admin.suministros.tsx`
- `admin.facturacion.tsx`
- `admin.reclamos.tsx`
- `admin.tarifas.tsx`
- `admin.usuarios.tsx`
- `admin.auditoria.tsx`
- `cliente.tsx`

Para que todas esperen `rolesLoaded` antes de redirigir y no dependan de `auth` como objeto completo en `useEffect`.

Resultado esperado: navegación estable módulo por módulo.

### 5. Auditar links internos que puedan producir 404
Revisar todos los `Link to="..."` y `navigate({ to: ... })` dentro de:

- `src/routes/_authenticated/super.*.tsx`
- `src/routes/_authenticated/admin.*.tsx`
- componentes del workspace que abren vistas internas

Corregir cualquier ruta inexistente o desactualizada.

Resultado esperado: si hay un 404 real por link roto, queda corregido.

### 6. Verificación final
Probar manualmente estos flujos:

- Login como super admin → debe ir a `/super` y mantenerse ahí.
- Menú super: Dashboard, Tenants, Planes, Eventos, Health, Facturación.
- Login como admin/operador → debe ir a `/admin`.
- Menú admin: Dashboard, Usuarios, Clientes, Servicios, Facturación, Tarifas, Reclamos, Auditoría, Suscripción.
- Login como cliente → debe ir a `/cliente`.
- Confirmar que no haya refetch/redirección constante ni 404 en consola/network.

## No se toca

- Base de datos.
- Roles existentes.
- URLs internas actuales (`/admin/socios`, `/admin/suministros`).
- Tablas ni políticas de seguridad.
