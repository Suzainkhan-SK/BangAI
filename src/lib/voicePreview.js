/**
 * Robust Client-Side Voice Synthesis & Polling Utility
 * Handles immediate returns (ElevenLabs / cached) and async renders (JSON2Video)
 * Includes browser user-activation priming to guarantee playback after long renders.
 */

// 44-byte silent WAV audio to prime browser autoplay permission during user click
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/**
 * Creates and primes an Audio element during an active user click event.
 * Calling this synchronously when the user clicks guarantees that subsequent
 * .play() calls on this element will NEVER be blocked by the browser's
 * autoplay policy, even if the render takes 15–25 seconds.
 */
export function createPrimedAudio() {
  const audio = new Audio();
  try {
    audio.src = SILENT_WAV;
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {});
    }
  } catch (e) {}
  return audio;
}

/**
 * Synthesizes voice audio preview and polls until completed if asynchronous.
 * Supports up to 75s timeout to guarantee completion on a single tap.
 */
export async function synthesizeVoicePreview({
  voiceId,
  text,
  speed = 1.10,
  provider = 'elevenlabs',
  maxPollMs = 75000,
  pollIntervalMs = 1200,
  signal
}) {
  if (!voiceId || !text) {
    throw new Error('voiceId and text are required for voice synthesis');
  }

  const trimmedText = String(text).trim().substring(0, 500);

  const res = await fetch('/.netlify/functions/preview-voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voiceId,
      text: trimmedText,
      speed,
      provider
    }),
    signal
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Voice preview request failed with HTTP ${res.status}`);
  }

  // Case 1: Immediately ready (ElevenLabs Native or fast JSON2Video server short poll)
  if (data.audio || data.audioUrl) {
    return data.audioUrl || `data:${data.mimeType || 'audio/mpeg'};base64,${data.audio}`;
  }

  // Case 2: Rendering asynchronously in JSON2Video -> Poll with high resilience
  if (data.project) {
    const projectId = data.project;
    const apiKey = data.apiKey || '';
    const startTime = Date.now();

    while (Date.now() - startTime < maxPollMs) {
      if (signal?.aborted) {
        throw new Error('Synthesis cancelled by user');
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

      const pollUrl = `/.netlify/functions/preview-voice?project=${encodeURIComponent(projectId)}${apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : ''}`;
      try {
        const pollRes = await fetch(pollUrl, { signal });
        if (pollRes.ok) {
          const pollData = await pollRes.json().catch(() => ({}));

          if (pollData.success && (pollData.audioUrl || pollData.audio)) {
            return pollData.audioUrl || `data:${pollData.mimeType || 'audio/mpeg'};base64,${pollData.audio}`;
          }

          if (pollData.status === 'error') {
            throw new Error(pollData.error || 'Voice rendering failed on server');
          }
        }
      } catch (err) {
        // If aborted, throw immediately
        if (signal?.aborted || err.name === 'AbortError') {
          throw err;
        }
        // Transient network error: continue polling until maxPollMs
        console.warn('[VoicePreview] Poll ping hiccup, retrying...', err.message);
      }
    }

    throw new Error('Voice preview rendering timed out. Please retry.');
  }

  throw new Error('No audio returned from voice synthesis service');
}

/**
 * Attaches audio source to primed audio element and plays safely.
 */
export function playPrimedAudio(audio, audioSrc, { volume = 1.0, onEnded, onError } = {}) {
  if (!audio) {
    audio = new Audio();
  }

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.src = audioSrc;
    audio.volume = Math.max(0, Math.min(1, Number(volume) || 1.0));

    if (typeof onEnded === 'function') audio.onended = onEnded;
    if (typeof onError === 'function') audio.onerror = onError;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('[VoicePreview] Playback failed or prevented:', err);
        if (typeof onError === 'function') onError(err);
      });
    }
  } catch (e) {
    if (typeof onError === 'function') onError(e);
  }

  return audio;
}
