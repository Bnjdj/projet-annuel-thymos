-- ═══════════════════════════════════════════
-- THYMOS — Verify Stripe payment before plan activation
-- Run this migration AFTER creating a stripe_payments table
-- that stores webhook events from Stripe
-- ═══════════════════════════════════════════

-- Table to store validated Stripe checkout sessions (populated by Stripe webhook)
CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_session_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('guerrier', 'champion')),
  amount_total INTEGER,
  currency TEXT DEFAULT 'eur',
  status TEXT DEFAULT 'completed',
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON stripe_payments FOR SELECT
  USING (auth.uid() = user_id);

-- Function: verify payment then activate plan (called from client).
-- This is the ONLY path that may set a PAID plan. It does the UPDATE itself
-- (it no longer calls activate_plan, which now refuses paid plans by design).
CREATE OR REPLACE FUNCTION verify_and_activate_plan(new_plan TEXT, stripe_session_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  payment_record RECORD;
  v_salle_id uuid;
BEGIN
  -- Only paid plans go through here
  IF new_plan NOT IN ('guerrier', 'champion') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plan invalide.');
  END IF;

  -- Check payment exists, belongs to the caller, matches the plan, and is unused
  SELECT * INTO payment_record
  FROM stripe_payments
  WHERE stripe_payments.stripe_session_id = verify_and_activate_plan.stripe_session_id
    AND stripe_payments.user_id = auth.uid()
    AND stripe_payments.plan = new_plan
    AND stripe_payments.used = false;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Paiement non trouve ou deja utilise.');
  END IF;

  -- Locate the caller's salle
  SELECT id INTO v_salle_id FROM salles WHERE owner_id = auth.uid() LIMIT 1;
  IF v_salle_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aucune salle trouvee.');
  END IF;

  -- Mark payment as used (single-use)
  UPDATE stripe_payments SET used = true WHERE id = payment_record.id;

  -- Activate the paid plan directly (payment already verified above)
  UPDATE salles SET plan = new_plan, updated_at = now() WHERE id = v_salle_id;

  RETURN jsonb_build_object('success', true, 'plan', new_plan, 'salle_id', v_salle_id);
END;
$$;
