/* ═══════════════════════════════════════════
   THYMOS PLATFORM — MAIN.JS v3
   Scroll reveals, counters, nav, micro-interactions
════════════════════════════════════════════ */

// ─── NAV SCROLL ────────────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
}

// ─── BURGER MENU ───────────────────────────
const burger     = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = document.querySelectorAll('.mobile-link');

if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ─── SCROLL REVEAL — Stagger on enter ──────
// Skip if GSAP is loaded (landing-animations.js handles it)
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  // GSAP takes over — skip the CSS-based reveal system
} else {

const revealElements = document.querySelectorAll(
  '.scenario-card, .feat-v2, .step-v2, .pcard, .faq-item, ' +
  '.whoisitfor-item, .ba-col, .solution-item, .price-compare__item, ' +
  '.proof-stat, .feature-card, .step, .pricing-card, .ia-features-list li'
);

// Initial state
revealElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translate3d(0, 30px, 0) scale(0.97)';
  el.style.transition = 'none';
});

const revealObserver = new IntersectionObserver((entries) => {
  // Group entries by parent to stagger siblings
  const groups = new Map();
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const parent = entry.target.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(entry.target);
  });

  groups.forEach((elements) => {
    elements.forEach((el, i) => {
      // Stagger 60ms per sibling
      const delay = i * 60;
      setTimeout(() => {
        el.style.transition = 'opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.opacity = '1';
        el.style.transform = 'translate3d(0, 0, 0) scale(1)';
      }, delay);
      revealObserver.unobserve(el);
    });
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

// ─── SECTION HEADERS REVEAL ─────────────────
const sectionHeaders = document.querySelectorAll('.section-header, .solution-block, .ba-grid');
sectionHeaders.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translate3d(0, 24px, 0)';
  el.style.transition = 'none';
});

const headerObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
    entry.target.style.opacity = '1';
    entry.target.style.transform = 'translate3d(0, 0, 0)';
    headerObserver.unobserve(entry.target);
  });
}, { threshold: 0.15 });

sectionHeaders.forEach(el => headerObserver.observe(el));

} // end else (no GSAP)

// ─── COUNTER ANIMATION ─────────────────────
function animateCounter(el, target, duration = 1200) {
  let start = 0;
  const increment = target / (duration / 16);
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(start);
    }
  }, 16);
}

// Old stats-bar (v1 compat)
const statsSection = document.querySelector('.stats-bar');
let statsAnimated = false;
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !statsAnimated) {
      statsAnimated = true;
      document.querySelectorAll('.stat-number[data-target]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.target));
      });
    }
  });
}, { threshold: 0.3 });
if (statsSection) statsObserver.observe(statsSection);

// New proof-stats (v3)
const proofSection = document.querySelector('.proof-stats');
let proofAnimated = false;
const proofObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !proofAnimated) {
      proofAnimated = true;
      document.querySelectorAll('.proof-stat__number[data-target]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.target));
      });
    }
  });
}, { threshold: 0.3 });
if (proofSection) proofObserver.observe(proofSection);

// ─── HERO MOCKUP — AI text (static, no typewriter) ───
// Removed typewriter effect — unprofessional flicker

// ─── CHAT TYPING ANIMATION (IA section) ────
// Retiré : ce bloc écrivait une fausse réponse IA codée en dur
// (« Camp genere… ») via setTimeout. L'IA n'étant pas encore disponible,
// aucune réponse n'est simulée pour rester honnête sur l'état du produit.

// ─── CTA FORM (legacy) ─────────────────────
const ctaForm = document.getElementById('ctaForm');
if (ctaForm) {
  ctaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = ctaForm.querySelector('button[type="submit"]');
    btn.textContent = 'Inscription enregistree !';
    btn.style.background = '#1a7a1a';
    btn.style.borderColor = '#1a7a1a';
    btn.disabled = true;
  });
}

// ─── MOBILE STICKY CTA ─────────────────────
const mobileCta = document.getElementById('mobileCta');
if (mobileCta) {
  let lastScrollY = 0;
  const heroSection = document.querySelector('.hero');

  window.addEventListener('scroll', () => {
    const heroBottom = heroSection ? heroSection.offsetTop + heroSection.offsetHeight : 600;
    // Show after hero, hide when scrolling up fast
    if (window.scrollY > heroBottom) {
      mobileCta.classList.add('visible');
    } else {
      mobileCta.classList.remove('visible');
    }
    lastScrollY = window.scrollY;
  }, { passive: true });
}

// ─── SMOOTH PARALLAX on hero mockup ────────
// Skip if GSAP handles parallax
const heroVisual = document.querySelector('.hero__visual');
if (heroVisual && window.innerWidth > 768 && typeof gsap === 'undefined') {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled < 800) {
      const offset = scrolled * 0.08;
      heroVisual.style.transform = `translateY(${offset}px)`;
    }
  }, { passive: true });
}
