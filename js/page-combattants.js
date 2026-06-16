/* ═══════════════════════════════════════════
   THYMOS — PAGE COMBATTANTS (dynamic)
════════════════════════════════════════════ */

let allFighters = [];

// ─── RENDER TABLE ROW ───────────────────────
function renderFighterRow(f) {
  const initials = escapeHtml(getInitials(f.first_name, f.last_name));
  const name = escapeHtml(getFullName(f));
  const statusLabel = escapeHtml(STATUS_LABELS[f.status] || f.status);
  const styleLabel = escapeHtml(STYLE_LABELS[f.style] || f.style);
  const physique = parseInt(f.score_physique) || 0;
  const mental = parseInt(f.score_mental) || 0;
  const physClass = physique >= 80 ? 'good' : physique < 60 ? 'danger' : '';
  const mentalClass = mental >= 80 ? 'good' : mental < 60 ? 'danger' : '';
  const physNumClass = physique >= 80 ? 'ok' : physique < 60 ? 'warn' : '';
  const mentalNumClass = mental >= 80 ? 'ok' : mental < 60 ? 'warn' : '';

  // Find next combat
  let fightHTML = '<span class="fight-date none">Non programmé</span>';
  // We'll handle this from combats table later

  return `
    <tr class="fighter-row" data-status="${escapeHtml(f.status)}" data-id="${escapeHtml(f.id)}">
      <td>
        <div class="fighter-cell">
          <div class="f-avatar" style="background:${escapeHtml(f.avatar_color || '#6b0000')}">${initials}</div>
          <div class="f-info">
            <div class="f-name">${name}</div>
            <div class="f-sub">${f.age ? escapeHtml(f.age) + ' ans' : ''}${f.age && f.city ? ' · ' : ''}${escapeHtml(f.city || '')}</div>
          </div>
        </div>
      </td>
      <td><span class="weight-badge">${escapeHtml(f.weight_category || '-')}</span></td>
      <td><span class="style-tag">${styleLabel}</span></td>
      <td>
        <span class="status-badge">
          <span class="status-dot status-dot--${escapeHtml(f.status)}"></span>
          ${statusLabel}
        </span>
      </td>
      <td>
        <div class="score-cell">
          <div class="mini-bar"><div class="mini-fill ${physClass}" style="width:${physique}%"></div></div>
          <span class="score-num ${physNumClass}">${physique}%</span>
        </div>
      </td>
      <td>
        <div class="score-cell">
          <div class="mini-bar"><div class="mini-fill ${mentalClass}" style="width:${mental}%"></div></div>
          <span class="score-num ${mentalNumClass}">${mental}%</span>
        </div>
      </td>
      <td>${fightHTML}</td>
      <td><span class="record-inline"><span class="rw">${parseInt(f.record_wins) || 0}V</span> <span class="rl">${parseInt(f.record_losses) || 0}D</span></span></td>
      <td>
        <div style="display:flex;gap:0.3rem;">
          <a href="combattant.html?id=${escapeHtml(f.id)}" class="btn-row">Voir <svg class="icon icon--sm" aria-hidden="true"><use href="#ic-chevron-right"/></svg></a>
          <button class="btn-row btn-edit-fighter" data-id="${escapeHtml(f.id)}" title="Modifier">
            <svg class="icon icon--sm" aria-hidden="true"><use href="#ic-edit"/></svg>
          </button>
          <button class="btn-row btn-delete-fighter" data-id="${escapeHtml(f.id)}" title="Supprimer" style="color:var(--subtle);">
            <svg viewBox="0 0 24 24" class="icon icon--sm" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
}

// ─── RENDER KPIs ────────────────────────────
function renderKPIs(fighters) {
  const camp = fighters.filter(f => f.status === 'camp').length;
  const training = fighters.filter(f => f.status === 'training').length;
  const injured = fighters.filter(f => f.status === 'injured').length;
  const avgMental = fighters.length
    ? Math.round(fighters.reduce((s, f) => s + (f.score_mental || 0), 0) / fighters.length)
    : 0;

  const kpis = document.querySelectorAll('.kpi-value');
  if (kpis[0]) kpis[0].textContent = camp;
  if (kpis[1]) kpis[1].textContent = training;
  if (kpis[2]) kpis[2].textContent = injured;
  if (kpis[3]) kpis[3].innerHTML = avgMental + '<span class="kpi-unit">%</span>';

  // Update panel count
  const panelCount = document.querySelector('.panel-count');
  if (panelCount) panelCount.textContent = fighters.length;
  const showingCount = document.querySelector('.showing-count');
  if (showingCount) showingCount.textContent = `Affichage ${fighters.length} sur ${fighters.length} combattants`;
}

// ─── LOAD & RENDER ──────────────────────────
async function loadFighters() {
  const salle = await getCurrentSalle();
  if (!salle) return;

  const tbody = document.querySelector('.fighters-table tbody');
  if (!tbody) return;

  // Show loading — skeletons « shimmer » (.loading-shimmer, css/animations.css)
  // remplaces ensuite par le rendu reel via innerHTML.
  let skeletonRows = '';
  for (let i = 0; i < 6; i++) {
    skeletonRows +=
      '<tr><td colspan="9" style="padding:0.55rem 0;">' +
      '<div class="loading-shimmer" style="height:2.6rem;width:100%;"></div>' +
      '</td></tr>';
  }
  tbody.innerHTML = skeletonRows;

  allFighters = await getCombattants(salle.id);

  if (allFighters.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="9" style="text-align:center;padding:3rem;">
        <div style="color:var(--subtle);margin-bottom:1rem;">Aucun combattant pour le moment</div>
        <button class="btn btn--primary btn--sm" onclick="openFighterModal(null, () => loadFighters())">
          <svg class="icon icon--sm" aria-hidden="true"><use href="#ic-plus"/></svg>
          Ajouter mon premier combattant
        </button>
      </td></tr>`;
    renderKPIs([]);
    return;
  }

  tbody.innerHTML = allFighters.map(renderFighterRow).join('');
  renderKPIs(allFighters);
  bindRowEvents();
}

