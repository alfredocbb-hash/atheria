## Situación

Las tarifas ya existen como **pestaña dentro del módulo Facturación** (`/admin/facturacion` → tab "Tarifas"), por eso no aparece como módulo propio en la barra lateral. Desde ahí podés crear/activar tarifas con el botón "Nueva tarifa".

Para que sea más visible, propongo convertir Tarifas en un módulo independiente del sidebar.

## Cambios

1. **Nueva ruta** `src/routes/_authenticated/admin.tarifas.tsx`
   - Exporta `TarifasPage` con el contenido actual del `TariffsTab` (tabla + botón "Nueva tarifa" que abre `view:tarifa.new`).
   - Título: "Tarifas — Coopecur 2.0".

2. **Registrar módulo** en `src/components/workspace/module-registry.ts`
   - Agregar key `"tarifas"` al tipo `ModuleKey`.
   - Entrada con `title: "Tarifas"`, ícono `Wallet` (lucide), `routeTo: "/admin/tarifas"`, `Component: TarifasPage`.
   - Colocarla entre `facturacion` y `reclamos`.

3. **Limpiar Facturación**
   - En `src/routes/_authenticated/admin.facturacion.tsx` quitar el `TabsTrigger`/`TabsContent` de "tariffs" y la función `TariffsTab` (ahora vive en su propio módulo). Dejar solo Facturas y Lecturas.
   - Actualizar el `parentModule` en el `openView` de `tarifa.new` a `"tarifas"`.

## Resultado

- Aparece "Tarifas" como ítem propio en el sidebar admin.
- El flujo "no hay tarifa vigente" se resuelve entrando a **Tarifas → Nueva tarifa**, eligiendo el servicio (agua/gas/electricidad), `valid_from` ≤ hoy, activa.
