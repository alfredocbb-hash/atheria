## Objetivo

Aprovechar al máximo el área visible de cada pestaña del backoffice quitando los títulos redundantes y reubicando los botones de "Nuevo registro" en la **esquina superior derecha** de cada módulo, sobre la misma línea que los filtros.

## Alcance

Todo el backoffice `/admin`:

- `admin.socios.tsx`
- `admin.suministros.tsx`
- `admin.facturacion.tsx` (subpestañas Facturas / Lecturas)
- `admin.tarifas.tsx`
- `admin.reclamos.tsx` (subpestañas Reclamos / Cuadrillas)
- `admin.usuarios.tsx`
- `admin.auditoria.tsx`

No se toca `/super`, `/cliente`, ni el sitio público de Atheria.

## 1. Quitar títulos redundantes

En cada página del módulo se elimina:

- El bloque superior con eyebrow (`PADRONES`, `OPERACIONES`, …), el `h1` con el nombre del módulo y la bajada descriptiva. La barra de pestañas del workspace ya muestra ícono + nombre.
- El `CardHeader` con `CardTitle` que solo repite el nombre del módulo (ej. "Padrón", "Listado", "Tarifas vigentes", "Lecturas de medidores", "Listado de reclamos").

Lo que queda es directamente la tarjeta con la tabla y, encima, una **barra de herramientas** compacta.

## 2. Botones de "Nuevo …" en la esquina superior derecha

Se introduce una barra de herramientas única por módulo dentro de la tarjeta:

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 buscar…   [filtro 1] [filtro 2]        [+ Nuevo …]   │
├─────────────────────────────────────────────────────────┤
│ tabla                                                   │
└─────────────────────────────────────────────────────────┘
```

- Buscador + filtros alineados a la izquierda, en una sola fila con `flex-wrap` para mobile.
- Botón "Nuevo …" pegado a la **esquina superior derecha** (`ml-auto`), tamaño `sm`, con el mismo ícono `Plus` que hoy.
- En módulos con `Tabs` internos (Facturación, Reclamos), cada subpestaña tiene su propia barra con su propio botón en la esquina (ej. "Nueva factura" en Facturas, "Cargar lectura" en Lecturas, "Nuevo reclamo" en Reclamos, "Nueva cuadrilla" en Cuadrillas). El `TabsList` queda como única franja superior, sin título grande encima.

El comportamiento del botón **no cambia**: sigue llamando `ws.openView({...})` y abriendo la vista de alta como pestaña del workspace. Solo cambia su ubicación visual.

## 3. Detalles técnicos

- Cambios localizados en los 7 archivos de ruta listados. No se crean componentes nuevos: la barra de herramientas es un simple `div className="flex flex-wrap items-center gap-2 p-3 border-b"` dentro de la `Card`.
- No se modifican rutas, `routeTree.gen.ts`, hooks, server functions, esquema de base de datos, ni `MODULE_REGISTRY` / `VIEW_REGISTRY`.
- No se modifican las vistas de alta/edición/detalle (`SocioNewView`, `FacturaDetailView`, etc.); siguen abriendo en pestañas como hoy.
- Sin cambios en `/super`, `/cliente`, ni en las páginas públicas (`/`, `/funcionalidades`, etc.).

## Resultado

Cada pestaña gana ~120 px de alto útil (≈ 3-4 filas extra de tabla visibles a 530 px de viewport) y la acción primaria queda anclada de forma predecible en la esquina superior derecha.
