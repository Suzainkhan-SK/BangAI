import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../adminService';

const getProviderDefaults = (prov) => {
  switch (prov) {
    case 'json2video': return { balance: 600, max: 600, unit: 'mins' };
    case 'modal': return { balance: 30, max: 30, unit: 'USD' };
    case 'elevenlabs': return { balance: 84000, max: 100000, unit: 'chars' };
    case 'azure_speech': return { balance: 500000, max: 500000, unit: 'chars' };
    case 'siliconflow': return { balance: 2000, max: 2000, unit: 'credits' };
    case 'gemini': return { balance: 1500, max: 1500, unit: 'RPM' };
    case 'openai': return { balance: 100, max: 100, unit: 'models' };
    case 'deepseek': return { balance: 50, max: 50, unit: 'USD' };
    case 'groq': return { balance: 3000, max: 3000, unit: 'RPM' };
    case 'pexels': return { balance: 200, max: 200, unit: 'req/hr' };
    case 'pixabay': return { balance: 5000, max: 5000, unit: 'req/hr' };
    case 'thumbnail': return { balance: 500, max: 500, unit: 'renders' };
    case 'xkiro': return { balance: 1000000, max: 1000000, unit: 'tokens' };
    default: return { balance: 1000, max: 1000, unit: 'units' };
  }
};

// MASTER DOMAINS: Clear separation between Stock Studio (Bang API Credits Engine) and Chat Mode
const MASTER_DOMAINS = [
  {
    id: 'stock_studio',
    name: 'Stock Studio API Services',
    badge: 'BANG API CREDITS ENGINE',
    icon: '🎬',
    description: 'Controls the system-managed API pools for Bang AI Stock Studio (MoneyPrinterTurbo on Modal GPU clusters). When users toggle "Bang API Credits", their personal BYOK keys are bypassed and these system pools run the automation.',
    categories: [
      {
        id: 'compute',
        name: 'Cloud Compute & Render',
        icon: '⚡',
        providers: ['modal', 'json2video']
      },
      {
        id: 'footage',
        name: 'Stock Footage Media',
        icon: '🎥',
        providers: ['pexels', 'pixabay']
      },
      {
        id: 'llm',
        name: 'Scriptwriting LLMs',
        icon: '🧠',
        providers: ['gemini', 'openai', 'deepseek', 'groq']
      },
      {
        id: 'voice',
        name: 'Voiceover & TTS APIs',
        icon: '🎙️',
        providers: ['elevenlabs', 'azure_speech', 'siliconflow']
      },
      {
        id: 'thumbnail',
        name: 'Thumbnail Studio',
        icon: '🖼️',
        providers: ['thumbnail']
      }
    ]
  },
  {
    id: 'chat_mode',
    name: 'BangAI Chat Mode API Services',
    badge: 'STRATEGY BRAIN & AGENT',
    icon: '💬',
    description: 'Powers Bang AI Web Chat, Agent Strategy, and Multi-Model conversational intelligence.',
    categories: [
      {
        id: 'strategy_brain',
        name: 'Strategy Brain & Chat Engine',
        icon: '🔮',
        providers: ['xkiro']
      }
    ]
  }
];

const PROVIDER_METADATA = {
  modal: {
    name: 'Modal Cloud Compute Cluster',
    role: 'Serverless GPU rendering engine (20 parallel workers, dual workspace failover)',
    domain: 'stock_studio',
    category: 'compute',
    icon: '☁️'
  },
  json2video: {
    name: 'JSON2Video Cloud Render',
    role: 'Video rendering & ElevenLabs voiceover pipeline (>60s audio splitting)',
    domain: 'stock_studio',
    category: 'compute',
    icon: '⚡'
  },
  pexels: {
    name: 'Pexels HD Vertical Video API',
    role: 'HD vertical stock video clips matching script keywords',
    domain: 'stock_studio',
    category: 'footage',
    icon: '📹'
  },
  pixabay: {
    name: 'Pixabay Stock Media API',
    role: 'Secondary stock footage and sound effect library',
    domain: 'stock_studio',
    category: 'footage',
    icon: '🎞️'
  },
  gemini: {
    name: 'Google Gemini 2.5 Flash / Pro',
    role: 'Primary viral script generation & video storyboard reasoning',
    domain: 'stock_studio',
    category: 'llm',
    icon: '✨'
  },
  openai: {
    name: 'OpenAI GPT-4o / GPT-4o-Mini',
    role: 'Fallback high-precision video scripting engine',
    domain: 'stock_studio',
    category: 'llm',
    icon: '🟢'
  },
  deepseek: {
    name: 'DeepSeek V3 / R1 Reasoner',
    role: 'Deep-logic viral hook creation & scenario generation',
    domain: 'stock_studio',
    category: 'llm',
    icon: '🐋'
  },
  groq: {
    name: 'Groq LPU Ultra-Fast LLM API',
    role: 'Sub-second real-time scriptwriting via LPU hardware',
    domain: 'stock_studio',
    category: 'llm',
    icon: '⚡'
  },
  elevenlabs: {
    name: 'ElevenLabs Studio Voice API',
    role: 'Ultra-realistic AI voice synthesis with 9,600+ voices',
    domain: 'stock_studio',
    category: 'voice',
    icon: '🎙️'
  },
  azure_speech: {
    name: 'Azure Cognitive Speech S0',
    role: 'Neural multilingual text-to-speech engine',
    domain: 'stock_studio',
    category: 'voice',
    icon: '🔊'
  },
  siliconflow: {
    name: 'SiliconFlow Cloud Audio & Speech',
    role: 'High-throughput open audio model synthesis',
    domain: 'stock_studio',
    category: 'voice',
    icon: '🌊'
  },
  thumbnail: {
    name: 'Kie.ai Image & Thumbnail Studio',
    role: 'High-CTR YouTube Shorts / Reels cover thumbnail engine',
    domain: 'stock_studio',
    category: 'thumbnail',
    icon: '🖼️'
  },
  xkiro: {
    name: 'xKiro AI Strategy Brain',
    role: 'Powers BangAI Web Chat Mode, conversational reasoning & knowledge retrieval',
    domain: 'chat_mode',
    category: 'strategy_brain',
    icon: '🔮'
  }
};

