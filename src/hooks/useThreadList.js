import { useState, useEffect, useCallback } from 'react';
import { getAuthToken, getStoredUser } from '../utils/authClient';

const CACHE_KEY = 'shortsai_all_threads';
const SESSION_ID_KEY = 'shortsai_session_id';

// Read-only view of the user's threads, for chrome (sidebar) rendered outside DashboardApp.
// DashboardApp keeps owning the live/mutable copy — this hook never writes threads back.
export function useThreadList(customUser = null) {
  const [threads, setThreads] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      return Array.isArray(cached) ? cached : [];
    } catch (e) { return []; }
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    const token = getAuthToken();
    const user = customUser || getStoredUser();
    const uid = user?.id || user?.userId || user?._id || '';

    setLoading(true);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = uid
        ? `/.netlify/functions/threads?userId=${encodeURIComponent(uid)}&sessionId=${encodeURIComponent(sessionId || '')}`
        : (sessionId ? `/.netlify/functions/threads?sessionId=${encodeURIComponent(sessionId)}` : '');

      if (!url) {
        setThreads([]);
        setLoading(false);
        return;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.threads)) {
          setThreads(data.threads);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data.threads));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('[useThreadList] refresh failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, [customUser]);

  useEffect(() => { refresh(); }, [refresh]);

  return { threads, loading, refresh };
}
