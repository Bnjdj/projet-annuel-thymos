-- ═══════════════════════════════════════════
-- THYMOS — Server-side plan limits enforcement
-- Prevents client-side bypass of plan restrictions
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_plan_limit(action_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_plan TEXT;
  current_count INTEGER;
  max_allowed INTEGER;
  salle_record RECORD;
BEGIN
  -- Get user's salle and plan
  SELECT * INTO salle_record
  FROM salles
  WHERE owner_id = auth.uid()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Salle non trouvee.');
  END IF;

  user_plan := COALESCE(salle_record.plan, 'decouverte');

  IF action_type = 'add_fighter' THEN
    -- Count current fighters
    SELECT COUNT(*) INTO current_count
    FROM combattants
    WHERE salle_id = salle_record.id;

    -- Plan limits
    max_allowed := CASE user_plan
      WHEN 'decouverte' THEN 3
      WHEN 'guerrier' THEN 15
      WHEN 'champion' THEN 999999
      ELSE 3
    END;

    IF current_count >= max_allowed THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'error', 'Limite de combattants atteinte pour votre plan (' || max_allowed || ').',
        'current', current_count,
        'max', max_allowed,
        'plan', user_plan
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', true, 'plan', user_plan);
END;
$$;
