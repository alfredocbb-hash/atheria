
-- 1. Unique index on tenants.slug (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_unique ON public.tenants (slug);

-- 2. Tenant billing credentials (write-only from super admin)
CREATE TABLE IF NOT EXISTS public.tenant_billing_credentials (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'mercadopago',
  access_token text,
  webhook_secret text,
  preapproval_plan_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.tenant_billing_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Billing creds super only"
  ON public.tenant_billing_credentials
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE TRIGGER tenant_billing_credentials_touch
  BEFORE UPDATE ON public.tenant_billing_credentials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. notify_tenant_admins helper
CREATE OR REPLACE FUNCTION public.notify_tenant_admins(
  _tenant uuid, _kind text, _title text, _body text, _link text, _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, title, body, link, metadata, tenant_id)
  SELECT tm.user_id, _kind, _title, _body, _link, COALESCE(_metadata,'{}'::jsonb), _tenant
  FROM public.tenant_members tm
  WHERE tm.tenant_id = _tenant AND tm.role = 'admin';
END;
$$;

-- 4. Trigger on tenants status change
CREATE OR REPLACE FUNCTION public.tenants_status_notify()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_title text; v_body text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status::text
      WHEN 'active'    THEN v_title := 'Suscripción activa';           v_body := 'Tu cooperativa ' || NEW.name || ' está activa.';
      WHEN 'past_due'  THEN v_title := 'Pago pendiente';               v_body := 'Hay un pago pendiente en tu suscripción.';
      WHEN 'suspended' THEN v_title := 'Acceso suspendido';            v_body := 'Tu acceso fue suspendido por falta de pago.';
      WHEN 'cancelled' THEN v_title := 'Suscripción cancelada';        v_body := 'Tu suscripción fue cancelada.';
      WHEN 'trial'     THEN v_title := 'Período de prueba';            v_body := 'Tu cooperativa está en período de prueba.';
      ELSE v_title := 'Estado actualizado'; v_body := 'Estado: ' || NEW.status::text;
    END CASE;
    PERFORM public.notify_tenant_admins(NEW.id, 'billing', v_title, v_body, '/admin/facturacion-suscripcion',
      jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_status_notify_trg ON public.tenants;
CREATE TRIGGER tenants_status_notify_trg
  AFTER UPDATE OF status ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.tenants_status_notify();
