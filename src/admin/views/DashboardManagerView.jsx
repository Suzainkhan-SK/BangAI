import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function DashboardManagerView() {
  const [settings, setSettings] = useState({
    maintenanceMode: { enabled: false, headline: 'Scheduled Platform Upgrade', message: 'BangAI is currently updating systems. We will be back online shortly!' },
    banner: { enabled: true, badge: 'PRO', headline: 'BangAI 2.0 Studio Live: Ultra-fast 4K Video Rendering is here!', link: '/templates' },
    showcaseVideos: [
      { id: 'sc_1', title: 'Ancient Bermuda Triangle Secret', views: '2.4M', duration: '75s', category: 'World Mysteries' },
      { id: 'sc_2', title: 'Why 3 AM Is The Witching Hour', views: '1.8M', duration: '60s', category: 'Horror' },
      { id: 'sc_3', title: 'The Rise of Quantum Artificial Intelligence', views: '950K', duration: '68s', category: 'Sci-Tech' }
    ]
  });

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await adminService.getPlatformSettings();
      if (res.success && res.data) {
        setSettings(prev => ({
          ...prev,
          maintenanceMode: res.data.maintenanceMode || prev.maintenanceMode,
          banner: res.data.dashboardBanner || prev.banner,
          showcaseVideos: res.data.showcaseVideos || prev.showcaseVideos
        }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.savePlatformSettings({
        maintenanceMode: settings.maintenanceMode,
        dashboardBanner: settings.banner,
        showcaseVideos: settings.showcaseVideos
      });
      setToastMsg('Dashboard configuration saved to MongoDB Atlas successfully!');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      setToastMsg(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddVideo = () => {
    const title = prompt('Enter Showcase Video Title:');
    if (!title) return;
    const item = {
      id: `sc_${Date.now()}`,
      title,
      views: '1.2M',
      duration: '70s',
      category: 'Trending'
    };
    setSettings(prev => ({ ...prev, showcaseVideos: [item, ...prev.showcaseVideos] }));
  };

  const handleRemoveVideo = (id) => {
    setSettings(prev => ({ ...prev, showcaseVideos: prev.showcaseVideos.filter(v => v.id !== id) }));
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Dashboard & Platform Manager</h1>
          <p className="admin-view-desc">
            Direct real-time control over user dashboard announcements, featured video showcase reels, and emergency maintenance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary">
            {saving ? 'Saving Changes...' : '💾 Save & Publish to Dashboard'}
          </button>
        </div>
      </div>

      {toastMsg && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Maintenance Mode Card */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Platform Emergency Maintenance Mode</h3>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '2px 0 0 0' }}>
              When enabled, non-admin visitors will see an aesthetic maintenance overlay.
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={settings.maintenanceMode.enabled}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                maintenanceMode: { ...prev.maintenanceMode, enabled: e.target.checked }
              }))}
              style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
            />
            <span style={{ color: settings.maintenanceMode.enabled ? '#ef4444' : 'var(--admin-text-sub)' }}>
              {settings.maintenanceMode.enabled ? 'ACTIVE (SYSTEM LOCKED)' : 'INACTIVE (NORMAL)'}
            </span>
          </label>
        </div>

        {settings.maintenanceMode.enabled && (
          <div className="admin-grid admin-grid-2" style={{ marginTop: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Maintenance Headline
              </label>
              <input
                type="text"
                value={settings.maintenanceMode.headline}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maintenanceMode: { ...prev.maintenanceMode, headline: e.target.value }
                }))}
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Customer Notice Message
              </label>
              <input
                type="text"
                value={settings.maintenanceMode.message}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maintenanceMode: { ...prev.maintenanceMode, message: e.target.value }
                }))}
                className="admin-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Global Dashboard Announcement Banner */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
          Global Dashboard Announcement Banner
        </h3>
        <div className="admin-grid admin-grid-3">
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Badge Tag Text
            </label>
            <input
              type="text"
              value={settings.banner.badge}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                banner: { ...prev.banner, badge: e.target.value }
              }))}
              className="admin-input"
              placeholder="e.g. NEW, UPDATE, PRO"
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Banner Headline Text
            </label>
            <input
              type="text"
              value={settings.banner.headline}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                banner: { ...prev.banner, headline: e.target.value }
              }))}
              className="admin-input"
              placeholder="Headline displayed to all logged-in creators..."
            />
          </div>
        </div>
      </div>

      {/* Featured Video Showcase Reel */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Featured Video Showcase Reel</h3>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '2px 0 0 0' }}>
              Top viral demo reels featured in the user dashboard inspiration carousel.
            </p>
          </div>
          <button type="button" onClick={handleAddVideo} className="admin-btn admin-btn-secondary">
            + Add Showcase Video
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Video Title</th>
                <th>Category</th>
                <th>Views Metric</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {settings.showcaseVideos.map((vid) => (
                <tr key={vid.id}>
                  <td style={{ fontWeight: 600 }}>{vid.title}</td>
                  <td><span className="admin-badge admin-badge-cyan">{vid.category}</span></td>
                  <td>{vid.views}</td>
                  <td>{vid.duration}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(vid.id)}
                      className="admin-btn admin-btn-danger"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
