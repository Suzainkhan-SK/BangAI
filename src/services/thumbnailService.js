// src/services/thumbnailService.js
// BangAI Neural Vision Engine - Thumbnail Studio Service
// Multi-Key Rotating Pool with Automatic Failover & High-Performance CDN

// All vision engine requests, key pools, and rotation are securely handled server-side
// via /.netlify/functions/thumbnail (zero API keys exposed in browser or DevTools)
const THUMBNAIL_PROXY_URL = '/.netlify/functions/thumbnail';

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
    defaultPrompt: 'Viral YouTube thumbnail in MrBeast challenge style: Prominently displaying large, ultra-bold 3D extruded title text reading "$10,000,000 VAULT" in radiant yellow and white with thick black outline and drop shadow across the top. On the left third, an expressive young male creator with wide eyes and open mouth in extreme disbelief looking directly into the camera lens with vivid cyan and warm gold rim lighting. On the right, a massive 12-foot stainless steel bank vault door exploding open with millions of 3D gold bullion bars and cash stacks flying outward. Razor-sharp foreground, high contrast, 8K octane render --no watermark, no blur, no low resolution',
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
    defaultPrompt: 'Professional YouTube documentary thumbnail in World Mysteries style: Prominent bold high-contrast title text across the top reading "12,000 YEAR SECRET" in solid white and glowing gold capital letters with black outline. In a colossal subterranean cavern, a shocked archaeologist holding a bright lantern looks up in awe at an ancient glowing blue alien monolith covered in glowing runes. Volumetric atmospheric god rays, cinematic 4K Unreal Engine render, high visual hierarchy --no watermark, no blur',
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
    defaultPrompt: 'Professional Hindi YouTube investigative thumbnail in Dhruv Rathee documentary style: On the right, a serious Indian investigative journalist in a dark polo looking directly into the camera with studio rim lighting. Prominent bold high-contrast Hindi and English typography across the top reading "काला सच: UNDERSEA CABLES" with yellow subtitle "भारत का डेटा खतरे में!". In the background, a dark illuminated 3D globe showing glowing fiber optic submarine cables connecting India and global ports, with a red alert circle pinpointing deep ocean sabotage. Crisp newsroom grading, razor-sharp contrast --no watermark, no blur',
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
    defaultPrompt: 'Viral Hindi YouTube horror thumbnail in Khooni Monday and 3-AM Horror style: Large bold blood-red and white Hindi typography across the upper third reading "रात 3 बजे मत जाना!" with glowing yellow outline. In an eerie dark abandoned Indian palace haveli at night, a glowing red digital clock clearly displays "03:00 AM". A sharp flashlight beam cuts through thick sinister fog illuminating a terrifying shadowy supernatural ghost silhouette near an ancient carved wooden door. Intense dark horror atmosphere, cinematic grading --no watermark, no blur',
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
    defaultPrompt: 'Viral Hindi YouTube vlog thumbnail in Gaurav Taneja Flying Beast style: Large bold slanted Hindi action typography across the top reading "24 घंटे ट्रेन में फंसे!" in high-voltage electric yellow and fire-red with heavy black shadow. An energetic Indian creator looking directly into the camera with wide eyes and windblown hair, illuminated by neon purple and warm orange rim lights. In the background, an Indian Railways train speeding on tracks during a dramatic lightning thunderstorm. Fast-motion blur on background, hyper-sharp foreground subject, saturated viral colors, 2K octane render --no watermark, no blur on subject',
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
    defaultPrompt: 'Viral YouTube tech thumbnail in Technical Guruji tech review style: Bold glowing cybernetic title text at the top reading "BANNED IN 2026!" in luminous neon cyan and white with red alert badge. An amazed tech creator pointing directly at a floating, transparent glowing quantum AI processor chip in a dark studio. Pulsing neon cyan and emerald circuit traces, razor-sharp macro reflections, clean dark studio backdrop, crisp edge separation --no watermark, no blur',
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
    defaultPrompt: 'Dramatic YouTube investigative thumbnail in Last 24 Hours mystery style: Bold high-contrast documentary headline text reading "BERMUDA TRIANGLE: WHAT HAPPENED?" in bold white and hazard yellow lettering on top. Split scene of a vintage aircraft vanishing into an enormous spiraling dark oceanic vortex over green lightning, with dramatic searchlight beams and a glowing cockpit radar screen. Cinematic 35mm film grading, rich deep contrast --no watermark, no blur',
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
    defaultPrompt: 'Viral YouTube thumbnail restyle: Transform reference subject into a triumphant MrBeast challenge winner. Feature large bold 3D golden title text on top reading "$1,000,000 WINNER!" with glowing sparkle accents. Creator has joyful triumphant expression, holding a giant ceremonial check surrounded by confetti bursts, stacks of money, and glowing golden spotlights. High contrast, 8K octane render --no watermark, no blur',
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
    defaultPrompt: 'Cinematic YouTube horror thumbnail transformation: Restyle reference subject into a terrified investigator inside a haunted asylum. Bold ominous title text reading "THE 3 AM HAUNTING" in glowing ghostly green typography at the top. Subject has wide-eyed fear expression illuminated by an intense green night-vision flashlight beam, with shadowy supernatural apparitions behind them. Chilling horror color grading, sharp textures --no watermark, no blur',
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
    defaultPrompt: 'Investigative documentary YouTube thumbnail: Transform subject into a serious investigative journalist with bold red banner typography reading "THE SECRET EXPOSED" across the top. Studio background features a dark holographic world map with glowing classified evidence files, connecting red string diagrams, and sharp dramatic directional studio lighting. Razor-sharp outlines, high visual contrast --no watermark, no blur',
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
    defaultPrompt: 'YouTube tech thriller thumbnail edit: Place subject inside a high-security subterranean military research facility with emergency flashing red lights and glowing holographic status screens. Bold futuristic title text on top reading "SECRET PROTOCOL 9" in bright warning orange and white letters. Cinematic depth of field, sharp edge contrast --no watermark, no blur',
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
    tagline: 'High Impact · Bold Pop · Dynamic Lighting',
    keywords: 'High-CTR thumbnail aesthetics: Explosive visual pop, vibrant dual-color rim lighting, high contrast, crisp edge definition, dynamic wide-angle composition, hyper-detailed 8K octane render, photorealistic textures --no watermark, no blur, no low resolution, no artifacts'
  },
  {
    id: 'dark-mystery',
    label: 'Dark Mystery',
    emoji: '🛸',
    tagline: 'Documentary · Eerie Spotlights · Deep Contrast',
    keywords: 'Cinematic documentary thumbnail style: Eerie suspenseful atmosphere, dramatic volumetric spotlight cutting through dark mist, deep shadowy contrast, high visual hierarchy, razor-sharp textures, Unreal Engine 5 cinematic render --no watermark, no blur'
  },
  {
    id: 'tech-cyber',
    label: 'Futuristic Tech',
    emoji: '⚡',
    tagline: 'Clean Studio · Neon Accents · Macro Clarity',
    keywords: 'High-tech YouTube thumbnail style: Sleek modern aesthetic, vibrant neon blue and emerald accent lighting, clean dark studio backdrop, razor-sharp macro photography, modern tech review cover style, 8K render --no watermark, no blur'
  },
  {
    id: 'cinematic-epic',
    label: 'Cinematic Movie',
    emoji: '🎬',
    tagline: 'Blockbuster · IMAX Scale · Volumetric Rays',
    keywords: 'Epic cinematic blockbuster thumbnail style: Dramatic IMAX widescreen framing, golden hour volumetric god rays, intense atmospheric storytelling, photorealistic 8K textures, award-winning cinematography, Hollywood poster quality --no watermark, no blur'
  },
  {
    id: 'shock-drama',
    label: 'Shock & Drama',
    emoji: '😱',
    tagline: 'High Energy · Vivid Contrast · Neon Glow',
    keywords: 'High-emotion dramatic thumbnail style: Intense expressive focal subject, vibrant purple and electric lime rim lights, bold retention hierarchy, hyper-detailed skin pores and eye reflections, 8K render --no watermark, no blur'
  }
];

