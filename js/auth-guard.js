/* ═══════════════════════════════════════════
   THYMOS — AUTH GUARD
   Protects dashboard pages — redirects to login if not authenticated
   Include AFTER supabase-config.js on protected pages
════════════════════════════════════════════ */

(async function authGuard() {
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      window.location.href = 'connexion.html';
      return;
    }

    // Expose user data globally (frozen to prevent tampering by third-party scripts)
    window.thymosUser = Object.freeze(Object.assign({}, session.user));
    window.thymosSession = Object.freeze(Object.assign({}, session));

    // Update UI with user info
    const meta = session.user.user_metadata || {};
    const gymName = meta.gym_name || 'Ma Salle';
    const firstName = meta.first_name || '';
    const lastName = meta.last_name || '';

    // Update sidebar gym name — always
    const sidebarName = document.querySelector('.salle-name');
    if (sidebarName) sidebarName.textContent = gymName;

    // Update breadcrumb gym name — always
    document.querySelectorAll('.breadcrumb-gym').forEach(el => {
      if (el.textContent === 'Ma Salle' || el.textContent === '—') el.textContent = gymName;
    });

    // Update sidebar avatar initials — always
    const sidebarAvatar = document.querySelector('.salle-avatar');
    if (sidebarAvatar && !sidebarAvatar.style.backgroundImage) {
      const words = gymName.split(' ').filter(Boolean);
      const initials = words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : gymName.slice(0, 2).toUpperCase();
      sidebarAvatar.textContent = initials;
    }

    // Listen for auth changes (logout from another tab, session expired)
    window.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        window.location.href = 'connexion.html';
      }
    });

  } catch (err) {
    console.warn('Auth guard error:', err);
    window.location.href = 'connexion.html';
  }
})();

// ─── LOGOUT FUNCTION ────────────────────────
async function logout() {
  try {
    await window.supabase.auth.signOut();
    window.location.href = 'connexion.html';
  } catch (err) {
    console.warn('Logout error:', err);
    window.location.href = 'connexion.html';
  }
}

// ─── INJECT LOGOUT BUTTON IF MISSING ────────
(function injectLogout() {
  const footer = document.querySelector('.sidebar__footer');
  if (!footer || footer.querySelector('.sidebar-logout')) return;

  const btn = document.createElement('button');
  btn.className = 'sidebar-logout';
  btn.setAttribute('onclick', 'logout()');
  btn.setAttribute('title', 'Deconnexion');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" class="icon icon--sm" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    <span>Deconnexion</span>`;
  footer.appendChild(btn);
})();
