import { useEffect, useRef, useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';

const TIMEOUT_MS = 15 * 60 * 1000;   // 15 minutes
const WARNING_MS = 14 * 60 * 1000;   // warn at 14 minutes

export function useInactivityLogout(onLogout) {
  const timerRef = useRef(null);
  const warnRef = useRef(null);
  const onLogoutRef = useRef(onLogout);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => { onLogoutRef.current = onLogout; });

  useEffect(() => {
    function reset() {
      setShowWarning(false);
      clearTimeout(timerRef.current);
      clearTimeout(warnRef.current);

      warnRef.current = setTimeout(() => {
        setShowWarning(true);
      }, WARNING_MS);

      timerRef.current = setTimeout(async () => {
        const auth = getAuth();
        try { await signOut(auth); } catch {}
        onLogoutRef.current?.();
      }, TIMEOUT_MS);
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      clearTimeout(timerRef.current);
      clearTimeout(warnRef.current);
    };
  }, []);

  return { showWarning };
}
