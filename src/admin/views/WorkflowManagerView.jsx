import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function WorkflowManagerView() {
  const [workflows, setWorkflows] = useState([]);
  const [activeHost, setActiveHost] = useState('https://cmpunktg29.app.n8n.cloud');
  const [selectedWf, setSelectedWf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Video Provider Selection: 'primary' (Kie.ai) vs 'backup' (Backup Video)
  const [videoProvider, setVideoProvider] = useState('primary'); // 'primary' | 'backup'

  // Dispatcher Action & Target State
  const [actionTab, setActionTab] = useState('append'); // 'append' | 'remove'
  const [targetWorkflow, setTargetWorkflow] = useState('all');
  const [keysInput, setKeysInput] = useState('');
  const [appending, setAppending] = useState(false);
  const [logs, setLogs] = useState([]);
  const [togglingPublish, setTogglingPublish] = useState({});
  const [detectingIds, setDetectingIds] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);

  // Key Removal State
  const [removeKeysInput, setRemoveKeysInput] = useState('');
  const [removing, setRemoving] = useState(false);
  const [keySearchTerm, setKeySearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const isBackup = videoProvider === 'backup';
  const providerLabel = isBackup ? 'Backup Video' : 'Kie.ai Primary Video';
  const providerAccent = isBackup ? 'var(--admin-accent-purple)' : 'var(--admin-accent-cyan)';
  const nodeTargetName = isBackup ? 'Config: Backup Video Master 1..5' : 'Config: Primary Video Master 1..5';

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

  // 2. Append API Keys to Config Nodes (Primary or Backup)
  const handleAppendKeys = async (e) => {
    e.preventDefault();
    const cleanKeys = keysInput
      .split(/[\r\n,;\s]+/)
      .map(k => k.replace(/["'\[\]]/g, '').trim())
      .filter(k => k.length > 5);

    if (cleanKeys.length === 0) {
      alert(`Please enter at least one valid ${providerLabel} API key.`);
      return;
    }

    const targetDesc = targetWorkflow === 'all'
      ? 'ALL 4 flagship workflows simultaneously'
      : `workflow "${workflows.find(w => w.id === targetWorkflow)?.name || targetWorkflow}"`;

    const confirmed = window.confirm(
      `Confirm appending ${cleanKeys.length} new ${providerLabel} API keys to ${targetDesc}?\n\n` +
      `• These keys will be added to the existing keys in ${nodeTargetName}.\n` +
      `• Existing keys will be 100% PRESERVED.\n` +
      `• Keys will be backed up to MongoDB Atlas.`
    );
    if (!confirmed) return;

    setAppending(true);
    setLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 Initiating ${providerLabel} cloud synchronization...`,
      `[${new Date().toLocaleTimeString()}] Target: ${targetDesc}`,
      `[${new Date().toLocaleTimeString()}] Keys to inject: ${cleanKeys.length} keys`,
      `[${new Date().toLocaleTimeString()}] Connecting to n8n Cloud MCP Server at ${activeHost}...`
    ]);

    try {
      const res = await adminService.appendVideoKeys(targetWorkflow, cleanKeys, videoProvider);
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
        setLogs(prev => [...prev, ...newLogs]);
        setToastMsg(`✅ Appended ${cleanKeys.length} ${providerLabel} keys successfully!`);
        setKeysInput('');
        fetchWorkflows(true);
      } else {
        setLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ⚠️ Sync failed: ${res.error || 'Unknown error'}`
        ]);
        setToastMsg(`⚠️ Error: ${res.error || 'Failed to append keys'}`);
      }
    } catch (err) {
      setLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ⚠️ Network exception: ${err.message}`
      ]);
      setToastMsg(`⚠️ Error: ${err.message}`);
    } finally {
      setAppending(false);
      setTimeout(() => setToastMsg(''), 6000);
    }
  };

  // 3. Remove API Keys from Config Nodes (Primary or Backup)
  const handleRemoveKeys = async (keysToRemove, sourceLabel = 'selected') => {
    const cleanKeys = (Array.isArray(keysToRemove) ? keysToRemove : [keysToRemove])
      .map(k => String(k).replace(/["'\[\]]/g, '').trim())
      .filter(k => k.length > 5);

    if (cleanKeys.length === 0) {
      alert(`Please specify at least one valid ${providerLabel} API key to remove.`);
      return;
    }

    const targetDesc = targetWorkflow === 'all'
      ? 'ALL 4 flagship workflows simultaneously'
      : `workflow "${workflows.find(w => w.id === targetWorkflow)?.name || targetWorkflow}"`;

    const summaryText = cleanKeys.length === 1
      ? `Key "${cleanKeys[0]}"`
      : `${cleanKeys.length} keys (${cleanKeys[0].slice(0, 8)}...)`;

    const confirmed = window.confirm(
      `⚠️ CONFIRM ${providerLabel.toUpperCase()} KEY REMOVAL:\n\n` +
      `Are you sure you want to remove ${summaryText} from ${targetDesc}?\n\n` +
      `• This will update ${nodeTargetName} in n8n Cloud.\n` +
      `• The key(s) will be completely removed from active rotation.\n` +
      `• MongoDB Atlas backup will be updated.`
    );
    if (!confirmed) return;

    setRemoving(true);
    setLogs([
      `[${new Date().toLocaleTimeString()}] 🗑️ Initiating ${providerLabel} key removal pipeline...`,
      `[${new Date().toLocaleTimeString()}] Target: ${targetDesc}`,
      `[${new Date().toLocaleTimeString()}] Keys to remove: ${cleanKeys.length} key(s)`,
      `[${new Date().toLocaleTimeString()}] Connecting to n8n Cloud MCP Server at ${activeHost}...`
    ]);

    try {
      const res = await adminService.removeVideoKeys(targetWorkflow, cleanKeys, videoProvider);
      if (res.success && Array.isArray(res.results)) {
        const newLogs = [];
        res.results.forEach(r => {
          if (r.success) {
            newLogs.push(`[${new Date().toLocaleTimeString()}] ✅ ${r.name} (${r.workflowId}): Removed ${r.removedCount} key(s). Remaining: ${r.remainingKeyCount} keys across ${r.nodesUpdated} Master config nodes.`);
          } else {
            newLogs.push(`[${new Date().toLocaleTimeString()}] ❌ ${r.name} (${r.workflowId}): Failed - ${r.error}`);
          }
        });
        newLogs.push(`[${new Date().toLocaleTimeString()}] 💾 Master key pool safely synchronized with MongoDB Atlas.`);
        newLogs.push(`[${new Date().toLocaleTimeString()}] 🎉 Cloud key removal complete!`);
        setLogs(prev => [...prev, ...newLogs]);
        setToastMsg(`✅ Removed ${cleanKeys.length} ${providerLabel} key(s) successfully!`);
        if (sourceLabel === 'bulk') {
          setRemoveKeysInput('');
        }
        fetchWorkflows(true);
      } else {
        setLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ⚠️ Removal failed: ${res.error || 'Unknown error'}`
        ]);
        setToastMsg(`⚠️ Error: ${res.error || 'Failed to remove keys'}`);
      }
    } catch (err) {
      setLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ⚠️ Network exception: ${err.message}`
      ]);
      setToastMsg(`⚠️ Error: ${err.message}`);
    } finally {
      setRemoving(false);
      setTimeout(() => setToastMsg(''), 6000);
    }
  };

  // 4. Auto-Detect Workflow IDs from active n8n instance (For 14-day Migration)
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

  const handleCopyKey = (key) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1800);
    }
  };

  // Parse entered keys count for append
  const detectedAppendCount = keysInput
    .split(/[\r\n,;\s]+/)
    .map(k => k.replace(/["'\[\]]/g, '').trim())
    .filter(k => k.length > 5).length;

  // Parse entered keys count for remove
  const detectedRemoveCount = removeKeysInput
    .split(/[\r\n,;\s]+/)
    .map(k => k.replace(/["'\[\]]/g, '').trim())
    .filter(k => k.length > 5).length;

  // Active Keys pool for the currently selected target and active video provider
  const getActiveKeysForTarget = () => {
    if (targetWorkflow === 'all') {
      const set = new Set();
      workflows.slice(0, 4).forEach(wf => {
        const arr = isBackup ? wf.backupKeys : wf.kieKeys;
        if (Array.isArray(arr)) {
          arr.forEach(k => set.add(k));
        }
      });
      return Array.from(set);
    } else {
      const targetWf = workflows.find(w => w.id === targetWorkflow);
      const arr = isBackup ? targetWf?.backupKeys : targetWf?.kieKeys;
      return Array.isArray(arr) ? arr : [];
    }
  };

  const activeDisplayKeys = getActiveKeysForTarget();
  const filteredActiveKeys = activeDisplayKeys.filter(k =>
    !keySearchTerm || k.toLowerCase().includes(keySearchTerm.toLowerCase())
  );

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Workflow & Cloud Control Center</h1>
          <p className="admin-view-desc">
            Direct MCP-powered cloud execution across all 4 production pipelines on <code>{activeHost}</code>. Manage live publication states and synchronize Primary (Kie.ai) and Backup video API keys.
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
            Live status from n8n cloud MCP instance
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

                    {/* Both Primary (Kie.ai) and Backup Key Counts */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {wf.kieKeysCount !== undefined && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(6, 182, 212, 0.15)',
                          color: 'var(--admin-accent-cyan)',
                          fontWeight: 700,
                          fontSize: '11px'
                        }}>
                          🔑 {wf.kieKeysCount} Kie.ai Keys
                        </span>
                      )}
                      {wf.backupKeysCount !== undefined && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(139, 92, 246, 0.15)',
                          color: 'var(--admin-accent-purple)',
                          fontWeight: 700,
                          fontSize: '11px'
                        }}>
                          🛡️ {wf.backupKeysCount} Backup Keys
                        </span>
                      )}
                    </div>
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

      {/* Video API Keys Cloud Dispatcher & Key Vault (Primary Kie.ai & Backup Video) */}
      <div className="admin-card" style={{
        marginBottom: '24px',
        borderColor: isBackup ? 'rgba(139, 92, 246, 0.35)' : 'rgba(6, 182, 212, 0.35)',
        background: isBackup
          ? 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, var(--admin-bg-surface) 100%)'
          : 'linear-gradient(180deg, rgba(6, 182, 212, 0.04) 0%, var(--admin-bg-surface) 100%)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{isBackup ? '🛡️' : '⚡'}</span>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                {isBackup ? 'Backup Video Provider Keys Dispatcher (Secondary Failover)' : 'Kie.ai API Keys Cloud Dispatcher (Primary Video Provider)'}
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '4px 0 0 0' }}>
              Directly synchronize video API keys into <code>{nodeTargetName}</code> across all 5 scenes. Add new keys or selectively remove existing keys safely.
            </p>
          </div>
          <span className={`admin-badge ${isBackup ? 'admin-badge-purple' : 'admin-badge-cyan'}`}>
            MCP Cloud Sync
          </span>
        </div>

        {/* 1. Video Provider Switcher: Primary (Kie.ai) vs Backup Video */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          padding: '4px',
          background: 'var(--admin-bg-elevated)',
          borderRadius: '10px',
          border: '1px solid var(--admin-border-glass)',
          width: 'fit-content'
        }}>
          <button
            type="button"
            onClick={() => {
              setVideoProvider('primary');
              setKeysInput('');
              setRemoveKeysInput('');
              setKeySearchTerm('');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: !isBackup ? '1px solid var(--admin-accent-cyan)' : 'none',
              background: !isBackup ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
              color: !isBackup ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚡</span> Primary Video Provider (Kie.ai 1080p)
          </button>
          <button
            type="button"
            onClick={() => {
              setVideoProvider('backup');
              setKeysInput('');
              setRemoveKeysInput('');
              setKeySearchTerm('');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: isBackup ? '1px solid var(--admin-accent-purple)' : 'none',
              background: isBackup ? 'rgba(139, 92, 246, 0.22)' : 'transparent',
              color: isBackup ? 'var(--admin-accent-purple)' : 'var(--admin-text-sub)',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🛡️</span> Backup Video Provider (Secondary Failover)
          </button>
        </div>

        {/* 2. Feature Navigation Tabs: Append Keys vs Remove Keys */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '18px',
          borderBottom: '1px solid var(--admin-border-glass)',
          paddingBottom: '10px'
        }}>
          <button
            type="button"
            onClick={() => setActionTab('append')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: actionTab === 'append' ? `1px solid ${providerAccent}` : '1px solid var(--admin-border-glass)',
              background: actionTab === 'append' ? (isBackup ? 'rgba(139, 92, 246, 0.15)' : 'rgba(6, 182, 212, 0.15)') : 'var(--admin-bg-elevated)',
              color: actionTab === 'append' ? providerAccent : 'var(--admin-text-main)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>➕</span> Append New {providerLabel} Keys
          </button>
          <button
            type="button"
            onClick={() => setActionTab('remove')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: actionTab === 'remove' ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid var(--admin-border-glass)',
              background: actionTab === 'remove' ? 'rgba(239, 68, 68, 0.15)' : 'var(--admin-bg-elevated)',
              color: actionTab === 'remove' ? '#ef4444' : 'var(--admin-text-main)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🗑️</span> Remove Existing {providerLabel} Keys
          </button>
        </div>

        {/* Target Workflow Selector (Shared between Append & Remove) */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)', marginBottom: '6px' }}>
            Target Cloud Workflow(s):
          </label>
          <select
            value={targetWorkflow}
            onChange={(e) => setTargetWorkflow(e.target.value)}
            className="admin-select"
            style={{ width: '100%', maxWidth: '600px', fontWeight: 600 }}
          >
            <option value="all">
              🌟 All 4 Flagship Workflows (Simultaneous Cloud Push / Removal across 20 Nodes)
            </option>
            {workflows.slice(0, 4).map(wf => {
              const count = isBackup ? wf.backupKeysCount : wf.kieKeysCount;
              return (
                <option key={wf.id} value={wf.id}>
                  {wf.name} ({wf.id}) — {count ?? '?'} active keys
                </option>
              );
            })}
          </select>
        </div>

        {/* TAB 1: APPEND KEYS FORM */}
        {actionTab === 'append' && (
          <form onSubmit={handleAppendKeys}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                    Enter New {providerLabel} API Keys to Append:
                  </label>
                  <span style={{ fontSize: '11.5px', color: detectedAppendCount > 0 ? providerAccent : 'var(--admin-text-sub)', fontWeight: 600 }}>
                    {detectedAppendCount} new valid key{detectedAppendCount === 1 ? '' : 's'} detected
                  </span>
                </div>
                <textarea
                  value={keysInput}
                  onChange={(e) => setKeysInput(e.target.value)}
                  rows={4}
                  className="admin-textarea"
                  placeholder={
                    isBackup
                      ? "Paste Backup Video API keys here (one key per line, or separated by commas/spaces)...&#10;e.g.&#10;sk-live-bc4a502645e8449d98e6b1e738ca3646d7c68093036cb7a8&#10;sk-live-41cf4f6c5650367c3ea805aa058897fb6464c0e25e282b65"
                      : "Paste Kie.ai API keys here (one key per line, or separated by commas/spaces)...&#10;e.g.&#10;ad82c01b9b51720280eab511077d4242&#10;c60c4e8391441ef89abdd2dcbb9936fa"
                  }
                  style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12.5px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                  🛡️ Safe Merge: Automatically filters duplicates and creates a master backup in MongoDB Atlas. Existing keys are preserved.
                </div>
                <button
                  type="submit"
                  disabled={appending || detectedAppendCount === 0}
                  className="admin-btn admin-btn-primary"
                  style={{
                    minWidth: '220px',
                    background: isBackup ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : undefined,
                    opacity: (appending || detectedAppendCount === 0) ? 0.6 : 1
                  }}
                >
                  {appending ? '🚀 Pushing Keys to n8n Cloud...' : `🚀 Append ${detectedAppendCount > 0 ? detectedAppendCount : ''} ${providerLabel} Keys`}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: REMOVE KEYS INTERFACE */}
        {actionTab === 'remove' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Visual Active Keys Explorer */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--admin-bg-elevated)',
              border: '1px solid var(--admin-border-glass)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                    Active {providerLabel} Keys in {targetWorkflow === 'all' ? 'All 4 Workflows (Master Pool)' : (workflows.find(w => w.id === targetWorkflow)?.name || 'Selected Workflow')}
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', margin: '3px 0 0 0' }}>
                    Click <strong>Remove</strong> next to any key to delete it from rotation in <code>{nodeTargetName}</code>.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    background: isBackup ? 'rgba(139, 92, 246, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                    color: providerAccent,
                    fontSize: '11.5px',
                    fontWeight: 700
                  }}>
                    {activeDisplayKeys.length} Total Keys
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchWorkflows(true)}
                    disabled={syncingCloud}
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    {syncingCloud ? 'Syncing...' : '🔄 Refresh Keys'}
                  </button>
                </div>
              </div>

              {/* Search Filter Input */}
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  value={keySearchTerm}
                  onChange={(e) => setKeySearchTerm(e.target.value)}
                  placeholder={`🔍 Search / Filter active ${providerLabel} keys by character sequence...`}
                  className="admin-input"
                  style={{ fontSize: '12px', padding: '8px 12px' }}
                />
              </div>

              {/* Keys List (Scrollable) */}
              <div style={{
                maxHeight: '260px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                paddingRight: '4px'
              }}>
                {filteredActiveKeys.length === 0 ? (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--admin-text-sub)',
                    fontSize: '12.5px',
                    border: '1px dashed var(--admin-border-glass)',
                    borderRadius: '8px'
                  }}>
                    {activeDisplayKeys.length === 0
                      ? `No active ${providerLabel} keys found for this target. Click "🔄 Refresh Keys" or "Sync Cloud State" above.`
                      : `No keys matched search "${keySearchTerm}".`}
                  </div>
                ) : (
                  filteredActiveKeys.map((key, idx) => {
                    const isCopied = copiedKey === key;
                    return (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: 'var(--admin-bg-surface)',
                          border: '1px solid var(--admin-border-glass)',
                          fontSize: '12px',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--admin-text-sub)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {idx + 1}
                          </span>
                          <code style={{
                            fontFamily: 'var(--admin-font-mono)',
                            fontSize: '11.5px',
                            color: 'var(--admin-text-main)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {key}
                          </code>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(key)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'transparent',
                              border: '1px solid var(--admin-border-glass)',
                              color: isCopied ? '#10b981' : 'var(--admin-text-sub)',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                            title="Copy key to clipboard"
                          >
                            {isCopied ? '✓ Copied' : '📋 Copy'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeys([key], 'individual')}
                            disabled={removing}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#ef4444',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bulk Removal Input (Alternative to Individual Clicks) */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.03)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>
                  Or Bulk Remove Multiple {providerLabel} Keys (Paste Keys Below):
                </label>
                <span style={{ fontSize: '11.5px', color: detectedRemoveCount > 0 ? '#ef4444' : 'var(--admin-text-sub)', fontWeight: 600 }}>
                  {detectedRemoveCount} key{detectedRemoveCount === 1 ? '' : 's'} to remove
                </span>
              </div>
              <textarea
                value={removeKeysInput}
                onChange={(e) => setRemoveKeysInput(e.target.value)}
                rows={3}
                className="admin-textarea"
                placeholder={`Paste ${providerLabel} keys to remove here (one per line, or separated by commas)...`}
                style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '10px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                  ⚠️ Only specified keys will be deleted from {nodeTargetName}. All other keys will remain untouched.
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveKeys(removeKeysInput, 'bulk')}
                  disabled={removing || detectedRemoveCount === 0}
                  className="admin-btn"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: (removing || detectedRemoveCount === 0) ? 'not-allowed' : 'pointer',
                    opacity: (removing || detectedRemoveCount === 0) ? 0.6 : 1
                  }}
                >
                  {removing ? '🗑️ Removing from Cloud...' : `🗑️ Remove Pasted Keys (${detectedRemoveCount})`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Execution Console Logs */}
        {logs.length > 0 && (
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
              LIVE MCP DISPATCH CONSOLE — {providerLabel.toUpperCase()}
            </div>
            {logs.map((log, idx) => (
              <div key={idx} style={{ color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#34d399' : log.includes('⚠️') ? '#f59e0b' : '#38bdf8' }}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
