// src/services/thumbnailService.js
// BangAI Neural Vision Engine - Thumbnail Studio Service
// Multi-Key Rotating Pool with Automatic Failover & High-Performance CDN

const API_KEYS = [
  '600b59d0630c57062ea2d359a6a6f64c',
  '448eb7672ebe6a1c6fe64c4db9e7edf0',
  '4125c81cab785b8b23474ce0b62c10ef',
  'dea4cecf44a3aec3b6a652bd485e172d',
  '92d0de6f5552d358907b96d10349e68b'
];

const BASE_API_URL = 'https://api.kie.ai/api/v1/jobs';
const CDN_UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-base64-upload';

// Supported top-tier vision models
export const THUMBNAIL_MODELS = [
  {
    id: 'gpt-image-2-5-flare-text-to-image',
    name: 'GPT Flare 2.5 Ultra',
    badge: 'VIRAL 4K',
    credits: 6,
    type: 'text-to-image',
    supportsResolution: true,
    supportsBackground: true,
    requiresImage: false,
    description: 'Next-gen photorealistic thumbnails with text comprehension and 4K ultra-fine details.',
    defaultPrompt: 'Dramatic high-contrast YouTube thumbnail: A gigantic glowing gold vault door cracked open with millions of 3D cash stacks bursting out into the camera, volumetric cinematic neon teal and orange lighting, hyper-detailed 8K octane render, ultra-wide angle, extreme viral retention style.',
    showcaseImage: '/showcases/gpt_flare_t2i.png'
  },
  {
    id: 'grok-imagine-image-2-0/text-to-image',
    name: 'Grok Imagine 2.0 (Text-to-Image)',
    badge: 'POPULAR',
    credits: 4,
    type: 'text-to-image',
    supportsResolution: false,
    supportsBackground: false,
    requiresImage: false,
    description: 'Vibrant, high-contrast, razor-sharp textures ideal for eye-catching YouTube video covers.',
    defaultPrompt: 'YouTube thumbnail: Extreme close-up of a futuristic cyborg human face split with glowing blue holographic quantum circuitry, shocked expressive eyes looking straight into camera, dramatic rim lighting, vibrant 8k cinematic poster style.',
    showcaseImage: '/showcases/grok_t2i.jpg'
  },
  {
    id: 'flux1-kontext',
    name: 'Flux.1 Kontext Pro',
    badge: 'CINEMATIC',
    credits: 4,
    type: 'text-to-image',
    supportsResolution: false,
    supportsBackground: false,
    requiresImage: false,
    description: 'Deep cinematic composition, photorealistic color grading, and hyper-realistic depth of field.',
    defaultPrompt: 'Epic YouTube thumbnail: An ancient lost sunken city glowing deep beneath an emerald ocean, massive bioluminescent ruins, mysterious underwater beams of light, ultra photorealistic, unreal engine 5 render, cinematic masterwork.',
    showcaseImage: '/showcases/flux_t2i.jpg'
  },
  {
    id: 'gpt-image-2-5-flare-image-to-image',
    name: 'GPT Flare 2.5 (Image-to-Image)',
    badge: 'RESTYLE',
    credits: 6,
    type: 'image-to-image',
    supportsResolution: true,
    supportsBackground: true,
    requiresImage: true,
    description: 'Transform or restyle any reference image into a viral thumbnail with custom lighting and style.',
    defaultPrompt: 'Add fiery glowing laser eyes, an intense cosmic shockwave explosion behind, and vivid neon orange rim lighting, epic YouTube thumbnail composition.',
    showcaseImage: '/showcases/gpt_flare_i2i.png'
  },
  {
    id: 'grok-imagine-image-2-0/image-edit',
    name: 'Grok Imagine 2.0 (Image Edit)',
    badge: 'EDIT',
    credits: 4,
    type: 'image-to-image',
    supportsResolution: false,
    supportsBackground: false,
    requiresImage: true,
    description: 'Modify elements, swap backgrounds, and enhance existing scenes with generative precision.',
    defaultPrompt: 'Transform the scene into a luxurious modern penthouse bedroom with floor-to-ceiling panoramic glass windows overlooking a neon cyberpunk city skyline at sunset.',
    showcaseImage: '/showcases/grok_edit.jpg'
  }
];

export const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 YouTube', sub: '1280 × 720 (Standard Thumbnail)', icon: 'landscape' },
  { id: '9:16', label: '9:16 Shorts / TikTok', sub: '720 × 1280 (Vertical Short)', icon: 'portrait' },
  { id: '1:1',  label: '1:1 Square', sub: '1080 × 1080 (Community / Feed)', icon: 'square' },
  { id: '4:3',  label: '4:3 Classic', sub: '1024 × 768 (Standard Display)', icon: 'classic' },
  { id: '3:4',  label: '3:4 Portrait', sub: '768 × 1024 (Poster Display)', icon: 'poster' }
];

export const RESOLUTIONS = [
  { id: '1K', label: '1K (1080p Standard)' },
  { id: '2K', label: '2K (1440p Quad HD)' },
  { id: '4K', label: '4K (2160p Ultra HD)' }
];

