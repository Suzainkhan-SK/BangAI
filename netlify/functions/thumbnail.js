// Netlify Serverless Function: thumbnail
// Path: /.netlify/functions/thumbnail
// Multi-Provider Vision & Thumbnail Generation Proxy with Universal Provider & Endpoint Engine
// Supports any custom provider (OpenAI-compatible, Kie-compatible, Fal queue, Replicate, custom HTTP)
// Key rotation, automatic multi-provider failover, and real-time MongoDB activity logging

import { getDb } from './db.js';

const KIE_BASE_API_URL = 'https://api.kie.ai/api/v1/jobs';
const CDN_UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-base64-upload';

// Cached configurations and keys in memory
let cachedConfig = null;
let lastConfigFetchTime = 0;
let cachedKeyDoc = null;
let lastKeyFetchTime = 0;
const CACHE_TTL_MS = 5 * 1000; // Refresh from DB every 5 seconds

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

// Complete built-in default provider definitions with exact endpoints
const DEFAULT_PROVIDER_CONFIGS = {
  'kie.ai': {
    id: 'kie.ai',
    name: 'Kie.ai Vision Engine',
    icon: '⚡',
    mode: 'async',
    authHeaderType: 'Bearer',
    generateUrl: 'https://api.kie.ai/api/v1/jobs/createTask',
    generateMethod: 'POST',
    payloadFormat: 'kie',
    defaultModel: 'gpt-image/2.5-flare',
    responseTaskIdPath: 'data.taskId',
    pollUrlTemplate: 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId={{taskId}}',
    pollStatusPath: 'data.state',
    pollSuccessValue: 'SUCCESS',
    pollResultUrlPath: 'data.resultUrl',
    balanceUrl: 'https://api.kie.ai/api/v1/chat/credit',
    balanceMethod: 'GET',
    balanceValuePath: 'data',
    balanceUnit: 'Credits'
  },
  'together': {
    id: 'together',
    name: 'Together AI',
    icon: '🧠',
    mode: 'sync',
    authHeaderType: 'Bearer',
    generateUrl: 'https://api.together.xyz/v1/images/generations',
    generateMethod: 'POST',
    payloadFormat: 'openai',
    defaultModel: 'black-forest-labs/FLUX.1-schnell-Free',
    responseImageUrlPath: 'data[0].url',
    balanceUrl: 'https://api.together.xyz/v1/models',
    balanceMethod: 'GET'
  },
  'openai': {
    id: 'openai',
    name: 'OpenAI / Custom Compatible',
    icon: '🌐',
    mode: 'sync',
    authHeaderType: 'Bearer',
    generateUrl: 'https://api.openai.com/v1/images/generations',
    generateMethod: 'POST',
    payloadFormat: 'openai',
    defaultModel: 'dall-e-3',
    responseImageUrlPath: 'data[0].url',
    balanceUrl: 'https://api.openai.com/v1/models',
    balanceMethod: 'GET'
  },
  'fal.ai': {
    id: 'fal.ai',
    name: 'Fal.ai Fast Vision',
    icon: '🚀',
    mode: 'async',
    authHeaderType: 'Key',
    generateUrl: 'https://queue.fal.run/{{model}}',
    generateMethod: 'POST',
    payloadFormat: 'fal',
    defaultModel: 'fal-ai/flux/schnell',
    responseTaskIdPath: 'request_id',
    pollUrlTemplate: 'https://queue.fal.run/{{model}}/requests/{{taskId}}/status',
    pollStatusPath: 'status',
    pollSuccessValue: 'COMPLETED',
    pollResultUrlPath: 'images[0].url',
    balanceUrl: 'https://rest.alpha.fal.ai/keys/current',
    balanceMethod: 'GET'
  },
  'replicate': {
    id: 'replicate',
    name: 'Replicate',
    icon: '🔄',
    mode: 'async',
    authHeaderType: 'Bearer',
    generateUrl: 'https://api.replicate.com/v1/models/{{model}}/predictions',
    generateMethod: 'POST',
    payloadFormat: 'replicate',
    defaultModel: 'black-forest-labs/flux-schnell',
    responseTaskIdPath: 'id',
    pollUrlTemplate: 'https://api.replicate.com/v1/predictions/{{taskId}}',
    pollStatusPath: 'status',
    pollSuccessValue: 'succeeded',
    pollResultUrlPath: 'output[0]',
    balanceUrl: 'https://api.replicate.com/v1/account',
    balanceMethod: 'GET'
  }
};

