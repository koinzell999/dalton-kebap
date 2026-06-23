// Shared table-session helper used by kitchen.html and cashier.html.
// The React app uses src/lib/tableSession.js (same logic, ES module).

const TABLE_COUNT = 13;
const STORAGE_KEY = 'dk:table';

window.TableSession = {
  init() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('table');
    if (raw !== null) {
      const num = parseInt(raw, 10);
      if (Number.isInteger(num) && num >= 1 && num <= TABLE_COUNT) {
        try { localStorage.setItem(STORAGE_KEY, String(num)); } catch {}
        return num;
      }
    }
    return this.get();
  },

  get() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const num = parseInt(stored, 10);
        if (Number.isInteger(num) && num >= 1 && num <= TABLE_COUNT) return num;
      }
    } catch {}
    return null;
  },

  clear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  },
};
