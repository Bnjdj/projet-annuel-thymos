/* ═══════════════════════════════════════════
   THYMOS — Service Worker (PWA)
   Cache runtime « network-first » pour les SOUS-RESSOURCES
   same-origin (CSS/JS/SVG). Les navigations HTML ne sont
   PAS mises en cache (netlify les veut toujours fraîches) et
   ne sont JAMAIS remplacées par une autre page. Les appels
   Supabase et les CDN externes ne sont jamais interceptés.
   v3 : supprime l'ancien fallback index.html qui renvoyait
   par erreur vers l'accueil quand une page échouait à charger.
════════════════════════════════════════════ */
const CACHE = 'thymos-v3';

function offlineResponse() {
  return new Response(
    '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>Hors ligne — THYMOS</title></head>'
    + '<body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#e8e8e8;'
    + 'display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:2rem">'
    + '<div><h1 style="font-weight:800;letter-spacing:.05em">Hors ligne</h1>'
    + '<p style="color:#9a9a9a">Vérifiez votre connexion internet puis rechargez la page.</p>'
    + '<p><a href="" onclick="location.reload();return false" style="color:#C1121F">Réessayer</a></p>'
    + '</div></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

self.addEventListener('install', (e) => {
  // Pré-cache minimal et tolérant aux 404 (n'échoue pas l'installation)
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(['/favicon-v2.svg']).catch(() => {}))
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

  const isNavigation = req.mode === 'navigate';

  e.respondWith(
    fetch(req)
      .then((res) => {
        // Ne cacher QUE les sous-ressources statiques valides — jamais les navigations HTML
        // (netlify.toml sert le HTML en max-age=0/must-revalidate).
        if (res && res.ok && res.type === 'basic' && !isNavigation) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => {
        // Hors-ligne : une navigation reçoit une page « Hors ligne » neutre
        // (jamais une autre page de l'app). Les sous-ressources retombent sur le cache.
        if (isNavigation) return offlineResponse();
        return caches.match(req).then((cached) => cached || Response.error());
      })
  );
});
