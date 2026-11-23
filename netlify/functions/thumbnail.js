// Netlify Serverless Function: thumbnail
// Path: /.netlify/functions/thumbnail
// Multi-Provider Vision & Thumbnail Generation Proxy with Provider Rotation & Key Failover
// Eliminates raw API key exposure in client-side browser bundles and DevTools

import { getDb } from './db.js';

const KIE_BASE_API_URL = 'https://api.kie.ai/api/v1/jobs';
const CDN_UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-base64-upload';

// Cached configurations and keys in memory
let cachedConfig = null;
let lastConfigFetchTime = 0;
let cachedKeyDoc = null;
let lastKeyFetchTime = 0;
const CACHE_TTL_MS = 30 * 1000; // Refresh from DB every 30 seconds

// Per-provider rotation index tracking
const providerKeyIndices = {
  'kie.ai': 0,
  'fal.ai': 0,
  'replicate': 0,
  'together': 0,
  'openai': 0
};

// Hardcoded fallback Kie.ai keys for offline/disconnected resilience
const FALLBACK_KIE_KEYS = [
  '05ac939d323c2500f085f9b9ba235e85',
  'e69cdf52c51effcfebfeb44e508c8e40',
  'bb19f8a8b94e785f7f8cf7955ed165a6',
  'a12309554b342ed9d3d5577d4079cae0',
  '2157c9fa712b2064b7a781139c8122d0'
];

async function getThumbnailConfig() {
  const now = Date.now();
  if (cachedConfig && (now - lastConfigFetchTime < CACHE_TTL_MS)) {
    return cachedConfig;
  }

  try {
    const db = await getDb();
    if (db) {
      const doc = await db.collection('system_config').findOne({ _id: 'thumbnail_configuration' });
      if (doc) {
        cachedConfig = doc;
        lastConfigFetchTime = now;
        return cachedConfig;
      }
    }
  } catch (err) {
    console.warn('[thumbnail.js] MongoDB thumbnail_configuration read failed:', err.message);
  }

  // Default configuration if DB empty
  cachedConfig = {
    activeProvider: 'kie.ai',
    providerRotationEnabled: true,
    fallbackChain: ['kie.ai', 'fal.ai', 'replicate', 'together', 'openai'],
    systemPrompt: '',
    systemPromptEnabled: false,
    negativePrompt: '--no watermark, no blur, no low resolution, no deformed faces',
    defaultAspectRatio: '16:9',
    defaultResolution: '2K'
  };
  lastConfigFetchTime = now;
  return cachedConfig;
}

async function getKeyDoc() {
  const now = Date.now();
  if (cachedKeyDoc && (now - lastKeyFetchTime < CACHE_TTL_MS)) {
    return cachedKeyDoc;
  }

  try {
    const db = await getDb();
    if (db) {
      const doc = await db.collection('api_keys').findOne({ _id: 'thumbnail_keys' });
      if (doc) {
        cachedKeyDoc = doc;
        lastKeyFetchTime = now;
        return cachedKeyDoc;
      }
    }
  } catch (err) {
    console.warn('[thumbnail.js] MongoDB thumbnail_keys read failed:', err.message);
  }

  // Fallback check Netlify Environment Variable
  const envKeys = process.env.THUMBNAIL_API_KEYS;
  const envPool = envKeys ? envKeys.split(',').map(k => k.trim()).filter(Boolean) : FALLBACK_KIE_KEYS;

  cachedKeyDoc = {
    _id: 'thumbnail_keys',
    pool: envPool,
    providers: {
      'kie.ai': { keys: envPool, enabled: true },
      'fal.ai': { keys: [], enabled: true },
      'replicate': { keys: [], enabled: true },
      'together': { keys: [], enabled: true },
      'openai': { keys: [], baseUrl: 'https://api.openai.com/v1', enabled: true }
    }
  };
  lastKeyFetchTime = now;
  return cachedKeyDoc;
}

function getProviderKeys(keyDoc, provider) {
  if (!keyDoc) return provider === 'kie.ai' ? FALLBACK_KIE_KEYS : [];

  const prov = keyDoc.providers?.[provider];
  if (prov && Array.isArray(prov.keys) && prov.keys.length > 0) {
    return prov.keys.filter(k => typeof k === 'string' ? k.trim() : k?.key);
  }

  if (provider === 'kie.ai') {
    if (Array.isArray(keyDoc.pool) && keyDoc.pool.length > 0) {
      return keyDoc.pool;
    }
    return FALLBACK_KIE_KEYS;
  }

  return [];
}

