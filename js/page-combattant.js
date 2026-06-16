/* ════════════════════════════════════════════
   THYMOS — PAGE COMBATTANT DETAIL (dynamic)
   Loads fighter by ?id= URL param from Supabase
════════════════════════════════════════════ */

(async function loadFighterPage() {
  const params = new URLSearchParams(window.location.search);
  const fighterId = params.get('id');

  if (!fighterId) {
    document.querySelector('.dashboard-content').innerHTML = `
      <div style="text-align:center;padding:4rem 2rem;">
        <h2 style="font-family:var(--font-display);font-size:1.2rem;margin-bottom:1rem;">Aucun combattant selectionne</h2>
        <a href="combattants.html" class="btn btn--primary">Voir tous les combattants</a>
      </div>`;
    return;
  }

  const fighter = await getCombattant(fighterId);
  if (!fighter) {
    document.querySelector('.dashboard-content').innerHTML = `
      <div style="text-align:center;padding:4rem 2rem;">
        <h2 style="font-family:var(--font-display);font-size:1.2rem;margin-bottom:1rem;">Combattant introuvable</h2>
        <a href="combattants.html" class="btn btn--primary">Retour a la liste</a>
      </div>`;
    return;
  }

  const f = fighter;
  const name = escapeHtml(getFullName(f));
  const initials = escapeHtml(getInitials(f.first_name, f.last_name));
  const statusLabel = escapeHtml(STATUS_LABELS[f.status] || f.status);
  const styleLabel = escapeHtml(STYLE_LABELS[f.style] || f.style || '');

  // Expose fighter data for IA Coach
  window._currentFighter = {
    name: name,
    first_name: f.first_name,
    weight: f.current_weight,
    category: f.weight_category,
    style: f.style,
    wins: f.record_wins || 0,
    losses: f.record_losses || 0,
    physical_score: f.score_physique,
    mental_score: f.score_mental,
    status: f.status,
    notes: f.notes
  };

  // Update page title
  document.title = `${name} — THYMOS Platform`;

  // Update breadcrumb
  const breadcrumbPage = document.querySelector('.breadcrumb-page');
  if (breadcrumbPage) breadcrumbPage.textContent = name;

  // ─── FIGHTER HEADER ───────────────────────
  const header = document.getElementById('fighterHeader');
  if (header) {
    const phys = f.score_physique || 0;
    const mental = f.score_mental || 0;
    const prep = Math.round((phys + mental) / 2);
    const weight = f.current_weight || '—';

    const safeColor = escapeHtml(f.avatar_color || '#6b0000');
    header.innerHTML = `
      <div class="fighter-header__identity">
        <div class="fighter-big-avatar" style="background:${safeColor};border-color:${safeColor}50;color:#fff;">${initials}</div>
        <div class="fighter-header__info">
          <div class="fighter-header__meta">
            <span class="status-badge">
              <span class="status-dot status-dot--${escapeHtml(f.status)}"></span>
              ${statusLabel}
            </span>
            <span class="fighter-header__record">
              <span class="record-w">${parseInt(f.record_wins) || 0}V</span>
              <span class="record-sep">—</span>
              <span class="record-l">${parseInt(f.record_losses) || 0}D</span>
            </span>
          </div>
          <h1 class="fighter-header__name">${name}</h1>
          <div class="fighter-header__details">
            ${f.age ? '<span>' + escapeHtml(f.age) + ' ans</span><span class="detail-sep">·</span>' : ''}
            <span>${styleLabel}</span>
            <span class="detail-sep">·</span>
            <span>${escapeHtml(f.weight_category || '—')}</span>
            ${f.city ? '<span class="detail-sep">·</span><span>' + escapeHtml(f.city) + '</span>' : ''}
          </div>
        </div>
      </div>
      <div class="fighter-header__scores">
        ${renderRing('Physique', phys, 'ic-activity', phys >= 70 ? '#4a9e5c' : '#D4A017')}
        ${renderRing('Mental', mental, 'ic-brain', mental >= 70 ? '#4a9e5c' : mental >= 50 ? '#D4A017' : 'var(--red)')}
        ${renderRing('Preparation', prep, 'ic-target', prep >= 70 ? '#4a9e5c' : '#D4A017')}
        ${renderRingWeight('Poids', weight, f.weight_category)}
      </div>`;
  }

  // ─── TAB: PHYSIQUE ─────────────────────────
  const tabPhys = document.getElementById('tab-physique');
  if (tabPhys) {
    const scores = [
      { label: 'Cardio-vasculaire', icon: 'ic-heart', value: f.score_cardio || 0 },
      { label: 'Force explosive', icon: 'ic-shield', value: f.score_force || 0 },
      { label: 'Vitesse / Reactivite', icon: 'ic-zap', value: f.score_vitesse || 0 },
      { label: 'Endurance combat', icon: 'ic-activity', value: f.score_endurance || 0 },
      { label: 'Recuperation', icon: 'ic-trending-up', value: f.score_recuperation || 0 },
      { label: 'Flexibilite', icon: 'ic-shield', value: f.score_flexibilite || 0 },
    ];

    tabPhys.innerHTML = `
      <div class="tab-grid-3">
        <div class="panel col-span-2">
          <div class="panel__header">
            <div class="panel__title">Scores physiques detailles</div>
            <button class="btn btn--ghost btn--sm" onclick="openEditScores('physique')">Modifier</button>
          </div>
          <div class="panel__body p-lg">
            <div class="score-rows">
              ${scores.map(s => renderScoreRow(s.label, s.icon, s.value)).join('')}
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel__header">
            <div class="panel__title"><svg class="icon icon--sm" aria-hidden="true"><use href="#ic-droplet"/></svg> Poids & Nutrition</div>
          </div>
          <div class="panel__body p-lg">
            <div class="weight-display">
              <div class="weight-current">
                <span class="weight-val">${f.current_weight || '—'}</span>
                <span class="weight-unit">kg</span>
              </div>
              <div class="weight-target">Objectif : <strong>${f.weight_category || '—'}</strong></div>
            </div>
            <div class="nutrition-items" style="margin-top:1rem;">
              <div class="nutrition-item"><span class="nutr-label">Calories / jour</span><span class="nutr-val">${f.calories_jour ? f.calories_jour + ' kcal' : '—'}</span></div>
              <div class="nutrition-item"><span class="nutr-label">Proteines</span><span class="nutr-val">${f.proteines_jour ? f.proteines_jour + ' g / jour' : '—'}</span></div>
              <div class="nutrition-item"><span class="nutr-label">Hydratation</span><span class="nutr-val">${f.hydratation ? f.hydratation + ' L / jour' : '—'}</span></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ───── TAB: MENTAL ──────────────────────────
  const tabMental = document.getElementById('tab-mental');
  if (tabMental) {
    const mental = f.score_mental || 0;
    const scores = [
      { label: 'Confiance en soi', icon: 'ic-shield', value: f.score_confiance || 0 },
      { label: 'Gestion du stress', icon: 'ic-heart', value: f.score_stress || 0 },
      { label: 'Focus / Concentration', icon: 'ic-target', value: f.score_focus || 0 },
      { label: 'Motivation', icon: 'ic-zap', value: f.score_motivation || 0 },
      { label: 'Resilience', icon: 'ic-trending-up', value: f.score_resilience || 0 },
      { label: 'Controle emotionnel', icon: 'ic-activity', value: f.score_controle_emotionnel || 0 },
    ];

    const hasLow = scores.some(s => s.value < 60);

    tabMental.innerHTML = `
      <div class="tab-grid-3">
        <div class="panel col-span-2">
          <div class="panel__header">
            <div class="panel__title">Profil psychologique</div>
            <div style="display:flex;gap:0.5rem;">
              <button class="btn btn--primary btn--sm" onclick="openWeeklyQuestionnaire()">+ Questionnaire hebdo</button>
              <button class="btn btn--ghost btn--sm" onclick="openEditScores('mental')">Modifier</button>
            </div>
          </div>
          <div class="panel__body p-lg">
            ${hasLow ? '<div class="psych-alert"><svg class="icon icon--sm" aria-hidden="true"><use href="#ic-alert"/></svg><span>Certains scores mentaux sont en dessous de 60%. Suivi renforce recommande.</span></div>' : ''}
            <div class="score-rows" style="margin-top:${hasLow ? '1.5rem' : '0'}">
              ${scores.map(s => renderScoreRow(s.label, s.icon, s.value)).join('')}
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel__header">
            <div class="panel__title">Analyse IA · Profil</div>
          </div>
          <div class="panel__body p-lg">
            <div class="ia-note">
              <div class="ia-note__header">
                <svg class="icon icon--sm" aria-hidden="true"><use href="#ic-cpu"/></svg>
                <span>Analyse automatique</span>
              </div>
              <p>Score mental global a <strong>${mental}%</strong>. ${mental < 60 ? 'Attention requise — un suivi renforce est recommande.' : mental < 75 ? 'Score correct mais a surveiller.' : 'Bon etat mental general.'}</p>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ─── TAB: COMBATS ──────────────────────────
  const tabCombats = document.getElementById('tab-combats');
  if (tabCombats) {
    const salle = await getCurrentSalle();
    const allCombats = salle ? await getCombats(salle.id) : [];
    const fighterCombats = allCombats.filter(c => c.combattant_id === fighterId && c.result);

    if (fighterCombats.length === 0) {
      tabCombats.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--subtle);">Aucun combat enregistre pour ce combattant.<br><a href="combats.html" class="btn btn--ghost btn--sm" style="margin-top:1rem;">Programmer un combat</a></div>`;
    } else {
      tabCombats.innerHTML = `<div class="fights-history">${fighterCombats.map(c => {
        const resClass = c.result === 'win' ? 'result--win' : c.result === 'loss' ? 'result--loss' : 'result--draw';
        const resLetter = c.result === 'win' ? 'V' : c.result === 'loss' ? 'D' : 'N';
        return `
          <div class="fight-card">
            <div class="fight-card__header">
              <div class="fight-card__result ${resClass}">${resLetter}</div>
              <div class="fight-card__info">
                <div class="fight-card__name">vs ${escapeHtml(c.opponent_name)}</div>
                <div class="fight-card__meta">${escapeHtml(c.method || '')} ${c.round ? '· R' + escapeHtml(c.round) : ''} ${c.time ? '· ' + escapeHtml(c.time) : ''} — ${escapeHtml(c.event_name || '')} · ${formatDate(c.fight_date)}</div>
              </div>
              <div class="fight-card__tags">
                <span class="fight-tag">${escapeHtml(f.weight_category || '')}</span>
              </div>
            </div>
          </div>`;
      }).join('')}</div>`;
    }
  }

  // ─── TAB: BLESSURES ───────────────────────
  // CRUD réel des blessures (table `blessures`). `salle_id` provient du
  // combattant chargé (cohérent avec le questionnaire hebdo).
  if (typeof renderBlessuresTab === 'function') {
    renderBlessuresTab(fighterId, f.salle_id);
  }

  // ─── TAB: CAMP ────────────────────────────
  // CRUD réel des camps de préparation (tables `camps` + `camp_weeks`).
  if (typeof renderCampsTab === 'function') {
    renderCampsTab(fighterId, f.salle_id);
  }

  // ─── TAB: IA COACH ────────────────────────
  // Fonctionnalité non prête : le chat IA n'est pas livré (réponses non
  // fiables / codées en dur). On n'initialise donc plus de chat ici. Le
  // contenu « Bientôt » (bannière + champ désactivé) est rendu statiquement
  // dans combattant.html et ne doit pas être écrasé.

  // ─── EDIT BUTTON IN TOPBAR ────────────────
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.textContent = 'Modifier';
    exportBtn.onclick = () => {
      openFighterModal(f, (updated) => {
        window.location.reload();
      });
    };
  }

  // ─── RAPPORT PRÉ-COMBAT (TOPBAR) ──────────
  // Agrège les données réelles du combattant (combats à venir, forme,
  // alertes, blessures, camp) et génère une synthèse imprimable autonome
  // (sans IA — agrégation + règles simples). `f`/`fighterId` sont en scope.
  const prefightBtn = document.getElementById('prefightReportBtn');
  if (prefightBtn) {
    prefightBtn.addEventListener('click', () => {
      generatePrefightReport(f, fighterId);
    });
  }

  // ─── PROGRESSION CHART ────────────────────
  const questionnaires = await getQuestionnaires(fighterId);
  if (questionnaires && questionnaires.length > 1) {
    renderProgressChart(questionnaires);
  }
})();

