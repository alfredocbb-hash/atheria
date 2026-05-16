-- Enums
CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE public.service_type AS ENUM ('water', 'gas', 'electricity');
CREATE TYPE public.supply_status AS ENUM ('active', 'suspended', 'inactive', 'pending');
CREATE TYPE public.meter_status AS ENUM ('active', 'removed', 'faulty');

-- Members (socios)
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  document_id TEXT,
  email TEXT,
  phone TEXT,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.member_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_members_user_id ON public.members(user_id);
CREATE INDEX idx_members_document ON public.members(document_id);

-- Supply addresses
CREATE TABLE public.supply_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  street TEXT NOT NULL,
  street_number TEXT,
  floor TEXT,
  apartment TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supplies (suministros)
CREATE TABLE public.supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_number TEXT NOT NULL UNIQUE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
  address_id UUID NOT NULL REFERENCES public.supply_addresses(id) ON DELETE RESTRICT,
  service_type public.service_type NOT NULL,
  status public.supply_status NOT NULL DEFAULT 'pending',
  tariff_category TEXT,
  activated_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_supplies_member ON public.supplies(member_id);
CREATE INDEX idx_supplies_address ON public.supplies(address_id);
CREATE INDEX idx_supplies_service_type ON public.supplies(service_type);
CREATE INDEX idx_supplies_status ON public.supplies(status);

-- Meters
CREATE TABLE public.meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  installed_at DATE,
  status public.meter_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (supply_id, serial_number)
);
CREATE INDEX idx_meters_supply ON public.meters(supply_id);

-- Triggers updated_at
CREATE TRIGGER trg_members_updated BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_addresses_updated BEFORE UPDATE ON public.supply_addresses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_supplies_updated BEFORE UPDATE ON public.supplies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_meters_updated BEFORE UPDATE ON public.meters
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;

-- RLS members
CREATE POLICY "Staff full access on members" ON public.members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Clients view own member" ON public.members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- RLS supplies
CREATE POLICY "Staff full access on supplies" ON public.supplies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Clients view own supplies" ON public.supplies
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.members m WHERE m.id = supplies.member_id AND m.user_id = auth.uid()));

-- RLS addresses (viewable when linked to a visible supply)
CREATE POLICY "Staff full access on addresses" ON public.supply_addresses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Clients view addresses of own supplies" ON public.supply_addresses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.supplies s
    JOIN public.members m ON m.id = s.member_id
    WHERE s.address_id = supply_addresses.id AND m.user_id = auth.uid()
  ));

-- RLS meters
CREATE POLICY "Staff full access on meters" ON public.meters
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Clients view meters of own supplies" ON public.meters
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.supplies s
    JOIN public.members m ON m.id = s.member_id
    WHERE s.id = meters.supply_id AND m.user_id = auth.uid()
  ));