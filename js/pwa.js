/* THYMOS — Enregistrement du Service Worker (PWA).
   Silencieux en cas d'échec (ex. ouverture en file://). */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW non enregistré:', e));
  });
}
