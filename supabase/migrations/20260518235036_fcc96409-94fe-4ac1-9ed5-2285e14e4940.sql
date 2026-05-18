
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v uuid;
  hdrs text;
  hdr_val text;
BEGIN
  IF public.is_super_admin() THEN
    -- 1) GUC explícito (set_acting_tenant)
    BEGIN
      v := nullif(current_setting('app.acting_tenant_id', true), '')::uuid;
    EXCEPTION WHEN others THEN v := NULL; END;
    IF v IS NOT NULL THEN RETURN v; END IF;

    -- 2) Header HTTP x-acting-tenant via PostgREST
    BEGIN
      hdrs := current_setting('request.headers', true);
      IF hdrs IS NOT NULL AND length(hdrs) > 0 THEN
        hdr_val := (hdrs::json) ->> 'x-acting-tenant';
        IF hdr_val IS NOT NULL AND length(hdr_val) > 0 THEN
          v := hdr_val::uuid;
          RETURN v;
        END IF;
      END IF;
    EXCEPTION WHEN others THEN
      -- header inválido: ignorar
      NULL;
    END;
  END IF;

  RETURN (
    SELECT tenant_id FROM public.tenant_members
    WHERE user_id = auth.uid()
    ORDER BY created_at ASC
    LIMIT 1
  );
END;
$$;
