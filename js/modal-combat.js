/* ═══════════════════════════════════════════
   THYMOS — MODAL COMBAT
   Create / schedule a fight — clean UI
════════════════════════════════════════════ */

(function () {
  const style = document.createElement('style');
  style.textContent = `
    .combat-modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0);z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem;transition:background 0.25s; }
    .combat-modal-overlay.open { background:rgba(0,0,0,0.7); }
    .combat-modal { background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);width:100%;max-width:540px;max-height:90vh;overflow-y:auto;transform:scale(0.95) translateY(10px);opacity:0;transition:transform 0.3s var(--ease-out-expo),opacity 0.25s; }
    .combat-modal-overlay.open .combat-modal { transform:scale(1) translateY(0);opacity:1; }

    .cb-versus { display:flex;align-items:center;gap:1.25rem;padding:1.5rem;background:var(--bg);border-bottom:1px solid var(--border); }
    .cb-side { flex:1;text-align:center; }
    .cb-side-label { font-family:var(--font-display);font-size:0.55rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--subtle);margin-bottom:0.5rem; }
    .cb-avatar { width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;margin:0 auto 0.4rem;border:2px solid var(--border); }
    .cb-name { font-size:0.85rem;font-weight:600;color:var(--white); }
    .cb-meta { font-size:0.7rem;color:var(--muted);margin-top:0.15rem; }
    .cb-vs { font-family:var(--font-display);font-size:1rem;font-weight:900;letter-spacing:0.15em;color:var(--red);flex-shrink:0; }
    .cb-opp-input { background:var(--surface3);border:1px solid var(--border);border-radius:var(--r);color:var(--white);font-family:var(--font-body);font-size:0.85rem;padding:0.5rem 0.75rem;text-align:center;width:100%;outline:none;transition:border-color 0.2s; }
    .cb-opp-input:focus { border-color:var(--red); }
    .cb-opp-input::placeholder { color:var(--subtle); }

    .cb-details { padding:1.25rem;display:flex;flex-direction:column;gap:1rem; }
    .cb-row { display:grid;grid-template-columns:1fr 1fr;gap:0.75rem; }
    .cb-field { display:flex;flex-direction:column;gap:0.35rem; }
    .cb-field label { font-family:var(--font-display);font-size:0.55rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted); }
    .cb-field input,.cb-field select { background:var(--bg);border:1px solid var(--border);border-radius:var(--r);color:var(--white);font-family:var(--font-body);font-size:0.82rem;padding:0.55rem 0.75rem;outline:none;width:100%;transition:border-color 0.2s; }
    .cb-field input:focus,.cb-field select:focus { border-color:var(--red); }
    .cb-field select option { background:var(--bg); }
    .cb-actions { display:flex;justify-content:flex-end;gap:0.6rem;padding-top:0.75rem;border-top:1px solid var(--border); }

    @media(max-width:480px) { .cb-versus { flex-direction:column;gap:0.75rem; } .cb-row { grid-template-columns:1fr; } }
  `;
  document.head.appendChild(style);

  let _fighters = [];
  let _salleId = '';
  let _onSuccess = null;

  async function openCombatModal(onSuccess) {
    _onSuccess = onSuccess;

    const salle = await getCurrentSalle();
    if (!salle) { toast('Erreur: aucune salle', 'error'); return; }
    _salleId = salle.id;
    _fighters = await getCombattants(salle.id);

    if (_fighters.length === 0) {
      toast('Ajoutez d\'abord des combattants', 'warning');
      return;
    }

    const fighterOptions = _fighters.map(f =>
      `<option value="${escapeHtml(f.id)}" data-color="${escapeHtml(f.avatar_color || '#333')}" data-initials="${escapeHtml(((f.first_name||'')[0]||'')+((f.last_name||'')[0]||''))}" data-weight="${escapeHtml(f.weight_category || '')}" data-style="${escapeHtml(f.style || '')}">${escapeHtml(f.first_name)} ${escapeHtml(f.last_name)} — ${escapeHtml(f.weight_category || '?')}</option>`
    ).join('');

    const overlay = document.createElement('div');
    overlay.className = 'combat-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'combatModalTitle');
    overlay.innerHTML = `
      <div class="combat-modal">
        <div class="modal-header">
          <h3 class="modal-title" id="combatModalTitle">Programmer un combat</h3>
          <button class="modal-close" onclick="this.closest('.combat-modal-overlay').remove()">&times;</button>
        </div>

        <!-- VERSUS SECTION -->
        <div class="cb-versus">
          <div class="cb-side">
            <div class="cb-side-label">Votre combattant</div>
            <select id="cbFighter" style="background:none;border:none;color:var(--white);font-family:var(--font-body);font-size:0.82rem;text-align:center;outline:none;cursor:pointer;width:100%;margin-bottom:0.5rem;">${fighterOptions}</select>
            <div class="cb-avatar" id="cbFighterAv" style="background:#333;">??</div>
            <div class="cb-meta" id="cbFighterMeta">—</div>
          </div>
          <div class="cb-vs">VS</div>
          <div class="cb-side">
            <div class="cb-side-label">Adversaire</div>
            <input type="text" id="cbOpponent" class="cb-opp-input" required placeholder="Nom de l'adversaire" />
            <div class="cb-avatar" style="background:#1e1e1e;border-color:var(--border);margin-top:0.5rem;">
              <span style="color:var(--subtle);">?</span>
            </div>
          </div>
        </div>

        <!-- DETAILS -->
        <form class="cb-details" id="combatForm">
          <div class="cb-row">
            <div class="cb-field">
              <label>Date du combat *</label>
              <input type="date" id="cbDate" required />
            </div>
            <div class="cb-field">
              <label>Categorie</label>
              <select id="cbWeight">
                <option value="-52 kg">-52 kg</option>
                <option value="-57 kg">-57 kg</option>
                <option value="-61 kg">-61 kg</option>
                <option value="-66 kg">-66 kg</option>
                <option value="-70 kg" selected>-70 kg</option>
                <option value="-77 kg">-77 kg</option>
                <option value="-84 kg">-84 kg</option>
                <option value="-93 kg">-93 kg</option>
                <option value="-120 kg">-120 kg</option>
                <option value="+120 kg">+120 kg</option>
              </select>
            </div>
          </div>
          <div class="cb-row">
            <div class="cb-field">
              <label>Evenement</label>
              <input type="text" id="cbEvent" placeholder="Ex: Hexagone MMA" />
            </div>
            <div class="cb-field">
              <label>Lieu</label>
              <input type="text" id="cbLocation" placeholder="Ex: Marseille" />
            </div>
          </div>
          <div class="cb-actions">
            <button type="button" class="btn btn--ghost" onclick="this.closest('.combat-modal-overlay').remove()">Annuler</button>
            <button type="submit" class="btn btn--primary" id="cbSubmit"><span class="btn-text">Programmer le combat</span></button>
          </div>
        </form>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    setTimeout(() => { document.getElementById('cbOpponent').focus(); }, 50);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // Fighter avatar update
    function updateFighterPreview() {
      const sel = document.getElementById('cbFighter');
      const opt = sel.options[sel.selectedIndex];
      const av = document.getElementById('cbFighterAv');
      const meta = document.getElementById('cbFighterMeta');
      av.style.background = opt.dataset.color || '#333';
      av.textContent = (opt.dataset.initials || '??').toUpperCase();
      const styleLabels = { striker:'Striker', grappler:'Grappler', mma_complet:'MMA complet' };
      meta.textContent = (opt.dataset.weight || '') + (opt.dataset.style ? ' · ' + (styleLabels[opt.dataset.style] || opt.dataset.style) : '');
      document.getElementById('cbWeight').value = opt.dataset.weight || '-70 kg';
    }
    document.getElementById('cbFighter').addEventListener('change', updateFighterPreview);
    updateFighterPreview();

    // Submit
    document.getElementById('combatForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('cbSubmit');
      btn.classList.add('loading');

      const combatData = {
        combattant_id: document.getElementById('cbFighter').value,
        opponent_name: document.getElementById('cbOpponent').value.trim(),
        weight_category: document.getElementById('cbWeight').value,
        fight_date: document.getElementById('cbDate').value,
        event_name: document.getElementById('cbEvent').value.trim() || null,
        event_location: document.getElementById('cbLocation').value.trim() || null,
        readiness_score: 50,
      };

      const result = await createCombat(_salleId, combatData);
      btn.classList.remove('loading');

      if (result.error) {
        toast('Erreur: ' + (result.error.message || 'Impossible de programmer'), 'error');
        return;
      }

      overlay.remove();
      toast('Combat programme', 'success');
      if (_onSuccess) _onSuccess(result.data);
    });
  }

  window.openCombatModal = openCombatModal;
})();
