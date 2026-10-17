import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../adminService';

export default function WorkflowManagerView() {
  const [workflows, setWorkflows] = useState([]);
  const [activeHost, setActiveHost] = useState('https://cmpunktg29.app.n8n.cloud');
  const [selectedWf, setSelectedWf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Category Switcher: 'video' (Kie.ai & Backup Video) | 'llm' (Master LLM Config Nodes)
  const [managerCategory, setManagerCategory] = useState('video');

  // Video Provider: 'primary' (Kie.ai) | 'backup' (Backup Video)
  const [videoProvider, setVideoProvider] = useState('primary');

  // LLM Node Target: 'all_primary' | 'all_backup' | specific node
  const [llmTarget, setLlmTarget] = useState('all_primary');

  // Dispatcher Action: 'append' | 'manage'
  const [actionTab, setActionTab] = useState('append');
  const [targetWorkflow, setTargetWorkflow] = useState('all');
  const [keysInput, setKeysInput] = useState('');
  const [removeKeysInput, setRemoveKeysInput] = useState('');
  const [appending, setAppending] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);

  // Filter & Search State
  const [keySearchTerm, setKeySearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [togglingPublish, setTogglingPublish] = useState({});
  const [detectingIds, setDetectingIds] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);

  const isLlm = managerCategory === 'llm';
  const isBackup = videoProvider === 'backup';

  const providerLabel = isLlm
    ? (llmTarget === 'all_primary'
        ? 'All Primary LLM Nodes'
        : llmTarget === 'all_backup'
          ? 'All Backup LLM Nodes'
          : llmTarget)
    : (isBackup ? 'Backup Video' : 'Kie.ai Primary Video');

  const providerAccent = isLlm
    ? (llmTarget === 'all_primary' || llmTarget.includes('Primary') || llmTarget.includes('Topic Analyzer LLM Master')
        ? '#10b981'
        : '#f59e0b')
    : (isBackup ? 'var(--admin-accent-purple, #8b5cf6)' : 'var(--admin-accent-cyan, #06b6d4)');

  const nodeTargetName = isLlm
    ? (llmTarget === 'all_primary'
        ? 'Config: Primary LLM Master & Config: Topic Analyzer LLM Master'
        : llmTarget === 'all_backup'
          ? 'Config: Backup LLM Master, Strategy Backup & Topic Analyzer Backup'
          : llmTarget)
    : (isBackup ? 'Config: Backup Video Master 1..5' : 'Config: Primary Video Master 1..5');

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

  // Compute KPI Totals
  const flagshipWorkflows = useMemo(() => workflows.slice(0, 4), [workflows]);
  
  const liveCount = useMemo(() => {
    return flagshipWorkflows.filter(w => w.published !== false && w.status === 'ACTIVE').length;
  }, [flagshipWorkflows]);

  const totalPrimaryKeys = useMemo(() => {
    const set = new Set();
    flagshipWorkflows.forEach(w => {
      if (Array.isArray(w.kieKeys)) w.kieKeys.forEach(k => set.add(k));
    });
    return set.size;
  }, [flagshipWorkflows]);

  const totalBackupKeys = useMemo(() => {
    const set = new Set();
    flagshipWorkflows.forEach(w => {
      if (Array.isArray(w.backupKeys)) w.backupKeys.forEach(k => set.add(k));
    });
    return set.size;
  }, [flagshipWorkflows]);

  const totalPrimaryLlmKeys = useMemo(() => {
    const set = new Set();
    flagshipWorkflows.forEach(w => {
      if (Array.isArray(w.primaryLlmKeys)) w.primaryLlmKeys.forEach(k => set.add(k));
      if (Array.isArray(w.topicAnalyzerLlmKeys)) w.topicAnalyzerLlmKeys.forEach(k => set.add(k));
    });
    return set.size;
  }, [flagshipWorkflows]);

  const totalBackupLlmKeys = useMemo(() => {
    const set = new Set();
    flagshipWorkflows.forEach(w => {
      if (Array.isArray(w.backupLlmKeys)) w.backupLlmKeys.forEach(k => set.add(k));
      if (Array.isArray(w.strategyBackupLlmKeys)) w.strategyBackupLlmKeys.forEach(k => set.add(k));
      if (Array.isArray(w.topicAnalyzerBackupLlmKeys)) w.topicAnalyzerBackupLlmKeys.forEach(k => set.add(k));
    });
    return set.size;
  }, [flagshipWorkflows]);

  // Active Keys pool for the currently selected target and active provider
  const activeDisplayKeys = useMemo(() => {
    if (!isLlm) {
      if (targetWorkflow === 'all') {
        const set = new Set();
        flagshipWorkflows.forEach(wf => {
          const arr = isBackup ? wf.backupKeys : wf.kieKeys;
          if (Array.isArray(arr)) arr.forEach(k => set.add(k));
        });
        return Array.from(set);
      } else {
        const targetWf = flagshipWorkflows.find(w => w.id === targetWorkflow);
        const arr = isBackup ? targetWf?.backupKeys : targetWf?.kieKeys;
        return Array.isArray(arr) ? arr : [];
      }
    } else {
      const getKeysForWfAndTarget = (wf) => {
        if (!wf) return [];
        if (llmTarget === 'all_primary') {
          const set = new Set([...(wf.primaryLlmKeys || []), ...(wf.topicAnalyzerLlmKeys || [])]);
          return Array.from(set);
        }
        if (llmTarget === 'all_backup') {
          const set = new Set([
            ...(wf.backupLlmKeys || []),
            ...(wf.strategyBackupLlmKeys || []),
            ...(wf.topicAnalyzerBackupLlmKeys || [])
          ]);
          return Array.from(set);
        }
        if (llmTarget === 'Config: Primary LLM Master' || llmTarget === 'Config: Critic LLM Master (Primary)') {
          return wf.primaryLlmKeys || [];
        }
        if (llmTarget === 'Config: Backup LLM Master' || llmTarget === 'Config: Critic LLM Master (Backup)') {
          return wf.backupLlmKeys || [];
        }
        if (llmTarget === 'Config: Strategy Backup LLM Master') {
          return wf.strategyBackupLlmKeys || [];
        }
        if (llmTarget === 'Config: Topic Analyzer LLM Master') {
          return wf.topicAnalyzerLlmKeys || [];
        }
        if (llmTarget === 'Config: Topic Analyzer Backup LLM Master') {
          return wf.topicAnalyzerBackupLlmKeys || [];
        }
        return wf.primaryLlmKeys || [];
      };

      if (targetWorkflow === 'all') {
        const set = new Set();
        flagshipWorkflows.forEach(wf => {
          const arr = getKeysForWfAndTarget(wf);
          if (Array.isArray(arr)) arr.forEach(k => set.add(k));
        });
        return Array.from(set);
      } else {
        const targetWf = flagshipWorkflows.find(w => w.id === targetWorkflow);
        return getKeysForWfAndTarget(targetWf);
      }
    }
  }, [flagshipWorkflows, targetWorkflow, isLlm, isBackup, llmTarget]);

  const filteredActiveKeys = useMemo(() => {
    if (!keySearchTerm.trim()) return activeDisplayKeys;
    const term = keySearchTerm.toLowerCase().trim();
    return activeDisplayKeys.filter(k => k.toLowerCase().includes(term));
  }, [activeDisplayKeys, keySearchTerm]);

  // Detected key counts for inputs
  const detectedAppendCount = useMemo(() => {
    return keysInput
      .split(/[\r\n,;\s]+/)
      .map(k => k.replace(/["'\[\]]/g, '').trim())
      .filter(k => k.length > 5).length;
  }, [keysInput]);

  const detectedRemoveCount = useMemo(() => {
    return removeKeysInput
      .split(/[\r\n,;\s]+/)
      .map(k => k.replace(/["'\[\]]/g, '').trim())
      .filter(k => k.length > 5).length;
  }, [removeKeysInput]);

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

  // 2. Append API Keys
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
      `• Target Node(s): ${nodeTargetName}\n` +
      `• These keys will be added to the existing keys.\n` +
      `• Existing keys will be 100% PRESERVED.\n` +
      `• Keys will be backed up to MongoDB Atlas.`
    );
    if (!confirmed) return;

    setAppending(true);
    setLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 🚀 Initiating ${providerLabel} cloud synchronization...`,
      `[${new Date().toLocaleTimeString()}] Target: ${targetDesc}`,
      `[${new Date().toLocaleTimeString()}] Target Node(s): ${nodeTargetName}`,
      `[${new Date().toLocaleTimeString()}] Keys to inject: ${cleanKeys.length} keys`,
      `[${new Date().toLocaleTimeString()}] Connecting to n8n Cloud MCP Server at ${activeHost}...`
    ]);

    try {
      const res = isLlm
        ? await adminService.appendLlmKeys(targetWorkflow, cleanKeys, llmTarget)
        : await adminService.appendVideoKeys(targetWorkflow, cleanKeys, videoProvider);

      if (res.success && Array.isArray(res.results)) {
        const newLogs = [];
        res.results.forEach(r => {
          if (r.success) {
            if (r.nodeDetails && r.nodeDetails.length > 0) {
              r.nodeDetails.forEach(nd => {
                newLogs.push(`[${new Date().toLocaleTimeString()}] ✅ ${r.name}: ${nd.nodeName} -> Added ${nd.addedCount} new keys. Total active: ${nd.totalCount} keys.`);
              });
            } else {
              newLogs.push(`[${new Date().toLocaleTimeString()}] ✅ ${r.name} (${r.workflowId}): Added ${r.addedCount || cleanKeys.length} new keys. Total active: ${r.totalKeyCount || '?'} keys across ${r.nodesUpdated} Master config nodes.`);
            }
          } else {
            newLogs.push(`[${new Date().toLocaleTimeString()}] ❌ ${r.name} (${r.workflowId}): Failed - ${r.error}`);
          }
        });
        newLogs.push(`[${new Date().toLocaleTimeString()}] 💾 Master key pool safely synchronized with MongoDB Atlas.`);
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

  // 3. Remove API Keys
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
      `• Target Node(s): ${nodeTargetName}\n` +
      `• The key(s) will be completely removed from active rotation in n8n Cloud.\n` +
      `• MongoDB Atlas backup will be updated.`
    );
    if (!confirmed) return;

    setRemoving(true);
    setLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 🗑️ Initiating ${providerLabel} key removal pipeline...`,
      `[${new Date().toLocaleTimeString()}] Target: ${targetDesc}`,
      `[${new Date().toLocaleTimeString()}] Target Node(s): ${nodeTargetName}`,
      `[${new Date().toLocaleTimeString()}] Keys to remove: ${cleanKeys.length} key(s)`,
      `[${new Date().toLocaleTimeString()}] Connecting to n8n Cloud MCP Server at ${activeHost}...`
    ]);

    try {
      const res = isLlm
        ? await adminService.removeLlmKeys(targetWorkflow, cleanKeys, llmTarget)
        : await adminService.removeVideoKeys(targetWorkflow, cleanKeys, videoProvider);

      if (res.success && Array.isArray(res.results)) {
        const newLogs = [];
        res.results.forEach(r => {
          if (r.success) {
            if (r.nodeDetails && r.nodeDetails.length > 0) {
              r.nodeDetails.forEach(nd => {
                newLogs.push(`[${new Date().toLocaleTimeString()}] ✅ ${r.name}: ${nd.nodeName} -> Removed ${nd.removedCount} key(s). Remaining: ${nd.remainingCount} active keys.`);
              });
            } else {
              newLogs.push(`[${new Date().toLocaleTimeString()}] ✅ ${r.name} (${r.workflowId}): Removed ${r.removedCount} key(s). Remaining: ${r.remainingKeyCount} keys across ${r.nodesUpdated} node(s).`);
            }
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

  // 4. Auto-Detect Workflow IDs from active n8n instance
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

  return (
    <div className="admin-view-container" style={{ gap: '22px' }}>
      
      {/* 1. Sleek Modern Header */}
      <div className="admin-view-header" style={{
        padding: '20px 24px',
        borderRadius: '16px',
        background: 'var(--admin-bg-surface)',
        border: '1px solid var(--admin-border-glass)',
        boxShadow: 'var(--admin-card-shadow)',
        backdropFilter: 'blur(20px)',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 className="admin-view-title" style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>
              Workflow Cloud Manager
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }} />
              MCP Active
            </span>
          </div>
          <p className="admin-view-desc" style={{ fontSize: '12.5px', margin: 0 }}>
            Unified real-time cloud operations on <code style={{
              background: 'var(--admin-bg-elevated)',
              padding: '2px 6px',
              borderRadius: '6px',
              color: 'var(--admin-accent-cyan)',
              fontFamily: 'var(--admin-font-mono)'
            }}>{activeHost.replace('https://', '')}</code>
          </p>
        </div>

        {/* Global Action Controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleAutoDetectIds}
            disabled={detectingIds}
            className="admin-btn admin-btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Auto-detect workflow IDs on active n8n instance (useful after 14-day trial migrations)"
          >
            <span>🔍</span> {detectingIds ? 'Scanning...' : 'Auto-Detect IDs'}
          </button>

          <button
            type="button"
            onClick={() => fetchWorkflows(true)}
            disabled={syncingCloud || loading}
            className="admin-btn admin-btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ display: 'inline-block', transform: syncingCloud ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s ease' }}>🔄</span>
            {syncingCloud ? 'Syncing...' : 'Sync Cloud'}
          </button>

          {selectedWf && (
            <a
              href={selectedWf.n8nUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn"
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '9px',
                background: 'linear-gradient(135deg, var(--admin-accent-cyan) 0%, var(--admin-accent-blue) 100%)',
                color: '#fff',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.25)'
              }}
            >
              <span>↗</span> Open n8n Cloud
            </a>
          )}
        </div>
      </div>

      {/* Toast Alert Banner */}
      {toastMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: toastMsg.includes('⚠️') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          border: toastMsg.includes('⚠️') ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
          color: toastMsg.includes('⚠️') ? '#ef4444' : '#10b981',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          {toastMsg}
        </div>
      )}

      {/* 2. Sleek KPI Metrics Overview Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {/* KPI 1: Live Pipelines */}
        <div className="admin-kpi-card" style={{ padding: '16px 18px', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live Pipelines
            </span>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981'
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--admin-text-main)' }}>
              {liveCount} / {flagshipWorkflows.length}
            </span>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
              Active in Cloud
            </span>
          </div>
        </div>

        {/* KPI 2: Primary Kie.ai Keys */}
        <div className="admin-kpi-card" style={{ padding: '16px 18px', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Primary Video Keys
            </span>
            <span style={{ fontSize: '14px' }}>⚡</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--admin-accent-cyan)' }}>
              {totalPrimaryKeys}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)', fontWeight: 500 }}>
              Kie.ai 1080p keys
            </span>
          </div>
        </div>

        {/* KPI 3: Backup Video Keys */}
        <div className="admin-kpi-card" style={{ padding: '16px 18px', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Backup Video Keys
            </span>
            <span style={{ fontSize: '14px' }}>🛡️</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--admin-accent-purple)' }}>
              {totalBackupKeys}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)', fontWeight: 500 }}>
              Failover pool keys
            </span>
          </div>
        </div>

        {/* KPI 4: Primary LLM Keys */}
        <div className="admin-kpi-card" style={{ padding: '16px 18px', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Primary LLM Keys
            </span>
            <span style={{ fontSize: '14px' }}>🧠</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>
              {totalPrimaryLlmKeys}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)', fontWeight: 500 }}>
              Gemini & Analyzer
            </span>
          </div>
        </div>

        {/* KPI 5: Backup LLM Keys */}
        <div className="admin-kpi-card" style={{ padding: '16px 18px', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Backup LLM Keys
            </span>
            <span style={{ fontSize: '14px' }}>🛡️</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b' }}>
              {totalBackupLlmKeys}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)', fontWeight: 500 }}>
              Failover & Strategy
            </span>
          </div>
        </div>

        {/* KPI 6: Cloud Host */}
        <div className="admin-kpi-card" style={{ padding: '16px 18px', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Cloud Host
            </span>
            <span style={{ fontSize: '14px' }}>☁️</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: 'var(--admin-font-mono)',
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--admin-text-main)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {activeHost.replace('https://', '').split('.')[0]}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
              .app.n8n.cloud
            </span>
          </div>
        </div>
      </div>

      {/* 3. Flagship Production Pipelines (4 Modern Interactive Cards) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)', letterSpacing: '-0.01em' }}>
              Production Pipelines
            </h2>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'var(--admin-bg-elevated)',
              color: 'var(--admin-text-sub)'
            }}>
              4 Automated Workflows
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
            Click card to focus in key dispatcher below
          </span>
        </div>

        <div className="admin-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {flagshipWorkflows.map((wf) => {
            const isSelected = selectedWf?.id === wf.id;
            const isToggling = !!togglingPublish[wf.id];
            const isPublished = wf.published !== false && wf.status === 'ACTIVE';

            return (
              <div
                key={wf.id}
                onClick={() => {
                  handleSelectWorkflow(wf);
                  setTargetWorkflow(wf.id);
                }}
                className="admin-card"
                style={{
                  cursor: 'pointer',
                  padding: '20px',
                  borderRadius: '14px',
                  borderColor: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-border-glass)',
                  background: isSelected ? 'var(--admin-card-hover)' : 'var(--admin-bg-surface)',
                  boxShadow: isSelected ? '0 0 24px rgba(6, 182, 212, 0.16)' : 'var(--admin-card-shadow)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative'
                }}
              >
                {/* Top Badge Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'var(--admin-bg-elevated)',
                    color: 'var(--admin-text-sub)',
                    border: '1px solid var(--admin-border-glass)'
                  }}>
                    {wf.category || 'Automated Pipeline'}
                  </span>

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: isPublished ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    color: isPublished ? '#10b981' : '#f59e0b',
                    border: isPublished ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)'
                  }}>
                    <span style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: isPublished ? '#10b981' : '#f59e0b',
                      boxShadow: isPublished ? '0 0 6px #10b981' : 'none'
                    }} />
                    {isPublished ? 'ACTIVE' : 'DRAFT'}
                  </span>
                </div>

                {/* Workflow Title */}
                <h3 style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  margin: '0 0 10px 0',
                  color: isSelected ? 'var(--admin-accent-cyan)' : 'var(--admin-text-main)',
                  lineHeight: '1.4'
                }}>
                  {wf.name}
                </h3>

                {/* Metadata details */}
                <div style={{
                  fontSize: '11.5px',
                  color: 'var(--admin-text-sub)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  background: 'var(--admin-bg-elevated)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--admin-border-glass)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Workflow ID:</span>
                    <code style={{ fontFamily: 'var(--admin-font-mono)', color: 'var(--admin-text-main)', fontWeight: 600 }}>{wf.id}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Trigger:</span>
                    <span style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '11px', color: 'var(--admin-accent-cyan)' }}>
                      {wf.webhook ? (wf.webhook.split('/webhook')[1] || wf.webhook) : 'Webhook'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Node Count:</span>
                    <span style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>{wf.nodesCount} Nodes</span>
                  </div>
                </div>

                {/* Key Pool Counters */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <div style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Kie.ai:</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-accent-cyan)' }}>
                      {wf.kieKeysCount ?? '?'}
                    </span>
                  </div>

                  <div style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Backup:</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-accent-purple)' }}>
                      {wf.backupKeysCount ?? '?'}
                    </span>
                  </div>
                </div>

                {/* LLM Key Counters Row */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <div style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Primary LLM:</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981' }}>
                      {wf.primaryLlmCount ?? '?'}
                    </span>
                  </div>

                  <div style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Backup LLM:</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b' }}>
                      {wf.backupLlmCount ?? '?'}
                    </span>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '14px',
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
                      background: 'transparent',
                      border: '1px solid var(--admin-border-glass)',
                      color: 'var(--admin-text-main)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ↗ Cloud View
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
                      background: isPublished ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: isPublished ? '#ef4444' : '#10b981',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isToggling ? 'Syncing...' : (isPublished ? '⏸️ Unpublish' : '▶️ Publish')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Provider & LLM Engine Dispatcher & Key Vault (Unified Glass Card) */}
      <div className="admin-card" style={{
        padding: '24px',
        borderRadius: '16px',
        borderColor: isLlm
          ? (llmTarget.includes('primary') ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)')
          : (isBackup ? 'rgba(139, 92, 246, 0.3)' : 'rgba(6, 182, 212, 0.3)'),
        background: isLlm
          ? (llmTarget.includes('primary')
              ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, var(--admin-bg-surface) 100%)'
              : 'linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, var(--admin-bg-surface) 100%)')
          : (isBackup
              ? 'linear-gradient(180deg, rgba(139, 92, 246, 0.04) 0%, var(--admin-bg-surface) 100%)'
              : 'linear-gradient(180deg, rgba(6, 182, 212, 0.03) 0%, var(--admin-bg-surface) 100%)'),
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)'
      }}>
        
        {/* Master Category Selector (Video Providers vs LLM Engines) */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '5px',
          background: 'var(--admin-bg-elevated)',
          borderRadius: '12px',
          border: '1px solid var(--admin-border-glass)',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => {
              setManagerCategory('video');
              setKeySearchTerm('');
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: !isLlm ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
              background: !isLlm
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.18) 100%)'
                : 'transparent',
              color: !isLlm ? 'var(--admin-text-main)' : 'var(--admin-text-sub)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ fontSize: '15px' }}>🎬</span> Video Providers (Kie.ai & Backup)
          </button>

          <button
            type="button"
            onClick={() => {
              setManagerCategory('llm');
              setKeySearchTerm('');
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: isLlm ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
              background: isLlm
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(245, 158, 11, 0.18) 100%)'
                : 'transparent',
              color: isLlm ? 'var(--admin-text-main)' : 'var(--admin-text-sub)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ fontSize: '15px' }}>🧠</span> LLM Config Nodes (Primary, Backup, Critic & Analyzer)
          </button>
        </div>

        {/* Dispatcher Sub-Header & Controls */}
        {!isLlm ? (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--admin-border-glass)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{isBackup ? '🛡️' : '⚡'}</span>
                <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                  {isBackup ? 'Backup Video Provider Dispatcher' : 'Primary Video Provider Dispatcher (Kie.ai)'}
                </h2>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '4px 0 0 0' }}>
                Directly synchronize API rotation keys into <code>{nodeTargetName}</code> across all 5 scenes.
              </p>
            </div>

            {/* Video Provider Pill Switcher */}
            <div style={{
              display: 'flex',
              gap: '4px',
              padding: '4px',
              background: 'var(--admin-bg-elevated)',
              borderRadius: '12px',
              border: '1px solid var(--admin-border-glass)'
            }}>
              <button
                type="button"
                onClick={() => {
                  setVideoProvider('primary');
                  setKeySearchTerm('');
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: !isBackup ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                  color: !isBackup ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>⚡</span> Primary (Kie.ai 1080p)
              </button>

              <button
                type="button"
                onClick={() => {
                  setVideoProvider('backup');
                  setKeySearchTerm('');
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isBackup ? 'rgba(139, 92, 246, 0.22)' : 'transparent',
                  color: isBackup ? 'var(--admin-accent-purple)' : 'var(--admin-text-sub)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🛡️</span> Backup Video (Failover)
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--admin-border-glass)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>
                  {llmTarget.includes('primary') ? '⚡' : '🛡️'}
                </span>
                <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                  LLM Engine Master Dispatcher
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: (llmTarget.includes('primary') ? '#10b981' : '#f59e0b') + '22',
                  color: llmTarget.includes('primary') ? '#10b981' : '#f59e0b',
                  border: `1px solid ${llmTarget.includes('primary') ? '#10b981' : '#f59e0b'}44`
                }}>
                  {providerLabel}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '4px 0 0 0' }}>
                Target: <code>{nodeTargetName}</code>
              </p>
            </div>

            {/* Direct Batch 1-Click Selectors */}
            <div style={{
              display: 'flex',
              gap: '6px',
              padding: '4px',
              background: 'var(--admin-bg-elevated)',
              borderRadius: '12px',
              border: '1px solid var(--admin-border-glass)'
            }}>
              <button
                type="button"
                onClick={() => {
                  setLlmTarget('all_primary');
                  setKeySearchTerm('');
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: llmTarget === 'all_primary' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                  color: llmTarget === 'all_primary' ? '#10b981' : 'var(--admin-text-sub)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                title="Direct Batch: Sync all Primary LLM nodes at once across workflows"
              >
                <span>⚡</span> All Primary LLM Nodes
              </button>

              <button
                type="button"
                onClick={() => {
                  setLlmTarget('all_backup');
                  setKeySearchTerm('');
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: llmTarget === 'all_backup' ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
                  color: llmTarget === 'all_backup' ? '#f59e0b' : 'var(--admin-text-sub)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                title="Direct Batch: Sync all Backup LLM nodes at once across workflows"
              >
                <span>🛡️</span> All Backup LLM Nodes
              </button>
            </div>
          </div>
        )}

        {/* Action Controls Bar: Target Selector & Append vs Manage Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          margin: '18px 0 12px 0'
        }}>
          {/* Target Pipeline Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)', whiteSpace: 'nowrap' }}>
              Target Pipeline:
            </span>
            <select
              value={targetWorkflow}
              onChange={(e) => setTargetWorkflow(e.target.value)}
              className="admin-select"
              style={{
                padding: '8px 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                borderRadius: '9px',
                maxWidth: '460px'
              }}
            >
              <option value="all">
                🌟 All 4 Flagship Workflows (Simultaneous Cloud Push/Remove)
              </option>
              {flagshipWorkflows.map(wf => {
                let count = '?';
                if (!isLlm) {
                  count = isBackup ? wf.backupKeysCount : wf.kieKeysCount;
                } else {
                  if (llmTarget === 'all_primary') count = (wf.primaryLlmCount || 0) + (wf.topicAnalyzerCount || 0);
                  else if (llmTarget === 'all_backup') count = (wf.backupLlmCount || 0) + (wf.strategyBackupCount || 0) + (wf.topicAnalyzerBackupCount || 0);
                  else if (llmTarget === 'Config: Primary LLM Master' || llmTarget === 'Config: Critic LLM Master (Primary)') count = wf.primaryLlmCount;
                  else if (llmTarget === 'Config: Strategy Backup LLM Master') count = wf.strategyBackupCount;
                  else if (llmTarget === 'Config: Backup LLM Master' || llmTarget === 'Config: Critic LLM Master (Backup)') count = wf.backupLlmCount;
                  else if (llmTarget === 'Config: Topic Analyzer LLM Master') count = wf.topicAnalyzerCount;
                  else if (llmTarget === 'Config: Topic Analyzer Backup LLM Master') count = wf.topicAnalyzerBackupCount;
                }
                return (
                  <option key={wf.id} value={wf.id}>
                    {wf.name} ({count ?? '?'} active keys)
                  </option>
                );
              })}
            </select>
          </div>

          {/* If in LLM mode, show Target LLM Node Dropdown */}
          {isLlm && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)', whiteSpace: 'nowrap' }}>
                Target LLM Node:
              </span>
              <select
                value={llmTarget}
                onChange={(e) => {
                  setLlmTarget(e.target.value);
                  setKeySearchTerm('');
                }}
                className="admin-select"
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '9px',
                  maxWidth: '480px',
                  borderColor: providerAccent
                }}
              >
                <optgroup label="🌟 Direct Batch Options (Recommended)">
                  <option value="all_primary">
                    ⚡ [DIRECT BATCH] All Primary LLM Nodes (Primary Master + Topic Analyzer)
                  </option>
                  <option value="all_backup">
                    🛡️ [DIRECT BATCH] All Backup LLM Nodes (Backup Master + Strategy Backup + Topic Analyzer Backup)
                  </option>
                </optgroup>
                <optgroup label="⚙️ Template & Main Workflow Nodes">
                  <option value="Config: Primary LLM Master">
                    Config: Primary LLM Master (Gemini 2.5 Flash / Primary Model)
                  </option>
                  <option value="Config: Strategy Backup LLM Master">
                    Config: Strategy Backup LLM Master (GPT-5.1 Strategy Engine)
                  </option>
                  <option value="Config: Backup LLM Master">
                    Config: Backup LLM Master (Failover LLM Provider Pool)
                  </option>
                </optgroup>
                <optgroup label="🔬 Main Workflow Dedicated Nodes">
                  <option value="Config: Topic Analyzer LLM Master">
                    Config: Topic Analyzer LLM Master (Viral All-In-One AI)
                  </option>
                  <option value="Config: Topic Analyzer Backup LLM Master">
                    Config: Topic Analyzer Backup LLM Master (Viral All-In-One AI)
                  </option>
                </optgroup>
                <optgroup label="🔗 Dynamic Inherited Nodes">
                  <option value="Config: Critic LLM Master (Primary)">
                    Config: Critic LLM Master (Primary) [Inherits from Primary Master]
                  </option>
                  <option value="Config: Critic LLM Master (Backup)">
                    Config: Critic LLM Master (Backup) [Inherits from Backup Master]
                  </option>
                </optgroup>
              </select>
            </div>
          )}

          {/* Action Tabs: Append Keys vs Manage / Remove */}
          <div style={{
            display: 'flex',
            gap: '6px',
            background: 'var(--admin-bg-elevated)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--admin-border-glass)'
          }}>
            <button
              type="button"
              onClick={() => setActionTab('append')}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                border: 'none',
                background: actionTab === 'append' ? (providerAccent + '22') : 'transparent',
                color: actionTab === 'append' ? providerAccent : 'var(--admin-text-sub)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>➕</span> Add New Keys
            </button>

            <button
              type="button"
              onClick={() => setActionTab('manage')}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                border: 'none',
                background: actionTab === 'manage' ? 'rgba(239, 68, 68, 0.18)' : 'transparent',
                color: actionTab === 'manage' ? '#ef4444' : 'var(--admin-text-sub)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🗑️</span> Active Keys & Removal ({activeDisplayKeys.length})
            </button>
          </div>
        </div>

        {/* LLM Architecture Explanatory Callout Banner */}
        {isLlm && (
          <div style={{
            margin: '8px 0 16px 0',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '12px',
            lineHeight: '1.5',
            color: 'var(--admin-text-sub)'
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--admin-text-main)' }}>LLM Architecture Insight: </span>
              Physical API keys are stored in <code>Config: Primary LLM Master</code>, <code>Config: Strategy Backup LLM Master</code>, <code>Config: Backup LLM Master</code>, and the Topic Analyzer nodes.
              <code>Config: Critic LLM Master (Primary/Backup)</code> automatically and dynamically inherit keys from Primary & Backup LLM Masters at runtime.
              Selecting <strong>"All Primary LLM Nodes"</strong> or <strong>"All Backup LLM Nodes"</strong> directly injects or removes keys across all matching nodes simultaneously!
            </div>
          </div>
        )}

        {/* TAB 1: ADD / APPEND KEYS */}
        {actionTab === 'append' && (
          <form onSubmit={handleAppendKeys}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'var(--admin-bg-elevated)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--admin-border-glass)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                    Paste {providerLabel} API Keys:
                  </label>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: detectedAppendCount > 0 ? providerAccent : 'var(--admin-text-sub)'
                  }}>
                    {detectedAppendCount} new valid key{detectedAppendCount === 1 ? '' : 's'} detected
                  </span>
                </div>

                <textarea
                  value={keysInput}
                  onChange={(e) => setKeysInput(e.target.value)}
                  rows={4}
                  className="admin-textarea"
                  placeholder={
                    isLlm
                      ? (llmTarget.includes('primary') || llmTarget.includes('Primary')
                          ? "sk-xt-e2786f0d32f17f1a0211ec5f1333c45379691ec0d6f9c954\nsk-xt-450bf12af511af1eceb44dd398886c93a08b8bc52341e623"
                          : "93fa453252mshd676e411e75bd70p175580jsn4e69cd205b0a\neebced792emsh92d38cce4af7791p1609cfjsnac695534647")
                      : (isBackup
                          ? "sk-live-bc4a502645e8449d98e6b1e738ca3646d7c68093036cb7a8\nsk-live-41cf4f6c5650367c3ea805aa058897fb6464c0e25e282b65"
                          : "ad82c01b9b51720280eab511077d4242\nc60c4e8391441ef89abdd2dcbb9936fa")
                  }
                  style={{
                    fontFamily: 'var(--admin-font-mono)',
                    fontSize: '12.5px',
                    lineHeight: '1.6',
                    background: 'var(--admin-bg-surface)'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                    🛡️ Auto-deduplicates keys, preserves existing rotation, and backs up to MongoDB Atlas.
                  </span>

                  <button
                    type="submit"
                    disabled={appending || detectedAppendCount === 0}
                    className="admin-btn"
                    style={{
                      padding: '9px 20px',
                      borderRadius: '9px',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      color: '#fff',
                      background: isLlm
                        ? (llmTarget.includes('primary') || llmTarget.includes('Primary')
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')
                        : (isBackup
                            ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                            : 'linear-gradient(135deg, var(--admin-accent-cyan) 0%, var(--admin-accent-blue) 100%)'),
                      border: 'none',
                      cursor: (appending || detectedAppendCount === 0) ? 'not-allowed' : 'pointer',
                      opacity: (appending || detectedAppendCount === 0) ? 0.6 : 1,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                    }}
                  >
                    {appending ? 'Pushing to Cloud...' : `🚀 Push ${detectedAppendCount > 0 ? detectedAppendCount : ''} Keys to Cloud`}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: ACTIVE KEYS & REMOVAL */}
        {actionTab === 'manage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Search Filter Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'var(--admin-bg-elevated)',
              border: '1px solid var(--admin-border-glass)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
                <input
                  type="text"
                  value={keySearchTerm}
                  onChange={(e) => setKeySearchTerm(e.target.value)}
                  placeholder={`🔍 Filter keys...`}
                  className="admin-input"
                  style={{
                    padding: '7px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    maxWidth: '360px',
                    background: 'var(--admin-bg-surface)'
                  }}
                />
                {keySearchTerm && (
                  <button
                    type="button"
                    onClick={() => setKeySearchTerm('')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(255,255,255,0.08)',
                      color: 'var(--admin-text-sub)',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)', fontWeight: 600 }}>
                  Showing {filteredActiveKeys.length} of {activeDisplayKeys.length} keys
                </span>
                <button
                  type="button"
                  onClick={() => fetchWorkflows(true)}
                  disabled={syncingCloud}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '11.5px', borderRadius: '7px' }}
                >
                  {syncingCloud ? 'Syncing...' : '🔄 Refresh'}
                </button>
              </div>
            </div>

            {/* Active Keys List */}
            <div style={{
              maxHeight: '280px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingRight: '4px'
            }}>
              {filteredActiveKeys.length === 0 ? (
                <div style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  color: 'var(--admin-text-sub)',
                  fontSize: '12.5px',
                  border: '1px dashed var(--admin-border-glass)',
                  borderRadius: '10px',
                  background: 'var(--admin-bg-elevated)'
                }}>
                  {activeDisplayKeys.length === 0
                    ? `No active ${providerLabel} keys found for this workflow. Click "Refresh" or add keys using the Add New Keys tab.`
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
                        padding: '8px 14px',
                        borderRadius: '9px',
                        background: 'var(--admin-bg-elevated)',
                        border: '1px solid var(--admin-border-glass)',
                        fontSize: '12px',
                        gap: '12px',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <span style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: 'var(--admin-text-sub)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          {String(idx + 1).padStart(2, '0')}
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
                            padding: '4px 9px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: '1px solid var(--admin-border-glass)',
                            color: isCopied ? '#10b981' : 'var(--admin-text-sub)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
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
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
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

            {/* Bulk Removal Drawer */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.03)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>
                  Bulk Remove (Paste Multiple Keys Below):
                </span>
                <span style={{ fontSize: '11px', color: detectedRemoveCount > 0 ? '#ef4444' : 'var(--admin-text-sub)', fontWeight: 600 }}>
                  {detectedRemoveCount} keys to remove
                </span>
              </div>
              <textarea
                value={removeKeysInput}
                onChange={(e) => setRemoveKeysInput(e.target.value)}
                rows={2}
                className="admin-textarea"
                placeholder="Paste keys to remove (one per line, or separated by commas)..."
                style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12px', background: 'var(--admin-bg-surface)' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                  ⚠️ Only exact matching keys will be deleted. All other keys remain intact.
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveKeys(removeKeysInput, 'bulk')}
                  disabled={removing || detectedRemoveCount === 0}
                  className="admin-btn"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '7px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: (removing || detectedRemoveCount === 0) ? 'not-allowed' : 'pointer',
                    opacity: (removing || detectedRemoveCount === 0) ? 0.6 : 1
                  }}
                >
                  {removing ? 'Removing...' : `🗑️ Remove ${detectedRemoveCount > 0 ? detectedRemoveCount : ''} Keys`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Sleek Live MCP Execution Terminal */}
        {logs.length > 0 && (
          <div style={{
            marginTop: '18px',
            borderRadius: '12px',
            background: '#070a12',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Terminal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 14px',
              background: '#0d111a',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{
                  fontFamily: 'var(--admin-font-mono)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: 'var(--admin-text-sub)',
                  letterSpacing: '0.06em'
                }}>
                  LIVE MCP DISPATCH CONSOLE ({logs.length} EVENTS)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--admin-text-sub)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    padding: '2px 6px'
                  }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--admin-text-sub)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    padding: '2px 6px'
                  }}
                >
                  {isConsoleExpanded ? 'Minimize' : 'Expand'}
                </button>
              </div>
            </div>

            {/* Terminal Output */}
            {isConsoleExpanded && (
              <div style={{
                padding: '12px 14px',
                fontFamily: 'var(--admin-font-mono)',
                fontSize: '11.5px',
                lineHeight: '1.6',
                maxHeight: '160px',
                overflowY: 'auto'
              }}>
                {logs.map((log, idx) => (
                  <div key={idx} style={{
                    color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#34d399' : log.includes('⚠️') ? '#f59e0b' : '#38bdf8',
                    padding: '1px 0'
                  }}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
