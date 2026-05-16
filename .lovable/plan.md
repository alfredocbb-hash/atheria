# Documentación del proyecto

Generaré dos documentos en **Markdown** (versionables en el repo) y **PDF** (para compartir), guardados en `/mnt/documents/`. Sin branding específico — uso genérico "Cooperativa de Servicios".

## Entregables

1. `GUIA_TECNICA.md` + `GUIA_TECNICA.pdf` — para el equipo de desarrollo
2. `GUIA_USUARIO.md` + `GUIA_USUARIO.pdf` — para el socio/cliente final

## Guía técnica (detallada)

1. **Resumen del proyecto** — propósito (portal de socios para cooperativa de servicios públicos: agua/luz/etc.), alcance funcional por fases
2. **Arquitectura general** — diagrama de capas (frontend TanStack Start → server functions → Supabase Postgres con RLS + Realtime), runtime serverless (Cloudflare Worker)
3. **Stack técnico** — React 19, TanStack Start v1, TanStack Router (file-based), Vite 7, Tailwind v4, shadcn/ui, Supabase (Lovable Cloud), Zod, TanStack Query
4. **Estructura de carpetas** — `src/routes/`, `src/lib/*.functions.ts`, `src/hooks/`, `src/components/`, `src/integrations/supabase/`, `supabase/migrations/`
5. **Autenticación y autorización** — flujo email/password, tabla `user_roles` con enum `app_role`, función `has_role()` security definer, race condition resuelta con `rolesLoaded`, rutas `_authenticated/` y redirección admin vs cliente
6. **Modelo de datos** — listado completo de tablas por dominio:
   - Padrones: `profiles`, `members`, `supplies`, `addresses`, `meters`
   - Facturación: `tariffs`, `invoices`, `invoice_items`, `payments` (+ trigger `recompute_invoice_balance`)
   - Reclamos: `claim_categories`, `claims`, `crews`, `work_orders`
   - Auditoría/notificaciones: `audit_log`, `notifications`
7. **RLS** — patrón "admin ve todo, cliente ve lo propio vía `members.user_id`", listado de policies clave
8. **Server functions (`createServerFn`)** — convenciones, `requireSupabaseAuth`, `attachSupabaseAuth` en `src/start.ts`, inputs con Zod, ejemplos por dominio
9. **Triggers y funciones SQL** — `handle_new_user`, `claims_audit_notify`, `work_orders_audit_notify`, `invoices_audit`, `payments_audit_notify`, `recompute_invoice_balance`, `log_audit`, `notify_member_user`
10. **Realtime** — canal de `notifications`, integración con `sonner` toasts
11. **Convenciones de UI** — design tokens en `src/styles.css` (oklch), componentes shadcn, layouts admin/cliente
12. **Flujo de desarrollo** — cómo agregar una tabla (migración + types regenerados), agregar un server fn, agregar una ruta, agregar una notificación automática
13. **Despliegue y entornos** — Lovable Cloud, URLs estables, secrets
14. **Troubleshooting** — errores comunes (Unauthorized en serverFn, race condition de roles, RLS bloqueando insert, migración fallida)
15. **Roadmap** — fases completadas (1-5) y próximas (emails, pagos online, lectura de medidores)

## Guía de usuario (cliente final / socio)

1. **Bienvenida** — qué es el portal del socio
2. **Crear cuenta e iniciar sesión** — registro con email, verificación, recuperar contraseña
3. **Panel principal `/cliente`** — qué se ve al entrar
4. **Mis suministros** — ver direcciones, medidores asociados
5. **Mis facturas** — consultar, descargar, ver vencimientos y saldo
6. **Pagos** — cómo se reflejan los pagos registrados
7. **Reclamos** — crear un reclamo (categoría, prioridad, descripción), seguimiento de estado (received → in_progress → completed)
8. **Notificaciones** — campanita, toasts en tiempo real, marcar como leído
9. **Preguntas frecuentes** — qué hacer si no veo mi suministro, cómo cambiar datos personales, contacto con la cooperativa
10. **Glosario** — suministro, medidor, factura, reclamo, orden de trabajo

## Generación técnica

- Markdown a mano con estructura clara y diagramas en bloques ASCII / mermaid
- PDF generado vía `pandoc` (o `reportlab` si pandoc no está) con estilo limpio
- QA visual: convertir cada PDF a imágenes con `pdftoppm` e inspeccionar todas las páginas antes de entregar
- Entrega final como `<presentation-artifact>` (4 archivos)

Sin cambios al código del proyecto — solo generación de documentos en `/mnt/documents/`.