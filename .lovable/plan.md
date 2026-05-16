# Espacio de Trabajo Multipestaña — Backoffice Admin

## Objetivo
Convertir el área de contenido del `AdminPortalLayout` en un workspace tipo navegador/ERP: cada vez que el usuario hace click en una opción del sidebar (o abre una entidad desde una tabla), se abre una **pestaña** persistente sobre el área principal. Cambiar de pestaña NO desmonta las otras: conservan scroll, filtros, formularios y datos cargados.

## Comportamiento esperado

- Barra de pestañas fija arriba del contenido, debajo del header.
- Click en sidebar → si la pestaña existe, la enfoca; si no, la crea y la enfoca.
- Cada pestaña muestra: ícono del módulo + título + botón "x" para cerrar (excepto Dashboard, fijo).
- Soporta múltiples pestañas del mismo módulo con contexto distinto (ej. "Socio #1234", "Socio #5678") — futuro, pero la API lo permite desde el día 1.
- Cambiar de pestaña actualiza la URL (`/admin/suministros`, `/admin/socios`, …) para mantener deep-linking y back/forward del browser.
- Cerrar la pestaña activa enfoca la anterior. Cerrar todas vuelve al Dashboard.
- Las pestañas y su orden persisten en `sessionStorage` por usuario, así un F5 no pierde el estado de navegación (los datos se vuelven a pedir vía React Query, pero los filtros/scroll se restauran).
- Atajos: `Ctrl/Cmd+W` cierra pestaña actual; `Ctrl/Cmd+Tab` cicla (opcional, fase 2).
- Menú contextual sobre la pestaña: Cerrar, Cerrar las demás, Cerrar todas a la derecha, Recargar.

## Alcance — solo Backoffice
Aplica únicamente a `/_authenticated/admin/*`. El `ClientPortalLayout` queda con navegación tradicional.

## Diseño técnico

### Estrategia de renderizado
TanStack Router por defecto **desmonta** el componente del `<Outlet />` al cambiar de ruta. Para preservar estado entre pestañas necesitamos mantener montados todos los módulos abiertos.

Enfoque elegido: **registry de módulos + render por overlay con visibilidad**, manejado por un `WorkspaceProvider`. El `<Outlet />` deja de usarse para los hijos de `admin`; en su lugar:

1. Las rutas hijas (`admin.suministros.tsx`, `admin.socios.tsx`, …) siguen existiendo (deep-linking, head/meta, loaders y guards), pero su `component` solo llama a `useOpenWorkspaceTab("suministros")` en un `useEffect` y devuelve `null`. La ruta actúa como "trigger" que abre la pestaña en el workspace.
2. El `AdminPortalLayout` renderiza el `<WorkspaceTabsBar />` + `<WorkspacePanels />`. `WorkspacePanels` recorre las pestañas abiertas y renderiza cada módulo dentro de un `<div hidden={tab.id !== activeId}>`. La pestaña activa se ve, las demás permanecen montadas pero ocultas (display:none) → se preserva scroll, estado local, formularios y caché de React Query.
3. Un `MODULE_REGISTRY` mapea `tabKey → { title, icon, Component, routeTo }`. Convertimos los componentes actuales de cada `admin.*.tsx` (`SuministrosPage`, `SociosPage`, etc.) en componentes exportados desde `src/components/workspace/modules/*` y los registramos.

### Sincronización con la URL
- Al activar una pestaña, `navigate({ to: tab.routeTo })` con `replace: true` para no inflar el history.
- Al montar la app en una URL profunda, el efecto de la ruta abre/enfoca la pestaña correspondiente.
- El registry sigue siendo la fuente de verdad del orden y conjunto abierto; la URL refleja solo la activa.

### Estructura de archivos nuevos
```text
src/
  components/workspace/
    workspace-context.tsx       # Provider + hooks (useWorkspace, useOpenTab)
    workspace-tabs-bar.tsx      # Barra superior con pestañas
    workspace-panels.tsx        # Render multiplexado de módulos
    module-registry.ts          # tabKey -> {title, icon, Component, routeTo}
    modules/
      dashboard-module.tsx      # Movido desde admin.index.tsx
      socios-module.tsx
      suministros-module.tsx
      facturacion-module.tsx
      reclamos-module.tsx
      usuarios-module.tsx
      auditoria-module.tsx
```

### Archivos modificados
- `src/components/layouts/admin-portal-layout.tsx`: envuelve hijos con `<WorkspaceProvider>`, reemplaza `{children}` por `<WorkspaceTabsBar /> + <WorkspacePanels />`. El sidebar sigue usando `<Link>` (no se cambia para preservar Ctrl-click → nueva pestaña del navegador y accesibilidad), pero también dispara el efecto de apertura vía la ruta.
- `src/routes/_authenticated/admin.tsx`: sin cambios (sigue siendo layout con `<Outlet />`, pero el Outlet ahora siempre devuelve `null` desde los hijos).
- `src/routes/_authenticated/admin.index.tsx` y cada `admin.<modulo>.tsx`: reducidos a un trigger:
  ```tsx
  function SuministrosRoute() {
    const open = useOpenWorkspaceTab();
    useEffect(() => { open("suministros"); }, [open]);
    return null;
  }
  ```
  El JSX real se mueve al módulo en `components/workspace/modules/`.

### Persistencia
`sessionStorage` con clave `workspace:admin:<userId>`, payload `{ tabs: string[], activeId: string }`. Restaurado en el provider al montar. No persistimos datos del módulo: React Query reconstruye desde caché o servidor.

### Detalles UI
- Barra: `h-9`, fondo `bg-card`, borde inferior, scroll horizontal cuando hay overflow.
- Pestaña: padding `px-3`, gap con ícono, estado activo con `bg-background` + borde inferior color `primary`; inactiva `text-muted-foreground hover:bg-muted`.
- Botón cerrar: `X` aparece en hover o si la pestaña está activa.
- Dashboard tiene un ícono "pin" en lugar de cerrar.

## Entregable de esta fase
Implementación completa del workspace para los 7 módulos existentes del admin. No incluye:
- Apertura de pestañas con contexto (ej. "Socio #1234") — se deja la API lista pero sin UI de invocación.
- Drag-and-drop para reordenar pestañas.
- Atajos de teclado más allá de cerrar (`Ctrl+W`).

## Riesgos / consideraciones
- Mantener N módulos montados aumenta el uso de memoria. Mitigación: el registry permite marcar módulos como "unload on close" (default true), y se puede agregar un límite de N pestañas abiertas (sugerido: 10) con confirmación.
- Los `useEffect` de los módulos siguen corriendo aunque estén ocultos (timers, subscripciones realtime). Esto es **intencional** para que las notificaciones se actualicen en background. Documentado en el código del provider.
- Los formularios en módulos ocultos no pierden datos, pero al cerrar la pestaña sí. Fase 2 podría agregar warning "tenés cambios sin guardar".
