## Objetivo

1. Promover a `alfredocbb@gmail.com` al rol `admin`.
2. Agregar un módulo de **Gestión de Roles** dentro del backoffice, accesible únicamente para administradores.

---

## Paso 1 — Bootstrap del primer admin

Como el usuario aún no existe en `auth.users` (o sí, según su primer login), se hará en dos partes:

- **Trigger de bootstrap (SQL):** modificar `handle_new_user()` para que, si `NEW.email = 'alfredocbb@gmail.com'`, inserte en `user_roles` con rol `admin` en vez de `client`. Esto cubre el caso de que aún no se haya registrado.
- **Reasignación inmediata (data):** si ya existe el usuario, ejecutar un `INSERT` en `user_roles (user_id, role)` con `admin` (y opcionalmente borrar el `client` previo) usando el `id` resuelto desde `auth.users` por email.

> Nota: se mantiene el principio de no modificar `auth.users` directamente; sólo lectura por email para resolver el `user_id`.

---

## Paso 2 — Módulo "Gestión de Roles" (solo admin)

### Backend (server functions, `src/lib/users.functions.ts`)

Todas protegidas con `requireSupabaseAuth` + verificación server-side de `has_role(userId, 'admin')`. Si el caller no es admin → `throw new Error('Forbidden')`.

- `listUsersWithRoles()` → join de `profiles` + `user_roles` agregados como array de roles. Soporta búsqueda por email/nombre/documento y paginación.
- `assignRole({ userId, role })` → inserta el rol (idempotente vía `ON CONFLICT DO NOTHING` sobre `unique(user_id, role)`).
- `revokeRole({ userId, role })` → borra el rol. Validación: no permitir que un admin se quite a sí mismo el rol `admin` (evita lockout).
- `setPrimaryRole({ userId, role })` → reemplazo atómico (delete + insert) cuando se quiere un rol único.

Auditoría mínima: `console.log` estructurado con `actorId`, `targetId`, `action`, `role` (la tabla `audit_log` formal queda para Fase 5 según plan original).

### Migración SQL adicional

- Constraint UNIQUE `(user_id, role)` en `user_roles` (verificar que ya existe; si no, agregar).
- Índice en `user_roles(user_id)` para acelerar el join.

### Frontend

- **Ruta:** `src/routes/_authenticated/admin/usuarios.tsx` (solo accesible si `hasRole('admin')`; redirige si no).
- **Sidebar:** habilitar item "Usuarios y Roles" en `admin-portal-layout.tsx` con icono `ShieldCheck`, visible sólo si `auth.hasRole('admin')` (operadores no lo ven).
- **UI:**
  - Tabla enterprise (shadcn `Table`) con columnas: Nombre, Email, Documento, Roles (badges), Acciones.
  - Buscador con `Input` + debounce.
  - Acción por fila: `DropdownMenu` con "Asignar admin / operador / cliente" y "Quitar rol X".
  - `AlertDialog` de confirmación para cambios destructivos.
  - Toasts de éxito/error con `sonner`.
- **Hooks** (`src/hooks/use-users.ts`): `useUsersWithRoles`, `useAssignRole`, `useRevokeRole` (TanStack Query con invalidación de `['admin','users']`).

### Validación

- Zod schemas compartidos: `RoleSchema = z.enum(['admin','operator','client'])`, `UserIdSchema = z.string().uuid()`.
- Doble validación: cliente (RHF) + servidor (`inputValidator`).

---

## Detalles técnicos

```text
src/
├── lib/
│   └── users.functions.ts          # listUsersWithRoles, assignRole, revokeRole
├── hooks/
│   └── use-users.ts                # wrappers TanStack Query
├── routes/_authenticated/admin/
│   └── usuarios.tsx                # nueva ruta
└── components/admin/
    ├── users-table.tsx
    └── role-actions-menu.tsx
```

### Seguridad

- RLS de `user_roles` ya restringe SELECT/INSERT/UPDATE/DELETE a admins → las server functions actúan como el usuario y la base lo respalda.
- `has_role()` SECURITY DEFINER ya existente → reutilizada en el guard server-side.
- Guard anti-lockout: rechazar `revokeRole({ userId: actorId, role: 'admin' })` si es el último admin del sistema (`SELECT count(*) FROM user_roles WHERE role='admin'`).

---

## Entregables por fase de este cambio

1. Migración SQL: trigger actualizado + (si falta) índice/constraint.
2. Insert de datos: promover a `alfredocbb@gmail.com` si ya existe.
3. Server functions + hooks.
4. Ruta y UI de gestión.
5. Item de sidebar condicionado por rol admin.

¿Avanzo con la implementación?
