// src/services/thumbnailService.js
// BangAI Neural Vision Engine - Thumbnail Studio Service
// Multi-Key Rotating Pool with Automatic Failover & High-Performance CDN

const API_KEYS = [
  'bb19f8a8b94e785f7f8cf7955ed165a6',
  'a12309554b342ed9d3d5577d4079cae0',
  '05ac939d323c2500f085f9b9ba235e85',
  'e69cdf52c51effcfebfeb44e508c8e40',
  '2157c9fa712b2064b7a781139c8122d0',
  '38c31083ef91b785609e8963ec3986f9',
  'c10776280a0f851f06aa637c09878770',
  '9fed938616d318963f3d30391789ba04',
  'd027fcf4e00e7c5e4b2717902016b5f7',
  '18609e3bdb8e6ac38de3c5c7469ede4f',
  '4626f1626df64062f34aead8fae16bab',
  '934c5d4c188c224c040d8e3f03696c92',
  'b08b84a5a4007b96d7f64d999dc7a9fe',
  '52b269d09aa3e629f5be27063286a5c7',
  '027cb49edbfe6908faf141d773f5e189',
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
  // ── TEXT-TO-IMAGE MODELS ──────────────────────────
  {
    id: 'gpt-image-2-5-flare-text-to-image',
    name: 'GPT Flare 2.5 Ultra',
    badge: 'VIRAL 4K',
    credits: 6,
    creditsByResolution: { '1K': 6, '2K': 10, '4K': 16 },
    type: 'text-to-image',
    supportsResolution: true,
    supportedResolutions: ['1K', '2K', '4K'],
    supportsBackground: true,
    requiresImage: false,
    description: 'Next-gen photorealistic thumbnails with text comprehension and 4K ultra-fine details.',
    defaultPrompt: 'Ultra high-CTR YouTube thumbnail: In foreground, an expressive young male creator with an extreme shocked, wide-eyed mouth-open reaction looking directly into camera lens with intense cyan and hot-orange rim lighting on his face. On the right, a massive glowing 10-foot steel bank vault door exploding open with millions of 3D gold bullion bars and bundles of cash blasting out. Floating near the top corner is a glossy, reflective 3D metallic red and white YouTube play button logo badge. Dynamic wide-angle lens, cinematic 8K octane render, ultra-crisp photorealistic skin textures, intense saturated viral colors --no watermark, no blur, no distorted faces',
    showcaseImage: '/showcases/gpt_flare_2_5_ultra.png'
  },
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2 Ultra (4K)',
    badge: 'ULTRA 4K',
    credits: 8,
    creditsByResolution: { '1K': 8, '2K': 12, '4K': 18 },
    type: 'text-to-image',
    supportsResolution: true,
    supportedResolutions: ['1K', '2K', '4K'],
    supportsBackground: false,
    requiresImage: false,
    description: 'Flagship 4K visual synthesis with character consistency, photorealism, and sharp detail.',
    defaultPrompt: 'Cinematic 4K YouTube thumbnail: Shocked adventurer creator in rugged expedition gear on left third with intense wide-eyed disbelief expression staring straight at camera with golden rim light, holding an ancient glowing golden artifact that projects a floating holographic 3D YouTube logo badge in mid-air. In background, a mysterious illuminated subterranean pyramid chamber with giant pharaoh statues and volumetric golden god rays. Sharp photorealistic skin pores, 8K Unreal Engine 5 render, award-winning viral documentary cover art --no blur, no watermark',
    showcaseImage: '/showcases/nano_banana_2_ultra.png'
  },
  {
    id: 'wan/2-7-image-pro',
    name: 'Wan 2.7 Image Pro',
    badge: 'PRO STUDIO',
    credits: 12,
    creditsByResolution: { '1K': 12, '2K': 12, '4K': 12 },
    type: 'text-to-image',
    supportsResolution: true,
    supportedResolutions: ['1K', '2K', '4K'],
    supportsBackground: false,
    requiresImage: false,
    description: 'Professional studio-grade visuals with superior texture resolution, lighting gradients, and multilingual text.',
    defaultPrompt: 'Epic viral YouTube thumbnail: Excited creator with hands on head in disbelief looking into camera on right, wearing modern tactical hoodie with vivid neon blue edge lighting. On left, a gigantic futuristic underground luxury bunker with neon swimming pools, helicopters, and transparent glass tunnels. Floating beside the creator is a polished 3D YouTube icon with glowing red neon aura. IMAX 70mm cinematography, razor-sharp hyper-detailed 8K textures, saturated viral colors, blockbuster YouTube production aesthetic --no blur, no low resolution',
    showcaseImage: '/showcases/wan_2_7_pro.png'
  },
  {
    id: 'gpt-image-2-text-to-image',
    name: 'GPT Image 2 (Text-to-Image)',
    badge: 'CREATIVE',
    credits: 6,
    creditsByResolution: { '1K': 6, '2K': 10, '4K': 16 },
    type: 'text-to-image',
    supportsResolution: true,
    supportedResolutions: ['1K', '2K', '4K'],
    supportsBackground: false,
    requiresImage: false,
    description: 'Highly creative, prompt-adherent image generation with complex conceptual scene understanding.',
    defaultPrompt: 'Viral high-retention YouTube thumbnail: Close-up of an exhausted but amazed male explorer with frost on eyebrows, shivering with an intense wide-eyed reaction directly into lens, warm orange lantern light contrasting with freezing icy cyan blizzard winds. In the background, an enormous glowing neon survival shelter and a floating glossy 3D metallic YouTube logo badge partially dusted in snow. Saturated high contrast, crisp macro textures, viral challenge thumbnail hierarchy --no watermark, no blur',
    showcaseImage: '/showcases/gpt_image_2_t2i.png'
  },
  {
    id: 'seedream/5-flash-text-to-image',
    name: 'Seedream 5.0 Flash (T2I)',
    badge: 'FAST 2K',
    credits: 3.24,
    creditsByResolution: { '1K': 3.24, '2K': 3.24, '4K': 3.24 },
    type: 'text-to-image',
    supportsResolution: true,
    supportedResolutions: ['1K', '2K'],
    supportsBackground: false,
    requiresImage: false,
    description: 'Ultra-fast 2K visual rendering with vibrant colors, high dynamic range, and exceptional speed.',
    defaultPrompt: 'High-energy viral YouTube thumbnail: Screaming creator with mouth open in wild thrill looking into camera from roller coaster front seat, wind blowing hair, glowing electric violet and lime green rim lights. In background, an impossible 500-foot vertical drop track plunging into a glowing neon canyon, with a prominent 3D glossy red YouTube play button badge floating in sky. Hyper-crisp 2K octane render, scroll-stopping saturated colors, dynamic action angle --no watermark, no blur',
    showcaseImage: '/showcases/seedream_5_flash_t2i.png'
  },
  {
    id: 'nano-banana-2-lite',
    name: 'Nano Banana 2 Lite',
    badge: 'LITE SPEED',
    credits: 4,
    creditsByResolution: { '1K': 4, '2K': 4, '4K': 4 },
    type: 'text-to-image',
    supportsResolution: false,
    supportedResolutions: ['1K'],
    supportsBackground: false,
    requiresImage: false,
    description: 'High-speed lightweight thumbnail engine with crisp text rendering and high contrast.',
    defaultPrompt: 'High-contrast YouTube tech thumbnail: Shocked tech creator staring in awe into camera lens on right with blazing cyan rim light, pointing directly at a sleek humanoid robot holding a glowing holographic AI core. Beside the robot floats a glossy 3D red YouTube channel verified badge. Clean dark studio background, razor-sharp edge contrast, crisp 1K macro photography, viral tech review aesthetics --no watermark, no blur',
    showcaseImage: '/showcases/nano_banana_2_lite.png'
  },
  {
    id: 'grok-imagine-image-2-0/text-to-image',
    name: 'Grok Imagine 2.0 (Text-to-Image)',
    badge: 'POPULAR',
    credits: 4,
    creditsByResolution: { '1K': 4, '2K': 4, '4K': 4 },
    type: 'text-to-image',
    supportsResolution: false,
    supportedResolutions: [],
    supportsBackground: false,
    requiresImage: false,
    description: 'Vibrant, high-contrast, razor-sharp textures ideal for eye-catching YouTube video covers.',
    defaultPrompt: 'Extreme viral YouTube thumbnail: Close-up of creator with eyes wide open and jaw dropped in shock looking directly into lens, intense neon electric magenta and lime rim lighting, holding open an ornate mystery crate emitting blinding golden rays, diamonds, and a floating glossy 3D golden YouTube play button trophy. 8K cinematic poster style, 3D particle sparks, ultra-high CTR visual hierarchy --no blur, no watermark',
    showcaseImage: '/showcases/grok_imagine_2_t2i.png'
  },

  // ── IMAGE-TO-IMAGE MODELS (Edit & Restyle) ─────────
  {
    id: 'gpt-image-2-5-flare-image-to-image',
    name: 'GPT Flare 2.5 (Image-to-Image)',
    badge: 'RESTYLE',
    credits: 6,
    creditsByResolution: { '1K': 6, '2K': 10, '4K': 16 },
    type: 'image-to-image',
    supportsResolution: true,
    supportedResolutions: ['1K', '2K', '4K'],
    supportsBackground: true,
    requiresImage: true,
    description: 'Transform or restyle any reference image into a viral thumbnail with custom lighting and style.',
    defaultPrompt: 'World-class YouTube thumbnail transformation: Turn subject into an ultra-powerful cybernetic superhero, intense blazing fiery glowing eyes, electric orange and blue energy aura radiating outwards, floating glossy 3D YouTube logo badge beside subject, background replaced with a dramatic sci-fi city explosion, hyper-detailed 3D pop, viral cover art',
    showcaseImage: '/showcases/gpt_flare_i2i.png'
  },
  {
    id: 'gpt-image-2-image-to-image',
    name: 'GPT Image 2 (Image-to-Image)',
    badge: 'TRANSFORM',
    credits: 6,
    creditsByResolution: { '1K': 6, '2K': 10, '4K': 16 },
    type: 'image-to-image',
    supportsResolution: true,
    supportedResolutions: ['1K', '2K', '4K'],
    supportsBackground: false,
    requiresImage: true,
    description: 'Advanced multimodal image transformation and style transfer for viral thumbnail edits.',
    defaultPrompt: 'Cinematic YouTube thumbnail restyle: Transform subject into a viral wilderness survivor with intense determined expression, dynamic golden sunset rim lighting, holding a high-tech glowing compass, with a glossy 3D metallic YouTube icon badge floating in the upper corner, background featuring a dramatic volcanic island and rescue helicopter, photorealistic textures, viral YouTube cover art',
    showcaseImage: '/showcases/gpt_image_2_i2i.png'
  },
  {
    id: 'seedream/5-flash-image-to-image',
    name: 'Seedream 5.0 Flash (I2I)',
    badge: 'FAST EDIT',
    credits: 3.24,
    creditsByResolution: { '1K': 3.24, '2K': 3.24, '4K': 3.24 },
    type: 'image-to-image',
    supportsResolution: true,
    supportedResolutions: ['1K', '2K'],
    supportsBackground: false,
    requiresImage: true,
    description: 'Fast reference image restyling, face/lighting adaptation, and thumbnail remixing.',
    defaultPrompt: 'Viral YouTube thumbnail edit: Dramatically transform the subject into a high-stakes YouTube creator with intense neon cyan and hot orange rim lighting, shocked wide-eyed expression, adding a massive floating 3D red YouTube play button badge next to them, and an explosive futuristic sci-fi laboratory background with sparks and emergency sirens, razor-sharp outlines, viral CTR cover art',
    showcaseImage: '/showcases/seedream_5_flash_i2i.png'
  },
  {
    id: 'grok-imagine-image-2-0/image-edit',
    name: 'Grok Imagine 2.0 (Image Edit)',
    badge: 'EDIT',
    credits: 4,
    creditsByResolution: { '1K': 4, '2K': 4, '4K': 4 },
    type: 'image-to-image',
    supportsResolution: false,
    supportedResolutions: [],
    supportsBackground: false,
    requiresImage: true,
    description: 'Modify elements, swap backgrounds, and enhance existing scenes with generative precision.',
    defaultPrompt: 'Transform the scene into a luxurious modern penthouse bedroom with floor-to-ceiling panoramic glass windows overlooking a neon cyberpunk city skyline at sunset.',
    showcaseImage: '/showcases/grok_edit.jpg'
  }
];

