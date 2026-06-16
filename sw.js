/* ═══════════════════════════════════════════
   THYMOS — Service Worker (PWA)
   Cache runtime « network-first » pour les ressources
   same-origin (HTML/CSS/JS/SVG). Les appels Supabase et
   les CDN externes ne sont JAMAIS interceptés.
════════════════════════════════════════════ */
const CACHE = 'thymos-v2';

self.addEventListener('install', (e) => {
  // Pré-cache minimal et tolérant aux 404 (n'échoue pas l'installation)
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(['/', '/index.html', '/favicon-v2.svg']).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                     // ne pas toucher POST/PUT/DELETE
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // ignorer Supabase + CDN externes

  // Network-first : données fraîches, fallback cache hors-ligne
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/index.html')))
  );
});
