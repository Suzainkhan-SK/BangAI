import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../adminService';

export default function StockStudioManagerView() {
  const [data, setData] = useState({
    users: [],
    videos: [],
    clusterHealth: [],
    activeCluster: 'cmpunktg',
    kpis: {
      totalVideos: 0,
      completedVideos: 0,
      renderingVideos: 0,
      failedVideos: 0,
      totalUsers: 0,
      activeClusterOnline: false
    }
  });

  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [switchingCluster, setSwitchingCluster] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  // Active view tab: 'videos' (Video Generation Vault) | 'automations' (24h Autopilot Automations) | 'users' (Creators Analytics)
  const [activeTab, setActiveTab] = useState('videos');

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'rendering' | 'failed'
  const [creditFilter, setCreditFilter] = useState('all'); // 'all' | 'bang_credits' | 'byok'
  const [selectedUserFilter, setSelectedUserFilter] = useState('');

  // Modals state
  const [playingVideo, setPlayingVideo] = useState(null);
  const [viewingSettings, setViewingSettings] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Live Terminal Logs & Task Purging State
  const [liveTerminalTask, setLiveTerminalTask] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [terminalLoading, setTerminalLoading] = useState(false);
  const [terminalAutoRefresh, setTerminalAutoRefresh] = useState(true);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  // ── Stock Studio 24-Hour Automations State ──
  const [automations, setAutomations] = useState([]);
  const [automationsStats, setAutomationsStats] = useState({
    total: 0,
    active: 0,
    paused: 0,
    totalQueuedTopics: 0,
    totalRuns: 0
  });
  const [loadingAutomations, setLoadingAutomations] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [editTopicsText, setEditTopicsText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  const fetchTerminalLogs = async (taskId, silent = false) => {
    if (!taskId) return;
    if (!silent) setTerminalLoading(true);
    try {
      const res = await adminService.getStockStudioTaskLogs(taskId);
      if (res && res.success) {
        const logsList = res.logs || (res.text ? res.text.split('\n') : []);
        setTerminalLogs(logsList);
      }
    } catch (e) {
      if (!silent) console.warn('Failed to fetch terminal logs:', e.message);
    } finally {
      if (!silent) setTerminalLoading(false);
    }
  };

  const handleOpenLiveTerminal = (task) => {
    setLiveTerminalTask(task);
    setTerminalLogs([]);
    fetchTerminalLogs(task.id || task.task_id);
  };

  // Poll terminal logs every 2s for active tasks
  useEffect(() => {
    let interval = null;
    if (liveTerminalTask && terminalAutoRefresh) {
      interval = setInterval(() => {
        fetchTerminalLogs(liveTerminalTask.id || liveTerminalTask.task_id, true);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [liveTerminalTask, terminalAutoRefresh]);

  const handleDeleteTask = async (taskId) => {
    if (!taskId) return;
    if (!window.confirm(`Permanently delete video generation task ${taskId} and all its artifacts from Modal volume?`)) {
      return;
    }
    setDeletingTaskId(taskId);
    setToastMsg(`Deleting task ${taskId}...`);
    try {
      const res = await adminService.adminDeleteStockStudioTask(taskId);
      if (res && res.success) {
        setToastMsg(`✅ Task ${taskId} permanently deleted.`);
        if (liveTerminalTask && (liveTerminalTask.id === taskId || liveTerminalTask.task_id === taskId)) {
          setLiveTerminalTask(null);
        }
        fetchStockStudioData(true);
      } else {
        setToastMsg(`⚠️ Failed to delete task: ${res?.error || 'Unknown error'}`);
      }
    } catch (e) {
      setToastMsg(`⚠️ Delete error: ${e.message}`);
    } finally {
      setDeletingTaskId(null);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const fetchStockStudioData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminService.getStockStudioDetails();
      if (res && res.success) {
        const videos = res.videos || [];
        setData({
          users: res.users || [],
          videos,
          clusterHealth: res.clusterHealth || [],
          activeCluster: res.activeCluster || 'cmpunktg',
          kpis: res.kpis || {
            totalVideos: videos.length,
            completedVideos: videos.filter(v => v.status === 'completed' && v.videoUrl).length,
            renderingVideos: videos.filter(v => v.status === 'rendering').length,
            failedVideos: videos.filter(v => v.status === 'failed').length,
            totalUsers: res.users?.length || 0,
            activeClusterOnline: res.clusterHealth?.some(c => c.isActive && c.online) || false
          }
        });
      }
    } catch (e) {
      console.warn('Error fetching Stock Studio data:', e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchAutomations = async (silent = false) => {
    if (!silent) setLoadingAutomations(true);
    try {
      const res = await adminService.getAllStockStudioAutomations();
      if (res && res.success) {
        setAutomations(res.automations || []);
        if (res.stats) setAutomationsStats(res.stats);
      }
    } catch (e) {
      console.warn('Error fetching Stock Studio automations:', e.message);
    } finally {
      if (!silent) setLoadingAutomations(false);
    }
  };

  useEffect(() => {
    fetchStockStudioData();
    fetchAutomations();
  }, []);

  // Real-time auto-refresh interval when enabled
  useEffect(() => {
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchStockStudioData(true);
        if (activeTab === 'automations') fetchAutomations(true);
      }, 8000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, activeTab]);

  const handleSwitchCluster = async (targetId) => {
    if (!window.confirm(`Switch active Modal GPU Render cluster to [${targetId.toUpperCase()}]?\n\nTraffic from Stock Studio and MoneyPrinterTurbo will redirect to this cluster instantly.`)) {
      return;
    }
    setSwitchingCluster(true);
    setToastMsg(`Switching active cluster to ${targetId}...`);
    try {
      const res = await adminService.switchModalCluster(targetId);
      if (res && res.success) {
        setToastMsg(`✅ Active Modal cluster successfully switched to ${targetId.toUpperCase()}!`);
        fetchStockStudioData();
      } else {
        setToastMsg(`⚠️ Switch failed: ${res?.error || 'Unknown error'}`);
      }
    } catch (e) {
      setToastMsg(`⚠️ Switch error: ${e.message}`);
    } finally {
      setSwitchingCluster(false);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('🧹 Clear all video material caches, temp files, and purge failed tasks from the active Modal volume?\n\nThis will safely reclaim cloud storage and clean all failed video render records.')) {
      return;
    }
    setClearingCache(true);
    setToastMsg('🧹 Clearing Modal caches and purging failed tasks...');
    try {
      const res = await adminService.clearStockStudioCache();
      if (res && res.success) {
        const d = res.modalResult || {};
        setToastMsg(`✅ Cache cleared! Purged ${d.purged_failed_tasks || 0} failed task(s), deleted ${d.deleted_cache_files || 0} cache file(s), and reclaimed ${d.reclaimed_mb || 0} MB.`);
        fetchStockStudioData();
      } else {
        setToastMsg(`⚠️ Cache clear warning: ${res?.error || 'Unknown response'}`);
      }
    } catch (err) {
      setToastMsg(`⚠️ Error clearing cache: ${err.message}`);
    } finally {
      setClearingCache(false);
      setTimeout(() => setToastMsg(''), 5000);
    }
  };

  const handleCopyLink = (url, id) => {
    if (!url) return;
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setToastMsg('📋 Video URL copied to clipboard!');
    setTimeout(() => {
      setCopiedId(null);
      setToastMsg('');
    }, 2500);
  };

  // ── Admin Actions on Automations ──
  const handleAdminToggleAutomation = async (automationId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await adminService.adminToggleStockStudioAutomation(automationId, newStatus);
      if (res && res.success) {
        setToastMsg(`⚡ Stock Studio Automation ${newStatus === 'ACTIVE' ? 'activated' : 'paused'} successfully!`);
        fetchAutomations(true);
      } else {
        setToastMsg(`⚠️ Error: ${res?.error || 'Failed to toggle status'}`);
      }
    } catch (err) {
      setToastMsg(`⚠️ Error: ${err.message}`);
    }
  };

  const handleAdminRunNow = async (automationId, userEmail) => {
    if (!window.confirm(`⚡ Immediately trigger 24h Autopilot video generation for ${userEmail}?\n\nThis will pick the next queued topic, render on Modal GPU, and auto-upload to their connected YouTube channel.`)) {
      return;
    }
    setToastMsg(`⏳ Launching Autopilot video generation for ${userEmail}...`);
    try {
      const res = await adminService.adminRunStockStudioAutomation(automationId);
      if (res && res.success) {
        setToastMsg(`✅ Video for "${res.topic}" successfully dispatched for ${userEmail}!`);
        fetchAutomations(true);
        fetchStockStudioData(true);
      } else {
        setToastMsg(`⚠️ Dispatch failed: ${res?.error || 'Unknown error'}`);
      }
    } catch (err) {
      setToastMsg(`⚠️ Error: ${err.message}`);
    }
  };

  const handleAdminDeleteAutomation = async (automationId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete the Stock Studio Automation for ${userEmail}? This will stop all future 24h runs.`)) {
      return;
    }
    try {
      const res = await adminService.adminDeleteStockStudioAutomation(automationId);
      if (res && res.success) {
        setToastMsg(`🗑️ Automation for ${userEmail} deleted.`);
        fetchAutomations(true);
      } else {
        setToastMsg(`⚠️ Delete failed: ${res?.error || 'Unknown error'}`);
      }
    } catch (err) {
      setToastMsg(`⚠️ Error: ${err.message}`);
    }
  };

  const handleSaveEditedTopics = async () => {
    if (!editingAutomation) return;
    setSavingEdit(true);
    try {
      const parsedTopics = editTopicsText.split('\n').map(t => t.trim()).filter(Boolean);
      const res = await adminService.adminUpdateStockStudioAutomation(editingAutomation.id, {
        upcomingTopics: parsedTopics
      });
      if (res && res.success) {
        setToastMsg(`✅ Topics updated for ${editingAutomation.userEmail}! (${parsedTopics.length} topics)`);
        setEditingAutomation(null);
        fetchAutomations(true);
      } else {
        setToastMsg(`⚠️ Update failed: ${res?.error || 'Unknown error'}`);
      }
    } catch (err) {
      setToastMsg(`⚠️ Error: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Filtered Videos List (completed, active renders, and failed tasks)
  const filteredVideos = useMemo(() => {
    return (data.videos || []).filter(v => {
      if (selectedUserFilter && v.userEmail !== selectedUserFilter && v.userId !== selectedUserFilter) {
        return false;
      }
      if (statusFilter === 'completed' && (!v.videoUrl || v.status !== 'completed')) {
        return false;
      }
      if (statusFilter === 'rendering' && v.status !== 'rendering') {
        return false;
      }
      if (statusFilter === 'failed' && v.status !== 'failed') {
        return false;
      }
      if (creditFilter === 'bang_credits' && v.creditMode !== 'bang_credits') {
        return false;
      }
      if (creditFilter === 'byok' && v.creditMode !== 'byok') {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const titleMatch = (v.title || '').toLowerCase().includes(term);
        const emailMatch = (v.userEmail || '').toLowerCase().includes(term);
        const nameMatch = (v.userName || '').toLowerCase().includes(term);
        const idMatch = (v.id || '').toLowerCase().includes(term);
        return titleMatch || emailMatch || nameMatch || idMatch;
      }
      return true;
    });
  }, [data.videos, selectedUserFilter, statusFilter, creditFilter, searchTerm]);

  // Filtered Automations List
  const filteredAutomations = useMemo(() => {
    return (automations || []).filter(a => {
      if (statusFilter === 'active' && a.status !== 'ACTIVE') return false;
      if (statusFilter === 'paused' && a.status !== 'PAUSED') return false;
      if (creditFilter === 'bang_credits' && a.creditMode === 'byok') return false;
      if (creditFilter === 'byok' && a.creditMode !== 'byok') return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const emailMatch = (a.userEmail || '').toLowerCase().includes(term);
        const nameMatch = (a.userName || '').toLowerCase().includes(term);
        const channelMatch = (a.channelTitle || '').toLowerCase().includes(term);
        const topicsMatch = (a.upcomingTopics || []).some(t => t.toLowerCase().includes(term));
        return emailMatch || nameMatch || channelMatch || topicsMatch;
      }
      return true;
    });
  }, [automations, statusFilter, creditFilter, searchTerm]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return data.users || [];
    const term = searchTerm.toLowerCase();
    return (data.users || []).filter(u =>
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.id || '').toLowerCase().includes(term)
    );
  }, [data.users, searchTerm]);

  const activeCluster = data.activeCluster || 'cmpunktg';

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Stock Studio Video Management & Analytics</h1>
          <p className="admin-view-desc">
            Monitor real-time user video renders, inspect applied creation settings, view Bang API Credits vs BYOK usage, stream completed MP4s, manage 24-hour Autopilot automations, and manage Modal GPU cluster failover.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Live Auto-Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="admin-btn"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '8px',
              border: autoRefresh ? '1px solid #10b981' : '1px solid var(--admin-border-glass)',
              background: autoRefresh ? 'rgba(16, 185, 129, 0.15)' : 'var(--admin-bg-surface)',
              color: autoRefresh ? '#10b981' : 'var(--admin-text-sub)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: autoRefresh ? '#10b981' : '#64748b',
              boxShadow: autoRefresh ? '0 0 8px #10b981' : 'none'
            }} />
            <span>{autoRefresh ? 'Live Sync (8s) Active' : 'Enable Live Sync'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchStockStudioData();
              fetchAutomations();
            }}
            disabled={loading || loadingAutomations}
            className="admin-btn admin-btn-secondary"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
          <button
            type="button"
            onClick={handleClearCache}
            disabled={clearingCache || loading}
            className="admin-btn"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontWeight: 700,
              fontSize: '12.5px',
              padding: '7px 14px',
              borderRadius: '8px',
              cursor: clearingCache ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Clean failed tasks and free up cloud temp cache storage"
          >
            <span>{clearingCache ? '🧹 Purging...' : '🧹 Clear Caches'}</span>
          </button>
          <a
            href="https://cmpunktg--bangai-stock-studio-ui.modal.run"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn admin-btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>↗ Open Stock Studio Web UI</span>
          </a>
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
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '16px'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Modal Cluster Health & Fast Failover Bar */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
              ⚡ Modal GPU Cloud Clusters:
            </span>
            {(data.clusterHealth || []).map(cluster => {
              const isActive = activeCluster === cluster.id;
              return (
                <div
                  key={cluster.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(6, 182, 212, 0.12)' : 'var(--admin-bg-surface)',
                    border: isActive ? '1px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)'
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: cluster.online ? '#10b981' : '#ef4444',
                    boxShadow: cluster.online ? '0 0 6px #10b981' : 'none'
                  }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                    {cluster.name || cluster.id}
                  </span>
                  <span style={{ fontSize: '11px', color: cluster.online ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {cluster.online ? `${cluster.latencyMs}ms` : 'Offline'}
                  </span>
                  {isActive ? (
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'var(--admin-accent-cyan)', color: '#000' }}>
                      ACTIVE
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSwitchCluster(cluster.id)}
                      disabled={switchingCluster}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--admin-border-glass)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: 'var(--admin-text-sub)',
                        cursor: 'pointer'
                      }}
                    >
                      Set Active
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
            System Video Engine: <strong style={{ color: '#10b981' }}>Stock Studio Pipeline + 24h Autopilot</strong>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="admin-grid admin-grid-6" style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Stock Studio Videos
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--admin-text-main)', marginTop: '6px' }}>
            {data.kpis.totalVideos}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            Pure Stock Studio tasks only
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Completed & Playable
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981', marginTop: '6px' }}>
            {data.kpis.completedVideos}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            Ready for streaming & download
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Real-Time Rendering
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#06b6d4', marginTop: '6px' }}>
            {data.kpis.renderingVideos || (data.videos.filter(v => v.status === 'rendering').length)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            Active pipeline processing
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active 24h Autopilots
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--admin-accent-purple)', marginTop: '6px' }}>
            {automationsStats.active}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            {automationsStats.totalQueuedTopics} topics queued in total
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            YouTube Channels Connected
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#ef4444', marginTop: '6px' }}>
            {data.users.reduce((sum, u) => sum + (u.channelCount || (u.youtubeChannels ? u.youtubeChannels.length : 0)), 0) || (automations.filter(a => a.hasChannel).length)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            Studio YouTube Cloud accounts
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Stock Studio Creators
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#f59e0b', marginTop: '6px' }}>
            {data.kpis.totalUsers}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            Users with studio activity
          </div>
        </div>
      </div>

      {/* Main Content Card with Navigation Tabs */}
      <div className="admin-card">
        {/* Navigation Tabs & Search Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          marginBottom: '16px',
          borderBottom: '1px solid var(--admin-border-glass)'
        }}>
          {/* Left: View Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--admin-bg-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--admin-border-glass)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'videos' ? 'var(--admin-accent-cyan)' : 'transparent',
                color: activeTab === 'videos' ? '#000' : 'var(--admin-text-sub)',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🎬 Stock Studio Generations</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: activeTab === 'videos' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)'
              }}>
                {filteredVideos.length}
              </span>
            </button>

            {/* TAB 2: AUTONOMOUS 24H AUTOPILOT */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('automations');
                fetchAutomations();
              }}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'automations' ? 'var(--admin-accent-purple)' : 'transparent',
                color: activeTab === 'automations' ? '#fff' : 'var(--admin-text-sub)',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🤖 24h Autopilot Automations</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: activeTab === 'automations' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.08)'
              }}>
                {automations.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'users' ? '#f59e0b' : 'transparent',
                color: activeTab === 'users' ? '#000' : 'var(--admin-text-sub)',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>👥 Creator Stats & Quotas</span>
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: activeTab === 'users' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)'
              }}>
                {filteredUsers.length}
              </span>
            </button>
          </div>

          {/* Right: Filters & Search */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {activeTab === 'videos' && (
              <>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { id: 'all', label: 'All Tasks' },
                    { id: 'completed', label: 'Playable' },
                    { id: 'rendering', label: '⚡ Rendering' },
                    { id: 'failed', label: '⚠️ Failed' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setStatusFilter(filter.id)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '11.5px',
                        borderRadius: '6px',
                        border: statusFilter === filter.id ? '1px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                        background: statusFilter === filter.id ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                        color: statusFilter === filter.id ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { id: 'all', label: 'All Modes' },
                    { id: 'bang_credits', label: '⚡ Bang Credits' },
                    { id: 'byok', label: '🔑 BYOK' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setCreditFilter(filter.id)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '11.5px',
                        borderRadius: '6px',
                        border: creditFilter === filter.id ? '1px solid var(--admin-accent-purple)' : '1px solid var(--admin-border-glass)',
                        background: creditFilter === filter.id ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                        color: creditFilter === filter.id ? 'var(--admin-accent-purple)' : 'var(--admin-text-sub)',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'automations' && (
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { id: 'all', label: 'All Automations' },
                  { id: 'active', label: '● Active (24h)' },
                  { id: 'paused', label: 'Paused' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setStatusFilter(filter.id)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11.5px',
                      borderRadius: '6px',
                      border: statusFilter === filter.id ? '1px solid var(--admin-accent-purple)' : '1px solid var(--admin-border-glass)',
                      background: statusFilter === filter.id ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                      color: statusFilter === filter.id ? 'var(--admin-accent-purple)' : 'var(--admin-text-sub)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}

            {selectedUserFilter && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                fontSize: '11.5px',
                color: 'var(--admin-accent-purple)'
              }}>
                <span>User: {selectedUserFilter}</span>
                <button
                  type="button"
                  onClick={() => setSelectedUserFilter('')}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 800 }}
                >
                  ✕
                </button>
              </div>
            )}

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by subject, email, or topic..."
              className="admin-input"
              style={{ width: '240px', fontSize: '12px', padding: '6px 10px' }}
            />
          </div>
        </div>

        {/* TAB 1: STOCK STUDIO GENERATED VIDEOS VAULT */}
        {activeTab === 'videos' && (
          <div>
            {loading ? (
              <div style={{ padding: '50px', textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '13px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                Loading Stock Studio generations from Modal GPU volume...
              </div>
            ) : filteredVideos.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '13px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                No Stock Studio video generations found matching your filters.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredVideos.map((video) => {
                  const isCompleted = video.status === 'completed' && video.videoUrl;
                  const isFailed = video.status === 'failed';
                  const isRendering = video.status === 'rendering' || (!isCompleted && !isFailed);
                  const isBangCredits = video.creditMode === 'bang_credits';

                  return (
                    <div
                      key={video.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: 'var(--admin-bg-surface)',
                        border: isRendering
                          ? '1px solid rgba(6, 182, 212, 0.4)'
                          : (isFailed ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--admin-border-glass)'),
                        boxShadow: isRendering ? '0 0 15px rgba(6, 182, 212, 0.08)' : 'none',
                        gap: '12px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 360px' }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '10px',
                            background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : (isFailed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            flexShrink: 0,
                            border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : (isFailed ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)')
                          }}>
                            {isCompleted ? '🎬' : (isFailed ? '⚠️' : '⚡')}
                          </div>

                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--admin-text-main)', marginBottom: '4px' }}>
                              {video.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                {video.userAvatar ? (
                                  <img src={video.userAvatar} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                                ) : (
                                  <span>👤</span>
                                )}
                                <strong style={{ color: 'var(--admin-text-main)' }}>{video.userName}</strong>
                                <span>({video.userEmail})</span>
                              </span>
                              <span>•</span>
                              <span>{new Date(video.createdAt).toLocaleDateString()} {new Date(video.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>•</span>
                              <span style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '11px' }}>ID: {video.id.slice(0, 16)}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {/* Language Badge */}
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            background: 'rgba(99, 102, 241, 0.12)',
                            color: '#818cf8',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>🌐</span>
                            <span>{video.video_language === 'hi-IN' || video.video_language === 'hi' || video.video_language === 'Hindi' ? 'Hindi (हिन्दी)' : (video.video_language || 'Hindi (हिन्दी)')}</span>
                          </span>

                          {/* Connected YouTube Channel Badge */}
                          {video.youtube_channel_title && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 9px',
                              borderRadius: '12px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <span>📺</span>
                              <span>{video.youtube_channel_title}</span>
                            </span>
                          )}

                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            background: isBangCredits ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isBangCredits ? 'var(--admin-accent-cyan)' : 'var(--admin-accent-amber)',
                            border: isBangCredits ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>{isBangCredits ? '⚡' : '🔑'}</span>
                            <span>{isBangCredits ? 'Bang API Credits' : 'BYOK Keys'}</span>
                          </span>

                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : (isFailed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)'),
                            color: isCompleted ? '#10b981' : (isFailed ? '#ef4444' : '#06b6d4'),
                            border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : (isFailed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(6, 182, 212, 0.3)')}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            {isRendering && <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', animation: 'pulse 1.5s infinite' }}>●</span>}
                            <span>{isCompleted ? 'COMPLETED (100%)' : (isFailed ? `FAILED • ${video.failedStage || video.currentStep || 'PIPELINE'}` : `RENDERING (${video.progress}%)`)}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setViewingSettings(video);
                              setShowRawJson(false);
                            }}
                            className="admin-btn admin-btn-secondary"
                            style={{
                              padding: '5px 12px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: 'var(--admin-bg-surface)',
                              border: '1px solid var(--admin-border-glass)'
                            }}
                          >
                            <span>⚙️ Applied Settings & Mode</span>
                          </button>

                          {/* Live Terminal Logs Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenLiveTerminal(video)}
                            className="admin-btn"
                            style={{
                              padding: '5px 12px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: isRendering ? 'rgba(6, 182, 212, 0.2)' : 'var(--admin-bg-surface)',
                              border: isRendering ? '1px solid #06b6d4' : '1px solid var(--admin-border-glass)',
                              color: isRendering ? '#06b6d4' : 'var(--admin-text-main)',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title="Inspect live real-time terminal output and GPU execution logs"
                          >
                            <span>📟 Live Terminal</span>
                            {isRendering && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }}>●</span>}
                          </button>

                          {/* 1-Click Delete Task Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(video.id)}
                            disabled={deletingTaskId === video.id}
                            className="admin-btn"
                            style={{
                              padding: '5px 9px',
                              fontSize: '11.5px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title="Permanently delete task and all files from Modal volume"
                          >
                            {deletingTaskId === video.id ? '⏳' : '🗑️'}
                          </button>

                          {video.videoUrl ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setPlayingVideo(video)}
                                className="admin-btn"
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>▶️ Watch Video</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyLink(video.videoUrl, video.id)}
                                className="admin-btn admin-btn-secondary"
                                style={{ fontSize: '11px', padding: '5px 8px' }}
                                title="Copy MP4 direct link"
                              >
                                {copiedId === video.id ? '✓ Copied' : '📋 Copy URL'}
                              </button>

                              <a
                                href={video.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-btn admin-btn-secondary"
                                style={{ fontSize: '11px', padding: '5px 8px', textDecoration: 'none' }}
                                title="Open in new tab"
                              >
                                ↗ Open
                              </a>
                            </>
                          ) : null}

                          {/* Direct YouTube Link and Actions */}
                          {video.youtube_url ? (
                            <>
                              <a
                                href={video.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-btn"
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  textDecoration: 'none',
                                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                                }}
                                title="Watch uploaded video directly on YouTube"
                              >
                                <span>🎬 View on YouTube</span>
                                <span>↗</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => handleCopyLink(video.youtube_url, `yt_${video.id}`)}
                                className="admin-btn admin-btn-secondary"
                                style={{ fontSize: '11px', padding: '5px 8px', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#ef4444' }}
                                title="Copy YouTube Video URL"
                              >
                                {copiedId === `yt_${video.id}` ? '✓ Copied YT Link' : '📋 Copy YouTube Link'}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>

                      {/* Real-time Rendering Progress Bar */}
                      {isRendering && (
                        <div style={{
                          background: 'rgba(6, 182, 212, 0.05)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(6, 182, 212, 0.15)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', marginBottom: '6px' }}>
                            <span style={{ color: 'var(--admin-accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>⚡ Live GPU Render:</span>
                              <strong>{video.currentStep || 'Processing video pipeline...'}</strong>
                            </span>
                            <span style={{ color: 'var(--admin-text-main)', fontWeight: 800 }}>
                              {video.progress}%
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.max(video.progress, 6)}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #06b6d4, #a855f7)',
                              borderRadius: '3px',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>
                        </div>
                      )}

                      {/* Failure Alert Box */}
                      {isFailed && (
                        <div style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '10px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ fontSize: '12px', color: '#ef4444' }}>
                            <strong>Render stopped at stage [{video.failedStage || video.currentStep || 'pipeline'}]:</strong>{' '}
                            <span style={{ color: 'var(--admin-text-sub)' }}>{video.error || 'Execution encountered an unexpected pipeline error.'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setViewingSettings(video);
                              setShowRawJson(false);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--admin-accent-cyan)',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            Inspect Trace & Settings →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AUTONOMOUS 24H AUTOPILOT AUTOMATIONS (ADMIN GOVERNANCE) */}
        {activeTab === 'automations' && (
          <div>
            {loadingAutomations ? (
              <div style={{ padding: '50px', textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '13px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
                Loading Stock Studio 24-hour Autopilot automations...
              </div>
            ) : filteredAutomations.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '13px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                No Stock Studio automations found matching your search.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredAutomations.map((item) => {
                  const isActive = item.status === 'ACTIVE';
                  const topics = item.upcomingTopics || [];
                  const isBangCredits = item.creditMode !== 'byok';

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'var(--admin-bg-surface)',
                        border: isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--admin-border-glass)',
                        boxShadow: isActive ? '0 0 16px rgba(16, 185, 129, 0.08)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {/* Top Row: User details & Status Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {item.userAvatar ? (
                            <img src={item.userAvatar} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                              {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                              {item.userName}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                              {item.userEmail}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {/* Status Badge */}
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                            color: isActive ? '#10b981' : 'var(--admin-text-sub)',
                            border: isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--admin-border-glass)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#10b981' : '#64748b', animation: isActive ? 'pulse 1.5s infinite' : 'none' }}>●</span>
                            <span>{isActive ? '● ACTIVE (24h RUN)' : 'PAUSED'}</span>
                          </span>

                          {/* Credit Mode */}
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            background: isBangCredits ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isBangCredits ? 'var(--admin-accent-cyan)' : 'var(--admin-accent-amber)',
                            border: isBangCredits ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)'
                          }}>
                            {isBangCredits ? '⚡ Bang API Credits' : '🔑 BYOK Keys'}
                          </span>

                          {/* Language Setting Badge */}
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            background: 'rgba(99, 102, 241, 0.12)',
                            color: '#818cf8',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>🌐</span>
                            <span>{item.settings?.video_language === 'hi-IN' || item.settings?.video_language === 'Hindi' ? 'Hindi (हिन्दी)' : (item.settings?.video_language || 'Hindi (हिन्दी)')}</span>
                          </span>

                          {/* YouTube Connected Channels Status & Active Target Channel */}
                          {item.channels && item.channels.length > 0 ? (
                            item.channels.map((ch, chIdx) => {
                              const isTarget = ch.isTarget || ch.channelId === item.selectedChannelId || (!item.selectedChannelId && (ch.isDefault || chIdx === 0));
                              return (
                                <span key={chIdx} style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '3px 10px',
                                  borderRadius: '12px',
                                  background: isTarget ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                                  color: isTarget ? '#10b981' : '#ef4444',
                                  border: isTarget ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(239, 68, 68, 0.25)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}>
                                  <span>{isTarget ? '🎯 Target:' : '📺'}</span>
                                  <span>{ch.channelTitle}</span>
                                  {isTarget && (
                                    <span style={{ fontSize: '9.5px', background: '#10b981', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 900 }}>
                                      AUTOPILOT TARGET
                                    </span>
                                  )}
                                </span>
                              );
                            })
                          ) : (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: '12px',
                              background: item.hasChannel ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                              color: item.hasChannel ? '#10b981' : 'var(--admin-text-sub)',
                              border: item.hasChannel ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--admin-border-glass)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <span>📺</span>
                              <span>{item.hasChannel ? `🎯 ${item.channelTitle}` : 'No Channel Connected'}</span>
                            </span>
                          )}

                          {/* Live Modal Render Status Badge */}
                          {item.lastTaskId && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: '12px',
                              background: item.lastTaskStatus === 'rendering' ? 'rgba(6, 182, 212, 0.15)' : (item.lastTaskStatus === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
                              color: item.lastTaskStatus === 'rendering' ? '#06b6d4' : (item.lastTaskStatus === 'failed' ? '#ef4444' : '#10b981'),
                              border: item.lastTaskStatus === 'rendering' ? '1px solid rgba(6, 182, 212, 0.4)' : (item.lastTaskStatus === 'failed' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'),
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: item.lastTaskStatus === 'rendering' ? '#06b6d4' : (item.lastTaskStatus === 'failed' ? '#ef4444' : '#10b981'),
                                boxShadow: item.lastTaskStatus === 'rendering' ? '0 0 6px #06b6d4' : 'none'
                              }} />
                              <span>
                                {item.lastTaskStatus === 'rendering'
                                  ? `⚡ Rendering (${item.lastTaskProgress || 50}%)`
                                  : (item.lastTaskStatus === 'failed' ? '⚠️ Last Render Failed' : '✅ Render Complete')}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Topics in Queue */}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--admin-border-glass)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--admin-accent-cyan)' }}>
                            📋 Upcoming Topics Queue ({topics.length} topics)
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                            Total Runs Completed: <strong style={{ color: '#10b981' }}>{item.totalRuns || (item.completedTopics?.length || 0)}</strong>
                          </span>
                        </div>

                        {topics.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {topics.slice(0, 5).map((t, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '11px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: idx === 0 ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                  border: idx === 0 ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid var(--admin-border-glass)',
                                  color: idx === 0 ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)'
                                }}
                              >
                                {idx === 0 ? '▶ Next: ' : `${idx + 1}. `}{t}
                              </span>
                            ))}
                            {topics.length > 5 && (
                              <span style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--admin-text-sub)', fontStyle: 'italic' }}>
                                +{topics.length - 5} more topics
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#f59e0b', fontStyle: 'italic' }}>
                            ⚠️ No upcoming topics queued. Autopilot will use default daily topics.
                          </span>
                        )}

                        {/* Last Run Topic, Task ID, Video Stream & YouTube link */}
                        {(item.lastTopic || item.lastTaskId || item.lastYoutubeUrl || item.lastVideoUrl) && (
                          <div style={{
                            marginTop: '10px',
                            paddingTop: '8px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                                🎬 Last Run Topic: <strong style={{ color: 'var(--admin-text-main)' }}>{item.lastTopic || 'Autonomous Video'}</strong>
                              </span>
                              {item.lastTaskId && (
                                <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)', background: 'rgba(255, 255, 255, 0.05)', padding: '1px 6px', borderRadius: '4px' }}>
                                  ID: {item.lastTaskId.slice(0, 8)}...
                                </span>
                              )}
                              {item.lastTaskStep && item.lastTaskStatus === 'rendering' && (
                                <span style={{ fontSize: '11px', color: '#06b6d4', fontStyle: 'italic' }}>
                                  • {item.lastTaskStep}
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              {/* Live Logs Terminal Button */}
                              {item.lastTaskId && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenLiveTerminal({ id: item.lastTaskId, title: item.lastTopic || 'Stock Studio Run' })}
                                  className="admin-btn"
                                  style={{
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    background: 'rgba(6, 182, 212, 0.15)',
                                    color: 'var(--admin-accent-cyan)',
                                    border: '1px solid rgba(6, 182, 212, 0.35)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Inspect live generation terminal logs from Modal volume"
                                >
                                  <span>🖥️ Live Logs</span>
                                </button>
                              )}

                              {/* Preview Playable MP4 Video */}
                              {item.lastVideoUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPlayingVideo({ url: item.lastVideoUrl, title: item.lastTopic || 'Autonomous Video' })}
                                  className="admin-btn"
                                  style={{
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.35)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <span>▶️ Preview Video</span>
                                </button>
                              )}

                              {/* View on YouTube */}
                              {item.lastYoutubeUrl && (
                                <a
                                  href={item.lastYoutubeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="admin-btn"
                                  style={{
                                    fontSize: '11px',
                                    padding: '3px 10px',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: '#fff',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    borderRadius: '6px',
                                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
                                  }}
                                >
                                  <span>🎬 View on YouTube</span>
                                  <span>↗</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expandable Run History Drawer */}
                      {expandedHistoryId === item.id && (
                        <div style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(6, 182, 212, 0.25)',
                          animation: 'fadeIn 0.2s ease-in-out'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-accent-cyan)' }}>
                              📜 Past Execution History ({item.completedTopics?.length || 0} runs)
                            </span>
                            <button
                              type="button"
                              onClick={() => setExpandedHistoryId(null)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-sub)', fontSize: '11px', cursor: 'pointer' }}
                            >
                              ✕ Close History
                            </button>
                          </div>

                          {(!item.completedTopics || item.completedTopics.length === 0) ? (
                            <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontStyle: 'italic' }}>
                              No past executions recorded yet. Dispatches will appear here with permanent video & YouTube links.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {[...item.completedTopics].reverse().map((run, rIdx) => (
                                <div
                                  key={rIdx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    fontSize: '11px',
                                    flexWrap: 'wrap',
                                    gap: '6px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#10b981', fontWeight: 800 }}>#{item.completedTopics.length - rIdx}</span>
                                    <strong style={{ color: 'var(--admin-text-main)' }}>{run.topic}</strong>
                                    {run.dispatchedAt && (
                                      <span style={{ color: 'var(--admin-text-sub)' }}>
                                        ({new Date(run.dispatchedAt).toLocaleString()})
                                      </span>
                                    )}
                                    {run.taskId && (
                                      <span
                                        onClick={() => handleCopyLink(run.taskId, `hist-${rIdx}`)}
                                        style={{ cursor: 'pointer', color: 'var(--admin-accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '1px 5px', borderRadius: '4px' }}
                                        title="Click to copy Task ID"
                                      >
                                        📋 {run.taskId.slice(0, 8)}...
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    {run.channelTitle && (
                                      <span style={{ color: 'var(--admin-text-sub)', fontSize: '10.5px' }}>
                                        📺 {run.channelTitle}
                                      </span>
                                    )}
                                    {run.videoUrl && (
                                      <button
                                        type="button"
                                        onClick={() => setPlayingVideo({ url: run.videoUrl, title: run.topic })}
                                        style={{ background: 'transparent', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', borderRadius: '4px', padding: '1px 6px', fontSize: '10.5px', cursor: 'pointer' }}
                                      >
                                        ▶️ Preview
                                      </button>
                                    )}
                                    {run.youtubeUrl ? (
                                      <a
                                        href={run.youtubeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#ef4444', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                      >
                                        <span>🎬 YouTube</span>
                                        <span>↗</span>
                                      </a>
                                    ) : (
                                      <span style={{ color: 'var(--admin-text-sub)', fontSize: '10.5px' }}>No YouTube Link</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom Row: Next Run & Admin Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                          <span>Last Run: {item.lastRunAt ? new Date(item.lastRunAt).toLocaleString() : 'Never'}</span>
                          <span style={{ margin: '0 8px' }}>•</span>
                          <span>Next Run: <strong style={{ color: isActive ? '#10b981' : 'var(--admin-text-sub)' }}>{item.nextRunAt ? new Date(item.nextRunAt).toLocaleString() : 'Paused'}</strong></span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {/* Toggle Run History Drawer */}
                          <button
                            type="button"
                            onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                            className="admin-btn admin-btn-secondary"
                            style={{
                              fontSize: '11px',
                              padding: '4px 10px',
                              border: expandedHistoryId === item.id ? '1px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                              color: expandedHistoryId === item.id ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)'
                            }}
                          >
                            <span>📜 History ({item.completedTopics?.length || 0})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAdminToggleAutomation(item.id, item.status)}
                            className="admin-btn admin-btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 10px' }}
                          >
                            {isActive ? '⏸️ Pause' : '▶️ Resume'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAdminRunNow(item.id, item.userEmail)}
                            className="admin-btn"
                            style={{
                              fontSize: '11px',
                              padding: '4px 10px',
                              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                          >
                            ⚡ Run Now
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingAutomation(item);
                              setEditTopicsText((item.upcomingTopics || []).join('\n'));
                            }}
                            className="admin-btn admin-btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 10px' }}
                          >
                            ⚙️ Inspect & Edit Topics
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAdminDeleteAutomation(item.id, item.userEmail)}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CREATOR STATS & QUOTAS */}
        {activeTab === 'users' && (
          <div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '13px' }}>
                Loading Stock Studio creators...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '13px' }}>
                No creators found matching your search.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--admin-border-glass)', color: 'var(--admin-text-sub)' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Creator</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Plan / Tier</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Connected YouTube Channels</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Stock Studio Generations</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Credits Balance</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Last Active</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.id || u.email}
                        style={{
                          borderBottom: '1px solid var(--admin-border-glass)',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '13px'
                              }}>
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--admin-text-main)' }}>{u.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '12px' }}>
                          <span className="admin-badge admin-badge-purple">
                            {u.tier}
                          </span>
                        </td>

                        <td style={{ padding: '12px' }}>
                          {u.youtubeChannels && u.youtubeChannels.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {u.youtubeChannels.map((c, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    width: 'fit-content'
                                  }}
                                >
                                  <span>📺</span>
                                  <strong style={{ color: 'var(--admin-text-main)' }}>{c.channelTitle}</strong>
                                  {c.channelId && (
                                    <span style={{ fontSize: '10px', opacity: 0.7, fontFamily: 'var(--admin-font-mono)' }}>
                                      ({c.channelId.slice(0, 10)}...)
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                              No channel connected
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '12px' }}>
                          <span style={{
                            fontWeight: 800,
                            color: u.videoCount > 0 ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)',
                            fontSize: '13px'
                          }}>
                            {u.videoCount} {u.videoCount === 1 ? 'generation' : 'generations'}
                          </span>
                        </td>

                        <td style={{ padding: '12px' }}>
                          <span style={{ fontWeight: 800, color: '#10b981' }}>
                            {u.credits} credits
                          </span>
                        </td>

                        <td style={{ padding: '12px', fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                          {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Inactive'}
                        </td>

                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserFilter(u.email);
                              setActiveTab('videos');
                            }}
                            className="admin-btn admin-btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 10px' }}
                          >
                            🎬 View User's Videos
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADMIN EDIT TOPICS & AUTOMATION MODAL */}
      {editingAutomation && (
        <div
          onClick={() => setEditingAutomation(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              background: 'var(--admin-bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--admin-border-glass)',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--admin-border-glass)'
            }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--admin-text-main)', margin: 0 }}>
                  ⚙️ Admin: Inspect & Edit Topics Queue
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
                  Creator: {editingAutomation.userName} ({editingAutomation.userEmail})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingAutomation(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', color: 'var(--admin-text-sub)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-text-main)', display: 'block', marginBottom: '6px' }}>
                  Upcoming Video Topics (1 Per Line):
                </label>
                <textarea
                  value={editTopicsText}
                  onChange={(e) => setEditTopicsText(e.target.value)}
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--admin-border-glass)',
                    background: 'var(--admin-bg-surface)',
                    color: 'var(--admin-text-main)',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Execution Logs Preview */}
              {editingAutomation.executionLogs && editingAutomation.executionLogs.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-accent-cyan)', marginBottom: '6px' }}>
                    Recent Execution Logs:
                  </div>
                  <div style={{
                    maxHeight: '140px',
                    overflowY: 'auto',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--admin-border-glass)',
                    fontSize: '11px',
                    fontFamily: 'var(--admin-font-mono)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {editingAutomation.executionLogs.map((log, idx) => (
                      <div key={idx} style={{ color: log.status === 'failed' ? '#ef4444' : '#94a3b8' }}>
                        [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px',
              borderTop: '1px solid var(--admin-border-glass)',
              background: 'var(--admin-bg-surface)'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                Status: {editingAutomation.status}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingAutomation(null)}
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedTopics}
                  disabled={savingEdit}
                  className="admin-btn admin-btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  {savingEdit ? 'Saving...' : 'Save Topics Queue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLIED SETTINGS & CREDIT MODE MODAL */}
      {viewingSettings && (
        <div
          onClick={() => setViewingSettings(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              background: 'var(--admin-bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--admin-border-glass)',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--admin-border-glass)',
              position: 'sticky',
              top: 0,
              background: 'var(--admin-bg-card)',
              zIndex: 2
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--admin-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚙️ Applied Video Settings & Mode</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
                  Task: <strong style={{ color: 'var(--admin-accent-cyan)' }}>{viewingSettings.title}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingSettings(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', color: 'var(--admin-text-sub)', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: viewingSettings.creditMode === 'bang_credits' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: viewingSettings.creditMode === 'bang_credits' ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{ fontSize: '24px' }}>
                  {viewingSettings.creditMode === 'bang_credits' ? '⚡' : '🔑'}
                </div>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: viewingSettings.creditMode === 'bang_credits' ? 'var(--admin-accent-cyan)' : 'var(--admin-accent-amber)',
                    marginBottom: '2px'
                  }}>
                    {viewingSettings.creditMode === 'bang_credits'
                      ? '⚡ Mode: Bang API Credits (System Rotated Keys)'
                      : '🔑 Mode: BYOK (Bring Your Own Key)'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', lineHeight: '1.4' }}>
                    {viewingSettings.creditMode === 'bang_credits'
                      ? 'This video was rendered utilizing the BangAI Platform API Credits pool. API calls to Gemini LLM, ElevenLabs (json2video), and Stock footage sources (Pexels / Pixabay) were automatically serviced by server-side key rotators with automatic failover.'
                      : 'This video was rendered using the creator\'s personal API keys provided in the request payload. No system Bang API Credits were deducted for third-party API usage.'}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'var(--admin-bg-surface)',
                border: '1px solid var(--admin-border-glass)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Execution Status
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--admin-text-main)', marginTop: '2px' }}>
                    {viewingSettings.status === 'completed' ? '✅ Completed (100%)' : (viewingSettings.status === 'failed' ? '⚠️ Failed' : `⚡ Rendering (${viewingSettings.progress}%)`)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Current Pipeline Step
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--admin-accent-cyan)', marginTop: '2px' }}>
                    {viewingSettings.currentStep || 'None'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Creator
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--admin-text-main)', marginTop: '2px' }}>
                    {viewingSettings.userName}
                  </div>
                </div>
              </div>

              {viewingSettings.status === 'failed' && (
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#ef4444' }}>
                    ⚠️ Pipeline Error Trace (Stage: {viewingSettings.failedStage || viewingSettings.currentStep || 'materials'}):
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-main)', fontFamily: 'var(--admin-font-mono)', background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '6px', wordBreak: 'break-all' }}>
                    {viewingSettings.error || 'Unknown error occurred during rendering'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
                    💡 <strong>Resolution:</strong> If this error was caused by a stock footage key 401, verify that valid Pexels or Pixabay API keys are added in the <strong>Dynamic Keys Vault</strong>. Automatic cross-provider failover is now active.
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-glass)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📝 Script & Prompt AI</span>
                  </div>
                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--admin-text-sub)' }}>
                    <div>Subject: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.video_subject || viewingSettings.title}</strong></div>
                    <div>Language: <strong style={{ color: 'var(--admin-accent-cyan)' }}>{viewingSettings.video_language === 'hi-IN' || viewingSettings.video_language === 'Hindi' ? 'Hindi (हिन्दी)' : (viewingSettings.video_language || viewingSettings.settings?.video_language || 'Hindi (हिन्दी)')}</strong></div>
                    <div>LLM Engine: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.script_engine || 'gemini'}</strong></div>
                    <div>Model: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.script_model || 'gemini-2.5-flash'}</strong></div>
                    <div>Paragraph Count: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.paragraph_number || 2}</strong></div>
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-glass)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-accent-purple)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎙️ Neural Voice & Speech</span>
                  </div>
                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--admin-text-sub)' }}>
                    <div>Voice Provider: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.voice_provider || 'ElevenLabs / json2video'}</strong></div>
                    <div>Voice Name: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.voice_name || 'Adam'}</strong></div>
                    <div>Voice Speed: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.voice_speed || 1.1}x</strong></div>
                    <div>BGM Volume: <strong style={{ color: 'var(--admin-text-main)' }}>{Math.round((viewingSettings.settings?.bgm_volume || 0.1) * 100)}%</strong></div>
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-glass)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎞️ Stock Footage & Composition</span>
                  </div>
                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--admin-text-sub)' }}>
                    <div>Footage Source: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.video_source || 'pexels'} (Pexels / Pixabay)</strong></div>
                    <div>Aspect Ratio: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.video_aspect || '9:16'} (Vertical Shorts)</strong></div>
                    <div>Script-Order Matching: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.match_materials_to_script !== false ? 'Enabled' : 'Disabled'}</strong></div>
                    <div>Timeline Auto-Sync: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.auto_timeline_sync !== false ? 'Enabled' : 'Disabled'}</strong></div>
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-glass)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-accent-amber)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💬 Subtitles & Durations</span>
                  </div>
                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--admin-text-sub)' }}>
                    <div>Subtitle Preset: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.subtitle_preset || 'mrbeast-viral'}</strong></div>
                    <div>Font Size: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.font_size || 50}px</strong></div>
                    <div>Target Duration: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.duration || 60} seconds</strong></div>
                    <div>Output Format: <strong style={{ color: 'var(--admin-text-main)' }}>MP4 (H.264 / AAC)</strong></div>
                  </div>
                </div>

                {/* YouTube Publishing Card */}
                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-glass)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📺 YouTube Publishing</span>
                  </div>
                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--admin-text-sub)' }}>
                    <div>Connected Channel: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.youtube_channel_title || 'Auto-Detected Channel'}</strong></div>
                    <div>Channel ID: <strong style={{ color: 'var(--admin-text-main)', fontFamily: 'var(--admin-font-mono)', fontSize: '11px' }}>{viewingSettings.youtube_channel_id || 'System Linked'}</strong></div>
                    <div>
                      Upload Status:{' '}
                      {viewingSettings.youtube_url ? (
                        <span style={{ color: '#10b981', fontWeight: 800 }}>Uploaded to YouTube</span>
                      ) : (
                        <span style={{ color: 'var(--admin-text-sub)' }}>Not uploaded / Local Render</span>
                      )}
                    </div>
                    {viewingSettings.youtube_url && (
                      <div style={{ marginTop: '4px' }}>
                        <a
                          href={viewingSettings.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '11px',
                            color: '#ef4444',
                            fontWeight: 800,
                            textDecoration: 'underline',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>🎬 Watch on YouTube ↗</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--admin-border-glass)', paddingTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--admin-accent-cyan)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{showRawJson ? '▼ Hide' : '▶ Show'} Complete Raw JSON Settings</span>
                </button>

                {showRawJson && (
                  <pre style={{
                    marginTop: '10px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--admin-border-glass)',
                    fontSize: '11px',
                    color: '#94a3b8',
                    fontFamily: 'var(--admin-font-mono)',
                    overflowX: 'auto',
                    maxHeight: '200px'
                  }}>
                    {JSON.stringify(viewingSettings.settings || viewingSettings, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px',
              borderTop: '1px solid var(--admin-border-glass)',
              background: 'var(--admin-bg-surface)'
            }}>
              <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                Stock Studio Modal Container Task
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                {viewingSettings.videoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlayingVideo(viewingSettings);
                      setViewingSettings(null);
                    }}
                    className="admin-btn admin-btn-primary"
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    ▶️ Watch Rendered Video
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingSettings(null)}
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Video Player Modal */}
      {playingVideo && (
        <div
          onClick={() => setPlayingVideo(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--admin-bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--admin-border-glass)',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 18px',
              borderBottom: '1px solid var(--admin-border-glass)'
            }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--admin-text-main)', margin: 0 }}>
                  {playingVideo.title}
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                  Creator: {playingVideo.userName} ({playingVideo.userEmail})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  color: 'var(--admin-text-sub)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <video
                src={playingVideo.videoUrl}
                controls
                autoPlay
                style={{
                  maxHeight: '65vh',
                  width: 'auto',
                  maxWidth: '100%',
                  aspectRatio: '9 / 16',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 18px',
              borderTop: '1px solid var(--admin-border-glass)',
              background: 'var(--admin-bg-surface)'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                Direct Modal GPU MP4 Stream
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCopyLink(playingVideo.videoUrl, playingVideo.id)}
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '11px', padding: '5px 10px' }}
                >
                  {copiedId === playingVideo.id ? '✓ Copied' : '📋 Copy URL'}
                </button>
                <a
                  href={playingVideo.videoUrl}
                  download
                  className="admin-btn admin-btn-primary"
                  style={{ fontSize: '11px', padding: '5px 10px', textDecoration: 'none' }}
                >
                  ⬇️ Download MP4
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: LIVE TERMINAL LOGS VIEWER */}
      {liveTerminalTask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLiveTerminalTask(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '850px',
              height: '80vh',
              maxHeight: '800px',
              background: '#0d1117',
              borderRadius: '14px',
              border: '1px solid rgba(56, 139, 253, 0.4)',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(6, 182, 212, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            }}
          >
            {/* Terminal Window Header Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 18px',
                background: '#161b22',
                borderBottom: '1px solid #30363d'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Traffic lights */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
                </div>
                <div style={{ marginLeft: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f0f6fc' }}>
                    {liveTerminalTask.title}
                  </span>
                  <span style={{ fontSize: '11px', color: '#8b949e', marginLeft: '10px' }}>
                    task_id: {liveTerminalTask.id}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: liveTerminalTask.status === 'completed' ? 'rgba(35, 134, 54, 0.25)' : (liveTerminalTask.status === 'failed' ? 'rgba(218, 54, 51, 0.25)' : 'rgba(56, 139, 253, 0.25)'),
                  color: liveTerminalTask.status === 'completed' ? '#3fb950' : (liveTerminalTask.status === 'failed' ? '#f85149' : '#58a6ff'),
                  border: `1px solid ${liveTerminalTask.status === 'completed' ? 'rgba(63, 185, 80, 0.4)' : (liveTerminalTask.status === 'failed' ? 'rgba(248, 81, 73, 0.4)' : 'rgba(88, 166, 255, 0.4)')}`
                }}>
                  {liveTerminalTask.status ? liveTerminalTask.status.toUpperCase() : 'UNKNOWN'}
                </span>

                <button
                  type="button"
                  onClick={() => setLiveTerminalTask(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '18px',
                    color: '#8b949e',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-header info banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 18px',
                background: '#0d1117',
                borderBottom: '1px solid #21262d',
                fontSize: '11px',
                color: '#8b949e',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div>
                <span>User: <strong style={{ color: '#c9d1d9' }}>{liveTerminalTask.userName}</strong> ({liveTerminalTask.userEmail})</span>
                <span style={{ margin: '0 8px' }}>•</span>
                <span>Stage: <strong style={{ color: '#58a6ff' }}>{liveTerminalTask.currentStep || 'Processing'}</strong></span>
                <span style={{ margin: '0 8px' }}>•</span>
                <span>Progress: <strong style={{ color: '#3fb950' }}>{liveTerminalTask.progress}%</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none', fontSize: '11px', color: '#c9d1d9' }}>
                  <input
                    type="checkbox"
                    checked={terminalAutoRefresh}
                    onChange={(e) => setTerminalAutoRefresh(e.target.checked)}
                    style={{ accentColor: '#58a6ff' }}
                  />
                  <span>Live 2s Stream</span>
                </label>
                <button
                  type="button"
                  onClick={() => fetchTerminalLogs(liveTerminalTask.id)}
                  disabled={terminalLoading}
                  style={{
                    background: '#21262d',
                    border: '1px solid #30363d',
                    color: '#c9d1d9',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {terminalLoading ? '⏳ Refreshing...' : '🔄 Refresh'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyLink(terminalLogs.join('\n'), `logs_${liveTerminalTask.id}`)}
                  style={{
                    background: '#21262d',
                    border: '1px solid #30363d',
                    color: copiedId === `logs_${liveTerminalTask.id}` ? '#3fb950' : '#c9d1d9',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {copiedId === `logs_${liveTerminalTask.id}` ? '✓ Copied' : '📋 Copy All Logs'}
                </button>
              </div>
            </div>

            {/* Terminal Output Log Area */}
            <div
              style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                fontSize: '12px',
                lineHeight: '1.6',
                color: '#c9d1d9',
                background: '#0d1117'
              }}
            >
              {terminalLogs.length === 0 ? (
                <div style={{ color: '#8b949e', fontStyle: 'italic', padding: '20px 0' }}>
                  {terminalLoading ? 'Loading real-time terminal execution logs from Modal GPU cluster...' : 'No logs recorded yet for this task.'}
                </div>
              ) : (
                terminalLogs.map((line, idx) => {
                  let lineCol = '#c9d1d9';
                  if (line.includes('[ERROR]') || line.includes('Error') || line.includes('FAILED') || line.includes('Exception')) {
                    lineCol = '#f85149';
                  } else if (line.includes('[WARNING]') || line.includes('WARN')) {
                    lineCol = '#d29922';
                  } else if (line.includes('[INFO]') || line.includes('SUCCESS') || line.includes('100%')) {
                    lineCol = '#3fb950';
                  } else if (line.includes('DEBUG') || line.includes('task_id=')) {
                    lineCol = '#58a6ff';
                  }
                  return (
                    <div key={idx} style={{ color: lineCol, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                      <span style={{ color: '#484f58', userSelect: 'none', marginRight: '10px' }}>
                        {String(idx + 1).padStart(3, '0')}
                      </span>
                      {line}
                    </div>
                  );
                })
              )}
            </div>

            {/* Terminal Footer */}
            <div
              style={{
                padding: '10px 18px',
                background: '#161b22',
                borderTop: '1px solid #30363d',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ fontSize: '11px', color: '#8b949e' }}>
                Cluster: <span style={{ color: '#58a6ff' }}>{liveTerminalTask.cluster || activeCluster}</span> • Total Lines: {terminalLogs.length}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleDeleteTask(liveTerminalTask.id)}
                  style={{
                    background: 'rgba(218, 54, 51, 0.2)',
                    border: '1px solid rgba(248, 81, 73, 0.4)',
                    color: '#f85149',
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Delete Task
                </button>
                <button
                  type="button"
                  onClick={() => setLiveTerminalTask(null)}
                  style={{
                    background: '#21262d',
                    border: '1px solid #30363d',
                    color: '#f0f6fc',
                    fontSize: '11px',
                    padding: '4px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

