## Estado actual

**Cliente** (`/cliente`) — ya tiene:
- ✅ Crear reclamo (diálogo "Nuevo reclamo" con categoría, prioridad, suministro, ubicación, descripción).
- ✅ Listado de facturas con saldo, vencimiento y estado.
- ✅ Listado de reclamos con estado.
- ❌ NO puede ver el detalle de una factura ni descargarla/reimprimirla.

**Admin/Operador** (`/admin`) — KPIs hardcodeados con `—` y "Próximamente". Sin datos reales.

## Cambios

### A. Dashboard Admin con datos reales

1. **Nuevo server fn `getAdminDashboardStats`** en `src/lib/dashboard.functions.ts`:
   - Middleware: `requireSupabaseAuth` + chequeo staff (admin u operator).
   - Agregados en paralelo:
     - `members_active` (count `members` status='active')
     - `supplies_active` / `supplies_suspended`
     - `invoices_overdue_count` + `invoices_overdue_amount` (status='overdue' o due_date<hoy y balance>0)
     - `month_billed` (sum `total` de facturas del mes en curso)
     - `claims_open` + `claims_urgent`
     - `recent_invoices` (últimas 5 con socio/suministro)
     - `recent_claims` (últimos 5 con socio)

2. **Hook** `useAdminDashboard` en `src/hooks/use-dashboard.ts` (useQuery).

3. **Rediseñar** `src/routes/_authenticated/admin.index.tsx`:
   - 4 KPIs reales: Reclamos abiertos (con badge urgentes), Facturado del mes, Facturas vencidas (cantidad + monto), Socios activos.
   - 2 cards lado a lado: "Últimas facturas" y "Últimos reclamos" (tablas compactas).
   - Skeleton/Loader2 durante la carga.
   - Conservar `useEnsureTab("dashboard")`.

### B. Portal Cliente — Ver/Reimprimir factura

1. **Nuevo server fn `getMyInvoiceDetail`** en `src/lib/billing.functions.ts`:
   - Middleware: `requireSupabaseAuth`.
   - Input: `{ invoice_id }`. Verifica que la factura pertenezca a un suministro de un member con `user_id = auth.uid()`.
   - Devuelve factura + items + pagos + datos del socio/suministro/dirección de la cooperativa.

2. **Nuevo componente** `src/components/client/invoice-detail-dialog.tsx`:
   - Diálogo modal con vista imprimible de la factura: encabezado de cooperativa, datos del socio, período, items (descripción/cantidad/precio/importe), subtotal, impuestos, total, saldo, pagos registrados.
   - Botón **"Imprimir"** que dispara `window.print()` con `@media print` que oculta UI fuera del diálogo.
   - Botón "Cerrar".

3. **Modificar** `src/routes/_authenticated/cliente.tsx`:
   - En la lista "Mis facturas", cada fila clickeable o con botón "Ver" que abre `InvoiceDetailDialog`.
   - Resaltar visualmente facturas con saldo > 0 (botón "Ver / Imprimir" destacado en pendientes).

4. **Hook** `useMyInvoiceDetail(invoiceId)` en `src/hooks/use-billing.ts`.

### Notas
- No requiere migración SQL — RLS de `invoices`/`invoice_items`/`payments` ya permite al cliente leer sus propios datos.
- La "reimpresión" se resuelve con `window.print()` sobre la vista del diálogo, sin generar PDF en servidor (alcance acotado; podemos pasar a PDF en una iteración futura si lo pedís).
- El operator usa el mismo dashboard admin (ya está gateado en el layout).