function getActiveKeyForProvider(keys, provider) {
  if (!keys || keys.length === 0) return null;
  const idx = (providerKeyIndices[provider] || 0) % keys.length;
  const k = keys[idx];
  return typeof k === 'string' ? k.trim() : (k?.key || '');
}

function rotateKeyForProvider(keys, provider) {
  if (keys && keys.length > 0) {
    providerKeyIndices[provider] = ((providerKeyIndices[provider] || 0) + 1) % keys.length;
    console.log(`[thumbnail.js] Rotated provider '${provider}' to key slot #${providerKeyIndices[provider] + 1}/${keys.length}`);
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

  // ── ACTION 0: GET LIVE PUBLIC CONFIG (MODELS, PRESETS, ACTIVE PROVIDER) ──
  if (action === 'getConfig') {
    const config = await getThumbnailConfig();
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        activeProvider: config.activeProvider || 'kie.ai',
        providerRotationEnabled: config.providerRotationEnabled ?? true,
        fallbackChain: config.fallbackChain || ['kie.ai', 'fal.ai', 'replicate', 'together', 'openai'],
        systemPrompt: config.systemPrompt || '',
        systemPromptEnabled: Boolean(config.systemPromptEnabled),
        negativePrompt: config.negativePrompt || '',
        defaultAspectRatio: config.defaultAspectRatio || '16:9',
        defaultResolution: config.defaultResolution || '2K',
        models: config.models || [],
        presets: config.presets || [],
        styles: config.styles || []
      })
    };
  }

  // ── ACTION 1: CREATE THUMBNAIL TASK WITH MULTI-PROVIDER ROTATION ──
  if (action === 'createTask') {
    const { model, input, provider: requestedProvider } = body;
    if (!model || !input) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing model or input in request body' })
      };
    }

    const config = await getThumbnailConfig();
    const keyDoc = await getKeyDoc();

    // 1. System Prompt Conditioning:
    // User Requirement: "by default there should be no system prompt which overrides the users prompts...
    // the system prompt should only work if i have entered in admin panel, else it should work normally like how a image gen works."
    let effectivePrompt = input.prompt || '';
    if (config.systemPromptEnabled && config.systemPrompt && config.systemPrompt.trim()) {
      const sp = config.systemPrompt.trim();
      effectivePrompt = `${sp}\n\n${effectivePrompt}`;
    }

    const effectiveInput = {
      ...input,
      prompt: effectivePrompt
    };

    // 2. Resolve Provider Hierarchy & Failover Chain
    const primaryProvider = requestedProvider || config.activeProvider || 'kie.ai';
    let providerChain = [primaryProvider];
    if (config.providerRotationEnabled) {
      const fallbackList = Array.isArray(config.fallbackChain) ? config.fallbackChain : ['kie.ai', 'fal.ai', 'replicate', 'together', 'openai'];
      for (const p of fallbackList) {
        if (!providerChain.includes(p)) {
          providerChain.push(p);
        }
      }
    }

    let lastError = null;
    let successfulResult = null;

    // Loop through provider chain
    for (const currentProvider of providerChain) {
      const keys = getProviderKeys(keyDoc, currentProvider);
      if (!keys || keys.length === 0) {
        console.warn(`[thumbnail.js] Skipping provider '${currentProvider}': no API keys configured in vault.`);
        continue;
      }

      console.log(`[thumbnail.js] Attempting generation with provider '${currentProvider}' (${keys.length} keys in pool)...`);
      let providerSucceeded = false;
      const maxKeyAttempts = keys.length;

      for (let attempt = 0; attempt < maxKeyAttempts; attempt++) {
        const key = getActiveKeyForProvider(keys, currentProvider);
        if (!key) break;

        try {
          // --- PROVIDER 1: KIE.AI ---
          if (currentProvider === 'kie.ai') {
            const res = await fetch(`${KIE_BASE_API_URL}/createTask`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
              },
              body: JSON.stringify({
                model,
                input: effectiveInput
              })
            });

            if (res.status === 401 || res.status === 402 || res.status === 429) {
              console.warn(`[thumbnail.js] Kie.ai key returned HTTP ${res.status}, rotating key...`);
              rotateKeyForProvider(keys, currentProvider);
              continue;
            }

            const json = await res.json();
            if (json.code === 402 || (json.msg && /insufficient|balance|credit/i.test(json.msg))) {
              console.warn(`[thumbnail.js] Kie.ai key credit exhausted, rotating key...`);
              rotateKeyForProvider(keys, currentProvider);
              continue;
            }

            if (json.code !== 200 || !json.data?.taskId) {
              throw new Error(json.msg || `Kie.ai error code ${json.code}`);
            }

            successfulResult = {
              success: true,
              taskId: `kie:${json.data.taskId}`,
              providerUsed: 'kie.ai',
              modelId: model,
              state: 'waiting'
            };
            providerSucceeded = true;
            break;
          }

          // --- PROVIDER 2: FAL.AI ---
          else if (currentProvider === 'fal.ai') {
            const falModel = model.includes('/') ? model : 'fal-ai/flux/schnell';
            const res = await fetch(`https://queue.fal.run/${falModel}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${key}`
              },
              body: JSON.stringify({
                prompt: effectiveInput.prompt,
                image_size: effectiveInput.aspect_ratio === '9:16' ? 'portrait_16_9' : 'landscape_16_9',
                num_inference_steps: 4
              })
            });

            if (res.status === 401 || res.status === 402 || res.status === 429) {
              rotateKeyForProvider(keys, currentProvider);
              continue;
            }

            const json = await res.json();
            if (!res.ok) throw new Error(json.detail || `Fal.ai status ${res.status}`);

            successfulResult = {
              success: true,
              taskId: `fal:${json.request_id}:${falModel}`,
              providerUsed: 'fal.ai',
              modelId: falModel,
              state: 'waiting'
            };
            providerSucceeded = true;
            break;
          }

          // --- PROVIDER 3: REPLICATE ---
          else if (currentProvider === 'replicate') {
            const repModel = model.includes('/') ? model : 'black-forest-labs/flux-schnell';
            const res = await fetch(`https://api.replicate.com/v1/models/${repModel}/predictions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
              },
              body: JSON.stringify({
                input: {
                  prompt: effectiveInput.prompt,
                  aspect_ratio: effectiveInput.aspect_ratio || '16:9'
                }
              })
            });

            if (res.status === 401 || res.status === 402 || res.status === 429) {
              rotateKeyForProvider(keys, currentProvider);
              continue;
            }

            const json = await res.json();
            if (!res.ok) throw new Error(json.detail || `Replicate status ${res.status}`);

            successfulResult = {
              success: true,
              taskId: `rep:${json.id}`,
              providerUsed: 'replicate',
              modelId: repModel,
              state: json.status === 'succeeded' ? 'success' : 'waiting',
              resultUrl: Array.isArray(json.output) ? json.output[0] : json.output
            };
            providerSucceeded = true;
            break;
          }

          // --- PROVIDER 4: TOGETHER AI ---
          else if (currentProvider === 'together') {
            const togModel = model.includes('/') ? model : 'black-forest-labs/FLUX.1-schnell-Free';
            const res = await fetch('https://api.together.xyz/v1/images/generations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
              },
              body: JSON.stringify({
                model: togModel,
                prompt: effectiveInput.prompt,
                width: effectiveInput.aspect_ratio === '9:16' ? 768 : 1024,
                height: effectiveInput.aspect_ratio === '9:16' ? 1024 : 768
              })
            });

            if (res.status === 401 || res.status === 402 || res.status === 429) {
              rotateKeyForProvider(keys, currentProvider);
              continue;
            }

            const json = await res.json();
            if (!res.ok || !json.data?.[0]?.url) throw new Error(json.error?.message || `Together status ${res.status}`);

            successfulResult = {
              success: true,
              taskId: `tog:${Date.now()}`,
              providerUsed: 'together',
              modelId: togModel,
              state: 'success',
              resultUrl: json.data[0].url
            };
            providerSucceeded = true;
            break;
          }

          // --- PROVIDER 5: OPENAI / CUSTOM ---
          else if (currentProvider === 'openai') {
            const baseUrl = keyDoc?.providers?.openai?.baseUrl || 'https://api.openai.com/v1';
            const res = await fetch(`${baseUrl}/images/generations`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
              },
              body: JSON.stringify({
                model: 'dall-e-3',
                prompt: effectiveInput.prompt,
                n: 1,
                size: effectiveInput.aspect_ratio === '9:16' ? '1024x1792' : '1792x1024'
              })
            });

            if (res.status === 401 || res.status === 402 || res.status === 429) {
              rotateKeyForProvider(keys, currentProvider);
              continue;
            }

            const json = await res.json();
            if (!res.ok || !json.data?.[0]?.url) throw new Error(json.error?.message || `OpenAI status ${res.status}`);

            successfulResult = {
              success: true,
              taskId: `oai:${Date.now()}`,
              providerUsed: 'openai',
              modelId: 'dall-e-3',
              state: 'success',
              resultUrl: json.data[0].url
            };
            providerSucceeded = true;
            break;
          }
        } catch (err) {
          lastError = err;
          console.warn(`[thumbnail.js] Provider '${currentProvider}' attempt failed:`, err.message);
          rotateKeyForProvider(keys, currentProvider);
        }
      }

      if (providerSucceeded && successfulResult) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(successfulResult)
        };
      }

      console.warn(`[thumbnail.js] All keys for provider '${currentProvider}' exhausted or failed. Initiating failover to next provider...`);
    }

    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({
        error: `All thumbnail generation providers and keys exhausted: ${lastError?.message || 'Unknown error'}`
      })
    };
  }

  // ── ACTION 2: POLL TASK RECORD INFO ────────────────────────
  if (action === 'pollTask') {
    const rawTaskId = event.queryStringParameters?.taskId || body.taskId;
    if (!rawTaskId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing taskId' })
      };
    }

    const keyDoc = await getKeyDoc();

    // 1. Sync tasks (Together AI / OpenAI)
    if (rawTaskId.startsWith('tog:') || rawTaskId.startsWith('oai:')) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          state: 'success',
          resultUrl: body.resultUrl || null
        })
      };
    }

    // 2. Fal.ai Polling (`fal:requestId:model`)
    if (rawTaskId.startsWith('fal:')) {
      const parts = rawTaskId.split(':');
      const reqId = parts[1];
      const falModel = parts.slice(2).join(':') || 'fal-ai/flux/schnell';
      const keys = getProviderKeys(keyDoc, 'fal.ai');
      const key = getActiveKeyForProvider(keys, 'fal.ai');

      try {
        const res = await fetch(`https://queue.fal.run/${falModel}/requests/${reqId}/status`, {
          headers: { 'Authorization': `Key ${key}` }
        });
        const json = await res.json();

        if (json.status === 'COMPLETED') {
          const resDetail = await fetch(`https://queue.fal.run/${falModel}/requests/${reqId}`, {
            headers: { 'Authorization': `Key ${key}` }
          });
          const detailJson = await resDetail.json();
          const imgUrl = detailJson.images?.[0]?.url;
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ success: true, state: 'success', resultUrl: imgUrl })
          };
        }

        if (json.status === 'FAILED') {
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, state: 'fail', failReason: json.error || 'Fal task failed' })
          };
        }

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true, state: 'processing' })
        };
      } catch (err) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
      }
    }

    // 3. Replicate Polling (`rep:predictionId`)
    if (rawTaskId.startsWith('rep:')) {
      const predId = rawTaskId.replace('rep:', '');
      const keys = getProviderKeys(keyDoc, 'replicate');
      const key = getActiveKeyForProvider(keys, 'replicate');

      try {
        const res = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        const json = await res.json();

        if (json.status === 'succeeded') {
          const imgUrl = Array.isArray(json.output) ? json.output[0] : json.output;
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ success: true, state: 'success', resultUrl: imgUrl })
          };
        }

        if (json.status === 'failed' || json.status === 'canceled') {
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, state: 'fail', failReason: json.error || 'Replicate prediction failed' })
          };
        }

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true, state: 'processing' })
        };
      } catch (err) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
      }
    }

    // 4. Kie.ai Polling (Default & `kie:taskId`)
    const cleanKieTaskId = rawTaskId.startsWith('kie:') ? rawTaskId.replace('kie:', '') : rawTaskId;
    const kieKeys = getProviderKeys(keyDoc, 'kie.ai');
    const key = getActiveKeyForProvider(kieKeys, 'kie.ai');

    try {
      const res = await fetch(`${KIE_BASE_API_URL}/recordInfo?taskId=${cleanKieTaskId}`, {
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

    const keyDoc = await getKeyDoc();
    const kieKeys = getProviderKeys(keyDoc, 'kie.ai');
    const key = getActiveKeyForProvider(kieKeys, 'kie.ai');

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
