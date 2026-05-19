
-- 1. Catálogo de módulos
CREATE TABLE public.app_modules (
  key text PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('tenant','super','client')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_modules read" ON public.app_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_modules super manage" ON public.app_modules FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE TRIGGER touch_app_modules BEFORE UPDATE ON public.app_modules FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Permisos globales (defaults)
CREATE TABLE public.module_role_permissions (
  module_key text NOT NULL REFERENCES public.app_modules(key) ON DELETE CASCADE,
  role_scope text NOT NULL CHECK (role_scope IN ('app_role','tenant_role')),
  role text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  PRIMARY KEY (module_key, role_scope, role)
);
ALTER TABLE public.module_role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mrp read" ON public.module_role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "mrp super manage" ON public.module_role_permissions FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- 3. Overrides por tenant
CREATE TABLE public.tenant_module_role_permissions (
  tenant_id uuid NOT NULL,
  module_key text NOT NULL REFERENCES public.app_modules(key) ON DELETE CASCADE,
  role_scope text NOT NULL CHECK (role_scope IN ('app_role','tenant_role')),
  role text NOT NULL,
  enabled boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  PRIMARY KEY (tenant_id, module_key, role_scope, role)
);
ALTER TABLE public.tenant_module_role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tmrp read" ON public.tenant_module_role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "tmrp super manage" ON public.tenant_module_role_permissions FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- 4. Helper
CREATE OR REPLACE FUNCTION public.can_access_module(_user uuid, _tenant uuid, _module text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_enabled boolean;
  v_role record;
BEGIN
  IF public.is_super_admin() THEN RETURN true; END IF;

  -- App roles (globales)
  FOR v_role IN SELECT role::text AS r FROM public.user_roles WHERE user_id = _user LOOP
    IF _tenant IS NOT NULL THEN
      SELECT enabled INTO v_enabled FROM public.tenant_module_role_permissions
       WHERE tenant_id = _tenant AND module_key = _module AND role_scope = 'app_role' AND role = v_role.r;
      IF v_enabled IS TRUE THEN RETURN true; END IF;
    END IF;
    SELECT enabled INTO v_enabled FROM public.module_role_permissions
     WHERE module_key = _module AND role_scope = 'app_role' AND role = v_role.r;
    IF v_enabled IS TRUE THEN RETURN true; END IF;
  END LOOP;

  -- Tenant roles
  IF _tenant IS NOT NULL THEN
    FOR v_role IN SELECT role::text AS r FROM public.tenant_members WHERE user_id = _user AND tenant_id = _tenant LOOP
      SELECT enabled INTO v_enabled FROM public.tenant_module_role_permissions
       WHERE tenant_id = _tenant AND module_key = _module AND role_scope = 'tenant_role' AND role = v_role.r;
      IF v_enabled IS TRUE THEN RETURN true; END IF;
      SELECT enabled INTO v_enabled FROM public.module_role_permissions
       WHERE module_key = _module AND role_scope = 'tenant_role' AND role = v_role.r;
      IF v_enabled IS TRUE THEN RETURN true; END IF;
    END LOOP;
  END IF;

  RETURN false;
END;
$$;

-- 5. Seed catálogo
INSERT INTO public.app_modules (key, title, category, sort_order) VALUES
  ('dashboard','Dashboard','tenant',10),
  ('usuarios','Usuarios y Roles','tenant',20),
  ('socios','Clientes','tenant',30),
  ('suministros','Servicios','tenant',40),
  ('facturacion','Facturación','tenant',50),
  ('tarifas','Tarifas','tenant',60),
  ('reclamos','Reclamos','tenant',70),
  ('auditoria','Auditoría','tenant',80),
  ('configuracion','Configuración','tenant',90),
  ('super_dashboard','Panel super admin','super',10),
  ('super_tenants','Cooperativas','super',20),
  ('super_planes','Planes','super',30),
  ('super_eventos','Eventos de suscripción','super',40),
  ('super_health','Salud de la plataforma','super',50),
  ('super_configuracion','Configuración global','super',60),
  ('super_usuarios','Usuarios y permisos','super',5),
  ('cliente_portal','Portal del cliente','client',10);

-- 6. Seed defaults (admin global = todo del tenant + super_usuarios negado por default)
INSERT INTO public.module_role_permissions (module_key, role_scope, role, enabled)
SELECT m.key, 'app_role', r, true
FROM public.app_modules m
CROSS JOIN (VALUES ('admin'),('operator')) AS roles(r)
WHERE m.category = 'tenant';

INSERT INTO public.module_role_permissions (module_key, role_scope, role, enabled)
SELECT m.key, 'app_role', 'client', false FROM public.app_modules m WHERE m.category = 'tenant';

INSERT INTO public.module_role_permissions (module_key, role_scope, role, enabled)
VALUES ('cliente_portal','app_role','client',true);

-- Tenant roles defaults
INSERT INTO public.module_role_permissions (module_key, role_scope, role, enabled)
SELECT m.key, 'tenant_role', 'admin', true FROM public.app_modules m WHERE m.category = 'tenant';

INSERT INTO public.module_role_permissions (module_key, role_scope, role, enabled)
SELECT m.key, 'tenant_role', 'operador',
  CASE WHEN m.key IN ('usuarios','auditoria','configuracion') THEN false ELSE true END
FROM public.app_modules m WHERE m.category = 'tenant';

INSERT INTO public.module_role_permissions (module_key, role_scope, role, enabled)
SELECT m.key, 'tenant_role', 'user', false FROM public.app_modules m WHERE m.category = 'tenant';

INSERT INTO public.module_role_permissions (module_key, role_scope, role, enabled)
VALUES ('cliente_portal','tenant_role','user',true);
