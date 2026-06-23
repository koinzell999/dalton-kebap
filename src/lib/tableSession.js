export const TABLE_COUNT = 13;
const STORAGE_KEY = 'dk:table';

/**
 * Called once on app load.
 * If ?table=N is present in the URL and valid (1–13), persists it to
 * localStorage and returns it.  Otherwise returns whatever was stored
 * from a previous visit, or null if nothing valid is found.
 */
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

/** Returns the stored table number (1–13) or null. */
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

/** Removes the table binding from localStorage (e.g. after paying). */
export function clearTableSession() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
