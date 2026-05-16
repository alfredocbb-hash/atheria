# Análisis del sistema legacy (Coopecur viejo)

Objetivo: entender las tablas compartidas y mapearlas al modelo del nuevo sistema, sin migrar todavía. Esto deja documentado el plan para cuando ejecutemos la migración real.

## Tablas recibidas

| Archivo | Filas | Rol en el sistema viejo |
|---|---|---|
| `titulares_coopecur.csv` | 1.716 | Persona titular del servicio (datos personales) |
| `entidades_coopecur.csv` | 1.715 | Unidad de facturación / suministro físico (domicilio + condición fiscal) |
| `orden_trabajo.csv` | 2 (muestra) | Órdenes de trabajo / reclamos asignados a cuadrilla |
| `novedades.csv` | 2 (muestra) | Anuncios o avisos para clientes |

Relación clave: `titulares.entidad_id` ↔ `entidades.entidad_id` (1:1 en estos datos: 1.716 titulares ↔ 1.715 entidades; hay 1 caso a revisar). `orden_trabajo.entidad_id` referencia a la entidad/suministro.

## Hallazgos de calidad de datos

- **Titulares**: 0 emails cargados, casi 0 teléfonos, 42 fechas de nacimiento. 1.581 documentos distintos sobre 1.716 → posibles duplicados de DNI. Todos `activo='S'`.
- **Entidades**: todas tienen domicilio (`entidad_domicilio`) y CP, 0 emails, 0 CBU, 1 solo `entidad_tipo`, todas activas. Hay flags útiles: `entidad_factura_digital`, `entidad_vivienda_desocupada`, `entidad_tarifa_social`, `entidad_bonificacion_*`.
- **Orden de trabajo**: estados observados `T` (terminado) y `R` (revisión/recibido?) — habrá que confirmar el catálogo completo. Campos: `actividad_id`, `orden_prioridad`, `orden_asignado` (string libre tipo "mauro"), `observaciones`.
- **Novedades**: texto suelto con fecha — es un "tablón de avisos", no existe en el nuevo sistema.

Catálogos referenciados pero no incluidos aún: `tipo_doc_id`, `localidad_id`, `cat_iva_id`, `pais_id`, `crs_id`, `lista_prec_id`, `condicion_id`, `parametro_id`, `actividad_id`. Necesarios para resolver claves foráneas.

## Mapeo legacy → modelo nuevo

| Legacy | Nuevo (tabla) | Notas |
|---|---|---|
| `titulares` | `members` | `titular_apellido + titular_nombre → full_name`, `titular_num_doc → document_id`, `titular_telefono/celular → phone`, `titular_socio → member_number` (si es único; sino generar). `user_id` queda NULL hasta que se invite al titular. |
| `entidades` | `supplies` + `supply_addresses` | Domicilio se parsea a `street/street_number/city/postal_code`. `entidad_factura_digital`, `tarifa_social`, `bonificacion_*` → campos nuevos a agregar en `supplies`. `cat_iva_id` → enum/tabla de condición IVA (nueva). |
| `entidad_id` (FK) | `supplies.member_id` | Vía join titulares↔entidades. |
| `orden_trabajo` | `claims` + `work_orders` | `orden_referencia → claim_number`, `orden_prioridad → priority`, `orden_estado → status` (mapear T/R/…), `orden_asignado` → resolver a `crews.name` o crear cuadrilla genérica, `actividad_id → category` (requiere catálogo). |
| `novedades` | **nueva tabla `announcements`** | No existe módulo equivalente; queda como mejora futura. |

## Cambios de esquema que necesitará el nuevo sistema

1. **`supplies`**: agregar `legacy_entidad_id` (int, único, indexado) para idempotencia; `is_factura_digital` (bool), `is_tarifa_social` (bool), `is_vivienda_desocupada` (bool), `discount_kind` + `discount_amount`.
2. **`members`**: agregar `legacy_titular_id` (int, único), `legacy_socio_number` (int), `birth_date` (date), `sex` (text), opcional `tax_condition` (enum).
3. **`supply_addresses`**: agregar `manzana`, `lote`, `casa`, `monoblock` (textos cortos) para conservar nomenclatura barrial.
4. **`claims`**: agregar `legacy_orden_id`, `legacy_actividad_id`, `assignee_text` (texto libre del viejo "asignado") cuando no se pueda resolver a una cuadrilla.
5. **`announcements`** (nueva): `id`, `body`, `published_at`, `is_active`, visible en portal del cliente.
6. **Catálogos**: tablas chicas o enums para `localidades`, `tipo_documento`, `cat_iva`, `actividad` (categoría de reclamo). Para empezar alcanza con campos texto + mapeo posterior.

## Plan de migración (cuando se ejecute, no ahora)

1. Pedir al usuario los catálogos faltantes (localidades, tipo_doc, cat_iva, actividades, estados de OT) y el dump completo de `orden_trabajo` + tablas de facturas/lecturas/pagos/medidores si existen.
2. Aplicar migración con los campos `legacy_*` y nuevas columnas de flags.
3. Cargar staging con `duckdb` o `psql COPY` a tablas `_staging_*`.
4. Insertar en orden: `members` → `supply_addresses` → `supplies` → (catálogos resueltos) → `claims`/`work_orders` → `announcements`.
5. Validación post-migración: conteos por tabla, duplicados de documento, suministros huérfanos, reclamos sin entidad.
6. Reporte de discrepancias para que el usuario decida correcciones manuales.

## Lo que NO se hace en esta ronda

- No se modifica el esquema todavía.
- No se cargan datos en producción.
- No se borra ni renombra nada existente.

El entregable de esta ronda es este documento de análisis + mapeo. Si lo aprobás, el próximo paso es pedirte los catálogos faltantes y armar la migración real con columnas `legacy_*`.
