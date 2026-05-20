## Plan

### 1. Detener el bucle de actualización/login
- Ajustar el `ErrorComponent` global para que los errores de chunks viejos no queden atrapados mostrando “Actualizando la aplicación…” indefinidamente.
- Cambiar la recarga automática para que use una marca por versión/ruta con TTL corto, y si el chunk sigue fallando mostrar una acción segura en vez de recargar constantemente.
- Esto ataca el error real visto en consola: `error loading dynamically imported module .../_authenticated-*.js`, que aparece cuando el navegador conserva una versión anterior mientras la preview ya generó assets nuevos.

### 2. Hacer más estable la sesión al volver a la pestaña
- Revisar el `AuthGate` para evitar que eventos de auth secundarios o refetches globales borren queries/estado innecesariamente.
- Mantener la sesión como fuente de verdad y evitar navegación agresiva a `/login` mientras el estado de auth todavía está hidratándose.
- La meta es que volver a una pestaña del navegador no saque al usuario si la sesión sigue vigente.

### 3. Preservar borradores no guardados de pestañas internas
- Agregar una utilidad pequeña de persistencia de borradores por usuario + `tabId` usando almacenamiento del navegador.
- Aplicarla a los formularios operativos principales que hoy guardan datos solo en memoria:
  - Nuevo/editar cliente
  - Nuevo servicio
  - Nueva tarifa
  - Editar tarifa
  - Nueva lectura
  - Generar factura
  - Nueva/editar cuadrilla
- Al guardar correctamente o cancelar/cerrar la pestaña interna, limpiar el borrador correspondiente.
- Si el usuario se va a otra pestaña del navegador y vuelve, o si hay una recarga por actualización, el formulario se restaura.

### 4. Aviso antes de perder cambios
- Para formularios con cambios sin guardar, agregar protección con `beforeunload` para que el navegador advierta antes de cerrar/refrescar la pestaña.
- Esto no bloquea el guardado automático de borrador, pero evita pérdidas por cierres accidentales.

### 5. Verificación
- Revisar que la pantalla de login ya no quede cargando por recargas de versión.
- Confirmar que una ruta protegida no redirija prematuramente a `/login` mientras auth está cargando.
- Confirmar que un formulario parcial se restaura después de cambiar de pestaña/recargar.