export const BACKGROUND_MODES = [
  { id: 'auto', label: 'Auto (Intelligent Blend)' },
  { id: 'opaque', label: 'Opaque (Solid Visuals)' },
  { id: 'transparent', label: 'Transparent (PNG Cutout)' }
];

export const VIRAL_PRESETS = [
  {
    id: 'mrbeast',
    emoji: '🔥',
    label: 'High-CTR MrBeast Style',
    prompt: 'Dramatic high-contrast YouTube thumbnail: A gigantic glowing gold vault door cracked open with millions of 3D cash stacks bursting out into the camera, volumetric cinematic neon teal and orange lighting, hyper-detailed 8K octane render, ultra-wide angle, extreme viral retention style.',
    aspectRatio: '16:9',
    modelId: 'gpt-image-2-5-flare-text-to-image'
  },
  {
    id: 'shock',
    emoji: '😱',
    label: 'Shocked Face + Neon 3D Glow',
    prompt: 'YouTube thumbnail: Extreme close-up of a shocked, wide-eyed creator reaction looking straight into camera, vibrant electric violet and neon lime rim lighting, floating glowing 3D exclamation question badges, razor-sharp hyper-detailed textures.',
    aspectRatio: '16:9',
    modelId: 'grok-imagine-image-2-0/text-to-image'
  },
  {
    id: 'mystery',
    emoji: '🛸',
    label: 'Dark Mystery / Unsolved Anomaly',
    prompt: 'Cinematic documentary thumbnail: Mysterious glowing cosmic anomaly hovering over the ocean at night, stormy turbulent dark waves, search spotlights cutting through heavy ocean mist, ultra photorealistic, unreal engine 5 render, cinematic masterwork.',
    aspectRatio: '16:9',
    modelId: 'flux1-kontext'
  },
  {
    id: 'wealth',
    emoji: '💰',
    label: '$1M Crypto / Wealth',
    prompt: 'Eye-catching YouTube thumbnail: Giant holographic glowing Bitcoin and green ascending profit chart breaking through a luxury glass skyscraper floor, golden coins raining down, cinematic luxury lighting, high contrast.',
    aspectRatio: '16:9',
    modelId: 'gpt-image-2-5-flare-text-to-image'
  },
  {
    id: 'tech',
    emoji: '⚡',
    label: 'Tech Breakdown / Cyberpunk',
    prompt: 'YouTube thumbnail: Exploded transparent view of a glowing next-generation AI brain processor with neon circuits, floating holographic data chips, clean dark studio backdrop, razor-sharp macro photography.',
    aspectRatio: '16:9',
    modelId: 'grok-imagine-image-2-0/text-to-image'
  },
  {
    id: 'shorts',
    emoji: '📱',
    label: 'Vertical Viral Short (9:16)',
    prompt: 'Vertical 9:16 mobile thumbnail: Intense high-energy visual with glowing neon arrows, vibrant saturated colors, dramatic center subject, designed for maximum scroll-stopping thumb retention.',
    aspectRatio: '9:16',
    modelId: 'gpt-image-2-5-flare-text-to-image'
  }
];

// Key rotation management
let currentKeyIndex = (() => {
  try {
    const saved = localStorage.getItem('bangai_thumb_key_idx');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < API_KEYS.length) return parsed;
    }
  } catch {}
  return 0;
})();

function getActiveKey() {
  return API_KEYS[currentKeyIndex];
}

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  try {
    localStorage.setItem('bangai_thumb_key_idx', String(currentKeyIndex));
  } catch {}
  console.log(`[ThumbnailService] Auto-rotated to API key pool slot #${currentKeyIndex + 1}/${API_KEYS.length}`);
  return API_KEYS[currentKeyIndex];
}

// Convert a File or Blob to Base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Upload image file to CDN
export async function uploadImageToCDN(file) {
  const base64Data = await fileToBase64(file);
  const cleanName = (file.name || 'reference_image.png').replace(/[^a-zA-Z0-9._-]/g, '_');

  const res = await fetch(CDN_UPLOAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base64Data,
      fileName: cleanName,
      uploadPath: 'images'
    })
  });

  if (!res.ok) {
    throw new Error(`CDN upload failed with status ${res.status}`);
  }

  const json = await res.json();
  const cdnUrl = json?.data?.downloadUrl || json?.data?.url || json?.url;
  if (!cdnUrl) {
    throw new Error('CDN response did not return a valid downloadUrl');
  }
  return cdnUrl;
}

