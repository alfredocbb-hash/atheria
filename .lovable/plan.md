
# Actualización del PDF de propuesta COOPECUR

## Cambios solicitados

1. **Página de cierre / contacto**
   - Reemplazar el bloque actual "Equipo de implementación · contacto@atheria.app · +54 9 11 0000-0000" por:
     - **CEO / Contacto comercial:** Mauro Russomando — +54 11 4027 1640
     - **Equipo de desarrollo:**
       - Alfredo Bernard — Desarrollo y testing
       - Carlos Miers — Ingeniería
   - Mantener el logo COOPECUR y el título "Modernicemos juntos COOPECUR".
   - **Eliminar** la línea "Próximo paso: agendar una demo de 45 minutos".
   - Dejar `atheria.lovable.app` como referencia del sistema (sin email genérico ni teléfono placeholder).

2. **Capturas del sistema (regenerar)**
   - Iniciar sesión en la preview con `alfredocbb@gmail.com / Visa4517`.
   - Recapturar las páginas del PDF que muestran módulos, asegurando que en cada captura se vea:
     - El **menú lateral del backoffice** desplegado con el módulo activo resaltado.
     - El header con el usuario logueado.
   - Módulos a recapturar (uno por página, igual al PDF actual):
     - Dashboard / menú principal (`/admin`)
     - Socios / Padrón (`/admin/socios`)
     - Suministros y Medidores (`/admin/suministros`)
     - Tarifas (`/admin/tarifas`)
     - Lecturas (vista dentro del workspace)
     - Facturación (`/admin/facturacion`)
     - Reclamos (`/admin/reclamos`)
     - Facturación / Mercado Pago (`/admin/facturacion-suscripcion`)
   - **Portal del cliente / autogestión** (`/cliente`): capturar el panel del socio mostrando las opciones de autogestión (mis datos, mis facturas, solicitud de orden de servicio). Si el usuario logueado es admin, iniciar sesión adicionalmente con un usuario cliente de prueba; si no existe, usar la vista de admin "actuando como cliente" o documentar el módulo desde el menú del portal cliente con el admin.

3. **Regenerar el PDF**
   - Reutilizar el script `reportlab` previo (`/tmp/build_coopecur_deck.py`), ajustando:
     - Slide de capturas: nuevas imágenes desde `/tmp/coopecur-shots-v2/`.
     - Slide de cierre: bloque de contacto nuevo, sin "Próximo paso".
   - Mantener portada, paleta (verde/amarillo/navy) y logo COOPECUR.
   - Salida: `/mnt/documents/coopecur-propuesta-v2.pdf`.
   - QA: convertir a imágenes con `pdftoppm` y revisar cada página antes de entregar.

## Entrega

- `<presentation-artifact path="coopecur-propuesta-v2.pdf" mime_type="application/pdf">`.
- Resumen breve con los cambios aplicados.

## Notas

- No se modifica código de la app; solo se regenera el artefacto PDF.
- Si alguna ruta no carga con el usuario provisto (p. ej. portal cliente), se documenta y se reemplaza por la captura más cercana disponible, avisando en el resumen final.
