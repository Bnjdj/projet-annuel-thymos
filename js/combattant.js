/* ═══════════════════════════════════════════
   THYMOS — COMBATTANT JS
════════════════════════════════════════════ */

// ─── TABS ───────────────────────────────────
const tabBtns    = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-tab');

    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    const targetContent = document.getElementById('tab-' + target);
    if (targetContent) targetContent.classList.add('active');
  });
});

// ─── IA COACH FULL CHAT ─────────────────────
// Fonctionnalité non prête : ce chat renvoyait des réponses codées en dur
// (faux chat) qui pouvaient tromper le coach. Le code de génération de
// réponses factices a été retiré. Le champ de saisie et le bouton sont
// rendus désactivés (« Bientôt ») dans combattant.html.
// Aucun gestionnaire d'envoi n'est branché tant que l'IA réelle n'est pas livrée.

// ─── PRINT / PDF EXPORT ─────────────────────
// Vrai export : ouvre la boîte d'impression du navigateur.
// L'utilisateur choisit « Enregistrer au format PDF ».
// Le rendu propre est géré par le bloc @media print de combattant.css.
//
// NB : on n'utilise PAS #exportBtn ici — ce bouton est repris par
// page-combattant.js comme bouton « Modifier » (ouverture du modal).
// On injecte donc un bouton dédié et honnête « Imprimer / PDF ».
function setupPrintButton() {
  if (document.getElementById('printPdfBtn')) return; // pas de doublon

  const topbarRight = document.querySelector('.topbar__right');
  if (!topbarRight) return;

  const printBtn = document.createElement('button');
  printBtn.id = 'printPdfBtn';
  printBtn.type = 'button';
  printBtn.className = 'btn btn--ghost btn--sm';
  printBtn.setAttribute('aria-label', 'Imprimer ou exporter la fiche en PDF');
  printBtn.innerHTML =
    '<svg class="icon icon--sm" aria-hidden="true"><use href="#ic-download"/></svg> Imprimer / PDF';

  printBtn.addEventListener('click', () => {
    window.print();
  });

  // Placé en tête de la barre d'actions (avant Retour / Modifier).
  topbarRight.prepend(printBtn);
}

setupPrintButton();

// ─── HANDLE HASH LINK TO TAB ───────────────
const hash = window.location.hash.replace('#', '');
if (hash) {
  const tabMap = { 'ia-fighter': 'ia', 'mental': 'mental', 'physique': 'physique', 'combats': 'combats', 'camp': 'camp' };
  const tabName = tabMap[hash] || hash;
  const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (tabBtn) tabBtn.click();
}

// ─── SCROLL TO TABS ON TAB CHANGE (mobile) ──
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (window.innerWidth < 768) {
      const tabsBar = document.querySelector('.tabs-bar');
      if (tabsBar) {
        tabsBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});
