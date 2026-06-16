/* ═══════════════════════════════════════════
   THYMOS — SUPABASE CONFIG
════════════════════════════════════════════ */

const SUPABASE_URL = 'https://VOTRE-PROJET.supabase.co';
const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANON_PUBLIQUE';

// CDN exposes window.supabase as the module — use createClient from it
const _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Override window.supabase with the initialized client so all scripts can use `supabase.auth...`
window.supabase = _supabaseClient;
