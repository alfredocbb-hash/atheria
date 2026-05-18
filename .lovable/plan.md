# Editar socios desde el admin

Actualmente en `/admin/socios` el admin solo ve el botón de eliminar. Falta el de **editar**. El backend (`useUpdateMember` + server fn `updateMember`) ya existe, así que solo es trabajo de UI: extender el formulario existente para soportar modo edición y abrirlo desde el listado.

## Cambios

### 1. `src/components/workspace/views/socio-new-view.tsx`
Convertir el componente en dual-modo (crear / editar):
- Aceptar `payload?: { member?: Member }` desde el workspace.
- Si viene `member`, precargar `defaultValues` y usar `useUpdateMember` en lugar de `useCreateMember`.
- Ajustar título ("Nuevo socio" vs "Editar socio · {nombre}") y label del botón ("Crear socio" vs "Guardar cambios").
- En edición, el campo `N° socio` queda deshabilitado (es identificador estable).

### 2. `src/components/workspace/dynamic-views.ts`
Sin cambios estructurales — el mismo `socio.new` viewKey sirve para ambos modos. (Alternativa más limpia: registrar también `socio.edit` apuntando al mismo componente para que el título por defecto y el iconKey sean correctos.)

### 3. `src/routes/_authenticated/admin.socios.tsx`
En la columna **Acciones**, junto al `DeleteButton`, agregar un botón **Editar** (ícono lápiz) que abre el view con el socio cargado:

```tsx
ws.openView({
  id: `view:socio.edit:${m.id}`,
  viewKey: "socio.edit",
  title: `Editar · ${m.full_name}`,
  iconKey: "pencil",
  parentModule: "socios",
  payload: { member: m },
})
```

## Detalles técnicos

- `useUpdateMember` ya acepta `{ id, patch }` y invalida `["padron", "members"]`, por lo que el listado se refresca solo tras guardar.
- El schema Zod actual sirve tal cual para ambos modos.
- En edición se envía como `patch` solo los campos editables (`full_name`, `document_id`, `email`, `phone`, `status`, `notes`); `member_number` se omite.
- Visibilidad: el botón Editar se muestra para admin **y** operador (igual que el resto del CRUD de socios — RLS `Staff full access on members` ya lo permite). Si preferís limitarlo a admin solo, lo envolvemos en un check `auth.hasRole("admin")` como hace `DeleteButton`.

## Fuera de alcance

- Cambiar la política de roles.
- Re-asignar la vinculación con `user_id` desde este formulario (sigue siendo automática por email).