export const VIRAL_PRESETS = [
  {
    id: 'mrbeast',
    emoji: '🔥',
    label: '$10M Vault Challenge (MrBeast Style)',
    prompt: 'Viral YouTube thumbnail in MrBeast challenge style: Prominently displaying large, ultra-bold 3D extruded title text reading "$10,000,000 VAULT" in radiant yellow and white with thick black outline and drop shadow across the top. On the left third, an expressive young male creator with wide eyes and open mouth in extreme disbelief looking directly into the camera lens with vivid cyan and warm gold rim lighting. On the right, a massive 12-foot stainless steel bank vault door exploding open with millions of 3D gold bullion bars and cash stacks flying outward. Razor-sharp foreground, high contrast, 8K octane render --no watermark, no blur, no low resolution',
    aspectRatio: '16:9',
    modelId: 'gpt-image-2-5-flare-text-to-image'
  },
  {
    id: 'khooni-monday',
    emoji: '👻',
    label: 'रात 3 बजे मत जाना! (Khooni Monday Horror)',
    prompt: 'Viral Hindi YouTube horror thumbnail in Khooni Monday and 3-AM Horror style: Large bold blood-red and white Hindi typography across the upper third reading "रात 3 बजे मत जाना!" with glowing yellow outline. In an eerie dark abandoned Indian palace haveli at night, a glowing red digital clock clearly displays "03:00 AM". A sharp flashlight beam cuts through thick sinister fog illuminating a terrifying shadowy supernatural ghost silhouette near an ancient carved wooden door. Intense dark horror atmosphere, cinematic grading --no watermark, no blur',
    aspectRatio: '16:9',
    modelId: 'gpt-image-2-text-to-image'
  },
  {
    id: 'dhruv-rathee',
    emoji: '🔍',
    label: 'काला सच: Undersea Cables (Dhruv Rathee Style)',
    prompt: 'Professional Hindi YouTube investigative thumbnail in Dhruv Rathee documentary style: On the right, a serious Indian investigative journalist in a dark polo looking directly into the camera with studio rim lighting. Prominent bold high-contrast Hindi and English typography across the top reading "काला सच: UNDERSEA CABLES" with yellow subtitle "भारत का डेटा खतरे में!". In the background, a dark illuminated 3D globe showing glowing fiber optic submarine cables connecting India and global ports, with a red alert circle pinpointing deep ocean sabotage. Crisp newsroom grading, razor-sharp contrast --no watermark, no blur',
    aspectRatio: '16:9',
    modelId: 'wan/2-7-image-pro'
  },
  {
    id: 'flying-beast',
    emoji: '⚡',
    label: '24 घंटे ट्रेन में फंसे! (Flying Beast / Gaurav Taneja)',
    prompt: 'Viral Hindi YouTube vlog thumbnail in Gaurav Taneja Flying Beast style: Large bold slanted Hindi action typography across the top reading "24 घंटे ट्रेन में फंसे!" in high-voltage electric yellow and fire-red with heavy black shadow. An energetic Indian creator looking directly into the camera with wide eyes and windblown hair, illuminated by neon purple and warm orange rim lights. In the background, an Indian Railways train speeding on tracks during a dramatic lightning thunderstorm. Fast-motion blur on background, hyper-sharp foreground subject, saturated viral colors, 2K octane render --no watermark, no blur on subject',
    aspectRatio: '16:9',
    modelId: 'seedream/5-flash-text-to-image'
  },
  {
    id: 'tech-guruji',
    emoji: '🦾',
    label: 'BANNED IN 2026! (Technical Guruji Tech)',
    prompt: 'Viral YouTube tech thumbnail in Technical Guruji tech review style: Bold glowing cybernetic title text at the top reading "BANNED IN 2026!" in luminous neon cyan and white with red alert badge. An amazed tech creator pointing directly at a floating, transparent glowing quantum AI processor chip in a dark studio. Pulsing neon cyan and emerald circuit traces, razor-sharp macro reflections, clean dark studio backdrop, crisp edge separation --no watermark, no blur',
    aspectRatio: '16:9',
    modelId: 'nano-banana-2-lite'
  },
  {
    id: 'world-mystery',
    emoji: '🛸',
    label: '12,000 YEAR SECRET (World Mysteries)',
    prompt: 'Professional YouTube documentary thumbnail in World Mysteries style: Prominent bold high-contrast title text across the top reading "12,000 YEAR SECRET" in solid white and glowing gold capital letters with black outline. In a colossal subterranean cavern, a shocked archaeologist holding a bright lantern looks up in awe at an ancient glowing blue alien monolith covered in glowing runes. Volumetric atmospheric god rays, cinematic 4K Unreal Engine render, high visual hierarchy --no watermark, no blur',
    aspectRatio: '16:9',
    modelId: 'nano-banana-2'
  },
  {
    id: 'bermuda',
    emoji: '⏳',
    label: 'BERMUDA TRIANGLE: WHAT HAPPENED? (Last 24 Hours)',
    prompt: 'Dramatic YouTube investigative thumbnail in Last 24 Hours mystery style: Bold high-contrast documentary headline text reading "BERMUDA TRIANGLE: WHAT HAPPENED?" in bold white and hazard yellow lettering on top. Split scene of a vintage aircraft vanishing into an enormous spiraling dark oceanic vortex over green lightning, with dramatic searchlight beams and a glowing cockpit radar screen. Cinematic 35mm film grading, rich deep contrast --no watermark, no blur',
    aspectRatio: '16:9',
    modelId: 'grok-imagine-image-2-0/text-to-image'
  },
  {
    id: 'shorts',
    emoji: '📱',
    label: 'Vertical Viral Short (9:16)',
    prompt: 'Vertical 9:16 mobile YouTube Short thumbnail: Bold top headline reading "DO NOT WATCH!" in flaming neon yellow with red warning border. Shocked creator face close-up looking at camera with mouth agape, holding a glowing mystery device emitting neon sparks, bold contrasting lighting, high-energy viral retention style --no watermark, no blur',
    aspectRatio: '9:16',
    modelId: 'gpt-image-2-5-flare-text-to-image'
  }
];

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

