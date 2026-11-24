import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Image as ImageIcon, Wand2, Download, Copy, Check,
  RefreshCw, Upload, X, ChevronDown, Eye, Sliders, Layers,
  Zap, AlertCircle, CheckCircle2, Loader2, ArrowRight, Maximize2,
  FileCode, Play, Trash2, Camera, Compass, Film, ExternalLink,
  Flame, Monitor, Smartphone, Square, Layout
} from 'lucide-react';
import AppShell from '../components/Layout/AppShell';
import { audioEngine } from '../audio/audioEngine';
import { useBreakpoint } from '../hooks/useMediaQuery';
import {
  THUMBNAIL_MODELS,
  TEXT_TO_IMAGE_MODELS,
  IMAGE_TO_IMAGE_MODELS,
  ASPECT_RATIOS,
  RESOLUTIONS,
  VIRAL_PRESETS,
  getModelCredits,
  uploadImageToCDN,
  createThumbnailTask,
  pollThumbnailTask,
  enhanceThumbnailPrompt,
  buildModelInput,
  fetchLiveThumbnailConfig,
  getStoredThumbnailConfig,
  saveStoredThumbnailConfig
} from '../services/thumbnailService';

// Creative prompt booster tags for rapid 1-click thumbnail conditioning
const QUICK_PROMPT_TAGS = [
  'Shocked Creator Face',
  'Bold 3D Extruded Text',
  'Neon Cyan & Warm Rim Light',
  'Exploding Cash & Gold',
  '8K Octane Render',
  'Volumetric Cinematic Fog',
  'Hindi Action Typography',
  'Macro Lens Separation'
];

/**
 * Robust history item renderer with graceful error fallback.
 * Prevents broken images from appearing when temporary URLs expire.
 */
function HistoryThumbnailItem({ item, isSelected, onClick }) {
  const [imgError, setImgError] = useState(!item?.imageUrl);

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: item.aspectRatio === '9:16' ? '46px' : '88px',
        height: '52px',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: isSelected ? '2px solid #ff4f00' : '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        flexShrink: 0,
        boxShadow: isSelected ? '0 0 12px rgba(255, 79, 0, 0.4)' : 'none',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
      title={item.prompt || 'Generated thumbnail'}
    >
      {!imgError && item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.prompt ? item.prompt.slice(0, 30) : 'Thumbnail'}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(255, 79, 0, 0.12), rgba(99, 102, 241, 0.12))',
          gap: '2px',
          padding: '4px'
        }}>
          <ImageIcon size={14} color="#ff4f00" />
          <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)' }}>
            {item.aspectRatio || '16:9'}
          </span>
        </div>
      )}
      <span style={{
        position: 'absolute',
        bottom: '2px',
        right: '2px',
        fontSize: '8px',
        fontWeight: 800,
        padding: '1px 3px',
        borderRadius: '3px',
        background: 'rgba(0, 0, 0, 0.75)',
        color: '#fff',
        letterSpacing: '0.02em',
        pointerEvents: 'none'
      }}>
        {item.aspectRatio || '16:9'}
      </span>
    </div>
  );
}

