
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v uuid;
BEGIN
  IF public.is_super_admin() THEN
    BEGIN
      v := nullif(current_setting('app.acting_tenant_id', true), '')::uuid;
    EXCEPTION WHEN others THEN
      v := NULL;
    END;
    IF v IS NOT NULL THEN
      RETURN v;
    END IF;
  END IF;
  RETURN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid()
    ORDER BY created_at ASC
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_acting_tenant(_tid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Forbidden: requiere super admin';
  END IF;
  PERFORM set_config('app.acting_tenant_id', COALESCE(_tid::text, ''), true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_acting_tenant(uuid) TO authenticated;
