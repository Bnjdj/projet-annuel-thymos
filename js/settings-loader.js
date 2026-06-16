/* ═══════════════════════════════════════════
   THYMOS — SETTINGS LOADER
   Applique les paramètres de la salle sur toutes les pages
════════════════════════════════════════════ */

(function () {
  // Source de vérité = base Supabase. localStorage sert de cache pour un rendu
  // instantané (paint) avant que la requête réseau n'aboutisse. On lit donc le
  // cache à chaque rendu (les clés peuvent avoir été mises à jour entre-temps).
  function gymName()     { return localStorage.getItem('thymos_gym_name'); }
  function gymInitials() { return localStorage.getItem('thymos_gym_initials') || 'AC'; }
  function gymLogo()     { return localStorage.getItem('thymos_gym_logo'); }
  function gymBg()       { return localStorage.getItem('thymos_gym_bg'); }

  function apply() {
    const GYM_NAME     = gymName();
    const GYM_INITIALS = gymInitials();
    const GYM_LOGO     = gymLogo();
    const GYM_BG       = gymBg();

    // ── Date dynamique ──────────────────────
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    // ── Nom de la salle ──────────────────────
    if (GYM_NAME) {
      document.querySelectorAll('.salle-name').forEach(el => {
        el.textContent = GYM_NAME;
      });
      document.querySelectorAll('.breadcrumb-gym').forEach(el => {
        if (el.textContent.trim() === 'Ma Salle' || el.textContent.trim() === 'Arena Combat Marseille') el.textContent = GYM_NAME;
      });
    }

    // ── Plan — handled by plan-guard.js, skip here ──

    // ── Avatar / Logo ────────────────────────
    document.querySelectorAll('.salle-avatar').forEach(el => {
      if (GYM_LOGO) {
        const safeUrl = typeof sanitizeCssUrl === 'function' ? sanitizeCssUrl(GYM_LOGO) : 'none';
        if (safeUrl !== 'none') {
          el.style.backgroundImage = safeUrl;
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
          el.style.color = 'transparent';
          el.textContent = '';
        }
      } else {
        el.textContent = GYM_INITIALS;
        el.style.backgroundImage = '';
        el.style.color = '';
      }
    });

    // ── Lien vers paramètres ─────────────────
    document.querySelectorAll('.salle-settings').forEach(el => {
      el.href = 'parametres.html';
    });

    // ── Image de fond ────────────────────────
    // Idempotent : on retire l'overlay précédent avant de le recréer pour que
    // la ré-application après hydratation DB ne cumule pas plusieurs calques.
    const prevOverlay = document.getElementById('gym-bg-overlay');
    if (prevOverlay) prevOverlay.remove();
    if (GYM_BG) {
      const safeUrl = typeof sanitizeCssUrl === 'function' ? sanitizeCssUrl(GYM_BG) : null;
      if (!safeUrl || safeUrl === 'none') return;
      const storedOpacity = Math.min(1, Math.max(0, parseFloat(localStorage.getItem('thymos_gym_opacity') || '8') / 100));
      const overlay = document.createElement('div');
      overlay.id = 'gym-bg-overlay';
      overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:0',
        `opacity:${storedOpacity}`,
        'pointer-events:none',
        'user-select:none',
      ].join(';');
      overlay.style.background = `${safeUrl} center/cover no-repeat`;
      document.body.insertBefore(overlay, document.body.firstChild);

      // S'assurer que tous les éléments sont au-dessus
      const sidebar = document.getElementById('sidebar');
      const main    = document.querySelector('.dashboard-main');
      if (sidebar) sidebar.style.position = 'relative';
      if (main)    main.style.position    = 'relative';
    }
  }

  // Hydratation depuis la base : la salle (table `salles`) est la source de
  // vérité. On met à jour le cache localStorage avec EXACTEMENT les mêmes clés
  // que parametres.html (thymos_gym_name / _logo / _bg / _opacity), puis on
  // ré-applique le rendu. Entièrement défensif : pas de session, table absente
  // ou erreur réseau → on garde silencieusement le rendu issu du cache local.
  async function hydrateFromDb() {
    try {
      const sb = window.supabase;
      if (!sb || typeof sb.from !== 'function') return;

      // Réutilise getCurrentSalle() (api.js) si disponible, sinon requête directe.
      let salle = null;
      if (typeof getCurrentSalle === 'function') {
        salle = await getCurrentSalle();
      } else {
        const { data, error } = await sb.from('salles').select('*').limit(1).single();
        if (error) return;
        salle = data;
      }
      if (!salle) return;

      let changed = false;
      if (salle.name) {
        if (localStorage.getItem('thymos_gym_name') !== salle.name) changed = true;
        localStorage.setItem('thymos_gym_name', salle.name);
      }
      if (salle.logo_url) {
        if (localStorage.getItem('thymos_gym_logo') !== salle.logo_url) changed = true;
        localStorage.setItem('thymos_gym_logo', salle.logo_url);
      }
      if (salle.bg_image_url) {
        if (localStorage.getItem('thymos_gym_bg') !== salle.bg_image_url) changed = true;
        localStorage.setItem('thymos_gym_bg', salle.bg_image_url);
      }
      if (salle.bg_opacity !== null && salle.bg_opacity !== undefined) {
        const opStr = String(salle.bg_opacity);
        if (localStorage.getItem('thymos_gym_opacity') !== opStr) changed = true;
        localStorage.setItem('thymos_gym_opacity', opStr);
      }

      // Ré-applique le rendu si les valeurs DB diffèrent du cache (ou toujours,
      // pour l'opacité du fond qui n'altère pas le DOM autrement). apply() est
      // idempotent (overlay recréé proprement).
      if (changed) apply();
    } catch (e) {
      console.warn('settings-loader: hydratation salle depuis la base echouee:', e);
    }
  }

  function init() {
    apply();          // (a) paint instantané depuis le cache local
    hydrateFromDb();  // (b)+(c)+(d) lecture DB → maj cache → ré-application
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
