
-- ENUMS
CREATE TYPE public.invoice_status AS ENUM ('draft','issued','paid','overdue','void');
CREATE TYPE public.payment_method AS ENUM ('cash','transfer','card','debit','other');
CREATE TYPE public.reading_source AS ENUM ('manual','estimated','remote');
CREATE TYPE public.invoice_item_kind AS ENUM ('fixed_charge','consumption','tax','other');

-- TARIFFS
CREATE TABLE public.tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_type public.service_type NOT NULL,
  category TEXT,
  fixed_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(12,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ARS',
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read tariffs" ON public.tariffs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage tariffs" ON public.tariffs FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE TRIGGER tariffs_touch BEFORE UPDATE ON public.tariffs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- METER READINGS
CREATE TABLE public.meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.meters(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reading_value NUMERIC(14,3) NOT NULL,
  consumption NUMERIC(14,3),
  source public.reading_source NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_meter_readings_meter_date ON public.meter_readings(meter_id, reading_date DESC);
ALTER TABLE public.meter_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage readings" ON public.meter_readings FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Clients view own readings" ON public.meter_readings FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.meters mt
    JOIN public.supplies s ON s.id = mt.supply_id
    JOIN public.members m ON m.id = s.member_id
    WHERE mt.id = meter_readings.meter_id AND m.user_id = auth.uid()
  )
);
CREATE TRIGGER meter_readings_touch BEFORE UPDATE ON public.meter_readings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- INVOICES
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE RESTRICT,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ARS',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  reading_previous_id UUID REFERENCES public.meter_readings(id),
  reading_current_id UUID REFERENCES public.meter_readings(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_supply ON public.invoices(supply_id, period_end DESC);
CREATE INDEX idx_invoices_member ON public.invoices(member_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Clients view own invoices" ON public.invoices FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.id = invoices.member_id AND m.user_id = auth.uid())
);
CREATE TRIGGER invoices_touch BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- INVOICE ITEMS
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  kind public.invoice_item_kind NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,4) NOT NULL DEFAULT 0,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage invoice items" ON public.invoice_items FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Clients view own invoice items" ON public.invoice_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.invoices i JOIN public.members m ON m.id = i.member_id
    WHERE i.id = invoice_items.invoice_id AND m.user_id = auth.uid()
  )
);

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  method public.payment_method NOT NULL DEFAULT 'cash',
  reference TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage payments" ON public.payments FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "Clients view own payments" ON public.payments FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.invoices i JOIN public.members m ON m.id = i.member_id
    WHERE i.id = payments.invoice_id AND m.user_id = auth.uid()
  )
);

-- Helper: recompute invoice balance and mark paid
CREATE OR REPLACE FUNCTION public.recompute_invoice_balance(_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total NUMERIC(14,2);
  v_paid NUMERIC(14,2);
  v_new_balance NUMERIC(14,2);
  v_status public.invoice_status;
  v_due DATE;
BEGIN
  SELECT total, due_date, status INTO v_total, v_due, v_status FROM public.invoices WHERE id = _invoice_id;
  IF v_total IS NULL THEN RETURN; END IF;
  SELECT COALESCE(SUM(amount),0) INTO v_paid FROM public.payments WHERE invoice_id = _invoice_id;
  v_new_balance := v_total - v_paid;
  IF v_new_balance <= 0 AND v_status <> 'void' THEN
    v_status := 'paid';
  ELSIF v_status NOT IN ('draft','void','paid') AND v_due < CURRENT_DATE THEN
    v_status := 'overdue';
  ELSIF v_status = 'paid' AND v_new_balance > 0 THEN
    v_status := 'issued';
  END IF;
  UPDATE public.invoices SET balance = v_new_balance, status = v_status WHERE id = _invoice_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.recompute_invoice_balance(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.payments_after_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_invoice_balance(OLD.invoice_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_invoice_balance(NEW.invoice_id);
    RETURN NEW;
  END IF;
END;
$$;
CREATE TRIGGER payments_recompute AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.payments_after_change();