const LLM_MODEL_OPTIONS = {
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended: Ultra-Fast & High Retention)' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Deep Reasoning & Complex Storyboards)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Fast Multimodal)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Standard Production Flash)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (1M Long Context)' }
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o (Recommended: Omni Model)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Ultra Fast & Low Latency)' },
    { value: 'o1-mini', label: 'o1-mini (Reasoning Engine)' },
    { value: 'o3-mini', label: 'o3-mini (Advanced Reasoning)' }
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek-V3 Chat (Recommended: High-Speed)' },
    { value: 'deepseek-reasoner', label: 'DeepSeek-R1 Reasoner (Deep Logic)' }
  ],
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (Recommended: LPU Ultra-Fast)' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Sub-Second Latency)' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (High-Throughput MoE)' }
  ]
};

function formatTimeAgo(isoStr) {
  if (!isoStr) return 'Not probed yet';
  const diffSec = Math.floor((new Date() - new Date(isoStr)) / 1000);
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(isoStr).toLocaleDateString();
}

export default function KeyVaultView() {
  // Master Domain: 'stock_studio' | 'chat_mode'
  const [activeDomain, setActiveDomain] = useState('stock_studio');
  // Category within active domain: 'all' or category ID
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  // Currently selected provider
  const [provider, setProvider] = useState('modal');

  const [keysData, setKeysData] = useState({
    modal: [],
    json2video: [],
    gemini: [],
    openai: [],
    deepseek: [],
    groq: [],
    pexels: [],
    pixabay: [],
    azure_speech: [],
    elevenlabs: [],
    siliconflow: [],
    thumbnail: [],
    xkiro: []
  });

  const [llmModels, setLlmModels] = useState({
    gemini: 'gemini-2.5-flash',
    openai: 'gpt-4o',
    deepseek: 'deepseek-chat',
    groq: 'llama-3.3-70b-versatile'
  });

  const [savingModel, setSavingModel] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);

  const [loading, setLoading] = useState(true);
  const [probingAll, setProbingAll] = useState(false);
  const [probingKeyIndex, setProbingKeyIndex] = useState(null);
  const [syncingNetlify, setSyncingNetlify] = useState(false);
  const [syncingModal, setSyncingModal] = useState(false);

  // Key form states
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // UI interaction states
  const [visibleKeyIndices, setVisibleKeyIndices] = useState(new Set());
  const [copiedKeyIndex, setCopiedKeyIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await adminService.getKeys();
      if (res && res.success) {
        if (res.data) {
          setKeysData(prev => ({
            ...prev,
            ...res.data
          }));
        }
        if (res.models) {
          setLlmModels(res.models);
        }
      }
    } catch (e) {
      console.warn('Error loading keys from Atlas:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  // When changing domain, adjust default provider
  const handleDomainChange = (domainId) => {
    setActiveDomain(domainId);
    setActiveCategoryFilter('all');
    if (domainId === 'stock_studio') {
      setProvider('modal');
    } else {
      setProvider('xkiro');
    }
    setSearchQuery('');
  };

  const handleAddKey = async (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    const currentList = keysData[provider] || [];
    const defaults = getProviderDefaults(provider);
    const item = {
      key: newKey.trim(),
      label: newLabel.trim() || `${provider.toUpperCase()} Key #${currentList.length + 1}`,
      balance: defaults.balance,
      max: defaults.max,
      status: 'active',
      unit: defaults.unit,
      details: 'Added to vault',
      lastProbed: new Date().toISOString()
    };

    const updated = [item, ...currentList];
    setKeysData(prev => ({ ...prev, [provider]: updated }));
    setNewKey('');
    setNewLabel('');

    try {
      await adminService.saveKeys(provider, updated);
      setToastMsg(`✅ Key added to ${provider.toUpperCase()} vault & synchronized to MongoDB Atlas!`);
      setTimeout(() => setToastMsg(''), 4000);
      handleProbeSingleKey(0, item.key);
    } catch (e) {
      setToastMsg(`Key saved locally (${e.message})`);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const currentList = keysData[provider] || [];
    const existingKeyStrings = new Set(currentList.map(k => typeof k === 'string' ? k : k.key));
    const defaults = getProviderDefaults(provider);

    const newItems = [];
    lines.forEach((kStr) => {
      if (!existingKeyStrings.has(kStr)) {
        newItems.push({
          key: kStr,
          label: `${provider.toUpperCase()} Pool #${currentList.length + newItems.length + 1}`,
          balance: defaults.balance,
          max: defaults.max,
          status: 'active',
          unit: defaults.unit,
          details: 'Imported via bulk vault',
          lastProbed: new Date().toISOString()
        });
        existingKeyStrings.add(kStr);
      }
    });

    const updated = [...newItems, ...currentList];
    setKeysData(prev => ({ ...prev, [provider]: updated }));
    setBulkText('');
    setShowBulkModal(false);

    try {
      await adminService.saveKeys(provider, updated);
      setToastMsg(`✅ ${newItems.length} keys bulk added and synchronized to MongoDB Atlas!`);
    } catch (e) {
      setToastMsg(`Bulk keys saved locally (${e.message})`);
    } finally {
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const handleDeleteKey = async (idx) => {
    const currentList = keysData[provider] || [];
    const keyToDelete = currentList[idx];
    const keyLabel = (typeof keyToDelete === 'object' ? keyToDelete.label : keyToDelete) || 'Key';
    const confirmed = window.confirm(`Remove key "${keyLabel}" from ${provider.toUpperCase()} vault?`);
    if (!confirmed) return;

    const updated = currentList.filter((_, i) => i !== idx);
    setKeysData(prev => ({ ...prev, [provider]: updated }));

    try {
      await adminService.saveKeys(provider, updated);
      setToastMsg(`Key removed from ${provider.toUpperCase()} and Atlas pool updated.`);
      setTimeout(() => setToastMsg(''), 3000);
    } catch (e) {}
  };

  const handleMoveKey = async (idx, direction) => {
    const currentList = [...(keysData[provider] || [])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;

    const temp = currentList[idx];
    currentList[idx] = currentList[targetIdx];
    currentList[targetIdx] = temp;

    setKeysData(prev => ({ ...prev, [provider]: currentList }));
    try {
      await adminService.saveKeys(provider, currentList);
      setToastMsg('Priority failover order updated in Atlas!');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (e) {}
  };

  // Real-Time Live Probe Single Key
  const handleProbeSingleKey = async (idx, keyString) => {
    setProbingKeyIndex(idx);
    try {
      const res = await adminService.probeKeyBalance(provider, keyString, false);
      if (res && res.success && res.keyData) {
        const probed = res.keyData;
        setKeysData(prev => {
          const list = [...(prev[provider] || [])];
          if (list[idx]) {
            const original = list[idx];
            list[idx] = {
              ...(typeof original === 'object' ? original : { key: original, label: original }),
              balance: probed.balance,
              max: probed.max,
              unit: probed.unit,
              status: probed.status,
              details: probed.details,
              lastProbed: probed.lastProbed
            };
          }
          return { ...prev, [provider]: list };
        });
        setToastMsg(`🔍 Real-time balance updated for ${provider.toUpperCase()} key #${idx + 1}!`);
      } else {
        setToastMsg(`⚠️ Probe notice: ${res?.error || 'Check failed'}`);
      }
    } catch (e) {
      setToastMsg(`Probe error: ${e.message}`);
    } finally {
      setProbingKeyIndex(null);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  // Real-Time Live Probe ALL Keys in Provider
  const handleProbeAll = async () => {
    setProbingAll(true);
    setToastMsg(`⚡ Querying real-time provider APIs for all ${provider.toUpperCase()} keys in parallel...`);
    try {
      const res = await adminService.probeKeyBalance(provider, null, true);
      if (res && res.success && res.keys) {
        setKeysData(prev => ({
          ...prev,
          [provider]: res.keys
        }));
        setToastMsg(`✅ All ${res.keys.length} ${provider.toUpperCase()} keys live probed & balances updated in Atlas!`);
      } else {
        setToastMsg(`Probe completed.`);
      }
    } catch (e) {
      setToastMsg(`Probe error (${e.message})`);
    } finally {
      setProbingAll(false);
      setTimeout(() => setToastMsg(''), 5000);
    }
  };

  const handleSyncModalClusters = async () => {
    setSyncingModal(true);
    setToastMsg('Synchronizing all system API key pools to Modal Cloud Clusters (cmpunktg & cmpunktg1)...');
    try {
      const res = await adminService.syncKeysToModal();
      if (res && res.success) {
        setToastMsg('✅ All system API keys successfully pushed to Modal Cloud & persistent storage volume (/root/storage/system_api_keys.json)!');
      } else {
        setToastMsg(`⚠️ Notice: ${res?.message || res?.error || 'Failed'}`);
      }
    } catch (e) {
      setToastMsg(`⚠️ Modal Sync Error: ${e.message}`);
    } finally {
      setSyncingModal(false);
      setTimeout(() => setToastMsg(''), 5000);
    }
  };

  const handleSyncNetlifyEnv = async () => {
    setSyncingNetlify(true);
    setToastMsg('Synchronizing primary keys to Netlify environment variables via REST API...');
    try {
      const res = await adminService.syncKeysNetlify();
      if (res && res.success) {
        setToastMsg('✅ Primary API keys successfully synchronized with Netlify production runtime!');
      } else {
        setToastMsg(`⚠️ Notice: ${res?.message || 'Sync complete'}`);
      }
    } catch (e) {
      setToastMsg(`⚠️ Sync Error: ${e.message}`);
    } finally {
      setSyncingNetlify(false);
      setTimeout(() => setToastMsg(''), 4500);
    }
  };

  const handleSaveModel = async (selectedModel) => {
    const modelToSave = (selectedModel || (isCustomModel ? customModelInput : llmModels[provider]) || '').trim();
    if (!modelToSave) return;
    setSavingModel(true);
    try {
      const res = await adminService.saveLlmModel(provider, modelToSave);
      if (res && res.success) {
        setLlmModels(prev => ({ ...prev, [provider]: modelToSave }));
        setToastMsg(`✅ ${provider.toUpperCase()} active model set to '${modelToSave}' & synced to Modal clusters!`);
      } else {
        setToastMsg(`❌ Failed to save model: ${res?.error || 'Unknown error'}`);
      }
    } catch (err) {
      setToastMsg(`❌ Error: ${err.message}`);
    } finally {
      setSavingModel(false);
      setTimeout(() => setToastMsg(''), 4500);
    }
  };

  const toggleKeyVisibility = (idx) => {
    setVisibleKeyIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleCopyKey = (idx, rawKey) => {
    if (!rawKey) return;
    navigator.clipboard?.writeText(rawKey);
    setCopiedKeyIndex(idx);
    setTimeout(() => setCopiedKeyIndex(null), 2000);
  };

  const currentDomainObj = MASTER_DOMAINS.find(d => d.id === activeDomain) || MASTER_DOMAINS[0];

  // Available providers for current active domain & category filter
  const availableProviders = useMemo(() => {
    if (activeCategoryFilter === 'all') {
      const list = [];
      currentDomainObj.categories.forEach(cat => {
        cat.providers.forEach(p => {
          if (!list.includes(p)) list.push(p);
        });
      });
      return list;
    }
    const cat = currentDomainObj.categories.find(c => c.id === activeCategoryFilter);
    return cat ? cat.providers : [];
  }, [currentDomainObj, activeCategoryFilter]);

  const currentKeys = keysData[provider] || [];

  // Filtered keys
  const filteredKeys = useMemo(() => {
    return currentKeys.map((k, idx) => ({ data: k, originalIndex: idx })).filter(({ data }) => {
      const rawKey = typeof data === 'string' ? data : data.key || '';
      const label = typeof data === 'object' ? data.label || '' : '';
      const status = typeof data === 'object' ? data.status || 'active' : 'active';

      if (filterStatus === 'active' && status !== 'active') return false;
      if (filterStatus === 'exhausted' && status === 'active') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return rawKey.toLowerCase().includes(q) || label.toLowerCase().includes(q);
    });
  }, [currentKeys, filterStatus, searchQuery]);

  // Aggregate Key Statistics
  const stockStudioTotalKeys = useMemo(() => {
    const stockStudioProviders = ['modal', 'json2video', 'gemini', 'openai', 'deepseek', 'groq', 'pexels', 'pixabay', 'elevenlabs', 'azure_speech', 'siliconflow', 'thumbnail'];
    return stockStudioProviders.reduce((sum, p) => sum + (keysData[p]?.length || 0), 0);
  }, [keysData]);

  const chatModeTotalKeys = useMemo(() => {
    return keysData.xkiro?.length || 0;
  }, [keysData]);

  const currentMeta = PROVIDER_METADATA[provider] || {
    name: provider.toUpperCase(),
    role: 'API Provider',
    icon: '🔑'
  };

  const isLlmProvider = ['gemini', 'openai', 'deepseek', 'groq'].includes(provider);

  return (
    <div className="admin-view-container" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* View Header */}
      <div className="admin-view-header" style={{ marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '26px' }}>🔐</span>
            <h1 className="admin-view-title" style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>
              Dynamic Multi-Provider Key Vault
            </h1>
            <span className="admin-badge admin-badge-cyan" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              REAL-TIME BALANCES
            </span>
          </div>
          <p className="admin-view-desc" style={{ marginTop: '6px' }}>
            Centralized credential vault for Bang AI's public web applications. Powers zero-downtime key rotation, automated failover, live balance probing, and powers the <strong>Bang API Credits Engine</strong> (bypassing user BYOK keys in Stock Studio).
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowBulkModal(!showBulkModal)}
            className="admin-btn admin-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <span>📋</span> Bulk Add Keys
          </button>
          <button
            type="button"
            onClick={handleSyncModalClusters}
            disabled={syncingModal}
            className="admin-btn admin-btn-primary"
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <span>{syncingModal ? '⏳' : '🚀'}</span>
            {syncingModal ? 'Syncing to Modal...' : 'Sync Keys to Modal Cloud'}
          </button>
          <button
            type="button"
            onClick={handleSyncNetlifyEnv}
            disabled={syncingNetlify}
            className="admin-btn admin-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>{syncingNetlify ? '⏳' : '☁️'}</span>
            {syncingNetlify ? 'Syncing...' : 'Sync to Netlify Env'}
          </button>
          <button
            type="button"
            onClick={handleProbeAll}
            disabled={probingAll || currentKeys.length === 0}
            className="admin-btn admin-btn-secondary"
            style={{
              borderColor: 'var(--admin-accent-cyan)',
              color: 'var(--admin-accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <span style={{ animation: probingAll ? 'spin 1s linear infinite' : 'none' }}>⚡</span>
            {probingAll ? 'Probing Live Balances...' : '⚡ Probe All Balances Live'}
          </button>
        </div>
      </div>

      {/* MASTER ARCHITECTURAL BANNER: Bang API Credits Explanation */}
      <div className="admin-card" style={{
        marginBottom: '20px',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
        border: '1.5px solid var(--admin-accent-cyan)',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px' }}>⚡</span>
              <strong style={{ fontSize: '14px', color: 'var(--admin-text-main)', letterSpacing: '0.3px' }}>
                Bang API Credits Engine & BYOK Management
              </strong>
              <span className="admin-badge admin-badge-cyan" style={{ fontSize: '10px' }}>
                ACTIVE IN PRODUCTION
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: 0, lineHeight: 1.5 }}>
              In <strong>Bang AI Stock Studio</strong>, users can choose between <em>Bring Your Own Key (BYOK)</em> or <em>Bang API Credits</em>.
              When <strong>Bang API Credits</strong> is enabled, the system automatically bypasses the user's personal keys and executes video rendering, scriptwriting, voiceover, and stock footage retrieval using this centralized vault pool.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--admin-bg-surface)',
              border: '1px solid var(--admin-border-glass)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontWeight: 600 }}>Stock Studio Pool</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--admin-accent-cyan)' }}>
                {stockStudioTotalKeys} Keys Active
              </div>
            </div>

            <div style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--admin-bg-surface)',
              border: '1px solid var(--admin-border-glass)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontWeight: 600 }}>Chat Mode Pool</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--admin-accent-purple)' }}>
                {chatModeTotalKeys} Keys Active
              </div>
            </div>

            <div style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--admin-bg-surface)',
              border: '1px solid var(--admin-border-glass)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', fontWeight: 600 }}>Modal Storage File</div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-accent-green)', fontFamily: 'var(--admin-font-mono)' }}>
                system_api_keys.json
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          color: 'var(--admin-accent-cyan)',
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
        }}>
          <span style={{ fontSize: '16px' }}>⚡</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Bulk Add Keys Modal */}
      {showBulkModal && (
        <div className="admin-card" style={{ border: '2px solid var(--admin-accent-cyan)', marginBottom: '18px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--admin-accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📋</span> Bulk Import API Keys to {provider.toUpperCase()} Pool
            </h3>
            <span className="admin-badge admin-badge-cyan">UNLIMITED KEYS</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '0 0 14px 0' }}>
            Paste one API key per line or comma-separated. The system automatically deduplicates existing keys and registers them in MongoDB Atlas and Modal Cloud rotation.
          </p>
          <form onSubmit={handleBulkAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={5}
              placeholder="v3_prod_key_1&#10;v3_prod_key_2&#10;v3_prod_key_3..."
              className="admin-textarea"
              style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12px', background: 'var(--admin-bg-base)' }}
              required
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
              >
                Save & Register Bulk Keys
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TOP-LEVEL MASTER DOMAIN SELECTOR: Clear Categorization between Stock Studio and Chat Mode */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        {MASTER_DOMAINS.map(domain => {
          const isSelected = activeDomain === domain.id;
          const count = domain.id === 'stock_studio' ? stockStudioTotalKeys : chatModeTotalKeys;
          return (
            <div
              key={domain.id}
              onClick={() => handleDomainChange(domain.id)}
              style={{
                cursor: 'pointer',
                padding: '16px 20px',
                borderRadius: '12px',
                border: isSelected ? '2px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'var(--admin-bg-surface)',
                boxShadow: isSelected ? '0 4px 20px rgba(6, 182, 212, 0.2)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-bg-elevated)',
                  color: isSelected ? '#000' : 'var(--admin-text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0
                }}>
                  {domain.icon}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--admin-text-main)', margin: 0 }}>
                      {domain.name}
                    </h3>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)' }}>
                    {domain.badge}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-text-main)' }}>
                  {count}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--admin-text-sub)' }}>
                  Active Keys
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CATEGORY & SUB-PROVIDER NAVIGATION FOR SELECTED MASTER DOMAIN */}
      <div className="admin-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        {/* Category Filter Pills (when multiple categories exist in domain) */}
        {currentDomainObj.categories.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            paddingBottom: '14px',
            marginBottom: '14px',
            borderBottom: '1px solid var(--admin-border-glass)'
          }}>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: activeCategoryFilter === 'all' ? '1px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                background: activeCategoryFilter === 'all' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                color: activeCategoryFilter === 'all' ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              All Services
            </button>
            {currentDomainObj.categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategoryFilter(cat.id);
                  if (cat.providers.length > 0 && !cat.providers.includes(provider)) {
                    setProvider(cat.providers[0]);
                  }
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: activeCategoryFilter === cat.id ? '1px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                  background: activeCategoryFilter === cat.id ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  color: activeCategoryFilter === cat.id ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Individual Provider Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)', fontWeight: 700, marginRight: '4px' }}>
            Provider:
          </span>
          {availableProviders.map(p => {
            const isSelected = provider === p;
            const meta = PROVIDER_METADATA[p] || {};
            const keyCount = keysData[p]?.length || 0;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'var(--admin-bg-surface)',
                  color: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-text-main)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{meta.icon || '⚡'}</span>
                <span>{p.toUpperCase()}</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-bg-elevated)',
                  color: isSelected ? '#000' : 'var(--admin-text-sub)',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  {keyCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE SERVICE HEADER CARD: Details & Role */}
      <div className="admin-card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{currentMeta.icon}</span>
              <h2 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--admin-text-main)', margin: 0 }}>
                {currentMeta.name}
              </h2>
              <span className="admin-badge admin-badge-cyan" style={{ fontSize: '10.5px' }}>
                {provider.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '4px 0 0 0' }}>
              {currentMeta.role}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)', fontWeight: 600 }}>
              Pool Status:
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 800,
              background: currentKeys.length > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: currentKeys.length > 0 ? '#10b981' : '#ef4444',
              border: `1px solid ${currentKeys.length > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: currentKeys.length > 0 ? '#10b981' : '#ef4444'
              }} />
              {currentKeys.length > 0 ? `${currentKeys.length} ACTIVE POOL KEYS` : 'NO KEYS REGISTERED'}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIVE AI MODEL SELECTION CARD (Only for Scriptwriting LLMs: Gemini, OpenAI, DeepSeek, Groq) */}
      {isLlmProvider && (
        <div className="admin-card" style={{
          padding: '18px 22px',
          marginBottom: '18px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.06), rgba(59, 130, 246, 0.06))',
          border: '1.5px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🤖</span> Active Scriptwriting Model for <span style={{ color: 'var(--admin-accent-cyan)' }}>{provider.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '2px' }}>
                This model is dynamically dispatched to MoneyPrinterTurbo when Stock Studio users generate scripts with Bang API Credits.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '3px 10px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                fontSize: '11.5px',
                fontWeight: 700
              }}>
                Active in Cloud: {llmModels[provider] || 'Default'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '280px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '5px' }}>
                Select AI Model Identifier
              </label>
              <select
                value={
                  (LLM_MODEL_OPTIONS[provider] || []).some(o => o.value === llmModels[provider])
                    ? llmModels[provider]
                    : '__custom__'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__custom__') {
                    setIsCustomModel(true);
                  } else {
                    setIsCustomModel(false);
                    setLlmModels(prev => ({ ...prev, [provider]: val }));
                    handleSaveModel(val);
                  }
                }}
                className="admin-input"
                style={{ fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                {(LLM_MODEL_OPTIONS[provider] || []).map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                <option value="__custom__">⚙️ Custom Model Identifier (Write-In)...</option>
              </select>
            </div>

            {isCustomModel && (
              <div style={{ flex: 1.5, minWidth: '220px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '5px' }}>
                  Custom Model ID
                </label>
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  placeholder={`e.g. ${provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o'}`}
                  className="admin-input"
                  style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12px' }}
                />
              </div>
            )}

            <button
              type="button"
              disabled={savingModel}
              onClick={() => handleSaveModel(isCustomModel ? customModelInput : llmModels[provider])}
              className="admin-btn admin-btn-primary"
              style={{
                height: '42px',
                padding: '0 18px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{savingModel ? '⏳' : '⚡'}</span>
              {savingModel ? 'Deploying...' : 'Save & Deploy Model'}
            </button>
          </div>
        </div>
      )}

      {/* ADD NEW KEY FORM CARD */}
      <div className="admin-card" style={{ padding: '18px 22px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
            Add Key to Target Service: <span style={{ color: 'var(--admin-accent-cyan)' }}>{currentMeta.name}</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
            Failover order triggers automatically upon HTTP 429 quota exhaustion
          </span>
        </div>
        <form onSubmit={handleAddKey} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '260px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '5px' }}>
              Raw {provider.toUpperCase()} API Key / Secret Token
            </label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder={`Paste valid ${provider} API key here...`}
              className="admin-input"
              style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12.5px' }}
              required
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '5px' }}>
              Friendly Name / Cluster Identifier
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Production Pool #1"
              className="admin-input"
              style={{ fontSize: '12.5px' }}
            />
          </div>
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{
              height: '42px',
              padding: '0 20px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #06b6d4, #2563eb)'
            }}
          >
            + Add to Vault Pool
          </button>
        </form>
      </div>

      {/* KEYS CONTROL TOOLBAR: Search & Status Filter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px', maxWidth: '450px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`🔍 Search ${provider.toUpperCase()} keys by label or prefix...`}
            className="admin-input"
            style={{ fontSize: '12px', padding: '8px 14px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)', fontWeight: 600 }}>Filter:</span>
          {['all', 'active', 'exhausted'].map((statusKey) => (
            <button
              key={statusKey}
              type="button"
              onClick={() => setFilterStatus(statusKey)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: filterStatus === statusKey ? '1px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                background: filterStatus === statusKey ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                color: filterStatus === statusKey ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {statusKey}
            </button>
          ))}
        </div>
      </div>

      {/* KEYS POOL LIST CARDS */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: 'var(--admin-text-main)' }}>
              {provider.toUpperCase()} Multi-Key Rotation Pool
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
              Showing {filteredKeys.length} of {currentKeys.length} keys in failover priority order
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="admin-badge admin-badge-success" style={{ fontWeight: 800 }}>
              AUTO-ROTATION ON
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--admin-text-sub)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
            Loading dynamic key vault from MongoDB Atlas...
          </div>
        ) : filteredKeys.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: 'var(--admin-bg-base)',
            borderRadius: '12px',
            border: '1px dashed var(--admin-border-glass)'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--admin-text-main)', marginBottom: '4px' }}>
              No keys found for {provider.toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
              Add a new key using the form above or click <strong>Bulk Add Keys</strong> to populate this service pool.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredKeys.map(({ data: k, originalIndex: idx }) => {
              const rawKey = typeof k === 'string' ? k : k.key || '';
              const label = typeof k === 'object' ? k.label || `${provider} Key #${idx + 1}` : `${provider} Key #${idx + 1}`;
              const isVisible = visibleKeyIndices.has(idx);
              const isCopied = copiedKeyIndex === idx;
              const isProbingThis = probingKeyIndex === idx;

              // Masked vs Unmasked
              const displayKey = isVisible
                ? rawKey
                : (rawKey.length > 14 ? `${rawKey.slice(0, 6)}••••••••${rawKey.slice(-4)}` : rawKey);

              const defaults = getProviderDefaults(provider);
              const balance = k.balance !== undefined ? k.balance : defaults.balance;
              const max = k.max || defaults.max;
              const unit = k.unit || defaults.unit;
              const details = k.details || '';
              const lastProbed = k.lastProbed;
              const status = k.status || 'active';

              // Quota runway percentage
              const pct = max > 0 ? Math.min(100, Math.max(3, (balance / max) * 100)) : 100;
              const isHealthy = status === 'active' && pct > 20;
              const isWarning = status === 'rate_limited' || (status === 'active' && pct <= 20);

              const meterColor = isHealthy
                ? 'linear-gradient(90deg, #06b6d4, #10b981)'
                : isWarning
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #ef4444, #b91c1c)';

              return (
                <div
                  key={idx}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: 'var(--admin-bg-elevated)',
                    border: idx === 0
                      ? '1.5px solid var(--admin-accent-cyan)'
                      : '1px solid var(--admin-border-glass)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    boxShadow: idx === 0 ? '0 4px 20px rgba(6, 182, 212, 0.15)' : 'none'
                  }}
                >
                  {/* Top Row: Priority Badge, Label, Raw Key, Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    {/* Left: Priority Badge & Label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: idx === 0 ? 'var(--admin-accent-cyan)' : 'var(--admin-bg-surface)',
                        color: idx === 0 ? '#000' : 'var(--admin-text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 900,
                        border: '1px solid var(--admin-border-glass)'
                      }}>
                        #{idx + 1}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                            {label}
                          </span>
                          {idx === 0 ? (
                            <span className="admin-badge admin-badge-cyan" style={{ fontSize: '10px', padding: '2px 8px' }}>
                              ★ PRIMARY ACTIVE
                            </span>
                          ) : (
                            <span className="admin-badge admin-badge-secondary" style={{ fontSize: '10px', padding: '2px 8px' }}>
                              FAILOVER #{idx}
                            </span>
                          )}

                          {/* Live Status Pill */}
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: isHealthy ? 'rgba(16, 185, 129, 0.15)' : isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isHealthy ? '#10b981' : isWarning ? '#f59e0b' : '#ef4444',
                            border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.3)' : isWarning ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                          }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: isHealthy ? '#10b981' : isWarning ? '#f59e0b' : '#ef4444'
                            }} />
                            {status.toUpperCase()}
                          </span>
                        </div>

                        {/* Masked / Raw Key with Reveal & Copy */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <code style={{
                            fontSize: '12px',
                            color: 'var(--admin-text-sub)',
                            fontFamily: 'var(--admin-font-mono)',
                            background: 'var(--admin-bg-base)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--admin-border-glass)'
                          }}>
                            {displayKey}
                          </code>
                          <button
                            type="button"
                            onClick={() => toggleKeyVisibility(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--admin-text-sub)',
                              cursor: 'pointer',
                              fontSize: '13px',
                              padding: '2px 4px'
                            }}
                            title={isVisible ? 'Hide key' : 'Reveal full key'}
                          >
                            {isVisible ? '🙈' : '👁️'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(idx, rawKey)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isCopied ? '#10b981' : 'var(--admin-text-sub)',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '2px 4px'
                            }}
                            title="Copy API key to clipboard"
                          >
                            {isCopied ? '✓ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (Probe Live, Reorder, Delete) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleProbeSingleKey(idx, rawKey)}
                        disabled={isProbingThis || probingAll}
                        className="admin-btn admin-btn-secondary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          borderColor: 'var(--admin-accent-cyan)',
                          color: 'var(--admin-accent-cyan)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ animation: isProbingThis ? 'spin 1s linear infinite' : 'none' }}>
                          {isProbingThis ? '⏳' : '🔍'}
                        </span>
                        {isProbingThis ? 'Probing...' : 'Check Balance'}
                      </button>

                      {/* Reorder Buttons */}
                      <div style={{ display: 'flex', gap: '2px', background: 'var(--admin-bg-surface)', padding: '2px', borderRadius: '6px', border: '1px solid var(--admin-border-glass)' }}>
                        <button
                          type="button"
                          onClick={() => handleMoveKey(idx, 'up')}
                          disabled={idx === 0}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--admin-text-main)',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            opacity: idx === 0 ? 0.3 : 1,
                            fontSize: '11px'
                          }}
                          title="Move Up Priority"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveKey(idx, 'down')}
                          disabled={idx === currentKeys.length - 1}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--admin-text-main)',
                            cursor: idx === currentKeys.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: idx === currentKeys.length - 1 ? 0.3 : 1,
                            fontSize: '11px'
                          }}
                          title="Move Down Priority"
                        >
                          ▼
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteKey(idx)}
                        className="admin-btn admin-btn-danger"
                        style={{ padding: '6px 12px', fontSize: '11.5px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Real-Time Balance Meter & Details */}
                  <div style={{
                    background: 'var(--admin-bg-surface)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--admin-border-glass)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      marginBottom: '6px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--admin-text-sub)', fontWeight: 600 }}>Real-Time Balance:</span>
                        <strong style={{
                          fontSize: '13.5px',
                          color: isHealthy ? 'var(--admin-accent-green)' : isWarning ? 'var(--admin-accent-amber)' : 'var(--admin-accent-red)',
                          fontFamily: 'var(--admin-font-mono)'
                        }}>
                          {typeof balance === 'number' ? balance.toLocaleString() : balance} {unit}
                        </strong>
                        {details && (
                          <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                            • {details}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                        <span>
                          Runway: <strong>{Math.round(pct)}%</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Probed: <strong>{formatTimeAgo(lastProbed)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Progress Runway Bar */}
                    <div style={{
                      width: '100%',
                      height: '7px',
                      background: 'var(--admin-bg-base)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: meterColor,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
