/* ═══════════════════════════════════════════
   THYMOS — SIDEBAR BADGES
   Alimente les compteurs de la barre latérale :
   - nombre de combattants
   - nombre d'alertes non résolues
   Chargé (defer) sur toutes les pages de l'app.
════════════════════════════════════════════ */
(async function updateSidebarBadges() {
  if (!window.supabase) return;
  try {
    const { data: salles } = await window.supabase.from('salles').select('id').limit(1);
    const salleId = salles && salles[0] && salles[0].id;
    if (!salleId) return;

    // ── Combattants ──
    const { count: fighters } = await window.supabase
      .from('combattants')
      .select('id', { count: 'exact', head: true })
      .eq('salle_id', salleId);
    document.querySelectorAll('.nav-item[href="combattants.html"] .nav-badge').forEach(b => {
      b.textContent = fighters || 0;
    });

    // ── Alertes non résolues ──
    const { count: alerts } = await window.supabase
      .from('alertes')
      .select('id', { count: 'exact', head: true })
      .eq('salle_id', salleId)
      .eq('is_resolved', false);
    document.querySelectorAll('.nav-item[href="alertes.html"] .nav-badge').forEach(b => {
      if (alerts && alerts > 0) {
        b.textContent = alerts;
        b.style.opacity = '';
      } else {
        b.textContent = '0';
        b.style.opacity = '0.5';
      }
    });
  } catch (e) {
    console.warn('sidebar-badges:', e);
  }
})();
