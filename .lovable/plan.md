## Problema

`alfredocbb@gmail.com` tiene rol `admin` en `user_roles` (confirmado en logs de red: `[{"role":"client"},{"role":"admin"}]`) y el login con password devuelve 200. Pero termina en `/cliente`, no en `/admin`.

**Causa raíz:** en `src/routes/__root.tsx` (`AuthGate`), `onAuthStateChange` setea `session` de inmediato pero difiere `loadRoles` con `setTimeout(0)`. En `src/routes/login.tsx`, el `useEffect` de redirección reacciona al primer cambio de `isAuthenticated` con `roles` aún vacío → `isAdminOrOperator === false` → navega a `/cliente` antes de que lleguen los roles. Una vez en `/cliente`, el usuario ya no es reenviado.

El mismo problema afecta a `src/routes/index.tsx` (decide destino con `isAdminOrOperator` que puede estar “frío”).

## Cambios

1. **`src/routes/__root.tsx` — `AuthGate`**
   - Agregar estado `rolesLoaded: boolean` (false hasta que termine el primer `loadRoles` posterior al login/sesión inicial).
   - Exponerlo a través de `AuthState` (extender `auth-context.ts` con `rolesLoaded: boolean`).
   - Marcar `rolesLoaded=false` al cambiar de sesión y `true` cuando `loadRoles` resuelve.

2. **`src/lib/auth-context.ts`**
   - Añadir `rolesLoaded: boolean` en `AuthState` y `defaultAuthState` (false).

3. **`src/routes/login.tsx`**
   - Cambiar el `useEffect` para que solo redirija cuando `auth.isAuthenticated && auth.rolesLoaded`.
   - Respetar `?redirect=` solo si el destino es compatible con el rol (si pidieron `/admin` y no es admin, mandar a `/cliente`; si pidieron `/cliente` pero es admin, igual ir a `/admin` salvo que el admin elija explícitamente — para evitar el caso actual, ignorar `redirect` cuando el usuario es admin/operator y mandarlo a `/admin`).

4. **`src/routes/index.tsx`**
   - Mostrar loader hasta `auth.rolesLoaded`, luego decidir `/admin` vs `/cliente`.

5. **QA**
   - Login con `alfredocbb@gmail.com` → debe ir a `/admin`.
   - Login con un usuario solo `client` → debe ir a `/cliente`.
   - Acceder a `/admin` directo siendo client → sigue redirigiendo a `/cliente` (guard ya existente en `admin.tsx`).

## Detalle técnico

```ts
// auth-context.ts
export interface AuthState {
  ...
  rolesLoaded: boolean;
}
```

```tsx
// __root.tsx AuthGate
const [rolesLoaded, setRolesLoaded] = useState(false);
const loadRoles = useCallback(async (uid?: string) => {
  setRolesLoaded(false);
  if (!uid) { setRoles([]); setRolesLoaded(true); return; }
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
  setRoles((data ?? []).map(r => r.role as AppRole));
  setRolesLoaded(true);
}, []);
```

```tsx
// login.tsx
useEffect(() => {
  if (!auth.isAuthenticated || !auth.rolesLoaded) return;
  navigate({ to: auth.isAdminOrOperator ? "/admin" : "/cliente", replace: true });
}, [auth.isAuthenticated, auth.rolesLoaded, auth.isAdminOrOperator, navigate]);
```

No requiere migraciones ni cambios de RLS.
