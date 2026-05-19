## Contexto

Repasé el código y la base de datos. Dos puntos:

### 1) Aislamiento por tenant (clientes, tarifas, reclamos, servicios, etc.)

Ya está implementado a nivel de base de datos. Todas las tablas operativas (`members`, `supplies`, `tariffs`, `claims`, `meters`, `invoices`, `payments`, etc.) tienen RLS con la cláusula:

```
tenant_id = current_tenant_id() AND is_tenant_member(tenant_id, ...)
```

`current_tenant_id()` resuelve automáticamente el tenant del usuario logueado (o el "actuando como" del super admin). Es decir: **cada admin/operador de una cooperativa solo ve los datos de su cooperativa**, sin necesidad de cambios. Si querés, puedo agregar una verificación rápida en pantalla creando un segundo tenant de prueba.

No se requiere modificar nada en esta parte. Si estás viendo datos cruzados, lo más probable es que sea por estar "Actuando como" un tenant desde el modo super admin (banner cyan en el header). Confirmame si ese es el caso.

### 2) Falta botón Editar en Tarifas

Confirmado: en `/admin/tarifas` la columna **Acciones** solo tiene el botón eliminar. Sin embargo, ya existen `updateTariff` (server fn) y `useUpdateTariff` (hook), así que sumar la edición es directo.

---

## Plan de cambios

**Alcance:** únicamente UI de tarifas. No toca RLS ni lógica de negocio.

### A. Nueva vista de edición de tarifa
- Crear `src/components/workspace/views/tarifa-edit-view.tsx` (clonando el formulario de `tarifa-new-view.tsx`) que:
  - Recibe `payload: { id: string }`.
  - Carga la tarifa actual desde `useTariffs()` (filtra por id) para precargar el form.
  - Al guardar usa `useUpdateTariff()` con `{ id, patch: form }` y cierra la pestaña.
  - Botones "Guardar cambios" y "Cancelar".

### B. Registrar la vista dinámica
- En `src/components/workspace/dynamic-views.ts`: agregar `"tarifa.edit": TarifaEditView`.

### C. Agregar acción Editar en la tabla
- En `src/routes/_authenticated/admin.tarifas.tsx`:
  - Ampliar la columna Acciones para incluir un botón con icono `Pencil` (variant ghost, iconOnly).
  - Al hacer click llama a `ws.openView({ id: \`view:tarifa.edit:${t.id}\`, viewKey: "tarifa.edit", title: \`Editar: ${t.name}\`, iconKey: "pencil", parentModule: "tarifas", payload: { id: t.id } })`.

### D. Permisos
- El check `adminOnly` ya está en el módulo Tarifas a nivel de navegación; el botón editar queda visible para cualquier staff que entre al módulo (igual que ahora el toggle activo/eliminar). Si querés restringirlo solo a `admin` (no operador), lo agrego con `auth.hasRole("admin")` envolviendo el botón.

---

## Detalle técnico

- No requiere migraciones ni cambios en server functions (todo ya existe).
- Tipo `payload` del workspace ya soporta objetos arbitrarios.
- El `id` del tab incluye el `t.id` para permitir editar varias tarifas en paralelo sin colisión.

## Fuera de alcance

- Cambios en RLS o multi-tenant.
- Edición masiva de tarifas.
- Versionado/historial de tarifas (la tabla ya tiene `valid_from/valid_to` para eso).

¿Confirmás que avance con el plan, y querés que restrinja el botón Editar solo a rol `admin` o lo dejo accesible para staff (admin + operador)?
