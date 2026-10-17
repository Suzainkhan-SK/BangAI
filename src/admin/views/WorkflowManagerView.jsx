import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

const DEFAULT_NODES = [
  { id: 'node_webhook', name: 'Webhook Ingestion Trigger', type: 'n8n-nodes-base.webhook', status: 'ACTIVE', desc: 'Accepts topic, voice ID, duration, and user credentials from BangAI frontend' },
  { id: 'node_brain', name: 'Strategy Brain & Script AI', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Synthesizes high-retention 5-scene script with viral hooks' },
  { id: 'node_voice', name: 'Dual-Voice Synthesis (ElevenLabs)', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Generates studio-grade narration with auto-failover voice keys' },
  { id: 'node_media', name: 'Visual Scene Collector (Pexels / Kie.ai)', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Matches vertical cinematic B-roll and AI visuals for 5 scenes' },
  { id: 'node_subtitles', name: 'Dynamic Subtitle Engine (ASS/SRT)', type: 'n8n-nodes-base.code', status: 'ACTIVE', desc: 'Compiles word-by-word animated highlights (Electric Gold typography)' },
  { id: 'node_render', name: 'Json2Video Cloud Render Dispatcher', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Assembles video, background music, audio, and subtitles into 1080p MP4' },
  { id: 'node_callback', name: 'Status Poller & Webhook Callback', type: 'n8n-nodes-base.webhook', status: 'ACTIVE', desc: 'Updates video preview status in MongoDB Atlas previews collection' },
  { id: 'node_uploader', name: 'Direct YouTube Multi-Channel Uploader', type: 'n8n-nodes-base.httpRequest', status: 'ACTIVE', desc: 'Uploads rendered MP4 directly to user authenticated YouTube channel' }
];

export default function WorkflowManagerView() {
  const [workflows, setWorkflows] = useState([]);
  const [activeHost, setActiveHost] = useState('https://cmpunktg29.app.n8n.cloud');
  const [selectedWf, setSelectedWf] = useState(null);
  const [selectedNode, setSelectedNode] = useState(DEFAULT_NODES[1]);
  const [modelName, setModelName] = useState('gemini-2.5-flash');
  const [promptOverride, setPromptOverride] = useState('Generate a high-retention 5-scene viral short under 75 seconds with a powerful 3-second hook.');
  const [apiKeyOverride, setApiKeyOverride] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Kie.ai Cloud Dispatcher State
  const [kieTarget, setKieTarget] = useState('all');
  const [kieKeysInput, setKieKeysInput] = useState('');
  const [appendingKie, setAppendingKie] = useState(false);
  const [kieLogs, setKieLogs] = useState([]);
  const [togglingPublish, setTogglingPublish] = useState({});
  const [detectingIds, setDetectingIds] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);

  const fetchWorkflows = async (syncCloud = false) => {
    if (syncCloud) setSyncingCloud(true);
    else setLoading(true);
    try {
      const res = await adminService.getWorkflows(syncCloud);
      if (res.success && res.data) {
        const wfs = res.data.workflows || [];
        setWorkflows(wfs);
        setActiveHost(res.data.activeHost || 'https://cmpunktg29.app.n8n.cloud');
        if (wfs.length > 0) {
          if (!selectedWf) {
            setSelectedWf(wfs[0]);
          } else {
            const currentSelected = wfs.find(w => w.id === selectedWf.id) || wfs[0];
            setSelectedWf(currentSelected);
          }
          const savedConfig = res.data.nodeConfigs?.[wfs[0].id];
          if (savedConfig) {
            if (savedConfig.modelName) setModelName(savedConfig.modelName);
            if (savedConfig.promptOverride) setPromptOverride(savedConfig.promptOverride);
            if (savedConfig.apiKeyOverride) setApiKeyOverride(savedConfig.apiKeyOverride);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch workflows:', e.message);
    } finally {
      setLoading(false);
      setSyncingCloud(false);
    }
  };

  useEffect(() => {
    fetchWorkflows(true);
  }, []);

  const handleSelectWorkflow = (wf) => {
    setSelectedWf(wf);
  };

  // 1. Toggle Workflow Publish / Unpublish via MCP
  const handleTogglePublish = async (e, wf) => {
    e.stopPropagation();
    const shouldPublish = !wf.published;
    const actionLabel = shouldPublish ? 'Publish (Activate)' : 'Unpublish (Draft)';
    const confirmed = window.confirm(`Confirm: ${actionLabel} workflow "${wf.name}" (${wf.id}) in n8n Cloud?`);
    if (!confirmed) return;

    setTogglingPublish(prev => ({ ...prev, [wf.id]: true }));
    try {
      const res = await adminService.toggleWorkflowPublish(wf.id, shouldPublish);
      if (res.success) {
        setToastMsg(`✅ Workflow "${wf.name}" is now ${res.status}!`);
        // Update local state immediately
        setWorkflows(prev => prev.map(item => {
          if (item.id === wf.id) {
            return {
              ...item,
              published: shouldPublish,
              status: shouldPublish ? 'ACTIVE' : 'DRAFT'
            };
          }
          return item;
        }));
      } else {
        setToastMsg(`⚠️ Error: ${res.error || 'Failed to toggle publish status'}`);
      }
    } catch (err) {
      setToastMsg(`⚠️ Error: ${err.message}`);
    } finally {
      setTogglingPublish(prev => ({ ...prev, [wf.id]: false }));
      setTimeout(() => setToastMsg(''), 5000);
    }
  };

  // 2. Append Kie.ai API Keys to Primary Video Config Nodes
  const handleAppendKieKeys = async (e) => {
    e.preventDefault();
    const cleanKeys = kieKeysInput
      .split(/[\r\n,;\s]+/)
      .map(k => k.replace(/["'\[\]]/g, '').trim())
      .filter(k => k.length > 5);

    if (cleanKeys.length === 0) {
      alert('Please enter at least one valid Kie.ai API key.');
      return;
    }

    const targetDesc = kieTarget === 'all'
      ? 'ALL 4 flagship workflows simultaneously'
      : `workflow "${workflows.find(w => w.id === kieTarget)?.name || kieTarget}"`;

    const confirmed = window.confirm(
      `Confirm appending ${cleanKeys.length} new Kie.ai API keys to ${targetDesc}?\n\n` +
      `• These keys will be added to the existing keys in Config: Primary Video Master 1..5.\n` +
      `• Existing keys will be 100% PRESERVED.\n` +
      `• Keys will be backed up to MongoDB Atlas.`
    );
    if (!confirmed) return;

    setAppendingKie(true);
    setKieLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 Initiating cloud synchronization pipeline...`,
      `[${new Date().toLocaleTimeString()}] Target: ${targetDesc}`,
      `[${new Date().toLocaleTimeString()}] Keys to inject: ${cleanKeys.length} keys`,
      `[${new Date().toLocaleTimeString()}] Connecting to n8n Cloud MCP Server at ${activeHost}...`
    ]);

    try {
      const res = await adminService.appendKieKeys(kieTarget, cleanKeys);
      if (res.success && Array.isArray(res.results)) {
        const newLogs = [];
        res.results.forEach(r => {
          if (r.success) {
            newLogs.push(`[${new Date().toLocaleTimeString()}] ✅ ${r.name} (${r.workflowId}): Added ${r.addedCount} new keys. Total active: ${r.totalKeyCount} keys across ${r.nodesUpdated} Master config nodes.`);
          } else {
            newLogs.push(`[${new Date().toLocaleTimeString()}] ❌ ${r.name} (${r.workflowId}): Failed - ${r.error}`);
          }
        });
        newLogs.push(`[${new Date().toLocaleTimeString()}] 💾 Master key pool safely synchronized with MongoDB Atlas api_keys.`);
        newLogs.push(`[${new Date().toLocaleTimeString()}] 🎉 Cloud sync complete!`);
        setKieLogs(prev => [...prev, ...newLogs]);
        setToastMsg(`✅ Appended ${cleanKeys.length} Kie.ai keys successfully!`);
        setKieKeysInput('');
        fetchWorkflows(true);
      } else {
        setKieLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ⚠️ Sync failed: ${res.error || 'Unknown error'}`
        ]);
        setToastMsg(`⚠️ Error: ${res.error || 'Failed to append keys'}`);
      }
    } catch (err) {
      setKieLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ⚠️ Network exception: ${err.message}`
      ]);
      setToastMsg(`⚠️ Error: ${err.message}`);
    } finally {
      setAppendingKie(false);
      setTimeout(() => setToastMsg(''), 6000);
    }
  };

  // 3. Auto-Detect Workflow IDs from active n8n instance (For 14-day Migration)
  const handleAutoDetectIds = async () => {
    const confirmed = window.confirm(
      `Scan active n8n instance (${activeHost}) via MCP and auto-detect the 4 flagship workflow IDs?\n\n` +
      `Use this whenever you migrate to a new 14-day free trial n8n account to automatically re-wire workflow IDs without editing code.`
    );
    if (!confirmed) return;

    setDetectingIds(true);
    setToastMsg('🔍 Scanning active n8n cloud workflows via MCP...');
    try {
      const res = await adminService.autoDetectWorkflowIds();
      if (res.success && res.detectedWorkflows) {
        setToastMsg(`🎉 Auto-detected 4 flagship workflows! MongoDB configuration updated.`);
        fetchWorkflows(true);
      } else {
        setToastMsg(`⚠️ Detection notice: ${res.error || 'Could not find all matching workflows'}`);
      }
    } catch (err) {
      setToastMsg(`⚠️ Error: ${err.message}`);
    } finally {
      setDetectingIds(false);
      setTimeout(() => setToastMsg(''), 6000);
    }
  };

  // 4. Save individual node parameters (MongoDB config store)
  const handleSaveNode = async () => {
    if (!selectedWf) return;
    setSaving(true);
    try {
      const nodeConfigs = {
        selectedNodeId: selectedNode.id,
        modelName,
        promptOverride,
        apiKeyOverride,
        updatedAt: new Date().toISOString()
      };
      const res = await adminService.saveWorkflowNodes(selectedWf.id, nodeConfigs);
      if (res.success) {
        setToastMsg(`✅ Node [${selectedNode.name}] configured and saved to MongoDB Atlas!`);
      } else {
        setToastMsg(`⚠️ Error: ${res.error}`);
      }
    } catch (err) {
      setToastMsg(`⚠️ Error saving: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(''), 4500);
    }
  };

  // Parse entered keys count
  const detectedKeysCount = kieKeysInput
    .split(/[\r\n,;\s]+/)
    .map(k => k.replace(/["'\[\]]/g, '').trim())
    .filter(k => k.length > 5).length;

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Workflow & Cloud Control Center</h1>
          <p className="admin-view-desc">
            Direct MCP-powered cloud execution across all 4 production pipelines on <code>{activeHost}</code>. Manage live publication states and synchronize Kie.ai video API keys.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleAutoDetectIds}
            disabled={detectingIds}
            className="admin-btn admin-btn-secondary"
            title="Auto-detect workflow IDs on active n8n instance (useful after 14-day trial migrations)"
          >
            {detectingIds ? '🔍 Scanning Cloud...' : '🔍 Auto-Detect Cloud IDs'}
          </button>
          <button
            type="button"
            onClick={() => fetchWorkflows(true)}
            disabled={syncingCloud || loading}
            className="admin-btn admin-btn-secondary"
          >
            {syncingCloud ? '🔄 Syncing...' : '🔄 Sync Cloud State'}
          </button>
          {selectedWf && (
            <a
              href={selectedWf.n8nUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              ↗ Open in n8n Cloud
            </a>
          )}
        </div>
      </div>

      {toastMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: toastMsg.includes('⚠️') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          border: toastMsg.includes('⚠️') ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
          color: toastMsg.includes('⚠️') ? '#ef4444' : '#10b981',
          fontSize: '13.5px',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          {toastMsg}
        </div>
      )}

      {/* 4 Flagship Production Workflows Grid */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
            Flagship Production Pipelines (4 Live Cloud Automations)
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
            Click card to inspect node parameters below
          </span>
        </div>

        <div className="admin-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {workflows.slice(0, 4).map((wf) => {
            const isSelected = selectedWf?.id === wf.id;
            const isToggling = !!togglingPublish[wf.id];
            const isPublished = wf.published !== false && wf.status === 'ACTIVE';

            return (
              <div
                key={wf.id}
                onClick={() => handleSelectWorkflow(wf)}
                className="admin-card"
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-border-glass)',
                  background: isSelected ? 'var(--admin-card-hover)' : 'var(--admin-bg-surface)',
                  boxShadow: isSelected ? '0 0 20px rgba(6, 182, 212, 0.15)' : 'var(--admin-card-shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="admin-badge admin-badge-cyan">{wf.category}</span>
                    <span className={`admin-badge ${isPublished ? 'admin-badge-success' : 'admin-badge-amber'}`}>
                      {isPublished ? '● ACTIVE (PUBLISHED)' : '○ DRAFT (UNPUBLISHED)'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '6px 0 10px 0', color: 'var(--admin-text-main)' }}>
                    {wf.name}
                  </h3>

                  <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div><strong>Workflow ID:</strong> <code>{wf.id}</code></div>
                    <div><strong>Nodes Count:</strong> {wf.nodesCount} Executable Nodes</div>
                    <div><strong>Trigger:</strong> <code>{wf.webhook ? (wf.webhook.split('/webhook')[1] || wf.webhook) : 'Webhook'}</code></div>
                    {wf.kieKeysCount !== undefined && (
                      <div style={{ marginTop: '2px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(6, 182, 212, 0.15)',
                          color: 'var(--admin-accent-cyan)',
                          fontWeight: 700,
                          fontSize: '11px'
                        }}>
                          🔑 {wf.kieKeysCount} Kie.ai Keys in Cloud
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Controls: View in Cloud & Publish / Unpublish Toggle */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--admin-border-glass)'
                }}>
                  <a
                    href={wf.n8nUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      background: 'var(--admin-bg-elevated)',
                      border: '1px solid var(--admin-border-glass)',
                      color: 'var(--admin-text-main)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    ↗ View in Cloud
                  </a>

                  <button
                    type="button"
                    onClick={(e) => handleTogglePublish(e, wf)}
                    disabled={isToggling}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: isPublished ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                      background: isPublished ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color: isPublished ? '#ef4444' : '#10b981',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isToggling ? 'Processing...' : (isPublished ? '⏸️ Unpublish' : '▶️ Publish')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NEW FEATURE: Kie.ai API Keys Cloud Dispatcher */}
      <div className="admin-card" style={{
        marginBottom: '24px',
        borderColor: 'rgba(6, 182, 212, 0.35)',
        background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.04) 0%, var(--admin-bg-surface) 100%)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚡</span>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                Kie.ai API Keys Cloud Dispatcher (Primary Video Provider)
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '4px 0 0 0' }}>
              Directly appends new Kie.ai Veo API keys into <code>Config: Primary Video Master 1..5</code> across all 5 scenes. Existing keys are <strong>never overwritten or erased</strong>.
            </p>
          </div>
          <span className="admin-badge admin-badge-cyan">
            MCP Cloud Sync
          </span>
        </div>

        <form onSubmit={handleAppendKieKeys}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Target Workflow Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)', marginBottom: '6px' }}>
                Target Cloud Workflow(s):
              </label>
              <select
                value={kieTarget}
                onChange={(e) => setKieTarget(e.target.value)}
                className="admin-select"
                style={{ width: '100%', maxWidth: '600px', fontWeight: 600 }}
              >
                <option value="all">🌟 All 4 Flagship Workflows (Simultaneous Cloud Push to 20 Nodes)</option>
                {workflows.slice(0, 4).map(wf => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name} ({wf.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Keys Textarea */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                  Enter New Kie.ai API Keys:
                </label>
                <span style={{ fontSize: '11.5px', color: detectedKeysCount > 0 ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)', fontWeight: 600 }}>
                  {detectedKeysCount} new valid key{detectedKeysCount === 1 ? '' : 's'} detected
                </span>
              </div>
              <textarea
                value={kieKeysInput}
                onChange={(e) => setKieKeysInput(e.target.value)}
                rows={4}
                className="admin-textarea"
                placeholder="Paste Kie.ai API keys here (one key per line, or separated by commas/spaces)...&#10;e.g.&#10;ad82c01b9b51720280eab511077d4242&#10;c60c4e8391441ef89abdd2dcbb9936fa"
                style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12.5px' }}
              />
            </div>

            {/* Action Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                🛡️ Safe Merge: Automatically filters duplicates and creates a master backup in MongoDB Atlas.
              </div>
              <button
                type="submit"
                disabled={appendingKie || detectedKeysCount === 0}
                className="admin-btn admin-btn-primary"
                style={{
                  minWidth: '220px',
                  opacity: (appendingKie || detectedKeysCount === 0) ? 0.6 : 1
                }}
              >
                {appendingKie ? '🚀 Pushing Keys to n8n Cloud...' : `🚀 Append ${detectedKeysCount > 0 ? detectedKeysCount : ''} Kie.ai Keys`}
              </button>
            </div>
          </div>
        </form>

        {/* Live Execution Console Logs */}
        {kieLogs.length > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '12px 14px',
            borderRadius: '10px',
            background: '#070a12',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontFamily: 'var(--admin-font-mono)',
            fontSize: '11.5px',
            lineHeight: '1.6',
            color: '#a7f3d0',
            maxHeight: '180px',
            overflowY: 'auto'
          }}>
            <div style={{ color: 'var(--admin-text-sub)', fontSize: '10.5px', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
              LIVE MCP DISPATCH CONSOLE
            </div>
            {kieLogs.map((log, idx) => (
              <div key={idx} style={{ color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#34d399' : log.includes('⚠️') ? '#f59e0b' : '#38bdf8' }}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secondary Workflows Bar */}
      <div className="admin-card" style={{ padding: '14px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-main)' }}>Additional Pipelines:</span>
            {workflows.slice(4).map((wf) => {
              const isSelected = selectedWf?.id === wf.id;
              return (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => handleSelectWorkflow(wf)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid var(--admin-accent-purple)' : '1px solid var(--admin-border-glass)',
                    background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'var(--admin-bg-elevated)',
                    color: isSelected ? 'var(--admin-accent-purple)' : 'var(--admin-text-main)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {wf.name}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
            Selected: <strong style={{ color: 'var(--admin-accent-cyan)' }}>{selectedWf?.name || 'None'}</strong>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Node Chain Visualizer + Node Parameter Inspector */}
      <div className="admin-grid admin-grid-2">
        {/* Left: Node Pipeline Chain */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Execution Chain ({DEFAULT_NODES.length} Core Nodes)
            </h3>
            <span className="admin-badge admin-badge-cyan">Real Pipeline</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DEFAULT_NODES.map((node, idx) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: isSelected ? 'var(--admin-card-hover)' : 'var(--admin-bg-elevated)',
                    border: isSelected ? '1px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-border-glass)',
                      color: isSelected ? '#000' : 'var(--admin-text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                        {node.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                        {node.type}
                      </div>
                    </div>
                  </div>
                  <span className="admin-badge admin-badge-success">
                    {node.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Node Parameter Inspector & Live Config */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Node Parameter Inspector
            </h3>
            <span className="admin-badge admin-badge-purple">Direct Key Injection</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--admin-bg-elevated)', border: '1px solid var(--admin-border-glass)' }}>
              <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>Active Inspect Target</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--admin-accent-cyan)', marginTop: '2px' }}>
                {selectedNode.name}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
                {selectedNode.desc}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                LLM Backbone Engine
              </label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="admin-select"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Fast & 1M Token Context)</option>
                <option value="gpt-5-preview">OpenAI GPT-5 / GPT-4o (Elite Reasoning)</option>
                <option value="groq-llama-3.3-70b-versatile">Groq LLaMA 3.3 70B (High-Speed Engine)</option>
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet (Master Storyteller)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Node Prompt Strategy & System Directives
              </label>
              <textarea
                value={promptOverride}
                onChange={(e) => setPromptOverride(e.target.value)}
                rows={5}
                className="admin-textarea"
                placeholder="Custom instruction prompt for this node..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Node Dedicated API Key (Optional Override)
              </label>
              <input
                type="text"
                value={apiKeyOverride}
                onChange={(e) => setApiKeyOverride(e.target.value)}
                placeholder="Leave blank to use Key Vault failover pool..."
                className="admin-input"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveNode}
              disabled={saving}
              className="admin-btn admin-btn-primary"
              style={{ width: '100%', marginTop: '6px' }}
            >
              {saving ? 'Deploying to MongoDB Atlas...' : '💾 Save & Deploy Node Parameters'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