// Helper to calculate exact model credits based on selected resolution
export function getModelCredits(modelOrId, resolution = '1K') {
  let model = modelOrId;
  if (typeof modelOrId === 'string') {
    model = THUMBNAIL_MODELS.find(m => m.id === modelOrId);
  }
  if (!model) return 4;
  if (model.creditsByResolution && model.creditsByResolution[resolution] !== undefined) {
    return model.creditsByResolution[resolution];
  }
  return model.credits;
}

export const TEXT_TO_IMAGE_MODELS = THUMBNAIL_MODELS.filter(m => m.type === 'text-to-image');
export const IMAGE_TO_IMAGE_MODELS = THUMBNAIL_MODELS.filter(m => m.type === 'image-to-image');

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

export const THUMBNAIL_STYLES = [
  {
    id: 'viral-high-ctr',
    label: 'Viral High-CTR',
    emoji: '🔥',
    tagline: 'MrBeast Style · Real Shocked Face · 3D YouTube Badge · Extreme Rim Light',
    keywords: 'MrBeast viral challenge thumbnail aesthetics: Expressive real human face with jaw-dropping wide-eyed reaction looking directly into lens, intense dual rim lighting (electric cyan and neon orange), floating glossy 3D reflective YouTube logo icon badge, explosive 3D props bursting toward viewer, hyper-saturated colors, razor-sharp edge contrast, 8K octane render --no watermark, no blur, no low resolution, no artifacts'
  },
  {
    id: 'dark-mystery',
    label: 'Dark Mystery',
    emoji: '🛸',
    tagline: 'Documentary · Eerie Spotlights · Unsolved Lore',
    keywords: 'Cinematic documentary YouTube thumbnail: Eerie cosmic and supernatural mystery atmosphere, intense investigative creator expression looking into lens, floating 3D red YouTube channel emblem, dramatic volumetric spotlight cutting through dark mist, deep shadowy contrast, high visual hierarchy, razor-sharp textures, Unreal Engine 5 cinematic render --no watermark, no blur'
  },
  {
    id: 'tech-cyber',
    label: 'Futuristic Tech',
    emoji: '⚡',
    tagline: 'MKBHD Style · Glowing Gadgets · 3D Verified Badge',
    keywords: 'High-tech YouTube thumbnail: Tech creator holding glowing futuristic product with blazing cyan and lime rim lights, floating 3D YouTube channel verified badge, exploded transparent glowing cybernetic architecture, sleek dark studio backdrop, crisp macro photography, modern viral tech review cover style, 8K render --no watermark, no blur'
  },
  {
    id: 'cinematic-epic',
    label: 'Cinematic Movie',
    emoji: '🎬',
    tagline: 'Blockbuster · IMAX 8K · Volumetric God Rays',
    keywords: 'Epic cinematic blockbuster YouTube thumbnail: Dramatic IMAX widescreen framing, golden hour volumetric god rays, intense atmospheric storytelling, photorealistic 8K textures, award-winning cinematography, prominent focal character with 3D YouTube badge accent, Hollywood poster quality --no watermark, no blur'
  },
  {
    id: 'shock-drama',
    label: 'Shock & Drama',
    emoji: '😱',
    tagline: 'Extreme Emotion · Neon Pop · 3D Glowing Icons',
    keywords: 'High-emotion viral YouTube thumbnail: Extreme expressive reaction creator looking directly into camera with intense wide-eyed drama, vibrant purple and electric lime rim lights, floating 3D metallic YouTube logo badge, bold retention hierarchy, hyper-detailed skin pores and eye reflections --no watermark, no blur'
  }
];

