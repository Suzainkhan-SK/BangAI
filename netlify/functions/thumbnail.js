// Netlify Serverless Function: thumbnail
// Path: /.netlify/functions/thumbnail
// Provides 100% Secure Server-Side Proxy for Vision & Image Generation APIs
// Eliminates raw API key exposure in client-side browser bundles and DevTools

import { getDb } from './db.js';

const BASE_API_URL = 'https://api.kie.ai/api/v1/jobs';
const CDN_UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-base64-upload';

// Cached key pool in memory across serverless warm executions
let cachedKeyPool = null;
let lastPoolFetchTime = 0;
const POOL_TTL_MS = 60 * 1000; // Refresh from DB every 60 seconds
let currentKeyIndex = 0;

// Hardcoded fallback keys for offline/disconnected resilience
const FALLBACK_KEYS = [
  '05ac939d323c2500f085f9b9ba235e85',
  'e69cdf52c51effcfebfeb44e508c8e40',
  'bb19f8a8b94e785f7f8cf7955ed165a6',
  'a12309554b342ed9d3d5577d4079cae0',
  '2157c9fa712b2064b7a781139c8122d0'
];

async function getKeyPool() {
  const now = Date.now();
  if (cachedKeyPool && (now - lastPoolFetchTime < POOL_TTL_MS)) {
    return cachedKeyPool;
  }

  try {
    const db = await getDb();
    if (db) {
      const doc = await db.collection('api_keys').findOne({ _id: 'thumbnail_keys' });
      if (doc && Array.isArray(doc.pool) && doc.pool.length > 0) {
        cachedKeyPool = doc.pool;
        lastPoolFetchTime = now;
        return cachedKeyPool;
      }
    }
  } catch (err) {
    console.warn('[thumbnail.js] MongoDB key pool read failed, using environment/fallback:', err.message);
  }

  // Check Netlify Environment Variable
  const envKeys = process.env.THUMBNAIL_API_KEYS;
  if (envKeys) {
    cachedKeyPool = envKeys.split(',').map(k => k.trim()).filter(Boolean);
    lastPoolFetchTime = now;
    return cachedKeyPool;
  }

  cachedKeyPool = FALLBACK_KEYS;
  lastPoolFetchTime = now;
  return cachedKeyPool;
}

function getActiveKey(pool) {
  if (!pool || pool.length === 0) return FALLBACK_KEYS[0];
  return pool[currentKeyIndex % pool.length];
}

function rotateKey(pool) {
  if (pool && pool.length > 0) {
    currentKeyIndex = (currentKeyIndex + 1) % pool.length;
    console.log(`[thumbnail.js] Rotated to key slot #${currentKeyIndex + 1}`);
  }
}

export const handler = async (event, context) => {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  const action = event.queryStringParameters?.action || 'createTask';
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      body = {};
    }
  }

  const pool = await getKeyPool();

  // ── ACTION 1: CREATE THUMBNAIL TASK ─────────────────────────
  if (action === 'createTask') {
    const { model, input } = body;
    if (!model || !input) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing model or input in request body' })
      };
    }

    let lastError = null;
    const maxAttempts = pool.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const key = getActiveKey(pool);
      try {
        const res = await fetch(`${BASE_API_URL}/createTask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({ model, input })
        });

        // Handle credit exhaustion, unauthorized, or rate limits
        if (res.status === 401 || res.status === 402 || res.status === 429) {
          rotateKey(pool);
          continue;
        }

        const json = await res.json();

        if (json.code === 402 || (json.msg && /insufficient|balance|credit/i.test(json.msg))) {
          rotateKey(pool);
          continue;
        }

        if (json.code !== 200 || !json.data?.taskId) {
          throw new Error(json.msg || `Task creation failed with code ${json.code}`);
        }

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            taskId: json.data.taskId,
            modelId: model,
            state: 'waiting'
          })
        };
      } catch (err) {
        lastError = err;
        rotateKey(pool);
      }
    }

    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({
        error: `All thumbnail generation keys failed or exhausted: ${lastError?.message || 'Unknown error'}`
      })
    };
  }

  // ── ACTION 2: POLL TASK RECORD INFO ────────────────────────
  if (action === 'pollTask') {
    const taskId = event.queryStringParameters?.taskId || body.taskId;
    if (!taskId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing taskId' })
      };
    }

    const key = getActiveKey(pool);
    try {
      const res = await fetch(`${BASE_API_URL}/recordInfo?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      const json = await res.json();

      if (json.code === 200 && json.data) {
        const state = json.data.state;
        let resultUrl = null;

        if (state === 'success') {
          if (json.data.resultJson) {
            try {
              const parsed = JSON.parse(json.data.resultJson);
              resultUrl = parsed.resultUrls?.[0] || parsed.resultUrl || parsed.output?.[0] || parsed.images?.[0];
            } catch {
              resultUrl = json.data.resultJson;
            }
          }
          if (!resultUrl && json.data.resultUrls?.length) {
            resultUrl = json.data.resultUrls[0];
          }
          if (!resultUrl && json.data.response?.resultUrls?.length) {
            resultUrl = json.data.response.resultUrls[0];
          }
        }

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            state,
            resultUrl,
            failReason: json.data.failReason || null,
            costTime: json.data.costTime || null
          })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          code: json.code,
          msg: json.msg || 'Record info query pending'
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  // ── ACTION 3: CDN UPLOAD (REFERENCE IMAGE) ─────────────────
  if (action === 'uploadImage') {
    const { base64Data, fileName = 'reference_image.png', uploadPath = 'images' } = body;
    if (!base64Data) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing base64Data' })
      };
    }

    const key = getActiveKey(pool);
    try {
      const res = await fetch(CDN_UPLOAD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({ base64Data, fileName, uploadPath })
      });

      const json = await res.json();
      const downloadUrl = json?.data?.downloadUrl || json?.data?.url || json?.url;
      if (!res.ok || !downloadUrl) {
        return {
          statusCode: res.status || 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: json.msg || 'CDN upload failed' })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, downloadUrl })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  return {
    statusCode: 400,
    headers: corsHeaders,
    body: JSON.stringify({ error: `Unknown action: ${action}` })
  };
};
