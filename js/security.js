/* ═══════════════════════════════════════════
   THYMOS — SECURITY UTILITIES
   Centralized security functions for XSS prevention,
   input sanitization, and admin access control
════════════════════════════════════════════ */

// ─── XSS PREVENTION ────────────────────────
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const str = String(text);
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── URL SANITIZATION ──────────────────────
function sanitizeUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.href;
  } catch {
    return '';
  }
}

// ─── CSS VALUE SANITIZATION ────────────────
function sanitizeCssUrl(url) {
  if (!url) return 'none';
  // Allow inline raster images (data: URLs) — used for uploaded gym logo / background.
  // Only safe raster types are accepted. data:text/html and data:image/svg+xml are
  // intentionally refused (SVG can embed script / external refs).
  if (/^data:/i.test(url)) {
    if (/^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(url)) {
      return `url("${url.replace(/["\\]/g, '')}")`;
    }
    return 'none';
  }
  const clean = sanitizeUrl(url);
  if (!clean) return 'none';
  // Block javascript: and data:text/html
  if (/javascript:/i.test(clean) || /data:text\/html/i.test(clean)) return 'none';
  return `url(${CSS.escape ? clean : clean.replace(/[()'"\\]/g, '')})`;
}

// ─── ADMIN ACCESS CONTROL ──────────────────
// Admin check via Supabase RPC — no hardcoded UUIDs client-side
async function isAdmin() {
  try {
    const { data, error } = await window.supabase.rpc('is_admin');
    if (error) { console.warn('isAdmin check failed:', error); return false; }
    return data === true;
  } catch {
    return false;
  }
}