export default function ThumbnailStudioPage({
  user,
  theme,
  currentRoutePath = 'thumbnails',
  collapsed = false,
  onToggleCollapse,
  onNavigate
}) {
  const { isMobile, isTablet } = useBreakpoint();

  // Read persisted live config instantly on frame 0 to eliminate provider flash on reload
  const cachedConfig = React.useMemo(() => getStoredThumbnailConfig(), []);

  // Dynamic models & presets loaded from Admin / Backend DB
  const [modelsList, setModelsList] = useState(() => (Array.isArray(cachedConfig?.models) && cachedConfig.models.length > 0) ? cachedConfig.models : THUMBNAIL_MODELS);
  const [presetsList, setPresetsList] = useState(() => (Array.isArray(cachedConfig?.presets) && cachedConfig.presets.length > 0) ? cachedConfig.presets : VIRAL_PRESETS);
  // Active provider tracking (synced from admin config, default to current primary topview.ai)
  const [activeProvider, setActiveProvider] = useState(() => cachedConfig?.activeProvider || 'topview.ai');
  const [activeProviderName, setActiveProviderName] = useState(() => cachedConfig?.activeProviderName || (cachedConfig?.customProviders?.[cachedConfig?.activeProvider]?.name || 'Topview AI'));
  const [activeProviderIcon, setActiveProviderIcon] = useState(() => cachedConfig?.activeProviderIcon || (cachedConfig?.customProviders?.[cachedConfig?.activeProvider]?.icon || '😍'));

  // Active form state
  const [generationMode, setGenerationMode] = useState('all'); // 'all' | 'text-to-image' | 'image-to-image'
  const [selectedModelId, setSelectedModelId] = useState(() => {
    if (cachedConfig?.models && cachedConfig.models.length > 0) {
      const activeProv = (cachedConfig.activeProvider || 'topview.ai').toLowerCase();
      const firstProvModel = cachedConfig.models.find(m => {
        const mp = (m.provider || '').toLowerCase();
        return mp.includes(activeProv) || activeProv.includes(mp);
      });
      if (firstProvModel) return firstProvModel.id;
    }
    return TEXT_TO_IMAGE_MODELS[0].id;
  });
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [prompt, setPrompt] = useState(TEXT_TO_IMAGE_MODELS[0].defaultPrompt);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('2K');

  // Load live config from serverless backend on mount with fresh bust
  useEffect(() => {
    let isMounted = true;
    fetchLiveThumbnailConfig(true).then(cfg => {
      if (!isMounted || !cfg) return;
      if (Array.isArray(cfg.models) && cfg.models.length > 0) {
        setModelsList(cfg.models);
      }
      if (Array.isArray(cfg.presets) && cfg.presets.length > 0) {
        setPresetsList(cfg.presets);
      }
      // Sync active provider from admin config
      if (cfg.activeProvider) {
        setActiveProvider(cfg.activeProvider);
        const cp = cfg.customProviders?.[cfg.activeProvider];
        setActiveProviderName(cp?.name || cfg.activeProviderName || (cfg.activeProvider === 'topview.ai' ? 'Topview AI' : (cfg.activeProvider === 'wizzx.ai' ? 'Wizzx AI' : (cfg.activeProvider === 'kie.ai' ? 'Kie.ai Vision Engine' : cfg.activeProvider))));
        setActiveProviderIcon(cp?.icon || cfg.activeProviderIcon || (cfg.activeProvider === 'topview.ai' ? '😍' : (cfg.activeProvider === 'wizzx.ai' ? '✨' : (cfg.activeProvider === 'kie.ai' ? '⚡' : '🌐'))));
      }
      saveStoredThumbnailConfig(cfg);
    }).catch(err => {
      console.warn('Could not fetch live thumbnail config, fallback to local defaults:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Filter models strictly to active primary provider
  const providerModelsList = React.useMemo(() => {
    if (!modelsList || modelsList.length === 0) return THUMBNAIL_MODELS;
    const activeProv = (activeProvider || 'wizzx.ai').toLowerCase();
    
    const filtered = modelsList.filter(m => {
      if (!m.provider) return activeProv === 'kie.ai';
      const mProv = m.provider.toLowerCase();
      return mProv === activeProv || 
             mProv === activeProv.replace('.ai', '') || 
             activeProv === mProv.replace('.ai', '') ||
             (activeProv.includes('wizzx') && mProv.includes('wizzx')) ||
             (activeProv.includes('kie') && mProv.includes('kie'));
    });
    
    return filtered.length > 0 ? filtered : modelsList;
  }, [modelsList, activeProvider]);

  const textToImageModels = providerModelsList.filter(m => m.type === 'text-to-image');
  const imageToImageModels = providerModelsList.filter(m => m.type === 'image-to-image');
  const otherModels = providerModelsList.filter(m => m.type !== 'text-to-image' && m.type !== 'image-to-image');
  const activeModel = providerModelsList.find(m => m.id === selectedModelId) || providerModelsList[0] || THUMBNAIL_MODELS[0];

  // Auto-synchronize selectedModelId when active provider or providerModelsList changes
  useEffect(() => {
    if (providerModelsList.length > 0 && !providerModelsList.some(m => m.id === selectedModelId)) {
      const first = providerModelsList[0];
      setSelectedModelId(first.id);
      if (first.defaultPrompt) {
        setPrompt(first.defaultPrompt);
      }
    }
  }, [providerModelsList, selectedModelId]);

  // Reference image state
  const [refImageFile, setRefImageFile] = useState(null);
  const [refImagePreview, setRefImagePreview] = useState(null);
  const [refImageUrl, setRefImageUrl] = useState(null);
  const [isUploadingRef, setIsUploadingRef] = useState(false);

  // Tab & View States
  const [inputTab, setInputTab] = useState('form'); // 'form' | 'json'
  const [outputTab, setOutputTab] = useState('preview'); // 'preview' | 'json'

  // Generation execution states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Current active result
  const [currentResult, setCurrentResult] = useState(null);
  const [lastRawResponse, setLastRawResponse] = useState(null);

  // Lightbox modal
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // History state
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('bangai_thumbnail_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef(null);

  // Save history on changes
  useEffect(() => {
    try {
      localStorage.setItem('bangai_thumbnail_history', JSON.stringify(history.slice(0, 24)));
    } catch {}
  }, [history]);

  // Mode switcher handler
  const handleSelectMode = (mode) => {
    audioEngine.playSfx('click');
    setGenerationMode(mode);
    if (mode === 'text-to-image') {
      if (!textToImageModels.some(m => m.id === selectedModelId)) {
        const nextM = textToImageModels[0] || providerModelsList[0];
        if (nextM) {
          setSelectedModelId(nextM.id);
          if (!prompt || imageToImageModels.some(im => im.defaultPrompt === prompt)) {
            setPrompt(nextM.defaultPrompt);
          }
        }
      }
    } else if (mode === 'image-to-image') {
      if (!imageToImageModels.some(m => m.id === selectedModelId)) {
        const nextM = imageToImageModels[0] || providerModelsList[0];
        if (nextM) {
          setSelectedModelId(nextM.id);
          if (!prompt || textToImageModels.some(tm => tm.defaultPrompt === prompt)) {
            setPrompt(nextM.defaultPrompt);
          }
        }
      }
    }
  };

  // Model change handler
  const handleSelectModel = (modelId) => {
    audioEngine.playSfx('click');
    setSelectedModelId(modelId);
    setCurrentResult(null);
    const m = providerModelsList.find(item => item.id === modelId) || THUMBNAIL_MODELS.find(item => item.id === modelId);
    if (m) {
      if (generationMode !== 'all' && m.type && m.type !== generationMode) {
        setGenerationMode(m.type);
      }
      if (m.supportedResolutions && m.supportedResolutions.length > 0 && !m.supportedResolutions.includes(resolution)) {
        setResolution(m.supportedResolutions[m.supportedResolutions.length - 1]);
      }
      if (!prompt || providerModelsList.some(other => other.defaultPrompt === prompt)) {
        setPrompt(m.defaultPrompt);
      }
    }
  };

  // Viral preset handler via dropdown or chip
  const handleSelectPresetById = (presetId) => {
    audioEngine.playSfx('click');
    setSelectedPresetId(presetId);
    if (!presetId) return;
    const preset = presetsList.find(p => p.id === presetId) || VIRAL_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setPrompt(preset.prompt);
      setAspectRatio(preset.aspectRatio);
      if (preset.modelId) {
        setSelectedModelId(preset.modelId);
        setCurrentResult(null);
        const m = modelsList.find(item => item.id === preset.modelId);
        if (m?.type && generationMode !== 'all' && generationMode !== m.type) {
          setGenerationMode(m.type);
        }
      }
    }
  };

  // Enhance prompt with viral high-retention cues
  const handleEnhancePrompt = () => {
    audioEngine.playSfx('click');
    const enhanced = enhanceThumbnailPrompt(prompt);
    setPrompt(enhanced);
  };

  // Quick prompt tag adder
  const handleAddPromptTag = (tag) => {
    audioEngine.playSfx('click');
    setPrompt(prev => {
      const trimmed = (prev || '').trim();
      if (!trimmed) return tag;
      if (trimmed.toLowerCase().includes(tag.toLowerCase())) return trimmed;
      return `${trimmed}, ${tag}`;
    });
  };

  // Clear form
  const handleClearForm = () => {
    audioEngine.playSfx('click');
    setPrompt('');
    setSelectedPresetId('');
    setRefImageFile(null);
    setRefImagePreview(null);
    setRefImageUrl(null);
    setErrorMessage(null);
  };

  // Reference file selection
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    audioEngine.playSfx('click');
    setRefImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setRefImagePreview(localUrl);

    // Auto-switch to Image-to-Image mode when a reference photo is uploaded
    setGenerationMode('image-to-image');
    if (!IMAGE_TO_IMAGE_MODELS.some(m => m.id === selectedModelId)) {
      setSelectedModelId(IMAGE_TO_IMAGE_MODELS[0].id);
    }

    // Upload to CDN
    setIsUploadingRef(true);
    setErrorMessage(null);
    try {
      const cdnUrl = await uploadImageToCDN(file);
      setRefImageUrl(cdnUrl);
    } catch (err) {
      console.error('Failed to upload reference image to CDN:', err);
      setErrorMessage(`Failed to upload reference image: ${err.message}`);
    } finally {
      setIsUploadingRef(false);
    }
  };

  const handleRemoveRefImage = () => {
    audioEngine.playSfx('click');
    setRefImageFile(null);
    setRefImagePreview(null);
    setRefImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Start Generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Please enter a thumbnail prompt.');
      return;
    }

    if (activeModel.requiresImage && !refImageUrl && !refImageFile) {
      setErrorMessage(`Model "${activeModel.name}" requires a reference image.`);
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    setElapsedSec(0);
    setGenerationStep('Connecting to BangAI Vision Engine...');
    audioEngine.playSfx('boom');

    try {
      // 1. If reference image selected but CDN url not ready yet, upload it now
      let finalImageUrl = refImageUrl;
      if (activeModel.requiresImage && !finalImageUrl && refImageFile) {
        setGenerationStep('Uploading reference asset to CDN...');
        finalImageUrl = await uploadImageToCDN(refImageFile);
        setRefImageUrl(finalImageUrl);
      }

      // 2. Create task with multi-key failover and automated thumbnail conditioning
      setGenerationStep('Dispatching neural generation job...');
      const taskRes = await createThumbnailTask(activeModel.id, {
        prompt,
        aspectRatio,
        resolution,
        imageUrl: finalImageUrl,
        provider: activeModel.provider || activeProvider
      });

      // 3. Poll for result
      setGenerationStep('Synthesizing high-retention composition & textures...');
      const pollRes = await pollThumbnailTask(taskRes.taskId, taskRes.keyUsed, {
        onProgress: ({ elapsedSec }) => {
          setElapsedSec(elapsedSec);
          if (elapsedSec > 4 && elapsedSec < 10) {
            setGenerationStep('Upscaling ultra-fine visual details & contrast...');
          } else if (elapsedSec >= 10) {
            setGenerationStep('Finalizing render & color grading...');
          }
        }
      });

      const finalUrl = pollRes.resultUrl;
      const resultObj = {
        id: `thumb-${Date.now()}`,
        imageUrl: finalUrl,
        prompt,
        modelName: activeModel.name,
        modelId: activeModel.id,
        aspectRatio,
        resolution,
        rawResponse: pollRes.taskData || pollRes,
        createdAt: new Date().toISOString()
      };

      setCurrentResult(resultObj);
      setLastRawResponse(pollRes.taskData || pollRes);
      setHistory(prev => [resultObj, ...prev]);
      audioEngine.playSfx('success');
    } catch (err) {
      console.error('Thumbnail generation error:', err);
      setErrorMessage(err.message || 'Vision engine task failed. Please try again.');
      audioEngine.playSfx('error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Image
  const handleDownload = async (imgUrl) => {
    audioEngine.playSfx('click');
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `BangAI_Thumbnail_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(imgUrl, '_blank');
    }
  };

  // Copy Image Link
  const handleCopyLink = (imgUrl) => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(imgUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Copy Prompt
  const handleCopyPrompt = (textToCopy) => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(textToCopy);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Build live raw JSON input for inspection tab with full accurate details
  const rawInputJson = (() => {
    try {
      // Determine effective provider — use model's explicit provider or fall back to active system provider
      const effectiveProvider = activeModel.provider || activeProvider || 'kie.ai';
      const effectiveProviderName = activeProviderName || effectiveProvider;
      const effectiveProviderIcon = activeProviderIcon || '⚡';

      // Determine target generation endpoint based on model override or active provider
      let targetGenerationUrl = 'https://api.wizzx.ai/api/v1/task/submit/{{model}}';
      if (activeModel.endpointOverride?.enabled && activeModel.endpointOverride?.generateUrl) {
        targetGenerationUrl = activeModel.endpointOverride.generateUrl;
      } else if (effectiveProvider.includes('wizzx')) {
        targetGenerationUrl = `https://api.wizzx.ai/api/v1/task/submit/${activeModel.providerModelId || activeModel.id}`;
      } else if (effectiveProvider.includes('kie')) {
        targetGenerationUrl = 'https://api.kie.ai/api/v1/jobs/createTask';
      }

      const payload = {
        activePrimaryProvider: effectiveProvider,
        providerDisplayName: `${effectiveProviderIcon} ${effectiveProviderName}`,
        effectiveProvider,
        targetGenerationUrl,
        modelId: activeModel.id,
        providerModelSlug: activeModel.providerModelId || activeModel.id,
        fallbackModelSlug: activeModel.fallbackModelId || null,
        modelName: activeModel.name,
        modelEndpointOverrideEnabled: Boolean(activeModel.endpointOverride?.enabled),
        aspectRatio,
        resolution,
        creditsEstimated: getModelCredits(activeModel, resolution),
        prompt,
        referenceImageUrl: refImageUrl || (refImageFile ? 'user_reference_asset.png' : null),
        dispatchedPayload: buildModelInput(activeModel.id, {
          prompt,
          aspectRatio,
          resolution,
          imageUrl: refImageUrl || (refImageFile ? 'user_reference_asset.png' : null)
        })
      };
      return JSON.stringify(payload, null, 2);
    } catch (e) {
      return JSON.stringify({ error: e.message }, null, 2);
    }
  })();

  const isLight = theme === 'light';

  // Display image on canvas: either freshly generated result, or model's pre-loaded showcase
  const activeDisplayImage = currentResult?.imageUrl || activeModel.showcaseImage;
  const isDisplayingShowcase = !currentResult;

  // Aspect ratio icon helper
  const renderAspectIcon = (arId) => {
    switch (arId) {
      case '16:9':
        return <Monitor size={15} />;
      case '9:16':
        return <Smartphone size={15} />;
      case '1:1':
        return <Square size={14} />;
      case '4:3':
      case '3:4':
        return <Layout size={14} />;
      default:
        return <ImageIcon size={14} />;
    }
  };

  // Calculate dynamic canvas frame sizing to fit all ratios & device screens cleanly with 0 black bars
  const getCanvasDimensions = () => {
    const rawRatio = aspectRatio || '16:9';
    const [wStr, hStr] = rawRatio.split(':');
    const w = parseFloat(wStr) || 16;
    const h = parseFloat(hStr) || 9;
    const ratioVal = w / h;
    const cssRatio = `${w} / ${h}`;

    if (ratioVal < 0.9) {
      // Vertical / Portrait (9:16, 3:4, etc.)
      return {
        height: isMobile ? 'clamp(320px, 58vh, 440px)' : 'clamp(340px, calc(100vh - 280px), 520px)',
        width: 'auto',
        maxWidth: '100%',
        aspectRatio: cssRatio
      };
    } else if (ratioVal <= 1.1) {
      // Square (1:1)
      return {
        height: isMobile ? 'clamp(260px, 46vh, 340px)' : 'clamp(280px, calc(100vh - 300px), 440px)',
        width: 'auto',
        maxWidth: '100%',
        aspectRatio: '1 / 1'
      };
    } else {
      // Landscape (16:9, 4:3, 21:9)
      return {
        width: '100%',
        maxWidth: isMobile ? '100%' : ratioVal > 2 ? '780px' : '720px',
        maxHeight: isMobile ? 'clamp(200px, 44vh, 280px)' : 'clamp(240px, calc(100vh - 300px), 430px)',
        height: 'auto',
        aspectRatio: cssRatio
      };
    }
  };

  return (
    <AppShell
      user={user}
      currentRoutePath={currentRoutePath}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onNavigate={onNavigate}
    >
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'auto' : '100%',
        minHeight: 0,
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
        overflowY: isMobile ? 'visible' : 'hidden'
      }}>
        {/* ── TOP HEADER BAR ────────────────────────────────────── */}
        <div style={{
          padding: isMobile ? '12px 16px' : '12px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(14, 16, 21, 0.75)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          flexShrink: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff4f00 0%, #ff7700 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(255, 79, 0, 0.4)',
              flexShrink: 0
            }}>
              <ImageIcon size={20} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: isMobile ? '16px' : '19px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0
                }}>
                  Thumbnail Studio
                </h1>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #ff4f00, #ec4899)',
                  color: '#fff',
                  letterSpacing: '0.04em',
                  boxShadow: '0 2px 8px rgba(255, 79, 0, 0.25)'
                }}>
                  NEURAL 4K
                </span>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {activeModel.type === 'text-to-image' ? 'Text to Image' : 'Image to Image'}
                </span>
              </div>
              <p style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                margin: '2px 0 0 0',
                display: isMobile ? 'none' : 'block'
              }}>
                Ultra-high CTR cover designs & viral YouTube thumbnail creator with multi-model neural vision
              </p>
            </div>
          </div>

          {/* Quick Header Stats & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-secondary)'
            }}>
              <Zap size={14} fill="#ff4f00" color="#ff4f00" />
              <span>Cost: <strong style={{ color: '#ff4f00' }}>{getModelCredits(activeModel, resolution)} Credits</strong></span>
            </div>

            {/* Active Vision Engine Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '11px', fontWeight: 700, color: '#6366f1', whiteSpace: 'nowrap' }}>
              <span>{activeProviderIcon}</span>
              <span style={{ display: isMobile ? 'none' : 'inline' }}>Engine: {activeProviderName} ({providerModelsList.length} Models Active)</span>
              <span style={{ display: isMobile ? 'inline' : 'none' }}>{activeProviderName.split(' ')[0]} ({providerModelsList.length})</span>
            </div>

            {history.length > 0 && (
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                display: isMobile ? 'none' : 'inline-block'
              }}>
                {history.length} in session
              </span>
            )}

            <button
              type="button"
              onClick={handleClearForm}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              title="Reset prompt and inputs"
            >
              <RefreshCw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* ── MAIN DUAL-PANEL CONTENT ───────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: isTablet || isMobile ? 'column' : 'row',
          minHeight: 0,
          overflow: isMobile ? 'visible' : 'hidden'
        }}>
          {/* ── LEFT PANEL: Controls & Form ───────────────────────── */}
          <div style={{
            width: isTablet || isMobile ? '100%' : '440px',
            maxWidth: isTablet || isMobile ? '100%' : '480px',
            flexShrink: 0,
            borderRight: isTablet || isMobile ? 'none' : '1px solid var(--border-subtle)',
            borderBottom: isTablet || isMobile ? '1px solid var(--border-subtle)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            height: isMobile ? 'auto' : '100%',
            overflowY: isMobile ? 'visible' : 'auto',
            background: isLight ? '#faf8f5' : 'rgba(18, 21, 28, 0.55)'
          }}>
            {/* Input Mode Tabs */}
            <div style={{
              height: '46px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              flexShrink: 0,
              boxSizing: 'border-box'
            }}>
              <button
                type="button"
                onClick={() => setInputTab('form')}
                style={{
                  height: '100%',
                  padding: '0 14px',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: inputTab === 'form' ? '2px solid #ff4f00' : '2px solid transparent',
                  color: inputTab === 'form' ? '#ff4f00' : 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sliders size={14} />
                <span>Studio Form</span>
              </button>
              <button
                type="button"
                onClick={() => setInputTab('json')}
                style={{
                  height: '100%',
                  padding: '0 14px',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: inputTab === 'json' ? '2px solid #ff4f00' : '2px solid transparent',
                  color: inputTab === 'json' ? '#ff4f00' : 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileCode size={14} />
                <span>Raw JSON Payload</span>
              </button>
            </div>

            {/* Input Content Area */}
            <div style={{ padding: isMobile ? '14px' : '18px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {inputTab === 'json' ? (
                /* Raw JSON inspector tab */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                      GENERATED API PAYLOAD (AUTONOMOUS POOL)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(rawInputJson);
                        setCopiedJson(true);
                        setTimeout(() => setCopiedJson(false), 2000);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedJson ? '#10b981' : 'var(--text-secondary)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedJson ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '11.5px',
                    fontFamily: 'monospace',
                    color: '#818cf8',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    lineHeight: 1.5
                  }}>
                    {rawInputJson}
                  </pre>
                </div>
              ) : (
                /* Form Controls */
                <>
                  {/* 1. Generation Mode & Model Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Vision Model & Architecture
                      </label>
                      <span style={{ fontSize: '11px', color: '#ff4f00', fontWeight: 700 }}>
                        {activeModel.badge} · {getModelCredits(activeModel, resolution)} Credits
                      </span>
                    </div>

                    {/* Mode Filter Segmented Bar */}
                    <div style={{
                      display: 'flex',
                      background: 'var(--bg-card)',
                      padding: '3px',
                      borderRadius: '9px',
                      border: '1px solid var(--border-subtle)',
                      gap: '4px'
                    }}>
                      <button
                        type="button"
                        onClick={() => handleSelectMode('all')}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '7px',
                          border: 'none',
                          background: generationMode === 'all' ? 'linear-gradient(135deg, #ff4f00, #ff7700)' : 'transparent',
                          color: generationMode === 'all' ? '#fff' : 'var(--text-secondary)',
                          fontWeight: generationMode === 'all' ? 800 : 600,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        All ({providerModelsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectMode('text-to-image')}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '7px',
                          border: 'none',
                          background: generationMode === 'text-to-image' ? 'linear-gradient(135deg, #ff4f00, #ff7700)' : 'transparent',
                          color: generationMode === 'text-to-image' ? '#fff' : 'var(--text-secondary)',
                          fontWeight: generationMode === 'text-to-image' ? 800 : 600,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        🎨 Text-to-Image
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectMode('image-to-image')}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '7px',
                          border: 'none',
                          background: generationMode === 'image-to-image' ? 'linear-gradient(135deg, #ff4f00, #ff7700)' : 'transparent',
                          color: generationMode === 'image-to-image' ? '#fff' : 'var(--text-secondary)',
                          fontWeight: generationMode === 'image-to-image' ? 800 : 600,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        🔄 Image-to-Image
                      </button>
                    </div>

                    {/* Model Dropdown List */}
                    <div style={{ position: 'relative' }}>
                      <select
                        value={selectedModelId}
                        onChange={e => handleSelectModel(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 36px 11px 14px',
                          borderRadius: '10px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          fontWeight: 700,
                          outline: 'none',
                          cursor: 'pointer',
                          appearance: 'none',
                          colorScheme: isLight ? 'light' : 'dark',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        {(generationMode === 'all' || generationMode === 'text-to-image') && textToImageModels.length > 0 && (
                          <optgroup label="── 🎨 TEXT-TO-IMAGE MODELS (Create from Scratch) ──">
                            {textToImageModels.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} [{m.badge || 'AI'}] — {getModelCredits(m, resolution)} Credits
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {(generationMode === 'all' || generationMode === 'image-to-image') && imageToImageModels.length > 0 && (
                          <optgroup label="── 🔄 IMAGE-TO-IMAGE MODELS (Edit & Restyle) ──">
                            {imageToImageModels.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} [{m.badge || 'AI'}] — {getModelCredits(m, resolution)} Credits
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {otherModels.length > 0 && (
                          <optgroup label="── 🌟 CUSTOM VISION MODELS ──">
                            {otherModels.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} [{m.badge || 'PRO'}] — {getModelCredits(m, resolution)} Credits
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <ChevronDown size={16} />
                      </div>
                    </div>

                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 79, 0, 0.05)',
                      border: '1px solid rgba(255, 79, 0, 0.15)',
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4
                    }}>
                      <strong style={{ color: '#ff4f00' }}>{activeModel.name}:</strong> {activeModel.description}
                    </div>
                  </div>

                  {/* 2. Viral Creator Presets Dropdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Viral Creator Presets (1-Click)
                      </label>
                      <span style={{ fontSize: '10.5px', color: '#ff4f00', fontWeight: 700 }}>
                        {presetsList.length} Presets Available
                      </span>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <select
                        value={selectedPresetId || ''}
                        onChange={e => handleSelectPresetById(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 36px 10px 14px',
                          borderRadius: '10px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          color: selectedPresetId ? '#ff4f00' : 'var(--text-primary)',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          outline: 'none',
                          cursor: 'pointer',
                          appearance: 'none',
                          colorScheme: isLight ? 'light' : 'dark',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                        }}
                      >
                        <option value="" disabled>Choose a Viral 1-Click Preset / Template...</option>
                        {presetsList.map(p => (
                          <option key={p.id} value={p.id} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {p.emoji || '🔥'} {p.label} [{p.aspectRatio || '16:9'}]
                          </option>
                        ))}
                      </select>
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <ChevronDown size={15} />
                      </div>
                    </div>
                  </div>

                  {/* 4. Prompt Studio & Keyword Boosters */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Thumbnail Prompt
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          {prompt.length} chars
                        </span>
                        <button
                          type="button"
                          onClick={handleEnhancePrompt}
                          style={{
                            background: 'rgba(255, 79, 0, 0.15)',
                            border: '1px solid rgba(255, 79, 0, 0.4)',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            color: '#ff4f00',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          title="Add cinematic lighting, 8k octane render, and high retention keywords"
                        >
                          <Wand2 size={12} />
                          <span>AI Enhance</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={4}
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="Describe your YouTube thumbnail composition, subjects, expressions, lighting, and bold text..."
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        lineHeight: '1.45',
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease'
                      }}
                      onFocus={e => (e.target.style.borderColor = '#ff4f00')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
                    />

                    {/* Quick Keyword Booster Dropdown */}
                    <div style={{ position: 'relative', marginTop: '2px' }}>
                      <select
                        value=""
                        onChange={e => {
                          if (e.target.value) {
                            handleAddPromptTag(e.target.value);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 32px 8px 12px',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          outline: 'none',
                          cursor: 'pointer',
                          appearance: 'none',
                          colorScheme: isLight ? 'light' : 'dark',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                        }}
                      >
                        <option value="" disabled>✨ + Add Viral Keyword Booster (Shocked Face, 3D Text, 8K Render...)</option>
                        {QUICK_PROMPT_TAGS.map((tag, tIdx) => (
                          <option key={tIdx} value={tag} style={{ color: 'var(--text-primary)' }}>
                            + {tag}
                          </option>
                        ))}
                      </select>
                      <div style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>

                  {/* 5. Reference Image (Context-Adaptive: Required for Image-to-Image, Optional for Text-to-Image) */}
                  {(generationMode === 'image-to-image' || refImagePreview) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Reference Source Asset {generationMode === 'image-to-image' ? <span style={{ color: '#ff4f00' }}>*Required</span> : <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>}
                        </label>
                        {refImagePreview && (
                          <button
                            type="button"
                            onClick={handleRemoveRefImage}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <X size={12} />
                            <span>Remove Asset</span>
                          </button>
                        )}
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />

                      {refImagePreview ? (
                        <div style={{
                          position: 'relative',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '1.5px solid #ff4f00',
                          background: 'var(--bg-card)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 14px',
                          gap: '12px'
                        }}>
                          <img
                            src={refImagePreview}
                            alt="Reference"
                            style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {refImageFile?.name || 'Selected Reference Photo'}
                            </div>
                            <div style={{ fontSize: '11px', color: isUploadingRef ? '#ff8c00' : '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                              {isUploadingRef ? (
                                <>
                                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                  <span>Syncing asset to CDN...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={12} />
                                  <span>Asset synced & ready for vision restyling</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            border: '1.5px dashed rgba(255, 79, 0, 0.45)',
                            borderRadius: '10px',
                            padding: '18px 14px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: 'rgba(255, 79, 0, 0.04)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#ff4f00';
                            e.currentTarget.style.background = 'rgba(255, 79, 0, 0.08)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(255, 79, 0, 0.45)';
                            e.currentTarget.style.background = 'rgba(255, 79, 0, 0.04)';
                          }}
                        >
                          <Upload size={20} color="#ff4f00" style={{ margin: '0 auto 6px auto' }} />
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Upload reference photo to restyle
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            PNG, JPG, WebP supported · High resolution recommended
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. Aspect Ratio Visual Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Aspect Ratio & Format
                      </label>
                      <span style={{ fontSize: '11px', color: '#ff4f00', fontWeight: 700 }}>
                        {aspectRatio} {aspectRatio === '16:9' ? '(YouTube)' : aspectRatio === '9:16' ? '(Shorts)' : ''}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '6px' }}>
                      {ASPECT_RATIOS.slice(0, 4).map(ar => {
                        const isSelected = aspectRatio === ar.id;
                        return (
                          <button
                            key={ar.id}
                            type="button"
                            onClick={() => { audioEngine.playSfx('click'); setAspectRatio(ar.id); }}
                            style={{
                              padding: '10px 8px',
                              borderRadius: '8px',
                              border: isSelected ? '1.5px solid #ff4f00' : '1px solid var(--border-subtle)',
                              background: isSelected ? 'rgba(255, 79, 0, 0.12)' : 'var(--bg-card)',
                              color: isSelected ? '#ff4f00' : 'var(--text-secondary)',
                              fontWeight: isSelected ? 800 : 600,
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ color: isSelected ? '#ff4f00' : 'var(--text-muted)' }}>
                              {renderAspectIcon(ar.id)}
                            </div>
                            <span style={{ fontWeight: 800 }}>{ar.id}</span>
                            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                              {ar.id === '16:9' ? 'YouTube' : ar.id === '9:16' ? 'Shorts' : ar.id === '1:1' ? 'Square' : 'Classic'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Render Resolution & Quality Tier */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Render Resolution & Quality
                      </label>
                      <span style={{ fontSize: '11px', color: '#ff4f00', fontWeight: 700 }}>
                        {getModelCredits(activeModel, resolution)} Credits
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {RESOLUTIONS.map(r => {
                        const cost = getModelCredits(activeModel, r.id);
                        const isSelected = resolution === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => { audioEngine.playSfx('click'); setResolution(r.id); }}
                            style={{
                              padding: '10px 6px',
                              borderRadius: '8px',
                              border: isSelected ? '1.5px solid #ff4f00' : '1px solid var(--border-subtle)',
                              background: isSelected ? 'rgba(255, 79, 0, 0.12)' : 'var(--bg-card)',
                              color: isSelected ? '#ff4f00' : 'var(--text-secondary)',
                              fontWeight: isSelected ? 800 : 600,
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '2px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontWeight: 800 }}>{r.id}</span>
                            <span style={{ fontSize: '10px', opacity: 0.85 }}>{cost} Credits</span>
                            <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                              {r.id === '1K' ? 'Standard' : r.id === '2K' ? 'High-Def' : 'Master 4K'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#f87171',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>{errorMessage}</span>
                    </div>
                  )}

                  {/* Primary Generate Button */}
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || isUploadingRef}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isGenerating
                        ? 'var(--border-subtle)'
                        : 'linear-gradient(135deg, #ff4f00 0%, #ff7700 100%)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: isGenerating ? 'none' : '0 4px 20px rgba(255, 79, 0, 0.45)',
                      transition: 'all 0.15s ease',
                      marginTop: '6px'
                    }}
                    onMouseEnter={e => {
                      if (!isGenerating) e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      if (!isGenerating) e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Rendering ({elapsedSec}s)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Generate Thumbnail ({getModelCredits(activeModel, resolution)} Credits)</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL: Output Studio & Live Canvas ─────────────── */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            height: isMobile ? 'auto' : '100%',
            overflow: isMobile ? 'visible' : 'hidden',
            background: 'var(--bg-app)',
            position: 'relative'
          }}>
            {/* Output Sub-Header & Tabs */}
            <div style={{
              height: '46px',
              padding: '0 16px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexShrink: 0,
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
                <button
                  type="button"
                  onClick={() => setOutputTab('preview')}
                  style={{
                    height: '100%',
                    padding: '0 14px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: outputTab === 'preview' ? '2px solid #ff4f00' : '2px solid transparent',
                    color: outputTab === 'preview' ? '#ff4f00' : 'var(--text-muted)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Eye size={13} />
                  <span>Canvas Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOutputTab('json')}
                  style={{
                    height: '100%',
                    padding: '0 14px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: outputTab === 'json' ? '2px solid #ff4f00' : '2px solid transparent',
                    color: outputTab === 'json' ? '#ff4f00' : 'var(--text-muted)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <FileCode size={13} />
                  <span>Inspect Response & History ({history.length})</span>
                </button>
              </div>

              {/* Action Toolbar on Top Right */}
              {activeDisplayImage && outputTab === 'preview' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(activeDisplayImage)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '7px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: copiedUrl ? '#10b981' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Copy Image URL"
                  >
                    {copiedUrl ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedUrl ? 'Copied' : 'Share'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '7px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="View Fullscreen"
                  >
                    <Maximize2 size={12} />
                    <span>Fullscreen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(activeDisplayImage)}
                    style={{
                      padding: '5px 13px',
                      borderRadius: '7px',
                      background: 'linear-gradient(135deg, #ff4f00, #ff7700)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(255, 79, 0, 0.35)'
                    }}
                  >
                    <Download size={12} />
                    <span>Download HD</span>
                  </button>
                </div>
              )}
            </div>

            {/* Main Canvas Stage */}
            <div style={{
              flex: 1,
              minHeight: 0,
              padding: isMobile ? '12px' : '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflowY: isMobile ? 'visible' : 'auto',
              position: 'relative',
              background: 'radial-gradient(circle at 50% 45%, rgba(255, 79, 0, 0.05) 0%, transparent 70%)'
            }}>
              {outputTab === 'json' ? (
                /* Dedicated Generation History & Raw Response Inspector Split-View */
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: isTablet || isMobile ? 'column' : 'row',
                  gap: '16px',
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}>
                  {/* Left Column: Recent Generations Gallery */}
                  <div style={{
                    width: isTablet || isMobile ? '100%' : '260px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    padding: '12px',
                    overflowY: 'auto',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Recent Tasks ({history.length})
                      </span>
                      {history.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            audioEngine.playSfx('click');
                            setHistory([]);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <Trash2 size={11} />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>

                    {history.length === 0 ? (
                      <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                        No recent generation tasks in this session yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {history.map(item => {
                          const isSelected = (currentResult?.id === item.id) || (currentResult?.imageUrl === item.imageUrl);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                audioEngine.playSfx('click');
                                setCurrentResult(item);
                                setLastRawResponse(item.rawResponse || item);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: isSelected ? 'rgba(255, 79, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                                border: isSelected ? '1.5px solid #ff4f00' : '1px solid var(--border-subtle)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <img
                                src={item.imageUrl}
                                alt="Thumbnail"
                                style={{ width: '48px', height: '36px', borderRadius: '5px', objectFit: 'cover', background: '#000', flexShrink: 0 }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 4px', borderRadius: '3px', background: '#ff4f00', color: '#fff' }}>
                                    {item.aspectRatio || '16:9'}
                                  </span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.modelName}
                                  </span>
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                  {item.prompt}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Inspected Task Details & Generated Image URL */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    minWidth: 0,
                    overflowY: 'auto'
                  }}>
                    {/* Highlight Card: Generated Image URL */}
                    <div style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#ff4f00', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Generated Image Output URL
                        </span>
                        {currentResult?.imageUrl && (
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#10b981' }}>
                            ✓ ACTIVE IMAGE READY
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          readOnly
                          value={currentResult?.imageUrl || activeDisplayImage || 'No generation executed yet'}
                          style={{
                            flex: 1,
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: 'rgba(0,0,0,0.25)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}
                        />
                        <button
                          type="button"
                          disabled={!currentResult?.imageUrl && !activeDisplayImage}
                          onClick={() => handleCopyLink(currentResult?.imageUrl || activeDisplayImage)}
                          style={{
                            padding: '9px 14px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #ff4f00, #ff7700)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {copiedUrl ? '✓ Copied' : 'Copy URL'}
                        </button>
                        {(currentResult?.imageUrl || activeDisplayImage) && (
                          <a
                            href={currentResult?.imageUrl || activeDisplayImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '9px 12px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              textDecoration: 'none',
                              fontSize: '12px',
                              fontWeight: 700
                            }}
                          >
                            <ExternalLink size={13} />
                            <span>Open</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Full JSON Response Inspector */}
                    <div style={{
                      flex: 1,
                      borderRadius: '12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      minHeight: '260px'
                    }}>
                      <div style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.1)'
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Full API Response Payload
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const text = lastRawResponse ? JSON.stringify(lastRawResponse, null, 2) : (currentResult ? JSON.stringify(currentResult, null, 2) : '{}');
                            navigator.clipboard.writeText(text);
                            setCopiedJson(true);
                            setTimeout(() => setCopiedJson(false), 2000);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: copiedJson ? '#10b981' : 'var(--text-secondary)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {copiedJson ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedJson ? 'Copied JSON' : 'Copy JSON'}</span>
                        </button>
                      </div>

                      <pre style={{
                        margin: 0,
                        padding: '14px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#34d399',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        lineHeight: 1.5,
                        flex: 1
                      }}>
                        {lastRawResponse
                          ? JSON.stringify(lastRawResponse, null, 2)
                          : (currentResult
                              ? JSON.stringify(currentResult, null, 2)
                              : JSON.stringify({ message: 'No generation task executed yet. Run a generation to inspect API response payload.' }, null, 2)
                            )}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : isGenerating ? (
                /* Active Generating State */
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '18px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  maxWidth: '440px'
                }}>
                  <div style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 79, 0, 0.3) 0%, rgba(255, 79, 0, 0.05) 70%, transparent 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <Loader2 size={38} color="#ff4f00" style={{ animation: 'spin 1.2s linear infinite' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {generationStep}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      BangAI Vision Engine Processing · Elapsed: <strong style={{ color: '#ff4f00' }}>{elapsedSec}s</strong>
                    </div>
                  </div>
                  <div style={{
                    width: '220px',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'var(--border-subtle)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '60%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #ff4f00, #ff8c00)',
                      borderRadius: '2px',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                  </div>
                </div>
              ) : (
                /* Canvas Image Display Stage */
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  maxWidth: isMobile ? '100%' : '740px',
                  margin: '0 auto',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div style={{
                    position: 'relative',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.45)',
                    border: '1.5px solid var(--border-medium)',
                    background: '#090a0f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    ...getCanvasDimensions()
                  }}>
                    {/* Blurred ambient background to seamlessly fill any letterboxing if image ratio differs */}
                    <div style={{
                      position: 'absolute',
                      inset: -12,
                      backgroundImage: `url(${activeDisplayImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'blur(22px) brightness(0.28)',
                      transform: 'scale(1.15)',
                      zIndex: 0,
                      pointerEvents: 'none'
                    }} />

                    <img
                      src={activeDisplayImage}
                      alt="Thumbnail Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        position: 'relative',
                        zIndex: 1
                      }}
                    />

                    {/* Badge top-left */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexWrap: 'wrap',
                      zIndex: 2
                    }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '5px',
                        background: 'rgba(0, 0, 0, 0.82)',
                        backdropFilter: 'blur(8px)',
                        color: '#fff',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        {aspectRatio}
                      </span>
                      {isDisplayingShowcase ? (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '5px',
                          background: 'linear-gradient(135deg, #ff4f00, #ff7700)',
                          backdropFilter: 'blur(8px)',
                          color: '#fff',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          boxShadow: '0 2px 8px rgba(255, 79, 0, 0.4)'
                        }}>
                          SAMPLE SHOWCASE
                        </span>
                      ) : (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '5px',
                          background: 'rgba(16, 185, 129, 0.9)',
                          backdropFilter: 'blur(8px)',
                          color: '#fff',
                          fontSize: '10.5px',
                          fontWeight: 800
                        }}>
                          AI GENERATED
                        </span>
                      )}
                    </div>

                    {/* Expand button top-right */}
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '7px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease',
                        zIndex: 2
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      title="View Fullscreen"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>

                  {/* Caption & Metadata card beneath image */}
                  <div style={{
                    width: '100%',
                    maxWidth: isMobile ? '100%' : '700px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxSizing: 'border-box',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                  }}>
                    {/* Top Row: Model badge & specs on left, Action buttons on right */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: isMobile ? 'wrap' : 'nowrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#ff4f00',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap'
                        }}>
                          {isDisplayingShowcase ? `Showcase: ${activeModel.name}` : `Rendered with ${currentResult.modelName}`}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 79, 0, 0.1)',
                          color: '#ff4f00',
                          border: '1px solid rgba(255, 79, 0, 0.2)',
                          whiteSpace: 'nowrap'
                        }}>
                          {aspectRatio} {aspectRatio === '16:9' ? '(YouTube)' : aspectRatio === '9:16' ? '(Shorts)' : ''}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap'
                        }}>
                          · {isDisplayingShowcase ? 'Sample Preset' : currentResult.generationMode || 'Text-to-Image'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleCopyPrompt(isDisplayingShowcase ? activeModel.defaultPrompt : currentResult.prompt)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            color: copiedPrompt ? '#10b981' : 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {copiedPrompt ? <Check size={11} /> : <Copy size={11} />}
                          <span>{copiedPrompt ? 'Copied' : 'Prompt'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            audioEngine.playSfx('click');
                            setRefImagePreview(activeDisplayImage);
                            setRefImageUrl(activeDisplayImage);
                            const imgModelId = imageToImageModels[0]?.id || 'gpt-image-2-5-flare-image-to-image';
                            setSelectedModelId(imgModelId);
                            setGenerationMode('image-to-image');
                          }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Layers size={11} />
                          <span>Remix</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(activeDisplayImage)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #ff4f00, #ff7700)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 6px rgba(255, 79, 0, 0.3)'
                          }}
                        >
                          <Download size={11} />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Full Prompt Text */}
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }} title={isDisplayingShowcase ? activeModel.defaultPrompt : currentResult.prompt}>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>Prompt:</span>
                      {isDisplayingShowcase ? activeModel.defaultPrompt : currentResult.prompt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '16px' : '28px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <img
              src={activeDisplayImage}
              alt="Fullscreen Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '82vh',
                borderRadius: '12px',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
                objectFit: 'contain'
              }}
            />

            <div style={{
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => handleCopyLink(activeDisplayImage)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {copiedUrl ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedUrl ? 'Copied' : 'Share Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload(activeDisplayImage)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ff4f00, #ff7700)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 16px rgba(255, 79, 0, 0.4)'
                }}
              >
                <Download size={14} />
                <span>Download Ultra HD</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#ff4f00',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255, 79, 0, 0.5)'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
