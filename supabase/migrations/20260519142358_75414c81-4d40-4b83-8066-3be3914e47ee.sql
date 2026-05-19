
-- tenant_settings
CREATE TABLE public.tenant_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- Parámetros del sistema
  billing_day smallint CHECK (billing_day BETWEEN 1 AND 31),
  first_due_day smallint CHECK (first_due_day BETWEEN 1 AND 31),
  second_due_day smallint CHECK (second_due_day BETWEEN 1 AND 31),
  interest_rate_after_first numeric(6,4) DEFAULT 0 CHECK (interest_rate_after_first >= 0),
  interest_rate_after_second numeric(6,4) DEFAULT 0 CHECK (interest_rate_after_second >= 0),
  cesp_code text,
  -- Datos de la empresa
  legal_name text,
  cuit text,
  trade_name text,
  legal_address text,
  fiscal_address text,
  email text,
  phone_main text,
  phone_mobile text,
  whatsapp text,
  website text,
  email_services text,
  email_inquiries text,
  email_collections text,
  iibb text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_settings select"
ON public.tenant_settings FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR public.is_tenant_member(tenant_id, NULL)
);

CREATE POLICY "tenant_settings insert"
ON public.tenant_settings FOR INSERT TO authenticated
WITH CHECK (
  public.is_super_admin()
  OR public.is_tenant_member(tenant_id, 'admin')
);

CREATE POLICY "tenant_settings update"
ON public.tenant_settings FOR UPDATE TO authenticated
USING (
  public.is_super_admin()
  OR public.is_tenant_member(tenant_id, 'admin')
)
WITH CHECK (
  public.is_super_admin()
  OR public.is_tenant_member(tenant_id, 'admin')
);

CREATE TRIGGER tenant_settings_touch
BEFORE UPDATE ON public.tenant_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed inicial: una fila por cada tenant existente
INSERT INTO public.tenant_settings (tenant_id)
SELECT id FROM public.tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- app_settings (singleton)
CREATE TABLE public.app_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_name text DEFAULT 'Lovable Cooperativas',
  support_email text,
  support_phone text,
  support_whatsapp text,
  default_billing_day smallint CHECK (default_billing_day BETWEEN 1 AND 31),
  default_first_due_day smallint CHECK (default_first_due_day BETWEEN 1 AND 31),
  default_second_due_day smallint CHECK (default_second_due_day BETWEEN 1 AND 31),
  default_interest_after_first numeric(6,4) DEFAULT 0 CHECK (default_interest_after_first >= 0),
  default_interest_after_second numeric(6,4) DEFAULT 0 CHECK (default_interest_after_second >= 0),
  terms_url text,
  privacy_url text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings select all"
ON public.app_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "app_settings super manage"
ON public.app_settings FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE TRIGGER app_settings_touch
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
