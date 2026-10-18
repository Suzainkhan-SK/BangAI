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
      totalUsers: 0,
      activeClusterOnline: false
    }
  });

  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [switchingCluster, setSwitchingCluster] = useState(false);

  // Active view tab: 'videos' (Video Generation Vault) | 'users' (Creators Analytics)
  const [activeTab, setActiveTab] = useState('videos');

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'rendering' | 'failed'
  const [selectedUserFilter, setSelectedUserFilter] = useState('');

  // Video Player Modal state
  const [playingVideo, setPlayingVideo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchStockStudioData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getStockStudioDetails();
      if (res && res.success) {
        setData({
          users: res.users || [],
          videos: res.videos || [],
          clusterHealth: res.clusterHealth || [],
          activeCluster: res.activeCluster || 'cmpunktg',
          kpis: res.kpis || {
            totalVideos: res.videos?.length || 0,
            completedVideos: res.videos?.filter(v => v.videoUrl).length || 0,
            totalUsers: res.users?.length || 0,
            activeClusterOnline: res.clusterHealth?.some(c => c.isActive && c.online) || false
          }
        });
      }
    } catch (e) {
      console.warn('Error fetching Stock Studio data:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockStudioData();
  }, []);

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
      if (selectedUserFilter && v.userEmail !== selectedUserFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'completed' && (!v.videoUrl || v.status !== 'completed')) {
        return false;
      }
      if (statusFilter === 'rendering' && (v.status !== 'rendering' && v.status !== 'dispatched' && v.status !== 'started')) {
        return false;
      }
      if (statusFilter === 'failed' && (v.status !== 'failed' && v.status !== 'cancelled' && v.status !== 'execution_timeout')) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const titleMatch = (v.title || '').toLowerCase().includes(term);
        const emailMatch = (v.userEmail || '').toLowerCase().includes(term);
        const idMatch = (v.id || '').toLowerCase().includes(term);
        return titleMatch || emailMatch || idMatch;
      }
      return true;
    });
  }, [data.videos, selectedUserFilter, statusFilter, searchTerm]);

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
            Monitor real-time user video generations, watch rendered MP4 videos, track creator credit usage, and manage Modal GPU cluster routing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={fetchStockStudioData}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Stats'}
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

          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
            Bang API Credits System: <strong style={{ color: '#10b981' }}>Enabled</strong>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="admin-grid admin-grid-4" style={{ marginBottom: '24px' }}>
        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Video Generations
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--admin-text-main)', marginTop: '6px' }}>
            {data.kpis.totalVideos}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            Across all Stock Studio creators
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Completed & Playable MP4s
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981', marginTop: '6px' }}>
            {data.kpis.completedVideos}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            Ready for instant streaming & download
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Creators
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--admin-accent-cyan)', marginTop: '6px' }}>
            {data.kpis.totalUsers}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            Users with Stock Studio access
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--admin-text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Modal GPU Cluster Status
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: data.kpis.activeClusterOnline ? '#10b981' : '#f59e0b', marginTop: '6px' }}>
            {data.kpis.activeClusterOnline ? 'ONLINE' : 'CONNECTING'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
            Route: {activeCluster.toUpperCase()}
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
              <span>🎬 Generated Videos</span>
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
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'completed', label: 'Playable MP4' },
                  { id: 'rendering', label: 'Rendering' },
                  { id: 'failed', label: 'Failed' }
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
              placeholder="Search by title, email, or task ID..."
              className="admin-input"
              style={{ width: '240px', fontSize: '12px', padding: '6px 10px' }}
            />
          </div>
        </div>

        {/* TAB 1: GENERATED VIDEOS VAULT */}
        {activeTab === 'videos' && (
          <div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '13px' }}>
                Loading Stock Studio generations...
              </div>
            ) : filteredVideos.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-sub)', fontSize: '13px' }}>
                No video generations found matching your search.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredVideos.map((video) => {
                  const isCompleted = video.videoUrl && (video.status === 'completed' || video.status === 'dispatched');
                  const isFailed = video.status === 'failed' || video.status === 'cancelled' || video.status === 'execution_timeout';
                  const isRendering = !isCompleted && !isFailed;

                  return (
                    <div
                      key={video.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'var(--admin-bg-surface)',
                        border: '1px solid var(--admin-border-glass)',
                        flexWrap: 'wrap',
                        gap: '12px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Left: Video Details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 340px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          flexShrink: 0
                        }}>
                          {isCompleted ? '🎬' : (isFailed ? '⚠️' : '⏳')}
                        </div>

                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--admin-text-main)', marginBottom: '2px' }}>
                            {video.title}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span>Creator: <strong style={{ color: 'var(--admin-text-main)' }}>{video.userEmail}</strong></span>
                            <span>•</span>
                            <span>{new Date(video.createdAt).toLocaleDateString()} {new Date(video.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span style={{ fontFamily: 'var(--admin-font-mono)' }}>ID: {video.id.slice(0, 16)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Status Badge */}
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : (isFailed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                          color: isCompleted ? '#10b981' : (isFailed ? '#ef4444' : '#f59e0b'),
                          border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : (isFailed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)')}`
                        }}>
                          {video.status ? video.status.toUpperCase() : (isCompleted ? 'COMPLETED' : 'RENDERING')}
                        </span>

                        {/* Video Actions */}
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
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontStyle: 'italic' }}>
                            {isFailed ? 'No video rendered' : 'Rendering in progress...'}
                          </span>
                        )}
                      </div>
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
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Videos Generated</th>
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
                                style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '12px'
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
                            {u.videoCount} {u.videoCount === 1 ? 'video' : 'videos'}
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
                  Creator: {playingVideo.userEmail}
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
                Direct MP4 Stream
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
