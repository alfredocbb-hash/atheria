# Billing — Activación de Mercado Pago

La estructura de pagos ya está cableada. Para activar el cobro real:

1. **Crear app en Mercado Pago**
   - Ir a https://www.mercadopago.com.ar/developers → Tus aplicaciones → Crear.
   - Copiar el `Access Token` (producción o test).

2. **Configurar el webhook**
   - En la app, sección **Webhooks**, agregar la URL:
     `https://project--2e8291ac-8eb9-40aa-a41d-2e8f5909cf5c.lovable.app/api/public/billing-webhook/mercadopago`
   - Eventos a suscribir: `subscription_preapproval`, `payment`.
   - Copiar la **clave secreta** del webhook.

3. **Cargar secrets en Lovable Cloud**
   - `MP_ACCESS_TOKEN` = access token de paso 1.
   - `MP_WEBHOOK_SECRET` = clave secreta de paso 2.

4. **Definir los planes**
   - Desde el panel super_admin (próxima fase) o vía SQL, editar `public.plans`
     y completar `price_cents`, `features`, y opcionalmente
     `mp_preapproval_plan_id` si querés usar un Pre-approval Plan creado
     manualmente en MP.
   - Marcar `is_active = true` cuando estén listos.

5. **Listo.** El botón "Suscribirme" de `/admin/facturacion-suscripcion`
   redirige al checkout MP, y los cambios de estado de la suscripción
   llegan por el webhook.

## Agregar otro proveedor más adelante

- Crear `src/lib/billing/<proveedor>.ts` que implemente la interface
  `BillingProvider` de `provider.ts`.
- Registrarlo en `index.ts` (`getProviderById` y `getBillingProvider`).
- Setear `tenants.billing_provider` al id correspondiente.
- El webhook público funciona automáticamente vía `/api/public/billing-webhook/<proveedor>`.