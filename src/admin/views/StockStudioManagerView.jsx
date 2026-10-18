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

  // Active view tab: 'videos' (Video Generation Vault) | 'users' (Creators Analytics)
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

  useEffect(() => {
    fetchStockStudioData();
  }, []);

  // Real-time auto-refresh interval when enabled
  useEffect(() => {
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchStockStudioData(true);
      }, 8000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

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

  // Filtered Videos List
  const filteredVideos = useMemo(() => {
    return (data.videos || []).filter(v => {
      // User filter
      if (selectedUserFilter && v.userEmail !== selectedUserFilter && v.userId !== selectedUserFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'completed' && (!v.videoUrl || v.status !== 'completed')) {
        return false;
      }
      if (statusFilter === 'rendering' && v.status !== 'rendering') {
        return false;
      }
      if (statusFilter === 'failed' && v.status !== 'failed') {
        return false;
      }
      // Credit Mode filter
      if (creditFilter === 'bang_credits' && v.creditMode !== 'bang_credits') {
        return false;
      }
      if (creditFilter === 'byok' && v.creditMode !== 'byok') {
        return false;
      }
      // Search term
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
            Monitor real-time user video renders, inspect applied creation settings, view Bang API Credits vs BYOK usage, stream completed MP4s, and manage Modal GPU cluster failover.
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
            onClick={() => fetchStockStudioData()}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
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
            System Video Engine: <strong style={{ color: '#10b981' }}>Isolated Stock Studio Pipeline</strong>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="admin-grid admin-grid-5" style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
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
            Failed Tasks
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#ef4444', marginTop: '6px' }}>
            {data.kpis.failedVideos || (data.videos.filter(v => v.status === 'failed').length)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            Stopped at pipeline stage
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Stock Studio Creators
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--admin-accent-purple)', marginTop: '6px' }}>
            {data.kpis.totalUsers}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            Users with generation records
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

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'users' ? 'var(--admin-accent-purple)' : 'transparent',
                color: activeTab === 'users' ? '#fff' : 'var(--admin-text-sub)',
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
                {/* Status Filter */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { id: 'all', label: 'All Status' },
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

                {/* Credit Mode Filter */}
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
              placeholder="Search by subject, email, or task ID..."
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
                      {/* Top Row: Info & Badges & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        {/* Left: Video Details */}
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

                        {/* Right: Badges & Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {/* Credit Mode Badge */}
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

                          {/* Status Badge */}
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

                          {/* Applied Settings Button */}
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

                          {/* Video Player Action */}
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

        {/* TAB 2: CREATOR STATS & QUOTAS */}
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
                        {/* Creator */}
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
                                justifyCenter: 'center',
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

                        {/* Tier */}
                        <td style={{ padding: '12px' }}>
                          <span className="admin-badge admin-badge-purple">
                            {u.tier}
                          </span>
                        </td>

                        {/* Videos Generated */}
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            fontWeight: 800,
                            color: u.videoCount > 0 ? 'var(--admin-accent-cyan)' : 'var(--admin-text-sub)',
                            fontSize: '13px'
                          }}>
                            {u.videoCount} {u.videoCount === 1 ? 'generation' : 'generations'}
                          </span>
                        </td>

                        {/* Credits Balance */}
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontWeight: 800, color: '#10b981' }}>
                            {u.credits} credits
                          </span>
                        </td>

                        {/* Last Active */}
                        <td style={{ padding: '12px', fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
                          {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Inactive'}
                        </td>

                        {/* Actions */}
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
            {/* Modal Header */}
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

            {/* Modal Content */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Credit Mode Banner */}
              <div style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: viewingSettings.creditMode === 'bang_credits'
                  ? 'rgba(6, 182, 212, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)',
                border: viewingSettings.creditMode === 'bang_credits'
                  ? '1px solid rgba(6, 182, 212, 0.35)'
                  : '1px solid rgba(245, 158, 11, 0.35)',
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

              {/* Execution Status Card */}
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

              {/* Error Detail (if failed) */}
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

              {/* Settings Visual Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {/* 1. Script & LLM */}
                <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-glass)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-accent-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📝 Script & Prompt AI</span>
                  </div>
                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--admin-text-sub)' }}>
                    <div>Subject: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.video_subject || viewingSettings.title}</strong></div>
                    <div>LLM Engine: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.script_engine || 'gemini'}</strong></div>
                    <div>Model: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.script_model || 'gemini-2.5-flash'}</strong></div>
                    <div>Paragraph Count: <strong style={{ color: 'var(--admin-text-main)' }}>{viewingSettings.settings?.paragraph_number || 2}</strong></div>
                  </div>
                </div>

                {/* 2. Neural Voice & Audio */}
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

                {/* 3. Footage & Aspect Ratio */}
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

                {/* 4. Subtitles & Styling */}
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
              </div>

              {/* Collapsible Raw JSON Payload Viewer */}
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

            {/* Modal Footer */}
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
            {/* Modal Header */}
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

            {/* Video Player (9:16 vertical ratio) */}
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

            {/* Modal Footer */}
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
    </div>
  );
}
