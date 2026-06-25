export const TABLE_COUNT = 13;

const STORAGE_KEY        = 'dk:table';
const SESSION_KEY        = 'dk:session';
const SESSION_EXPIRY_KEY = 'dk:session-expiry';
const LAST_ORDER_KEY     = 'dk:last-order';

const SESSION_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours
const COOLDOWN_MS         = 30 * 1000;           // 30 seconds between orders per device

// ── Table binding ─────────────────────────────────────────────────────────

export function initTableSession() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('table');
  if (raw !== null) {
    const num = parseInt(raw, 10);
    if (Number.isInteger(num) && num >= 1 && num <= TABLE_COUNT) {
      try { localStorage.setItem(STORAGE_KEY, String(num)); } catch {}
      return num;
    }
  }
  return getTableNumber();
}

export function getTableNumber() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const num = parseInt(stored, 10);
      if (Number.isInteger(num) && num >= 1 && num <= TABLE_COUNT) return num;
    }
  } catch {}
  return null;
}

export function clearTableSession() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ── Device session identity (one UUID per browser, 6-hour TTL) ───────────

export function getOrCreateSessionId() {
  try {
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
    const id     = localStorage.getItem(SESSION_KEY);
    if (id && expiry && Date.now() < parseInt(expiry, 10)) return id;
    // Expired or missing — create new
    const newId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, newId);
    localStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION_MS));
    return newId;
  } catch {
    return crypto.randomUUID();
  }
}

export function refreshSessionExpiry() {
  try { localStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION_MS)); } catch {}
}

// ── Per-device order cooldown (30 s between submissions) ─────────────────

export function getCooldownRemaining() {
  try {
    const last = localStorage.getItem(LAST_ORDER_KEY);
    if (!last) return 0;
    return Math.max(0, Math.ceil((COOLDOWN_MS - (Date.now() - parseInt(last, 10))) / 1000));
  } catch { return 0; }
}

export function recordOrderPlaced() {
  try { localStorage.setItem(LAST_ORDER_KEY, String(Date.now())); } catch {}
}

export function clearOrderCooldown() {
  try { localStorage.removeItem(LAST_ORDER_KEY); } catch {}
}