export const VIRAL_PRESETS = [
  {
    id: 'mrbeast',
    emoji: '🔥',
    label: 'High-CTR MrBeast Challenge',
    prompt: 'Ultra high-CTR YouTube thumbnail: In foreground, an expressive young male creator with an extreme shocked, wide-eyed mouth-open reaction looking directly into camera lens with intense cyan and hot-orange rim lighting on his face. On the right, a massive glowing 10-foot steel bank vault door exploding open with millions of 3D gold bullion bars and bundles of cash blasting out. Floating near the top corner is a glossy, reflective 3D metallic red and white YouTube play button logo badge. Dynamic wide-angle lens, cinematic 8K octane render.',
    aspectRatio: '16:9',
    modelId: 'gpt-image-2-5-flare-text-to-image'
  },
  {
    id: 'deep-lore',
    emoji: '🌌',
    label: '4K Deep Lore / Ancient Secret',
    prompt: 'Cinematic 4K YouTube thumbnail: Shocked adventurer creator in rugged expedition gear on left third with intense wide-eyed disbelief expression staring straight at camera with golden rim light, holding an ancient glowing golden artifact that projects a floating holographic 3D YouTube logo badge in mid-air. In background, an illuminated subterranean pyramid chamber with giant pharaoh statues and volumetric golden god rays.',
    aspectRatio: '16:9',
    modelId: 'nano-banana-2'
  },
  {
    id: 'shock',
    emoji: '😱',
    label: 'Shocked Face + 3D YouTube Trophy',
    prompt: 'Extreme viral YouTube thumbnail: Close-up of creator with eyes wide open and jaw dropped in shock looking directly into lens, intense neon electric magenta and lime rim lighting, holding open an ornate mystery crate emitting blinding golden rays, diamonds, and a floating glossy 3D golden YouTube play button trophy. 8K cinematic poster style, 3D particle sparks.',
    aspectRatio: '16:9',
    modelId: 'grok-imagine-image-2-0/text-to-image'
  },
  {
    id: 'mystery',
    emoji: '🛸',
    label: 'Dark Mystery / Megastructure',
    prompt: 'Epic viral YouTube thumbnail: Excited creator with hands on head in disbelief looking into camera on right, wearing modern tactical hoodie with vivid neon blue edge lighting. On left, a gigantic futuristic underground luxury bunker with neon swimming pools, helicopters, and transparent glass tunnels. Floating beside the creator is a polished 3D YouTube icon with glowing red neon aura. IMAX 70mm cinematography.',
    aspectRatio: '16:9',
    modelId: 'wan/2-7-image-pro'
  },
  {
    id: 'wealth',
    emoji: '💰',
    label: '$1M Crypto / Island Split Challenge',
    prompt: 'Viral high-retention YouTube thumbnail: Close-up of an exhausted but amazed male explorer with frost on eyebrows, shivering with an intense wide-eyed reaction directly into lens, warm orange lantern light contrasting with freezing icy cyan blizzard winds. In the background, an enormous glowing neon survival shelter and a floating glossy 3D metallic YouTube logo badge partially dusted in snow.',
    aspectRatio: '16:9',
    modelId: 'gpt-image-2-text-to-image'
  },
  {
    id: 'fast-trend',
    emoji: '⚡',
    label: 'Fast Trend / Thrill Ride (2K)',
    prompt: 'High-energy viral YouTube thumbnail: Screaming creator with mouth open in wild thrill looking into camera from roller coaster front seat, wind blowing hair, glowing electric violet and lime green rim lights. In background, an impossible 500-foot vertical drop track plunging into a glowing neon canyon, with a prominent 3D glossy red YouTube play button badge floating in sky. Hyper-crisp 2K octane render.',
    aspectRatio: '16:9',
    modelId: 'seedream/5-flash-text-to-image'
  },
  {
    id: 'tech',
    emoji: '🦾',
    label: 'Tech Breakdown / Illegal AI Robot',
    prompt: 'High-contrast YouTube tech thumbnail: Shocked tech creator staring in awe into camera lens on right with blazing cyan rim light, pointing directly at a sleek humanoid robot holding a glowing holographic AI core. Beside the robot floats a glossy 3D red YouTube channel verified badge. Clean dark studio background, razor-sharp edge contrast.',
    aspectRatio: '16:9',
    modelId: 'nano-banana-2-lite'
  },
  {
    id: 'shorts',
    emoji: '📱',
    label: 'Vertical Viral Short (9:16)',
    prompt: 'Vertical 9:16 mobile YouTube Short thumbnail: Shocked creator face close-up looking at camera with mouth agape, holding a floating glowing 3D red YouTube play button icon emitting neon spark embers, bold yellow warning arrow pointing downward, intense high-contrast rim lighting.',
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

// Pre-condition any prompt or topic to strictly act as a world-class high-CTR YouTube thumbnail
export function conditionThumbnailPrompt(rawPrompt, { styleId = 'viral-high-ctr', isEdit = false } = {}) {
  const p = (rawPrompt || '').trim();
  const activeStyle = THUMBNAIL_STYLES.find(s => s.id === styleId) || THUMBNAIL_STYLES[0];

  if (!p) {
    return activeStyle.keywords;
  }

  // If this is an Image-to-Image / Image Edit task:
  if (isEdit) {
    return `World-class viral YouTube thumbnail edit & restyle: Transform reference subject into a top-tier YouTube creator cover for topic: "${p}". Incorporate high-emotion wide-eyed expression, intense neon edge rim lighting (electric cyan and vibrant orange), a prominent floating glossy 3D metallic YouTube logo badge, high-contrast background props related to "${p}", razor-sharp edges, viral retention layout, 8K octane render quality --no watermark, no blur, no distorted face, no low resolution`;
  }

  // If user already wrote a comprehensive thumbnail prompt with YouTube elements:
  if (p.length > 250 && /youtube/i.test(p) && /thumbnail/i.test(p)) {
    return `${p} --no watermark, no blur, no distorted faces, no low resolution, no low quality, no artifacts`;
  }

  // Pre-condition short or standard topics into a complete world-class YouTube thumbnail specification:
  return `Professional viral YouTube thumbnail: "${p}". Focal Subject: High-energy real creator with an intense shocked, wide-eyed mouth-open reaction expression looking directly into the camera lens on one third of the frame, with vibrant electric rim lighting. Key Elements: Dramatic focal prop representing "${p}", floating glossy 3D metallic red YouTube play button badge with specular reflections, high-contrast graphic separation, deliberate negative space for headline readability. Style & Lighting: ${activeStyle.keywords}. Hyper-detailed 8K octane render, photorealistic skin textures, viral CTR visual hierarchy --no watermark, no blur, no low resolution, no deformed hands, no distorted faces`;
}

// Build model-specific input payload with automated backend pre-conditioning
export function buildModelInput(modelId, { prompt, aspectRatio = '16:9', resolution = '1K', background = 'auto', imageUrl = null, styleId = 'viral-high-ctr' }) {
  const isImageToImage = modelId.includes('image-edit') || modelId.includes('image-to-image');
  const conditionedPrompt = conditionThumbnailPrompt(prompt, { styleId, isEdit: isImageToImage });

  // 1. Grok Imagine 2.0 T2I
  if (modelId === 'grok-imagine-image-2-0/text-to-image') {
    return {
      prompt: conditionedPrompt,
      aspect_ratio: aspectRatio
    };
  }

  // 2. Grok Imagine 2.0 Image Edit
  if (modelId === 'grok-imagine-image-2-0/image-edit') {
    if (!imageUrl) throw new Error('A reference image is required for Grok Image Edit.');
    return {
      prompt: conditionedPrompt,
      aspect_ratio: aspectRatio,
      image_urls: [imageUrl]
    };
  }

  // 3. GPT Flare 2.5 Ultra T2I
  if (modelId === 'gpt-image-2-5-flare-text-to-image') {
    return {
      prompt: conditionedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      background
    };
  }

  // 4. GPT Flare 2.5 I2I
  if (modelId === 'gpt-image-2-5-flare-image-to-image') {
    if (!imageUrl) throw new Error('A reference image is required for GPT Flare Image-to-Image.');
    return {
      prompt: conditionedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      background,
      input_urls: [imageUrl]
    };
  }

  // 5. GPT Image 2 T2I
  if (modelId === 'gpt-image-2-text-to-image') {
    return {
      prompt: conditionedPrompt,
      aspect_ratio: aspectRatio,
      resolution
    };
  }

  // 6. GPT Image 2 I2I
  if (modelId === 'gpt-image-2-image-to-image') {
    if (!imageUrl) throw new Error('A reference image is required for GPT Image 2 Image-to-Image.');
    return {
      prompt: conditionedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      input_urls: [imageUrl]
    };
  }

  // 7. Seedream 5.0 Flash T2I
  if (modelId === 'seedream/5-flash-text-to-image') {
    return {
      prompt: conditionedPrompt,
      aspect_ratio: aspectRatio,
      resolution: resolution === '4K' ? '2K' : resolution,
      output_format: 'png'
    };
  }

  // 8. Seedream 5.0 Flash I2I
  if (modelId === 'seedream/5-flash-image-to-image') {
    if (!imageUrl) throw new Error('A reference image is required for Seedream Image-to-Image.');
    return {
      prompt: conditionedPrompt,
      aspect_ratio: aspectRatio,
      resolution: resolution === '4K' ? '2K' : resolution,
      image_urls: [imageUrl],
      output_format: 'png'
    };
  }

  // 9. Nano Banana 2 Ultra (4K)
  if (modelId === 'nano-banana-2') {
    const payload = {
      prompt: conditionedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      output_format: 'png'
    };
    if (imageUrl) payload.image_urls = [imageUrl];
    return payload;
  }

  // 10. Nano Banana 2 Lite
  if (modelId === 'nano-banana-2-lite') {
    const payload = {
      prompt: conditionedPrompt,
      aspect_ratio: aspectRatio,
      resolution: '1K',
      output_format: 'png'
    };
    if (imageUrl) payload.image_urls = [imageUrl];
    return payload;
  }

  // 11. Wan 2.7 Image Pro
  if (modelId === 'wan/2-7-image-pro') {
    const payload = {
      prompt: conditionedPrompt,
      aspect_ratio: aspectRatio,
      resolution
    };
    if (imageUrl) payload.input_urls = [imageUrl];
    return payload;
  }

  return { prompt: conditionedPrompt, aspect_ratio: aspectRatio };
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

// Prompt enhancer helper for high-retention thumbnails (transforms short topics into full thumbnail prompts)
export function enhanceThumbnailPrompt(rawPrompt, styleId = 'viral-high-ctr') {
  const p = (rawPrompt || '').trim();
  const activeStyle = THUMBNAIL_STYLES.find(s => s.id === styleId) || THUMBNAIL_STYLES[0];

  if (!p) {
    return 'Ultra high-CTR professional YouTube thumbnail: Epic viral mystery scene with glowing 3D depth, extreme cinematic lighting, volumetric neon rim lights, hyper-detailed 8K octane render, photorealistic textures, Unreal Engine 5 cinematic masterwork';
  }

  // If already detailed, add polish
  if (p.length > 150 && /youtube thumbnail/i.test(p)) {
    return `${p}, dramatic volumetric rim light, hyper-detailed 8K octane render, photorealistic textures, Unreal Engine 5 quality`;
  }

  // Transform short topic into an elite YouTube thumbnail prompt
  return `Ultra high-CTR professional YouTube thumbnail: ${p}, dramatic cinematic lighting with volumetric neon rim light, deep rich contrast, bold focal point with dynamic 3D depth, vibrant saturated color grading, hyper-detailed 8K octane render, photorealistic textures, Unreal Engine 5 cinematic blockbuster quality, clean sharp edges --no watermark, no blur`;
}
