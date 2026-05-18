
-- ============================================================
-- MULTITENANT + SUSCRIPCIONES (reset + estructura completa)
-- ============================================================

-- 1) NUEVAS TABLAS BASE

CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ARS',
  stripe_price_id text,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE public.tenant_status AS ENUM ('trial','active','past_due','suspended','cancelled');

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  status public.tenant_status NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE public.tenant_role AS ENUM ('admin','operador','user');

CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.tenant_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
CREATE INDEX idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant ON public.tenant_members(tenant_id);

CREATE TABLE public.super_admins (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  stripe_event_id text UNIQUE NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_tenants_touch BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_plans_touch BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) FUNCIONES HELPER

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.tenant_members
  WHERE user_id = auth.uid()
  ORDER BY created_at ASC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant uuid, _role text DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = _tenant
      AND user_id = auth.uid()
      AND (
        _role IS NULL
        OR (_role = 'staff' AND role IN ('admin','operador'))
        OR role::text = _role
      )
  )
$$;

-- 3) RESET DATOS DE DOMINIO

TRUNCATE TABLE
  public.payments,
  public.invoice_items,
  public.invoices,
  public.meter_readings,
  public.meters,
  public.work_orders,
  public.claim_comments,
  public.claims,
  public.crews,
  public.supplies,
  public.supply_addresses,
  public.tariffs,
  public.members,
  public.notifications,
  public.audit_log
CASCADE;

-- 4) AGREGAR tenant_id A TABLAS DE DOMINIO

ALTER TABLE public.members          ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.supply_addresses  ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.supplies          ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.meters            ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.meter_readings    ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.tariffs           ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.invoices          ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.invoice_items     ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.payments          ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.crews             ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.claims            ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.claim_comments    ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.work_orders       ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.notifications     ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.audit_log         ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;

CREATE INDEX idx_members_tenant         ON public.members(tenant_id);
CREATE INDEX idx_supply_addresses_tenant ON public.supply_addresses(tenant_id);
CREATE INDEX idx_supplies_tenant        ON public.supplies(tenant_id);
CREATE INDEX idx_meters_tenant          ON public.meters(tenant_id);
CREATE INDEX idx_meter_readings_tenant  ON public.meter_readings(tenant_id);
CREATE INDEX idx_tariffs_tenant         ON public.tariffs(tenant_id);
CREATE INDEX idx_invoices_tenant        ON public.invoices(tenant_id);
CREATE INDEX idx_invoice_items_tenant   ON public.invoice_items(tenant_id);
CREATE INDEX idx_payments_tenant        ON public.payments(tenant_id);
CREATE INDEX idx_crews_tenant           ON public.crews(tenant_id);
CREATE INDEX idx_claims_tenant          ON public.claims(tenant_id);
CREATE INDEX idx_claim_comments_tenant  ON public.claim_comments(tenant_id);
CREATE INDEX idx_work_orders_tenant     ON public.work_orders(tenant_id);
CREATE INDEX idx_notifications_tenant   ON public.notifications(tenant_id);
CREATE INDEX idx_audit_log_tenant       ON public.audit_log(tenant_id);

-- 5) HABILITAR RLS EN TABLAS NUEVAS

ALTER TABLE public.tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- tenants
CREATE POLICY "Tenants self read" ON public.tenants FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = tenants.id AND tm.user_id = auth.uid()) OR public.is_super_admin());
CREATE POLICY "Tenants super manage" ON public.tenants FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Tenants admin update own" ON public.tenants FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenants.id, 'admin')) WITH CHECK (public.is_tenant_member(tenants.id, 'admin'));

-- plans
CREATE POLICY "Plans read all authenticated" ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Plans super manage" ON public.plans FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- tenant_members
CREATE POLICY "Members self read" ON public.tenant_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_tenant_member(tenant_id, 'admin') OR public.is_super_admin());
CREATE POLICY "Members admin manage" ON public.tenant_members FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id, 'admin') OR public.is_super_admin())
  WITH CHECK (public.is_tenant_member(tenant_id, 'admin') OR public.is_super_admin());

-- super_admins (solo super_admin)
CREATE POLICY "Super admins read" ON public.super_admins FOR SELECT TO authenticated
  USING (public.is_super_admin());
CREATE POLICY "Super admins manage" ON public.super_admins FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- subscription_events
CREATE POLICY "Sub events super read" ON public.subscription_events FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- 6) REEMPLAZAR POLICIES EN TABLAS DE DOMINIO (tenant-aware)

