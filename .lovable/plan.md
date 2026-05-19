## Objetivo
Quitar el buscador de cooperativa de la página "Soy socio" y enviar al usuario directamente al login.

## Cambios

### `src/routes/acceder.tsx`
Reemplazar el componente actual (hero + formulario de búsqueda + resultados) por un `beforeLoad` que haga `throw redirect({ to: "/login", replace: true })`. Se mantiene la ruta `/acceder` para no romper enlaces existentes (header de marketing, footer, etc.), pero ahora simplemente reenvía a `/login`.

Se elimina también:
- El uso de `searchPublicTenants`, `useServerFn`, estado local (`q`, `results`, `loading`, `searched`).
- Los imports de `Input`, `Search`, `Building2`, `Loader2`, `MarketingHeader`, `MarketingFooter` ya no necesarios.

### Fuera de alcance
- No se toca `searchPublicTenants` en `src/lib/public-marketing.functions.ts` (queda disponible por si se reusa, sin costo en cliente porque ya no se importa).
- No se modifican links a `/acceder` en header/footer de marketing — siguen funcionando y ahora llevan al login.
- No se cambia `/login` ni la lógica de redirección por rol.

## Detalles técnicos
```tsx
// src/routes/acceder.tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/acceder")({
  beforeLoad: () => {
    throw redirect({ to: "/login", replace: true });
  },
});
```