// Log real-time activity events to MongoDB collection `thumbnail_logs`
async function logThumbnailActivity(entry) {
  try {
    const db = await getDb();
    if (!db) return;
    const logDoc = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    await db.collection('thumbnail_logs').insertOne(logDoc);
    // Keep collection tidy (latest 300 logs)
    const count = await db.collection('thumbnail_logs').countDocuments();
    if (count > 350) {
      const oldest = await db.collection('thumbnail_logs').find().sort({ timestamp: 1 }).limit(count - 300).toArray();
      if (oldest.length > 0) {
        await db.collection('thumbnail_logs').deleteMany({ _id: { $in: oldest.map(o => o._id) } });
      }
    }
  } catch (err) {
    console.warn('[thumbnail.js] Activity log insert failed:', err.message);
  }
}

// Extract nested values from JSON response using dot and bracket notation (e.g. "data[0].url", "images[0].url")
function getValueByPath(obj, path) {
  if (!obj || !path) return undefined;
  const cleanPath = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const keys = cleanPath.split('.');
  let current = obj;
  for (const k of keys) {
    if (current == null) return undefined;
    current = current[k];
  }
  return current;
}

// Retrieve complete provider specification (combining custom configurations from DB and built-in defaults)
function getProviderDef(config, keyDoc, providerId) {
  if (config?.customProviders && config.customProviders[providerId]) {
    return {
      ...(DEFAULT_PROVIDER_CONFIGS[providerId] || DEFAULT_PROVIDER_CONFIGS['openai']),
      ...config.customProviders[providerId]
    };
  }
  if (keyDoc?.providers && keyDoc.providers[providerId]) {
    const kp = keyDoc.providers[providerId];
    if (kp.generateUrl || kp.baseUrl) {
      return {
        ...(DEFAULT_PROVIDER_CONFIGS[providerId] || DEFAULT_PROVIDER_CONFIGS['openai']),
        ...kp
      };
    }
  }
  return DEFAULT_PROVIDER_CONFIGS[providerId] || {
    id: providerId,
    name: providerId,
    icon: '🌐',
    mode: 'sync',
    authHeaderType: 'Bearer',
    generateUrl: `https://api.${providerId}.com/v1/images/generations`,
    generateMethod: 'POST',
    payloadFormat: 'openai',
    responseImageUrlPath: 'data[0].url'
  };
}

// Format authorization headers according to provider authentication type
function getAuthHeaders(providerDef, key) {
  const headers = {
    'Content-Type': 'application/json'
  };
  const authType = (providerDef.authHeaderType || 'Bearer').toLowerCase();
  if (authType === 'bearer') {
    headers['Authorization'] = `Bearer ${key}`;
  } else if (authType === 'key') {
    headers['Authorization'] = `Key ${key}`;
  } else if (authType === 'token') {
    headers['Authorization'] = `Token ${key}`;
  } else if (authType === 'x-api-key') {
    headers[providerDef.customHeaderName || 'x-api-key'] = key;
  } else if (authType === 'custom') {
    headers[providerDef.customHeaderName || 'Authorization'] = (providerDef.authPrefix || '') + key;
  } else {
    headers['Authorization'] = `Bearer ${key}`;
  }

  // Provider-specific required headers
  if (providerDef.id?.includes('topview') || providerDef.generateUrl?.includes('topview.ai')) {
    headers['Idempotency-Key'] = crypto.randomUUID();
  }

  return headers;
}

