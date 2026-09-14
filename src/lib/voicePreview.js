/**
 * Robust Client-Side Voice Synthesis & High-Resilience Audio Playback Utility
 * Features:
 * 1. Web Audio API (AudioContext) gesture unlocking to bypass browser autoplay limits.
 * 2. Active silent keep-alive looping on HTMLAudioElement during render wait.
 * 3. Automatic failover: HTMLAudioElement -> Web Audio API decodeAudioData playback.
 * 4. Resilient serverless polling up to 90s for JSON2Video and ElevenLabs.
 */

// 44-byte silent WAV data URI
const SILENT_AUDIO = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

let globalAudioCtx = null;
let activeWebAudioSource = null;

/**
 * Unlocks or resumes the Web Audio API AudioContext during a user gesture (click/tap).
 * Once transitioned to 'running', it remains unlocked for the lifetime of the page.
 */
export function unlockAudioContext() {
  try {
    if (!globalAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        globalAudioCtx = new AudioCtx();
      }
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
  } catch (e) {}
  return globalAudioCtx;
}

/**
 * Synchronously creates and primes an Audio element during a user click event.
 * Keeps the audio element actively playing a silent loop during the 10-25s render
 * so the browser's media session pipeline does not expire.
 */
export function createPrimedAudio() {
  unlockAudioContext();

  const audio = new Audio();
  try {
    audio.src = SILENT_AUDIO;
    audio.loop = true; // Stay in playing state during long renders
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {});
    }
  } catch (e) {}
  return audio;
}

/**
 * Plays audio using Web Audio API buffer decoding.
 * Completely immune to HTML5 Audio autoplay policy once AudioContext is resumed.
 */
export async function playWithWebAudio(audioSrc, { volume = 1.0, onEnded, onTimeUpdate } = {}) {
  try {
    const ctx = unlockAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    let arrayBuffer = null;

    if (audioSrc.startsWith('data:')) {
      const base64Index = audioSrc.indexOf('base64,');
      const base64 = base64Index !== -1 ? audioSrc.substring(base64Index + 7) : audioSrc;
      const binaryStr = atob(base64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else {
      const res = await fetch(audioSrc);
      arrayBuffer = await res.arrayBuffer();
    }

    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    // Stop any previously playing web audio source
    if (activeWebAudioSource) {
      try { activeWebAudioSource.stop(); } catch (e) {}
      activeWebAudioSource = null;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = Math.max(0, Math.min(1, Number(volume) || 1.0));

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    const startTime = ctx.currentTime;
    let timeInterval = null;

    if (typeof onTimeUpdate === 'function') {
      timeInterval = setInterval(() => {
        const elapsed = ctx.currentTime - startTime;
        if (elapsed <= audioBuffer.duration) {
          onTimeUpdate(elapsed, audioBuffer.duration);
        } else {
          clearInterval(timeInterval);
        }
      }, 100);
    }

    source.onended = () => {
      if (timeInterval) clearInterval(timeInterval);
      activeWebAudioSource = null;
      if (typeof onEnded === 'function') onEnded();
    };

    activeWebAudioSource = source;
    source.start(0);

    return {
      duration: audioBuffer.duration,
      stop: () => {
        if (timeInterval) clearInterval(timeInterval);
        try { source.stop(); } catch (e) {}
        activeWebAudioSource = null;
      }
    };
  } catch (err) {
    console.warn('[VoicePreview] Web Audio playback failed:', err.message);
    return false;
  }
}

/**
 * Synthesizes voice audio preview and polls until completed if asynchronous.
 * Supports up to 90s timeout to guarantee completion on a single tap.
 */
export async function synthesizeVoicePreview({
  voiceId,
  text,
  speed = 1.10,
  provider = 'elevenlabs',
  maxPollMs = 90000,
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

  // Helper to format playable audio src
  const formatAudioSrc = (item) => {
    if (item.audio) {
      return `data:${item.mimeType || 'audio/mpeg'};base64,${item.audio}`;
    }
    return item.audioUrl || null;
  };

  // Case 1: Immediately ready (ElevenLabs Native or fast JSON2Video server short poll)
  if (data.audio || data.audioUrl) {
    const src = formatAudioSrc(data);
    if (src) return src;
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

          if (pollData.success && (pollData.audio || pollData.audioUrl)) {
            return formatAudioSrc(pollData);
          }

          if (pollData.status === 'error') {
            throw new Error(pollData.error || 'Voice rendering failed on server');
          }
        }
      } catch (err) {
        if (signal?.aborted || err.name === 'AbortError') {
          throw err;
        }
        console.warn('[VoicePreview] Poll ping hiccup, retrying...', err.message);
      }
    }

    throw new Error('Voice preview rendering timed out. Please retry.');
  }

  throw new Error('No audio returned from voice synthesis service');
}

/**
 * Attaches audio source to primed audio element and plays safely.
 * If HTML5 Audio playback is rejected by browser policy, automatically
 * falls back to Web Audio API buffer playback.
 */
export function playPrimedAudio(audio, audioSrc, { volume = 1.0, onEnded, onError, onTimeUpdate } = {}) {
  unlockAudioContext();

  if (!audio) {
    audio = new Audio();
  }

  try {
    audio.pause();
    audio.loop = false;
    audio.src = audioSrc;
    audio.volume = Math.max(0, Math.min(1, Number(volume) || 1.0));

    if (typeof onEnded === 'function') audio.onended = onEnded;
    if (typeof onError === 'function') audio.onerror = onError;
    if (typeof onTimeUpdate === 'function') audio.ontimeupdate = onTimeUpdate;

    audio.load();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(async (err) => {
        console.warn('[VoicePreview] HTMLAudio play failed, switching to Web Audio API fallback:', err.message);
        const webAudioSuccess = await playWithWebAudio(audioSrc, {
          volume,
          onEnded,
          onTimeUpdate: (currentTime, duration) => {
            if (typeof onTimeUpdate === 'function') {
              audio.currentTime = currentTime;
              onTimeUpdate();
            }
          }
        });
        if (!webAudioSuccess) {
          if (typeof onError === 'function') onError(err);
        }
      });
    }
  } catch (e) {
    console.warn('[VoicePreview] Playback exception, switching to Web Audio fallback:', e.message);
    playWithWebAudio(audioSrc, { volume, onEnded }).then(res => {
      if (!res && typeof onError === 'function') onError(e);
    });
  }

  return audio;
}
