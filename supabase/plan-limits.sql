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

-- ═══════════════════════════════════════════
-- Garde-fou SERVEUR (fail-closed) : empeche d'inserer un combattant
-- au-dela de la limite du plan, meme si le client contourne la RPC.
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION enforce_fighter_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  p TEXT;
  cnt INT;
  maxa INT;
BEGIN
  SELECT plan INTO p FROM salles WHERE id = NEW.salle_id;
  maxa := CASE COALESCE(p, 'decouverte')
    WHEN 'decouverte' THEN 3
    WHEN 'guerrier' THEN 15
    WHEN 'champion' THEN 999999
    ELSE 3
  END;
  SELECT COUNT(*) INTO cnt FROM combattants WHERE salle_id = NEW.salle_id;
  IF cnt >= maxa THEN
    RAISE EXCEPTION 'Limite de combattants atteinte pour votre plan (%).', maxa
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_fighter_plan_limit ON combattants;
CREATE TRIGGER trg_enforce_fighter_plan_limit
  BEFORE INSERT ON combattants
  FOR EACH ROW EXECUTE FUNCTION enforce_fighter_plan_limit();