// ─── RENDER HELPERS ───────────────────────────
function renderRing(label, value, icon, color) {
  const valClass = value < 60 ? 'warn' : '';
  return `
    <div class="header-score">
      <div class="header-score__label"><svg class="icon icon--sm" aria-hidden="true"><use href="#${icon}"/></svg>${label}</div>
      <div class="header-score__ring">
        <svg viewBox="0 0 36 36" class="ring-svg">
          <circle cx="18" cy="18" r="15.9" class="ring-bg"/>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="${color}" stroke-width="2.5" stroke-dasharray="${value} 100" stroke-linecap="round" style="transform:rotate(-90deg);transform-origin:center;"/>
        </svg>
        <span class="ring-value ${valClass}">${value}%</span>
      </div>
    </div>`;
}

function renderRingWeight(label, weight, category) {
  return `
    <div class="header-score">
      <div class="header-score__label"><svg class="icon icon--sm" aria-hidden="true"><use href="#ic-droplet"/></svg>${label}</div>
      <div class="header-score__ring">
        <svg viewBox="0 0 36 36" class="ring-svg">
          <circle cx="18" cy="18" r="15.9" class="ring-bg"/>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#D4A017" stroke-width="2.5" stroke-dasharray="60 100" stroke-linecap="round" style="transform:rotate(-90deg);transform-origin:center;"/>
        </svg>
        <span class="ring-value">${weight}<small>kg</small></span>
      </div>
    </div>`;
}

function renderScoreRow(label, icon, value) {
  const fillClass = value >= 80 ? 'bar-fill--good' : value < 60 ? 'bar-fill--danger' : '';
  const valClass = value >= 80 ? 'ok' : value < 60 ? 'warn' : '';
  return `
    <div class="score-row">
      <div class="score-row__label"><svg class="icon icon--sm" aria-hidden="true"><use href="#${icon}"/></svg>${label}</div>
      <div class="score-row__bar"><div class="bar-track"><div class="bar-fill ${fillClass}" style="width:${value}%"></div></div></div>
      <span class="score-row__value ${valClass}">${value}%</span>
    </div>`;
}

