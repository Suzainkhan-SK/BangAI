import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

// Default Providers Reference List
const PROVIDER_METADATA = [
  { id: 'kie.ai', name: 'Kie.ai Vision Engine', icon: '⚡', desc: 'Primary low-latency 4K vision API with multi-key failover and CDN storage.' },
  { id: 'fal.ai', name: 'Fal.ai Fast Vision', icon: '🚀', desc: 'Ultra-fast inference queue API supporting FLUX, Recraft, and Ideogram.' },
  { id: 'replicate', name: 'Replicate', icon: '🔄', desc: 'Flagship open-source model hub hosting FLUX Schnell, Dev, and SDXL.' },
  { id: 'together', name: 'Together AI', icon: '🧠', desc: 'High-throughput cloud GPU engine with instant sync image synthesis.' },
  { id: 'openai', name: 'OpenAI / Custom Compatible', icon: '🌐', desc: 'DALL-E 3 & OpenAI-compatible /v1/images/generations endpoints with custom baseUrl.' }
];

export default function ThumbnailManagerView() {
  const [activeTab, setActiveTab] = useState('providers'); // 'providers' | 'models' | 'system_prompt' | 'presets' | 'diagnostics'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // ── Engine Configuration State ──
  const [activeProvider, setActiveProvider] = useState('kie.ai');
  const [providerRotationEnabled, setProviderRotationEnabled] = useState(true);
  const [fallbackChain, setFallbackChain] = useState(['kie.ai', 'fal.ai', 'replicate', 'together', 'openai']);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [systemPromptEnabled, setSystemPromptEnabled] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('--no watermark, no blur, no low resolution, no deformed faces');
  const [defaultAspectRatio, setDefaultAspectRatio] = useState('16:9');
  const [defaultResolution, setDefaultResolution] = useState('2K');

  // ── Models & Presets State ──
  const [models, setModels] = useState([]);
  const [presets, setPresets] = useState([]);
  const [styles, setStyles] = useState([]);

  // ── Provider Keys State ──
  const [keysByProvider, setKeysByProvider] = useState({
    'kie.ai': { name: 'Kie.ai Vision Engine', keys: [], enabled: true },
    'fal.ai': { name: 'Fal.ai Fast Vision', keys: [], enabled: true },
    'replicate': { name: 'Replicate', keys: [], enabled: true },
    'together': { name: 'Together AI', keys: [], enabled: true },
    'openai': { name: 'OpenAI / Custom Compatible', baseUrl: 'https://api.openai.com/v1', keys: [], enabled: true }
  });

  // ── UI Filters & Helpers ──
  const [modelTypeFilter, setModelTypeFilter] = useState('all');
  const [modelSearch, setModelSearch] = useState('');
  const [showKeyTextarea, setShowKeyTextarea] = useState({});
  const [newKeyInput, setNewKeyInput] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPresetModal, setShowAddPresetModal] = useState(false);

  // ── Live Generation Test State ──
  const [testProvider, setTestProvider] = useState('kie.ai');
  const [testModel, setTestModel] = useState('');
  const [testPrompt, setTestPrompt] = useState('Viral challenge thumbnail: Shocked creator finding a colossal $10,000,000 golden vault open in a dark cave, volumetric light rays');
  const [testRatio, setTestRatio] = useState('16:9');
  const [testRes, setTestRes] = useState('1K');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);

  // ── New Model Form State ──
  const [newModel, setNewModel] = useState({
    id: '',
    name: '',
    provider: 'kie.ai',
    badge: 'VIRAL 4K',
    badgeColor: 'linear-gradient(135deg, #10b981, #06b6d4)',
    credits: 6,
    creditsByResolution: { '1K': 6, '2K': 10, '4K': 16 },
    type: 'text-to-image',
    supportedResolutions: ['1K', '2K', '4K'],
    supportsBackground: false,
    requiresImage: false,
    enabled: true,
    description: '',
    defaultPrompt: '',
    showcaseImage: '/showcases/gpt_flare_2_5_ultra.png'
  });

  // ── New Preset Form State ──
  const [newPreset, setNewPreset] = useState({
    id: '',
    emoji: '🔥',
    label: '',
    prompt: '',
    aspectRatio: '16:9',
    modelId: '',
    enabled: true
  });

  // Load complete configuration from MongoDB Atlas
  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await adminService.getThumbnailConfig();
      if (res.success && res.config) {
        const c = res.config;
        setActiveProvider(c.activeProvider || 'kie.ai');
        setProviderRotationEnabled(c.providerRotationEnabled ?? true);
        setFallbackChain(c.fallbackChain || ['kie.ai', 'fal.ai', 'replicate', 'together', 'openai']);
        setSystemPrompt(c.systemPrompt || '');
        setSystemPromptEnabled(Boolean(c.systemPromptEnabled));
        setNegativePrompt(c.negativePrompt || '');
        setDefaultAspectRatio(c.defaultAspectRatio || '16:9');
        setDefaultResolution(c.defaultResolution || '2K');
        setModels(c.models || []);
        setPresets(c.presets || []);
        setStyles(c.styles || []);
        if (c.models?.length > 0 && !testModel) {
          setTestModel(c.models[0].id);
        }
      }
      if (res.success && res.keys?.providers) {
        setKeysByProvider(res.keys.providers);
      }
    } catch (err) {
      console.error('Failed to load thumbnail config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Save full configuration to MongoDB Atlas
  const handleSaveAll = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const configPayload = {
        activeProvider,
        providerRotationEnabled,
        fallbackChain,
        systemPrompt,
        systemPromptEnabled,
        negativePrompt,
        defaultAspectRatio,
        defaultResolution,
        models,
        presets,
        styles
      };

      const keysPayload = {
        providers: keysByProvider,
        pool: keysByProvider['kie.ai']?.keys || []
      };

      const res = await adminService.saveThumbnailConfig(configPayload, keysPayload);
      if (res.success) {
        setSavedMsg('✅ All Thumbnail Studio settings, vision models, and provider keys successfully saved to MongoDB Atlas!');
        setTimeout(() => setSavedMsg(''), 5000);
      } else {
        setSavedMsg(`⚠️ Save failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      setSavedMsg(`⚠️ Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Reorder fallback chain
  const moveProviderInChain = (index, direction) => {
    const newChain = [...fallbackChain];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newChain.length) return;
    const temp = newChain[index];
    newChain[index] = newChain[targetIdx];
    newChain[targetIdx] = temp;
    setFallbackChain(newChain);
  };

  // Keys Management
  const handleAddKeysToProvider = (providerId) => {
    const raw = (newKeyInput[providerId] || '').trim();
    if (!raw) return;
    const newItems = raw
      .split('\n')
      .map(k => k.trim())
      .filter(k => k && k.length > 5);

    if (newItems.length === 0) return;

    setKeysByProvider(prev => {
      const current = prev[providerId] || { keys: [], enabled: true };
      const existing = current.keys || [];
      const merged = Array.from(new Set([...existing, ...newItems]));
      return {
        ...prev,
        [providerId]: {
          ...current,
          keys: merged
        }
      };
    });

    setNewKeyInput(prev => ({ ...prev, [providerId]: '' }));
    setShowKeyTextarea(prev => ({ ...prev, [providerId]: false }));
  };

  const handleDeleteKey = (providerId, keyToDelete) => {
    if (!window.confirm('Are you sure you want to remove this API key from the pool?')) return;
    setKeysByProvider(prev => {
      const current = prev[providerId] || { keys: [] };
      return {
        ...prev,
        [providerId]: {
          ...current,
          keys: current.keys.filter(k => (typeof k === 'string' ? k : k.key) !== keyToDelete)
        }
      };
    });
  };

  // Model Management
  const handleUpdateModelField = (modelId, field, value) => {
    setModels(prev => prev.map(m => (m.id === modelId ? { ...m, [field]: value } : m)));
  };

  const handleUpdateModelCredits = (modelId, res, val) => {
    const num = Math.max(0, Number(val) || 0);
    setModels(prev => prev.map(m => {
      if (m.id !== modelId) return m;
      const updatedCredits = { ...(m.creditsByResolution || { '1K': 6, '2K': 10, '4K': 16 }), [res]: num };
      return { ...m, creditsByResolution: updatedCredits, credits: updatedCredits['1K'] || num };
    }));
  };

  const handleDeleteModel = (modelId) => {
    if (!window.confirm(`Are you sure you want to delete model '${modelId}'?`)) return;
    setModels(prev => prev.filter(m => m.id !== modelId));
  };

  const handleAddModel = (e) => {
    e.preventDefault();
    if (!newModel.id.trim() || !newModel.name.trim()) {
      alert('Model ID and Name are required.');
      return;
    }
    if (models.some(m => m.id === newModel.id.trim())) {
      alert('A model with this ID already exists.');
      return;
    }

    setModels(prev => [...prev, { ...newModel, id: newModel.id.trim() }]);
    setShowAddModal(false);
    setNewModel({
      id: '',
      name: '',
      provider: 'kie.ai',
      badge: 'VIRAL 4K',
      badgeColor: 'linear-gradient(135deg, #10b981, #06b6d4)',
      credits: 6,
      creditsByResolution: { '1K': 6, '2K': 10, '4K': 16 },
      type: 'text-to-image',
      supportedResolutions: ['1K', '2K', '4K'],
      supportsBackground: false,
      requiresImage: false,
      enabled: true,
      description: '',
      defaultPrompt: '',
      showcaseImage: '/showcases/gpt_flare_2_5_ultra.png'
    });
  };

  // Preset Management
  const handleUpdatePreset = (presetId, field, value) => {
    setPresets(prev => prev.map(p => (p.id === presetId ? { ...p, [field]: value } : p)));
  };

  const handleDeletePreset = (presetId) => {
    if (!window.confirm('Delete this viral preset?')) return;
    setPresets(prev => prev.filter(p => p.id !== presetId));
  };

  const handleAddPreset = (e) => {
    e.preventDefault();
    if (!newPreset.id.trim() || !newPreset.label.trim()) {
      alert('Preset ID and Label are required.');
      return;
    }
    setPresets(prev => [...prev, { ...newPreset, id: newPreset.id.trim() }]);
    setShowAddPresetModal(false);
    setNewPreset({
      id: '',
      emoji: '🔥',
      label: '',
      prompt: '',
      aspectRatio: '16:9',
      modelId: models[0]?.id || '',
      enabled: true
    });
  };

  // Real Live Test Generation
  const handleRunRealTest = async (e) => {
    e.preventDefault();
    if (!testPrompt.trim()) return;
    setTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      const res = await adminService.testThumbnailGeneration({
        provider: testProvider,
        model: testModel || models[0]?.id,
        prompt: testPrompt,
        aspectRatio: testRatio,
        resolution: testRes
      });

      if (res.success && res.imageUrl) {
        setTestResult(res);
      } else {
        setTestError(res.error || 'Generation did not return a valid image URL');
      }
    } catch (err) {
      setTestError(err.message || 'Generation test request failed');
    } finally {
      setTesting(false);
    }
  };

  // Calculations for top statistics
  const totalKeysCount = Object.values(keysByProvider).reduce((sum, prov) => sum + (prov.keys?.length || 0), 0);
  const activeModelsCount = models.filter(m => m.enabled !== false).length;

  const filteredModels = models.filter(m => {
    if (modelTypeFilter !== 'all' && m.type !== modelTypeFilter) return false;
    if (modelSearch.trim()) {
      const q = modelSearch.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.badge?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="admin-view-container" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--admin-accent-cyan)' }}>
          Loading Thumbnail Studio Engine from MongoDB Atlas...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-view-container">
      {/* ── View Header ────────────────────────────────────────── */}
      <div className="admin-view-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="admin-view-title" style={{ margin: 0 }}>
              Thumbnail Studio & Multi-Provider Engine Manager
            </h1>
            <span style={{
              padding: '3px 9px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #ff4f00, #ff7700)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 800
            }}>
              ACTIVE: {activeProvider.toUpperCase()}
            </span>
            {providerRotationEnabled ? (
              <span style={{
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '11px',
                fontWeight: 700
              }}>
                ⚡ FAILOVER ROTATION ACTIVE
              </span>
            ) : (
              <span style={{
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '11px',
                fontWeight: 700
              }}>
                ⚠️ FAILOVER OFF (LOCKED)
              </span>
            )}
          </div>
          <p className="admin-view-desc" style={{ marginTop: '6px' }}>
            Full control over vision models, custom credits, provider rotation logic, API key vaults, system prompts, and 1-click viral presets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="admin-btn admin-btn-primary"
            style={{
              background: 'linear-gradient(135deg, #ff4f00 0%, #ff7700 100%)',
              boxShadow: '0 4px 16px rgba(255, 79, 0, 0.4)',
              fontWeight: 800
            }}
          >
            {saving ? 'Saving to Atlas...' : '💾 Save All Thumbnail Settings'}
          </button>
        </div>
      </div>

      {savedMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: savedMsg.startsWith('✅') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: savedMsg.startsWith('✅') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          color: savedMsg.startsWith('✅') ? '#10b981' : '#ef4444',
          fontSize: '13.5px',
          fontWeight: 700,
          marginBottom: '16px'
        }}>
          {savedMsg}
        </div>
      )}

      {/* ── KPI Overview Strip ──────────────────────────────────── */}
      <div className="admin-grid admin-grid-4" style={{ marginBottom: '20px' }}>
        <div className="admin-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase' }}>Active Provider</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#ff4f00', marginTop: '4px' }}>
            {activeProvider.toUpperCase()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '2px' }}>
            {keysByProvider[activeProvider]?.keys?.length || 0} API keys active in rotation
          </div>
        </div>

        <div className="admin-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase' }}>Vision Models</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--admin-accent-cyan)', marginTop: '4px' }}>
            {activeModelsCount} / {models.length} Enabled
          </div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '2px' }}>
            {models.filter(m => m.type === 'text-to-image').length} T2I • {models.filter(m => m.type === 'image-to-image').length} I2I
          </div>
        </div>

        <div className="admin-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase' }}>Provider Keys Pool</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--admin-accent-green)', marginTop: '4px' }}>
            {totalKeysCount} Total Keys
          </div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '2px' }}>
            Across 5 multi-provider vaults
          </div>
        </div>

        <div className="admin-card" style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase' }}>System Prompt Override</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: systemPromptEnabled ? '#ec4899' : 'var(--admin-text-sub)', marginTop: '4px' }}>
            {systemPromptEnabled ? 'CUSTOM ACTIVE' : 'CLEAN (OFF)'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '2px' }}>
            {systemPromptEnabled ? 'Admin prompt injected' : 'Zero prompt override (Normal)'}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation Bar ──────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '6px',
        borderBottom: '1px solid var(--admin-border-glass)',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'providers', label: '🌐 Providers & Failover Engine' },
          { id: 'models', label: `🤖 Vision Models & Credits (${models.length})` },
          { id: 'system_prompt', label: '🧠 System Prompt & Rules' },
          { id: 'presets', label: `🎨 Viral Presets (${presets.length})` },
          { id: 'diagnostics', label: '⚡ Live Diagnostics & Real Test' }
        ].map(t => {
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: isSelected ? 'var(--admin-bg-card)' : 'transparent',
                borderBottom: isSelected ? '2px solid #ff4f00' : '2px solid transparent',
                color: isSelected ? '#ff4f00' : 'var(--admin-text-sub)',
                fontWeight: isSelected ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB 1: PROVIDERS & FAILOVER ROTATION ENGINE
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'providers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Provider Selector */}
          <div className="admin-card">
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
              1. Primary Image Generation Provider
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: '0 0 16px 0' }}>
              Select which service provider Thumbnail Studio should actively use for image generation tasks.
            </p>

            <div className="admin-grid admin-grid-3" style={{ gap: '14px' }}>
              {PROVIDER_METADATA.map(p => {
                const isSelected = activeProvider === p.id;
                const keyCount = keysByProvider[p.id]?.keys?.length || 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => setActiveProvider(p.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #ff4f00' : '1px solid var(--admin-border-glass)',
                      background: isSelected ? 'rgba(255, 79, 0, 0.08)' : 'var(--admin-bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{p.icon}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        background: keyCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: keyCount > 0 ? '#10b981' : '#ef4444'
                      }}>
                        {keyCount} {keyCount === 1 ? 'Key' : 'Keys'}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? '#ff4f00' : 'var(--admin-text-main)', marginBottom: '4px' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', lineHeight: 1.4 }}>
                      {p.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Provider Rotation / Failover Logic Controls */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
                  2. Automatic Provider Rotation & Failover Logic
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
                  When enabled, if all API keys for the active provider become exhausted, rate-limited, or unauthorized,
                  the backend will <strong>automatically switch to the next provider in the failover chain</strong> to generate the thumbnail without failing the user's request.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: providerRotationEnabled ? '#10b981' : 'var(--admin-text-sub)' }}>
                  {providerRotationEnabled ? 'AUTO-FAILOVER ENABLED' : 'AUTO-FAILOVER DISABLED'}
                </span>
                <input
                  type="checkbox"
                  checked={providerRotationEnabled}
                  onChange={e => setProviderRotationEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ff4f00' }}
                />
              </div>
            </div>

            {/* Fallback Priority Chain Reorderer */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--admin-border-glass)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-text-sub)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Provider Failover Priority Order (Drag or Move Up/Down)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {fallbackChain.map((provId, index) => {
                  const pMeta = PROVIDER_METADATA.find(p => p.id === provId) || { id: provId, name: provId, icon: '⚡' };
                  const isPrimary = activeProvider === provId;
                  const keyCount = keysByProvider[provId]?.keys?.length || 0;

                  return (
                    <div
                      key={provId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: isPrimary ? 'rgba(255, 79, 0, 0.08)' : 'var(--admin-bg-elevated)',
                        border: isPrimary ? '1px solid rgba(255, 79, 0, 0.3)' : '1px solid var(--admin-border-glass)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-text-sub)', width: '22px' }}>
                          #{index + 1}
                        </span>
                        <span style={{ fontSize: '16px' }}>{pMeta.icon}</span>
                        <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                          {pMeta.name}
                        </span>
                        {isPrimary && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#ff4f00',
                            color: '#fff'
                          }}>
                            PRIMARY
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                          ({keyCount} keys)
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => moveProviderInChain(index, -1)}
                          disabled={index === 0}
                          className="admin-btn admin-btn-sm"
                          style={{ padding: '4px 8px' }}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveProviderInChain(index, 1)}
                          disabled={index === fallbackChain.length - 1}
                          className="admin-btn admin-btn-sm"
                          style={{ padding: '4px 8px' }}
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Per-Provider API Keys Vault */}
          <div className="admin-card">
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
              3. Per-Provider API Key Pools
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: '0 0 16px 0' }}>
              Add, rotate, and manage API keys for each provider. The engine rotates keys sequentially on each request and auto-rotates on rate limits.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {PROVIDER_METADATA.map(p => {
                const provData = keysByProvider[p.id] || { keys: [], enabled: true };
                const keysList = provData.keys || [];
                const isExpanded = showKeyTextarea[p.id];

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      background: 'var(--admin-bg-elevated)',
                      border: '1px solid var(--admin-border-glass)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>{p.icon}</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                            {keysList.length} API keys in rotating pool
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setShowKeyTextarea(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                          className="admin-btn admin-btn-sm"
                        >
                          {isExpanded ? 'Cancel Add' : '+ Add Keys in Bulk'}
                        </button>
                      </div>
                    </div>

                    {/* Custom baseUrl input for OpenAI compatible */}
                    {p.id === 'openai' && (
                      <div style={{ marginTop: '12px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                          Custom API Base URL (Default: https://api.openai.com/v1)
                        </label>
                        <input
                          type="text"
                          value={provData.baseUrl || 'https://api.openai.com/v1'}
                          onChange={e => {
                            const val = e.target.value;
                            setKeysByProvider(prev => ({
                              ...prev,
                              openai: { ...(prev.openai || {}), baseUrl: val }
                            }));
                          }}
                          className="admin-input"
                          style={{ fontSize: '12px', fontFamily: 'monospace' }}
                        />
                      </div>
                    )}

                    {/* Bulk Keys Add Textarea */}
                    {isExpanded && (
                      <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                          Paste one or more API keys (one per line):
                        </label>
                        <textarea
                          rows={3}
                          value={newKeyInput[p.id] || ''}
                          onChange={e => setNewKeyInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Paste API keys here, one per line..."
                          className="admin-input"
                          style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleAddKeysToProvider(p.id)}
                            className="admin-btn admin-btn-primary admin-btn-sm"
                          >
                            Add to {p.name} Pool
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Keys List */}
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {keysList.length === 0 ? (
                        <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontStyle: 'italic' }}>
                          No API keys configured for this provider. Add keys above to enable generation.
                        </div>
                      ) : (
                        keysList.map((keyItem, kidx) => {
                          const rawKey = typeof keyItem === 'string' ? keyItem : keyItem.key;
                          const masked = rawKey.length > 12 ? `${rawKey.slice(0, 6)}••••••••${rawKey.slice(-4)}` : rawKey;
                          return (
                            <div
                              key={kidx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: 'rgba(0,0,0,0.15)',
                                fontSize: '12px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--admin-text-sub)', fontFamily: 'monospace' }}>
                                  #{kidx + 1}
                                </span>
                                <span style={{ fontFamily: 'monospace', color: 'var(--admin-text-main)' }}>
                                  {masked}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteKey(p.id, rawKey)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 700
                                }}
                                title="Remove key"
                              >
                                ✕ Delete
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 2: VISION MODELS CATALOG & CUSTOM CREDITS
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'models' && (
        <div>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setModelTypeFilter('all')}
                className={`admin-btn admin-btn-sm ${modelTypeFilter === 'all' ? 'admin-btn-primary' : ''}`}
              >
                All ({models.length})
              </button>
              <button
                type="button"
                onClick={() => setModelTypeFilter('text-to-image')}
                className={`admin-btn admin-btn-sm ${modelTypeFilter === 'text-to-image' ? 'admin-btn-primary' : ''}`}
              >
                🎨 Text-to-Image ({models.filter(m => m.type === 'text-to-image').length})
              </button>
              <button
                type="button"
                onClick={() => setModelTypeFilter('image-to-image')}
                className={`admin-btn admin-btn-sm ${modelTypeFilter === 'image-to-image' ? 'admin-btn-primary' : ''}`}
              >
                🔄 Image-to-Image ({models.filter(m => m.type === 'image-to-image').length})
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search models..."
                value={modelSearch}
                onChange={e => setModelSearch(e.target.value)}
                className="admin-input"
                style={{ padding: '6px 12px', fontSize: '12px', width: '180px' }}
              />
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="admin-btn admin-btn-primary"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', fontWeight: 800 }}
              >
                + Add New Model
              </button>
            </div>
          </div>

          {/* Model Cards Grid */}
          <div className="admin-grid admin-grid-2" style={{ gap: '16px' }}>
            {filteredModels.map(m => {
              return (
                <div
                  key={m.id}
                  className="admin-card"
                  style={{
                    padding: '16px',
                    border: m.enabled === false ? '1px dashed var(--admin-border-glass)' : '1px solid var(--admin-border-glass)',
                    opacity: m.enabled === false ? 0.65 : 1
                  }}
                >
                  {/* Top Bar: Title, Type & Delete */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--admin-text-main)' }}>
                          {m.name}
                        </span>
                        <span style={{
                          padding: '2px 7px',
                          borderRadius: '5px',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#fff',
                          background: m.badgeColor || '#ff4f00'
                        }}>
                          {m.badge || 'PRO'}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--admin-text-sub)'
                        }}>
                          {m.type === 'text-to-image' ? 'Text-to-Image' : 'Image-to-Image'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--admin-accent-cyan)', marginTop: '2px' }}>
                        ID: {m.id}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={m.enabled !== false}
                          onChange={e => handleUpdateModelField(m.id, 'enabled', e.target.checked)}
                          style={{ cursor: 'pointer', accentColor: '#ff4f00' }}
                        />
                        <span style={{ fontWeight: 700, color: m.enabled !== false ? '#10b981' : 'var(--admin-text-sub)' }}>
                          {m.enabled !== false ? 'Active' : 'Disabled'}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteModel(m.id)}
                        className="admin-btn admin-btn-sm"
                        style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', padding: '2px 8px' }}
                        title="Delete model"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Editable Description */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                      Description:
                    </label>
                    <input
                      type="text"
                      value={m.description || ''}
                      onChange={e => handleUpdateModelField(m.id, 'description', e.target.value)}
                      className="admin-input"
                      style={{ fontSize: '12px' }}
                    />
                  </div>

                  {/* Showcase Image Display & URL Editing */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', background: 'rgba(0,0,0,0.18)', padding: '8px 10px', borderRadius: '8px' }}>
                    <div style={{
                      width: '74px',
                      height: '46px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      background: '#0a0a0d',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--admin-border-glass)'
                    }}>
                      <img
                        src={m.showcaseImage || '/showcases/gpt_flare_2_5_ultra.png'}
                        alt="showcase"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.currentTarget.src = '/showcases/gpt_flare_2_5_ultra.png'; }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                        Preview Showcase Image URL:
                      </label>
                      <input
                        type="text"
                        value={m.showcaseImage || ''}
                        onChange={e => handleUpdateModelField(m.id, 'showcaseImage', e.target.value)}
                        placeholder="Paste image preview URL here..."
                        className="admin-input"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      />
                    </div>
                  </div>

                  {/* Custom Credit Pricing Inputs */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                      Custom Credit Pricing (Enter any specific number):
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block' }}>1K Standard</span>
                        <input
                          type="number"
                          step="0.5"
                          value={m.creditsByResolution?.['1K'] ?? m.credits ?? 6}
                          onChange={e => handleUpdateModelCredits(m.id, '1K', e.target.value)}
                          className="admin-input"
                          style={{ fontSize: '12px', padding: '5px 8px' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block' }}>2K Quad HD</span>
                        <input
                          type="number"
                          step="0.5"
                          value={m.creditsByResolution?.['2K'] ?? m.credits ?? 10}
                          onChange={e => handleUpdateModelCredits(m.id, '2K', e.target.value)}
                          className="admin-input"
                          style={{ fontSize: '12px', padding: '5px 8px' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block' }}>4K Ultra HD</span>
                        <input
                          type="number"
                          step="0.5"
                          value={m.creditsByResolution?.['4K'] ?? m.credits ?? 16}
                          onChange={e => handleUpdateModelCredits(m.id, '4K', e.target.value)}
                          className="admin-input"
                          style={{ fontSize: '12px', padding: '5px 8px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Default Prompt Template */}
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                      Initial Default Prompt Template:
                    </label>
                    <textarea
                      rows={2}
                      value={m.defaultPrompt || ''}
                      onChange={e => handleUpdateModelField(m.id, 'defaultPrompt', e.target.value)}
                      className="admin-input"
                      style={{ fontSize: '11px', resize: 'vertical' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Model Modal */}
          {showAddModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}>
              <div style={{
                background: 'var(--admin-bg-card)',
                border: '1px solid var(--admin-border-glass)',
                borderRadius: '12px',
                padding: '24px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                    Add New Vision Model
                  </h3>
                  <button type="button" onClick={() => setShowAddModal(false)} className="admin-btn admin-btn-sm">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddModel} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                      Model ID (Exact Provider API Name):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. flux-1-schnell or wan/2-7-image-pro"
                      value={newModel.id}
                      onChange={e => setNewModel({ ...newModel, id: e.target.value })}
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                      Display Name:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FLUX 1.1 Schnell Turbo"
                      value={newModel.name}
                      onChange={e => setNewModel({ ...newModel, name: e.target.value })}
                      className="admin-input"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                        Generation Type:
                      </label>
                      <select
                        value={newModel.type}
                        onChange={e => setNewModel({ ...newModel, type: e.target.value })}
                        className="admin-select"
                      >
                        <option value="text-to-image">🎨 Text-to-Image</option>
                        <option value="image-to-image">🔄 Image-to-Image</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                        Badge Text:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. VIRAL 4K"
                        value={newModel.badge}
                        onChange={e => setNewModel({ ...newModel, badge: e.target.value })}
                        className="admin-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                      Showcase Preview Image URL:
                    </label>
                    <input
                      type="text"
                      placeholder="https://... or /showcases/..."
                      value={newModel.showcaseImage}
                      onChange={e => setNewModel({ ...newModel, showcaseImage: e.target.value })}
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                      Credit Pricing (1K / 2K / 4K):
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <input
                        type="number"
                        placeholder="1K"
                        value={newModel.creditsByResolution['1K']}
                        onChange={e => setNewModel({
                          ...newModel,
                          creditsByResolution: { ...newModel.creditsByResolution, '1K': Number(e.target.value) }
                        })}
                        className="admin-input"
                      />
                      <input
                        type="number"
                        placeholder="2K"
                        value={newModel.creditsByResolution['2K']}
                        onChange={e => setNewModel({
                          ...newModel,
                          creditsByResolution: { ...newModel.creditsByResolution, '2K': Number(e.target.value) }
                        })}
                        className="admin-input"
                      />
                      <input
                        type="number"
                        placeholder="4K"
                        value={newModel.creditsByResolution['4K']}
                        onChange={e => setNewModel({
                          ...newModel,
                          creditsByResolution: { ...newModel.creditsByResolution, '4K': Number(e.target.value) }
                        })}
                        className="admin-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                      Description:
                    </label>
                    <input
                      type="text"
                      placeholder="Next-gen photorealistic visuals..."
                      value={newModel.description}
                      onChange={e => setNewModel({ ...newModel, description: e.target.value })}
                      className="admin-input"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                    <button type="button" onClick={() => setShowAddModal(false)} className="admin-btn">
                      Cancel
                    </button>
                    <button type="submit" className="admin-btn admin-btn-primary">
                      Add Model
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 3: SYSTEM PROMPT & CONDITIONING RULES
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'system_prompt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
                  Platform System Prompt Injection Control
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
                  By default, <strong>no system prompt overrides or alters the user's prompt</strong>. The image generator executes the user's prompt cleanly and directly.
                  If you enable this setting and enter a system prompt below, it will be injected before generation.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: systemPromptEnabled ? '#ec4899' : 'var(--admin-text-sub)' }}>
                  {systemPromptEnabled ? 'SYSTEM PROMPT ACTIVE' : 'NO OVERRIDE (NORMAL)'}
                </span>
                <input
                  type="checkbox"
                  checked={systemPromptEnabled}
                  onChange={e => setSystemPromptEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ff4f00' }}
                />
              </div>
            </div>

            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: systemPromptEnabled ? 'rgba(236, 72, 153, 0.08)' : 'rgba(255,255,255,0.03)',
              border: systemPromptEnabled ? '1px solid rgba(236, 72, 153, 0.25)' : '1px solid var(--admin-border-glass)',
              marginBottom: '16px'
            }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)', display: 'block', marginBottom: '6px' }}>
                System Prompt (Only applied if switch above is ON):
              </label>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                placeholder="Leave blank for no system prompt override. When entered and enabled, this prompt directive will be prepended to all image generation tasks..."
                className="admin-input"
                style={{ width: '100%', resize: 'vertical', fontSize: '12.5px', lineHeight: 1.5 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)', display: 'block', marginBottom: '6px' }}>
                Default Negative Prompt:
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                className="admin-input"
                style={{ fontSize: '12.5px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 4: VIRAL PRESETS & STYLE ARCHETYPES
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'presets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--admin-text-main)' }}>
                  1-Click Viral Creator Presets
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: 0 }}>
                  Manage the 1-click thumbnail preset chips displayed to users in Thumbnail Studio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPresetModal(true)}
                className="admin-btn admin-btn-primary admin-btn-sm"
              >
                + Add New Preset
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {presets.map(p => (
                <div
                  key={p.id}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'var(--admin-bg-elevated)',
                    border: '1px solid var(--admin-border-glass)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        value={p.emoji || '🔥'}
                        onChange={e => handleUpdatePreset(p.id, 'emoji', e.target.value)}
                        style={{ width: '32px', textAlign: 'center', fontSize: '16px', background: 'transparent', border: '1px solid var(--admin-border-glass)', borderRadius: '4px' }}
                      />
                      <input
                        type="text"
                        value={p.label || ''}
                        onChange={e => handleUpdatePreset(p.id, 'label', e.target.value)}
                        className="admin-input"
                        style={{ fontWeight: 800, fontSize: '13px', width: '280px' }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontFamily: 'monospace' }}>
                        ID: {p.id}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        value={p.aspectRatio || '16:9'}
                        onChange={e => handleUpdatePreset(p.id, 'aspectRatio', e.target.value)}
                        className="admin-select"
                        style={{ padding: '4px 8px', fontSize: '11.5px' }}
                      >
                        <option value="16:9">16:9 Landscape</option>
                        <option value="9:16">9:16 Shorts</option>
                        <option value="1:1">1:1 Square</option>
                        <option value="4:3">4:3 Classic</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeletePreset(p.id)}
                        className="admin-btn admin-btn-sm"
                        style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', padding: '4px 8px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={p.prompt || ''}
                      onChange={e => handleUpdatePreset(p.id, 'prompt', e.target.value)}
                      className="admin-input"
                      style={{ fontSize: '11.5px', resize: 'vertical' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Preset Modal */}
          {showAddPresetModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}>
              <div style={{
                background: 'var(--admin-bg-card)',
                border: '1px solid var(--admin-border-glass)',
                borderRadius: '12px',
                padding: '24px',
                width: '100%',
                maxWidth: '520px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Add Viral Preset</h3>
                  <button type="button" onClick={() => setShowAddPresetModal(false)} className="admin-btn admin-btn-sm">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddPreset} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                        Emoji:
                      </label>
                      <input
                        type="text"
                        value={newPreset.emoji}
                        onChange={e => setNewPreset({ ...newPreset, emoji: e.target.value })}
                        className="admin-input"
                        style={{ textAlign: 'center', fontSize: '16px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                        Preset ID:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. true-crime"
                        value={newPreset.id}
                        onChange={e => setNewPreset({ ...newPreset, id: e.target.value })}
                        className="admin-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                      Preset Label:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. True Crime Mysterious Noir"
                      value={newPreset.label}
                      onChange={e => setNewPreset({ ...newPreset, label: e.target.value })}
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                      Aspect Ratio:
                    </label>
                    <select
                      value={newPreset.aspectRatio}
                      onChange={e => setNewPreset({ ...newPreset, aspectRatio: e.target.value })}
                      className="admin-select"
                    >
                      <option value="16:9">16:9 Landscape</option>
                      <option value="9:16">9:16 Shorts</option>
                      <option value="1:1">1:1 Square</option>
                      <option value="4:3">4:3 Classic</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                      Prompt Template:
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Enter the viral prompt template..."
                      value={newPreset.prompt}
                      onChange={e => setNewPreset({ ...newPreset, prompt: e.target.value })}
                      className="admin-input"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                    <button type="button" onClick={() => setShowAddPresetModal(false)} className="admin-btn">
                      Cancel
                    </button>
                    <button type="submit" className="admin-btn admin-btn-primary">
                      Add Preset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 5: REAL LIVE DIAGNOSTICS & TEST GENERATION
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'diagnostics' && (
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
            Real-Time Live Generation Tester (100% Real API Call)
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: '0 0 16px 0' }}>
            Dispatch a real thumbnail generation job directly to your configured provider to verify API keys, latency, and image rendering.
          </p>

          <form onSubmit={handleRunRealTest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="admin-grid admin-grid-4">
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Target Provider:
                </label>
                <select
                  value={testProvider}
                  onChange={e => setTestProvider(e.target.value)}
                  className="admin-select"
                >
                  {PROVIDER_METADATA.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({keysByProvider[p.id]?.keys?.length || 0} keys)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Vision Model:
                </label>
                <select
                  value={testModel}
                  onChange={e => setTestModel(e.target.value)}
                  className="admin-select"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} [{m.badge}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Aspect Ratio:
                </label>
                <select
                  value={testRatio}
                  onChange={e => setTestRatio(e.target.value)}
                  className="admin-select"
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Vertical Shorts</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="4:3">4:3 Classic</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Resolution:
                </label>
                <select
                  value={testRes}
                  onChange={e => setTestRes(e.target.value)}
                  className="admin-select"
                >
                  <option value="1K">1K (1080p Standard)</option>
                  <option value="2K">2K (1440p Quad HD)</option>
                  <option value="4K">4K (2160p Ultra HD)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                Test Prompt:
              </label>
              <textarea
                rows={2}
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                className="admin-input"
                style={{ resize: 'vertical', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="submit"
                disabled={testing}
                className="admin-btn admin-btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  fontWeight: 800,
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                }}
              >
                {testing ? '⏳ Dispatching Real Generation Job...' : '🚀 Run Real Live Test Generation'}
              </button>
            </div>
          </form>

          {/* Test Error Display */}
          {testError && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '12.5px'
            }}>
              <strong>Generation Error:</strong> {testError}
            </div>
          )}

          {/* Real Generated Result Display */}
          {testResult && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
                  ✓ Live Generation Succeeded! (Elapsed: {testResult.costTime || 0}s)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontFamily: 'monospace' }}>
                  Provider: {testResult.providerUsed} • Task ID: {testResult.taskId}
                </span>
              </div>

              <div style={{
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#0a0a0d',
                maxHeight: '440px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={testResult.imageUrl}
                  alt="Live generated test thumbnail"
                  style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }}
                />
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)', wordBreak: 'break-all' }}>
                  URL: {testResult.imageUrl}
                </span>
                <a
                  href={testResult.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-btn admin-btn-sm"
                >
                  Open Fullscreen HD ↗
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
