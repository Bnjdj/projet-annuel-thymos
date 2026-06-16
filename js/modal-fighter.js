/* ═══════════════════════════════════════════
   THYMOS — MODAL FIGHTER
   Add / Edit combattant modal
════════════════════════════════════════════ */

(function () {
  // ─── INJECT MODAL HTML ────────────────────
  const modalHTML = `
  <div class="modal-overlay" id="fighterModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <div class="modal-box">
      <div class="modal-header">
        <h3 class="modal-title" id="modalTitle">Ajouter un combattant</h3>
        <button class="modal-close" id="modalClose" aria-label="Fermer">&times;</button>
      </div>
      <form class="modal-form" id="fighterForm">
        <input type="hidden" id="fighterId" />

        <div class="modal-row">
          <div class="modal-field">
            <label for="fFirstName">Prénom *</label>
            <input type="text" id="fFirstName" required placeholder="Kevin" />
          </div>
          <div class="modal-field">
            <label for="fLastName">Nom *</label>
            <input type="text" id="fLastName" required placeholder="Lambert" />
          </div>
        </div>

        <div class="modal-row">
          <div class="modal-field">
            <label for="fAge">Âge</label>
            <input type="number" id="fAge" min="14" max="60" placeholder="27" />
          </div>
          <div class="modal-field">
            <label for="fCity">Ville</label>
            <input type="text" id="fCity" placeholder="Marseille" />
          </div>
        </div>

        <div class="modal-row">
          <div class="modal-field">
            <label for="fStyle">Style de combat</label>
            <select id="fStyle">
              <option value="striker">Striker</option>
              <option value="grappler">Grappler</option>
              <option value="mma_complet">MMA complet</option>
            </select>
          </div>
          <div class="modal-field">
            <label for="fWeight">Catégorie de poids</label>
            <select id="fWeight">
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

        <div class="modal-row">
          <div class="modal-field">
            <label for="fCurrentWeight">Poids actuel (kg)</label>
            <input type="number" id="fCurrentWeight" step="0.1" min="40" max="200" placeholder="72.4" />
          </div>
          <div class="modal-field">
            <label for="fStatus">Statut</label>
            <select id="fStatus">
              <option value="training">Entraînement</option>
              <option value="camp">Camp actif</option>
              <option value="rest">Repos actif</option>
              <option value="injured">Blessé</option>
            </select>
          </div>
        </div>

        <div class="modal-row">
          <div class="modal-field">
            <label for="fWins">Victoires</label>
            <input type="number" id="fWins" min="0" value="0" />
          </div>
          <div class="modal-field">
            <label for="fLosses">Défaites</label>
            <input type="number" id="fLosses" min="0" value="0" />
          </div>
        </div>

        <div class="modal-field">
          <label for="fNotes">Notes</label>
          <textarea id="fNotes" rows="2" placeholder="Notes libres sur le combattant..."></textarea>
        </div>

        <div class="modal-error" id="modalError"></div>

        <div class="modal-actions">
          <button type="button" class="btn btn--ghost" id="modalCancel">Annuler</button>
          <button type="submit" class="btn btn--primary" id="modalSubmit">
            <span class="btn-text">Ajouter</span>
          </button>
        </div>
      </form>
    </div>
  </div>`;

  // ─── INJECT STYLES ────────────────────────
  const modalStyle = document.createElement('style');
  modalStyle.textContent = `
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0);
      z-index: 10000;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      transition: background 0.25s;
    }
    .modal-overlay.open {
      display: flex;
      background: rgba(0,0,0,0.7);
    }
    .modal-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      transform: scale(0.95) translateY(10px);
      opacity: 0;
      transition: transform 0.3s var(--ease-out-expo), opacity 0.25s;
    }
    .modal-overlay.open .modal-box {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.1rem 1.25rem;
      border-bottom: 1px solid var(--border);
    }
    .modal-title {
      font-family: var(--font-display);
      font-size: 0.85rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .modal-close {
      background: none;
      border: none;
      color: var(--subtle);
      font-size: 1.3rem;
      cursor: pointer;
      padding: 0.2rem 0.4rem;
      line-height: 1;
      transition: color 0.18s;
    }
    .modal-close:hover { color: var(--white); }
    .modal-form {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }
    .modal-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .modal-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .modal-field label {
      font-family: var(--font-display);
      font-size: 0.58rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .modal-field input,
    .modal-field select,
    .modal-field textarea {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--r);
      color: var(--white);
      font-family: var(--font-body);
      font-size: 0.82rem;
      padding: 0.55rem 0.75rem;
      outline: none;
      transition: border-color 0.2s;
      width: 100%;
    }
    .modal-field input:focus,
    .modal-field select:focus,
    .modal-field textarea:focus { border-color: var(--red); }
    .modal-field select option { background: var(--bg); }
    .modal-field textarea { resize: vertical; }
    .modal-error {
      display: none;
      padding: 0.55rem 0.75rem;
      background: var(--red-dim);
      border: 1px solid var(--red-border);
      border-radius: var(--r);
      font-size: 0.76rem;
      color: var(--red);
    }
    .modal-error.visible { display: block; }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border);
    }
    @media (max-width: 480px) {
      .modal-row { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(modalStyle);

  // Inject HTML
  const wrapper = document.createElement('div');
  wrapper.innerHTML = modalHTML;
  document.body.appendChild(wrapper.firstElementChild);

  // ─── MODAL LOGIC ──────────────────────────
  const modal = document.getElementById('fighterModal');
  const form = document.getElementById('fighterForm');
  const closeBtn = document.getElementById('modalClose');
  const cancelBtn = document.getElementById('modalCancel');
  const errorEl = document.getElementById('modalError');
  const titleEl = document.getElementById('modalTitle');
  const submitBtn = document.getElementById('modalSubmit');

  let _onSuccess = null;

  async function openFighterModal(editData, onSuccess) {
    // Check plan limit for new fighters
    if (!editData && typeof getMaxFighters === 'function' && typeof getCurrentSalle === 'function') {
      try {
        await loadPlan();
        const max = getMaxFighters();
        const salle = await getCurrentSalle();
        if (salle) {
          const fighters = await getCombattants(salle.id);
          if (fighters.length >= max) {
            showLimitModal(fighters.length, max);
            return;
          }
        }
      } catch(e) {}
    }

    _onSuccess = onSuccess;
    errorEl.classList.remove('visible');
    form.reset();

    if (editData) {
      titleEl.textContent = 'Modifier le combattant';
      submitBtn.querySelector('.btn-text').textContent = 'Enregistrer';
      document.getElementById('fighterId').value = editData.id;
      document.getElementById('fFirstName').value = editData.first_name || '';
      document.getElementById('fLastName').value = editData.last_name || '';
      document.getElementById('fAge').value = editData.age || '';
      document.getElementById('fCity').value = editData.city || '';
      document.getElementById('fStyle').value = editData.style || 'striker';
      document.getElementById('fWeight').value = editData.weight_category || '-70 kg';
      document.getElementById('fCurrentWeight').value = editData.current_weight || '';
      document.getElementById('fStatus').value = editData.status || 'training';
      document.getElementById('fWins').value = editData.record_wins || 0;
      document.getElementById('fLosses').value = editData.record_losses || 0;
      document.getElementById('fNotes').value = editData.notes || '';
    } else {
      titleEl.textContent = 'Ajouter un combattant';
      submitBtn.querySelector('.btn-text').textContent = 'Ajouter';
      document.getElementById('fighterId').value = '';
    }

    modal.classList.add('open');
    setTimeout(() => { document.getElementById('fFirstName').focus(); }, 50);
  }

  function closeFighterModal() {
    modal.classList.remove('open');
    _onSuccess = null;
  }

  closeBtn.addEventListener('click', closeFighterModal);
  cancelBtn.addEventListener('click', closeFighterModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeFighterModal(); });

  // ─── FORM SUBMIT ──────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.remove('visible');

    const salle = await getCurrentSalle();
    if (!salle) {
      errorEl.textContent = 'Erreur: aucune salle trouvée.';
      errorEl.classList.add('visible');
      return;
    }

    const id = document.getElementById('fighterId').value;
    const fighterData = {
      first_name: document.getElementById('fFirstName').value.trim(),
      last_name: document.getElementById('fLastName').value.trim(),
      age: parseInt(document.getElementById('fAge').value) || null,
      city: document.getElementById('fCity').value.trim() || null,
      style: document.getElementById('fStyle').value,
      weight_category: document.getElementById('fWeight').value,
      current_weight: parseFloat(document.getElementById('fCurrentWeight').value) || null,
      status: document.getElementById('fStatus').value,
      record_wins: parseInt(document.getElementById('fWins').value) || 0,
      record_losses: parseInt(document.getElementById('fLosses').value) || 0,
      notes: document.getElementById('fNotes').value.trim() || null,
    };

    if (!fighterData.first_name || !fighterData.last_name) {
      errorEl.textContent = 'Le prénom et le nom sont obligatoires.';
      errorEl.classList.add('visible');
      return;
    }

    submitBtn.classList.add('loading');

    let result;
    if (id) {
      result = await updateCombattant(id, fighterData);
    } else {
      fighterData.avatar_color = randomAvatarColor();
      result = await createCombattant(salle.id, fighterData);
    }

    submitBtn.classList.remove('loading');

    if (result.error) {
      errorEl.textContent = 'Erreur: ' + (result.error.message || 'Impossible de sauvegarder.');
      errorEl.classList.add('visible');
      return;
    }

    const callback = _onSuccess;
    closeFighterModal();
    if (typeof toast !== 'undefined') {
      toast(id ? 'Combattant modifié' : 'Combattant ajouté', 'success');
    }
    if (callback) callback(result.data);
  });

  // Expose globally
  window.openFighterModal = openFighterModal;
  window.closeFighterModal = closeFighterModal;
})();
