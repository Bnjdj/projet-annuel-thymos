/* ═══════════════════════════════════════════
   THYMOS — TOAST NOTIFICATIONS
   Usage : toast('Message', 'success'|'error'|'info'|'warning')
════════════════════════════════════════════ */

(function () {
  // Inject styles once
  const STYLE_ID = 'thymos-toast-styles';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #thymos-toast-container {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        pointer-events: none;
      }
      .thymos-toast {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        background: var(--surface);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: var(--r-lg);
        padding: 0.65rem 1rem;
        font-family: var(--font-body);
        font-size: 0.8rem;
        color: #fff;
        box-shadow: 0 4px 24px rgba(0,0,0,0.5);
        pointer-events: all;
        min-width: 220px;
        max-width: 340px;
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s;
        opacity: 0;
      }
      .thymos-toast.show { transform: translateX(0); opacity: 1; }
      .thymos-toast.hide { transform: translateX(120%); opacity: 0; transition: transform 0.25s ease, opacity 0.25s; }
      .thymos-toast__dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .thymos-toast--success .thymos-toast__dot { background: #4a9e5c; }
      .thymos-toast--error   .thymos-toast__dot { background: #C1121F; }
      .thymos-toast--warning .thymos-toast__dot { background: #D4A017; }
      .thymos-toast--info    .thymos-toast__dot { background: #4a6cc0; }
      .thymos-toast--success { border-color: rgba(74,158,92,0.3); }
      .thymos-toast--error   { border-color: rgba(193,18,31,0.4); }
      .thymos-toast--warning { border-color: rgba(212,160,23,0.3); }
      .thymos-toast--info    { border-color: rgba(74,108,192,0.3); }
    `;
    document.head.appendChild(style);
  }

  // Container
  function getContainer() {
    let c = document.getElementById('thymos-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'thymos-toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  window.toast = function (message, type = 'success', duration = 3000) {
    const container = getContainer();
    const el = document.createElement('div');
    el.className = `thymos-toast thymos-toast--${type}`;
    const dot = document.createElement('span');
    dot.className = 'thymos-toast__dot';
    const msg = document.createElement('span');
    msg.textContent = message;
    el.appendChild(dot);
    el.appendChild(msg);
    container.appendChild(el);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('show'));
    });

    setTimeout(() => {
      el.classList.add('hide');
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, duration);
  };

  // Expose modal helper
  window.confirmModal = function (message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0);z-index:10000;display:flex;align-items:center;justify-content:center;transition:background 0.25s;';
    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-modal', 'true');
    const box = document.createElement('div');
    box.className = 'cm-box';
    box.style.cssText = 'background:var(--surface);border:1px solid rgba(255,255,255,0.1);border-radius:var(--r-lg);padding:1.5rem;max-width:360px;width:90%;font-family:var(--font-body);transform:scale(0.92) translateY(10px);opacity:0;transition:transform 0.3s cubic-bezier(0.22,1,0.36,1),opacity 0.25s;';
    const msgP = document.createElement('p');
    msgP.style.cssText = 'font-size:0.85rem;color:var(--subtle);margin:0 0 1.25rem;line-height:1.6;';
    msgP.textContent = message;
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:0.6rem;justify-content:flex-end;';
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cm-cancel';
    cancelBtn.style.cssText = 'padding:0.4rem 1rem;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--subtle);font-size:0.78rem;cursor:pointer;font-family:inherit;transition:all 0.18s;';
    cancelBtn.textContent = 'Annuler';
    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'cm-confirm';
    confirmBtn.style.cssText = 'padding:0.4rem 1rem;border:1px solid rgba(193,18,31,0.5);border-radius:6px;background:rgba(193,18,31,0.15);color:var(--red);font-size:0.78rem;cursor:pointer;font-family:inherit;transition:all 0.18s;';
    confirmBtn.textContent = 'Confirmer';
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    box.appendChild(msgP);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.style.background = 'rgba(0,0,0,0.7)';
      const box = overlay.querySelector('.cm-box');
      box.style.transform = 'scale(1) translateY(0)';
      box.style.opacity = '1';
    });
    function closeModal() {
      overlay.style.background = 'rgba(0,0,0,0)';
      const box = overlay.querySelector('.cm-box');
      box.style.transform = 'scale(0.95) translateY(5px)';
      box.style.opacity = '0';
      setTimeout(() => overlay.remove(), 250);
    }
    overlay.querySelector('#cm-cancel').onclick  = closeModal;
    overlay.querySelector('#cm-confirm').onclick = () => { closeModal(); setTimeout(onConfirm, 150); };
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  };
})();
