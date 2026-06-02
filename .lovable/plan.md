
# Presentación comercial COOPECUR (PDF)

Objetivo: armar un PDF descargable para presentar el sistema a COOPECUR (cooperativa de agua y cloacas de Berazategui), con el logo provisto, capturas reales de cada módulo del sistema y un relato comercial orientado a CRS, VD e Instituciones + Mercado Pago + autogestión del socio.

No se modifica código de la app. Solo se genera un artefacto PDF en `/mnt/documents/`.

## 1. Material de marca

- Subir el logo `IMG-20260602-WA0007.jpg` como asset COOPECUR y usarlo en portada, cabecera y contraportada.
- Paleta inspirada en el logo + referencia ESSAPP Ranelagh (verde institucional, amarillo acento, gris/negro tipográfico). Fondo blanco para legibilidad del PDF.
- Tipografía: Helvetica/DejaVu (segura para reportlab).

## 2. Estructura del PDF (≈ 16 páginas)

1. **Portada** — Logo COOPECUR, título "Sistema integral de gestión de agua y cloacas", subtítulo "Propuesta para COOPECUR – Berazategui", fecha.
2. **Quiénes somos / contexto** — Breve párrafo sobre la cooperativa (referencia pública del modelo Ranelagh) y la oportunidad de digitalizar la gestión.
3. **Resumen ejecutivo** — Qué resuelve el sistema en 4 bullets: padrón, facturación, cobros MP, autogestión del socio.
4. **Categorías de clientes** — Diagrama simple con CRS (por habitaciones), VD (viviendas desocupadas) e Instituciones (escuelas, salitas), explicando cómo el sistema parametriza cada tipo en tarifas y facturación.
5. **Arquitectura del ecosistema** — Diagrama: Web corporativa ↔ Portal socio ↔ Backoffice admin ↔ Mercado Pago ↔ Base de datos. Texto corto.
6. **Capturas — Menú principal del backoffice** (sidebar admin completo).
7. **Capturas — Módulo Socios / Padrón** (listado + alta).
8. **Capturas — Módulo Suministros y Medidores** (listado + medidores por suministro).
9. **Capturas — Módulo Tarifas** (listado + edición, mostrando que el admin edita tarifas; alineado con el ajuste reciente del botón "Editar").
10. **Capturas — Módulo Lecturas** (registro de lecturas).
11. **Capturas — Módulo Facturación** (generación de factura + detalle).
12. **Capturas — Módulo Reclamos y Cuadrillas** (listado + detalle de reclamo).
13. **Capturas — Portal del socio** (login, panel, mis facturas, solicitud de orden de servicio / autogestión de datos).
14. **Pagos con Mercado Pago + planes de pago** — captura de la pantalla de facturación-suscripción + texto explicando checkout MP, webhook y planes de pago a futuro.
15. **Roadmap y próximos pasos** — Fase 1 (puesta en marcha con datos de COOPECUR), Fase 2 (planes de pago avanzados, notificaciones), Fase 3 (app móvil del socio).
16. **Contacto / cierre** — Logo, datos de contacto, llamada a la acción.

Cada página de capturas: título de módulo, 1-2 imágenes recuadradas, bullet corto con beneficio para COOPECUR.

## 3. Captura de pantallas

Usar `browser--screenshot` recorriendo la preview autenticada como admin demo:

- `/admin` (dashboard + sidebar)
- `/admin/socios`, alta de socio
- `/admin/suministros`, vista de medidores
- `/admin/tarifas` (listado y panel de edición)
- panel de Lecturas dentro del workspace
- `/admin/facturacion` (listado + detalle)
- `/admin/reclamos` (listado + detalle)
- `/admin/facturacion-suscripcion` (Mercado Pago)
- `/cliente` portal del socio (login + mis facturas)
- `/` landing pública para mostrar la web corporativa

Si alguna ruta requiere login, autenticarse con la cuenta admin demo existente. Las capturas se guardan en `/tmp/coopecur-shots/` y se embeben en el PDF como base64.

## 4. Generación del PDF

- Script Python en `/tmp/build_coopecur_deck.py` usando **reportlab** (skill `pdf`).
- Tamaño A4 horizontal, márgenes 1.5cm, header con logo pequeño + footer con paginado.
- Salida: `/mnt/documents/coopecur-propuesta.pdf`.
- QA obligatorio: convertir con `pdftoppm` y revisar cada página (sin texto cortado, capturas legibles, logo nítido, contraste correcto). Iterar hasta quedar limpio.

## 5. Entrega

- Emitir `<presentation-artifact path="coopecur-propuesta.pdf" mime_type="application/pdf">` para que el usuario lo descargue.
- Resumen breve de lo entregado y de las capturas incluidas.

## Notas técnicas

- No se tocan tablas, RLS, ni código de la app.
- Si alguna captura no se puede obtener (ruta protegida sin sesión disponible), se reemplaza por un mock textual y se avisa en el resumen final, sin bloquear la entrega.
- El logo se sube vía `lovable-assets` solo si se quiere reutilizar en la web; para el PDF alcanza con leerlo desde `/mnt/user-uploads/`.