// Build model-specific input payload
export function buildModelInput(modelId, { prompt, aspectRatio = '16:9', resolution = '1K', background = 'auto', imageUrl = null }) {
  if (modelId === 'grok-imagine-image-2-0/text-to-image') {
    return {
      prompt,
      aspect_ratio: aspectRatio
    };
  }

  if (modelId === 'grok-imagine-image-2-0/image-edit') {
    if (!imageUrl) throw new Error('A reference image is required for Grok Image Edit.');
    return {
      prompt,
      aspect_ratio: aspectRatio,
      image_urls: [imageUrl]
    };
  }

  if (modelId === 'gpt-image-2-5-flare-text-to-image') {
    return {
      prompt,
      aspect_ratio: aspectRatio,
      resolution,
      background
    };
  }

  if (modelId === 'gpt-image-2-5-flare-image-to-image') {
    if (!imageUrl) throw new Error('A reference image is required for GPT Flare Image-to-Image.');
    return {
      prompt,
      aspect_ratio: aspectRatio,
      resolution,
      background,
      input_urls: [imageUrl]
    };
  }

  if (modelId === 'flux1-kontext') {
    return {
      prompt,
      aspect_ratio: aspectRatio
    };
  }

  return { prompt, aspect_ratio: aspectRatio };
}

// Generate thumbnail task with multi-key rotation and automatic failover
export async function createThumbnailTask(modelId, params) {
  const input = buildModelInput(modelId, params);
  let lastError = null;

  // Try across available keys in the pool
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    const key = getActiveKey();
    try {
      const res = await fetch(`${BASE_API_URL}/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: modelId,
          input
        })
      });

      // Handle 401 Unauthorized, 402 Payment Required / Out of Credits, or 429 Rate Limit
      if (res.status === 401 || res.status === 402 || res.status === 429) {
        console.warn(`[ThumbnailService] Key pool slot #${currentKeyIndex + 1} returned status ${res.status}. Rotating...`);
        rotateKey();
        continue;
      }

      const json = await res.json();

      // Check for API-level credit exhaustion error
      if (json.code === 402 || (json.msg && /insufficient|balance|credit/i.test(json.msg))) {
        console.warn(`[ThumbnailService] Key pool slot #${currentKeyIndex + 1} exhausted (${json.msg}). Rotating...`);
        rotateKey();
        continue;
      }

      if (json.code !== 200 || !json.data?.taskId) {
        throw new Error(json.msg || `Task creation failed with code ${json.code}`);
      }

      return {
        taskId: json.data.taskId,
        keyUsed: key,
        modelId,
        input
      };
    } catch (err) {
      lastError = err;
      if (attempt < API_KEYS.length - 1) {
        console.warn(`[ThumbnailService] Attempt failed (${err.message}). Retrying with next key...`);
        rotateKey();
      }
    }
  }

  throw lastError || new Error('All vision engine API keys exhausted. Please try again in a few moments.');
}

// Poll task result with key rotation fallback
export async function pollThumbnailTask(taskId, keyUsed, { onProgress, maxSeconds = 120 } = {}) {
  const startTime = Date.now();
  const pollIntervalMs = 2000;
  let activeKey = keyUsed || getActiveKey();

  while ((Date.now() - startTime) < maxSeconds * 1000) {
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);
    if (typeof onProgress === 'function') {
      onProgress({ elapsedSec, status: 'processing' });
    }

    try {
      const res = await fetch(`${BASE_API_URL}/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${activeKey}`
        }
      });

      if (res.ok) {
        const json = await res.json();
        if (json.code === 200 && json.data) {
          const taskData = json.data;
          const state = taskData.state;

          if (state === 'success') {
            // Parse output result
            let resultUrl = null;
            if (taskData.resultJson) {
              try {
                const parsed = JSON.parse(taskData.resultJson);
                resultUrl = parsed.resultUrls?.[0] || parsed.resultUrl || parsed.output?.[0] || parsed.images?.[0];
              } catch {
                resultUrl = taskData.resultJson;
              }
            }
            if (!resultUrl && taskData.resultUrls?.length) {
              resultUrl = taskData.resultUrls[0];
            }

            return {
              state: 'success',
              resultUrl,
              taskData,
              elapsedSec
            };
          }

          if (state === 'fail') {
            throw new Error(taskData.failReason || 'Vision engine task processing failed.');
          }
        }
      }
    } catch (pollErr) {
      // If polling error is fatal fail, throw it
      if (pollErr.message && /failed/i.test(pollErr.message)) {
        throw pollErr;
      }
    }

    await new Promise(r => setTimeout(r, pollIntervalMs));
  }

  throw new Error(`Generation timed out after ${maxSeconds} seconds.`);
}

// Prompt enhancer helper for high-retention thumbnails
export function enhanceThumbnailPrompt(rawPrompt) {
  const p = (rawPrompt || '').trim();
  if (!p) return 'High-CTR YouTube thumbnail, extreme shock face, dramatic volumetric lighting, vibrant colors, 8k octane render, hyper-detailed viral composition';

  const enhancements = [
    'vibrant high-contrast lighting',
    'volumetric neon rim light',
    'extreme viral retention composition',
    'hyper-detailed 8K octane render',
    'unreal engine 5 photorealistic textures'
  ];

  // Avoid duplicates
  const additions = enhancements.filter(e => !p.toLowerCase().includes(e.toLowerCase()));
  if (!additions.length) return p;

  return `${p}, ${additions.slice(0, 3).join(', ')}`;
}
