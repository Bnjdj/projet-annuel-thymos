/* ═══════════════════════════════════════════
   THYMOS — AUTH.JS
   Supabase Auth: login, register, forgot password
   + Auth guard for dashboard pages
════════════════════════════════════════════ */

// ─── HELPERS ────────────────────────────────
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
}

function clearError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  el.classList.remove('visible');
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.classList.add('loading');
  } else {
    btn.classList.remove('loading');
  }
}

// ─── CARD SWITCHING ─────────────────────────
function showCard(cardId) {
  ['loginCard', 'registerCard', 'forgotCard'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = id === cardId ? 'block' : 'none';
      if (id === cardId) {
        el.style.animation = 'none';
        el.offsetHeight; // force reflow
        el.style.animation = 'tabIn 0.4s var(--ease-out-expo) both';
      }
    }
  });
}

// Nav buttons
document.getElementById('showRegister')?.addEventListener('click', () => showCard('registerCard'));
document.getElementById('showLogin2')?.addEventListener('click', () => showCard('loginCard'));
document.getElementById('showForgot')?.addEventListener('click', () => showCard('forgotCard'));
document.getElementById('backToLogin')?.addEventListener('click', () => showCard('loginCard'));
document.getElementById('backToLogin2')?.addEventListener('click', () => showCard('loginCard'));

// ─── HANDLE PAID REDIRECT ───────────────────
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('paid') === 'true') {
  showCard('registerCard');
  const emailField = document.getElementById('regEmail');
  if (emailField && urlParams.get('email')) {
    emailField.value = decodeURIComponent(urlParams.get('email'));
  }
  // Show success message
  if (typeof toast !== 'undefined') {
    setTimeout(() => toast('Paiement confirme ! Creez votre compte pour acceder a THYMOS.', 'success', 5000), 500);
  }
} else if (urlParams.get('plan') === 'decouverte') {
  showCard('registerCard');
  if (typeof toast !== 'undefined') {
    setTimeout(() => toast('Creez votre compte pour demarrer votre essai gratuit de 30 jours.', 'info', 5000), 500);
  }
} else if (urlParams.get('activate')) {
  // User just paid, redirect to activation after login
  const plan = urlParams.get('activate');
  if (typeof toast !== 'undefined') {
    const safePlan = typeof escapeHtml === 'function' ? escapeHtml(plan) : plan.replace(/[<>"'&]/g, '');
    setTimeout(() => toast('Connectez-vous pour activer votre plan ' + safePlan, 'info', 5000), 500);
  }
} else if (urlParams.get('confirmed') === '1') {
  // Email confirme via le lien Supabase -> retour sur la connexion, on invite a se connecter
  showCard('loginCard');
  if (typeof toast !== 'undefined') {
    setTimeout(() => toast('Adresse confirmée ! Connectez-vous pour accéder à THYMOS.', 'success', 6000), 500);
  }
}

// ─── PASSWORD VISIBILITY ────────────────────
document.querySelectorAll('.pwd-eye').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    const icon = btn.querySelector('use');
    if (icon) icon.setAttribute('href', isPassword ? '#ic-eye-off' : '#ic-eye');
  });
});

// ─── PASSWORD STRENGTH ──────────────────────
const regPassword = document.getElementById('regPassword');
const regPwdFill = document.getElementById('regPwdFill');
const regPwdLabel = document.getElementById('regPwdLabel');

if (regPassword && regPwdFill && regPwdLabel) {
  regPassword.addEventListener('input', () => {
    const v = regPassword.value;
    if (!v) {
      regPwdFill.style.width = '0%';
      regPwdLabel.textContent = '';
      return;
    }
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;

    const levels = [
      { w: '25%', color: '#C1121F', text: 'Faible' },
      { w: '50%', color: '#D4A017', text: 'Moyen' },
      { w: '75%', color: '#7aad7e', text: 'Bon' },
      { w: '100%', color: '#4a9e5c', text: 'Fort' },
    ];
    const lvl = levels[Math.max(0, score - 1)] || levels[0];
    regPwdFill.style.width = lvl.w;
    regPwdFill.style.background = lvl.color;
    regPwdLabel.textContent = lvl.text;
    regPwdLabel.style.color = lvl.color;
  });
}

// ─── LOGIN ──────────────────────────────────
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('loginError');
    setLoading('loginBtn', true);

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });

      if (error) {
        let msg = error.message;
        if (msg === 'Invalid login credentials') msg = 'Email ou mot de passe incorrect.';
        else if (msg.includes('Email not confirmed')) msg = 'Votre email n\'est pas encore confirme. Verifiez votre boite de reception.';
        else if (msg.includes('email_not_confirmed')) msg = 'Votre email n\'est pas encore confirme. Verifiez votre boite de reception.';
        showError('loginError', msg);
        setLoading('loginBtn', false);
        return;
      }

      // Success — redirect to dashboard or activation
      const activatePlan = new URLSearchParams(window.location.search).get('activate');
      if (activatePlan) {
        window.location.href = 'activation.html?plan=' + activatePlan;
      } else {
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      showError('loginError', 'Erreur de connexion. Verifiez votre connexion internet.');
      setLoading('loginBtn', false);
    }
  });
}

// ─── REGISTER ───────────────────────────────
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('registerError');

    const name = document.getElementById('regName').value.trim();
    const lastname = document.getElementById('regLastname').value.trim();
    const gym = document.getElementById('regGym').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const acceptCgu = document.getElementById('acceptCgu').checked;

    if (!acceptCgu) {
      showError('registerError', 'Vous devez accepter les CGU pour continuer.');
      return;
    }

    if (password.length < 8) {
      showError('registerError', 'Le mot de passe doit faire au moins 8 caracteres.');
      return;
    }

    setLoading('registerBtn', true);

    try {
      const { data, error } = await window.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/connexion.html?confirmed=1',
          data: {
            first_name: name,
            last_name: lastname,
            gym_name: gym,
            role: 'owner'
          }
        }
      });

      if (error) {
        const msg = error.message.includes('already registered')
          ? 'Cet email est deja utilise. Connectez-vous ou utilisez un autre email.'
          : error.message;
        showError('registerError', msg);
        setLoading('registerBtn', false);
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required
        showCard('loginCard');
        if (typeof toast !== 'undefined') {
          toast('Compte cree ! Un email de confirmation a ete envoye a ' + email + '. Cliquez sur le lien pour activer votre compte.', 'success', 8000);
        }
        setLoading('registerBtn', false);
        return;
      } else if (data.session) {
        // Auto-confirmed — go to dashboard
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      showError('registerError', 'Erreur lors de la creation du compte.');
      setLoading('registerBtn', false);
    }
  });
}

// ─── FORGOT PASSWORD ────────────────────────
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('forgotError');
    setLoading('forgotBtn', true);

    const email = document.getElementById('forgotEmail').value.trim();

    try {
      const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/connexion.html'
      });

      if (error) {
        showError('forgotError', error.message);
        setLoading('forgotBtn', false);
        return;
      }

      // Show success
      document.getElementById('forgotForm').style.display = 'none';
      document.getElementById('forgotSuccess').style.display = 'block';
    } catch (err) {
      showError('forgotError', 'Erreur. Verifiez votre connexion internet.');
      setLoading('forgotBtn', false);
    }
  });
}

// ─── CHECK IF ALREADY LOGGED IN ─────────────
(async function checkSession() {
  // Only on the connexion page
  if (!document.getElementById('loginForm')) return;

  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session) {
      // Already logged in — redirect to dashboard
      window.location.href = 'dashboard.html';
    }
  } catch (err) {
    // Not logged in, stay on login page
  }
})();
