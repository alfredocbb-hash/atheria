
## Objetivo

Hoy las acciones como "Nuevo suministro", "Nueva tarifa", "Cargar lectura", "Generar factura", "Nuevo socio", "Nueva cuadrilla", "Ver factura", "Abrir reclamo" abren un panel lateral (Sheet) o modal (Dialog) sobre el módulo. Esto rompe el paradigma multi-pestaña: el usuario no puede dejar el formulario abierto mientras navega a otro módulo.

Propuesta: cada una de esas acciones abre una **pestaña hija** en la barra del workspace, al mismo nivel que los módulos del menú, con su propio estado preservado (igual que las pestañas principales). El usuario puede tener "Suministros" + "Nuevo suministro" + "Factura F-0001" abiertos en paralelo y alternar entre ellos.

## Cambios en el workspace

### 1. Soportar pestañas dinámicas (no sólo módulos del menú)

`module-registry.ts` hoy mapea claves estáticas (`socios`, `suministros`, ...). Hay que extenderlo para soportar pestañas dinámicas que no vienen del registry:

- Nuevo tipo `WorkspaceTab` con: `id` (único, p.ej. `suministro:new`, `factura:detail:<uuid>`), `title`, `icon`, `kind: "module" | "dynamic"`, `parentKey?` (módulo padre, para agrupar visualmente), `closable: true`, `payload?` (props para el componente, p.ej. `{ invoiceId }`).
- `WorkspaceContext` pasa de `openTabs: ModuleKey[]` a `openTabs: WorkspaceTab[]`. Persistencia en `sessionStorage` se mantiene (los payloads serializables se guardan; las pestañas dinámicas se restauran al refrescar).
- Nuevo método `openDynamicTab(tab: WorkspaceTab)` y `updateTab(id, patch)` (para renombrar p.ej. "Nuevo suministro" → "Suministro 12345" tras crear).
- Las pestañas dinámicas se cierran automáticamente tras submit exitoso (opcional, configurable).

### 2. Registry de vistas dinámicas

Nuevo archivo `dynamic-views.ts` que mapea `viewKey` → componente. Ejemplos:

```
suministro.new       → <SuministroNewView />
suministro.meters    → <MetersView supplyId={...} />
socio.new            → <SocioNewView />
tarifa.new           → <TarifaNewView />
lectura.new          → <LecturaNewView />
factura.new          → <FacturaNewView />
factura.detail       → <FacturaDetailView invoiceId={...} />
reclamo.detail       → <ReclamoDetailView claimId={...} />
cuadrilla.edit       → <CuadrillaEditView crewId={...} /> (id opcional = nueva)
```

Cada vista recibe `payload` + un `onDone()` callback que cierra la pestaña.

### 3. Render

`workspace-panels.tsx` itera sobre `openTabs` y, según `kind`, renderiza componente del module registry o del dynamic-views registry pasando `payload`. Sigue usando `hidden` para preservar estado.

`workspace-tabs-bar.tsx` muestra todas las pestañas en orden. Las dinámicas se ven con un ícono distintivo (p.ej. `Plus` para "nuevo", `FileText` para detalle). El click derecho mantiene cerrar/otras/derecha.

## Cambios por módulo

Para cada uno: extraer el contenido del Sheet/Dialog a un componente independiente con layout de página (header + form), reemplazar el `<SheetTrigger>` por un botón que llama `openDynamicTab(...)`, y eliminar el Sheet/Dialog del módulo.

### Suministros (`admin.suministros.tsx`)
- `Nuevo suministro` (Sheet) → pestaña `suministro.new`. Tras crear, renombra a "Suministro <numero>" o cierra.
- `Gestionar medidores` (Sheet, abierta desde menú contextual) → pestaña `suministro.meters` con `payload: { supplyId }`. Título: "Medidores · <supply_number>".

### Socios (`admin.socios.tsx`)
- `Nuevo socio` (Sheet) → pestaña `socio.new`.

### Facturación (`admin.facturacion.tsx`)
- `Nueva tarifa` (Sheet) → pestaña `tarifa.new`.
- `Cargar lectura` (Sheet) → pestaña `lectura.new`.
- `Generar factura` (Dialog) → pestaña `factura.new`.
- `Ver factura` (botón en tabla, hoy abre `InvoiceDetailDialog`) → pestaña `factura.detail` con `payload: { invoiceId }`. Título: "Factura <numero>".

### Reclamos (`admin.reclamos.tsx`)
- `Abrir` reclamo (botón en tabla, hoy `ClaimDetailSheet`) → pestaña `reclamo.detail` con `payload: { claimId }`. Título: "Reclamo <numero>".
- `Nueva` cuadrilla y editar cuadrilla (Sheet) → pestaña `cuadrilla.edit` con `payload: { crewId? }`.

### Sin cambios
- Dashboard, Usuarios y Roles, Auditoría: no tienen formularios modales por ahora.
- Dropdowns de cambio de estado / asignación rápida quedan como están (son acciones inline, no formularios).

## Persistencia y refresh

- Las pestañas dinámicas con `payload` serializable (sólo IDs/strings) se guardan en `sessionStorage` y se restauran al refrescar.
- El estado del formulario dentro de la vista se preserva mientras la pestaña esté abierta (igual que los módulos), porque el componente queda montado con `hidden`.

## Detalles técnicos

```text
src/components/workspace/
  module-registry.ts          (sin cambios estructurales)
  dynamic-views.ts            NEW — registry de vistas dinámicas
  workspace-context.tsx       refactor: openTabs: WorkspaceTab[]
  workspace-panels.tsx        renderiza módulos + dinámicas
  workspace-tabs-bar.tsx      muestra ambos tipos

src/components/workspace/views/
  suministro-new-view.tsx     NEW
  suministro-meters-view.tsx  NEW
  socio-new-view.tsx          NEW
  tarifa-new-view.tsx         NEW
  lectura-new-view.tsx        NEW
  factura-new-view.tsx        NEW
  factura-detail-view.tsx     NEW
  reclamo-detail-view.tsx     NEW
  cuadrilla-edit-view.tsx     NEW

src/routes/_authenticated/admin.*.tsx
  - quitar Sheet/Dialog
  - botones llaman ws.openDynamicTab({...})
```

Los hooks (`useCreateSupply`, etc.) se mueven tal cual a las nuevas vistas. La lógica de form no cambia, sólo el contenedor.

## Riesgos

- El `ClaimDetailSheet` y `MetersSheet` son complejos; mover a vista requiere también ajustar `SheetFooter` → footer normal. Sin pérdida funcional.
- Pestañas dinámicas pueden acumularse; el menú contextual (Cerrar todas / a la derecha) ya cubre la limpieza.

## Validación

- Abrir "Nuevo suministro" desde Suministros → aparece pestaña nueva en la barra, el módulo Suministros queda intacto.
- Cambiar a Socios y volver: el formulario sigue con los datos cargados.
- Crear el suministro: la pestaña se cierra y la lista de Suministros se refresca.
- Abrir "Ver" en una factura: pestaña "Factura F-XXX". Abrir otra: dos pestañas distintas, navegables.
- Refresh del navegador: las pestañas (incluidas las dinámicas con payload) se restauran.