-- helper: dropea todas las policies actuales y crea las nuevas

-- members
DROP POLICY IF EXISTS "Clients view own member" ON public.members;
DROP POLICY IF EXISTS "Staff full access on members" ON public.members;
CREATE POLICY "members select" ON public.members FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.current_tenant_id() AND (public.is_tenant_member(tenant_id, 'staff') OR user_id = auth.uid()))
  );
CREATE POLICY "members write" ON public.members FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- supply_addresses
DROP POLICY IF EXISTS "Clients view addresses of own supplies" ON public.supply_addresses;
DROP POLICY IF EXISTS "Staff full access on addresses" ON public.supply_addresses;
CREATE POLICY "supply_addresses select" ON public.supply_addresses FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.current_tenant_id() AND (
      public.is_tenant_member(tenant_id, 'staff')
      OR EXISTS (SELECT 1 FROM public.supplies s JOIN public.members m ON m.id = s.member_id
                 WHERE s.address_id = supply_addresses.id AND m.user_id = auth.uid())
    ))
  );
CREATE POLICY "supply_addresses write" ON public.supply_addresses FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- supplies
DROP POLICY IF EXISTS "Clients view own supplies" ON public.supplies;
DROP POLICY IF EXISTS "Staff full access on supplies" ON public.supplies;
CREATE POLICY "supplies select" ON public.supplies FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.current_tenant_id() AND (
      public.is_tenant_member(tenant_id, 'staff')
      OR EXISTS (SELECT 1 FROM public.members m WHERE m.id = supplies.member_id AND m.user_id = auth.uid())
    ))
  );
CREATE POLICY "supplies write" ON public.supplies FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- meters
DROP POLICY IF EXISTS "Clients view meters of own supplies" ON public.meters;
DROP POLICY IF EXISTS "Staff full access on meters" ON public.meters;
CREATE POLICY "meters select" ON public.meters FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.current_tenant_id() AND (
      public.is_tenant_member(tenant_id, 'staff')
      OR EXISTS (SELECT 1 FROM public.supplies s JOIN public.members m ON m.id = s.member_id
                 WHERE s.id = meters.supply_id AND m.user_id = auth.uid())
    ))
  );
CREATE POLICY "meters write" ON public.meters FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- meter_readings
DROP POLICY IF EXISTS "Clients view own readings" ON public.meter_readings;
DROP POLICY IF EXISTS "Staff manage readings" ON public.meter_readings;
CREATE POLICY "meter_readings select" ON public.meter_readings FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.current_tenant_id() AND (
      public.is_tenant_member(tenant_id, 'staff')
      OR EXISTS (SELECT 1 FROM public.meters mt JOIN public.supplies s ON s.id = mt.supply_id
                 JOIN public.members m ON m.id = s.member_id
                 WHERE mt.id = meter_readings.meter_id AND m.user_id = auth.uid())
    ))
  );
CREATE POLICY "meter_readings write" ON public.meter_readings FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- tariffs
DROP POLICY IF EXISTS "Authenticated can read tariffs" ON public.tariffs;
DROP POLICY IF EXISTS "Staff manage tariffs" ON public.tariffs;
CREATE POLICY "tariffs select" ON public.tariffs FOR SELECT TO authenticated
  USING (public.is_super_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY "tariffs write" ON public.tariffs FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- invoices
DROP POLICY IF EXISTS "Clients view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Staff manage invoices" ON public.invoices;
CREATE POLICY "invoices select" ON public.invoices FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.current_tenant_id() AND (
      public.is_tenant_member(tenant_id, 'staff')
      OR EXISTS (SELECT 1 FROM public.members m WHERE m.id = invoices.member_id AND m.user_id = auth.uid())
    ))
  );
CREATE POLICY "invoices write" ON public.invoices FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- invoice_items
DROP POLICY IF EXISTS "Clients view own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Staff manage invoice items" ON public.invoice_items;
CREATE POLICY "invoice_items select" ON public.invoice_items FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.current_tenant_id() AND (
      public.is_tenant_member(tenant_id, 'staff')
      OR EXISTS (SELECT 1 FROM public.invoices i JOIN public.members m ON m.id = i.member_id
                 WHERE i.id = invoice_items.invoice_id AND m.user_id = auth.uid())
    ))
  );
