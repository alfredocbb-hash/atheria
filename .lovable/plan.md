## Cambio de UX en "Generar factura"

Hoy el formulario muestra un único combo "Suministro" que mezcla nº de suministro + socio + servicio. Vamos a separarlo en dos pasos: **primero socio, después servicio**.

### Comportamiento nuevo
1. Combo **Socio** (buscable, lista alfabética: `nº socio — nombre`).
2. Al elegir socio, aparece combo **Servicio / Suministro** filtrado solo a los suministros de ese socio (`servicio — nº suministro — categoría`).
3. Si el socio tiene un único suministro, se autoselecciona.
4. Si el socio no tiene suministros activos, se muestra un aviso ("Este socio no tiene suministros cargados") y el botón "Generar" queda deshabilitado.
5. El resto del formulario (período, vencimiento, impuesto, notas) y la lógica de tarifa/lectura/cálculo **no cambian**.

### Alcance técnico (solo frontend)
- `src/components/workspace/views/factura-new-view.tsx`: reemplazar el combo único por dos `Select` (socio → suministro). Agrupar `supplies` por `member_id` en memoria a partir de `useSuppliesLite()` (ya devuelve `member.full_name` y `member_number`). No se toca el backend ni `generateInvoice` porque sigue recibiendo `supply_id`.
- Si el hook actual no trae `member_number`/`member_id`, ampliar el `select` en `listSuppliesLite` dentro de `src/lib/billing.functions.ts` para incluirlos (cambio mínimo, sin tocar la lógica de facturación).

### Fuera de alcance
- No se modifica la generación de factura, ni triggers, ni RLS, ni el modelo de datos.
- No se agrega creación de suministros desde esta pantalla (si el socio no tiene servicios, el alta sigue siendo desde el ABM de suministros).
