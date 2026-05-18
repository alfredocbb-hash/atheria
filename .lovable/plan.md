## Diagnóstico

Síntoma reportado: en `/admin/socios` el botón "Nuevo socio" abre la pestaña pero el formulario no aparece (solo se ve el título). El warning de consola "concurrent rendering recovered by sync render" sugiere que algún hijo lanza durante render y, al no haber `ErrorBoundary` en los paneles del workspace, el sub-árbol queda vacío en silencio.

Sin instrumentación no podemos ver el mensaje exacto. El plan es:

1. **Instrumentar** todos los paneles con un `ErrorBoundary` para que cualquier error se vea en pantalla.
2. **Aplicar fix preventivo** al patrón sospechoso (campos `email` opcionales con `.email().optional().or(z.literal(""))` + react-hook-form v7 + `@hookform/resolvers` v5).
3. **Revisar todos los botones "Nuevo …"** del menú (no solo socios), aplicando el mismo refuerzo a los views que comparten el patrón.

## Inventario de botones a verificar

Todos abren pestañas vía `ws.openView`:

- Socios → `socio.new`
- Suministros → `suministro.new`, `suministro.meters` (gestionar medidores)
- Facturación → `tarifa.new`, `lectura.new`, `factura.new`, `factura.detail`
- Reclamos → `reclamo.detail`, `cuadrilla.edit` (nueva y edición)

## Cambios

### 1) ErrorBoundary en paneles del workspace

Nuevo `src/components/workspace/view-error-boundary.tsx`:
- Clase con `getDerivedStateFromError` que muestra título, `error.message`, stack en `<pre>`, botón "Reintentar" (reset state) y "Cerrar pestaña" (llama `closeTab(tabId)` vía prop).

Modificar `src/components/workspace/workspace-panels.tsx`:
- Envolver cada panel (módulo y view) en `<ViewErrorBoundary tabId={tab.id} title={...}>...</ViewErrorBoundary>`.

### 2) Refuerzo de schemas en los views de formulario

Patrón a aplicar en todos los views con `useForm + zodResolver`:
- Reemplazar `z.string().email("…").optional().or(z.literal(""))` por:
  ```ts
  z.union([z.literal(""), z.string().email("Email inválido")]).optional()
  ```
- Asegurar `defaultValues` con `""` para todos los `optional()` (evita `undefined` que rompe controles controlados).
- Para `Select` controlados, garantizar que `value={field.value ?? ""}` no quede `undefined`.

Archivos a revisar/ajustar:
- `src/components/workspace/views/socio-new-view.tsx` (email)
- `src/components/workspace/views/suministro-new-view.tsx` (defaults de address.*)
- `src/components/workspace/views/factura-new-view.tsx`
- `src/components/workspace/views/factura-detail-view.tsx`
- `src/components/workspace/views/lectura-new-view.tsx`
- `src/components/workspace/views/tarifa-new-view.tsx`
- `src/components/workspace/views/reclamo-detail-view.tsx`
- `src/components/workspace/views/cuadrilla-edit-view.tsx`
- `src/components/workspace/views/suministro-meters-view.tsx`

Para cada uno: leer el archivo, normalizar defaults y schemas según el patrón. Sin tocar lógica de mutaciones ni server functions.

### 3) Verificación manual (post-implementación)

Recorrer cada módulo y disparar cada botón "Nuevo …" / acción que abre pestaña:
- Socios → Nuevo socio
- Suministros → Nuevo suministro, Gestionar medidores
- Facturación → Nueva tarifa, Nueva lectura, Generar factura, Ver factura
- Reclamos → Ver reclamo, Nueva cuadrilla, Editar cuadrilla

Para cada uno confirmar:
- aparece la pestaña en la barra
- el panel muestra el formulario/detalle completo (no queda en blanco)
- "Cancelar" o equivalente cierra la pestaña
- "Crear/Guardar" funciona y cierra/refresca

Si algún panel cae en `ViewErrorBoundary`, leer el mensaje y aplicar el fix puntual.

## Archivos tocados

- `src/components/workspace/view-error-boundary.tsx` (nuevo)
- `src/components/workspace/workspace-panels.tsx` (envolver paneles)
- Los 9 archivos en `src/components/workspace/views/` (normalizar schemas/defaults)

Sin cambios en lógica de negocio, server functions ni base de datos.