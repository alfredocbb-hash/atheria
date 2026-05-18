-- 1. Replace handle_new_user to auto-link member by email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
  v_match_count int;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );

  IF lower(NEW.email) = 'alfredocbb@gmail.com' THEN
    v_role := 'admin';
  ELSE
    v_role := 'client';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role);

  -- Auto-link to member by email (only if exactly one unlinked match)
  IF NEW.email IS NOT NULL THEN
    SELECT count(*) INTO v_match_count
    FROM public.members
    WHERE user_id IS NULL AND lower(email) = lower(NEW.email);

    IF v_match_count = 1 THEN
      UPDATE public.members
      SET user_id = NEW.id
      WHERE user_id IS NULL AND lower(email) = lower(NEW.email);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Trigger on members to auto-link when admin enters/updates a member with matching auth user email
CREATE OR REPLACE FUNCTION public.members_autolink_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid;
  v_match_count int;
BEGIN
  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT count(*) INTO v_match_count
    FROM auth.users
    WHERE lower(email) = lower(NEW.email);

    IF v_match_count = 1 THEN
      SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(NEW.email) LIMIT 1;
      NEW.user_id := v_uid;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS members_autolink_user_trg ON public.members;
CREATE TRIGGER members_autolink_user_trg
  BEFORE INSERT OR UPDATE OF email, user_id ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.members_autolink_user();

-- 3. Index for fast email matching
CREATE INDEX IF NOT EXISTS members_email_lower_idx ON public.members (lower(email));

-- 4. Backfill: auto-link existing unlinked members where email uniquely matches an auth user
UPDATE public.members m
SET user_id = u.id
FROM auth.users u
WHERE m.user_id IS NULL
  AND m.email IS NOT NULL
  AND lower(m.email) = lower(u.email)
  AND (
    SELECT count(*) FROM public.members m2
    WHERE m2.user_id IS NULL AND lower(m2.email) = lower(u.email)
  ) = 1
  AND (
    SELECT count(*) FROM auth.users u2
    WHERE lower(u2.email) = lower(m.email)
  ) = 1;

-- 5. RPC for client portal to link their account by member_number + document_id
CREATE OR REPLACE FUNCTION public.link_my_member(_member_number text, _document_id text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_member_id uuid;
  v_norm_doc text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Already linked?
  IF EXISTS (SELECT 1 FROM public.members WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'Tu cuenta ya está vinculada a un socio';
  END IF;

  v_norm_doc := regexp_replace(coalesce(_document_id, ''), '[^0-9A-Za-z]', '', 'g');

  SELECT id INTO v_member_id
  FROM public.members
  WHERE user_id IS NULL
    AND trim(member_number) = trim(_member_number)
    AND regexp_replace(coalesce(document_id, ''), '[^0-9A-Za-z]', '', 'g') = v_norm_doc
  LIMIT 1;

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró un socio con esos datos o ya está vinculado';
  END IF;

  UPDATE public.members SET user_id = v_uid WHERE id = v_member_id AND user_id IS NULL;

  PERFORM public.log_audit('member.linked', 'member', v_member_id, v_uid, jsonb_build_object('via', 'self_service'));

  RETURN v_member_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.link_my_member(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.link_my_member(text, text) TO authenticated;