CREATE POLICY "invoice_items write" ON public.invoice_items FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- payments
DROP POLICY IF EXISTS "Clients view own payments" ON public.payments;
DROP POLICY IF EXISTS "Staff manage payments" ON public.payments;
CREATE POLICY "payments select" ON public.payments FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.current_tenant_id() AND (
      public.is_tenant_member(tenant_id, 'staff')
      OR EXISTS (SELECT 1 FROM public.invoices i JOIN public.members m ON m.id = i.member_id
                 WHERE i.id = payments.invoice_id AND m.user_id = auth.uid())
    ))
  );
CREATE POLICY "payments write" ON public.payments FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- crews
DROP POLICY IF EXISTS "Staff manage crews" ON public.crews;
CREATE POLICY "crews select" ON public.crews FOR SELECT TO authenticated
  USING (public.is_super_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY "crews write" ON public.crews FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- claims
DROP POLICY IF EXISTS "Clients view own claims" ON public.claims;
DROP POLICY IF EXISTS "Clients create own claims" ON public.claims;
DROP POLICY IF EXISTS "Staff manage claims" ON public.claims;
CREATE POLICY "claims select" ON public.claims FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.current_tenant_id() AND (
      public.is_tenant_member(tenant_id, 'staff')
      OR EXISTS (SELECT 1 FROM public.members m WHERE m.id = claims.member_id AND m.user_id = auth.uid())
    ))
  );
CREATE POLICY "claims insert client" ON public.claims FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND EXISTS (SELECT 1 FROM public.members m WHERE m.id = claims.member_id AND m.user_id = auth.uid() AND m.tenant_id = claims.tenant_id)
  );
CREATE POLICY "claims write staff" ON public.claims FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- claim_comments
DROP POLICY IF EXISTS "Clients view own comments" ON public.claim_comments;
DROP POLICY IF EXISTS "Clients add comments to own claims" ON public.claim_comments;
DROP POLICY IF EXISTS "Staff manage comments" ON public.claim_comments;
CREATE POLICY "claim_comments select" ON public.claim_comments FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.current_tenant_id() AND (
      public.is_tenant_member(tenant_id, 'staff')
      OR (is_internal = false AND EXISTS (
        SELECT 1 FROM public.claims c JOIN public.members m ON m.id = c.member_id
        WHERE c.id = claim_comments.claim_id AND m.user_id = auth.uid()
      ))
    ))
  );
CREATE POLICY "claim_comments insert client" ON public.claim_comments FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND is_internal = false
    AND author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.claims c JOIN public.members m ON m.id = c.member_id
                WHERE c.id = claim_comments.claim_id AND m.user_id = auth.uid())
  );
CREATE POLICY "claim_comments write staff" ON public.claim_comments FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- work_orders
DROP POLICY IF EXISTS "Clients view own work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Staff manage work orders" ON public.work_orders;
CREATE POLICY "work_orders select" ON public.work_orders FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (tenant_id = public.current_tenant_id() AND (
      public.is_tenant_member(tenant_id, 'staff')
      OR EXISTS (SELECT 1 FROM public.claims c JOIN public.members m ON m.id = c.member_id
                 WHERE c.id = work_orders.claim_id AND m.user_id = auth.uid())
    ))
  );
CREATE POLICY "work_orders write" ON public.work_orders FOR ALL TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')))
  WITH CHECK (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'staff')));

-- notifications
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "notifications select" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'admin')));
CREATE POLICY "notifications update own" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- audit_log
DROP POLICY IF EXISTS "Admins view audit" ON public.audit_log;
CREATE POLICY "audit_log select" ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_super_admin() OR (tenant_id = public.current_tenant_id() AND public.is_tenant_member(tenant_id, 'admin')));

-- 7) SEED: Coopecur Connect + super_admin

INSERT INTO public.tenants (name, slug, status)
VALUES ('Coopecur Connect', 'coopecur', 'active');

-- Asignar super_admin y membresía admin a alfredocbb@gmail.com si existe
DO $$
DECLARE
  v_uid uuid;
  v_tenant uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'alfredocbb@gmail.com' LIMIT 1;
  SELECT id INTO v_tenant FROM public.tenants WHERE slug = 'coopecur' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.super_admins(user_id) VALUES (v_uid) ON CONFLICT DO NOTHING;
    INSERT INTO public.tenant_members(tenant_id, user_id, role)
    VALUES (v_tenant, v_uid, 'admin') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 8) ACTUALIZAR handle_new_user para NO asignar admin global
-- (los roles globales ahora son solo super_admin; el resto es por tenant_members)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;