// Construct generation request payload based on provider format (OpenAI, Kie, Fal, Replicate, Wizzx, Topview, or Custom Template)
function buildRequestPayload(providerDef, { model, prompt, aspectRatio, resolution, width, height, numSteps, imageUrl }) {
  const format = providerDef.payloadFormat || 'openai';
  const provId = providerDef.id || '';
  const isWizzx = provId.includes('wizzx') || providerDef.generateUrl?.includes('wizzx.ai');
  const isTopview = provId.includes('topview') || providerDef.generateUrl?.includes('topview.ai');

  // Dedicated clean handling for Wizzx AI
  if (isWizzx) {
    const wizzxPayload = {
      prompt,
      aspect_ratio: aspectRatio || '16:9',
      resolution: resolution || '2K'
    };
    if (imageUrl) {
      wizzxPayload.image_urls = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
    }
    return wizzxPayload;
  }

  // Dedicated clean handling for TopView AI
  if (isTopview) {
    const topviewPayload = {
      prompt,
      aspect_ratio: aspectRatio || '16:9',
      resolution: resolution || '2K'
    };
    if (imageUrl) {
      topviewPayload.image_urls = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
    }
    return topviewPayload;
  }

  if (format === 'custom' && providerDef.customPayloadTemplate) {
    let tpl = providerDef.customPayloadTemplate;
    if (typeof tpl === 'object') {
      try {
        tpl = JSON.stringify(tpl);
      } catch {
        tpl = '';
      }
    }
    if (typeof tpl === 'string' && tpl.trim()) {
      // Normalize ${...} to {{...}}
      tpl = tpl
        .replace(/\$\{(?:prompt)\}/gi, '{{prompt}}')
        .replace(/\$\{(?:model|modelId)\}/gi, '{{model}}')
        .replace(/\$\{(?:aspect_ratio|aspectRatio|ratio)\}/gi, '{{aspect_ratio}}')
        .replace(/\$\{(?:resolution)\}/gi, '{{resolution}}')
        .replace(/\$\{(?:seed)\}/gi, '{{seed}}');

      tpl = tpl.replace(/\{\{prompt\}\}/g, JSON.stringify(prompt || '').slice(1, -1));
      tpl = tpl.replace(/\{\{model\}\}/g, model || '');
      tpl = tpl.replace(/\{\{aspectRatio\}\}/gi, aspectRatio || '16:9');
      tpl = tpl.replace(/\{\{aspect_ratio\}\}/gi, aspectRatio || '16:9');
      tpl = tpl.replace(/\{\{ratio\}\}/gi, aspectRatio || '16:9');
      tpl = tpl.replace(/\{\{resolution\}\}/gi, resolution || '2K');
      tpl = tpl.replace(/\{\{version\}\}/gi, 'flare');
      tpl = tpl.replace(/\{\{image_urls\}\}/gi, imageUrl ? JSON.stringify([imageUrl]) : '[]');
      tpl = tpl.replace(/\{\{width\}\}/g, String(width || 1024));
      tpl = tpl.replace(/\{\{height\}\}/g, String(height || 768));
      tpl = tpl.replace(/\{\{seed\}\}/g, String(Math.floor(Math.random() * 999999)));
      // Remove any leftover mustache tags
      tpl = tpl.replace(/"\{\{[^}]+\}\}"/g, 'null').replace(/\{\{[^}]+\}\}/g, '""');
      try {
        return JSON.parse(tpl);
      } catch (err) {
        console.warn('[thumbnail.js] Custom template parse failed, falling back:', err.message);
      }
    }
  }

  if (format === 'kie') {
    return {
      model,
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        resolution
      }
    };
  }

  if (format === 'fal') {
    let falSize = 'landscape_16_9';
    if (aspectRatio === '9:16') falSize = 'portrait_16_9';
    else if (aspectRatio === '1:1') falSize = 'square_hd';
    else if (aspectRatio === '4:3') falSize = 'landscape_4_3';

    return {
      prompt,
      image_size: falSize,
      num_inference_steps: numSteps || 4
    };
  }

  if (format === 'replicate') {
    return {
      input: {
        prompt,
        aspect_ratio: aspectRatio || '16:9'
      }
    };
  }

  // Default: OpenAI / Together compatible
  let size = '1024x1024';
  if (aspectRatio === '9:16') size = '1024x1792';
  else if (aspectRatio === '16:9') size = '1792x1024';

  return {
    model: model || providerDef.defaultModel || 'dall-e-3',
    prompt,
    n: 1,
    size
  };
}

async function getThumbnailConfig(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && cachedConfig && (now - lastConfigFetchTime < CACHE_TTL_MS)) {
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
    defaultResolution: '2K',
    customProviders: DEFAULT_PROVIDER_CONFIGS
  };
  lastConfigFetchTime = now;
  return cachedConfig;
}

