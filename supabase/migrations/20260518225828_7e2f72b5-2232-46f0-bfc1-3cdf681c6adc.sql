-- Contact requests from public marketing site
CREATE TABLE public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'marketing-site',
  handled_by UUID,
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contact requests super manage"
  ON public.contact_requests
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE INDEX contact_requests_created_idx ON public.contact_requests (created_at DESC);

-- Notify super admins on new lead
CREATE OR REPLACE FUNCTION public.contact_requests_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, title, body, link, metadata, tenant_id)
  SELECT sa.user_id,
         'lead',
         'Nuevo contacto: ' || NEW.organization,
         NEW.name || ' (' || NEW.email || ') dejó un mensaje desde el sitio.',
         '/super',
         jsonb_build_object('contact_request_id', NEW.id),
         NULL
  FROM public.super_admins sa;
  RETURN NEW;
END;
$$;

CREATE TRIGGER contact_requests_notify_trg
AFTER INSERT ON public.contact_requests
FOR EACH ROW EXECUTE FUNCTION public.contact_requests_notify();

-- Allow notifications without tenant_id (super-admin alerts)
ALTER TABLE public.notifications ALTER COLUMN tenant_id DROP NOT NULL;