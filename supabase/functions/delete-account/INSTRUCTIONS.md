# Suppression de compte (RGPD) — à finaliser ensemble

L'Edge Function `delete-account` est prête (`index.ts`). Elle supprime les données de
l'utilisateur **puis** son compte d'authentification, en utilisant la clé `service_role`
(jamais exposée au navigateur).

## 1) Déployer la fonction (toi, via Supabase CLI)

```bash
# une seule fois : lier le projet
supabase link --project-ref VOTRE-PROJET-REF
# déployer
supabase functions deploy delete-account
```

Les secrets `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement
aux Edge Functions — rien à configurer.

## 2) Vérifier le ON DELETE CASCADE (recommandé)

La fonction supprime déjà les tables enfants en best-effort, mais le plus propre est que
les clés étrangères vers `salles` soient en `ON DELETE CASCADE` (c'est le cas dans
`schema.sql` pour la plupart des tables). Rien à faire si le schéma est déjà déployé.

## 3) Câblage du bouton (à faire ENSEMBLE, après déploiement)

Dans `parametres.html`, la « Zone de danger » contient un bouton `Supprimer le compte`
actuellement désactivé (`disabled`, badge « Bientôt »). Une fois la fonction déployée,
on l'activera avec un handler qui :

1. demande une confirmation forte (saisir « SUPPRIMER ») ;
2. appelle la fonction ;
3. déconnecte et redirige.

Snippet prévu :

```js
document.getElementById('deleteAccountBtn')?.addEventListener('click', async () => {
  if (prompt('Cette action est irréversible. Tapez SUPPRIMER pour confirmer.') !== 'SUPPRIMER') return;
  const { error } = await window.supabase.functions.invoke('delete-account');
  if (error) { toast('Erreur : ' + error.message, 'error'); return; }
  await window.supabase.auth.signOut();
  window.location.href = 'index.html';
});
```

> On finalise cette étape ensemble une fois la fonction déployée et testée sur un compte de test.
