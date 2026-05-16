-- Enums
CREATE TYPE public.claim_category AS ENUM ('water_outage','gas_outage','electricity_outage','leak','meter','billing','other');
CREATE TYPE public.claim_priority AS ENUM ('low','medium','high','urgent');
CREATE TYPE public.claim_status AS ENUM ('open','assigned','in_progress','resolved','cancelled');
CREATE TYPE public.crew_specialty AS ENUM ('water','gas','electricity','general');
CREATE TYPE public.work_order_status AS ENUM ('scheduled','in_progress','completed','cancelled');

-- claims
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number TEXT NOT NULL UNIQUE,
  member_id UUID NOT NULL,
  supply_id UUID,
  category public.claim_category NOT NULL DEFAULT 'other',
  priority public.claim_priority NOT NULL DEFAULT 'medium',
  status public.claim_status NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  opened_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_claims_member ON public.claims(member_id);
CREATE INDEX idx_claims_status ON public.claims(status);
CREATE INDEX idx_claims_supply ON public.claims(supply_id);

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage claims" ON public.claims FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));

CREATE POLICY "Clients view own claims" ON public.claims FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM members m WHERE m.id = claims.member_id AND m.user_id = auth.uid()));

CREATE POLICY "Clients create own claims" ON public.claims FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM members m WHERE m.id = claims.member_id AND m.user_id = auth.uid()));

CREATE TRIGGER trg_claims_updated BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- crews
CREATE TABLE public.crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty public.crew_specialty NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage crews" ON public.crews FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));

CREATE TRIGGER trg_crews_updated BEFORE UPDATE ON public.crews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- work_orders
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL,
  crew_id UUID NOT NULL,
  status public.work_order_status NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wo_claim ON public.work_orders(claim_id);
CREATE INDEX idx_wo_crew ON public.work_orders(crew_id);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage work orders" ON public.work_orders FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));

CREATE POLICY "Clients view own work orders" ON public.work_orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM claims c JOIN members m ON m.id = c.member_id
                 WHERE c.id = work_orders.claim_id AND m.user_id = auth.uid()));

CREATE TRIGGER trg_wo_updated BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- claim_comments
CREATE TABLE public.claim_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL,
  author_id UUID,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cc_claim ON public.claim_comments(claim_id);

ALTER TABLE public.claim_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage comments" ON public.claim_comments FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));

CREATE POLICY "Clients view own comments" ON public.claim_comments FOR SELECT TO authenticated
  USING (
    is_internal = false AND EXISTS (
      SELECT 1 FROM claims c JOIN members m ON m.id = c.member_id
      WHERE c.id = claim_comments.claim_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients add comments to own claims" ON public.claim_comments FOR INSERT TO authenticated
  WITH CHECK (
    is_internal = false AND author_id = auth.uid() AND EXISTS (
      SELECT 1 FROM claims c JOIN members m ON m.id = c.member_id
      WHERE c.id = claim_comments.claim_id AND m.user_id = auth.uid()
    )
  );