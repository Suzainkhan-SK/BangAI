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
  THUMBNAIL_STYLES,
  TEXT_TO_IMAGE_MODELS,
  IMAGE_TO_IMAGE_MODELS,
  ASPECT_RATIOS,
  RESOLUTIONS,
  BACKGROUND_MODES,
  VIRAL_PRESETS,
  getModelCredits,
  uploadImageToCDN,
  createThumbnailTask,
  pollThumbnailTask,
  enhanceThumbnailPrompt,
  buildModelInput
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

export default function ThumbnailStudioPage({
  user,
  theme,
  currentRoutePath = 'thumbnails',
  collapsed = false,
  onToggleCollapse,
  onNavigate
}) {
  const { isMobile, isTablet } = useBreakpoint();

  // Active form state
  const [generationMode, setGenerationMode] = useState('all'); // 'all' | 'text-to-image' | 'image-to-image'
  const [selectedModelId, setSelectedModelId] = useState(TEXT_TO_IMAGE_MODELS[0].id);
  const [selectedStyleId, setSelectedStyleId] = useState('viral-high-ctr');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [prompt, setPrompt] = useState(TEXT_TO_IMAGE_MODELS[0].defaultPrompt);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('2K');
  const [background, setBackground] = useState('auto');

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

  const activeModel = THUMBNAIL_MODELS.find(m => m.id === selectedModelId) || THUMBNAIL_MODELS[0];

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
      if (!TEXT_TO_IMAGE_MODELS.some(m => m.id === selectedModelId)) {
        const nextM = TEXT_TO_IMAGE_MODELS[0];
        setSelectedModelId(nextM.id);
        if (!prompt || IMAGE_TO_IMAGE_MODELS.some(im => im.defaultPrompt === prompt)) {
          setPrompt(nextM.defaultPrompt);
        }
      }
    } else if (mode === 'image-to-image') {
      if (!IMAGE_TO_IMAGE_MODELS.some(m => m.id === selectedModelId)) {
        const nextM = IMAGE_TO_IMAGE_MODELS[0];
        setSelectedModelId(nextM.id);
        if (!prompt || TEXT_TO_IMAGE_MODELS.some(tm => tm.defaultPrompt === prompt)) {
          setPrompt(nextM.defaultPrompt);
        }
      }
    }
  };

  // Model change handler
  const handleSelectModel = (modelId) => {
    audioEngine.playSfx('click');
    setSelectedModelId(modelId);
    setCurrentResult(null);
    const m = THUMBNAIL_MODELS.find(item => item.id === modelId);
    if (m) {
      if (generationMode !== 'all' && m.type && m.type !== generationMode) {
        setGenerationMode(m.type);
      }
      if (m.supportedResolutions && m.supportedResolutions.length > 0 && !m.supportedResolutions.includes(resolution)) {
        setResolution(m.supportedResolutions[m.supportedResolutions.length - 1]);
      }
      if (!prompt || THUMBNAIL_MODELS.some(other => other.defaultPrompt === prompt)) {
        setPrompt(m.defaultPrompt);
      }
    }
  };

  // Viral preset handler via dropdown or chip
  const handleSelectPresetById = (presetId) => {
    audioEngine.playSfx('click');
    setSelectedPresetId(presetId);
    if (!presetId) return;
    const preset = VIRAL_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setPrompt(preset.prompt);
      setAspectRatio(preset.aspectRatio);
      if (preset.modelId) {
        setSelectedModelId(preset.modelId);
        setCurrentResult(null);
        const m = THUMBNAIL_MODELS.find(item => item.id === preset.modelId);
        if (m?.type && generationMode !== 'all' && generationMode !== m.type) {
          setGenerationMode(m.type);
        }
      }
    }
  };

  // Enhance prompt with active style archetype
  const handleEnhancePrompt = () => {
    audioEngine.playSfx('click');
    const enhanced = enhanceThumbnailPrompt(prompt, selectedStyleId);
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
        background,
        imageUrl: finalImageUrl,
        styleId: selectedStyleId
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
        createdAt: new Date().toISOString()
      };

      setCurrentResult(resultObj);
      setLastRawResponse(pollRes.taskData);
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

  // Build live raw JSON input for inspection tab
  const rawInputJson = (() => {
    try {
      return JSON.stringify(
        buildModelInput(activeModel.id, {
          prompt,
          aspectRatio,
          resolution,
          background,
          imageUrl: refImageUrl || (refImageFile ? 'https://cdn.bangai.internal/user_upload.png' : null),
          styleId: selectedStyleId
        }),
        null,
        2
      );
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
              padding: '10px 16px 0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)'
            }}>
              <button
                type="button"
                onClick={() => setInputTab('form')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px 8px 0 0',
                  border: 'none',
                  background: inputTab === 'form' ? 'var(--bg-app)' : 'transparent',
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
                  padding: '8px 14px',
                  borderRadius: '8px 8px 0 0',
                  border: 'none',
                  background: inputTab === 'json' ? 'var(--bg-app)' : 'transparent',
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
                        All ({THUMBNAIL_MODELS.length})
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
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          fontWeight: 700,
                          outline: 'none',
                          cursor: 'pointer',
                          colorScheme: isLight ? 'light' : 'dark',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        {(generationMode === 'all' || generationMode === 'text-to-image') && (
                          <optgroup label="── 🎨 TEXT-TO-IMAGE MODELS (Create from Scratch) ──">
                            {TEXT_TO_IMAGE_MODELS.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} [{m.badge}] — {getModelCredits(m, resolution)} Credits
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {(generationMode === 'all' || generationMode === 'image-to-image') && (
                          <optgroup label="── 🔄 IMAGE-TO-IMAGE MODELS (Edit & Restyle) ──">
                            {IMAGE_TO_IMAGE_MODELS.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} [{m.badge}] — {getModelCredits(m, resolution)} Credits
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
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

                  {/* 2. Interactive Viral Presets Carousel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Viral Creator Presets (1-Click)
                      </label>
                      <span style={{ fontSize: '10.5px', color: '#ff4f00', fontWeight: 700 }}>
                        {VIRAL_PRESETS.length} Formats
                      </span>
                    </div>

                    {/* Quick horizontal chip rail */}
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      overflowX: 'auto',
                      paddingBottom: '4px',
                      scrollbarWidth: 'none'
                    }}>
                      {VIRAL_PRESETS.map(p => {
                        const isSelected = selectedPresetId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPresetById(p.id)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: isSelected ? '1px solid #ff4f00' : '1px solid var(--border-subtle)',
                              background: isSelected ? 'rgba(255, 79, 0, 0.15)' : 'var(--bg-card)',
                              color: isSelected ? '#ff4f00' : 'var(--text-secondary)',
                              fontSize: '11px',
                              fontWeight: isSelected ? 800 : 600,
                              whiteSpace: 'nowrap',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              flexShrink: 0,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{p.emoji}</span>
                            <span>{p.label.split('(')[0].trim()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Thumbnail Vibe & Visual Archetype */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Vibe & Visual Archetype
                      </label>
                      <span style={{ fontSize: '10.5px', color: '#ff4f00', fontWeight: 700 }}>
                        ⚡ Neural Grading
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '6px'
                    }}>
                      {THUMBNAIL_STYLES.map(s => {
                        const isSelected = selectedStyleId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              audioEngine.playSfx('click');
                              setSelectedStyleId(s.id);
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: isSelected ? '1.5px solid #ff4f00' : '1px solid var(--border-subtle)',
                              background: isSelected ? 'rgba(255, 79, 0, 0.12)' : 'var(--bg-card)',
                              color: isSelected ? '#ff4f00' : 'var(--text-secondary)',
                              fontSize: '11px',
                              fontWeight: isSelected ? 800 : 600,
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              gap: '2px',
                              textAlign: 'left',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '13px' }}>{s.emoji}</span>
                              <span style={{ fontWeight: 700 }}>{s.label}</span>
                            </div>
                            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                              {s.tagline.split('·')[0]}
                            </span>
                          </button>
                        );
                      })}
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

                    {/* Quick Keyword Booster Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {QUICK_PROMPT_TAGS.map((tag, tIdx) => (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={() => handleAddPromptTag(tag)}
                          style={{
                            padding: '3px 7px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#ff4f00';
                            e.currentTarget.style.borderColor = '#ff4f00';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          }}
                        >
                          + {tag}
                        </button>
                      ))}
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

                  {/* 7. Dynamic Resolution & Background Options */}
                  {activeModel.supportsResolution && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Render Resolution
                        </label>
                        <span style={{ fontSize: '11px', color: '#ff4f00', fontWeight: 700 }}>
                          {getModelCredits(activeModel, resolution)} Credits
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        {RESOLUTIONS.map(r => {
                          const isSupported = !activeModel.supportedResolutions || activeModel.supportedResolutions.includes(r.id);
                          const cost = getModelCredits(activeModel, r.id);
                          const isSelected = resolution === r.id;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              disabled={!isSupported}
                              onClick={() => { audioEngine.playSfx('click'); setResolution(r.id); }}
                              style={{
                                padding: '8px 6px',
                                borderRadius: '8px',
                                border: isSelected ? '1.5px solid #ff4f00' : '1px solid var(--border-subtle)',
                                background: isSelected ? 'rgba(255, 79, 0, 0.12)' : 'var(--bg-card)',
                                color: !isSupported ? 'var(--text-muted)' : (isSelected ? '#ff4f00' : 'var(--text-secondary)'),
                                fontWeight: isSelected ? 800 : 600,
                                fontSize: '11.5px',
                                cursor: isSupported ? 'pointer' : 'not-allowed',
                                opacity: isSupported ? 1 : 0.4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span style={{ fontWeight: 800 }}>{r.id}</span>
                              <span style={{ fontSize: '10px', opacity: 0.85 }}>{cost} Credits</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeModel.supportsBackground && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Background Mode
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        {BACKGROUND_MODES.map(b => {
                          const isSelected = background === b.id;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => { audioEngine.playSfx('click'); setBackground(b.id); }}
                              style={{
                                padding: '7px 6px',
                                borderRadius: '8px',
                                border: isSelected ? '1.5px solid #ff4f00' : '1px solid var(--border-subtle)',
                                background: isSelected ? 'rgba(255, 79, 0, 0.12)' : 'var(--bg-card)',
                                color: isSelected ? '#ff4f00' : 'var(--text-secondary)',
                                fontWeight: isSelected ? 800 : 600,
                                fontSize: '11.5px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {b.id === 'auto' ? 'Auto Blend' : b.id === 'opaque' ? 'Solid Opaque' : 'Cutout PNG'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
            overflowY: isMobile ? 'visible' : 'auto',
            background: 'var(--bg-app)',
            position: 'relative'
          }}>
            {/* Output Sub-Header & Tabs */}
            <div style={{
              padding: isMobile ? '10px 14px' : '10px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setOutputTab('preview')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    background: outputTab === 'preview' ? 'var(--bg-app)' : 'transparent',
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
                    padding: '6px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    background: outputTab === 'json' ? 'var(--bg-app)' : 'transparent',
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
                  <span>Inspect Response</span>
                </button>
              </div>

              {/* Action Toolbar on Top Right */}
              {activeDisplayImage && outputTab === 'preview' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(activeDisplayImage)}
                    style={{
                      padding: '6px 10px',
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
                    onClick={() => handleDownload(activeDisplayImage)}
                    style={{
                      padding: '6px 14px',
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
              padding: isMobile ? '16px 12px' : '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: isMobile ? '360px' : '460px',
              position: 'relative',
              background: 'radial-gradient(circle at 50% 50%, rgba(255, 79, 0, 0.06) 0%, transparent 65%)'
            }}>
              {outputTab === 'json' ? (
                /* Raw Response JSON Inspector */
                <div style={{ width: '100%', height: '100%', maxWidth: '840px' }}>
                  <pre style={{
                    margin: 0,
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#34d399',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    lineHeight: 1.5
                  }}>
                    {lastRawResponse
                      ? JSON.stringify(lastRawResponse, null, 2)
                      : JSON.stringify({ message: 'No generation task executed yet. Run a generation to inspect API response payload.' }, null, 2)}
                  </pre>
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
                /* Canvas Image Display */
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  width: '100%',
                  maxWidth: aspectRatio === '9:16' ? '420px' : '840px'
                }}>
                  <div style={{
                    position: 'relative',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.45)',
                    border: '1.5px solid var(--border-medium)',
                    background: '#0a0a0d',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxHeight: isMobile ? '400px' : '540px'
                  }}>
                    <img
                      src={activeDisplayImage}
                      alt="Thumbnail Preview"
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: isMobile ? '380px' : '520px',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />

                    {/* Badge top-left */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        padding: '4px 9px',
                        borderRadius: '6px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(8px)',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 800,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        {aspectRatio}
                      </span>
                      {isDisplayingShowcase ? (
                        <span style={{
                          padding: '4px 9px',
                          borderRadius: '6px',
                          background: 'rgba(255, 79, 0, 0.9)',
                          backdropFilter: 'blur(8px)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 800,
                          boxShadow: '0 2px 8px rgba(255, 79, 0, 0.4)'
                        }}>
                          SAMPLE SHOWCASE
                        </span>
                      ) : (
                        <span style={{
                          padding: '4px 9px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.9)',
                          backdropFilter: 'blur(8px)',
                          color: '#fff',
                          fontSize: '11px',
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
                        top: '12px',
                        right: '12px',
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      title="View Fullscreen"
                    >
                      <Maximize2 size={15} />
                    </button>
                  </div>

                  {/* Caption & Metadata card beneath image */}
                  <div style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#ff4f00', textTransform: 'uppercase' }}>
                          {isDisplayingShowcase ? `Showcase: ${activeModel.name}` : `Rendered with ${currentResult.modelName}`}
                        </span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          · {aspectRatio}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '12.5px',
                        color: 'var(--text-primary)',
                        marginTop: '3px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4
                      }}>
                        {isDisplayingShowcase ? activeModel.defaultPrompt : currentResult.prompt}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(isDisplayingShowcase ? activeModel.defaultPrompt : currentResult.prompt)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '7px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          color: copiedPrompt ? '#10b981' : 'var(--text-secondary)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        {copiedPrompt ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedPrompt ? 'Copied' : 'Copy Prompt'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          audioEngine.playSfx('click');
                          setRefImagePreview(activeDisplayImage);
                          setRefImageUrl(activeDisplayImage);
                          setSelectedModelId('gpt-image-2-5-flare-image-to-image');
                          setGenerationMode('image-to-image');
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '7px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Layers size={12} />
                        <span>Use as Reference</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(activeDisplayImage)}
                        style={{
                          padding: '6px 14px',
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
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom History Strip */}
            {history.length > 0 && (
              <div style={{
                padding: isMobile ? '10px 14px' : '12px 20px',
                borderTop: '1px solid var(--border-subtle)',
                background: isLight ? '#faf8f5' : 'rgba(18, 21, 28, 0.8)',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Recent Generative History ({history.length})
                  </span>
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
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Clear History</span>
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                  scrollbarWidth: 'thin'
                }}>
                  {history.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        audioEngine.playSfx('click');
                        setCurrentResult(item);
                        setOutputTab('preview');
                      }}
                      style={{
                        position: 'relative',
                        width: item.aspectRatio === '9:16' ? '46px' : '88px',
                        height: '56px',
                        borderRadius: '7px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: currentResult?.id === item.id ? '2px solid #ff4f00' : '1px solid var(--border-subtle)',
                        flexShrink: 0,
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      title={item.prompt}
                    >
                      <img
                        src={item.imageUrl}
                        alt="history"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 3px',
                        borderRadius: '3px',
                        background: 'rgba(0,0,0,0.75)',
                        color: '#fff'
                      }}>
                        {item.aspectRatio}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
