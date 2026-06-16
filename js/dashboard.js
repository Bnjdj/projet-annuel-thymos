/* ═══════════════════════════════════════════
   THYMOS — DASHBOARD JS
════════════════════════════════════════════ */

// ─── SIDEBAR TOGGLE (mobile) ───────────────
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

// Create overlay element for mobile sidebar
let sidebarOverlay = document.querySelector('.sidebar-overlay');
if (!sidebarOverlay && sidebar) {
  sidebarOverlay = document.createElement('div');
  sidebarOverlay.className = 'sidebar-overlay';
  document.body.appendChild(sidebarOverlay);
}

function closeSidebar() {
  if (sidebar) sidebar.classList.remove('open');
  if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

function openSidebar() {
  if (sidebar) sidebar.classList.add('open');
  if (sidebarOverlay) sidebarOverlay.classList.add('active');
}

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }
  // Close on nav item click (mobile)
  sidebar.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });
}

// ─── FILTRE / RECHERCHE / LIGNES COMBATTANTS ──
// Le filtrage par statut, la recherche et la navigation au clic sur une ligne
// combattant sont désormais gérés dynamiquement par page-combattants.js et
// page-dashboard.js (rendu réel depuis Supabase, lien combattant.html?id=…).
// L'ancien code statique (capture des .fighter-row au chargement, applyFilters
// avec un total « sur 12 » codé en dur, et redirection vers combattant.html
// SANS ?id=) a été retiré : il était mort et pouvait ouvrir une fiche vide.

// ─── MINI CHAT IA ──────────────────────────
// L'IA Coach n'est pas encore disponible. Le mini-chat est présenté
// comme « bientôt disponible » dans dashboard.html (champ + bouton désactivés).
// Aucune réponse n'est simulée ici pour ne pas tromper l'utilisateur.

// ─── REFRESH SPARRING ──────────────────────
// La régénération de sparring assistée par IA n'est pas encore disponible.
// L'ancien simulateur (fausses réponses « Analyse en cours… ») a été retiré.

// ─── SCROLL REVEAL (staggered per group) ───
(function initReveal() {
  const selectors = '.panel, .alert-full, .combat-card, .sp-card, .fight-card, .settings-card';
  const revealEls = document.querySelectorAll(selectors);
  if (!revealEls.length) return;

  // Group elements by their vertical position (within 60px = same row)
  let groupIndex = 0;
  let lastTop = -999;

  revealEls.forEach(el => {
    el.classList.add('reveal');
    const rect = el.getBoundingClientRect();
    if (Math.abs(rect.top - lastTop) > 60) {
      groupIndex++;
      lastTop = rect.top;
    }
    el._revealGroup = groupIndex;
  });

  const groupCounters = {};
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const group = el._revealGroup || 0;
      if (!groupCounters[group]) groupCounters[group] = 0;
      const stagger = groupCounters[group] * 70;
      groupCounters[group]++;

      setTimeout(() => el.classList.add('visible'), stagger);
      observer.unobserve(el);
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

  revealEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.1 && rect.bottom > 0) {
      // Already in viewport on load — reveal with stagger
      const group = el._revealGroup || 0;
      if (!groupCounters[group]) groupCounters[group] = 0;
      const stagger = groupCounters[group] * 70;
      groupCounters[group]++;
      setTimeout(() => el.classList.add('visible'), 100 + stagger);
    } else {
      observer.observe(el);
    }
  });
})();

// ─── BUTTON LIGHT FOLLOW ───────────────────
document.querySelectorAll('.btn--primary').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--ripple-x', ((e.clientX - rect.left) / rect.width * 100) + '%');
    btn.style.setProperty('--ripple-y', ((e.clientY - rect.top) / rect.height * 100) + '%');
  });
});

// ─── PAGE TRANSITIONS ──────────────────────
document.querySelectorAll('a[href$=".html"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    // Don't intercept same-page anchors or external links
    if (!href || href.startsWith('#') || href.startsWith('http') || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const content = document.querySelector('.dashboard-content') || document.querySelector('main');
    if (content) {
      content.classList.add('page-exit');
      setTimeout(() => { window.location.href = href; }, 180);
    } else {
      window.location.href = href;
    }
  });
});

// ─── ANIMATED KPI COUNTERS ─────────────────
(function initKpiCounters() {
  const kpiValues = document.querySelectorAll('.kpi-value');
  if (!kpiValues.length) return;

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el._counted) return;
      el._counted = true;

      const text = el.textContent.trim();
      // Extract number and suffix (e.g. "71%" -> 71, "%")
      const match = text.match(/^(\d+)/);
      if (!match) return;
      const target = parseInt(match[1], 10);
      const suffix = text.slice(match[0].length);
      // Keep inner HTML structure (for <span class="kpi-unit">)
      const unitSpan = el.querySelector('.kpi-unit');
      const unitHTML = unitSpan ? unitSpan.outerHTML : '';

      let current = 0;
      const duration = 600;
      const startTime = performance.now();

      function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        // ease-out-quart
        const eased = 1 - Math.pow(1 - progress, 4);
        current = Math.round(eased * target);

        if (unitSpan) {
          el.innerHTML = current + unitHTML;
        } else {
          el.textContent = current + suffix;
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      el.textContent = '0' + suffix;
      requestAnimationFrame(step);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.3 });

  kpiValues.forEach(el => counterObserver.observe(el));
})();
