/* ═══════════════════════════════════════════
   THYMOS — PAGE DASHBOARD (dynamic)
════════════════════════════════════════════ */

async function loadDashboard() {
  // ─── SKELETONS DE CHARGEMENT ─────────────
  // Placeholders « shimmer » affiches avant le retour des donnees Supabase.
  // Strictement additif : le rendu existant remplace ces conteneurs via
  // textContent / innerHTML, donc les skeletons disparaissent naturellement.
  showDashboardSkeletons();

  const salle = await getCurrentSalle();
  if (!salle) {
    // Pas de salle (compte sans salle, trigger non exécuté, salle supprimée) :
    // on ne laisse PAS les skeletons figés silencieusement — message explicite.
    const host = document.querySelector('.dashboard-content') || document.querySelector('main') || document.body;
    host.insertAdjacentHTML('afterbegin',
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg,12px);padding:1.5rem;margin:1rem 0;text-align:center;">'
      + '<h2 style="font-family:var(--font-display);font-size:1rem;margin-bottom:0.5rem;">Aucune salle associée à ce compte</h2>'
      + '<p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">Votre espace n\'a pas encore de salle configurée. Ouvrez les paramètres pour la créer, ou déconnectez-vous puis reconnectez-vous.</p>'
      + '<a href="parametres.html" class="btn btn--primary btn--sm">Ouvrir les paramètres</a></div>');
    document.querySelectorAll('[class*="skeleton"], [class*="shimmer"]').forEach((el) => el.remove());
    return;
  }

  const fighters = await getCombattants(salle.id);
  const combats = await getCombats(salle.id, { upcoming: true });
  const alertes = await getAlertes(salle.id);

  // ─── ONBOARDING « PREMIERS PAS » ─────────
  // Checklist guidee, cochee selon l'etat reel de la salle. Ne bloque pas
  // le reste du dashboard si elle echoue (sessions/questionnaires en plus).
  renderOnboardingChecklist(salle, fighters, combats).catch((e) =>
    console.warn('onboarding checklist:', e)
  );

  // ─── KPIs ────────────────────────────────
  const kpiValues = document.querySelectorAll('.kpi-value');
  if (kpiValues[0]) kpiValues[0].textContent = fighters.length;
  if (kpiValues[1]) kpiValues[1].textContent = combats.length;
  const avgMental = fighters.length
    ? Math.round(fighters.reduce((s, f) => s + (f.score_mental || 0), 0) / fighters.length)
    : 0;
  if (kpiValues[2]) kpiValues[2].innerHTML = avgMental + '<span class="kpi-unit">%</span>';
  if (kpiValues[3]) kpiValues[3].textContent = alertes.length;

  // ─── VUE D'ENSEMBLE (graphes Chart.js) ───
  renderSalleOverview(fighters);

  // ─── FIGHTERS TABLE ──────────────────────
  const tbody = document.querySelector('#fightersTable tbody');
  if (tbody) {
    if (fighters.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="7" style="text-align:center;padding:2.5rem;">
          <div style="color:var(--subtle);margin-bottom:1rem;">Aucun combattant pour le moment</div>
          <button class="btn btn--primary btn--sm" onclick="openFighterModal(null, () => location.reload())">Ajouter mon premier combattant</button>
        </td></tr>`;
    } else {
      const displayed = fighters.slice(0, 8);
      tbody.innerHTML = displayed.map(f => {
        const initials = escapeHtml(getInitials(f.first_name, f.last_name));
        const name = escapeHtml(getFullName(f));
        const statusLabel = escapeHtml(STATUS_LABELS[f.status] || f.status);
        const phys = parseInt(f.score_physique) || 0;
        const ment = parseInt(f.score_mental) || 0;
        const safeId = escapeHtml(f.id);
        return `
          <tr class="fighter-row" data-id="${safeId}" style="cursor:pointer;">
            <td><div class="fighter-cell"><div class="f-avatar" style="background:${escapeHtml(f.avatar_color || '#6b0000')}">${initials}</div><div class="f-info"><div class="f-name">${name}</div><div class="f-sub">${f.age ? escapeHtml(f.age) + ' ans' : ''}${f.age && f.style ? ' · ' : ''}${escapeHtml(STYLE_LABELS[f.style] || '')}</div></div></div></td>
            <td><span class="weight-badge">${escapeHtml(f.weight_category || '-')}</span></td>
            <td><span class="status-badge"><span class="status-dot status-dot--${escapeHtml(f.status)}"></span>${statusLabel}</span></td>
            <td><div class="score-cell"><div class="mini-bar"><div class="mini-fill ${phys >= 80 ? 'good' : phys < 60 ? 'danger' : ''}" style="width:${phys}%"></div></div><span class="score-num ${phys >= 80 ? 'ok' : phys < 60 ? 'warn' : ''}">${phys}%</span></div></td>
            <td><div class="score-cell"><div class="mini-bar"><div class="mini-fill ${ment >= 80 ? 'good' : ment < 60 ? 'danger' : ''}" style="width:${ment}%"></div></div><span class="score-num ${ment >= 80 ? 'ok' : ment < 60 ? 'warn' : ''}">${ment}%</span></div></td>
            <td><span class="fight-date none">—</span></td>
            <td><a href="combattant.html?id=${safeId}" class="btn-row">Voir <svg class="icon icon--sm" aria-hidden="true"><use href="#ic-chevron-right"/></svg></a></td>
          </tr>`;
      }).join('');

      const countEl = document.querySelector('.panel-count');
      if (countEl) countEl.textContent = fighters.length;
      const showEl = document.querySelector('.showing-count');
      if (showEl) showEl.textContent = `Affichage ${displayed.length} sur ${fighters.length} combattants`;

      document.querySelectorAll('#fightersTable .fighter-row').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.btn-row')) return;
          window.location.href = `combattant.html?id=${row.dataset.id}`;
        });
      });
    }
  }

  // ─── ALERTES PANEL ───────────────────────
  const alertesBody = document.getElementById('dashAlertesBody');
  const alertCount = document.getElementById('dashAlertCount');
  if (alertCount) alertCount.textContent = alertes.length;

  if (alertesBody) {
    if (alertes.length > 0) {
      alertesBody.innerHTML = alertes.slice(0, 3).map(a => {
        const f = a.combattants;
        const levelClass = a.level === 'critical' ? 'critical' : 'warning';
        const fighterName = f ? escapeHtml(f.first_name + ' ' + f.last_name) : 'Inconnu';
        return `
          <div class="alert-card alert-card--${levelClass}">
            <div class="alert-header">
              <div class="alert-icon"><svg class="icon icon--sm" aria-hidden="true"><use href="#ic-brain"/></svg></div>
              <div class="alert-meta">
                <span class="alert-fighter">${fighterName}</span>
                <span class="alert-type">${escapeHtml(a.category)} · ${a.level === 'critical' ? 'Critique' : a.level === 'warning' ? 'Attention' : 'Suivi'}</span>
              </div>
            </div>
            <p class="alert-body">${escapeHtml(a.message)}</p>
          </div>`;
      }).join('');
    } else {
      alertesBody.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--subtle);">Aucune alerte active</div>';
    }
  }

  // ─── PROCHAINS COMBATS ───────────────────
  const combatsBody = document.getElementById('dashCombatsBody');
  if (combatsBody) {
    if (combats.length > 0) {
      combatsBody.innerHTML = combats.slice(0, 3).map(c => {
        const f = c.combattants;
        const days = daysUntil(c.fight_date);
        const urgent = days !== null && days <= 7;
        const readiness = parseInt(c.readiness_score) || 50;
        const readClass = readiness >= 80 ? 'ok' : readiness < 65 ? 'warn' : '';
        const fighterName = f ? escapeHtml(f.first_name + ' ' + f.last_name) : '—';
        return `
          <div class="fight-item ${urgent ? 'fight-item--urgent' : ''}">
            <div class="fight-countdown">${days !== null ? 'J' + (days >= 0 ? '-' : '+') + Math.abs(days) : '—'}</div>
            <div class="fight-info">
              <div class="fight-name">${fighterName}</div>
              <div class="fight-detail">vs ${escapeHtml(c.opponent_name)} · ${escapeHtml(c.weight_category || '')} · ${escapeHtml(c.event_name || '')}</div>
              <div class="fight-date-loc">${formatDate(c.fight_date)} · ${escapeHtml(c.event_location || '')}</div>
            </div>
            <div class="fight-readiness">
              <div class="readiness-label">Preparation</div>
              <div class="readiness-bar"><div class="readiness-fill ${readClass}" style="width:${readiness}%"></div></div>
              <div class="readiness-num ${readClass}">${readiness}%</div>
            </div>
          </div>`;
      }).join('');
    } else {
      combatsBody.innerHTML = '<div style="padding:2.5rem;text-align:center;color:var(--subtle);">Aucun combat programme<br><button onclick="openCombatModal(() => location.reload())" style="color:var(--red);font-size:0.78rem;background:none;border:none;cursor:pointer;text-decoration:underline;">Programmer un combat</button></div>';
    }
  }

  // ─── SPARRING PANEL ──────────────────────
  const sparringBody = document.getElementById('dashSparringBody');
  if (sparringBody) {
    // For now, show fighters available for sparring
    const activeFighters = fighters.filter(f => f.status !== 'injured');
    if (activeFighters.length >= 2) {
      sparringBody.innerHTML = '<div style="padding:2.5rem;text-align:center;color:var(--subtle);">Les suggestions IA seront disponibles prochainement.<br><a href="sparring.html" style="color:var(--red);font-size:0.78rem;">Voir le sparring</a></div>';
    } else {
      sparringBody.innerHTML = '<div style="padding:2.5rem;text-align:center;color:var(--subtle);">Ajoutez au moins 2 combattants pour activer les suggestions de sparring.</div>';
    }
  }

  // ─── ADD FIGHTER BUTTON ──────────────────
  const addBtn = document.getElementById('addFighterBtn');
  if (addBtn) {
    addBtn.onclick = null;
    addBtn.addEventListener('click', () => {
      openFighterModal(null, () => location.reload());
    });
  }
}

// ─── SKELETONS DE CHARGEMENT ───────────────
// Injecte des placeholders « shimmer » (.loading-shimmer, defini dans
// css/animations.css) dans les conteneurs KPI, la table combattants et le
// panneau d'alertes pendant le fetch. Aucune logique de fetch n'est touchee :
// le rendu reel ecrase ensuite ces conteneurs.
function showDashboardSkeletons() {
  // KPIs : remplace la valeur par une barre shimmer.
  document.querySelectorAll('.kpi-value').forEach((el) => {
    el.innerHTML =
      '<span class="loading-shimmer" style="display:inline-block;width:3rem;height:1.4rem;vertical-align:middle;"></span>';
  });

  // Table combattants : quelques lignes shimmer (7 colonnes).
  const tbody = document.querySelector('#fightersTable tbody');
  if (tbody) {
    let rows = '';
    for (let i = 0; i < 5; i++) {
      rows +=
        '<tr><td colspan="7" style="padding:0.55rem 0;">' +
        '<div class="loading-shimmer" style="height:2.4rem;width:100%;"></div>' +
        '</td></tr>';
    }
    tbody.innerHTML = rows;
  }

  // Panneau alertes : quelques cartes shimmer.
  const alertesBody = document.getElementById('dashAlertesBody');
  if (alertesBody) {
    let cards = '';
    for (let i = 0; i < 3; i++) {
      cards +=
        '<div class="loading-shimmer" style="height:4.5rem;width:100%;margin-bottom:0.75rem;"></div>';
    }
    alertesBody.innerHTML = cards;
  }
}

// ─── ONBOARDING « PREMIERS PAS » ───────────
// Carte-checklist guidant un coach qui demarre. Chaque item est coche selon
// l'etat REEL de la salle (nom personnalise, combattants, combats, seances,
// questionnaire). Quand tout est complete, la checklist est masquee au profit
// d'un court bandeau « Tout est pret » fermable (memorise via localStorage).
const ONBOARDING_DONE_KEY = 'thymos_onboarding_done_dismissed';

// Noms de salle « par defaut » consideres comme non personnalises.
const DEFAULT_SALLE_NAMES = ['', 'ma salle'];

async function renderOnboardingChecklist(salle, fighters, combats) {
  const panel = document.getElementById('onboardingChecklist');
  const doneBanner = document.getElementById('onboardingDone');
  if (!panel) return;

  const fightersList = Array.isArray(fighters) ? fighters : [];
  const combatsList = Array.isArray(combats) ? combats : [];

  // 1. Nom de salle personnalise (≠ vide / ≠ « Ma Salle » par defaut).
  const salleName = (salle && salle.name ? String(salle.name) : '').trim();
  const hasCustomName = salleName.length > 0
    && !DEFAULT_SALLE_NAMES.includes(salleName.toLowerCase());

  // 2. Au moins un combattant.
  const hasFighter = fightersList.length > 0;

  // 3. Au moins un combat programme (upcoming) — deja charge par loadDashboard.
  // Filet de securite : si vide, on tente l'historique complet (combats passes).
  let hasCombat = combatsList.length > 0;
  if (!hasCombat && salle && salle.id) {
    try {
      const allCombats = await getCombats(salle.id);
      hasCombat = Array.isArray(allCombats) && allCombats.length > 0;
    } catch (e) { console.warn('onboarding combats:', e); }
  }

  // 4. Au moins une seance planifiee (plage large autour d'aujourd'hui).
  let hasSession = false;
  if (salle && salle.id) {
    try {
      const today = new Date();
      const start = new Date(today); start.setFullYear(start.getFullYear() - 1);
      const end = new Date(today); end.setFullYear(end.getFullYear() + 1);
      const iso = (d) => d.toISOString().split('T')[0];
      const sessions = await getSessions(salle.id, iso(start), iso(end));
      hasSession = Array.isArray(sessions) && sessions.length > 0;
    } catch (e) { console.warn('onboarding sessions:', e); }
  }

  // 5. Au moins un combattant ayant rempli un questionnaire hebdo.
  // Cout borne : on s'arrete des qu'un questionnaire est trouve, et on ne
  // sonde qu'un nombre limite de combattants pour rester econome.
  let hasQuestionnaire = false;
  if (hasFighter) {
    const sample = fightersList.slice(0, 8);
    for (const f of sample) {
      try {
        const qs = await getQuestionnaires(f.id);
        if (Array.isArray(qs) && qs.length > 0) { hasQuestionnaire = true; break; }
      } catch (e) { console.warn('onboarding questionnaires:', e); }
    }
  }

  const items = [
    {
      label: 'Personnaliser ma salle',
      hint: 'Donnez un nom à votre salle dans les paramètres.',
      href: 'parametres.html',
      action: 'Configurer',
      done: hasCustomName,
    },
    {
      label: 'Ajouter un premier combattant',
      hint: 'Créez la fiche de votre premier athlète.',
      href: 'combattants.html',
      action: 'Ajouter',
      done: hasFighter,
    },
    {
      label: 'Programmer un combat',
      hint: 'Planifiez une échéance pour suivre la préparation.',
      href: 'combats.html',
      action: 'Programmer',
      done: hasCombat,
    },
    {
      label: 'Planifier une séance',
      hint: 'Ajoutez une séance au planning de la semaine.',
      href: 'planning.html',
      action: 'Planifier',
      done: hasSession,
    },
    {
      label: 'Renseigner un questionnaire hebdo',
      hint: hasFighter
        ? 'Recueillez le ressenti hebdomadaire d’un combattant.'
        : 'Ajoutez d’abord un combattant pour activer les questionnaires.',
      href: 'combattants.html',
      action: 'Renseigner',
      done: hasQuestionnaire,
    },
  ];

  const completed = items.filter((it) => it.done).length;
  const total = items.length;
  const allDone = completed === total;

  // Cas « tout est fait » : masquer la checklist, montrer le bandeau (sauf si
  // deja ferme par l'utilisateur).
  if (allDone) {
    panel.hidden = true;
    const dismissed = (() => {
      try { return localStorage.getItem(ONBOARDING_DONE_KEY) === '1'; }
      catch { return false; }
    })();
    if (doneBanner) {
      doneBanner.hidden = dismissed;
      const closeBtn = document.getElementById('onboardingDoneClose');
      if (closeBtn && !closeBtn.dataset.bound) {
        closeBtn.dataset.bound = '1';
        closeBtn.addEventListener('click', () => {
          doneBanner.hidden = true;
          try { localStorage.setItem(ONBOARDING_DONE_KEY, '1'); } catch { /* ignore */ }
        });
      }
    }
    return;
  }

  // Au moins une etape restante : afficher la checklist, cacher le bandeau.
  if (doneBanner) doneBanner.hidden = true;
  panel.hidden = false;

  const progressEl = document.getElementById('onboardingProgress');
  if (progressEl) progressEl.textContent = `${completed}/${total}`;
  const fillEl = document.getElementById('onboardingTrackFill');
  if (fillEl) fillEl.style.width = `${Math.round((completed / total) * 100)}%`;

  const listEl = document.getElementById('onboardingList');
  if (listEl) {
    listEl.innerHTML = items.map((it) => {
      const label = escapeHtml(it.label);
      const hint = escapeHtml(it.hint);
      const href = escapeHtml(it.href);
      const action = escapeHtml(it.action);
      const trailing = it.done
        ? '<span class="onboarding-item__check">Terminé</span>'
        : `<a class="onboarding-item__action" href="${href}">${action} <svg class="icon" aria-hidden="true"><use href="#ic-arrow-right"/></svg></a>`;
      return `
        <li class="onboarding-item ${it.done ? 'onboarding-item--done' : ''}">
          <span class="onboarding-item__dot"><svg aria-hidden="true"><use href="#ic-check"/></svg></span>
          <span class="onboarding-item__main">
            <span class="onboarding-item__label">${label}</span>
            <span class="onboarding-item__hint">${hint}</span>
          </span>
          ${trailing}
        </li>`;
    }).join('');
  }
}

// ─── VUE D'ENSEMBLE DE LA SALLE (Chart.js) ──
// Deux graphes de synthese alimentes UNIQUEMENT par les combattants reels :
//   1. Donut « Repartition par statut » (camp / training / rest / injured)
//   2. Barres « Score moyen physique vs mental » de la salle
// Gere : etat vide honnete, prefers-reduced-motion, destruction propre des
// instances Chart (evite « Canvas is already in use » si rappele).
const STATUS_CHART_ORDER = ['camp', 'training', 'rest', 'injured'];
// Couleurs alignees sur la charte + les pastilles de statut existantes
// (css/dashboard.css : .status-dot--*) pour rester coherent.
const STATUS_CHART_COLORS = {
  camp: '#C1121F',      // rouge charte
  training: '#D4A017',  // or
  rest: '#888888',      // gris neutre (repos)
  injured: '#E67A17',   // orange (blesse) — distinct du rouge camp
};

let _statusChart = null;
let _scoresChart = null;

function renderSalleOverview(fighters) {
  const panel = document.getElementById('salleOverview');
  if (!panel) return;

  const body = document.getElementById('salleOverviewBody');
  const list = Array.isArray(fighters) ? fighters : [];

  // Detruit les instances precedentes (evite les fuites de canvas).
  if (_statusChart) { _statusChart.destroy(); _statusChart = null; }
  if (_scoresChart) { _scoresChart.destroy(); _scoresChart = null; }

  // Etat vide : message honnete, pas de graphe vide.
  if (list.length === 0) {
    if (body) {
      body.innerHTML =
        '<div class="overview-empty">Aucun combattant pour le moment — ajoutez un combattant pour visualiser la synthese de la salle.</div>';
    }
    return;
  }

  // Si Chart.js n'a pas (encore) charge, on degrade proprement.
  if (typeof Chart === 'undefined') {
    if (body) {
      body.innerHTML =
        '<div class="overview-empty">Les graphiques de synthese ne sont pas disponibles pour le moment.</div>';
    }
    return;
  }

  const statusCanvas = document.getElementById('statusChart');
  const scoresCanvas = document.getElementById('scoresChart');
  if (!statusCanvas || !scoresCanvas) return;

  // prefers-reduced-motion → desactive les animations Chart.
  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animation = reduceMotion ? false : undefined;

  const tickColor = '#A0A0A0';   // --muted (bon contraste sur fond sombre)
  const gridColor = 'rgba(255,255,255,0.06)';

  // ── 1. DONUT : repartition par statut (comptes reels) ──
  const counts = STATUS_CHART_ORDER.map(
    (s) => list.filter((f) => f.status === s).length
  );
  const donutLabels = STATUS_CHART_ORDER.map((s) => STATUS_LABELS[s] || s);
  const donutColors = STATUS_CHART_ORDER.map((s) => STATUS_CHART_COLORS[s]);

  _statusChart = new Chart(statusCanvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: donutLabels,
      datasets: [{
        data: counts,
        backgroundColor: donutColors,
        borderColor: '#15151A',
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: tickColor, font: { size: 12 }, padding: 14, boxWidth: 12 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.parsed || 0;
              const total = counts.reduce((a, b) => a + b, 0);
              const pct = total ? Math.round((value / total) * 100) : 0;
              return ` ${ctx.label} : ${value} (${pct}%)`;
            },
          },
        },
      },
    },
  });

  // ── 2. BARRES : score moyen physique vs mental (salle) ──
  const avg = (key) =>
    Math.round(list.reduce((s, f) => s + (parseInt(f[key]) || 0), 0) / list.length);
  const avgPhys = avg('score_physique');
  const avgMent = avg('score_mental');

  _scoresChart = new Chart(scoresCanvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Physique', 'Mental'],
      datasets: [{
        label: 'Score moyen (%)',
        data: [avgPhys, avgMent],
        backgroundColor: ['#C1121F', '#B8960C'],
        borderRadius: 6,
        maxBarThickness: 90,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y}%` } },
      },
      scales: {
        x: {
          ticks: { color: tickColor, font: { size: 12 } },
          grid: { display: false },
        },
        y: {
          min: 0,
          max: 100,
          ticks: { color: tickColor, font: { size: 11 }, stepSize: 20, callback: (v) => v + '%' },
          grid: { color: gridColor },
        },
      },
    },
  });
}

// ─── RECENT NOTIFICATIONS ──────────────────
async function loadRecentNotifications() {
  const salle = await getCurrentSalle();
  if (!salle) return;
  const notifs = await getNotificationsBySalle(salle.id, { limit: 5 });

  // Update bell badge in sidebar if there are recent unread
  const bellBadge = document.querySelector('.nav-item[href="alertes.html"] .nav-badge');
  const unread = notifs.filter(n => !n.is_read).length;
  if (bellBadge && unread > 0) bellBadge.textContent = unread;
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  loadRecentNotifications();
});
