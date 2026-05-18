## Vinculación automática socio ↔ usuario del portal

Fallback manual elegido: **Número de socio + DNI**.

### A. Migración SQL

1. **Reemplazar `handle_new_user`** para auto-vincular por email en el signup:
   ```sql
   -- después de insertar profile + role
   UPDATE public.members
   SET user_id = NEW.id
   WHERE user_id IS NULL
     AND lower(email) = lower(NEW.email)
     AND (SELECT count(*) FROM public.members
          WHERE user_id IS NULL AND lower(email) = lower(NEW.email)) = 1;
   ```

2. **Nuevo trigger `members_autolink_user`** (`BEFORE INSERT OR UPDATE OF email, user_id` en `members`): si `NEW.user_id IS NULL` y `NEW.email` no es null, busca en `auth.users` un único usuario con ese email y setea `NEW.user_id`. Cubre el caso "el cliente ya tenía cuenta y el admin lo da de alta como socio después".

3. **Índice** `CREATE INDEX members_email_lower_idx ON members (lower(email))` para acelerar matching.

4. **Backfill one-shot** dentro de la migración:
   ```sql
   UPDATE members m SET user_id = u.id
   FROM auth.users u
   WHERE m.user_id IS NULL
     AND lower(m.email) = lower(u.email)
     AND (SELECT count(*) FROM members m2
          WHERE m2.user_id IS NULL AND lower(m2.email) = lower(u.email)) = 1;
   ```

### B. Server function `linkMyMember`

Archivo: `src/lib/padron.functions.ts`

- Middleware: `requireSupabaseAuth`
- Input (zod): `member_number` (string, 1–40, regex alfanumérico/`-`), `document_id` (string, 6–20, regex `[0-9A-Za-z.-]`)
- Lógica:
  1. Buscar `members` con `member_number = X` y `document_id = Y` (case-insensitive en doc) y `user_id IS NULL`.
  2. Si no hay match → `throw new Error("No se encontró un socio con esos datos o ya está vinculado")`.
  3. Si hay match → `UPDATE members SET user_id = auth.uid() WHERE id = ... AND user_id IS NULL`.
  4. Retornar `{ member_id }`.
- Log de auditoría: `log_audit('member.linked', 'member', id, auth.uid(), {...})`.

### C. Hook `useLinkMyMember`

Archivo: `src/hooks/use-padron.ts`

- `useMutation` wrapping del server fn.
- `onSuccess`: invalidar `["padron", "my"]` y `["billing", "my-invoices"]` + `["claims", "my"]`. Toast "Cuenta vinculada".
- `onError`: toast con `e.message`.

### D. UI portal cliente

En `src/routes/_authenticated/cliente.tsx`, cuando `data?.member` es `null` (hoy muestra el mensaje "Tu cuenta aún no está vinculada a un socio. Contactá a la cooperativa"):

Reemplazar por una **Card "Vincular mi cuenta"**:
- Texto explicativo corto.
- Inputs: Número de socio, DNI.
- Botón "Vincular" (deshabilitado mientras `isPending`).
- Validación client-side con zod (mismas reglas que el server).
- Si el server retorna error, mostrar mensaje en el form.
- Texto secundario: "¿Tenés problemas para vincular? Contactá a la cooperativa."

La card reemplaza el mensaje en la sección "Mis suministros" y se muestra arriba del resto (lo más prominente cuando no hay vínculo).

### Notas

- No requiere cambios en RLS: las policies actuales ya permiten a un cliente ver su `members` por `user_id = auth.uid()`. La validación del `linkMyMember` corre server-side con el cliente autenticado.
- El matching usa dos datos (no solo número de socio) para evitar que cualquiera reclame una cuenta ajena conociendo solo el número.
- Si el padrón tiene DNIs con guiones/puntos, normalizamos en la comparación (strip de `.` y `-` en ambos lados).
