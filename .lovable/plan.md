## Causa

El sidebar admin tiene la lista de navegación hardcodeada en `src/components/layouts/admin-portal-layout.tsx` (no consume `MODULE_REGISTRY`). Por eso Tarifas no aparece aunque esté registrado.

## Cambio

Agregar una entrada para Tarifas en el array `NAV` de `admin-portal-layout.tsx`, entre Facturación y Reclamos:

```ts
{ label: "Tarifas", icon: Wallet, to: "/admin/tarifas", enabled: true },
```

Y agregar `Wallet` al import de `lucide-react` en el mismo archivo.
