import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Image as ImageIcon, Wand2, Download, Copy, Check,
  RefreshCw, Upload, X, ChevronDown, Eye, Sliders, Layers,
  Zap, AlertCircle, CheckCircle2, Loader2, ArrowRight, Maximize2,
  FileCode, Play, Trash2
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
  uploadImageToCDN,
  createThumbnailTask,
  pollThumbnailTask,
  enhanceThumbnailPrompt,
  buildModelInput
} from '../services/thumbnailService';

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
      localStorage.setItem('bangai_thumbnail_history', JSON.stringify(history.slice(0, 20)));
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
    const m = THUMBNAIL_MODELS.find(item => item.id === modelId);
    if (m) {
      if (generationMode !== 'all' && m.type && m.type !== generationMode) {
        setGenerationMode(m.type);
      }
      if (!prompt) {
        setPrompt(m.defaultPrompt);
      }
    }
  };

  // Viral preset handler via dropdown
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
        background: 'var(--bg-main)',
        overflowY: isMobile ? 'visible' : 'auto'
      }}>
        {/* Top Header Bar */}
        <div style={{
          padding: isMobile ? '12px 14px' : '14px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          background: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(20, 16, 16, 0.65)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #ff4f00, #ff8c00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 79, 0, 0.35)',
              flexShrink: 0
            }}>
              <ImageIcon size={18} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0
                }}>
                  Thumbnail Studio
                </h1>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #ff4f00, #ec4899)',
                  color: '#fff',
                  letterSpacing: '0.04em'
                }}>
                  ULTRA HD
                </span>
              </div>
              <p style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                margin: '2px 0 0 0'
              }}>
                Generate viral, high-retention YouTube thumbnails with AI vision models
              </p>
            </div>
          </div>

          {/* Quick Header Stats & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary)'
            }}>
              <Zap size={13} fill="#ff4f00" color="#ff4f00" />
              <span>Cost: <strong style={{ color: 'var(--text-primary)' }}>{activeModel.credits} Credits</strong></span>
            </div>

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
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <RefreshCw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Main Dual-Panel Content */}
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
            flexShrink: 0,
            borderRight: isTablet || isMobile ? 'none' : '1px solid var(--border-subtle)',
            borderBottom: isTablet || isMobile ? '1px solid var(--border-subtle)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            height: isMobile ? 'auto' : '100%',
            overflowY: isMobile ? 'visible' : 'auto',
            background: isLight ? '#faf8f5' : 'rgba(23, 17, 17, 0.45)'
          }}>
            {/* Input Mode Tabs */}
            <div style={{
              padding: '10px 14px 0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <button
                type="button"
                onClick={() => setInputTab('form')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '7px 7px 0 0',
                  border: 'none',
                  background: inputTab === 'form' ? 'var(--bg-card)' : 'transparent',
                  borderBottom: inputTab === 'form' ? '2px solid #ff4f00' : '2px solid transparent',
                  color: inputTab === 'form' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sliders size={13} />
                <span>Studio Form</span>
              </button>
              <button
                type="button"
                onClick={() => setInputTab('json')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '7px 7px 0 0',
                  border: 'none',
                  background: inputTab === 'json' ? 'var(--bg-card)' : 'transparent',
                  borderBottom: inputTab === 'json' ? '2px solid #ff4f00' : '2px solid transparent',
                  color: inputTab === 'json' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileCode size={13} />
                <span>Raw JSON API</span>
              </button>
            </div>

            {/* Input Content Area */}
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {inputTab === 'json' ? (
                /* Raw JSON inspector tab */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      GENERATED API PAYLOAD
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
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '11.5px',
                    fontFamily: 'monospace',
                    color: '#818cf8',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {rawInputJson}
                  </pre>
                </div>
              ) : (
                /* Form Controls */
                <>
                  {/* 1. Vision Model Dropdown List (Separated Text-to-Image vs Image-to-Image) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Vision Model ({activeModel.type === 'text-to-image' ? 'Text-to-Image' : 'Image-to-Image'})
                      </label>
                      <span style={{ fontSize: '11px', color: '#ff4f00', fontWeight: 600 }}>
                        {activeModel.badge} · {activeModel.credits} Credits
                      </span>
                    </div>

                    {/* Mode Filter Pills */}
                    <div style={{
                      display: 'flex',
                      background: 'var(--bg-input)',
                      padding: '3px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      gap: '4px'
                    }}>
                      <button
                        type="button"
                        onClick={() => handleSelectMode('all')}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: generationMode === 'all' ? 'var(--bg-card)' : 'transparent',
                          color: generationMode === 'all' ? '#ff4f00' : 'var(--text-secondary)',
                          fontWeight: generationMode === 'all' ? 700 : 500,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        All Models
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectMode('text-to-image')}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: generationMode === 'text-to-image' ? 'var(--bg-card)' : 'transparent',
                          color: generationMode === 'text-to-image' ? '#ff4f00' : 'var(--text-secondary)',
                          fontWeight: generationMode === 'text-to-image' ? 700 : 500,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        🎨 Text-to-Image
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectMode('image-to-image')}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: generationMode === 'image-to-image' ? 'var(--bg-card)' : 'transparent',
                          color: generationMode === 'image-to-image' ? '#ff4f00' : 'var(--text-secondary)',
                          fontWeight: generationMode === 'image-to-image' ? 700 : 500,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        🔄 Image-to-Image
                      </button>
                    </div>

                    {/* Model Dropdown List */}
                    <select
                      value={selectedModelId}
                      onChange={e => handleSelectModel(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                        colorScheme: isLight ? 'light' : 'dark'
                      }}
                    >
                      {(generationMode === 'all' || generationMode === 'text-to-image') && (
                        <optgroup label="── 🎨 TEXT-TO-IMAGE MODELS (Create from Scratch) ──">
                          {TEXT_TO_IMAGE_MODELS.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.badge} · {m.credits} Credits)
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {(generationMode === 'all' || generationMode === 'image-to-image') && (
                        <optgroup label="── 🔄 IMAGE-TO-IMAGE MODELS (Edit & Restyle) ──">
                          {IMAGE_TO_IMAGE_MODELS.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.badge} · {m.credits} Credits)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>

                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      {activeModel.description}
                    </p>
                  </div>

                  {/* 2. Viral Presets Dropdown List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Viral Presets
                      </label>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        One-Click Preset
                      </span>
                    </div>

                    <select
                      value={selectedPresetId}
                      onChange={e => handleSelectPresetById(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                        colorScheme: isLight ? 'light' : 'dark'
                      }}
                    >
                      <option value="">✨ Select a Viral Preset (or type your own prompt below)...</option>
                      {VIRAL_PRESETS.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.emoji} {p.label} ({p.aspectRatio})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Thumbnail Vibe & Style Archetype Dropdown List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Thumbnail Vibe & Style Archetype
                      </label>
                      <span style={{ fontSize: '10px', color: '#ff4f00', fontWeight: 600 }}>
                        ⚡ Auto-Conditioned
                      </span>
                    </div>

                    <select
                      value={selectedStyleId}
                      onChange={e => {
                        audioEngine.playSfx('click');
                        setSelectedStyleId(e.target.value);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                        colorScheme: isLight ? 'light' : 'dark'
                      }}
                    >
                      {THUMBNAIL_STYLES.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.emoji} {s.label} — {s.tagline}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Thumbnail Prompt */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Thumbnail Prompt
                      </label>
                      <button
                        type="button"
                        onClick={handleEnhancePrompt}
                        style={{
                          background: 'rgba(255, 79, 0, 0.12)',
                          border: '1px solid rgba(255, 79, 0, 0.3)',
                          padding: '2px 8px',
                          borderRadius: '5px',
                          color: '#ff4f00',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Add cinematic lighting, 8k octane render, and high retention keywords"
                      >
                        <Wand2 size={11} />
                        <span>Enhance</span>
                      </button>
                    </div>

                    <textarea
                      rows={4}
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="Describe your YouTube thumbnail composition, subjects, lighting, and expressions..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '12.5px',
                        fontFamily: 'inherit',
                        lineHeight: '1.4',
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => (e.target.style.borderColor = '#ff4f00')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      <span>{prompt.length} chars</span>
                    </div>
                  </div>

                  {/* 4. Reference Image (Context-Adaptive: Required for Image-to-Image, Optional for Text-to-Image) */}
                  {(generationMode === 'image-to-image' || refImagePreview) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Reference Source Image {generationMode === 'image-to-image' ? <span style={{ color: '#ff4f00' }}>*Required for Restyle</span> : <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>}
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
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <X size={11} />
                            <span>Remove</span>
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
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1.5px solid #ff4f00',
                          background: 'var(--bg-card)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 12px',
                          gap: '12px'
                        }}>
                          <img
                            src={refImagePreview}
                            alt="Reference"
                            style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {refImageFile?.name || 'Selected Reference Image'}
                            </div>
                            <div style={{ fontSize: '11px', color: isUploadingRef ? '#ff8c00' : '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              {isUploadingRef ? (
                                <>
                                  <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                                  <span>Uploading asset to CDN...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={11} />
                                  <span>Ready for vision engine restyling</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            border: '1.5px dashed rgba(255, 79, 0, 0.5)',
                            borderRadius: '9px',
                            padding: '16px 12px',
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
                            e.currentTarget.style.borderColor = 'rgba(255, 79, 0, 0.5)';
                            e.currentTarget.style.background = 'rgba(255, 79, 0, 0.04)';
                          }}
                        >
                          <Upload size={18} color="#ff4f00" style={{ margin: '0 auto 4px auto' }} />
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Upload image to edit or restyle
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            PNG, JPG, WebP supported · High resolution recommended
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. Aspect Ratio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Aspect Ratio
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {ASPECT_RATIOS.slice(0, 3).map(ar => (
                        <button
                          key={ar.id}
                          type="button"
                          onClick={() => { audioEngine.playSfx('click'); setAspectRatio(ar.id); }}
                          style={{
                            padding: '8px 6px',
                            borderRadius: '8px',
                            border: `1.5px solid ${aspectRatio === ar.id ? '#ff4f00' : 'var(--border-subtle)'}`,
                            background: aspectRatio === ar.id ? 'rgba(255, 79, 0, 0.12)' : 'var(--bg-card)',
                            color: aspectRatio === ar.id ? '#ff4f00' : 'var(--text-secondary)',
                            fontWeight: aspectRatio === ar.id ? 700 : 500,
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{ar.id}</span>
                          <span style={{ fontSize: '9.5px', opacity: 0.8 }}>{ar.id === '16:9' ? 'YouTube' : ar.id === '9:16' ? 'Shorts' : 'Square'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6. Dynamic Options: Resolution & Background (For Flare model) */}
                  {activeModel.supportsResolution && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Render Resolution
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        {RESOLUTIONS.map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => { audioEngine.playSfx('click'); setResolution(r.id); }}
                            style={{
                              padding: '6px',
                              borderRadius: '7px',
                              border: `1px solid ${resolution === r.id ? '#ff4f00' : 'var(--border-subtle)'}`,
                              background: resolution === r.id ? 'rgba(255, 79, 0, 0.12)' : 'var(--bg-card)',
                              color: resolution === r.id ? '#ff4f00' : 'var(--text-secondary)',
                              fontWeight: resolution === r.id ? 700 : 500,
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            {r.label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeModel.supportsBackground && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Background Mode
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        {BACKGROUND_MODES.map(b => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => { audioEngine.playSfx('click'); setBackground(b.id); }}
                            style={{
                              padding: '6px',
                              borderRadius: '7px',
                              border: `1px solid ${background === b.id ? '#ff4f00' : 'var(--border-subtle)'}`,
                              background: background === b.id ? 'rgba(255, 79, 0, 0.12)' : 'var(--bg-card)',
                              color: background === b.id ? '#ff4f00' : 'var(--text-secondary)',
                              fontWeight: background === b.id ? 700 : 500,
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            {b.id === 'auto' ? 'Auto Blend' : b.id === 'opaque' ? 'Opaque' : 'Cutout PNG'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error display */}
                  {errorMessage && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px'
                    }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Primary Generate Button */}
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || isUploadingRef}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isGenerating
                        ? 'var(--border-subtle)'
                        : 'linear-gradient(135deg, #ff4f00 0%, #ff7700 100%)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: isGenerating ? 'none' : '0 4px 16px rgba(255, 79, 0, 0.4)',
                      transition: 'all 0.15s ease',
                      marginTop: '4px'
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
                        <span>Generate Thumbnail ({activeModel.credits} Credits)</span>
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
            background: 'var(--bg-main)'
          }}>
            {/* Output Sub-Header & Tabs */}
            <div style={{
              padding: '10px 18px',
              borderBottom: '1px solid var(--border-subtle)',
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
                    background: outputTab === 'preview' ? 'var(--bg-card)' : 'transparent',
                    borderBottom: outputTab === 'preview' ? '2px solid #ff4f00' : '2px solid transparent',
                    color: outputTab === 'preview' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '12.5px',
                    fontWeight: 600,
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
                    background: outputTab === 'json' ? 'var(--bg-card)' : 'transparent',
                    borderBottom: outputTab === 'json' ? '2px solid #ff4f00' : '2px solid transparent',
                    color: outputTab === 'json' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '12.5px',
                    fontWeight: 600,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(activeDisplayImage)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '7px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      color: copiedUrl ? '#10b981' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: 600,
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
                      padding: '5px 12px',
                      borderRadius: '7px',
                      background: 'linear-gradient(135deg, #ff4f00, #ff7700)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(255, 79, 0, 0.3)'
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
              padding: isMobile ? '12px' : '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: isMobile ? '360px' : '440px',
              position: 'relative'
            }}>
              {outputTab === 'json' ? (
                /* Raw Response JSON Inspector */
                <div style={{ width: '100%', height: '100%', maxWidth: '800px' }}>
                  <pre style={{
                    margin: 0,
                    padding: '16px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#34d399',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
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
                  gap: '16px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  maxWidth: '420px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 79, 0, 0.25) 0%, rgba(255, 79, 0, 0.05) 70%, transparent 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <Loader2 size={36} color="#ff4f00" style={{ animation: 'spin 1.2s linear infinite' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {generationStep}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Vision Engine Processing · Elapsed: {elapsedSec}s
                    </div>
                  </div>
                  <div style={{
                    width: '200px',
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
                  gap: '14px',
                  width: '100%',
                  maxWidth: '820px'
                }}>
                  <div style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
                    border: '1px solid var(--border-medium)',
                    background: '#0c0a0a',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxHeight: '520px'
                  }}>
                    <img
                      src={activeDisplayImage}
                      alt="Thumbnail Preview"
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '500px',
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
                      gap: '6px'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(8px)',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: '1px solid rgba(255, 255, 255, 0.15)'
                      }}>
                        {aspectRatio}
                      </span>
                      {isDisplayingShowcase && (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255, 79, 0, 0.85)',
                          backdropFilter: 'blur(8px)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          LIVE SHOWCASE
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
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="View Fullscreen"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>

                  {/* Caption & Metadata beneath image */}
                  <div style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {isDisplayingShowcase ? `Sample Output: ${activeModel.name}` : `Generated with ${currentResult.modelName}`}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {isDisplayingShowcase ? activeModel.defaultPrompt : currentResult.prompt}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          audioEngine.playSfx('click');
                          setRefImagePreview(activeDisplayImage);
                          setRefImageUrl(activeDisplayImage);
                          setSelectedModelId('gpt-image-2-5-flare-image-to-image');
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: 'transparent',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          fontSize: '11.5px',
                          fontWeight: 600,
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
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: '#ff4f00',
                          border: 'none',
                          color: '#fff',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
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
                padding: '12px 18px',
                borderTop: '1px solid var(--border-subtle)',
                background: isLight ? '#faf8f5' : 'rgba(20, 16, 16, 0.4)',
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
                      fontSize: '10.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={11} />
                    <span>Clear</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
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
                        width: '90px',
                        height: '56px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: currentResult?.id === item.id ? '2px solid #ff4f00' : '1px solid var(--border-subtle)',
                        flexShrink: 0,
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      title={item.prompt}
                    >
                      <img
                        src={item.imageUrl}
                        alt="history"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
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
            zIndex: 999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
          >
            <img
              src={activeDisplayImage}
              alt="Fullscreen"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '10px', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              style={{
                position: 'absolute',
                top: '-14px',
                right: '-14px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#ff4f00',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
