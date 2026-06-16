-- ═══════════════════════════════════════════
-- THYMOS — Server-side admin check
-- Replaces client-side UUID hardcoding
-- ═══════════════════════════════════════════

-- Admin list table (replace hardcoded UUIDs)
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can read the admin list
CREATE POLICY "Admins can read admin list"
  ON admin_users FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Seed existing admins (migrate from hardcoded UUIDs)
INSERT INTO admin_users (user_id) VALUES
  ('00000000-0000-0000-0000-000000000000'),
  ('00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- RPC function for client-side check
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
END;
$$;
