
-- A. Quitar membresía del super admin
DELETE FROM public.tenant_members
WHERE user_id = (SELECT id FROM auth.users WHERE lower(email) = 'alfredocbb@gmail.com');

-- B. tenants: columnas agnósticas + provider
ALTER TABLE public.tenants RENAME COLUMN stripe_customer_id TO billing_customer_id;
ALTER TABLE public.tenants RENAME COLUMN stripe_subscription_id TO billing_subscription_id;
ALTER TABLE public.tenants ADD COLUMN billing_provider text NOT NULL DEFAULT 'mercadopago';
ALTER TABLE public.tenants ADD CONSTRAINT tenants_billing_provider_chk
  CHECK (billing_provider IN ('mercadopago','stripe','manual'));

-- C. plans: id de precio genérico + extra MP
ALTER TABLE public.plans RENAME COLUMN stripe_price_id TO provider_price_id;
ALTER TABLE public.plans ADD COLUMN mp_preapproval_plan_id text;

-- D. subscription_events: agnóstico + provider
ALTER TABLE public.subscription_events RENAME COLUMN stripe_event_id TO provider_event_id;
ALTER TABLE public.subscription_events ADD COLUMN provider text NOT NULL DEFAULT 'mercadopago';

-- E. Seed planes vacíos (definir features/precio luego)
INSERT INTO public.plans (code, name, description, price_cents, currency, is_active, features, limits)
VALUES
  ('basic',      'Basic',      'Plan inicial — por definir',   0, 'ARS', false, '{}'::jsonb, '{}'::jsonb),
  ('pro',        'Pro',        'Plan intermedio — por definir',0, 'ARS', false, '{}'::jsonb, '{}'::jsonb),
  ('enterprise', 'Enterprise', 'Plan avanzado — por definir',  0, 'ARS', false, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT DO NOTHING;
