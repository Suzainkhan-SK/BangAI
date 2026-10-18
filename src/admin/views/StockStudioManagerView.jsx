import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function StockStudioManagerView() {
  const [form, setForm] = useState({
    defaultDuration: 75,
    defaultAspect: '9:16',
    defaultClipDuration: 5,
    videoTransitionMode: 'Shuffle',
    matchMaterialsToScript: true,
    videoSource: 'pexels',
    pexelsFallbackMode: 'auto-failover-pixabay',
    defaultVoiceProvider: 'json2video',
    defaultVoiceSpeed: 1.10,
    backgroundMusicVolume: 0.08,
    defaultSubtitlePreset: 'mrbeast-viral',
    subtitleFontSize: 60,
    subtitlePosition: 'bottom',
    aiScriptEngine: 'gemini',
    aiScriptModel: 'gemini-2.5-flash',
    scriptParagraphs: 5,
    renderResolution: '1080p',
    workerConcurrency: 20
  });

  const [activeCluster, setActiveCluster] = useState('cmpunktg');
  const [clusterHealth, setClusterHealth] = useState([]);
  const [pexelsKeys, setPexelsKeys] = useState([]);
  const [pixabayKeys, setPixabayKeys] = useState([]);
  const [j2vKeyCount, setJ2vKeyCount] = useState(0);

  // Key Management state
  const [activeKeyTab, setActiveKeyTab] = useState('pexels');
  const [newPexelsInput, setNewPexelsInput] = useState('');
  const [newPixabayInput, setNewPixabayInput] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingModal, setSyncingModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const fetchStockStudioDetails = async () => {
    setLoading(true);
    try {
      const res = await adminService.getStockStudioDetails();
      if (res && res.success) {
        if (res.stockStudio) {
          setForm(prev => ({ ...prev, ...res.stockStudio }));
        }
        if (res.activeCluster) {
          setActiveCluster(res.activeCluster);
        }
        if (Array.isArray(res.clusterHealth)) {
          setClusterHealth(res.clusterHealth);
        }
        if (Array.isArray(res.pexelsKeys)) {
          setPexelsKeys(res.pexelsKeys);
        }
        if (Array.isArray(res.pixabayKeys)) {
          setPixabayKeys(res.pixabayKeys);
        }
        if (typeof res.j2vKeyCount === 'number') {
          setJ2vKeyCount(res.j2vKeyCount);
        }
      }
    } catch (e) {
      console.warn('Error fetching Stock Studio details:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockStudioDetails();
  }, []);

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const res = await adminService.saveStockStudioDetails({
        stockStudio: form,
        pexelsKeys,
        pixabayKeys,
        activeCluster
      });
      if (res && res.success) {
        setToastMsg('✅ Stock Studio configuration & keys saved and synced to Modal clusters!');
        fetchStockStudioDetails();
      } else {
        setToastMsg(`⚠️ Error saving: ${res?.error || 'Failed to update'}`);
      }
    } catch (err) {
      setToastMsg(`⚠️ Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(''), 5000);
    }
  };

  const handleSyncModalKeys = async () => {
    setSyncingModal(true);
    try {
      const res = await adminService.syncModalClusterKeys();
      if (res && res.success) {
        setToastMsg('🚀 All API keys successfully pushed to active Modal GPU render containers!');
      } else {
        setToastMsg(`⚠️ Modal sync failed: ${res?.error || 'Unknown error'}`);
      }
    } catch (err) {
      setToastMsg(`⚠️ Modal sync error: ${err.message}`);
    } finally {
      setSyncingModal(false);
      setTimeout(() => setToastMsg(''), 5000);
    }
  };

  const handleAddKeys = (provider) => {
    if (provider === 'pexels') {
      const parts = newPexelsInput.split(/[\n,]+/).map(k => k.trim()).filter(k => k.length > 5);
      if (!parts.length) return;
      const combined = Array.from(new Set([...pexelsKeys, ...parts]));
      setPexelsKeys(combined);
      setNewPexelsInput('');
      setToastMsg(`Added ${parts.length} Pexels key(s). Click "Save Settings" to persist.`);
    } else {
      const parts = newPixabayInput.split(/[\n,]+/).map(k => k.trim()).filter(k => k.length > 5);
      if (!parts.length) return;
      const combined = Array.from(new Set([...pixabayKeys, ...parts]));
      setPixabayKeys(combined);
      setNewPixabayInput('');
      setToastMsg(`Added ${parts.length} Pixabay key(s). Click "Save Settings" to persist.`);
    }
  };

  const handleDeleteKey = (provider, keyToDelete) => {
    if (!window.confirm(`Delete key ${keyToDelete.slice(0, 8)}... from ${provider}?`)) return;
    if (provider === 'pexels') {
      setPexelsKeys(prev => prev.filter(k => k !== keyToDelete));
    } else {
      setPixabayKeys(prev => prev.filter(k => k !== keyToDelete));
    }
    setToastMsg(`Key removed. Remember to click "Save Settings" to sync.`);
  };

  const handleCopyKey = (key) => {
    navigator.clipboard?.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const maskKey = (key) => {
    if (!key || key.length < 10) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  // Subtitle Style Preview Mock
  const getSubtitlePreviewStyle = (preset, fontSize) => {
    const scale = fontSize / 60;
    switch (preset) {
      case 'mrbeast-viral':
        return {
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: `${Math.round(20 * scale)}px`,
          fontWeight: 900,
          color: '#facc15',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 4px 12px rgba(0,0,0,0.8)',
          background: 'rgba(0,0,0,0.6)',
          padding: '6px 14px',
          borderRadius: '8px',
          border: '2px solid rgba(250, 204, 21, 0.4)'
        };
      case 'hormozi-impact':
        return {
          fontFamily: "'Arial Black', sans-serif",
          fontSize: `${Math.round(21 * scale)}px`,
          fontWeight: 900,
          color: '#22c55e',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 0 3px 8px #000',
          background: '#000',
          padding: '4px 12px',
          borderRadius: '4px'
        };
      case 'gadzhi-minimal':
        return {
          fontFamily: "'Georgia', serif",
          fontSize: `${Math.round(18 * scale)}px`,
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '0.8px',
          textShadow: '0 2px 8px rgba(0,0,0,0.9)',
          background: 'transparent'
        };
      case 'classic-clean':
        return {
          fontFamily: "'Inter', sans-serif",
          fontSize: `${Math.round(17 * scale)}px`,
          fontWeight: 600,
          color: '#ffffff',
          background: 'rgba(0, 0, 0, 0.75)',
          padding: '6px 12px',
          borderRadius: '6px'
        };
      case 'modern-bold':
      default:
        return {
          fontFamily: "'Montserrat', sans-serif",
          fontSize: `${Math.round(19 * scale)}px`,
          fontWeight: 800,
          color: '#ffffff',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          textShadow: '0 0 10px rgba(6, 182, 212, 0.6), 2px 2px 4px #000',
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(6, 182, 212, 0.3)'
        };
    }
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Stock Studio & Modal Cloud Architecture</h1>
          <p className="admin-view-desc">
            Direct governance for <strong>MoneyPrinterTurbo on Modal GPU cloud</strong>, Pexels & Pixabay footage key pools, 1080p vertical video assembly, AI scriptwriting, and Whisper subtitles.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={fetchStockStudioDetails}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Status'}
          </button>
          <button
            type="button"
            onClick={handleSyncModalKeys}
            disabled={syncingModal}
            className="admin-btn"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: 700
            }}
          >
            {syncingModal ? 'Syncing...' : '🚀 Push Keys to Modal'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="admin-btn admin-btn-primary"
          >
            {saving ? 'Saving...' : '💾 Save Settings & Sync'}
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: toastMsg.startsWith('⚠️') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          border: toastMsg.startsWith('⚠️') ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
          color: toastMsg.startsWith('⚠️') ? '#ef4444' : '#10b981',
          fontSize: '13.5px',
          fontWeight: 700,
          marginBottom: '20px'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Live Infrastructure Status Ribbon */}
      <div className="admin-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚡</span>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#fff' }}>
                Active Cloud Cluster: {activeCluster.toUpperCase()} (Modal.com)
              </h3>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: '4px 0 0 0' }}>
              MoneyPrinterTurbo Python Core • 20 Parallel Worker Containers • 50GB Persistent Volume <code>bangai-storage</code>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="admin-badge admin-badge-success">● {pexelsKeys.length} Pexels Keys</span>
            <span className="admin-badge admin-badge-purple">● {pixabayKeys.length} Pixabay Keys</span>
            <span className="admin-badge admin-badge-cyan">● {j2vKeyCount} ElevenLabs Keys</span>
            <span className="admin-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              1080p Ultra HD
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: MODAL.COM DUAL-CLUSTER HUB */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0' }}>
              Modal.com Dual-Cluster High Availability Hub
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0 }}>
              Live container health ping and failover routing between Primary and Backup Modal clusters.
            </p>
          </div>
        </div>

        <div className="admin-grid admin-grid-2">
          {clusterHealth.map((cluster) => {
            const isSelected = activeCluster === cluster.id;
            return (
              <div
                key={cluster.id}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(6, 182, 212, 0.06)' : 'var(--admin-bg-surface)',
                  border: isSelected ? '2px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                        {cluster.name}
                      </span>
                      {isSelected && (
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: 'var(--admin-accent-cyan)',
                          color: '#000'
                        }}>
                          ACTIVE ROUTE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '4px', fontFamily: 'var(--admin-font-mono)' }}>
                      {cluster.url}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: cluster.online ? '#10b981' : '#ef4444',
                      boxShadow: cluster.online ? '0 0 8px #10b981' : 'none'
                    }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: cluster.online ? '#10b981' : '#ef4444' }}>
                      {cluster.online ? `ONLINE (${cluster.latencyMs}ms)` : 'OFFLINE'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={cluster.uiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-secondary"
                      style={{ fontSize: '11px', padding: '5px 10px', textDecoration: 'none' }}
                    >
                      ↗ Open Web UI
                    </a>
                    <a
                      href={`${cluster.url}/ping`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-secondary"
                      style={{ fontSize: '11px', padding: '5px 10px', textDecoration: 'none' }}
                    >
                      ⚡ Check /ping
                    </a>
                  </div>

                  {!isSelected && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCluster(cluster.id);
                        setToastMsg(`Switched active cluster to ${cluster.name}. Click "Save Settings" to commit.`);
                      }}
                      className="admin-btn"
                      style={{
                        fontSize: '11.5px',
                        padding: '6px 14px',
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid var(--admin-accent-cyan)',
                        color: 'var(--admin-accent-cyan)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Set as Active Cluster
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: STOCK FOOTAGE VAULT & MULTI-KEY POOLS */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0' }}>
              Stock Footage Engine & Key Vault (Pexels & Pixabay)
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0 }}>
              Multi-key load balancing pools stored in MongoDB Atlas and auto-synced to Modal clusters.
            </p>
          </div>

          {/* Provider Switcher Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--admin-bg-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--admin-border-glass)' }}>
            <button
              type="button"
              onClick={() => setActiveKeyTab('pexels')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeKeyTab === 'pexels' ? 'var(--admin-accent-cyan)' : 'transparent',
                color: activeKeyTab === 'pexels' ? '#000' : 'var(--admin-text-sub)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Pexels Pool ({pexelsKeys.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveKeyTab('pixabay')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeKeyTab === 'pixabay' ? 'var(--admin-accent-purple)' : 'transparent',
                color: activeKeyTab === 'pixabay' ? '#fff' : 'var(--admin-text-sub)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Pixabay Pool ({pixabayKeys.length})
            </button>
          </div>
        </div>

        {/* Footage Provider Settings */}
        <div className="admin-grid admin-grid-3" style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', background: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-glass)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Primary Video Source
            </label>
            <select
              value={form.videoSource}
              onChange={(e) => setForm(prev => ({ ...prev, videoSource: e.target.value }))}
              className="admin-select"
            >
              <option value="pexels">Pexels (Primary Footage)</option>
              <option value="pixabay">Pixabay (Primary Footage)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Stock Failover Mode
            </label>
            <select
              value={form.pexelsFallbackMode}
              onChange={(e) => setForm(prev => ({ ...prev, pexelsFallbackMode: e.target.value }))}
              className="admin-select"
            >
              <option value="auto-failover-pixabay">Auto-failover to Pixabay (Recommended)</option>
              <option value="reuse-previous-clip">Loop previous footage with Ken Burns Zoom</option>
              <option value="dark-cinematic-gradient">Render dynamic dark gradient</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Semantic Script Matching
            </label>
            <div style={{ display: 'flex', alignItems: 'center', height: '38px', gap: '10px' }}>
              <input
                type="checkbox"
                id="matchMaterials"
                checked={form.matchMaterialsToScript}
                onChange={(e) => setForm(prev => ({ ...prev, matchMaterialsToScript: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: 'var(--admin-accent-cyan)', cursor: 'pointer' }}
              />
              <label htmlFor="matchMaterials" style={{ fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                Match video scenes to script keywords
              </label>
            </div>
          </div>
        </div>

        {/* Key Pool Manager Active Tab */}
        {activeKeyTab === 'pexels' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                Active Pexels API Keys ({pexelsKeys.length})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                Rate Limit: 200 requests/hour per key • Auto-rotates across pool
              </span>
            </div>

            {/* Key List */}
            {pexelsKeys.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '12.5px', background: 'var(--admin-bg-surface)', borderRadius: '8px' }}>
                No Pexels keys found in pool. Paste your keys below to add.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                {pexelsKeys.map((key, idx) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--admin-bg-surface)',
                      border: '1px solid var(--admin-border-glass)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)' }}>
                        #{idx + 1}
                      </span>
                      <code style={{ fontSize: '12px', color: 'var(--admin-accent-cyan)' }}>
                        {maskKey(key)}
                      </code>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyKey(key)}
                        className="admin-btn admin-btn-secondary"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        {copiedKey === key ? 'Copied!' : '📋 Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteKey('pexels', key)}
                        className="admin-btn"
                        style={{ fontSize: '11px', padding: '3px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Pexels Keys Box */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <textarea
                value={newPexelsInput}
                onChange={(e) => setNewPexelsInput(e.target.value)}
                placeholder="Paste new Pexels API key(s) here (one per line or comma-separated)..."
                rows={2}
                className="admin-input"
                style={{ flex: '1 1 300px', fontSize: '12px', fontFamily: 'var(--admin-font-mono)' }}
              />
              <button
                type="button"
                onClick={() => handleAddKeys('pexels')}
                disabled={!newPexelsInput.trim()}
                className="admin-btn admin-btn-secondary"
                style={{ padding: '10px 16px', fontWeight: 700 }}
              >
                ➕ Add to Pexels Pool
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                Active Pixabay API Keys ({pixabayKeys.length})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                Rate Limit: 5,000 requests/hour per key • Used for high-volume failover
              </span>
            </div>

            {/* Key List */}
            {pixabayKeys.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '12.5px', background: 'var(--admin-bg-surface)', borderRadius: '8px' }}>
                No Pixabay keys found in pool. Paste your keys below to add.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                {pixabayKeys.map((key, idx) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--admin-bg-surface)',
                      border: '1px solid var(--admin-border-glass)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)' }}>
                        #{idx + 1}
                      </span>
                      <code style={{ fontSize: '12px', color: 'var(--admin-accent-purple)' }}>
                        {maskKey(key)}
                      </code>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyKey(key)}
                        className="admin-btn admin-btn-secondary"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        {copiedKey === key ? 'Copied!' : '📋 Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteKey('pixabay', key)}
                        className="admin-btn"
                        style={{ fontSize: '11px', padding: '3px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Pixabay Keys Box */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <textarea
                value={newPixabayInput}
                onChange={(e) => setNewPixabayInput(e.target.value)}
                placeholder="Paste new Pixabay API key(s) here (one per line or comma-separated)..."
                rows={2}
                className="admin-input"
                style={{ flex: '1 1 300px', fontSize: '12px', fontFamily: 'var(--admin-font-mono)' }}
              />
              <button
                type="button"
                onClick={() => handleAddKeys('pixabay')}
                disabled={!newPixabayInput.trim()}
                className="admin-btn admin-btn-secondary"
                style={{ padding: '10px 16px', fontWeight: 700 }}
              >
                ➕ Add to Pixabay Pool
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: VIDEO SCENE PACING, TIMING & ASSEMBLY */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>
          Video Scene Pacing, Timing & Assembly Standards
        </h3>
        <div className="admin-grid admin-grid-4">
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Standard Video Duration
            </label>
            <select
              value={form.defaultDuration}
              onChange={(e) => setForm(prev => ({ ...prev, defaultDuration: Number(e.target.value) }))}
              className="admin-select"
            >
              <option value={75}>75s (5 Scenes - BangAI Flagship)</option>
              <option value={60}>60s (4 Scenes - Quick Retention)</option>
              <option value={45}>45s (3 Scenes - Ultra Fast)</option>
              <option value={30}>30s (2 Scenes - Rapid Hook)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Default Aspect Ratio
            </label>
            <select
              value={form.defaultAspect}
              onChange={(e) => setForm(prev => ({ ...prev, defaultAspect: e.target.value }))}
              className="admin-select"
            >
              <option value="9:16">9:16 (YouTube Shorts / TikTok / Reels - 1080x1920)</option>
              <option value="16:9">16:9 (Standard YouTube Landscape - 1920x1080)</option>
              <option value="1:1">1:1 (Square Post - 1080x1080)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Clip Duration Per Cut
            </label>
            <select
              value={form.defaultClipDuration}
              onChange={(e) => setForm(prev => ({ ...prev, defaultClipDuration: Number(e.target.value) }))}
              className="admin-select"
            >
              <option value={2}>2s (Ultra-Fast Viral Cuts)</option>
              <option value={3}>3s (Fast Dynamic Cuts)</option>
              <option value={5}>5s (Balanced Storytelling - Recommended)</option>
              <option value={8}>8s (Cinematic / Relaxed Pacing)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Video Transition Mode
            </label>
            <select
              value={form.videoTransitionMode}
              onChange={(e) => setForm(prev => ({ ...prev, videoTransitionMode: e.target.value }))}
              className="admin-select"
            >
              <option value="Shuffle">Shuffle (Random Dynamic Transitions)</option>
              <option value="FadeIn">FadeIn (Smooth Cinematic Dissolve)</option>
              <option value="ZoomIn">ZoomIn (High-Impact Zoom)</option>
              <option value="SlideIn">SlideIn (Dynamic Screen Push)</option>
              <option value="None">None (Hard Cut)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 4: AI SCRIPTWRITING & AUDIO ENGINEERING */}
      <div className="admin-grid admin-grid-2" style={{ marginBottom: '24px' }}>
        {/* AI Scriptwriting Engine */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>
            AI Scriptwriting Engine (LLM Brain)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Default LLM Provider
              </label>
              <select
                value={form.aiScriptEngine}
                onChange={(e) => setForm(prev => ({ ...prev, aiScriptEngine: e.target.value }))}
                className="admin-select"
              >
                <option value="gemini">Google Gemini (Gemini 2.5 Flash)</option>
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
                <option value="deepseek">DeepSeek (DeepSeek-V3)</option>
                <option value="groq">Groq (LLaMA 3.3 70B Fast)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Script Model Name
              </label>
              <input
                type="text"
                value={form.aiScriptModel}
                onChange={(e) => setForm(prev => ({ ...prev, aiScriptModel: e.target.value }))}
                className="admin-input"
                placeholder="gemini-2.5-flash"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Script Paragraphs / Scenes Count
              </label>
              <select
                value={form.scriptParagraphs}
                onChange={(e) => setForm(prev => ({ ...prev, scriptParagraphs: Number(e.target.value) }))}
                className="admin-select"
              >
                <option value={2}>2 Scenes (30s Short)</option>
                <option value={3}>3 Scenes (45s Short)</option>
                <option value={4}>4 Scenes (60s Short)</option>
                <option value={5}>5 Scenes (75s Flagship)</option>
                <option value={6}>6 Scenes (90s Extended)</option>
                <option value={7}>7 Scenes (105s Story)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audio Engineering & Voiceover */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Audio Engineering & Voice Pacing
            </h3>
            <span className="admin-badge admin-badge-cyan">
              {j2vKeyCount} ElevenLabs Keys Available
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Voiceover Engine Provider
              </label>
              <select
                value={form.defaultVoiceProvider}
                onChange={(e) => setForm(prev => ({ ...prev, defaultVoiceProvider: e.target.value }))}
                className="admin-select"
              >
                <option value="json2video">ElevenLabs Cloud (9,650 Voices with Auto-Chunking)</option>
                <option value="edge-tts">Microsoft Edge Neural TTS (Free / Instant)</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--admin-text-sub)', fontWeight: 600 }}>Voice Pacing Speed</span>
                <span style={{ fontWeight: 800, color: 'var(--admin-accent-cyan)' }}>{form.defaultVoiceSpeed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.80"
                max="1.50"
                step="0.05"
                value={form.defaultVoiceSpeed}
                onChange={(e) => setForm(prev => ({ ...prev, defaultVoiceSpeed: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--admin-accent-cyan)' }}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                {[1.0, 1.10, 1.15, 1.20, 1.25].map(speed => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, defaultVoiceSpeed: speed }))}
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: form.defaultVoiceSpeed === speed ? '1px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                      background: form.defaultVoiceSpeed === speed ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                      color: form.defaultVoiceSpeed === speed ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)',
                      cursor: 'pointer'
                    }}
                  >
                    {speed.toFixed(2)}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--admin-text-sub)', fontWeight: 600 }}>Default Background Music Volume</span>
                <span style={{ fontWeight: 800, color: 'var(--admin-accent-purple)' }}>{Math.round(form.backgroundMusicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.40"
                step="0.01"
                value={form.backgroundMusicVolume}
                onChange={(e) => setForm(prev => ({ ...prev, backgroundMusicVolume: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--admin-accent-purple)' }}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                {[0.05, 0.08, 0.12, 0.15].map(vol => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, backgroundMusicVolume: vol }))}
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: form.backgroundMusicVolume === vol ? '1px solid var(--admin-accent-purple)' : '1px solid var(--admin-border-glass)',
                      background: form.backgroundMusicVolume === vol ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                      color: form.backgroundMusicVolume === vol ? 'var(--admin-accent-purple)' : 'var(--admin-text-sub)',
                      cursor: 'pointer'
                    }}
                  >
                    {Math.round(vol * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: SUBTITLE STYLING & WHISPER BURN-IN */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0' }}>
              Whisper Subtitle Styling & Burn-In Engine
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0 }}>
              Automatic word-level synchronization, viral subtitle presets, and Devanagari Hindi font fallbacks.
            </p>
          </div>
          <span className="admin-badge admin-badge-success">
            Noto Sans Devanagari Fallback Active
          </span>
        </div>

        <div className="admin-grid admin-grid-2">
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Default Subtitle Preset
              </label>
              <select
                value={form.defaultSubtitlePreset}
                onChange={(e) => setForm(prev => ({ ...prev, defaultSubtitlePreset: e.target.value }))}
                className="admin-select"
              >
                <option value="mrbeast-viral">MrBeast Viral (Impact Yellow Pop-In)</option>
                <option value="hormozi-impact">Alex Hormozi (Bold Green / Black)</option>
                <option value="gadzhi-minimal">Iman Gadzhi (Cinematic White Serif)</option>
                <option value="modern-bold">Modern Bold (Cyan Glow Outline)</option>
                <option value="classic-clean">Classic Clean (Understated Box)</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--admin-text-sub)', fontWeight: 600 }}>Subtitle Font Size</span>
                <span style={{ fontWeight: 800, color: 'var(--admin-accent-cyan)' }}>{form.subtitleFontSize}px</span>
              </div>
              <input
                type="range"
                min="36"
                max="80"
                step="2"
                value={form.subtitleFontSize}
                onChange={(e) => setForm(prev => ({ ...prev, subtitleFontSize: parseInt(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--admin-accent-cyan)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Subtitle Position
              </label>
              <select
                value={form.subtitlePosition}
                onChange={(e) => setForm(prev => ({ ...prev, subtitlePosition: e.target.value }))}
                className="admin-select"
              >
                <option value="bottom">Bottom (Standard YouTube Shorts / Reels)</option>
                <option value="center">Center (Maximum Attention Hook)</option>
                <option value="top">Top (Above Native Controls)</option>
              </select>
            </div>
          </div>

          {/* Interactive Live Subtitle Preview */}
          <div style={{
            background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
            borderRadius: '12px',
            border: '1px solid var(--admin-border-glass)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '220px',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute',
              top: '10px',
              left: '12px',
              fontSize: '10.5px',
              fontWeight: 800,
              color: 'var(--admin-text-sub)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Live 9:16 Frame Preview
            </span>

            <div style={getSubtitlePreviewStyle(form.defaultSubtitlePreset, form.subtitleFontSize)}>
              THIS WILL CHANGE EVERYTHING
            </div>

            <span style={{
              position: 'absolute',
              bottom: '10px',
              fontSize: '11px',
              color: 'var(--admin-text-sub)'
            }}>
              Preset: <strong>{form.defaultSubtitlePreset}</strong> • Size: {form.subtitleFontSize}px • Position: {form.subtitlePosition}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
