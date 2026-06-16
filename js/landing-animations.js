/* ═══════════════════════════════════════════
   THYMOS — LANDING ANIMATIONS
   Smooth fade-in au scroll + hero entrance.
   Requires: gsap + ScrollTrigger
════════════════════════════════════════════ */

(function () {
  'use strict';
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Nettoyer les styles inline de main.js avant toute animation
  document.querySelectorAll(
    '.scenario-card, .feat-v2, .step-v2, .pcard, .faq-item, ' +
    '.whoisitfor-item, .ba-col, .solution-item, .price-compare__item, ' +
    '.section-header, .solution-block, .ba-grid'
  ).forEach(function (el) {
    el.style.removeProperty('opacity');
    el.style.removeProperty('transform');
    el.style.removeProperty('transition');
  });

  // ── Hero entrance — smooth staggered reveal ──
  var heroContent = document.querySelector('.hero__content');
  var heroVisual = document.querySelector('.hero__visual');

  if (heroContent) {
    gsap.from(heroContent, {
      opacity: 0,
      y: 20,
      duration: 1,
      ease: 'power2.out'
    });
  }
  if (heroVisual) {
    gsap.from(heroVisual, {
      opacity: 0,
      y: 30,
      duration: 1.2,
      delay: 0.3,
      ease: 'power2.out'
    });
  }

  // ── Grouped elements — staggered reveal within sections ──
  var groups = [
    { selector: '.scenario-card', parent: '.scenario-grid' },
    { selector: '.solution-item', parent: '.solution-grid' },
    { selector: '.whoisitfor-item', parent: '.whoisitfor-grid' },
    { selector: '.feat-v2', parent: '.features-grid-v2' },
    { selector: '.ba-col', parent: '.ba-grid' },
    { selector: '.step-v2', parent: '.steps-v2' },
    { selector: '.pcard', parent: '.pricing-grid-v2' },
    { selector: '.price-compare__item', parent: '.price-compare__grid' },
    { selector: '.faq-item', parent: '.faq-grid' }
  ];

  groups.forEach(function (group) {
    var container = document.querySelector(group.parent);
    var items = document.querySelectorAll(group.selector);
    if (!container || items.length === 0) return;

    gsap.from(items, {
      opacity: 0,
      y: 10,
      duration: 0.8,
      stagger: 0.06,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: container,
        start: 'top 90%',
        once: true
      }
    });
  });

  // ── Single elements — individual fade-in ──
  var singles = document.querySelectorAll(
    '.section-tag, .section-title, .section-sub, ' +
    '.solution-block, ' +
    '.step-v2__connector, ' +
    '.price-compare__title, ' +
    '.cta-final__title, .cta-final__sub, .cta-final .btn--primary, .cta-legal'
  );

  singles.forEach(function (el) {
    gsap.from(el, {
      opacity: 0,
      y: 10,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        once: true
      }
    });
  });

  // Recalculer les positions ScrollTrigger apres le rendu initial
  setTimeout(function () {
    ScrollTrigger.refresh();
  }, 200);

})();
