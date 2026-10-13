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

const CATEGORIES = [
  {
    id: 'json2video',
    name: 'JSON2Video Cloud Render',
    icon: '⚡',
    providers: ['json2video']
  },
  {
    id: 'modal',
    name: 'Modal Cloud Compute',
    icon: '☁️',
    providers: ['modal']
  },
  {
    id: 'llm',
    name: 'AI LLM Engines',
    icon: '🧠',
    providers: ['gemini', 'openai', 'deepseek', 'groq']
  },
  {
    id: 'stock_footage',
    name: 'Stock Footage Library',
    icon: '🎬',
    providers: ['pexels', 'pixabay']
  },
  {
    id: 'voice_tts',
    name: 'Voice & TTS APIs',
    icon: '🎙️',
    providers: ['azure_speech', 'elevenlabs', 'siliconflow']
  },
  {
    id: 'thumbnail',
    name: 'Thumbnail Studio',
    icon: '🖼️',
    providers: ['thumbnail']
  },
  {
    id: 'xkiro',
    name: 'Strategy Brain',
    icon: '🔮',
    providers: ['xkiro']
  }
];

const PROVIDER_NAMES = {
  json2video: 'JSON2Video Cloud Render (ElevenLabs Voices)',
  modal: 'Modal Cloud Compute Cluster (Dual Profile Failover)',
  gemini: 'Google Gemini 2.5 Flash / Pro API',
  openai: 'OpenAI GPT-4o / GPT-4o-Mini API',
  deepseek: 'DeepSeek V3 / R1 Chat Engine',
  groq: 'Groq LPU Ultra-Fast LLM API',
  pexels: 'Pexels HD Vertical Video API',
  pixabay: 'Pixabay Stock Media API',
  azure_speech: 'Azure Cognitive Speech S0 (Neural Voices)',
  elevenlabs: 'ElevenLabs Studio Ultra-Realistic Voice API',
  siliconflow: 'SiliconFlow Cloud Audio / LLM API',
  thumbnail: 'Kie.ai Image & Thumbnail Studio',
  xkiro: 'xKiro AI Strategy Brain'
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
  const [activeCategory, setActiveCategory] = useState('json2video');
  const [provider, setProvider] = useState('json2video');
  const [keysData, setKeysData] = useState({
    json2video: [],
    modal: [],
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
      if (res.success && res.data) {
        setKeysData(prev => ({
          ...prev,
          ...res.data
        }));
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

  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    const cat = CATEGORIES.find(c => c.id === catId);
    if (cat && cat.providers.length > 0) {
      if (!cat.providers.includes(provider)) {
        setProvider(cat.providers[0]);
      }
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
      // Auto probe the newly added key live
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
      if (res.success && res.keyData) {
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
        setToastMsg(`⚠️ Probe notice: ${res.error || 'Check failed'}`);
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
      if (res.success && res.keys) {
        setKeysData(prev => ({
          ...prev,
          [provider]: res.keys
        }));
        setToastMsg(`✅ All ${res.keys.length} ${provider.toUpperCase()} keys live probed & balances updated in Atlas!`);
      } else {
        setToastMsg(`Probe complete.`);
      }
    } catch (e) {
      setToastMsg(`Probe completed (${e.message})`);
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
      if (res.success) {
        setToastMsg('✅ All system API keys successfully pushed to Modal Cloud & persistent storage volume!');
      } else {
        setToastMsg(`⚠️ Notice: ${res.message || res.error}`);
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
      if (res.success) {
        setToastMsg('✅ Primary API keys successfully synchronized with Netlify production runtime!');
      } else {
        setToastMsg(`⚠️ Notice: ${res.message}`);
      }
    } catch (e) {
      setToastMsg(`⚠️ Sync Error: ${e.message}`);
    } finally {
      setSyncingNetlify(false);
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
    navigator.clipboard.writeText(rawKey);
    setCopiedKeyIndex(idx);
    setTimeout(() => setCopiedKeyIndex(null), 2000);
  };

  const activeCategoryObj = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];
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

  // Global counts
  const totalVaultKeys = useMemo(() => {
    return Object.values(keysData).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  }, [keysData]);

  const healthyVaultKeys = useMemo(() => {
    let count = 0;
    Object.values(keysData).forEach(arr => {
      (arr || []).forEach(k => {
        const st = typeof k === 'object' ? k.status : 'active';
        if (st === 'active') count++;
      });
    });
    return count;
  }, [keysData]);

  const getCategoryTotalCount = (cat) => {
    return cat.providers.reduce((sum, p) => sum + (keysData[p]?.length || 0), 0);
  };

  return (
    <div className="admin-view-container" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* View Header */}
      <div className="admin-view-header" style={{ marginBottom: '20px' }}>
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
            Zero-downtime key rotation, live quota monitoring, automated failover, unlimited keys per service, and real-time synchronization between MongoDB Atlas and Modal Cloud clusters for <strong>Bang API Credits</strong>.
          </p>
        </div>
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

      {/* Global Real-Time Quota & System Health Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div className="admin-card" style={{ padding: '16px 20px', background: 'rgba(6, 182, 212, 0.06)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Vault Keys
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--admin-text-main)', marginTop: '4px' }}>
            {totalVaultKeys} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-accent-cyan)' }}>Keys Across 12 Services</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--admin-accent-green)', marginTop: '4px', fontWeight: 700 }}>
            ● {healthyVaultKeys} Operational in Pool
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px', background: 'rgba(16, 185, 129, 0.06)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Service Pool
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--admin-text-main)', marginTop: '4px' }}>
            {currentKeys.length} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-accent-green)' }}>{provider.toUpperCase()} Keys</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            Primary + {Math.max(0, currentKeys.length - 1)} Failover Fallbacks
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px', background: 'rgba(59, 130, 246, 0.06)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Modal Cloud Dual Cluster
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--admin-text-main)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981' }} />
            cmpunktg & cmpunktg1
          </div>
          <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '4px', fontWeight: 600 }}>
            Volume: /root/storage/system_api_keys.json
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px', background: 'rgba(139, 92, 246, 0.06)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Bang API Credits Mode
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--admin-accent-purple)', marginTop: '8px' }}>
            Zero-Downtime Active
          </div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            BYOK Default + Managed Cloud Pool
          </div>
        </div>
      </div>

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

      {/* Primary Category Selector Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        borderBottom: '1px solid var(--admin-border-glass)',
        paddingBottom: '14px',
        marginBottom: '16px'
      }}>
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const count = getCategoryTotalCount(cat);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: isSelected ? '1px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'var(--admin-bg-surface)',
                color: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-text-main)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 4px 15px rgba(6, 182, 212, 0.2)' : 'none'
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                background: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-bg-elevated)',
                color: isSelected ? '#000' : 'var(--admin-text-sub)',
                fontSize: '11px',
                fontWeight: 800
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-Provider Selector */}
      {activeCategoryObj.providers.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '16px',
          alignItems: 'center',
          background: 'var(--admin-bg-surface)',
          padding: '10px 16px',
          borderRadius: '10px',
          border: '1px solid var(--admin-border-glass)'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)', fontWeight: 600, marginRight: '6px' }}>
            Select Provider Engine:
          </span>
          {activeCategoryObj.providers.map((p) => {
            const isSubSelected = provider === p;
            const subCount = keysData[p]?.length || 0;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: isSubSelected ? '1px solid #3b82f6' : '1px solid var(--admin-border-glass)',
                  background: isSubSelected ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: isSubSelected ? '#60a5fa' : 'var(--admin-text-sub)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{p.toUpperCase()}</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isSubSelected ? '#3b82f6' : 'var(--admin-bg-elevated)',
                  color: isSubSelected ? '#fff' : 'var(--admin-text-sub)',
                  fontSize: '10.5px',
                  fontWeight: 800
                }}>
                  {subCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Add New Key Form Card */}
      <div className="admin-card" style={{ padding: '18px 22px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
            Target Service: <span style={{ color: 'var(--admin-accent-cyan)' }}>{PROVIDER_NAMES[provider] || provider.toUpperCase()}</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
            Instant failover triggers automatically upon HTTP 429 / quota limit
          </span>
        </div>
        <form onSubmit={handleAddKey} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '260px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '5px' }}>
              Raw {provider.toUpperCase()} API Key / Secret
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
              Friendly Name / Account Tier
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Production Cluster #1"
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

      {/* Keys Control Toolbar: Search & Filter */}
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

      {/* Keys Pool List / Cards */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: 'var(--admin-text-main)' }}>
              {provider.toUpperCase()} Multi-Key Rotation Pool
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
              Showing {filteredKeys.length} of {currentKeys.length} keys in active failover priority
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

              // Display masked vs unmasked
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
              const isExhausted = status === 'exhausted' || status === 'invalid' || status === 'error';

              // Meter gradient colors
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
                              background: isHealthy ? '#10b981' : isWarning ? '#f59e0b' : '#ef4444',
                              boxShadow: `0 0 6px ${isHealthy ? '#10b981' : isWarning ? '#f59e0b' : '#ef4444'}`
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
