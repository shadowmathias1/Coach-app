-- =============================================
-- Invite code lookup (bypass RLS for onboarding)
-- =============================================

CREATE OR REPLACE FUNCTION public.get_coach_by_invite_code(invite_code TEXT)
RETURNS TABLE (id UUID, brand_name TEXT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT c.id, c.brand_name
  FROM public.coaches c
  WHERE c.invite_code = UPPER(invite_code)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_coach_by_invite_code(TEXT) TO anon, authenticated;
