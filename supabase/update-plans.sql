-- Update plan constraint to accept new names
-- Run in Supabase SQL Editor

ALTER TABLE public.salles DROP CONSTRAINT IF EXISTS salles_plan_check;
ALTER TABLE public.salles ADD CONSTRAINT salles_plan_check CHECK (plan IN ('decouverte', 'guerrier', 'champion', 'pro', 'elite'));
