# Módulo de Configuración

Plan para configuración por **tenant** (cooperativa) y configuración **global** (super admin).

## 1. Base de datos

### Tabla `tenant_settings` (1:1 con `tenants`)
Parámetros del sistema + datos de la empresa de cada cooperativa.

Campos:
- `tenant_id` (PK, FK a tenants)
- **Parámetros del sistema:**
  - `billing_day` (int 1–31) — día de facturación
  - `first_due_day` (int 1–31) — primer vencimiento
  - `second_due_day` (int 1–31) — segundo vencimiento
  - `interest_rate_after_first` (numeric) — % interés diario tras 1er venc.
  - `interest_rate_after_second` (numeric) — % interés diario tras 2do venc.
  - `cesp_code` (text) — código CESP
- **Datos de la empresa:**
  - `legal_name`, `cuit`, `trade_name`
  - `legal_address`, `fiscal_address`
  - `email`, `phone_main`, `phone_mobile`, `whatsapp`, `website`
  - `email_services`, `email_inquiries`, `email_collections`
  - `iibb`
- `updated_at`, `updated_by`

**RLS:**
- SELECT: super admin, o miembros del tenant (admin/operador/user) del propio tenant
- UPDATE/INSERT: super admin, o admin del tenant
- Trigger `touch_updated_at`

### Tabla `app_settings` (singleton global)
Configuración global del super admin (marca SaaS, soporte, defaults).

Campos sugeridos:
- `id` (singleton, check id = 1)
- `platform_name`, `support_email`, `support_phone`, `support_whatsapp`
- `default_billing_day`, `default_first_due_day`, `default_second_due_day`
- `default_interest_after_first`, `default_interest_after_second`
- `terms_url`, `privacy_url`
- `updated_at`, `updated_by`

**RLS:** SELECT autenticados; UPDATE solo super admin.

## 2. UI Tenant — `/admin/configuracion`

Nueva ruta `src/routes/_authenticated/admin.configuracion.tsx` con dos tabs (shadcn `Tabs`):

1. **Parámetros del sistema** — formulario con los 6 campos numéricos/texto, validados con zod (días 1–31, % ≥ 0).
2. **Datos de la empresa** — formulario agrupado en secciones: Identificación (razón social, CUIT, nombre fantasía, IIBB), Domicilios, Contacto, Emails operativos.

Patrón: `react-hook-form` + `zodResolver`, `useQuery` para leer, `useMutation` para guardar. Toast de éxito/error.

Agregar entrada "Configuración" en el menú lateral del admin.

## 3. UI Super Admin — `/super/configuracion`

Nueva ruta `src/routes/_authenticated/super.configuracion.tsx` con dos tabs:

1. **Plataforma** — edita `app_settings` (nombre, contactos de soporte, defaults, URLs legales).
2. **Configuración por cooperativa** — selector de tenant + reutiliza el mismo formulario que el tenant (mismos componentes) para editar `tenant_settings` de cualquier cooperativa.

Agregar entrada "Configuración" en el menú del super admin.

## 4. Componentes compartidos

- `src/components/settings/SystemParamsForm.tsx`
- `src/components/settings/CompanyInfoForm.tsx`
- `src/components/settings/PlatformSettingsForm.tsx`
- `src/hooks/use-tenant-settings.ts` y `use-app-settings.ts`

Validaciones zod compartidas en `src/lib/settings-schemas.ts` (CUIT 11 dígitos, email válido, URL válida, teléfonos, % entre 0–100, días 1–31).

## 5. Detalles técnicos

- Lecturas desde el navegador con `supabase` (RLS aplica) — no requiere server function.
- Al crear un nuevo tenant, insertar fila default en `tenant_settings` (trigger o al momento del onboarding).
- Seed de `app_settings` con un INSERT inicial id=1.
- No tocar `routeTree.gen.ts` ni archivos preconfigurados.

## Fuera de alcance
- Aplicar automáticamente fechas/intereses al motor de facturación (se integra después).
- Logo/branding por tenant (puede añadirse luego si se necesita).