// Upload image file to CDN via secure serverless proxy
export async function uploadImageToCDN(file) {
  const base64Data = await fileToBase64(file);
  const cleanName = (file.name || 'reference_image.png').replace(/[^a-zA-Z0-9._-]/g, '_');

  const res = await fetch(`${THUMBNAIL_PROXY_URL}?action=uploadImage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      base64Data,
      fileName: cleanName,
      uploadPath: 'images'
    })
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `CDN upload failed with status ${res.status}`);
  }

  const json = await res.json();
  const cdnUrl = json?.downloadUrl;
  if (!cdnUrl) {
    throw new Error('CDN response did not return a valid downloadUrl');
  }
  return cdnUrl;
}

// Naturally adapt any video topic or prompt into a real YouTube thumbnail with topic title typography
export function conditionThumbnailPrompt(rawPrompt, { styleId = 'viral-high-ctr', isEdit = false } = {}) {
  const p = (rawPrompt || '').trim();
  const activeStyle = THUMBNAIL_STYLES.find(s => s.id === styleId) || THUMBNAIL_STYLES[0];

  if (!p) {
    return `YouTube thumbnail composition: Bold focal subject, dynamic rim lighting, high contrast, crisp edge definition, 8K cinematic render --no watermark, no blur`;
  }

  // If user already wrote detailed thumbnail instructions or negative flags:
  if (p.toLowerCase().includes('--no') || (p.length > 200 && p.toLowerCase().includes('youtube thumbnail'))) {
    return `${p} --no watermark, no blur, no low resolution, no artifacts`;
  }

  // For image-to-image / restyle tasks:
  if (isEdit) {
    return `Viral YouTube thumbnail transformation for topic: "${p}". Prominent high-contrast topic title text across the top reading "${p}". Enhance focal subject with intense thumbnail rim lighting, sharp foreground separation, dynamic cinematic depth, and vibrant colors. ${activeStyle.keywords}`;
  }

  // Standard text-to-image: adapt video topic into proper thumbnail framing with bold title text of the topic
  return `Real YouTube thumbnail for video topic "${p}": Featuring prominent, large bold title typography across the upper frame displaying "${p}" with high-contrast outline and drop shadow. Bold focal subject on one third, dramatic contrasting lighting, crisp foreground separation, high-retention visual hierarchy. ${activeStyle.keywords}`;
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

// Generate thumbnail task via secure serverless proxy with multi-key rotation and automatic failover
export async function createThumbnailTask(modelId, params) {
  const input = buildModelInput(modelId, params);

  const res = await fetch(`${THUMBNAIL_PROXY_URL}?action=createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelId,
      input
    })
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success || !json.taskId) {
    throw new Error(json.error || `Task creation failed with status ${res.status}`);
  }

  return {
    taskId: json.taskId,
    keyUsed: 'secure_vault',
    modelId,
    input
  };
}

