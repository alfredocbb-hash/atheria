# Fix: no se puede iniciar sesión (form se envía como GET con credenciales en URL)

## Diagnóstico
1. La barra muestra `/login?email=...&password=Visa4517`. Eso es un submit **nativo GET** del `<form>` con los `name` de cada input (`email`, `password` que pone `register()`).
2. El JWT de las llamadas posteriores a `user_roles` confirma que Supabase Auth funciona — el bug está en el submit del formulario, no en las credenciales.
3. Causa raíz: el HTML SSR del login se pinta antes de que TanStack Start hidrate. Si el usuario clickea "Ingresar" o pulsa Enter durante esa ventana, no hay handler React adjunto y el navegador hace submit nativo. El `<form>` no tiene `action` ni `method`, así que recarga `/login` por GET con los campos en la query.
4. Riesgo secundario: las credenciales quedan en el historial del navegador, en logs del proxy y en el query string (problema de seguridad serio).
5. Riesgo terciario: `/login` no tiene `beforeLoad` que redirija al usuario ya autenticado, por lo que el page se monta y solo el `useEffect` corrige la ruta — eso permitió que el usuario, ya logueado, vuelva a "loguearse" y dispare el bug.

## Cambios

### 1. Endurecer el `<form>` de login (`src/routes/login.tsx`)
- `noValidate` (ya validamos con zod).
- `method="post"` y `action="?"` para que un submit pre-hidratación no agregue parámetros a la URL ni cambie de método. Como no tenemos endpoint server para `/login`, el browser igual recargará, pero **sin** mandar email/password en `?query`.
- Wrapper `onSubmit` que llama `e.preventDefault()` **antes** de delegar a `form.handleSubmit(onSubmit)`. Esto es redundante con react-hook-form pero blinda contra cualquier handler que no llegue a correr.
- Renombrar el input de password con `autoComplete="current-password"` ya está; agregar `name="email"`/`name="password"` ya viene de `register`, ok.

### 2. Gate en `beforeLoad` de `/login` (`src/routes/login.tsx`)
Antes de que el componente monte, si hay sesión Supabase, hacer `throw redirect({ to: "/admin" | "/cliente" })`. Para saber a dónde redirigir necesitamos los roles → consultamos `supabase.auth.getSession()` y, si hay user, `user_roles` rápido. Si la consulta de roles falla, redirigimos a `/cliente` (fallback seguro). Esto elimina la ventana en que el usuario "logueado" ve el form de nuevo.

### 3. Mostrar loader hasta hidratación (defensivo)
Renderizar el `<form>` solo cuando `auth.isLoading === false`. Mientras carga, mostrar un spinner. Esto evita que el HTML SSR del form sea interactivo antes de tiempo. Costo: una fracción de segundo más sin formulario; beneficio: imposible enviar el form sin handlers React.

## No incluye
- Reescribir login como server function (mayor cambio, no necesario para este fix).
- Tocar el flujo de Google OAuth — funciona.
- Cambios en `__root.tsx` / `AuthGate` — están correctos.

## Validación
1. Recargar `/login`, escribir credenciales y dar Enter inmediatamente: debe autenticar y redirigir a `/admin` sin pasar por `/login?email=...`.
2. Estando logueado, ir manualmente a `/login`: el `beforeLoad` debe redirigir antes de pintar.
3. Credenciales inválidas: toast de error, URL queda en `/login` limpia (sin query).
