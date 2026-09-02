import { useState, useEffect, useCallback } from 'react';
import { VOICES as STATIC_VOICES, JSON2VIDEO_VOICES, getAllVoices, loadJson2VideoVoices } from '../data/voices.js';

export function useVoiceCatalog() {
  const [ready, setReady] = useState(JSON2VIDEO_VOICES.length > 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (JSON2VIDEO_VOICES.length > 0) { setReady(true); return; }
    setLoading(true); setError('');
    loadJson2VideoVoices()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) setReady(true);
        else setError('The premium voice catalog came back empty.');
      })
      .catch((err) => setError(err?.message || 'Could not load the premium voice catalog.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // `ready` is the render trigger the module array can never be.
  return { ready, loading, error, reload: load, premiumVoices: JSON2VIDEO_VOICES, staticVoices: STATIC_VOICES, getAllVoices };
}
