-- ===== audit_log =====
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit" ON public.audit_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));
-- No INSERT/UPDATE/DELETE policies: solo triggers SECURITY DEFINER pueden escribir.

-- ===== notifications =====
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_unread ON public.notifications(user_id) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===== Helpers =====
CREATE OR REPLACE FUNCTION public.log_audit(
  _action TEXT, _entity_type TEXT, _entity_id UUID, _actor UUID, _metadata JSONB
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email TEXT;
BEGIN
  IF _actor IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = _actor;
  END IF;
  INSERT INTO public.audit_log(actor_id, actor_email, action, entity_type, entity_id, metadata)
  VALUES (_actor, v_email, _action, _entity_type, _entity_id, COALESCE(_metadata, '{}'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_member_user(
  _member_id UUID, _kind TEXT, _title TEXT, _body TEXT, _link TEXT, _metadata JSONB
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID;
BEGIN
  SELECT user_id INTO v_uid FROM public.members WHERE id = _member_id;
  IF v_uid IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications(user_id, kind, title, body, link, metadata)
  VALUES (v_uid, _kind, _title, _body, _link, COALESCE(_metadata, '{}'::jsonb));
END;
$$;

-- ===== Triggers: claims =====
CREATE OR REPLACE FUNCTION public.claims_audit_notify() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit('claim.created', 'claim', NEW.id, auth.uid(),
      jsonb_build_object('claim_number', NEW.claim_number, 'status', NEW.status, 'priority', NEW.priority));
    PERFORM public.notify_member_user(NEW.member_id, 'claim',
      'Reclamo recibido: ' || NEW.claim_number,
      'Tu reclamo "' || NEW.title || '" fue registrado.',
      '/cliente',
      jsonb_build_object('claim_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_audit('claim.status_changed', 'claim', NEW.id, auth.uid(),
      jsonb_build_object('claim_number', NEW.claim_number, 'from', OLD.status, 'to', NEW.status));
    PERFORM public.notify_member_user(NEW.member_id, 'claim',
      'Reclamo ' || NEW.claim_number || ': ' || NEW.status,
      'El estado de tu reclamo cambió a "' || NEW.status || '".',
      '/cliente',
      jsonb_build_object('claim_id', NEW.id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_claims_audit_notify
AFTER INSERT OR UPDATE ON public.claims
FOR EACH ROW EXECUTE FUNCTION public.claims_audit_notify();

-- ===== Triggers: work_orders =====
CREATE OR REPLACE FUNCTION public.work_orders_audit_notify() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_member UUID; v_claim_no TEXT; v_crew TEXT;
BEGIN
  SELECT c.member_id, c.claim_number INTO v_member, v_claim_no FROM public.claims c WHERE c.id = COALESCE(NEW.claim_id, OLD.claim_id);
  SELECT name INTO v_crew FROM public.crews WHERE id = COALESCE(NEW.crew_id, OLD.crew_id);

  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit('work_order.created', 'work_order', NEW.id, auth.uid(),
      jsonb_build_object('claim_id', NEW.claim_id, 'crew', v_crew, 'scheduled_at', NEW.scheduled_at));
    PERFORM public.notify_member_user(v_member, 'work_order',
      'Reclamo ' || v_claim_no || ' despachado',
      'Asignamos la cuadrilla "' || COALESCE(v_crew,'') || '" a tu reclamo.',
      '/cliente',
      jsonb_build_object('claim_id', NEW.claim_id, 'work_order_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_audit('work_order.status_changed', 'work_order', NEW.id, auth.uid(),
      jsonb_build_object('from', OLD.status, 'to', NEW.status, 'crew', v_crew));
    IF NEW.status IN ('in_progress','completed') THEN
      PERFORM public.notify_member_user(v_member, 'work_order',
        'Reclamo ' || v_claim_no || ': ' ||
          CASE NEW.status WHEN 'in_progress' THEN 'cuadrilla en camino' ELSE 'trabajo completado' END,
        'La cuadrilla "' || COALESCE(v_crew,'') || '" ' ||
          CASE NEW.status WHEN 'in_progress' THEN 'inició la atención' ELSE 'finalizó la atención' END || '.',
        '/cliente',
        jsonb_build_object('claim_id', NEW.claim_id, 'work_order_id', NEW.id, 'status', NEW.status));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_work_orders_audit_notify
AFTER INSERT OR UPDATE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.work_orders_audit_notify();

-- ===== Triggers: payments =====
CREATE OR REPLACE FUNCTION public.payments_audit_notify() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_member UUID; v_inv_no TEXT;
BEGIN
  SELECT i.member_id, i.invoice_number INTO v_member, v_inv_no FROM public.invoices i WHERE i.id = NEW.invoice_id;
  PERFORM public.log_audit('payment.recorded', 'payment', NEW.id, auth.uid(),
    jsonb_build_object('invoice_id', NEW.invoice_id, 'invoice_number', v_inv_no, 'amount', NEW.amount, 'method', NEW.method));
  PERFORM public.notify_member_user(v_member, 'payment',
    'Pago registrado en factura ' || v_inv_no,
    'Registramos un pago por $' || NEW.amount::text || '.',
    '/cliente',
    jsonb_build_object('invoice_id', NEW.invoice_id, 'payment_id', NEW.id));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payments_audit_notify
AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.payments_audit_notify();

-- ===== Triggers: invoices (issuance audit only) =====
CREATE OR REPLACE FUNCTION public.invoices_audit() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit('invoice.created', 'invoice', NEW.id, auth.uid(),
      jsonb_build_object('invoice_number', NEW.invoice_number, 'total', NEW.total, 'due_date', NEW.due_date));
    PERFORM public.notify_member_user(NEW.member_id, 'invoice',
      'Nueva factura ' || NEW.invoice_number,
      'Se emitió tu factura por $' || NEW.total::text || ', vence ' || NEW.due_date::text || '.',
      '/cliente',
      jsonb_build_object('invoice_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_audit('invoice.status_changed', 'invoice', NEW.id, auth.uid(),
      jsonb_build_object('from', OLD.status, 'to', NEW.status, 'invoice_number', NEW.invoice_number));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invoices_audit
AFTER INSERT OR UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.invoices_audit();

-- ===== Realtime =====
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;