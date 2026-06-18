// ─────────────────────────────────────────────────────────────
// THYMOS — Edge Function : suppression de compte (RGPD)
// Supprime les données de l'utilisateur PUIS son compte auth.
// Nécessite la clé service_role (jamais exposée au client).
//
// Déploiement :
//   supabase functions deploy delete-account
//   (les secrets SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont
//    injectés automatiquement par Supabase pour les Edge Functions)
//
// Appel côté client (utilisateur connecté) :
//   await window.supabase.functions.invoke('delete-account')
// ─────────────────────────────────────────────────────────────
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405)

  try {
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim()
    if (!jwt) return json({ error: 'Non authentifié' }, 401)

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client admin (service_role) — contourne la RLS pour nettoyer toutes les données.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

    // Identifier l'utilisateur à partir de SON jeton (on ne supprime que son propre compte).
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
    if (userErr || !userData?.user) return json({ error: 'Session invalide' }, 401)
    const userId = userData.user.id

    // 1) Récupérer les salles de l'utilisateur.
    const { data: salles } = await admin.from('salles').select('id').eq('owner_id', userId)
    const salleIds = (salles || []).map((s: { id: string }) => s.id)

    // 2) Supprimer les données enfants (best-effort ; complète le ON DELETE CASCADE).
    if (salleIds.length) {
      const childTables = [
        'sparring_suggestions', 'session_participants', 'camp_weeks', 'camps',
        'blessures', 'alertes', 'questionnaires', 'combats', 'sessions',
        'notifications', 'combattants', 'salle_members',
      ]
      for (const t of childTables) {
        try { await admin.from(t).delete().in('salle_id', salleIds) } catch (_) { /* table sans salle_id : ignorée */ }
      }
    }

    // 3) Supprimer la salle et le profil.
    await admin.from('salles').delete().eq('owner_id', userId)
    await admin.from('profiles').delete().eq('id', userId)

    // 4) Supprimer le compte d'authentification.
    const { error: delErr } = await admin.auth.admin.deleteUser(userId)
    if (delErr) return json({ error: delErr.message }, 500)

    return json({ success: true })
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