// ─── EDIT SCORES MODAL ──────────────────────
function openEditScores(type) {
  const params = new URLSearchParams(window.location.search);
  const fighterId = params.get('id');
  if (!fighterId) return;

  const physFields = [
    { key: 'score_physique', label: 'Score physique global' },
    { key: 'score_cardio', label: 'Cardio-vasculaire' },
    { key: 'score_force', label: 'Force explosive' },
    { key: 'score_vitesse', label: 'Vitesse / Reactivite' },
    { key: 'score_endurance', label: 'Endurance combat' },
    { key: 'score_recuperation', label: 'Recuperation' },
    { key: 'score_flexibilite', label: 'Flexibilite' },
  ];
  const mentalFields = [
    { key: 'score_mental', label: 'Score mental global' },
    { key: 'score_confiance', label: 'Confiance en soi' },
    { key: 'score_stress', label: 'Gestion du stress' },
    { key: 'score_focus', label: 'Focus / Concentration' },
    { key: 'score_motivation', label: 'Motivation' },
    { key: 'score_resilience', label: 'Resilience' },
    { key: 'score_controle_emotionnel', label: 'Controle emotionnel' },
  ];

  const fields = type === 'physique' ? physFields : mentalFields;

  // Get current fighter data from page
  getCombattant(fighterId).then(fighter => {
    if (!fighter) return;

    const inputs = fields.map(f =>
      `<div class="modal-field" style="display:flex;flex-direction:row;align-items:center;gap:0.75rem;">
        <label style="flex:1;min-width:140px;">${f.label}</label>
        <input type="range" min="0" max="100" value="${fighter[f.key] || 70}" data-key="${f.key}" class="score-range" style="flex:1;" />
        <span class="score-range-val" style="min-width:36px;text-align:right;font-weight:600;font-size:0.82rem;">${fighter[f.key] || 70}%</span>
      </div>`
    ).join('');

    const overlay = document.createElement('div');
    overlay.className = 'combat-modal-overlay';
    overlay.innerHTML = `
      <div class="combat-modal" style="max-width:520px;">
        <div class="modal-header">
          <h3 class="modal-title">Modifier les scores ${type === 'physique' ? 'physiques' : 'mentaux'}</h3>
          <button class="modal-close" onclick="this.closest('.combat-modal-overlay').remove()">&times;</button>
        </div>
        <div class="modal-form" style="padding:1.25rem;">
          ${inputs}
          <div class="modal-actions" style="margin-top:1rem;">
            <button class="btn btn--ghost" onclick="this.closest('.combat-modal-overlay').remove()">Annuler</button>
            <button class="btn btn--primary" id="saveScoresBtn"><span class="btn-text">Enregistrer</span></button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // Live update values
    overlay.querySelectorAll('.score-range').forEach(range => {
      const valSpan = range.nextElementSibling;
      range.addEventListener('input', () => { valSpan.textContent = range.value + '%'; });
    });

    // Save
    document.getElementById('saveScoresBtn').addEventListener('click', async () => {
      const btn = document.getElementById('saveScoresBtn');
      btn.classList.add('loading');

      const updates = {};
      overlay.querySelectorAll('.score-range').forEach(range => {
        updates[range.dataset.key] = parseInt(range.value);
      });

      const result = await updateCombattant(fighterId, updates);
      btn.classList.remove('loading');

      if (result.error) {
        toast('Erreur: ' + (result.error.message || 'Impossible de sauvegarder'), 'error');
        return;
      }

      // Check for auto-alerts
      const salle = await getCurrentSalle();
      const updatedFighter = await getCombattant(fighterId);
      if (salle && updatedFighter) {
        const alertCount = await checkAndCreateAlerts(salle.id, updatedFighter);
        if (alertCount > 0) {
          toast('Scores mis a jour — ' + alertCount + ' alerte(s) generee(s)', 'warning');
        } else {
          toast('Scores mis a jour', 'success');
        }
      } else {
        toast('Scores mis a jour', 'success');
      }

      overlay.remove();
      location.reload();
    });
  });
}

// ─── PROGRESSION CHART (Chart.js) ──────────────
function renderProgressChart(questionnaires) {
  const panel = document.getElementById('progressPanel');
  const canvas = document.getElementById('progressChart');
  if (!panel || !canvas || typeof Chart === 'undefined') return;

  // Sort by date ascending
  const sorted = [...questionnaires].sort((a, b) =>
    new Date(a.completed_at) - new Date(b.completed_at)
  );

  const labels = sorted.map(q => {
    const d = new Date(q.completed_at);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  });
  // Questionnaires stockent les ressentis bruts (feeling_*, 1→10). On dérive
  // les scores physique/mental (0→100) avec le même mapping que la soumission,
  // tout en gardant un fallback sur d'éventuels score_* déjà présents.
  const physData = sorted.map(q =>
    q.score_physique ?? q.physical_score ??
    (q.feeling_physique != null ? q.feeling_physique * 10 : null)
  );
  const mentalData = sorted.map(q =>
    q.score_mental ?? q.mental_score ?? mentalFromFeelings(q)
  );

  panel.style.display = '';

  new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Physique',
          data: physData,
          borderColor: '#C1121F',
          backgroundColor: 'rgba(193,18,31,0.1)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: '#C1121F',
          fill: true
        },
        {
          label: 'Mental',
          data: mentalData,
          borderColor: '#B8960C',
          backgroundColor: 'rgba(184,150,12,0.1)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: '#B8960C',
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#A0A0A0', font: { size: 12 } }
        }
      },
      scales: {
        x: {
          ticks: { color: '#A0A0A0', font: { size: 11 } },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          min: 0,
          max: 100,
          ticks: { color: '#A0A0A0', font: { size: 11 }, stepSize: 20 },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
}

// ─── MENTAL SCORE FROM FEELINGS ─────────────
// Mapping partagé (chart + soumission questionnaire) : confiance, motivation
// et appréhensions inversées (11 - x) → moyenne → 0..100. Renvoie null si on
// n'a pas les trois ressentis nécessaires.
function mentalFromFeelings(q) {
  if (!q) return null;
  const c = q.feeling_confiance, m = q.feeling_motivation, a = q.feeling_apprehensions;
  if (c == null || m == null || a == null) return null;
  return Math.round(((c + m + (11 - a)) / 3) * 10);
}

// ─── WEEKLY QUESTIONNAIRE MODAL ─────────────
// Injecte (une seule fois) un modal accessible pour saisir le questionnaire
// hebdomadaire du combattant. Réutilise les classes de modal-fighter.js
// (.modal-overlay / .modal-box / .modal-field / .modal-actions…) pour rester
// cohérent visuellement. Tout contenu dynamique passe par escapeHtml.
(function () {
  const QUESTIONS = [
    { key: 'physique',      label: 'Ressenti physique',  feeling: 'feeling_physique',      text: 'text_physique',      hint: 'Forme, énergie, douleurs éventuelles…' },
    { key: 'confiance',     label: 'Confiance',          feeling: 'feeling_confiance',     text: 'text_confiance',     hint: 'Confiance en soi, sentiment de progression…' },
    { key: 'apprehensions', label: 'Appréhensions',      feeling: 'feeling_apprehensions', text: 'text_apprehensions', hint: '1 = aucune appréhension · 10 = très fortes appréhensions' },
    { key: 'motivation',    label: 'Motivation',         feeling: 'feeling_motivation',    text: 'text_motivation',    hint: 'Envie de s\'entraîner, objectifs…' },
  ];

  let modal, lastFocused;

  function buildModal() {
    if (document.getElementById('weeklyQuestionnaireModal')) return;

    const esc = (s) => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s));

    const rows = QUESTIONS.map(q => `
      <div class="wq-block">
        <div class="wq-block__head">
          <label class="wq-label" for="wq_${esc(q.key)}_range">${esc(q.label)}</label>
          <span class="wq-value" id="wq_${esc(q.key)}_val" aria-hidden="true">5</span>
        </div>
        <input type="range" min="1" max="10" step="1" value="5"
               id="wq_${esc(q.key)}_range" class="wq-range"
               data-feeling="${esc(q.feeling)}"
               aria-label="${esc(q.label)} de 1 à 10" />
        <p class="wq-hint">${esc(q.hint)}</p>
        <textarea id="wq_${esc(q.key)}_text" class="wq-text" rows="2"
                  data-text="${esc(q.text)}"
                  placeholder="Commentaire (optionnel)"></textarea>
      </div>`).join('');

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal-overlay" id="weeklyQuestionnaireModal" role="dialog" aria-modal="true" aria-labelledby="wqTitle">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title" id="wqTitle">Questionnaire hebdomadaire</h3>
            <button class="modal-close" id="wqClose" type="button" aria-label="Fermer">&times;</button>
          </div>
          <form class="modal-form" id="weeklyQuestionnaireForm">
            <p style="font-size:0.78rem;color:var(--subtle);margin:0;">Notez chaque dimension de 1 à 10. Les commentaires sont optionnels.</p>
            ${rows}
            <div class="modal-error" id="wqError"></div>
            <div class="modal-actions">
              <button type="button" class="btn btn--ghost" id="wqCancel">Annuler</button>
              <button type="submit" class="btn btn--primary" id="wqSubmit"><span class="btn-text">Enregistrer</span></button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.appendChild(wrapper.firstElementChild);

    // Styles spécifiques (curseurs + valeur). Le reste hérite de modal-fighter.
    const style = document.createElement('style');
    style.textContent = `
      .wq-block { display:flex; flex-direction:column; gap:0.4rem; }
      .wq-block__head { display:flex; align-items:center; justify-content:space-between; }
      .wq-label {
        font-family: var(--font-display); font-size: 0.62rem; letter-spacing: 0.1em;
        text-transform: uppercase; color: var(--muted);
      }
      .wq-value {
        min-width: 1.9rem; text-align:center; font-weight:600; font-size:0.82rem;
        color: var(--white); background: var(--bg); border:1px solid var(--border);
        border-radius: var(--r); padding: 0.1rem 0.35rem;
      }
      .wq-range { width:100%; accent-color: var(--red); cursor:pointer; }
      .wq-hint { font-size:0.68rem; color: var(--subtle); margin:0; }
      .wq-text { resize: vertical; }
    `;
    document.head.appendChild(style);

    modal = document.getElementById('weeklyQuestionnaireModal');

    // Valeur affichée en direct.
    modal.querySelectorAll('.wq-range').forEach(range => {
      const val = document.getElementById(range.id.replace('_range', '_val'));
      range.addEventListener('input', () => { if (val) val.textContent = range.value; });
    });

    document.getElementById('wqClose').addEventListener('click', closeWeeklyQuestionnaire);
    document.getElementById('wqCancel').addEventListener('click', closeWeeklyQuestionnaire);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeWeeklyQuestionnaire(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeWeeklyQuestionnaire();
    });

    document.getElementById('weeklyQuestionnaireForm').addEventListener('submit', onSubmit);
  }

  function closeWeeklyQuestionnaire() {
    if (!modal) return;
    modal.classList.remove('open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function openWeeklyQuestionnaire() {
    buildModal();
    const form = document.getElementById('weeklyQuestionnaireForm');
    const err = document.getElementById('wqError');
    if (form) form.reset();
    if (err) err.classList.remove('visible');
    // reset() ne réinitialise pas toujours l'affichage des curseurs → on force.
    modal.querySelectorAll('.wq-range').forEach(range => {
      range.value = 5;
      const val = document.getElementById(range.id.replace('_range', '_val'));
      if (val) val.textContent = '5';
    });

    lastFocused = document.activeElement;
    modal.classList.add('open');
    setTimeout(() => {
      const first = document.getElementById('wq_physique_range');
      if (first) first.focus();
    }, 50);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const fighterId = params.get('id');
    const err = document.getElementById('wqError');
    const submitBtn = document.getElementById('wqSubmit');
    if (err) err.classList.remove('visible');

    if (!fighterId) {
      if (err) { err.textContent = 'Combattant introuvable.'; err.classList.add('visible'); }
      return;
    }

    // Récupère les ressentis (1→10) et textes optionnels.
    const feelings = {};
    modal.querySelectorAll('.wq-range').forEach(r => {
      feelings[r.dataset.feeling] = parseInt(r.value, 10);
    });
    const texts = {};
    modal.querySelectorAll('.wq-text').forEach(t => {
      const v = t.value.trim();
      texts[t.dataset.text] = v || null;
    });

    submitBtn.classList.add('loading');

    try {
      const fighter = await getCombattant(fighterId);
      if (!fighter) throw new Error('Combattant introuvable.');
      const salleId = fighter.salle_id;
      if (!salleId) throw new Error('Salle du combattant introuvable.');

      // a. Crée le questionnaire (salle_id ajouté par l'API).
      const qResult = await createQuestionnaire(salleId, {
        combattant_id: fighterId,
        feeling_physique: feelings.feeling_physique,
        feeling_confiance: feelings.feeling_confiance,
        feeling_apprehensions: feelings.feeling_apprehensions,
        feeling_motivation: feelings.feeling_motivation,
        text_physique: texts.text_physique,
        text_confiance: texts.text_confiance,
        text_apprehensions: texts.text_apprehensions,
        text_motivation: texts.text_motivation,
      });
      if (qResult && qResult.error) throw new Error(qResult.error.message || 'Échec de l\'enregistrement du questionnaire.');

      // b. Met à jour les scores du combattant (1→10 → 0→100).
      const scoreMental = Math.round(
        ((feelings.feeling_confiance + feelings.feeling_motivation + (11 - feelings.feeling_apprehensions)) / 3) * 10
      );
      const scoreUpdates = {
        score_physique: feelings.feeling_physique * 10,
        score_confiance: feelings.feeling_confiance * 10,
        score_motivation: feelings.feeling_motivation * 10,
        // « Gestion du stress » suit la convention « plus haut = mieux ».
        // feeling_apprehensions est saisi 1 (aucune) → 10 (très fortes), donc on
        // inverse (11 - x) comme dans la dérivation de score_mental ci-dessus.
        score_stress: (11 - feelings.feeling_apprehensions) * 10,
        score_mental: scoreMental,
      };
      const uResult = await updateCombattant(fighterId, scoreUpdates);
      if (uResult && uResult.error) throw new Error(uResult.error.message || 'Échec de la mise à jour des scores.');

      // c. Génère les alertes auto si scores bas (API : salleId + objet combattant à jour).
      const updatedFighter = (uResult && uResult.data) ? uResult.data : { ...fighter, ...scoreUpdates };
      let alertCount = 0;
      try {
        alertCount = await checkAndCreateAlerts(salleId, updatedFighter);
      } catch (alertErr) {
        console.warn('checkAndCreateAlerts:', alertErr);
      }

      // d. Toast + fermeture + rechargement (scores ET graphe se rafraîchissent).
      if (typeof toast !== 'undefined') {
        if (alertCount > 0) {
          toast('Questionnaire enregistré — ' + alertCount + ' alerte(s) générée(s)', 'warning');
        } else {
          toast('Questionnaire enregistré', 'success');
        }
      }
      closeWeeklyQuestionnaire();
      location.reload();
    } catch (error) {
      console.warn('weeklyQuestionnaire submit:', error);
      if (err) {
        err.textContent = 'Erreur : ' + (error.message || 'Impossible d\'enregistrer le questionnaire.');
        err.classList.add('visible');
      }
      if (typeof toast !== 'undefined') {
        toast('Erreur : ' + (error.message || 'Impossible d\'enregistrer le questionnaire.'), 'error');
      }
    } finally {
      submitBtn.classList.remove('loading');
    }
  }

  // Expose le déclencheur (utilisé par le bouton de l'onglet Mental).
  window.openWeeklyQuestionnaire = openWeeklyQuestionnaire;
  window.closeWeeklyQuestionnaire = closeWeeklyQuestionnaire;
})();

// ─── IA CHAT — handled by ia-coach.js (Ollama) ──

/* ════════════════════════════════════════════
   BLESSURES & CAMPS — CRUD réels (fiche combattant)
   Réutilise les classes existantes (.panel, .fight-card,
   .modal-overlay/.modal-box…) et échappe tout contenu dynamique.
════════════════════════════════════════════ */

// ─── HELPERS PARTAGÉS ───────────────────────
function _esc(s) {
  return (typeof escapeHtml === 'function') ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s);
}

function _fmtDate(dateStr) {
  if (!dateStr) return '—';
  if (typeof formatDate === 'function') {
    const out = formatDate(dateStr);
    return out || '—';
  }
  return _esc(dateStr);
}

// Styles spécifiques (badges gravité/statut, pastilles de semaines, cartes).
// Injectés une seule fois ; le reste hérite des classes du dashboard.
(function injectInjuryCampStyles() {
  if (document.getElementById('blessuresCampsStyles')) return;
  const style = document.createElement('style');
  style.id = 'blessuresCampsStyles';
  style.textContent = `
    .bc-list { display:flex; flex-direction:column; gap:1rem; }
    .bc-empty {
      text-align:center; padding:3rem 1.5rem; color:var(--subtle);
      background:var(--surface); border:1px dashed var(--border);
      border-radius:var(--r-lg); font-size:0.84rem; line-height:1.5;
    }
    .bc-empty svg { opacity:0.5; margin-bottom:0.6rem; }
    .bc-toolbar { display:flex; justify-content:flex-end; margin-bottom:1.1rem; }
    .bc-card {
      background:var(--surface); border:1px solid var(--border);
      border-radius:var(--r-lg); overflow:hidden;
    }
    .bc-card__head {
      display:flex; align-items:center; gap:1rem;
      padding:1rem 1.25rem; border-bottom:1px solid var(--border); flex-wrap:wrap;
    }
    .bc-card__title { flex:1; min-width:0; }
    .bc-card__title strong { font-size:0.92rem; }
    .bc-card__meta { font-size:0.72rem; color:var(--muted); margin-top:0.2rem; }
    .bc-card__actions { display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center; }
    .bc-card__body { padding:1rem 1.25rem; }
    .bc-badge {
      font-size:0.62rem; font-weight:600; letter-spacing:0.04em; text-transform:uppercase;
      padding:0.18rem 0.55rem; border-radius:3px; white-space:nowrap;
      display:inline-flex; align-items:center; gap:0.3rem;
      border:1px solid transparent;
    }
    .bc-badge--legere  { background:rgba(184,150,12,0.15);  color:#D4A017; border-color:rgba(184,150,12,0.35); }
    .bc-badge--moderee { background:rgba(230,122,23,0.15);  color:#E67A17; border-color:rgba(230,122,23,0.35); }
    .bc-badge--severe  { background:var(--red-dim);         color:var(--red); border-color:var(--red-border); }
    .bc-badge--encours { background:rgba(230,122,23,0.12);  color:#E67A17; border-color:rgba(230,122,23,0.3); }
    .bc-badge--retabli { background:rgba(74,158,92,0.15);   color:#4a9e5c; border-color:rgba(74,158,92,0.3); }
    .bc-badge--active    { background:rgba(74,158,92,0.15); color:#4a9e5c; border-color:rgba(74,158,92,0.3); }
    .bc-badge--completed { background:rgba(255,255,255,0.06); color:var(--muted); border-color:var(--border); }
    .bc-badge--cancelled { background:var(--red-dim); color:var(--red); border-color:var(--red-border); }
    .bc-notes { font-size:0.78rem; color:var(--muted); line-height:1.5; margin:0.5rem 0 0; white-space:pre-wrap; }
    .bc-weeks { display:flex; flex-direction:column; gap:0.55rem; }
    .bc-week {
      display:flex; align-items:center; gap:0.7rem;
      padding:0.55rem 0.7rem; background:var(--bg);
      border:1px solid var(--border); border-radius:var(--r);
    }
    .bc-week__num {
      font-family:var(--font-display); font-size:0.7rem; font-weight:700;
      min-width:2.2rem; text-align:center; color:var(--muted);
    }
    .bc-week__title { flex:1; min-width:0; font-size:0.82rem; }
    .bc-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
    .bc-dot--pending { background:var(--subtle); }
    .bc-dot--current { background:#D4A017; box-shadow:0 0 6px rgba(212,160,23,0.5); }
    .bc-dot--done    { background:#4a9e5c; }
    .bc-dot--alert   { background:var(--red); box-shadow:0 0 6px rgba(193,18,31,0.5); }
    .bc-week__select {
      background:var(--surface); border:1px solid var(--border); border-radius:var(--r);
      color:var(--white); font-family:var(--font-body); font-size:0.74rem;
      padding:0.3rem 0.5rem; outline:none; cursor:pointer;
    }
    .bc-week__select:focus { border-color:var(--red); }
    .btn--danger-ghost {
      background:var(--red-dim); border:1px solid var(--red-border); color:var(--red);
    }
    .btn--danger-ghost:hover { background:rgba(193,18,31,0.22); }
  `;
  document.head.appendChild(style);
})();

/* ─── BLESSURES ────────────────────────────── */
const GRAVITE_LABELS = { legere: 'Légère', moderee: 'Modérée', severe: 'Sévère' };

async function renderBlessuresTab(fighterId, salleId) {
  const tab = document.getElementById('tab-blessures');
  if (!tab) return;

  const blessures = await getBlessures(fighterId);
  // Déjà trié date_blessure desc par l'API ; on re-trie par sécurité.
  const sorted = [...(blessures || [])].sort(
    (a, b) => new Date(b.date_blessure || 0) - new Date(a.date_blessure || 0)
  );

  const toolbar = `
    <div class="bc-toolbar">
      <button class="btn btn--primary btn--sm" onclick="openBlessureModal()">+ Déclarer une blessure</button>
    </div>`;

  if (sorted.length === 0) {
    tab.innerHTML = toolbar + `
      <div class="bc-empty">
        <svg class="icon icon--md" aria-hidden="true"><use href="#ic-heart"/></svg>
        <div>Aucune blessure déclarée pour ce combattant.</div>
      </div>`;
    return;
  }

  const cards = sorted.map(b => {
    const gravKey = (b.gravite || '').toLowerCase();
    const gravLabel = _esc(GRAVITE_LABELS[gravKey] || b.gravite || '—');
    const gravClass = ['legere', 'moderee', 'severe'].includes(gravKey) ? gravKey : 'legere';
    const enCours = b.statut === 'en_cours';
    const statutClass = enCours ? 'encours' : 'retabli';
    const statutLabel = enCours ? 'En cours' : 'Rétabli';

    const actions = enCours ? `
      <button class="btn btn--ghost btn--sm" onclick="markBlessureRetablie('${_esc(b.id)}')">Marquer rétabli</button>
      <button class="btn btn--sm btn--danger-ghost" onclick="deleteBlessureConfirm('${_esc(b.id)}')">Supprimer</button>
    ` : `
      <button class="btn btn--sm btn--danger-ghost" onclick="deleteBlessureConfirm('${_esc(b.id)}')">Supprimer</button>
    `;

    return `
      <div class="bc-card">
        <div class="bc-card__head">
          <div class="bc-card__title">
            <strong>${_esc(b.type || 'Blessure')}</strong>${b.zone ? ' — ' + _esc(b.zone) : ''}
            <div class="bc-card__meta">
              Déclarée le ${_fmtDate(b.date_blessure)}${b.date_retour_estimee ? ' · Retour estimé : ' + _fmtDate(b.date_retour_estimee) : ''}
            </div>
          </div>
          <span class="bc-badge bc-badge--${gravClass}">${gravLabel}</span>
          <span class="bc-badge bc-badge--${statutClass}">${statutLabel}</span>
          <div class="bc-card__actions">${actions}</div>
        </div>
        ${b.notes ? `<div class="bc-card__body"><p class="bc-notes">${_esc(b.notes)}</p></div>` : ''}
      </div>`;
  }).join('');

  tab.innerHTML = toolbar + `<div class="bc-list">${cards}</div>`;
}

// Synchronise le statut du combattant selon les blessures en cours :
// - au moins une `en_cours`  → status `injured`
// - plus aucune en cours      → repasse `training` UNIQUEMENT si actuellement `injured`
async function syncFighterInjuryStatus(fighterId) {
  try {
    const [blessures, fighter] = await Promise.all([
      getBlessures(fighterId),
      getCombattant(fighterId),
    ]);
    if (!fighter) return;
    const hasOngoing = (blessures || []).some(b => b.statut === 'en_cours');
    if (hasOngoing && fighter.status !== 'injured') {
      await updateCombattant(fighterId, { status: 'injured' });
    } else if (!hasOngoing && fighter.status === 'injured') {
      await updateCombattant(fighterId, { status: 'training' });
    }
  } catch (e) {
    console.warn('syncFighterInjuryStatus:', e);
  }
}

async function markBlessureRetablie(id) {
  const result = await updateBlessure(id, { statut: 'retabli' });
  if (result && result.error) {
    if (typeof toast !== 'undefined') toast('Erreur : impossible de mettre à jour la blessure.', 'error');
    return;
  }
  if (typeof toast !== 'undefined') toast('Blessure marquée comme rétablie', 'success');
  await afterInjuryChange();
}

function deleteBlessureConfirm(id) {
  const msg = 'Supprimer cette blessure ? Cette action est irréversible.';
  if (typeof confirmModal === 'function') {
    confirmModal(msg, async () => {
      const result = await deleteBlessure(id);
      if (result && result.error) {
        if (typeof toast !== 'undefined') toast('Erreur : suppression impossible.', 'error');
        return;
      }
      if (typeof toast !== 'undefined') toast('Blessure supprimée', 'success');
      await afterInjuryChange();
    });
  }
}

// Recharge l'onglet Blessures + resynchronise le statut combattant, puis
// recharge la page pour rafraîchir l'en-tête (badge de statut) de façon cohérente.
async function afterInjuryChange() {
  const params = new URLSearchParams(window.location.search);
  const fighterId = params.get('id');
  if (!fighterId) return;
  await syncFighterInjuryStatus(fighterId);
  location.reload();
}

// ─── MODAL BLESSURE ─────────────────────────
(function () {
  let modal, lastFocused;

  function buildModal() {
    if (document.getElementById('blessureModal')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal-overlay" id="blessureModal" role="dialog" aria-modal="true" aria-labelledby="blessureTitle">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title" id="blessureTitle">Déclarer une blessure</h3>
            <button class="modal-close" id="blessureClose" type="button" aria-label="Fermer">&times;</button>
          </div>
          <form class="modal-form" id="blessureForm">
            <div class="modal-row">
              <div class="modal-field">
                <label for="blType">Type *</label>
                <input type="text" id="blType" required placeholder="Entorse, déchirure…" />
              </div>
              <div class="modal-field">
                <label for="blZone">Zone *</label>
                <input type="text" id="blZone" required placeholder="Genou droit, épaule…" />
              </div>
            </div>
            <div class="modal-row">
              <div class="modal-field">
                <label for="blGravite">Gravité</label>
                <select id="blGravite">
                  <option value="legere">Légère</option>
                  <option value="moderee" selected>Modérée</option>
                  <option value="severe">Sévère</option>
                </select>
              </div>
              <div class="modal-field">
                <label for="blDate">Date de la blessure *</label>
                <input type="date" id="blDate" required />
              </div>
            </div>
            <div class="modal-field">
              <label for="blRetour">Retour estimé (optionnel)</label>
              <input type="date" id="blRetour" />
            </div>
            <div class="modal-field">
              <label for="blNotes">Notes</label>
              <textarea id="blNotes" rows="2" placeholder="Contexte, suivi médical, recommandations…"></textarea>
            </div>
            <div class="modal-error" id="blError"></div>
            <div class="modal-actions">
              <button type="button" class="btn btn--ghost" id="blCancel">Annuler</button>
              <button type="submit" class="btn btn--primary" id="blSubmit"><span class="btn-text">Déclarer</span></button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.appendChild(wrapper.firstElementChild);

    modal = document.getElementById('blessureModal');
    document.getElementById('blessureClose').addEventListener('click', closeBlessureModal);
    document.getElementById('blCancel').addEventListener('click', closeBlessureModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeBlessureModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeBlessureModal();
    });
    document.getElementById('blessureForm').addEventListener('submit', onSubmit);
  }

  function closeBlessureModal() {
    if (!modal) return;
    modal.classList.remove('open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function openBlessureModal() {
    buildModal();
    const form = document.getElementById('blessureForm');
    const err = document.getElementById('blError');
    if (form) form.reset();
    if (err) err.classList.remove('visible');
    // Date du jour par défaut.
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('blDate');
    if (dateInput) dateInput.value = today;
    document.getElementById('blGravite').value = 'moderee';

    lastFocused = document.activeElement;
    modal.classList.add('open');
    setTimeout(() => { const el = document.getElementById('blType'); if (el) el.focus(); }, 50);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const fighterId = params.get('id');
    const err = document.getElementById('blError');
    const submitBtn = document.getElementById('blSubmit');
    if (err) err.classList.remove('visible');

    const type = document.getElementById('blType').value.trim();
    const zone = document.getElementById('blZone').value.trim();
    const gravite = document.getElementById('blGravite').value;
    const dateBlessure = document.getElementById('blDate').value;
    const retour = document.getElementById('blRetour').value || null;
    const notes = document.getElementById('blNotes').value.trim() || null;

    if (!type || !zone || !dateBlessure) {
      if (err) { err.textContent = 'Le type, la zone et la date sont obligatoires.'; err.classList.add('visible'); }
      return;
    }

    submitBtn.classList.add('loading');
    try {
      const fighter = await getCombattant(fighterId);
      if (!fighter) throw new Error('Combattant introuvable.');
      const salleId = fighter.salle_id;
      if (!salleId) throw new Error('Salle du combattant introuvable.');

      const result = await createBlessure(salleId, {
        combattant_id: fighterId,
        type, zone, gravite,
        date_blessure: dateBlessure,
        date_retour_estimee: retour,
        statut: 'en_cours',
        notes,
      });
      if (result && result.error) throw new Error(result.error.message || 'Échec de l\'enregistrement.');

      if (typeof toast !== 'undefined') toast('Blessure déclarée', 'success');
      closeBlessureModal();
      // Resynchronise le statut (→ injured) puis recharge pour tout rafraîchir.
      await syncFighterInjuryStatus(fighterId);
      location.reload();
    } catch (error) {
      console.warn('blessure submit:', error);
      if (err) { err.textContent = 'Erreur : ' + (error.message || 'Impossible d\'enregistrer.'); err.classList.add('visible'); }
      if (typeof toast !== 'undefined') toast('Erreur : ' + (error.message || 'Impossible d\'enregistrer.'), 'error');
    } finally {
      submitBtn.classList.remove('loading');
    }
  }

  window.openBlessureModal = openBlessureModal;
})();

/* ─── CAMPS ─────────────────────────────────── */
const CAMP_STATUS_LABELS = { active: 'Actif', completed: 'Terminé', cancelled: 'Annulé' };
const WEEK_STATUS_LABELS = { pending: 'À venir', current: 'En cours', done: 'Terminée', alert: 'Alerte' };

// Construit le HTML d'une carte camp. `combatLabel` (déjà résolu, non échappé)
// est optionnel ; tout est échappé ici au rendu.
function buildCampCard(camp, combatLabel) {
  const stKey = (camp.status || 'active').toLowerCase();
  const stClass = ['active', 'completed', 'cancelled'].includes(stKey) ? stKey : 'active';
  const stLabel = _esc(CAMP_STATUS_LABELS[stKey] || camp.status || 'Actif');
  const combatInfo = combatLabel ? ' · Combat : ' + _esc(combatLabel) : '';

  const weeks = [...(camp.camp_weeks || [])].sort((a, b) => (a.week_number || 0) - (b.week_number || 0));
  const weeksHtml = weeks.length === 0
    ? `<p class="bc-notes">Aucune semaine définie.</p>`
    : `<div class="bc-weeks">${weeks.map(w => {
        const wsKey = (w.status || 'pending').toLowerCase();
        const wsClass = ['pending', 'current', 'done', 'alert'].includes(wsKey) ? wsKey : 'pending';
        const opts = ['pending', 'current', 'done', 'alert'].map(s =>
          `<option value="${s}"${s === wsClass ? ' selected' : ''}>${_esc(WEEK_STATUS_LABELS[s])}</option>`
        ).join('');
        return `
          <div class="bc-week">
            <span class="bc-dot bc-dot--${wsClass}" aria-hidden="true"></span>
            <span class="bc-week__num">S${_esc(w.week_number)}</span>
            <span class="bc-week__title">${_esc(w.title || ('Semaine ' + w.week_number))}</span>
            <select class="bc-week__select" aria-label="Statut de la semaine ${_esc(w.week_number)}" onchange="changeWeekStatus('${_esc(w.id)}', this.value)">
              ${opts}
            </select>
          </div>`;
      }).join('')}</div>`;

  return `
    <div class="bc-card">
      <div class="bc-card__head">
        <div class="bc-card__title">
          <strong>Camp ${_fmtDate(camp.start_date)} → ${_fmtDate(camp.end_date)}</strong>
          <div class="bc-card__meta">${_esc(camp.total_weeks || weeks.length)} semaine(s)${combatInfo}</div>
        </div>
        <span class="bc-badge bc-badge--${stClass}">${stLabel}</span>
        <div class="bc-card__actions">
          <button class="btn btn--sm btn--danger-ghost" onclick="deleteCampConfirm('${_esc(camp.id)}')">Supprimer</button>
        </div>
      </div>
      <div class="bc-card__body">${weeksHtml}</div>
    </div>`;
}

async function renderCampsTab(fighterId, salleId) {
  const tab = document.getElementById('tab-camp');
  if (!tab) return;

  const toolbar = `
    <div class="bc-toolbar">
      <button class="btn btn--primary btn--sm" onclick="openCampModal()">+ Créer un camp</button>
    </div>`;

  const camps = await getCamps(fighterId);
  const sorted = [...(camps || [])].sort(
    (a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0)
  );

  if (sorted.length === 0) {
    tab.innerHTML = toolbar + `
      <div class="bc-empty">
        <svg class="icon icon--md" aria-hidden="true"><use href="#ic-target"/></svg>
        <div>Aucun camp de préparation pour ce combattant.</div>
      </div>`;
    return;
  }

  // Résout les libellés des combats liés (une seule fois) avant le rendu.
  const combatLabels = {};
  if (salleId && sorted.some(c => c.combat_id)) {
    try {
      const combats = await getCombats(salleId);
      const byId = {};
      (combats || []).forEach(c => { byId[c.id] = c; });
      sorted.forEach(c => {
        const cb = c.combat_id ? byId[c.combat_id] : null;
        if (cb) {
          combatLabels[c.id] = (cb.opponent_name ? 'vs ' + cb.opponent_name : 'Combat') +
            (cb.fight_date ? ' (' + formatDate(cb.fight_date) + ')' : '');
        }
      });
    } catch (e) {
      console.warn('camps combat enrichment:', e);
    }
  }

  const cards = sorted.map(camp => buildCampCard(camp, combatLabels[camp.id])).join('');
  tab.innerHTML = toolbar + `<div class="bc-list">${cards}</div>`;
}

async function changeWeekStatus(weekId, status) {
  const result = await updateCampWeek(weekId, { status });
  if (result && result.error) {
    if (typeof toast !== 'undefined') toast('Erreur : statut non mis à jour.', 'error');
    return;
  }
  if (typeof toast !== 'undefined') toast('Semaine mise à jour', 'success');
  reloadCampsTab();
}

function deleteCampConfirm(id) {
  const msg = 'Supprimer ce camp et toutes ses semaines ? Cette action est irréversible.';
  if (typeof confirmModal === 'function') {
    confirmModal(msg, async () => {
      const result = await deleteCamp(id);
      if (result && result.error) {
        if (typeof toast !== 'undefined') toast('Erreur : suppression impossible.', 'error');
        return;
      }
      if (typeof toast !== 'undefined') toast('Camp supprimé', 'success');
      reloadCampsTab();
    });
  }
}

// Recharge uniquement l'onglet Camp (pas besoin de recharger toute la page).
async function reloadCampsTab() {
  const params = new URLSearchParams(window.location.search);
  const fighterId = params.get('id');
  if (!fighterId) return;
  const fighter = await getCombattant(fighterId);
  await renderCampsTab(fighterId, fighter ? fighter.salle_id : null);
}

// ─── MODAL CAMP ─────────────────────────────
(function () {
  let modal, lastFocused;

  function buildModal() {
    if (document.getElementById('campModal')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal-overlay" id="campModal" role="dialog" aria-modal="true" aria-labelledby="campTitle">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title" id="campTitle">Créer un camp</h3>
            <button class="modal-close" id="campClose" type="button" aria-label="Fermer">&times;</button>
          </div>
          <form class="modal-form" id="campForm">
            <div class="modal-row">
              <div class="modal-field">
                <label for="cpStart">Date de début *</label>
                <input type="date" id="cpStart" required />
              </div>
              <div class="modal-field">
                <label for="cpEnd">Date de fin *</label>
                <input type="date" id="cpEnd" required />
              </div>
            </div>
            <div class="modal-row">
              <div class="modal-field">
                <label for="cpWeeks">Nombre de semaines *</label>
                <input type="number" id="cpWeeks" min="1" max="16" value="8" required />
              </div>
              <div class="modal-field">
                <label for="cpCombat">Combat lié (optionnel)</label>
                <select id="cpCombat">
                  <option value="">Aucun</option>
                </select>
              </div>
            </div>
            <div class="modal-error" id="cpError"></div>
            <div class="modal-actions">
              <button type="button" class="btn btn--ghost" id="cpCancel">Annuler</button>
              <button type="submit" class="btn btn--primary" id="cpSubmit"><span class="btn-text">Créer</span></button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.appendChild(wrapper.firstElementChild);

    modal = document.getElementById('campModal');
    document.getElementById('campClose').addEventListener('click', closeCampModal);
    document.getElementById('cpCancel').addEventListener('click', closeCampModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeCampModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeCampModal();
    });
    document.getElementById('campForm').addEventListener('submit', onSubmit);
  }

  function closeCampModal() {
    if (!modal) return;
    modal.classList.remove('open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  async function populateCombats(fighterId) {
    const select = document.getElementById('cpCombat');
    if (!select) return;
    // Reset (garde l'option "Aucun").
    select.innerHTML = '<option value="">Aucun</option>';
    try {
      const fighter = await getCombattant(fighterId);
      if (!fighter || !fighter.salle_id) return;
      const combats = await getCombats(fighter.salle_id, { upcoming: true });
      (combats || [])
        .filter(c => c.combattant_id === fighterId)
        .forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          const label = (c.opponent_name ? 'vs ' + c.opponent_name : 'Combat') +
            (c.fight_date ? ' — ' + formatDate(c.fight_date) : '');
          opt.textContent = label; // textContent → pas d'injection HTML
          select.appendChild(opt);
        });
    } catch (e) {
      console.warn('populateCombats:', e);
    }
  }

  function openCampModal() {
    buildModal();
    const params = new URLSearchParams(window.location.search);
    const fighterId = params.get('id');
    const form = document.getElementById('campForm');
    const err = document.getElementById('cpError');
    if (form) form.reset();
    if (err) err.classList.remove('visible');
    document.getElementById('cpWeeks').value = 8;
    // Pré-remplit la date de début à aujourd'hui.
    const today = new Date().toISOString().split('T')[0];
    const startInput = document.getElementById('cpStart');
    if (startInput) startInput.value = today;
    populateCombats(fighterId);

    lastFocused = document.activeElement;
    modal.classList.add('open');
    setTimeout(() => { const el = document.getElementById('cpStart'); if (el) el.focus(); }, 50);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const fighterId = params.get('id');
    const err = document.getElementById('cpError');
    const submitBtn = document.getElementById('cpSubmit');
    if (err) err.classList.remove('visible');

    const startDate = document.getElementById('cpStart').value;
    const endDate = document.getElementById('cpEnd').value;
    const totalWeeks = parseInt(document.getElementById('cpWeeks').value, 10);
    const combatId = document.getElementById('cpCombat').value || null;

    if (!startDate || !endDate) {
      if (err) { err.textContent = 'Les dates de début et de fin sont obligatoires.'; err.classList.add('visible'); }
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      if (err) { err.textContent = 'La date de fin doit suivre la date de début.'; err.classList.add('visible'); }
      return;
    }
    if (!totalWeeks || totalWeeks < 1 || totalWeeks > 16) {
      if (err) { err.textContent = 'Le nombre de semaines doit être compris entre 1 et 16.'; err.classList.add('visible'); }
      return;
    }

    submitBtn.classList.add('loading');
    try {
      const fighter = await getCombattant(fighterId);
      if (!fighter) throw new Error('Combattant introuvable.');
      const salleId = fighter.salle_id;
      if (!salleId) throw new Error('Salle du combattant introuvable.');

      const campResult = await createCamp(salleId, {
        combattant_id: fighterId,
        combat_id: combatId,
        start_date: startDate,
        end_date: endDate,
        total_weeks: totalWeeks,
        status: 'active',
      });
      if (campResult && campResult.error) throw new Error(campResult.error.message || 'Échec de la création du camp.');
      const camp = campResult.data;
      if (!camp || !camp.id) throw new Error('Camp créé sans identifiant.');

      // Génère les N semaines (séquentiellement pour conserver l'ordre).
      for (let n = 1; n <= totalWeeks; n++) {
        const wRes = await createCampWeek({
          camp_id: camp.id,
          week_number: n,
          title: 'Semaine ' + n,
          status: 'pending',
        });
        if (wRes && wRes.error) console.warn('createCampWeek S' + n + ':', wRes.error);
      }

      if (typeof toast !== 'undefined') toast('Camp créé', 'success');
      closeCampModal();
      reloadCampsTab();
    } catch (error) {
      console.warn('camp submit:', error);
      if (err) { err.textContent = 'Erreur : ' + (error.message || 'Impossible de créer le camp.'); err.classList.add('visible'); }
      if (typeof toast !== 'undefined') toast('Erreur : ' + (error.message || 'Impossible de créer le camp.'), 'error');
    } finally {
      submitBtn.classList.remove('loading');
    }
  }

  window.openCampModal = openCampModal;
})();

/* ════════════════════════════════════════════
   RAPPORT PRÉ-COMBAT — synthèse imprimable (SANS IA)
   Agrégation de données réelles (combat à venir, forme, alertes,
   blessures, camp) + règles simples de vigilance. Ouvre une nouvelle
   fenêtre autonome et déclenche l'impression ; repli sur un modal si
   `window.open` est bloqué. Tout contenu dynamique passe par escapeHtml.
════════════════════════════════════════════ */

// Échappement sûr (réutilise security.js ; fallback minimal au cas où).
function _rEsc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s == null ? '' : String(s));
  return String(s == null ? '' : s).replace(/[<>&"']/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _rFmtDate(dateStr) {
  if (!dateStr) return '—';
  if (typeof formatDate === 'function') { const o = formatDate(dateStr); return o || '—'; }
  return _rEsc(dateStr);
}

// Score 0..100 dérivé d'un questionnaire (même logique que le graphe).
function _rMentalScore(q) {
  if (!q) return null;
  if (q.score_mental != null) return q.score_mental;
  if (q.mental_score != null) return q.mental_score;
  if (typeof mentalFromFeelings === 'function') return mentalFromFeelings(q);
  return null;
}

// Barre de score inline (fond blanc / texte foncé) pour le document imprimable.
function _rScoreBar(label, value) {
  const has = value != null && !Number.isNaN(value);
  const v = has ? Math.max(0, Math.min(100, Math.round(value))) : 0;
  const color = !has ? '#9ca3af' : v >= 70 ? '#2f855a' : v >= 50 ? '#b7791f' : '#c53030';
  return `
    <div style="display:flex;align-items:center;gap:10px;margin:6px 0;">
      <div style="flex:0 0 150px;font-size:12px;color:#374151;">${_rEsc(label)}</div>
      <div style="flex:1;height:9px;background:#e5e7eb;border-radius:5px;overflow:hidden;">
        <div style="height:100%;width:${v}%;background:${color};"></div>
      </div>
      <div style="flex:0 0 42px;text-align:right;font-size:12px;font-weight:700;color:#111827;">${has ? v + '%' : '—'}</div>
    </div>`;
}

function _rSection(title, innerHtml) {
  return `
    <section style="margin:0 0 18px;">
      <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:#6b0000;border-bottom:2px solid #6b0000;padding-bottom:4px;margin:0 0 10px;">${_rEsc(title)}</h2>
      ${innerHtml}
    </section>`;
}

// Construit le HTML autonome du rapport à partir des données déjà chargées.
function buildPrefightReportHtml(ctx) {
  const { f, nextFight, questionnaires, alertes, blessures, camp } = ctx;

  const fullName = typeof getFullName === 'function' ? getFullName(f) : ((f.first_name || '') + ' ' + (f.last_name || '')).trim();
  const wins = parseInt(f.record_wins) || 0;
  const losses = parseInt(f.record_losses) || 0;
  const draws = parseInt(f.record_draws ?? f.record_nuls ?? f.record_draw) || 0;
  const today = new Date();
  const todayStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ── En-tête ──
  const head = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #111827;padding-bottom:12px;margin-bottom:20px;">
      <div>
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b0000;font-weight:700;">THYMOS · Rapport pré-combat</div>
        <h1 style="margin:6px 0 4px;font-size:26px;color:#111827;">${_rEsc(fullName)}</h1>
        <div style="font-size:13px;color:#374151;">
          ${_rEsc(f.weight_category || 'Catégorie —')}
          &nbsp;·&nbsp; Record <strong>${wins}V – ${losses}D – ${draws}N</strong>
        </div>
      </div>
      <div style="text-align:right;font-size:12px;color:#6b7280;">Édité le<br><strong style="color:#111827;">${_rEsc(todayStr)}</strong></div>
    </div>`;

  // ── Prochain combat ──
  let nextFightHtml;
  if (nextFight) {
    const jx = typeof daysUntil === 'function' ? daysUntil(nextFight.fight_date) : null;
    const jLabel = (jx != null && !Number.isNaN(jx))
      ? (jx > 0 ? 'J-' + jx : jx === 0 ? "Aujourd'hui" : 'Passé (J+' + Math.abs(jx) + ')')
      : '—';
    nextFightHtml = `
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:4px 0;color:#6b7280;width:140px;">Adversaire</td><td style="padding:4px 0;color:#111827;font-weight:600;">${_rEsc(nextFight.opponent_name || '—')}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Événement</td><td style="padding:4px 0;color:#111827;">${_rEsc(nextFight.event_name || '—')}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Date</td><td style="padding:4px 0;color:#111827;">${_rFmtDate(nextFight.fight_date)} &nbsp;<strong style="color:#6b0000;">${_rEsc(jLabel)}</strong></td></tr>
      </table>`;
  } else {
    nextFightHtml = `<p style="font-size:13px;color:#6b7280;margin:0;">Aucun combat programmé.</p>`;
  }

  // ── État de forme ──
  let trendHtml = '';
  if (questionnaires && questionnaires.length >= 2) {
    const cur = _rMentalScore(questionnaires[0]);
    const prev = _rMentalScore(questionnaires[1]);
    if (cur != null && prev != null) {
      const delta = cur - prev;
      const arrow = delta > 0 ? '▲ Hausse' : delta < 0 ? '▼ Baisse' : '▬ Stable';
      const tColor = delta > 0 ? '#2f855a' : delta < 0 ? '#c53030' : '#6b7280';
      const sign = delta > 0 ? '+' : '';
      trendHtml = `<p style="font-size:12px;margin:10px 0 0;color:${tColor};font-weight:600;">Tendance mental (2 derniers questionnaires) : ${arrow} (${sign}${delta} pts)</p>`;
    }
  }
  const formHtml =
    _rScoreBar('Physique', f.score_physique) +
    _rScoreBar('Mental', f.score_mental) +
    _rScoreBar('Confiance', f.score_confiance) +
    _rScoreBar('Motivation', f.score_motivation) +
    _rScoreBar('Gestion du stress', f.score_stress) +
    trendHtml;

  // ── Alertes actives ──
  let alertesHtml;
  if (alertes && alertes.length) {
    alertesHtml = `<ul style="margin:0;padding-left:18px;font-size:13px;color:#111827;">` +
      alertes.map(a => {
        const lvl = (a.level === 'critical') ? 'CRITIQUE' : (a.level === 'warning' ? 'Vigilance' : (a.level || ''));
        const lvlColor = a.level === 'critical' ? '#c53030' : '#b7791f';
        return `<li style="margin:4px 0;">${a.level ? `<strong style="color:${lvlColor};">[${_rEsc(lvl)}]</strong> ` : ''}${_rEsc(a.title || a.message || 'Alerte')}${a.title && a.message ? ` — <span style="color:#374151;">${_rEsc(a.message)}</span>` : ''}</li>`;
      }).join('') + `</ul>`;
  } else {
    alertesHtml = `<p style="font-size:13px;color:#6b7280;margin:0;">Aucune alerte active.</p>`;
  }

  // ── Blessures en cours ──
  let blessuresHtml;
  const ongoing = (blessures || []).filter(b => b.statut === 'en_cours');
  if (ongoing.length) {
    blessuresHtml = `<ul style="margin:0;padding-left:18px;font-size:13px;color:#111827;">` +
      ongoing.map(b => {
        const grav = b.gravite ? ' (' + _rEsc(b.gravite) + ')' : '';
        const ret = b.date_retour_estimee ? ` · retour estimé ${_rFmtDate(b.date_retour_estimee)}` : '';
        return `<li style="margin:4px 0;"><strong>${_rEsc(b.type || 'Blessure')}</strong>${b.zone ? ' — ' + _rEsc(b.zone) : ''}${grav}<span style="color:#374151;">${ret}</span></li>`;
      }).join('') + `</ul>`;
  } else {
    blessuresHtml = `<p style="font-size:13px;color:#6b7280;margin:0;">Aucune blessure en cours.</p>`;
  }

  // ── Camp en cours ──
  let campHtml;
  if (camp) {
    const weeks = [...(camp.camp_weeks || [])].sort((a, b) => (a.week_number || 0) - (b.week_number || 0));
    const current = weeks.find(w => w.status === 'current');
    const total = camp.total_weeks || weeks.length;
    campHtml = `
      <p style="font-size:13px;color:#111827;margin:0;">
        Camp du <strong>${_rFmtDate(camp.start_date)}</strong> au <strong>${_rFmtDate(camp.end_date)}</strong> · ${_rEsc(total)} semaine(s).
        ${current ? `<br>Semaine en cours : <strong style="color:#6b0000;">S${_rEsc(current.week_number)}</strong> — ${_rEsc(current.title || ('Semaine ' + current.week_number))}.` : ''}
      </p>`;
  } else {
    campHtml = `<p style="font-size:13px;color:#6b7280;margin:0;">Aucun camp de préparation actif.</p>`;
  }

  // ── Points de vigilance (règles simples) ──
  const vigilance = [];
  if (f.score_mental != null && f.score_mental < 60) vigilance.push('Mental à surveiller (score < 60).');
  if (ongoing.length > 0) vigilance.push('Aptitude médicale à confirmer (blessure en cours).');
  if (f.score_physique != null && f.score_physique < 60) vigilance.push('Préparation physique à renforcer (score < 60).');
  if (!nextFight) vigilance.push("Pas d'échéance fixée (aucun combat programmé).");
  if (f.score_confiance != null && f.score_confiance < 50) vigilance.push('Confiance en baisse — accompagnement recommandé.');
  if (alertes && alertes.length > 0) vigilance.push(alertes.length + ' alerte(s) active(s) à traiter.');
  if (vigilance.length === 0) vigilance.push('Aucun point de vigilance majeur détecté.');
  // 2 à 5 puces : on borne l'affichage à 5.
  const vigilanceHtml = `<ul style="margin:0;padding-left:18px;font-size:13px;color:#111827;">` +
    vigilance.slice(0, 5).map(v => `<li style="margin:4px 0;">${_rEsc(v)}</li>`).join('') + `</ul>`;

  const body =
    head +
    _rSection('Prochain combat', nextFightHtml) +
    _rSection('État de forme', formHtml) +
    _rSection('Alertes actives', alertesHtml) +
    _rSection('Blessures en cours', blessuresHtml) +
    _rSection('Camp en cours', campHtml) +
    _rSection('Points de vigilance', vigilanceHtml) +
    `<footer style="margin-top:24px;padding-top:10px;border-top:1px solid #d1d5db;font-size:10px;color:#9ca3af;text-align:center;">
       Rapport généré automatiquement par THYMOS — synthèse de données saisies (sans IA). Document confidentiel.
     </footer>`;

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Rapport pré-combat — ${_rEsc(fullName)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @page { margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; background:#ffffff; color:#111827; margin:0; padding:28px; }
  .report-wrap { max-width:760px; margin:0 auto; }
  @media print { body { padding:0; } .no-print { display:none !important; } }
</style></head>
<body>
  <div class="report-wrap">
    <div class="no-print" style="text-align:right;margin-bottom:14px;">
      <button onclick="window.print()" style="background:#6b0000;color:#fff;border:none;padding:8px 16px;font-size:13px;border-radius:6px;cursor:pointer;">Imprimer / PDF</button>
    </div>
    ${body}
  </div>
</body></html>`;
}

// Repli (modal) si window.open est bloqué : injecte le corps du rapport dans un
// overlay sombre cohérent avec le reste de l'app, avec un bouton d'impression
// qui ouvre la version autonome dans une nouvelle fenêtre.
function _showPrefightFallbackModal(html) {
  const existing = document.getElementById('prefightReportModal');
  if (existing) existing.remove();

  // Extrait uniquement le contenu du <body> pour l'afficher dans le modal,
  // en retirant la barre d'impression « no-print » (le modal a son propre
  // bouton Imprimer plus bas, qui rouvre la version autonome).
  let inner = (html.match(/<body>([\s\S]*)<\/body>/i) || [, html])[1];
  inner = inner.replace(/<div class="no-print"[\s\S]*?<\/div>/i, '');

  const overlay = document.createElement('div');
  overlay.id = 'prefightReportModal';
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:820px;">
      <div class="modal-header">
        <h3 class="modal-title">Rapport pré-combat</h3>
        <button class="modal-close" type="button" aria-label="Fermer" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <div style="padding:1.25rem;">
        <p style="font-size:0.78rem;color:var(--subtle);margin:0 0 1rem;">L'ouverture d'une fenêtre a été bloquée. Voici la synthèse ; utilisez le bouton pour l'imprimer.</p>
        <div style="background:#fff;border-radius:8px;padding:18px;">${inner}</div>
        <div class="modal-actions" style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
          <button class="btn btn--ghost" type="button" onclick="this.closest('.modal-overlay').remove()">Fermer</button>
          <button class="btn btn--primary" type="button" id="prefightModalPrint">Imprimer / PDF</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  const printBtn = document.getElementById('prefightModalPrint');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      // Nouvelle tentative d'ouverture autonome ; sinon impression de la page.
      const w = window.open('', '_blank');
      if (w && w.document) {
        w.document.open();
        w.document.write(html);
        w.document.close();
        w.focus();
        setTimeout(() => { try { w.print(); } catch (_) {} }, 350);
      } else {
        window.print();
      }
    });
  }
}

// Point d'entrée : charge les données réelles puis ouvre la fenêtre imprimable.
async function generatePrefightReport(fighter, fighterId) {
  const btn = document.getElementById('prefightReportBtn');
  if (btn) btn.classList.add('loading');
  // Pré-ouvre la fenêtre dans le geste utilisateur (évite le blocage popup).
  let win = null;
  try { win = window.open('', '_blank'); } catch (_) { win = null; }
  if (win && win.document) {
    win.document.open();
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Rapport pré-combat…</title></head><body style="font-family:Arial,sans-serif;color:#111;padding:40px;">Génération du rapport…</body></html>');
    win.document.close();
  }

  try {
    const salleId = fighter.salle_id || null;

    // Chargement parallèle des données réelles.
    const [combats, questionnaires, alertesAll, blessures, camps] = await Promise.all([
      salleId && typeof getCombats === 'function' ? getCombats(salleId, { upcoming: true }) : Promise.resolve([]),
      typeof getQuestionnaires === 'function' ? getQuestionnaires(fighterId) : Promise.resolve([]),
      salleId && typeof getAlertes === 'function' ? getAlertes(salleId) : Promise.resolve([]),
      typeof getBlessures === 'function' ? getBlessures(fighterId) : Promise.resolve([]),
      typeof getCamps === 'function' ? getCamps(fighterId) : Promise.resolve([]),
    ]);

    // Prochain combat : le plus proche à venir de CE combattant (liste déjà triée asc).
    const nextFight = (combats || []).find(c => c.combattant_id === fighterId) || null;

    // Alertes actives de ce combattant (getAlertes renvoie déjà les non résolues).
    const alertes = (alertesAll || []).filter(a => a.combattant_id === fighterId);

    // Camp actif (sinon le plus récent renvoyé par l'API).
    const camps2 = camps || [];
    const camp = camps2.find(c => c.status === 'active') || camps2[0] || null;

    const html = buildPrefightReportHtml({ f: fighter, nextFight, questionnaires, alertes, blessures, camp });

    if (win && win.document && !win.closed) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      // Laisse le rendu se faire avant l'impression.
      setTimeout(() => { try { win.print(); } catch (_) {} }, 400);
    } else {
      // Popup bloquée → repli modal.
      _showPrefightFallbackModal(html);
    }
  } catch (error) {
    console.warn('generatePrefightReport:', error);
    if (win && !win.closed) { try { win.close(); } catch (_) {} }
    if (typeof toast !== 'undefined') {
      toast('Erreur : impossible de générer le rapport pré-combat.', 'error');
    }
  } finally {
    if (btn) btn.classList.remove('loading');
  }
}
