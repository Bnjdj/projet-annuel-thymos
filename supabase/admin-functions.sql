-- ═══════════════════════════════════════════
-- THYMOS — Admin read functions (used by admin.html)
-- SECURITY: each function checks is_admin() BEFORE returning any data.
--           Without this guard, any authenticated user calling these RPC
--           could read ALL salles / profiles / combattants of the platform.
-- Run AFTER admin-check.sql (these depend on is_admin()).
-- ═══════════════════════════════════════════

-- Salles (full table) — admin only
DROP FUNCTION IF EXISTS admin_all_salles();
CREATE FUNCTION admin_all_salles()
RETURNS SETOF salles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acces refuse : reserve aux administrateurs';
  END IF;
  RETURN QUERY SELECT * FROM salles ORDER BY created_at DESC;
END;
$$;

-- Profiles (full table) — admin only
DROP FUNCTION IF EXISTS admin_all_profiles();
CREATE FUNCTION admin_all_profiles()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acces refuse : reserve aux administrateurs';
  END IF;
  RETURN QUERY SELECT * FROM profiles ORDER BY created_at DESC;
END;
$$;

-- Combattants (full table) — admin only
DROP FUNCTION IF EXISTS admin_all_combattants();
CREATE FUNCTION admin_all_combattants()
RETURNS SETOF combattants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acces refuse : reserve aux administrateurs';
  END IF;
  RETURN QUERY SELECT * FROM combattants ORDER BY created_at DESC;
END;
$$;

-- Defense in depth: anonymous role can't even call these
REVOKE EXECUTE ON FUNCTION admin_all_salles()       FROM anon;
REVOKE EXECUTE ON FUNCTION admin_all_profiles()     FROM anon;
REVOKE EXECUTE ON FUNCTION admin_all_combattants()  FROM anon;
