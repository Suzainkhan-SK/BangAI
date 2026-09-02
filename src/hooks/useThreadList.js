import { useState, useEffect, useCallback } from 'react';

const CACHE_KEY = 'shortsai_all_threads';
const SESSION_ID_KEY = 'shortsai_session_id';

// Read-only view of the user's threads, for chrome (sidebar) rendered outside DashboardApp.
// DashboardApp keeps owning the live/mutable copy — this hook never writes threads back.
export function useThreadList() {
  const [threads, setThreads] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      return Array.isArray(cached) ? cached : [];
    } catch (e) { return []; }
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/.netlify/functions/threads?sessionId=${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.threads)) setThreads(data.threads);
      }
    } catch (err) {
      console.warn('[useThreadList] refresh failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { threads, loading, refresh };
}