// ─── BIND EVENTS ────────────────────────────
function bindRowEvents() {
  // Edit buttons
  document.querySelectorAll('.btn-edit-fighter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const fighter = allFighters.find(f => f.id === id);
      if (fighter) openFighterModal(fighter, () => loadFighters());
    });
  });

  // Delete buttons
  document.querySelectorAll('.btn-delete-fighter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const fighter = allFighters.find(f => f.id === id);
      if (!fighter) return;
      confirmModal(`Supprimer <strong>${escapeHtml(getFullName(fighter))}</strong> ? Cette action est irréversible.`, async () => {
        const result = await deleteCombattant(id);
        if (result.success) {
          toast('Combattant supprimé', 'warning');
          loadFighters();
        } else {
          toast('Erreur lors de la suppression', 'error');
        }
      });
    });
  });

  // Row click → go to detail
  document.querySelectorAll('.fighter-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.btn-row') || e.target.closest('.btn-edit-fighter') || e.target.closest('.btn-delete-fighter') || e.target.closest('button')) return;
      const id = row.dataset.id;
      window.location.href = `combattant.html?id=${id}`;
    });
  });
}

// ─── FILTERS ────────────────────────────────
function applyPageFilters() {
  const statusVal = document.getElementById('filterStatus')?.value || 'all';
  const catVal = document.getElementById('filterCat')?.value || 'all';
  const searchVal = (document.getElementById('fighterSearch')?.value || '').toLowerCase().trim();

  let visible = 0;
  document.querySelectorAll('.fighter-row').forEach(row => {
    const id = row.dataset.id;
    const f = allFighters.find(x => x.id === id);
    if (!f) return;

    const matchStatus = statusVal === 'all' || f.status === statusVal;
    const matchCat = catVal === 'all' || f.weight_category === catVal;
    const matchSearch = !searchVal || getFullName(f).toLowerCase().includes(searchVal);

    if (matchStatus && matchCat && matchSearch) {
      row.style.display = '';
      visible++;
    } else {
      row.style.display = 'none';
    }
  });

  const showingCount = document.querySelector('.showing-count');
  if (showingCount) showingCount.textContent = `Affichage ${visible} sur ${allFighters.length} combattants`;
}

// ─── INIT ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Override add button
  const addBtn = document.getElementById('addFighterBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      openFighterModal(null, () => loadFighters());
    });
  }

  // Filters
  document.getElementById('filterStatus')?.addEventListener('change', applyPageFilters);
  document.getElementById('filterCat')?.addEventListener('change', applyPageFilters);
  document.getElementById('fighterSearch')?.addEventListener('input', applyPageFilters);

  // Load
  loadFighters();
});