async function getKeyDoc(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && cachedKeyDoc && (now - lastKeyFetchTime < CACHE_TTL_MS)) {
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

// Cross-Provider Intelligent Failover Model Resolver:
// Maps a requested model from an exhausted provider to a matching native model on the fallback provider
function resolveFailoverModelForProvider(config, targetProvider, originalModelId, originalFoundModel) {
  const allModels = config.models || [];
  const provModels = allModels.filter(m => m.provider === targetProvider && m.enabled !== false);

  // 1. Explicit fallbackModelId
  if (originalFoundModel?.fallbackModelId) {
    const directMatch = provModels.find(m => m.id === originalFoundModel.fallbackModelId || m.providerModelId === originalFoundModel.fallbackModelId);
    if (directMatch) return directMatch.providerModelId || directMatch.id;
  }

  // 2. Family / Similarity Match (e.g. seedream, gpt, qwen, nano-banana, flux, wan, grok)
  const origName = (originalFoundModel?.name || originalModelId || '').toLowerCase();
  const origSlug = (originalFoundModel?.providerModelId || originalModelId || '').toLowerCase();
  const families = ['seedream', 'gpt', 'qwen', 'nano-banana', 'banana', 'flux', 'wan', 'grok', 'imagen', 'dall-e'];

  for (const fam of families) {
    if (origName.includes(fam) || origSlug.includes(fam)) {
      const familyMatch = provModels.find(m => {
        const mName = (m.name || '').toLowerCase();
        const mId = (m.providerModelId || m.id || '').toLowerCase();
        return mName.includes(fam) || mId.includes(fam);
      });
      if (familyMatch) {
        console.log(`[thumbnail.js] Intelligent Failover: Mapped '${originalModelId}' to similar family model '${familyMatch.id}' (${familyMatch.providerModelId}) on provider '${targetProvider}'`);
        return familyMatch.providerModelId || familyMatch.id;
      }
    }
  }

  // 3. Match by Generation Type (text-to-image vs image-to-image)
  const origType = originalFoundModel?.type || 'text-to-image';
  const sameTypeModel = provModels.find(m => (m.type || 'text-to-image') === origType);
  if (sameTypeModel) {
    console.log(`[thumbnail.js] Intelligent Failover: Mapped '${originalModelId}' to top ${origType} model '${sameTypeModel.id}' on provider '${targetProvider}'`);
    return sameTypeModel.providerModelId || sameTypeModel.id;
  }

  // 4. Provider's top model or defaultModel
  if (provModels.length > 0) {
    return provModels[0].providerModelId || provModels[0].id;
  }

  const provDef = config.customProviders?.[targetProvider] || DEFAULT_PROVIDER_CONFIGS[targetProvider];
  return provDef?.defaultModel || 'gpt-image-2.5';
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
    const forceFresh = Boolean(event.queryStringParameters?.t || event.queryStringParameters?.refresh);
    const config = await getThumbnailConfig(forceFresh);
    // Also resolve active provider name for frontend display
    const activeProvId = config.activeProvider || 'kie.ai';
    const builtInProviderNames = {
      'kie.ai': 'Kie.ai Vision Engine',
      'together': 'Together AI',
      'openai': 'OpenAI / Custom Compatible',
      'fal.ai': 'Fal.ai Fast Vision',
      'replicate': 'Replicate'
    };
    const customProvDef = config.customProviders?.[activeProvId];
    const activeProviderName = customProvDef?.name || builtInProviderNames[activeProvId] || activeProvId;
    const activeProviderIcon = customProvDef?.icon || (activeProvId === 'kie.ai' ? '⚡' : activeProvId === 'fal.ai' ? '🚀' : activeProvId === 'replicate' ? '🔄' : activeProvId === 'together' ? '🧠' : '🌐');

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        activeProvider: activeProvId,
        activeProviderName,
        activeProviderIcon,
        providerRotationEnabled: config.providerRotationEnabled ?? true,
        fallbackChain: config.fallbackChain || ['kie.ai', 'fal.ai', 'replicate', 'together', 'openai'],
        systemPrompt: config.systemPrompt || '',
        systemPromptEnabled: Boolean(config.systemPromptEnabled),
        negativePrompt: config.negativePrompt || '',
        defaultAspectRatio: config.defaultAspectRatio || '16:9',
        defaultResolution: config.defaultResolution || '2K',
        models: config.models || [],
        presets: config.presets || [],
        styles: config.styles || [],
        customProviders: config.customProviders || {}
      })
    };
  }

  // ── ACTION 1: CREATE THUMBNAIL TASK WITH MULTI-PROVIDER ROTATION & FAILOVER ──
  if (action === 'createTask') {
    const { model, input, provider: requestedProvider } = body;
    if (!model || !input) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing model or input in request body' })
      };
    }

    const config = await getThumbnailConfig(true);
    const keyDoc = await getKeyDoc(true);

    // 1. System Prompt Conditioning:
    // By default no system prompt overrides unless explicitly enabled in admin panel
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
    const requestedModelObj = (config.models || []).find(m => m.id === model || m.providerModelId === model);
    const modelExplicitProvider = requestedModelObj?.provider;
    const primaryProvider = requestedProvider || modelExplicitProvider || config.activeProvider || 'topview.ai';
    let providerChain = [primaryProvider];
    if (config.providerRotationEnabled) {
      const fallbackList = Array.isArray(config.fallbackChain) ? config.fallbackChain : ['topview.ai', 'wizzx.ai', 'kie.ai', 'fal.ai', 'replicate', 'together', 'openai'];
      for (const p of fallbackList) {
        if (!providerChain.includes(p)) {
          providerChain.push(p);
        }
      }
    }

    let lastError = null;

    // Loop through provider chain
    for (const currentProvider of providerChain) {
      const providerDef = getProviderDef(config, keyDoc, currentProvider);
      const keys = getProviderKeys(keyDoc, currentProvider);

      if (!keys || keys.length === 0) {
        await logThumbnailActivity({
          type: 'SKIP_PROVIDER_NO_KEYS',
          provider: currentProvider,
          model,
          promptSnippet: effectiveInput.prompt.slice(0, 80),
          message: `Provider '${currentProvider}' skipped: no active API keys found in vault.`
        });
        continue;
      }

      console.log(`[thumbnail.js] Attempting generation with provider '${currentProvider}' (${keys.length} keys in pool)...`);
      const maxKeyAttempts = keys.length;

      for (let attempt = 0; attempt < maxKeyAttempts; attempt++) {
        const key = getActiveKeyForProvider(keys, currentProvider);
        if (!key) break;
        const maskedKey = `${key.slice(0, 4)}...${key.slice(-4)}`;

        try {
          // Resolve provider-specific model slug & check for per-model endpoint override
          let resolvedModel = model;
          let modelEndpointOverride = null;
          let effectiveProviderDef = providerDef;

          if (requestedModelObj) {
            if (requestedModelObj.provider === currentProvider) {
              resolvedModel = requestedModelObj.providerModelId || requestedModelObj.id;
              if (requestedModelObj.endpointOverride?.enabled) {
                modelEndpointOverride = requestedModelObj.endpointOverride;
                console.log(`[thumbnail.js] Using per-model endpoint override for model '${model}'`);
              }
            } else {
              // Failover to secondary provider! Intelligently map to that provider's native matching model
              resolvedModel = resolveFailoverModelForProvider(config, currentProvider, model, requestedModelObj);
              console.log(`[thumbnail.js] Intelligent Failover: Provider '${currentProvider}' mapped model '${model}' -> '${resolvedModel}'`);
            }
          }
          if (!resolvedModel) {
            resolvedModel = model || providerDef.defaultModel || 'gpt-image-2.5';
          }

          // Build generation URL:
          // 1. Per-model endpoint override wins
          // 2. Provider's generateUrl (with {{model}} interpolation)
          // 3. Provider's baseUrl + /images/generations fallback
          let targetUrl;
          let generateMethod = providerDef.generateMethod || 'POST';
          let overriddenPayloadDef = effectiveProviderDef;

          if (modelEndpointOverride) {
            targetUrl = modelEndpointOverride.generateUrl || providerDef.generateUrl || `${providerDef.baseUrl || 'https://api.openai.com/v1'}/images/generations`;
            if (modelEndpointOverride.generateMethod) generateMethod = modelEndpointOverride.generateMethod;
            // Build a merged providerDef for payload building
            overriddenPayloadDef = {
              ...providerDef,
              ...modelEndpointOverride,
              payloadFormat: modelEndpointOverride.payloadFormat || providerDef.payloadFormat,
              customPayloadTemplate: modelEndpointOverride.customPayloadTemplate || providerDef.customPayloadTemplate
            };
          } else {
            targetUrl = providerDef.generateUrl || `${providerDef.baseUrl || 'https://api.openai.com/v1'}/images/generations`;
          }

          // Support all standard model slug template variables: {{model}}, {{modelId}}, {modelId}, {model}
          targetUrl = targetUrl
            .replace(/\{\{model\}\}/g, encodeURIComponent(resolvedModel))
            .replace(/\{\{modelId\}\}/g, encodeURIComponent(resolvedModel))
            .replace(/\{modelId\}/g, encodeURIComponent(resolvedModel))
            .replace(/\{model\}/g, encodeURIComponent(resolvedModel));

          const payload = buildRequestPayload(overriddenPayloadDef, {
            model: resolvedModel,
            prompt: effectiveInput.prompt,
            aspectRatio: effectiveInput.aspect_ratio || '16:9',
            resolution: effectiveInput.resolution || '2K',
            width: effectiveInput.aspect_ratio === '9:16' ? 768 : 1024,
            height: effectiveInput.aspect_ratio === '9:16' ? 1024 : 768
          });

          const headers = getAuthHeaders(providerDef, key);
          const startTime = Date.now();

          await logThumbnailActivity({
            type: 'TASK_DISPATCH',
            provider: currentProvider,
            model: resolvedModel,
            keyMasked: maskedKey,
            targetUrl,
            promptSnippet: effectiveInput.prompt.slice(0, 80),
            aspectRatio: effectiveInput.aspect_ratio || '16:9',
            resolution: effectiveInput.resolution || '2K'
          });

          const res = await fetch(targetUrl, {
            method: generateMethod,
            headers,
            body: JSON.stringify(payload)
          });

          // Check HTTP status for rate-limiting, authentication or credit errors: rotate key & retry!
          if (res.status === 401 || res.status === 402 || res.status === 429) {
            const errText = await res.text().catch(() => '');
            console.warn(`[thumbnail.js] Provider '${currentProvider}' returned HTTP ${res.status}, rotating key...`);
            await logThumbnailActivity({
              type: 'KEY_ROTATED_ON_ERROR',
              provider: currentProvider,
              keyMasked: maskedKey,
              httpStatus: res.status,
              error: errText.slice(0, 160)
            });
            rotateKeyForProvider(keys, currentProvider);
            continue;
          }

          const json = await res.json().catch(() => ({}));

          // Check Kie.ai specific code 402 or insufficient balance message
          if (json.code === 402 || (json.msg && /insufficient|balance|credit/i.test(json.msg))) {
            console.warn(`[thumbnail.js] Kie.ai key credit exhausted, rotating key...`);
            await logThumbnailActivity({
              type: 'KEY_CREDIT_EXHAUSTED',
              provider: currentProvider,
              keyMasked: maskedKey,
              error: json.msg || 'Insufficient balance'
            });
            rotateKeyForProvider(keys, currentProvider);
            continue;
          }

          if (!res.ok) {
            throw new Error(json.msg || json.error?.message || json.detail || `HTTP ${res.status}`);
          }

          const durationMs = Date.now() - startTime;

          // ── SYNC PROVIDER MODE (Returns direct image URL) ──
          if (providerDef.mode === 'sync') {
            const imgUrl = getValueByPath(json, providerDef.responseImageUrlPath || 'data[0].url') 
              || getValueByPath(json, 'output[0]') 
              || getValueByPath(json, 'images[0].url')
              || getValueByPath(json, 'url');

            if (!imgUrl) {
              throw new Error('Image URL not found at response path: ' + (providerDef.responseImageUrlPath || 'data[0].url'));
            }

            await logThumbnailActivity({
              type: 'GENERATION_SUCCESS',
              provider: currentProvider,
              model: resolvedModel,
              keyMasked: maskedKey,
              durationMs,
              resultUrl: imgUrl,
              promptSnippet: effectiveInput.prompt.slice(0, 80)
            });

            return {
              statusCode: 200,
              headers: corsHeaders,
              body: JSON.stringify({
                success: true,
                taskId: `sync:${currentProvider}:${Date.now()}`,
                providerUsed: currentProvider,
                keyUsed: key,
                modelId: resolvedModel,
                state: 'success',
                resultUrl: imgUrl
              })
            };
          }

          // ── ASYNC PROVIDER MODE (Returns task ID for status polling) ──
          const taskId = (providerDef.responseTaskIdPath ? getValueByPath(json, providerDef.responseTaskIdPath) : null)
            || getValueByPath(json, 'data.task_id')
            || getValueByPath(json, 'data.taskId')
            || getValueByPath(json, 'task_id')
            || getValueByPath(json, 'taskId')
            || getValueByPath(json, 'id')
            || getValueByPath(json, 'data.id');

          if (!taskId) {
            // Fallback: check if direct image URL was returned anyway
            const directImgUrl = getValueByPath(json, providerDef.responseImageUrlPath || 'data[0].url') 
              || getValueByPath(json, 'output[0]') 
              || getValueByPath(json, 'images[0].url');
            if (directImgUrl) {
              await logThumbnailActivity({
                type: 'GENERATION_SUCCESS',
                provider: currentProvider,
                model: resolvedModel,
                keyMasked: maskedKey,
                durationMs,
                resultUrl: directImgUrl
              });
              return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                  success: true,
                  taskId: `sync:${currentProvider}:${Date.now()}`,
                  providerUsed: currentProvider,
                  keyUsed: key,
                  modelId: resolvedModel,
                  state: 'success',
                  resultUrl: directImgUrl
                })
              };
            }
            throw new Error('Task ID not found in response path: ' + (providerDef.responseTaskIdPath || 'data.taskId'));
          }

          await logThumbnailActivity({
            type: 'TASK_CREATED_ASYNC',
            provider: currentProvider,
            model: resolvedModel,
            keyMasked: maskedKey,
            taskId: `${currentProvider}:${taskId}`,
            durationMs
          });

          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              success: true,
              taskId: `${currentProvider}:${taskId}`,
              providerUsed: currentProvider,
              keyUsed: key,
              modelId: resolvedModel,
              state: 'waiting'
            })
          };

        } catch (err) {
          lastError = err;
          console.warn(`[thumbnail.js] Provider '${currentProvider}' key attempt failed:`, err.message);
          await logThumbnailActivity({
            type: 'KEY_ATTEMPT_FAILED',
            provider: currentProvider,
            keyMasked: maskedKey,
            error: err.message
          });
          rotateKeyForProvider(keys, currentProvider);
        }
      }

      // All keys for currentProvider failed -> trigger Provider Failover
      console.warn(`[thumbnail.js] All keys for provider '${currentProvider}' exhausted. Initiating provider failover...`);
      await logThumbnailActivity({
        type: 'PROVIDER_FAILOVER',
        failedProvider: currentProvider,
        message: `All keys for provider '${currentProvider}' failed or exhausted. Failing over to next provider in priority chain.`
      });
    }

    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({
        error: `All thumbnail generation providers and keys exhausted in failover chain: ${lastError?.message || 'Unknown error'}`
      })
    };
  }

  // ── ACTION 2: POLL ASYNC TASK STATUS (UNIVERSAL FOR ANY PROVIDER) ──
  if (action === 'pollTask') {
    const rawTaskId = event.queryStringParameters?.taskId || body.taskId;
    if (!rawTaskId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing taskId' })
      };
    }

    // 1. Check for immediate sync tasks
    if (rawTaskId.startsWith('sync:') || rawTaskId.startsWith('tog:') || rawTaskId.startsWith('oai:')) {
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

    // 2. Parse provider from taskId: `${providerId}:${realTaskId}`
    const colonIdx = rawTaskId.indexOf(':');
    let providerId = 'kie.ai';
    let realTaskId = rawTaskId;

    if (colonIdx > 0) {
      providerId = rawTaskId.slice(0, colonIdx);
      realTaskId = rawTaskId.slice(colonIdx + 1);
    }

    const config = await getThumbnailConfig();
    const keyDoc = await getKeyDoc();
    const providerDef = getProviderDef(config, keyDoc, providerId);
    const keys = getProviderKeys(keyDoc, providerId);
    const key = body.keyUsed || getActiveKeyForProvider(keys, providerId);

    // 3. Construct Polling URL
    let pollUrl = providerDef.pollUrlTemplate || 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId={{taskId}}';
    pollUrl = pollUrl
      .replace(/\{\{taskId\}\}/g, encodeURIComponent(realTaskId))
      .replace(/\{taskId\}/g, encodeURIComponent(realTaskId))
      .replace(/\{\{predictionId\}\}/g, encodeURIComponent(realTaskId))
      .replace(/\{predictionId\}/g, encodeURIComponent(realTaskId))
      .replace(/\{\{id\}\}/g, encodeURIComponent(realTaskId))
      .replace(/\{id\}/g, encodeURIComponent(realTaskId))
      .replace(/\{\{model\}\}/g, encodeURIComponent(body.modelId || providerDef.defaultModel || ''));

    const headers = getAuthHeaders(providerDef, key);

    try {
      const pollRes = await fetch(pollUrl, { headers });
      const pollJson = await pollRes.json().catch(() => ({}));

      // Extract status using configured path
      const statusVal = getValueByPath(pollJson, providerDef.pollStatusPath || 'data.state')
        || getValueByPath(pollJson, 'status')
        || getValueByPath(pollJson, 'state');

      const successTarget = providerDef.pollSuccessValue || 'SUCCESS';

      // Status Check: SUCCESS
      const isSuccess = String(statusVal).toUpperCase() === String(successTarget).toUpperCase() 
        || statusVal === 'success' || statusVal === 'succeeded'
        || statusVal === 'completed' || statusVal === 'COMPLETED'
        || statusVal === 'SUCCEEDED';

      if (isSuccess) {
        let resultUrl = getValueByPath(pollJson, providerDef.pollResultUrlPath || 'data.resultUrl')
          || getValueByPath(pollJson, 'data.outputs[0]')
          || getValueByPath(pollJson, 'data.output[0]')
          || getValueByPath(pollJson, 'outputs[0]')
          || getValueByPath(pollJson, 'output[0]')
          || getValueByPath(pollJson, 'data.result_urls[0]')
          || getValueByPath(pollJson, 'images[0].url')
          || getValueByPath(pollJson, 'data.url')
          || getValueByPath(pollJson, 'resultUrl');

        if (!resultUrl && Array.isArray(pollJson.data?.result_urls) && pollJson.data.result_urls.length > 0) {
          resultUrl = pollJson.data.result_urls[0];
        }
        if (Array.isArray(resultUrl)) {
          resultUrl = resultUrl[0];
        }

        // Kie.ai special fallback for stringified resultJson
        if (!resultUrl && pollJson.data?.resultJson) {
          try {
            const parsed = JSON.parse(pollJson.data.resultJson);
            resultUrl = parsed.resultUrls?.[0] || parsed.resultUrl || parsed.output?.[0] || parsed.images?.[0];
          } catch {
            resultUrl = pollJson.data.resultJson;
          }
        }

        // Fal.ai special fallback to request details endpoint
        if (!resultUrl && providerId === 'fal.ai') {
          const detailUrl = `https://queue.fal.run/${body.modelId || 'fal-ai/flux/schnell'}/requests/${realTaskId}`;
          const resDet = await fetch(detailUrl, { headers });
          const jsonDet = await resDet.json().catch(() => ({}));
          resultUrl = jsonDet.images?.[0]?.url;
        }

        await logThumbnailActivity({
          type: 'TASK_COMPLETED',
          provider: providerId,
          taskId: rawTaskId,
          resultUrl
        });

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            state: 'success',
            resultUrl,
            taskData: pollJson
          })
        };
      }

      // Status Check: FAILED
      if (String(statusVal).toUpperCase() === 'FAILED' || String(statusVal).toUpperCase() === 'FAIL' || statusVal === 'failed') {
        const errMsg = pollJson.data?.error || pollJson.error?.message || pollJson.error || pollJson.msg || 'Generation task failed on provider';
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            state: 'failed',
            error: errMsg
          })
        };
      }

      // Status Check: FAILURE
      if (String(statusVal).toLowerCase().includes('fail') || String(statusVal).toLowerCase().includes('error') || statusVal === 'canceled') {
        const failReason = pollJson.data?.failReason || pollJson.failReason || pollJson.error || 'Generation failed on provider';
        await logThumbnailActivity({
          type: 'TASK_FAILED',
          provider: providerId,
          taskId: rawTaskId,
          error: failReason
        });
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            state: 'fail',
            failReason
          })
        };
      }

      // Status Check: STILL PROCESSING
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          state: 'processing'
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
