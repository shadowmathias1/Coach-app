-- =============================================
-- Client signup helper v2 (avoid name conflicts)
-- =============================================

CREATE OR REPLACE FUNCTION public.create_client_with_invite_v2(
  p_invite_code TEXT,
  display_name TEXT
)
RETURNS TABLE (id UUID, coach_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_coach_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT c.id INTO v_coach_id
  FROM public.coaches c
  WHERE c.invite_code = UPPER(p_invite_code)
  LIMIT 1;

  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO public.clients (id, coach_id, display_name)
  VALUES (v_user_id, v_coach_id, display_name)
  ON CONFLICT ON CONSTRAINT clients_pkey DO NOTHING;

  RETURN QUERY SELECT v_user_id, v_coach_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_client_with_invite_v2(TEXT, TEXT) TO authenticated;
