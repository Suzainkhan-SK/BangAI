// Shared API Key Rotation Module
// Provides round-robin key rotation for json2video, ElevenLabs, and Jamendo APIs

// ─── json2video API Keys (12 keys) ────────────────────────────────────
const JSON2VIDEO_KEYS = [
  'UyqK9IVQJp6lBewpRcWEk8GjfBjnWLb8y3FZAWD5',
  'BSMCNOEbA5e4GOFOkfg9f5vYpOQR5cdUk9qPt9dV',
  'dVpBkFScr1KElvbmUfcuDAENfGLUuBLb74DNr5vp',
  'E3ybUBUvDBHEFceM4QoUGxiS6vbnpL0Z87h24Xoi',
  'HjgybeaHuss7IH0sB2EdshSlS3AS7cWXdt78w68O',
  'bVQPK30nOfHCtUfB7jjYO45U8mIJvZUVgrAGmeEu',
  'Mcvgc3bcrXvdjCK7SeFvOLVJpdABdogswpiGwfhc',
  '7iIcxBBivKYJI2Dwh8EecCteEr1LCf2c2fhwfBFk',
  'BfVGdb6AJiYAbFD2FNsokFDfC8eEdrDZEjAHeP6B',
  'fQWgofoFFcVO9TXD351b6aAYDHedUcM2LnBrF0Gx',
  'iuCcWNHGIfA7DZshgdCG5YEJiel4qSMmNPeFU4R7',
  'CclCGmgMXImymZnHctdV2bSfVe38ZlFGPI5BBBOo'
];

// ─── ElevenLabs API Keys (2 keys) ─────────────────────────────────────
const ELEVENLABS_KEYS = [
  'sk_958d429799361aca849b92a23e9e6b19234c5be0c187cbe6',
  'sk_eaf61e4e9c923999fdf04319520854968827135e833f3b5d'
];

// ─── Jamendo API (free tier client_id) ──
const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID || '';

// ─── Round-Robin Indexes ──
let json2videoIndex = 0;
let elevenLabsIndex = 0;

/**
 * Get the next json2video API key (round-robin rotation).
 */
export function getJson2VideoKey() {
  const key = JSON2VIDEO_KEYS[json2videoIndex % JSON2VIDEO_KEYS.length];
  json2videoIndex++;
  return key;
}

/**
 * Execute a json2video API call with automatic key rotation and retry.
 */
export async function withJson2VideoRetry(apiCallFn, maxRetries = 3) {
  let lastError = null;
  for (let i = 0; i < Math.min(maxRetries, JSON2VIDEO_KEYS.length); i++) {
    const key = getJson2VideoKey();
    try {
      const result = await apiCallFn(key);
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`[json2video] Key index ${(json2videoIndex - 1) % JSON2VIDEO_KEYS.length} failed: ${err.message}`);
    }
  }
  throw new Error(`All json2video keys exhausted after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Get the next ElevenLabs API key (failover rotation).
 */
export function getElevenLabsKey() {
  const key = ELEVENLABS_KEYS[elevenLabsIndex % ELEVENLABS_KEYS.length];
  elevenLabsIndex++;
  return key;
}

/**
 * Execute an ElevenLabs API call with automatic key rotation and retry.
 */
export async function withElevenLabsRetry(apiCallFn, maxRetries = 2) {
  let lastError = null;
  for (let i = 0; i < Math.min(maxRetries, ELEVENLABS_KEYS.length); i++) {
    const key = getElevenLabsKey();
    try {
      const result = await apiCallFn(key);
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`[ElevenLabs] Key index ${(elevenLabsIndex - 1) % ELEVENLABS_KEYS.length} failed: ${err.message}`);
    }
  }
  throw new Error(`All ElevenLabs keys exhausted after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Get the Jamendo client_id.
 */
export function getJamendoClientId() {
  return JAMENDO_CLIENT_ID;
}

/**
 * Helper: Make a json2video POST /v2/movies request with key rotation.
 */
export async function json2videoCreateMovie(moviePayload) {
  return withJson2VideoRetry(async (apiKey) => {
    const res = await fetch('https://api.json2video.com/v2/movies', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(moviePayload)
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`json2video POST /v2/movies HTTP ${res.status}: ${errText}`);
    }
    return res.json();
  });
}

/**
 * Helper: Poll json2video GET /v2/movies?project={id} until done or error.
 */
export async function json2videoPollUntilDone(projectId, pollIntervalMs = 3000, maxPollMs = 120000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxPollMs) {
    const result = await withJson2VideoRetry(async (apiKey) => {
      const res = await fetch(`https://api.json2video.com/v2/movies?project=${projectId}`, {
        method: 'GET',
        headers: { 'x-api-key': apiKey }
      });
      if (!res.ok) {
        throw new Error(`json2video GET status HTTP ${res.status}`);
      }
      return res.json();
    });

    const movie = result.movie || result;
    const status = movie.status || result.status;

    if (status === 'done') {
      return movie;
    }
    if (status === 'error') {
      throw new Error(`json2video render failed: ${movie.error || JSON.stringify(movie)}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`json2video render timed out after ${maxPollMs / 1000}s for project ${projectId}`);
}

export { JSON2VIDEO_KEYS, ELEVENLABS_KEYS };
