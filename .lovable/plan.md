# Cambios solicitados

Tres cambios acotados a UI/textos. No se tocan rutas, tablas ni lógica de negocio: las URLs `/admin/socios` y `/admin/suministros`, los nombres internos en el código y la base de datos se mantienen para no romper nada. Solo cambia lo que ve el usuario.

## 1. Sidebar colapsable (backoffice y plataforma super-admin)

Hoy el sidebar es fijo (`w-64`) y solo se oculta en móvil. Se añadirá un modo "compacto" en escritorio:

- Estado `collapsed` persistido en `localStorage` (`atheria.sidebar.collapsed`) para que recuerde la preferencia entre sesiones.
- Cuando está expandido: ancho actual `w-64` con iconos + etiquetas.
- Cuando está colapsado: ancho `w-16`, solo iconos centrados, tooltip con el nombre al pasar el mouse, badge "Actuando como" y email del usuario ocultos.
- Botón de toggle (icono `PanelLeftClose` / `PanelLeftOpen` de lucide) en la cabecera del sidebar, junto al logo.
- También se añadirá el mismo botón en el header principal (visible siempre en desktop) para que se pueda volver a abrir aunque esté colapsado.
- Mismo comportamiento se replica en el layout super-admin (`super.tsx`).

## 2. Renombrar "Socios" → "Clientes" (solo etiqueta visible)

Se cambian únicamente los textos que ve el usuario. Rutas, tablas DB, hooks y nombres de archivos quedan igual.

Textos a actualizar:
- Item del menú lateral: "Socios" → "Clientes".
- Títulos de página y tabs del workspace: "Socios", "Nuevo socio", "Editar socio · …", "¿Eliminar socio …?" → versión con "cliente".
- Placeholders y mensajes vacíos: "Buscar por nombre, n° socio, …" → "Buscar por nombre, n° cliente, …"; "Sin socios cargados." → "Sin clientes cargados."; columna "N° socio" → "N° cliente".
- Vistas relacionadas (`socio-new-view`, `suministro-new-view` cuando referencian al titular) y selectores que digan "Socio" → "Cliente".
- Textos del módulo en `module-registry.ts` (`title: "Socios"` → `"Clientes"`).

## 3. Renombrar "Suministros" → "Servicios" (solo etiqueta visible)

Mismo criterio: solo textos.

- Menú lateral: "Suministros" → "Servicios".
- Títulos y tabs: "Suministros", "Nuevo suministro", "Medidores · …" se ajustan a "Servicios" / "Nuevo servicio".
- Placeholders y vacíos: "Buscar por n° suministro o tarifa…" → "Buscar por n° servicio o tarifa…"; "Sin suministros." → "Sin servicios."; columna y mensajes equivalentes.
- `module-registry.ts`: `title: "Suministros"` → `"Servicios"`.
- En `admin.facturacion.tsx` / vistas de factura, donde se diga "suministro" como rótulo visible al usuario, pasar a "servicio".

## Lo que NO se cambia

- URLs (`/admin/socios`, `/admin/suministros`) — los enlaces existentes siguen funcionando.
- Nombres de archivos (`admin.socios.tsx`, `admin.suministros.tsx`, `socio-new-view.tsx`, etc.).
- Tablas y columnas de la base de datos (`members`, `supplies`, `member_number`, `supply_number`).
- Hooks y funciones (`useMembers`, `useSupplies`, `padron.functions.ts`).
- Páginas públicas de marketing (`/funcionalidades`, `/casos`, `/contacto`, `/`) — usan "socios/suministros" como vocabulario sectorial del producto y conviene revisarlas en una pasada aparte si lo querés también.

## Archivos a editar

- `src/components/layouts/admin-portal-layout.tsx` — sidebar colapsable + renombrar items.
- `src/routes/_authenticated/super.tsx` — sidebar colapsable (super-admin).
- `src/components/workspace/module-registry.ts` — títulos visibles de los módulos.
- `src/routes/_authenticated/admin.socios.tsx` — textos visibles.
- `src/routes/_authenticated/admin.suministros.tsx` — textos visibles.
- `src/components/workspace/views/socio-new-view.tsx` — título/labels.
- `src/components/workspace/views/suministro-new-view.tsx` — título/labels.
- `src/components/workspace/views/suministro-meters-view.tsx` — título/labels.
- `src/routes/_authenticated/admin.facturacion.tsx` y vistas de factura — solo donde aparezcan "socio"/"suministro" como texto visible.

## Pregunta

¿Querés que también renombre estos términos en las páginas públicas de marketing (home, funcionalidades, casos, contacto), o las dejamos como están? Avisame y arranco con la implementación.
