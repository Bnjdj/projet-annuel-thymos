# Suppression de compte (RGPD) — DÉPLOYÉE ✅

L'Edge Function `delete-account` (`index.ts`) est **déployée en production** (2026-06-18,
via le connecteur Supabase, `verify_jwt: true`) et le bouton **« Supprimer mon compte »**
de `parametres.html` (Zone de danger) est **câblé** : confirmation par saisie de
« SUPPRIMER », appel de la fonction, déconnexion, redirection vers l'accueil.

Elle supprime les données de l'utilisateur (salle + tables enfants + profil) **puis** son
compte d'authentification, en utilisant la clé `service_role` (jamais exposée au navigateur ;
fournie automatiquement à l'Edge Function par Supabase).

## Re-déployer si besoin (Supabase CLI)

```bash
supabase functions deploy delete-account
```

## Tester

Sur un **compte de test**, ouvrir Paramètres → Sécurité → Zone de danger →
« Supprimer mon compte », taper `SUPPRIMER`. Vérifier que la salle, les combattants et le
compte auth ont bien disparu (table `auth.users` + `public.salles`).

> Recommandé : que les clés étrangères vers `salles` soient en `ON DELETE CASCADE`
> (déjà le cas dans `schema.sql`). La fonction supprime aussi les tables enfants en
> best-effort, donc elle reste robuste même sans cascade.
