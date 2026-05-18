## Habilitar edición y borrado para Admin en todo el sistema

Las RLS ya autorizan al rol `admin` a hacer `UPDATE/DELETE` en todas las tablas. Falta el plumbing: server fns + hooks + UI. Borrado **mixto**: facturas y pagos se **anulan** (conservan historial), el resto se **elimina** con confirmación.

### 1. Nuevas server fns (todas con `requireSupabaseAuth` + chequeo `admin`)

| Entidad | Server fn nueva | Acción |
|---|---|---|
| `members` | `deleteMember` | DELETE (bloquea si tiene suministros/facturas/reclamos; sugiere marcar `status='inactive'`) |
| `supplies` | `updateSupply`, `deleteSupply` | UPDATE de todos los campos editables; DELETE (bloquea si hay facturas/medidores activos) |
| `meters` | `updateMeter`, `deleteMeter` | UPDATE; DELETE (bloquea si tiene lecturas) |
| `meter_readings` | `updateReading`, `deleteReading` | DELETE recalcula consumo |
| `tariffs` | `updateTariff`, `deleteTariff` | UPDATE; DELETE solo si no fue usada (no hay invoice con esa tarifa vigente) |
| `crews` | `deleteCrew` | DELETE (bloquea si tiene OT activas) |
| `claims` | `updateClaim`, `deleteClaim` | UPDATE de título/descr./categoría/prioridad/ubicación; DELETE (borra OT y comentarios en cascada) |
| `work_orders` | `updateWorkOrder`, `deleteWorkOrder` | UPDATE de cuadrilla/fecha/notas; DELETE |
| `claim_comments` | `deleteClaimComment` | DELETE |
| `invoices` | `updateInvoice` | UPDATE acotado: `due_date`, `notes`, `period_*` (NO `total/balance`). El borrado sigue siendo `voidInvoice` (ya existe). |
| `payments` | `updatePayment`, `voidPayment` | UPDATE de fecha/monto/método/notas; `voidPayment` borra el pago y recalcula balance de la factura (el trigger `payments_after_change` ya lo hace en DELETE). |

Cada `delete*` valida dependencias con un `count` previo y devuelve mensaje claro ("No se puede eliminar: tiene N facturas").

### 2. Hooks (`src/hooks/`)
Para cada server fn nueva, agregar `useMutation` con invalidación de las queries afectadas (`padron`, `billing`, `claims`, `dashboard`).

### 3. UI — menú de acciones en cada listado admin
Agregar columna "Acciones" con `DropdownMenu` (Editar / Eliminar o Anular) en:

- `admin.socios.tsx` — editar (reusa `socio-new-view` en modo edición) / eliminar
- `admin.suministros.tsx` — editar / eliminar
- `admin.tarifas.tsx` — editar / activar-desactivar (ya existe) / eliminar
- `admin.facturacion.tsx` — editar (vencimiento/notas) / anular / eliminar pago
- `admin.reclamos.tsx` — editar / eliminar; dentro del detalle, editar/eliminar OT y comentarios
- `admin.usuarios.tsx` — ya tiene asignar/revocar rol (sin cambios)
- Vista de medidores/lecturas (dentro de `suministro-meters-view`) — editar/eliminar

Patrón único:
- **Editar**: abre el form existente prellenado (extender los views `*-new-view.tsx` para aceptar prop `initial`/`mode`).
- **Eliminar/Anular**: `AlertDialog` con texto claro ("Esta acción no se puede deshacer" / "Se anulará la factura F-…") y motivo opcional para anulaciones.

### 4. Seguridad y auditoría
- Todas las server fns chequean `has_role(uid, 'admin')` server-side (no confiar en UI).
- Operaciones destructivas registran un evento en `audit_log` (`*.deleted`, `*.updated`) vía la función `log_audit` existente.
- No se modifican RLS ni triggers; los triggers de auditoría/notificación ya cubren `UPDATE/DELETE` en facturas/pagos/reclamos/OT.

### Fuera de alcance
- No se cambia el modelo de datos.
- No se agrega "papelera/undelete".
- El rol `operator` mantiene sus permisos actuales (no se le habilita borrado).
