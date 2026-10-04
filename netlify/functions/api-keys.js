import { getDb } from './db.js';

// ─── json2video API Keys (Fallback Pool) ───────────────────────────────
const JSON2VIDEO_KEYS = [
  'CclCGmgMXImymZnHctdV2bSfVe38ZlFGPI5BBBOo', // ~363s remaining
  'iuCcWNHGIfA7DZshgdCG5YEJiel4qSMmNPeFU4R7', // ~373s remaining
  'fQWgofoFFcVO9TXD351b6aAYDHedUcM2LnBrF0Gx', // ~368s remaining
  'BfVGdb6AJiYAbFD2FNsokFDfC8eEdrDZEjAHeP6B', // ~332s remaining
  '7iIcxBBivKYJI2Dwh8EecCteEr1LCf2c2fhwfBFk', // ~309s remaining
  'Mcvgc3bcrXvdjCK7SeFvOLVJpdABdogswpiGwfhc', // ~305s remaining
  'bVQPK30nOfHCtUfB7jjYO45U8mIJvZUVgrAGmeEu', // ~288s remaining
  'HjgybeaHuss7IH0sB2EdshSlS3AS7cWXdt78w68O', // ~257s remaining
  'E3ybUBUvDBHEFceM4QoUGxiS6vbnpL0Z87h24Xoi', // ~213s remaining
  'dVpBkFScr1KElvbmUfcuDAENfGLUuBLb74DNr5vp', // ~140s remaining
  'BSMCNOEbA5e4GOFOkfg9f5vYpOQR5cdUk9qPt9dV', // ~68s remaining
  'UyqK9IVQJp6lBewpRcWEk8GjfBjnWLb8y3FZAWD5'  // 1s remaining (exhausted - fallback only)
];

// ─── ElevenLabs API Keys (Fallback Pool) ──────────────────────────────
const ELEVENLABS_KEYS = [
  'sk_958d429799361aca849b92a23e9e6b19234c5be0c187cbe6',
  'sk_eaf61e4e9c923999fdf04319520854968827135e833f3b5d'
];

// Dynamic In-Memory Cached Pools
let activeJson2VideoPool = JSON2VIDEO_KEYS;
let activeElevenLabsPool = ELEVENLABS_KEYS;
let lastPoolFetchTime = 0;
const POOL_TTL_MS = 60 * 1000; // Refresh from DB every 60 seconds

async function refreshKeyPools() {
  const now = Date.now();
  if (now - lastPoolFetchTime < POOL_TTL_MS) return;

  try {
    const db = await getDb();
    if (db) {
      const [j2vDoc, elDoc] = await Promise.all([
        db.collection('api_keys').findOne({ _id: 'json2video_keys' }),
        db.collection('api_keys').findOne({ _id: 'elevenlabs_keys' })
      ]);
      if (j2vDoc && Array.isArray(j2vDoc.pool) && j2vDoc.pool.length > 0) {
        activeJson2VideoPool = j2vDoc.pool;
      }
      if (elDoc && Array.isArray(elDoc.pool) && elDoc.pool.length > 0) {
        activeElevenLabsPool = elDoc.pool;
      }
      lastPoolFetchTime = now;
    }
  } catch (err) {
    console.warn('[api-keys.js] Dynamic key pool read notice:', err.message);
  }
}

// ─── Jamendo API (free tier client_id) ──
const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID || '';

// ─── Round-Robin Indexes ──
let json2videoIndex = 0;
let elevenLabsIndex = 0;

/**
 * Get the next json2video API key (round-robin rotation).
 */
export function getJson2VideoKey() {
  const pool = activeJson2VideoPool;
  const key = pool[json2videoIndex % pool.length];
  json2videoIndex++;
  return key;
}

/**
 * Execute a json2video API call with automatic key rotation and retry.
 */
export async function withJson2VideoRetry(apiCallFn, maxRetries = 3) {
  await refreshKeyPools();
  const pool = activeJson2VideoPool;
  let lastError = null;
  const attempts = Math.min(maxRetries, pool.length);
  for (let i = 0; i < attempts; i++) {
    const key = getJson2VideoKey();
    try {
      const result = await apiCallFn(key);
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`[json2video] Key slot #${(json2videoIndex - 1) % pool.length + 1} failed: ${err.message}`);
    }
  }
  throw new Error(`All json2video keys exhausted after ${attempts} attempts: ${lastError?.message}`);
}

/**
 * Get the next ElevenLabs API key (failover rotation).
 */
export function getElevenLabsKey() {
  const pool = activeElevenLabsPool;
  const key = pool[elevenLabsIndex % pool.length];
  elevenLabsIndex++;
  return key;
}

/**
 * Execute an ElevenLabs API call with automatic key rotation and retry.
 */
export async function withElevenLabsRetry(apiCallFn, maxRetries = 2) {
  await refreshKeyPools();
  const pool = activeElevenLabsPool;
  let lastError = null;
  const attempts = Math.min(maxRetries, pool.length);
  for (let i = 0; i < attempts; i++) {
    const key = getElevenLabsKey();
    try {
      const result = await apiCallFn(key);
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`[ElevenLabs] Key slot #${(elevenLabsIndex - 1) % pool.length + 1} failed: ${err.message}`);
    }
  }
  throw new Error(`All ElevenLabs keys exhausted after ${attempts} attempts: ${lastError?.message}`);
}

/**
 * Get the Jamendo client_id.
 */
export function getJamendoClientId() {
  return JAMENDO_CLIENT_ID;
}

/**
 * Helper: Make a json2video POST /v2/movies request with key rotation.
 * Returns { project, apiKey, ...result }
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
    const data = await res.json();
    return { ...data, apiKey };
  });
}

/**
 * Helper: Poll json2video GET /v2/movies?project={id} using the SAME key that created the project.
 */
export async function json2videoPollUntilDone(projectId, apiKey, pollIntervalMs = 2500, maxPollMs = 120000) {
  const startTime = Date.now();

  if (!apiKey) {
    throw new Error('API key is required for polling json2video project');
  }

  while (Date.now() - startTime < maxPollMs) {
    const res = await fetch(`https://api.json2video.com/v2/movies?project=${projectId}`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey }
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`json2video GET status HTTP ${res.status}: ${errText}`);
    }

    const result = await res.json();
    const movie = result.movie || result;
    const status = movie.status || result.status;

    if (status === 'done') {
      return movie;
    }
    if (status === 'error') {
      throw new Error(`json2video render failed: ${movie.message || movie.error || JSON.stringify(movie)}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`json2video render timed out after ${maxPollMs / 1000}s for project ${projectId}`);
}

export { JSON2VIDEO_KEYS, ELEVENLABS_KEYS };
