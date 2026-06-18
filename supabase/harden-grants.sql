-- ═══════════════════════════════════════════
-- THYMOS — Durcissement des fonctions (appliqué en prod le 2026-06-18)
-- Corrige les advisors Supabase :
--  - search_path figé sur les fonctions trigger
--  - EXECUTE retiré de PUBLIC (donc d'anon) sur toutes les fonctions sensibles
--  - re-accordé uniquement à `authenticated` pour les RPC appelés par l'app
-- ═══════════════════════════════════════════

-- search_path figé sur les fonctions trigger internes
alter function public.handle_new_user()  set search_path = public, pg_temp;
alter function public.handle_new_salle() set search_path = public, pg_temp;

-- Fonctions trigger : aucun accès via l'API REST (revoke PUBLIC, pas de grant)
revoke execute on function public.handle_new_user()            from public;
revoke execute on function public.handle_new_salle()           from public;
revoke execute on function public.enforce_fighter_plan_limit() from public;

-- RPC applicatifs : réservés aux utilisateurs CONNECTÉS (retire anon via PUBLIC, ré-accorde authenticated)
revoke execute on function public.is_admin() from public;
grant  execute on function public.is_admin() to authenticated;

revoke execute on function public.check_plan_limit(text) from public;
grant  execute on function public.check_plan_limit(text) to authenticated;

revoke execute on function public.activate_plan(text) from public;
grant  execute on function public.activate_plan(text) to authenticated;

revoke execute on function public.verify_and_activate_plan(text, text) from public;
grant  execute on function public.verify_and_activate_plan(text, text) to authenticated;

revoke execute on function public.admin_all_combattants() from public;
grant  execute on function public.admin_all_combattants() to authenticated;

revoke execute on function public.admin_all_profiles() from public;
grant  execute on function public.admin_all_profiles() to authenticated;

revoke execute on function public.admin_all_salles() from public;
grant  execute on function public.admin_all_salles() to authenticated;

-- NB : les fonctions ci-dessus restent SECURITY DEFINER (nécessaire : elles
-- contournent volontairement la RLS et s'auto-protègent via is_admin()/auth.uid()).
-- L'avertissement "authenticated peut exécuter" est donc attendu et assumé.
