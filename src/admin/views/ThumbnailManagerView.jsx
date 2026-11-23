import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

// Default Providers Reference List
const DEFAULT_PROVIDERS = [
  { id: 'kie.ai', name: 'Kie.ai Vision Engine', icon: '⚡', desc: 'Primary low-latency 4K vision API with multi-key failover and CDN storage.' },
  { id: 'fal.ai', name: 'Fal.ai Fast Vision', icon: '🚀', desc: 'Ultra-fast inference queue API supporting FLUX, Recraft, and Ideogram.' },
  { id: 'replicate', name: 'Replicate', icon: '🔄', desc: 'Flagship open-source model hub hosting FLUX Schnell, Dev, and SDXL.' },
  { id: 'together', name: 'Together AI', icon: '🧠', desc: 'High-throughput cloud GPU engine with instant sync image synthesis.' },
  { id: 'openai', name: 'OpenAI / Custom Compatible', icon: '🌐', desc: 'DALL-E 3 & OpenAI-compatible /v1/images/generations endpoints with custom baseUrl.' }
];

export default function ThumbnailManagerView() {
  const [activeTab, setActiveTab] = useState('providers'); // 'providers' | 'balances' | 'models' | 'system_prompt' | 'presets' | 'diagnostics'
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
    'kie.ai': { name: 'Kie.ai Vision Engine', icon: '⚡', keys: [], enabled: true },
    'fal.ai': { name: 'Fal.ai Fast Vision', icon: '🚀', keys: [], enabled: true },
    'replicate': { name: 'Replicate', icon: '🔄', keys: [], enabled: true },
    'together': { name: 'Together AI', icon: '🧠', keys: [], enabled: true },
    'openai': { name: 'OpenAI / Custom Compatible', icon: '🌐', baseUrl: 'https://api.openai.com/v1', keys: [], enabled: true }
  });

  // ── Custom Providers Metadata State ──
  const [providersList, setProvidersList] = useState(DEFAULT_PROVIDERS);

  // ── Balance Checking State (Tab 2) ──
  const [selectedBalanceProvider, setSelectedBalanceProvider] = useState('kie.ai');
  const [keyBalances, setKeyBalances] = useState({}); // key -> { balance, balanceFormatted, status, details, lastChecked }
  const [checkingKey, setCheckingKey] = useState({}); // key -> bool
  const [checkingAll, setCheckingAll] = useState(false);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [addKeyInput, setAddKeyInput] = useState('');

  // ── Custom Provider Addition Modal ──
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [newProviderForm, setNewProviderForm] = useState({
    id: '',
    name: '',
    icon: '⚡',
    desc: '',
    baseUrl: 'https://api.example.com/v1',
    authType: 'Bearer'
  });

  // ── UI Filters & Helpers ──
  const [modelTypeFilter, setModelTypeFilter] = useState('all');
  const [modelSearch, setModelSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPresetModal, setShowAddPresetModal] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState({});

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

        // Synchronize providersList to include any custom added providers
        const existingIds = new Set(DEFAULT_PROVIDERS.map(p => p.id));
        const mergedList = [...DEFAULT_PROVIDERS];
        Object.entries(res.keys.providers).forEach(([provId, provData]) => {
          if (!existingIds.has(provId)) {
            mergedList.push({
              id: provId,
              name: provData.name || provId,
              icon: provData.icon || '🌐',
              desc: provData.desc || (provData.baseUrl ? `Custom Provider (${provData.baseUrl})` : 'Custom Service Provider')
            });
          }
        });
        setProvidersList(mergedList);
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
        setSavedMsg('✅ All settings, models, custom credits, and API key vaults saved to MongoDB Atlas!');
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

  // Add Custom Provider Handler
  const handleAddCustomProvider = (e) => {
    e.preventDefault();
    const pid = newProviderForm.id.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '-');
    if (!pid || !newProviderForm.name.trim()) {
      alert('Provider ID and Display Name are required.');
      return;
    }

    if (keysByProvider[pid]) {
      alert(`Provider with ID '${pid}' already exists.`);
      return;
    }

    const providerObj = {
      id: pid,
      name: newProviderForm.name.trim(),
      icon: newProviderForm.icon || '🌐',
      desc: newProviderForm.desc || `Custom Vision Provider (${newProviderForm.baseUrl || 'Custom API'})`
    };

    setProvidersList(prev => [...prev, providerObj]);
    setKeysByProvider(prev => ({
      ...prev,
      [pid]: {
        name: providerObj.name,
        icon: providerObj.icon,
        baseUrl: newProviderForm.baseUrl.trim(),
        authType: newProviderForm.authType,
        keys: [],
        enabled: true
      }
    }));

    if (!fallbackChain.includes(pid)) {
      setFallbackChain(prev => [...prev, pid]);
    }

    setSelectedBalanceProvider(pid);
    setShowAddProviderModal(false);
    setNewProviderForm({
      id: '',
      name: '',
      icon: '⚡',
      desc: '',
      baseUrl: 'https://api.example.com/v1',
      authType: 'Bearer'
    });
  };

  // Delete Provider Handler
  const handleDeleteProvider = (providerId) => {
    if (!window.confirm(`Are you sure you want to delete service provider '${providerId}' and its API keys?`)) return;

    setProvidersList(prev => prev.filter(p => p.id !== providerId));
    setFallbackChain(prev => prev.filter(p => p !== providerId));
    setKeysByProvider(prev => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });

    if (activeProvider === providerId) {
      setActiveProvider(fallbackChain.find(p => p !== providerId) || 'kie.ai');
    }
    if (selectedBalanceProvider === providerId) {
      setSelectedBalanceProvider('kie.ai');
    }
  };

  // Balance Checking: Single Key
  const handleCheckKeyBalance = async (providerId, key) => {
    setCheckingKey(prev => ({ ...prev, [key]: true }));
    try {
      const baseUrl = keysByProvider[providerId]?.baseUrl;
      const res = await adminService.checkThumbnailKeyBalance({ provider: providerId, key, baseUrl });
      if (res.success) {
        setKeyBalances(prev => ({
          ...prev,
          [key]: res
        }));
      } else {
        setKeyBalances(prev => ({
          ...prev,
          [key]: { status: 'invalid', balanceFormatted: 'Check Failed', details: res.error || 'Error' }
        }));
      }
    } catch (err) {
      setKeyBalances(prev => ({
        ...prev,
        [key]: { status: 'invalid', balanceFormatted: 'Network Error', details: err.message }
      }));
    } finally {
      setCheckingKey(prev => ({ ...prev, [key]: false }));
    }
  };

  // Balance Checking: All Keys in Selected Provider
  const handleCheckAllBalancesForProvider = async (providerId) => {
    const keysList = keysByProvider[providerId]?.keys || [];
    if (keysList.length === 0) return;

    setCheckingAll(true);
    for (const key of keysList) {
      await handleCheckKeyBalance(providerId, key);
    }
    setCheckingAll(false);
  };

  // Add Keys in Bulk to Selected Provider
  const handleAddKeysToSelectedProvider = (providerId) => {
    const raw = (addKeyInput || '').trim();
    if (!raw) return;
    const newItems = raw
      .split(/[\n,]+/)
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

    setAddKeyInput('');
    setShowAddKeyModal(false);
  };

  // Delete Single Key from Provider
  const handleDeleteKeyFromProvider = (providerId, keyToDelete) => {
    if (!window.confirm('Remove this API key from the provider vault?')) return;
    setKeysByProvider(prev => {
      const current = prev[providerId] || { keys: [] };
      return {
        ...prev,
        [providerId]: {
          ...current,
          keys: (current.keys || []).filter(k => k !== keyToDelete)
        }
      };
    });
  };

  // Models Management Handlers
  const handleUpdateModelField = (modelId, field, val) => {
    setModels(prev => prev.map(m => (m.id === modelId ? { ...m, [field]: val } : m)));
  };

  const handleUpdateModelCredits = (modelId, res, val) => {
    const num = Math.max(0, Number(val) || 0);
    setModels(prev => prev.map(m => {
      if (m.id !== modelId) return m;
      const currentResMap = m.creditsByResolution || { '1K': 6, '2K': 10, '4K': 16 };
      const updatedCredits = { ...currentResMap, [res]: num };
      return {
        ...m,
        creditsByResolution: updatedCredits,
        credits: updatedCredits['1K'] || num
      };
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
    const cleanId = newModel.id.trim().toLowerCase().replace(/[^a-z0-9._/-]/g, '-');
    setModels(prev => [...prev, { ...newModel, id: cleanId, credits: newModel.creditsByResolution['1K'] || 6 }]);
    setShowAddModal(false);
    setNewModel({
      id: '',
      name: '',
      provider: activeProvider || 'kie.ai',
      badge: 'VIRAL 4K',
      badgeColor: 'linear-gradient(135deg, #10b981, #06b6d4)',
      credits: 6,
      creditsByResolution: { '1K': 6, '2K': 10, '4K': 16 },
      type: 'text-to-image',
      supportedResolutions: ['1K', '2K', '4K'],
      enabled: true,
      description: '',
      defaultPrompt: '',
      showcaseImage: '/showcases/gpt_flare_2_5_ultra.png'
    });
  };

  // Presets Handlers
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

  // Filtered models
  const filteredModels = models.filter(m => {
    if (modelTypeFilter !== 'all' && m.type !== modelTypeFilter) return false;
    if (modelSearch.trim()) {
      const q = modelSearch.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.badge?.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate statistics
  const totalKeysCount = Object.values(keysByProvider).reduce((sum, prov) => sum + (prov.keys?.length || 0), 0);
  const activeModelsCount = models.filter(m => m.enabled !== false).length;

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
    <div className="admin-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── HEADER & ACTIONS ───────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--admin-border-glass)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🎨</span>
            <h2 className="admin-view-title" style={{ margin: 0 }}>
              Thumbnail Studio & Multi-Provider Engine Hub
            </h2>
          </div>
          <p className="admin-view-desc" style={{ marginTop: '6px' }}>
            Full control over vision models, custom credits, API key vaults, live credit balance checking, provider failover, and presets.
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
          borderRadius: '8px',
          background: savedMsg.startsWith('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: savedMsg.startsWith('✅') ? '1px solid #10b981' : '1px solid #ef4444',
          color: savedMsg.startsWith('✅') ? '#10b981' : '#ef4444',
          fontWeight: 700,
          fontSize: '13px'
        }}>
          {savedMsg}
        </div>
      )}

      {/* ── METRIC STATS STRIP ──────────────────────────────────────── */}
      <div className="admin-grid admin-grid-4" style={{ gap: '12px' }}>
        <div className="admin-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
            Active Primary Provider
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ff4f00', marginTop: '4px', textTransform: 'uppercase' }}>
            {activeProvider}
          </div>
        </div>

        <div className="admin-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
            Provider Failover
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: providerRotationEnabled ? '#10b981' : 'var(--admin-text-sub)', marginTop: '4px' }}>
            {providerRotationEnabled ? 'AUTOMATIC (ACTIVE)' : 'DISABLED'}
          </div>
        </div>

        <div className="admin-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total API Keys in Vault
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>
            {totalKeysCount} Keys Across {Object.keys(keysByProvider).length} Providers
          </div>
        </div>

        <div className="admin-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
            Active Vision Models
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>
            {activeModelsCount} Models Ready
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid var(--admin-border-glass)',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'providers', label: '🌐 Providers & Failover Engine' },
          { id: 'balances', label: '🔑 API Keys & Live Balances' },
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
                padding: '10px 18px',
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
          {/* Active Provider Selector & Management */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--admin-text-main)' }}>
                  1. Image Generation Service Providers
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0 }}>
                  Select primary provider, add custom providers, or remove providers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddProviderModal(true)}
                className="admin-btn admin-btn-sm"
                style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid #06b6d4', color: '#06b6d4', fontWeight: 800 }}
              >
                ➕ Add Custom Service Provider
              </button>
            </div>

            <div className="admin-grid admin-grid-3" style={{ gap: '14px' }}>
              {providersList.map(p => {
                const isSelected = activeProvider === p.id;
                const provData = keysByProvider[p.id] || { keys: [], enabled: true };
                const keyCount = provData.keys?.length || 0;
                const isCustom = !DEFAULT_PROVIDERS.some(dp => dp.id === p.id);

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #ff4f00' : '1px solid var(--admin-border-glass)',
                      background: isSelected ? 'rgba(255, 79, 0, 0.08)' : 'var(--admin-bg-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{p.icon || '🌐'}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
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
                          {isCustom && (
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 800,
                              background: 'rgba(168, 85, 247, 0.2)',
                              color: '#c084fc'
                            }}>
                              CUSTOM
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? '#ff4f00' : 'var(--admin-text-main)', marginBottom: '4px' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', lineHeight: 1.4, marginBottom: '6px' }}>
                        {p.desc}
                      </div>
                      {provData.baseUrl && (
                        <div style={{ fontSize: '10.5px', color: '#06b6d4', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Base URL: {provData.baseUrl}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid var(--admin-border-glass)', paddingTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveProvider(p.id)}
                        className="admin-btn admin-btn-sm"
                        style={{
                          flex: 1,
                          background: isSelected ? '#ff4f00' : 'var(--admin-bg-elevated)',
                          color: isSelected ? '#fff' : 'var(--admin-text-main)',
                          fontWeight: 700
                        }}
                      >
                        {isSelected ? '✓ Primary Active' : 'Set as Primary'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBalanceProvider(p.id);
                          setActiveTab('balances');
                        }}
                        className="admin-btn admin-btn-sm"
                        style={{ fontSize: '11px' }}
                      >
                        🔑 Manage Keys
                      </button>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteProvider(p.id)}
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          style={{ padding: '4px 8px' }}
                          title="Delete custom provider"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Provider Rotation & Failover Chain */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
                  2. Automatic Provider Rotation & Failover Logic
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
                  When enabled, if all API keys for the current provider are exhausted, rate-limited, or out of balance,
                  the backend will <strong>automatically switch to the next provider in the fallback priority chain</strong> to generate the thumbnail without user interruption.
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

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--admin-border-glass)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-text-sub)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Provider Failover Priority Order (Drag or Move Up/Down)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {fallbackChain.map((provId, index) => {
                  const pMeta = providersList.find(p => p.id === provId) || { id: provId, name: provId, icon: '⚡' };
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
                            PRIMARY ACTIVE
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
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 2: PROVIDER API KEYS & REAL CREDIT BALANCES
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'balances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Provider Selection Rail */}
          <div className="admin-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-text-sub)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Select Service Provider to Inspect & Manage API Keys:
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {providersList.map(p => {
                const isSelected = selectedBalanceProvider === p.id;
                const count = keysByProvider[p.id]?.keys?.length || 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedBalanceProvider(p.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #ff4f00' : '1px solid var(--admin-border-glass)',
                      background: isSelected ? 'rgba(255, 79, 0, 0.12)' : 'var(--admin-bg-elevated)',
                      color: isSelected ? '#ff4f00' : 'var(--admin-text-main)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{p.icon || '⚡'}</span>
                    <span>{p.name}</span>
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      background: count > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: count > 0 ? '#10b981' : '#ef4444'
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Provider Vault Details */}
          {(() => {
            const currentProv = keysByProvider[selectedBalanceProvider] || { keys: [], enabled: true };
            const keysList = currentProv.keys || [];
            const meta = providersList.find(p => p.id === selectedBalanceProvider) || { name: selectedBalanceProvider, icon: '⚡' };

            return (
              <div className="admin-card">
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px',
                  paddingBottom: '14px',
                  borderBottom: '1px solid var(--admin-border-glass)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '22px' }}>{meta.icon}</span>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                        {meta.name} — API Key Vault ({keysList.length} Keys)
                      </h3>
                      {activeProvider === selectedBalanceProvider && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 800,
                          background: '#ff4f00',
                          color: '#fff'
                        }}>
                          PRIMARY PROVIDER
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '4px 0 0 0' }}>
                      Inspect real-time API credit balance, rotate keys, add new keys, or delete exhausted keys.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={checkingAll || keysList.length === 0}
                      onClick={() => handleCheckAllBalancesForProvider(selectedBalanceProvider)}
                      className="admin-btn admin-btn-sm"
                      style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', fontWeight: 800 }}
                    >
                      {checkingAll ? 'Checking All Keys...' : '⚡ Check All Keys Balance'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddKeyModal(true)}
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      style={{ fontWeight: 800 }}
                    >
                      ➕ Add Keys to {meta.name}
                    </button>
                  </div>
                </div>

                {/* Base URL configuration if applicable */}
                {selectedBalanceProvider === 'openai' && (
                  <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                      OpenAI Compatible Base URL:
                    </label>
                    <input
                      type="text"
                      value={currentProv.baseUrl || 'https://api.openai.com/v1'}
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

                {/* Keys Table */}
                {keysList.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--admin-text-sub)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>No API keys configured for this provider.</div>
                    <div style={{ fontSize: '12px', marginTop: '6px' }}>Click "➕ Add Keys" above to populate the key pool.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--admin-border-glass)', textAlign: 'left', fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                          <th style={{ padding: '10px 12px', width: '50px' }}>#</th>
                          <th style={{ padding: '10px 12px' }}>API Key</th>
                          <th style={{ padding: '10px 12px', width: '180px' }}>Live Credit Balance</th>
                          <th style={{ padding: '10px 12px', width: '140px' }}>Status</th>
                          <th style={{ padding: '10px 12px', width: '160px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keysList.map((key, idx) => {
                          const isRevealed = revealedKeys[key];
                          const bInfo = keyBalances[key];
                          const isChecking = checkingKey[key];

                          let statusColor = '#94a3b8';
                          let statusLabel = 'UNCHECKED';
                          if (bInfo) {
                            if (bInfo.status === 'active') {
                              statusColor = '#10b981';
                              statusLabel = 'OPERATIONAL';
                            } else if (bInfo.status === 'low') {
                              statusColor = '#f59e0b';
                              statusLabel = 'LOW BALANCE';
                            } else if (bInfo.status === 'exhausted') {
                              statusColor = '#ef4444';
                              statusLabel = 'EXHAUSTED';
                            } else if (bInfo.status === 'invalid') {
                              statusColor = '#dc2626';
                              statusLabel = 'INVALID KEY';
                            }
                          }

                          return (
                            <tr key={key} style={{ borderBottom: '1px solid var(--admin-border-glass)', fontSize: '12.5px' }}>
                              <td style={{ padding: '12px', color: 'var(--admin-text-sub)', fontWeight: 700 }}>
                                #{idx + 1}
                              </td>

                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                    {isRevealed ? key : `${key.slice(0, 5)}••••••••••••${key.slice(-4)}`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setRevealedKeys(prev => ({ ...prev, [key]: !prev[key] }))}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-sub)', cursor: 'pointer', fontSize: '11px' }}
                                    title={isRevealed ? 'Mask key' : 'Reveal key'}
                                  >
                                    {isRevealed ? '👁️‍🗨️' : '👁️'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(key);
                                      alert('API key copied to clipboard!');
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-sub)', cursor: 'pointer', fontSize: '11px' }}
                                    title="Copy key"
                                  >
                                    📋
                                  </button>
                                </div>
                              </td>

                              <td style={{ padding: '12px' }}>
                                {isChecking ? (
                                  <span style={{ fontSize: '12px', color: '#06b6d4', fontWeight: 700 }}>Checking balance...</span>
                                ) : bInfo ? (
                                  <div>
                                    <div style={{
                                      fontSize: '13px',
                                      fontWeight: 800,
                                      color: bInfo.balance > 0 ? '#10b981' : (bInfo.status === 'active' ? '#10b981' : '#ef4444')
                                    }}>
                                      {bInfo.balanceFormatted}
                                    </div>
                                    {bInfo.details && (
                                      <div style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)' }}>
                                        {bInfo.details}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>Not checked yet</span>
                                )}
                              </td>

                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '5px',
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  background: `${statusColor}22`,
                                  color: statusColor,
                                  border: `1px solid ${statusColor}44`
                                }}>
                                  {statusLabel}
                                </span>
                              </td>

                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    disabled={isChecking}
                                    onClick={() => handleCheckKeyBalance(selectedBalanceProvider, key)}
                                    className="admin-btn admin-btn-sm"
                                    style={{ fontSize: '11px', padding: '4px 8px' }}
                                  >
                                    {isChecking ? '...' : '⚡ Check'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteKeyFromProvider(selectedBalanceProvider, key)}
                                    className="admin-btn admin-btn-sm admin-btn-danger"
                                    style={{ fontSize: '11px', padding: '4px 8px' }}
                                    title="Delete this key"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 3: VISION MODELS & GRANULAR CREDITS MATRIX
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'models' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls Bar */}
          <div className="admin-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search vision models..."
                  value={modelSearch}
                  onChange={e => setModelSearch(e.target.value)}
                  className="admin-input"
                  style={{ width: '220px', fontSize: '12.5px' }}
                />

                <select
                  value={modelTypeFilter}
                  onChange={e => setModelTypeFilter(e.target.value)}
                  className="admin-input"
                  style={{ width: '180px', fontSize: '12.5px' }}
                >
                  <option value="all">All Types ({models.length})</option>
                  <option value="text-to-image">Text-to-Image Only</option>
                  <option value="image-to-image">Image-to-Image Only</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="admin-btn admin-btn-primary"
                style={{ fontWeight: 800 }}
              >
                ➕ Add New Vision Model
              </button>
            </div>
          </div>

          {/* Models Grid */}
          <div className="admin-grid admin-grid-2" style={{ gap: '16px' }}>
            {filteredModels.map(m => {
              const resCredits = m.creditsByResolution || { '1K': 6, '2K': 10, '4K': 16 };

              return (
                <div
                  key={m.id}
                  className="admin-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    border: m.enabled === false ? '1px dashed rgba(239, 68, 68, 0.4)' : '1px solid var(--admin-border-glass)',
                    opacity: m.enabled === false ? 0.65 : 1
                  }}
                >
                  <div>
                    {/* Header: Title, Provider, Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                            {m.name}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '5px',
                            fontSize: '10px',
                            fontWeight: 800,
                            background: m.badgeColor || 'linear-gradient(135deg, #10b981, #06b6d4)',
                            color: '#fff'
                          }}>
                            {m.badge || 'PRO'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontFamily: 'monospace', marginTop: '2px' }}>
                          ID: {m.id} · Provider: <strong style={{ color: '#06b6d4' }}>{m.provider || 'kie.ai'}</strong> · {m.type}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateModelField(m.id, 'enabled', !m.enabled)}
                          className="admin-btn admin-btn-sm"
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            background: m.enabled !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: m.enabled !== false ? '#10b981' : '#ef4444'
                          }}
                        >
                          {m.enabled !== false ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModel(m.id)}
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', lineHeight: 1.4, marginBottom: '12px' }}>
                      {m.description}
                    </div>

                    {/* Showcase Image with Live Preview */}
                    <div style={{ marginBottom: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{
                        width: '72px',
                        height: '46px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: '#000',
                        border: '1px solid var(--admin-border-glass)',
                        flexShrink: 0
                      }}>
                        <img
                          src={m.showcaseImage}
                          alt={m.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                          Showcase Preview Image URL:
                        </label>
                        <input
                          type="text"
                          value={m.showcaseImage || ''}
                          onChange={e => handleUpdateModelField(m.id, 'showcaseImage', e.target.value)}
                          className="admin-input"
                          style={{ fontSize: '11.5px', padding: '5px 8px' }}
                        />
                      </div>
                    </div>

                    {/* Granular Credits Matrix */}
                    <div style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--admin-border-glass)'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#ff4f00', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Credit Cost Per Quality Tier:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>1K Standard</label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={resCredits['1K'] ?? 6}
                            onChange={e => handleUpdateModelCredits(m.id, '1K', e.target.value)}
                            className="admin-input"
                            style={{ fontSize: '12px', padding: '5px 8px', fontWeight: 800 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>2K High-Def</label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={resCredits['2K'] ?? 10}
                            onChange={e => handleUpdateModelCredits(m.id, '2K', e.target.value)}
                            className="admin-input"
                            style={{ fontSize: '12px', padding: '5px 8px', fontWeight: 800 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>4K Ultra</label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={resCredits['4K'] ?? 16}
                            onChange={e => handleUpdateModelCredits(m.id, '4K', e.target.value)}
                            className="admin-input"
                            style={{ fontSize: '12px', padding: '5px 8px', fontWeight: 800 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 4: SYSTEM PROMPT & RULES
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'system_prompt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
                  System Prompt Override & Pre-Conditioning
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
                  <strong>Important Rule Enforced:</strong> By default, this is disabled so user prompts are never overridden or polluted.
                  When enabled, this system prompt will be prepended to the user prompt.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: systemPromptEnabled ? '#10b981' : 'var(--admin-text-sub)' }}>
                  {systemPromptEnabled ? 'OVERRIDE ACTIVE' : 'NO OVERRIDE (DISABLED)'}
                </span>
                <input
                  type="checkbox"
                  checked={systemPromptEnabled}
                  onChange={e => setSystemPromptEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ff4f00' }}
                />
              </div>
            </div>

            <textarea
              rows={5}
              placeholder="Enter optional system prompt to prepend when enabled..."
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="admin-input"
              style={{ width: '100%', fontSize: '13px', lineHeight: 1.5, fontFamily: 'monospace' }}
            />
          </div>

          <div className="admin-card">
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
              Global Negative Prompt
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: '0 0 12px 0' }}>
              Elements and artifacts to systematically exclude from image generation.
            </p>
            <input
              type="text"
              value={negativePrompt}
              onChange={e => setNegativePrompt(e.target.value)}
              className="admin-input"
              style={{ width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 5: VIRAL CREATOR PRESETS
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'presets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--admin-text-main)' }}>
                  1-Click Viral Presets ({presets.length})
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: 0 }}>
                  Manage the 1-click thumbnail archetypes and prompt templates displayed on the frontend.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddPresetModal(true)}
                className="admin-btn admin-btn-primary"
                style={{ fontWeight: 800 }}
              >
                ➕ Add New Preset
              </button>
            </div>
          </div>

          <div className="admin-grid admin-grid-2" style={{ gap: '14px' }}>
            {presets.map(p => (
              <div
                key={p.id}
                className="admin-card"
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{p.emoji || '🔥'}</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--admin-text-main)' }}>{p.label}</span>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 79, 0, 0.2)', color: '#ff4f00', fontWeight: 800 }}>
                      {p.aspectRatio || '16:9'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePreset(p.id)}
                    className="admin-btn admin-btn-sm admin-btn-danger"
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                  >
                    🗑️
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                    Preset Label:
                  </label>
                  <input
                    type="text"
                    value={p.label}
                    onChange={e => handleUpdatePreset(p.id, 'label', e.target.value)}
                    className="admin-input"
                    style={{ fontSize: '12px', padding: '5px 8px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '2px' }}>
                    Preset Prompt Template:
                  </label>
                  <textarea
                    rows={3}
                    value={p.prompt}
                    onChange={e => handleUpdatePreset(p.id, 'prompt', e.target.value)}
                    className="admin-input"
                    style={{ fontSize: '11.5px', lineHeight: 1.4 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 6: LIVE DIAGNOSTICS & REAL TEST
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'diagnostics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-card">
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
              100% Real Live Generation Test
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: '0 0 16px 0' }}>
              Execute an end-to-end generation test against the real backend engine to verify keys, provider routing, and polling.
            </p>

            <form onSubmit={handleRunRealTest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Provider Target:
                  </label>
                  <select
                    value={testProvider}
                    onChange={e => setTestProvider(e.target.value)}
                    className="admin-input"
                    style={{ fontSize: '12.5px' }}
                  >
                    {providersList.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Model:
                  </label>
                  <select
                    value={testModel}
                    onChange={e => setTestModel(e.target.value)}
                    className="admin-input"
                    style={{ fontSize: '12.5px' }}
                  >
                    {models.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
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
                    className="admin-input"
                    style={{ fontSize: '12.5px' }}
                  >
                    <option value="16:9">16:9 Widescreen (YouTube)</option>
                    <option value="9:16">9:16 Portrait (Shorts)</option>
                    <option value="1:1">1:1 Square</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Quality Tier:
                  </label>
                  <select
                    value={testRes}
                    onChange={e => setTestRes(e.target.value)}
                    className="admin-input"
                    style={{ fontSize: '12.5px' }}
                  >
                    <option value="1K">1K Standard</option>
                    <option value="2K">2K High-Def</option>
                    <option value="4K">4K Ultra</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Test Prompt:
                </label>
                <textarea
                  rows={3}
                  value={testPrompt}
                  onChange={e => setTestPrompt(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '12.5px', lineHeight: 1.4 }}
                />
              </div>

              <button
                type="submit"
                disabled={testing}
                className="admin-btn admin-btn-primary"
                style={{
                  alignSelf: 'flex-start',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #ff4f00, #ff7700)'
                }}
              >
                {testing ? 'Executing Real Generation Test...' : '⚡ Run Real Test Generation'}
              </button>
            </form>

            {testError && (
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '13px' }}>
                <strong>Test Error:</strong> {testError}
              </div>
            )}

            {testResult && (
              <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>
                  ✓ Real Generation Succeeded! (Duration: {testResult.durationMs}ms)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', marginBottom: '10px' }}>
                  Provider: <strong>{testResult.provider}</strong> · Task ID: <code>{testResult.taskId}</code>
                </div>
                <div style={{ maxWidth: '420px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border-glass)' }}>
                  <img src={testResult.imageUrl} alt="Test Result" style={{ width: '100%', display: 'block' }} />
                </div>
                <div style={{ marginTop: '10px' }}>
                  <a
                    href={testResult.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: '#ff4f00', fontWeight: 700 }}
                  >
                    Open Image in New Window ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: ADD CUSTOM SERVICE PROVIDER ───────────────────────── */}
      {showAddProviderModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '520px', background: 'var(--admin-bg-card)', border: '1px solid var(--admin-border-glass)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--admin-text-main)' }}>
              ➕ Add Custom Image Service Provider
            </h3>

            <form onSubmit={handleAddCustomProvider} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Provider ID (slug, e.g. ideogram, leonardo):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ideogram"
                  value={newProviderForm.id}
                  onChange={e => setNewProviderForm({ ...newProviderForm, id: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Display Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ideogram AI"
                  value={newProviderForm.name}
                  onChange={e => setNewProviderForm({ ...newProviderForm, name: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  API Base URL:
                </label>
                <input
                  type="text"
                  placeholder="https://api.ideogram.ai/v1"
                  value={newProviderForm.baseUrl}
                  onChange={e => setNewProviderForm({ ...newProviderForm, baseUrl: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Icon Emoji:
                </label>
                <input
                  type="text"
                  placeholder="🎨"
                  value={newProviderForm.icon}
                  onChange={e => setNewProviderForm({ ...newProviderForm, icon: e.target.value })}
                  className="admin-input"
                  style={{ width: '80px', fontSize: '16px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddProviderModal(false)}
                  className="admin-btn admin-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{ fontWeight: 800 }}
                >
                  Save Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD API KEYS IN BULK ──────────────────────────────── */}
      {showAddKeyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '540px', background: 'var(--admin-bg-card)', border: '1px solid var(--admin-border-glass)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--admin-text-main)' }}>
              ➕ Add API Keys to {selectedBalanceProvider}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '0 0 12px 0' }}>
              Paste one or multiple API keys (one per line or comma-separated). They will be added to the rotating pool.
            </p>

            <textarea
              rows={6}
              placeholder="Paste API keys here...&#10;key1&#10;key2&#10;key3"
              value={addKeyInput}
              onChange={e => setAddKeyInput(e.target.value)}
              className="admin-input"
              style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddKeyModal(false);
                  setAddKeyInput('');
                }}
                className="admin-btn admin-btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAddKeysToSelectedProvider(selectedBalanceProvider)}
                className="admin-btn admin-btn-primary"
                style={{ fontWeight: 800 }}
              >
                Add Keys to Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD NEW VISION MODEL ──────────────────────────────── */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--admin-text-main)' }}>
              ➕ Add New Vision Model
            </h3>

            <form onSubmit={handleAddModel} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Model ID (Unique identifier, e.g. flux-pro):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. flux-pro"
                  value={newModel.id}
                  onChange={e => setNewModel({ ...newModel, id: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Model Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLUX Pro 1.1"
                  value={newModel.name}
                  onChange={e => setNewModel({ ...newModel, name: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Provider:
                  </label>
                  <select
                    value={newModel.provider}
                    onChange={e => setNewModel({ ...newModel, provider: e.target.value })}
                    className="admin-input"
                    style={{ fontSize: '12.5px' }}
                  >
                    {providersList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Type:
                  </label>
                  <select
                    value={newModel.type}
                    onChange={e => setNewModel({ ...newModel, type: e.target.value })}
                    className="admin-input"
                    style={{ fontSize: '12.5px' }}
                  >
                    <option value="text-to-image">Text-to-Image</option>
                    <option value="image-to-image">Image-to-Image</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Credit Cost Matrix (1K / 2K / 4K):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="1K Credits"
                    value={newModel.creditsByResolution['1K']}
                    onChange={e => setNewModel({
                      ...newModel,
                      creditsByResolution: { ...newModel.creditsByResolution, '1K': Number(e.target.value) }
                    })}
                    className="admin-input"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="2K Credits"
                    value={newModel.creditsByResolution['2K']}
                    onChange={e => setNewModel({
                      ...newModel,
                      creditsByResolution: { ...newModel.creditsByResolution, '2K': Number(e.target.value) }
                    })}
                    className="admin-input"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="4K Credits"
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
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Description:
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description of this model..."
                  value={newModel.description}
                  onChange={e => setNewModel({ ...newModel, description: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Showcase Image URL:
                </label>
                <input
                  type="text"
                  placeholder="https://... or /showcases/..."
                  value={newModel.showcaseImage}
                  onChange={e => setNewModel({ ...newModel, showcaseImage: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="admin-btn admin-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{ fontWeight: 800 }}
                >
                  Save Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD NEW VIRAL PRESET ──────────────────────────────── */}
      {showAddPresetModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '520px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--admin-text-main)' }}>
              ➕ Add 1-Click Viral Preset
            </h3>

            <form onSubmit={handleAddPreset} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Preset ID (e.g. podcast-interview):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. podcast-interview"
                  value={newPreset.id}
                  onChange={e => setNewPreset({ ...newPreset, id: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Emoji:
                  </label>
                  <input
                    type="text"
                    value={newPreset.emoji}
                    onChange={e => setNewPreset({ ...newPreset, emoji: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Label Title:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Joe Rogan Studio Setup"
                    value={newPreset.label}
                    onChange={e => setNewPreset({ ...newPreset, label: e.target.value })}
                    className="admin-input"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Default Aspect Ratio:
                  </label>
                  <select
                    value={newPreset.aspectRatio}
                    onChange={e => setNewPreset({ ...newPreset, aspectRatio: e.target.value })}
                    className="admin-input"
                    style={{ fontSize: '12.5px' }}
                  >
                    <option value="16:9">16:9 Widescreen</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="4:3">4:3 Standard</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                    Default Model:
                  </label>
                  <select
                    value={newPreset.modelId}
                    onChange={e => setNewPreset({ ...newPreset, modelId: e.target.value })}
                    className="admin-input"
                    style={{ fontSize: '12.5px' }}
                  >
                    {models.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', display: 'block', marginBottom: '4px' }}>
                  Prompt Template:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter full prompt template..."
                  value={newPreset.prompt}
                  onChange={e => setNewPreset({ ...newPreset, prompt: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', fontSize: '12px', lineHeight: 1.4 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddPresetModal(false)}
                  className="admin-btn admin-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{ fontWeight: 800 }}
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