// Poll task result via secure serverless proxy with failover
export async function pollThumbnailTask(taskId, keyUsed, { onProgress, maxSeconds = 120 } = {}) {
  const startTime = Date.now();
  const pollIntervalMs = 2000;

  while ((Date.now() - startTime) < maxSeconds * 1000) {
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);
    if (typeof onProgress === 'function') {
      onProgress({ elapsedSec, status: 'processing' });
    }

    try {
      const res = await fetch(`${THUMBNAIL_PROXY_URL}?action=pollTask&taskId=${encodeURIComponent(taskId)}`, {
        method: 'GET'
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const state = json.state;

          if (state === 'success') {
            return {
              state: 'success',
              resultUrl: json.resultUrl,
              taskData: json,
              elapsedSec
            };
          }

          if (state === 'fail') {
            throw new Error(json.failReason || 'Vision engine task processing failed.');
          }
        }
      }
    } catch (pollErr) {
      if (pollErr.message && /failed/i.test(pollErr.message)) {
        throw pollErr;
      }
    }

    await new Promise(r => setTimeout(r, pollIntervalMs));
  }

  throw new Error(`Generation timed out after ${maxSeconds} seconds.`);
}

// Prompt enhancer helper: naturally adapts any prompt or topic into proper thumbnail aesthetics with bold topic text
export function enhanceThumbnailPrompt(rawPrompt, styleId = 'viral-high-ctr') {
  const p = (rawPrompt || '').trim();
  const activeStyle = THUMBNAIL_STYLES.find(s => s.id === styleId) || THUMBNAIL_STYLES[0];

  if (!p) {
    return `YouTube thumbnail composition: Bold focal subject, dynamic rim lighting, high contrast, crisp edge definition, 8K cinematic render --no watermark, no blur`;
  }

  // If already detailed with negative prompt, just ensure thumbnail framing
  if (p.toLowerCase().includes('--no')) {
    return p.toLowerCase().includes('thumbnail') ? p : `YouTube thumbnail: ${p}`;
  }

  // Enhance user topic with thumbnail visual impact and prominent title typography
  return `Real YouTube thumbnail for video topic "${p}": Featuring prominent bold title typography across the upper frame reading "${p}" with high-contrast outline. High dynamic contrast, sharp focal subject, vibrant cinematic lighting, crisp depth of field, 8K visual clarity --no watermark, no blur, no low resolution`;
}
