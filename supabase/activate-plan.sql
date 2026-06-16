-- Function to activate the FREE plan only (decouverte)
-- SECURITY: paid plans (guerrier/champion) can NEVER be self-activated here.
--           They must go through verify_and_activate_plan() after a real payment,
--           or be set manually by an admin.
-- Run in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION activate_plan(new_plan text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_salle_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifie');
  END IF;

  -- SECURITY GUARD: only the free plan can be self-activated.
  -- This closes the hole where any authenticated user could call
  -- activate_plan('champion') / ('pro') and upgrade for free.
  IF new_plan <> 'decouverte' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Les plans payants necessitent un paiement valide.'
    );
  END IF;

  -- Find user's salle
  SELECT id INTO v_salle_id FROM salles WHERE owner_id = v_user_id LIMIT 1;
  IF v_salle_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Aucune salle trouvee');
  END IF;

  -- Update plan (always 'decouverte' at this point)
  UPDATE salles SET plan = 'decouverte', updated_at = now() WHERE id = v_salle_id;

  RETURN json_build_object('success', true, 'plan', 'decouverte', 'salle_id', v_salle_id);
END;
$$;
