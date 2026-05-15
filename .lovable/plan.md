
# Coopecur 2.0 — Plan de Acción

Plataforma de gestión de servicios públicos (modelo Metrogas/Edesur) para una cooperativa. Stack: React + Vite + TS, Tailwind + shadcn/ui, TanStack Query, RHF + Zod, Supabase (Auth + Postgres + RLS).

Entendido el dominio: relación **Titular (profile) → Suministro (service_point) → Facturación (invoice) / Reclamos (ticket)**, con tres roles diferenciados (`admin`, `operator`, `client`) y dos portales separados (Cliente vs Administrativo/Técnico).

---

## Fase 1 — Cimientos: Auth, Roles y Layout Institucional

Objetivo: dejar lista la base sobre la que se monta todo el dominio.

- Habilitar Lovable Cloud (Supabase) y configurar Auth (email/password + Google).
- Esquema de roles seguro: enum `app_role` + tabla `user_roles` separada + función `has_role()` SECURITY DEFINER (no guardar `role` en `profiles` para evitar escalada de privilegios).
- Tabla `profiles` con trigger `handle_new_user` para auto-crear el perfil al registrarse.
- Routing protegido con TanStack Router:
  - `/` landing institucional pública
  - `/login`, `/register`, `/reset-password`
  - `/_authenticated/cliente/*` (rol `client`)
  - `/_authenticated/admin/*` (rol `admin` | `operator`)
  - Redirect post-login según rol.
- Design system corporativo en `src/styles.css`: paleta institucional (azul/gris cooperativo), tipografía densa, tokens de estado (pending/paid/expired, open/critical/resolved).
- Layouts de portal: sidebar denso para admin, top-nav compacta para cliente.
- `useAuth` + `useRole` como custom hooks sobre TanStack Query.

Entregable: usuario puede registrarse, iniciar sesión, y aterrizar en su portal correcto con un layout vacío pero institucional.

---

## Fase 2 — Modelo de Dominio: Padrones (Titulares + Suministros)

Objetivo: la columna vertebral de cualquier cooperativa de servicios.

- Migraciones Supabase:
  - `profiles` (extender con `document_id`, `phone`)
  - `service_points` (FK a `profiles`, `meter_number` único, `status` enum, dirección normalizada)
  - Índices por `meter_number`, `document_id`, `client_id`.
- RLS:
  - `client`: solo SELECT de sus propios `service_points`.
  - `operator`/`admin`: SELECT de todos; INSERT/UPDATE solo `admin`.
- Custom hooks: `useServicePoints`, `useServicePoint(id)`, `useUpsertServicePoint`, `useClientsSearch`.
- UI Admin — **Gestión de Padrones**:
  - Búsqueda avanzada server-side (por DNI/CUIT, medidor, dirección, titular) con debouncing.
  - Tabla densa enterprise (paginación, filtros por estado, sort).
  - Detalle de Titular con sus N medidores asociados.
  - Alta/baja de titulares y suministros (RHF + Zod).
  - Acción "Suspender / Reconectar suministro" con confirmación.
- UI Cliente — **Mis Medidores**: card por suministro con estado y dirección.

Entregable: un admin puede gestionar el padrón completo y un cliente ve sus medidores asociados.

---

## Fase 3 — Facturación y Estado de Cuenta

Objetivo: ciclo económico básico (sin AFIP real, dejando hook para futuro CAE).

- Migración `invoices` con enum `invoice_status`, `period` (formato `YYYY-MM`), `afip_cae` nullable.
- Constraint: una factura por `(service_point_id, period)`.
- Job/función SQL para marcar facturas como `expired` cuando `due_date < now()`.
- RLS: cliente ve solo facturas de sus suministros; admin ve todo; operator solo lectura.
- Custom hooks: `useInvoices`, `useInvoiceStats`, `useGenerateBillingRun`, `useRegisterPayment`.
- UI Cliente:
  - **Dashboard**: saldo deudor total agregado, próximo vencimiento, alertas.
  - **Mis Facturas**: historial con badges de estado, gráfico de consumo por período, botón "Descargar PDF" (mock).
- UI Admin — **Centro de Facturación**:
  - Emisión masiva por período (selector de mes + preview de cantidad de suministros + confirmación).
  - Registro manual de cobranzas (buscar factura → marcar `paid` → fecha y medio de pago).
  - Reporte de morosidad con filtros.
- KPIs: total facturado, % cobrado, morosidad, en el dashboard admin.

Entregable: ciclo completo emitir → cliente ve → admin registra pago.

---

## Fase 4 — Reclamos y Despacho de Cuadrillas

Objetivo: operación técnica en tiempo real.

- Migración `tickets` con enums `ticket_status`, `ticket_priority`, FK a `service_points` y a `profiles` (assigned_to operator).
- Realtime de Supabase en la tabla `tickets` para el panel de despacho.
- RLS: cliente crea/ve solo tickets de sus suministros; operator ve los asignados + sin asignar; admin ve todo.
- Custom hooks: `useTickets`, `useTicketTimeline`, `useAssignTicket`, `useUpdateTicketStatus`.
- UI Cliente — **Oficina Virtual**:
  - Formulario de nuevo reclamo (suministro, categoría, descripción, prioridad sugerida).
  - Listado de reclamos con timeline vertical (estados + comentarios + asignación).
- UI Admin/Operator — **Despacho de Cuadrillas**:
  - Vista Kanban por estado (open → in_progress → resolved → closed) con drag & drop.
  - Vista tabla enterprise alternativa con filtros por prioridad, operario, zona.
  - Asignación rápida a operarios técnicos.
  - Badges visuales para `critical`.
- Dashboard de Operaciones (admin): contadores de reclamos críticos activos, tiempo promedio de resolución, suministros suspendidos.

Entregable: cliente reporta → admin despacha → operario resuelve, todo con actualización en vivo.

---

## Fase 5 — Pulido, Seguridad y Preparación a Producción

Objetivo: dejar Coopecur 2.0 lista para piloto real.

- Auditoría: tabla `audit_log` con triggers en operaciones críticas (suspensiones, cobranzas, cambios de estado de tickets).
- Hardening de RLS: revisar todas las policies, ejecutar el security scanner, activar HIBP en Auth.
- Notificaciones: server function para email al cliente cuando se factura, vence o se actualiza un reclamo.
- Exportaciones CSV (padrón, facturación, reclamos).
- Seed de datos demo (titulares, suministros, facturas, tickets) para QA.
- Estados vacíos, skeletons, error boundaries y manejo de errores consistente.
- SEO básico de la landing pública, accesibilidad y responsive del portal cliente.
- Stub de integración AFIP (estructura de campos `afip_cae`, hook listo para ser conectado en una futura fase 6).

Entregable: plataforma estable, segura y demostrable a la cooperativa.

---

## Notas técnicas transversales

- Toda lógica sensible (emisión masiva, asignación, registro de pago) detrás de **server functions** (`createServerFn` + `requireSupabaseAuth`), nunca queries directas desde el cliente.
- Validación dual: Zod en el form **y** Zod en el `inputValidator` de cada server function.
- TanStack Query con `queryKey` jerárquicas (`['invoices', { clientId, period }]`) e invalidación granular tras mutaciones.
- shadcn/ui como base; variantes propias (`badge-status-paid`, `badge-priority-critical`) en el design system, nunca colores hardcoded.
- Roles **siempre** verificados server-side vía `has_role()`, no en el cliente.

---

Confirmá el plan (o pedime ajustes en alguna fase) y arranco con la **Fase 1**.
