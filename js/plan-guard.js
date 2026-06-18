/* ═══════════════════════════════════════════
   THYMOS — PLAN GUARD
   Restricts features based on subscription plan
   Plans: decouverte (free trial), guerrier (Pro), champion (Elite)
════════════════════════════════════════════ */

const PLAN_LIMITS = {
  decouverte: {
    label: 'Essai',
    maxFighters: 3,
    planning: true,
    export_ics: true,
    suivi_physique: 'basique',
    suivi_mental: 'basique',
    alertes: false,
    ia_coach: false,
    camps_ia: false,
    sparring_ia: false,
    nutrition: false,
    analyse_video: false,
    analytics: false,
    export_federation: false,
    multi_coachs: false,
    support_prioritaire: false,
  },
  guerrier: {
    label: 'Pro',
    maxFighters: 15,
    planning: true,
    export_ics: true,
    suivi_physique: 'complet',
    suivi_mental: 'complet',
    alertes: true,
    ia_coach: true,
    camps_ia: true,
    sparring_ia: false,
    nutrition: false,
    analyse_video: false,
    analytics: false,
    export_federation: false,
    multi_coachs: false,
    support_prioritaire: false,
  },
  champion: {
    label: 'Elite',
    maxFighters: Infinity,
    planning: true,
    export_ics: true,
    suivi_physique: 'complet',
    suivi_mental: 'complet',
    alertes: true,
    ia_coach: true,
    camps_ia: true,
    sparring_ia: true,
    nutrition: true,
    analyse_video: true,
    analytics: true,
    export_federation: true,
    multi_coachs: true,
    support_prioritaire: true,
  }
};

// Aliases
PLAN_LIMITS.pro = PLAN_LIMITS.guerrier;
PLAN_LIMITS.elite = PLAN_LIMITS.champion;

let _currentPlan = null;
let _currentPlanName = 'decouverte';

async function loadPlan() {
  try {
    const { data: salles } = await window.supabase.from('salles').select('plan').limit(1);
    _currentPlanName = salles?.[0]?.plan || 'decouverte';
    _currentPlan = PLAN_LIMITS[_currentPlanName] || PLAN_LIMITS.decouverte;
  } catch (e) {
    _currentPlan = PLAN_LIMITS.decouverte;
  }
  return _currentPlan;
}

function getPlan() { return _currentPlan || PLAN_LIMITS.decouverte; }
function getPlanName() { return _currentPlanName; }
function getPlanLabel() { return getPlan().label; }

function canAccess(feature) {
  const plan = getPlan();
  return !!plan[feature];
}

function getMaxFighters() {
  return getPlan().maxFighters;
}

// ─── UPGRADE MODAL ──────────────────────────
function showUpgradeModal(feature) {
  const FEATURE_LABELS = {
    alertes: 'Alertes automatiques',
    ia_coach: 'IA Coach',
    camps_ia: 'Camps de preparation IA',
    sparring_ia: 'Sparring intelligent',
    nutrition: 'Nutrition & gestion du poids',
    analyse_video: 'Analyse video IA',
    analytics: 'Analytics avances',
    export_federation: 'Export federations',
    multi_coachs: 'Multi-coachs',
    support_prioritaire: 'Support prioritaire',
  };

  const label = FEATURE_LABELS[feature] || feature;
  const currentLabel = getPlanLabel();

  // Determine which plan is needed
  let needed = 'Pro';
  const proFeatures = ['alertes', 'ia_coach', 'camps_ia'];
  if (!proFeatures.includes(feature)) needed = 'Elite';

  const overlay = document.createElement('div');
  overlay.className = 'upgrade-overlay';
  overlay.innerHTML = `
    <div class="upgrade-modal">
      <div class="upgrade-modal__icon">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#C1121F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <h3 class="upgrade-modal__title">Fonctionnalite ${needed}</h3>
      <p class="upgrade-modal__text">
        <strong>${label}</strong> n'est pas disponible avec votre plan actuel (${currentLabel}).
        Passez au plan <strong>${needed}</strong> pour debloquer cette fonctionnalite.
      </p>
      <div class="upgrade-modal__actions">
        <button class="btn btn--ghost btn--sm" onclick="this.closest('.upgrade-overlay').remove()">Plus tard</button>
        <a href="demo.html" class="btn btn--primary btn--sm">En savoir plus</a>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function showLimitModal(current, max) {
  const overlay = document.createElement('div');
  overlay.className = 'upgrade-overlay';
  overlay.innerHTML = `
    <div class="upgrade-modal">
      <div class="upgrade-modal__icon">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#D4A017" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <h3 class="upgrade-modal__title">Limite atteinte</h3>
      <p class="upgrade-modal__text">
        Vous avez atteint la limite de <strong>${max} combattants</strong> pour votre plan ${getPlanLabel()}.
        Passez au plan superieur pour ajouter plus de combattants.
      </p>
      <div class="upgrade-modal__actions">
        <button class="btn btn--ghost btn--sm" onclick="this.closest('.upgrade-overlay').remove()">Compris</button>
        <a href="demo.html" class="btn btn--primary btn--sm">En savoir plus</a>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ─── APPLY RESTRICTIONS TO SIDEBAR ──────────
async function applyPlanRestrictions() {
  await loadPlan();
  const plan = getPlan();

  // Lock sidebar items
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href') || '';
    let locked = false;

    if (href.includes('alertes') && !plan.alertes) locked = true;
    if (href.includes('sparring') && !plan.sparring_ia) locked = true;

    if (locked) {
      item.classList.add('nav-item--locked');
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const feature = href.includes('alertes') ? 'alertes' : 'sparring_ia';
        showUpgradeModal(feature);
      });
    }
  });

  // Add plan badge in sidebar
  const planEl = document.querySelector('.salle-plan');
  if (planEl) planEl.textContent = 'Plan ' + getPlanLabel();
}

// ─── TRIAL EXPIRATION CHECK ─────────────────
// Phase de démonstration : accès gratuit, paiement en ligne non ouvert.
// Aucune bannière d'expiration d'essai ni d'incitation à payer (impasse en démo).
// À réactiver lorsque les abonnements seront commercialisés.
async function checkTrialExpiration() {
  return;
}

// Auto-apply on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { applyPlanRestrictions(); checkTrialExpiration(); });
} else {
  applyPlanRestrictions();
  checkTrialExpiration();
}
