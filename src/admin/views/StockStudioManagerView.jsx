import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function StockStudioManagerView() {
  const [form, setForm] = useState({
    pexelsApiKey: '563492ad6f917000010000018f921a8b27341094892c',
    pexelsFallbackMode: 'auto-generate-ai',
    defaultDuration: 75,
    defaultAspect: '9:16',
    backgroundMusicVolume: 0.22,
    audioNormalizationLufs: -14,
    skipToleranceSec: 3,
    renderFps: 60,
    ffmpegCrf: 22,
    enableWatermark: false
  });

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await adminService.getPlatformSettings();
      if (res.success && res.data?.stockStudio) {
        setForm(prev => ({ ...prev, ...res.data.stockStudio }));
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
      await adminService.savePlatformSettings({ stockStudio: form });
      setToastMsg('Stock Studio rendering parameters updated in MongoDB Atlas!');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      setToastMsg(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Stock Studio & MoneyPrinterTurbo Manager</h1>
          <p className="admin-view-desc">
            Configure Pexels API credentials, stock video search fallbacks, audio normalization, and FFmpeg video assembly parameters.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary">
            {saving ? 'Saving...' : '💾 Save Studio Configuration'}
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

      {/* Pexels Integration Card */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
          Pexels Vertical Stock Video Integration
        </h3>
        <div className="admin-grid admin-grid-2">
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Pexels API Secret Key
            </label>
            <input
              type="text"
              value={form.pexelsApiKey}
              onChange={(e) => setForm(prev => ({ ...prev, pexelsApiKey: e.target.value }))}
              className="admin-input"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Stock Missing Fallback Policy
            </label>
            <select
              value={form.pexelsFallbackMode}
              onChange={(e) => setForm(prev => ({ ...prev, pexelsFallbackMode: e.target.value }))}
              className="admin-select"
            >
              <option value="auto-generate-ai">Auto-generate AI visual via Kie.ai</option>
              <option value="reuse-previous-clip">Extend / Loop previous clip</option>
              <option value="color-gradient">Render dynamic animated dark gradient</option>
            </select>
          </div>
        </div>
      </div>

      {/* Video Generation & Timing Rules */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
          Video Generation Timing & Assembly Parameters
        </h3>
        <div className="admin-grid admin-grid-3">
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Target Video Length (Seconds)
            </label>
            <input
              type="number"
              value={form.defaultDuration}
              onChange={(e) => setForm(prev => ({ ...prev, defaultDuration: Number(e.target.value) }))}
              className="admin-input"
              min={15}
              max={180}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Aspect Ratio
            </label>
            <select
              value={form.defaultAspect}
              onChange={(e) => setForm(prev => ({ ...prev, defaultAspect: e.target.value }))}
              className="admin-select"
            >
              <option value="9:16">9:16 (YouTube Shorts / TikTok / Reels)</option>
              <option value="16:9">16:9 (Standard YouTube Landscape)</option>
              <option value="1:1">1:1 (Square Social Post)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Clip Skip Tolerance (Seconds)
            </label>
            <input
              type="number"
              value={form.skipToleranceSec}
              onChange={(e) => setForm(prev => ({ ...prev, skipToleranceSec: Number(e.target.value) }))}
              className="admin-input"
              min={1}
              max={10}
            />
          </div>
        </div>
      </div>

      {/* Audio Normalization & FFmpeg Render Quality */}
      <div className="admin-grid admin-grid-2">
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
            Audio Engineering & Loudness
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--admin-text-sub)' }}>Background Music Mix Volume</span>
                <span style={{ fontWeight: 600 }}>{Math.round(form.backgroundMusicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.01"
                value={form.backgroundMusicVolume}
                onChange={(e) => setForm(prev => ({ ...prev, backgroundMusicVolume: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--admin-accent-cyan)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Target Loudness (Integrated LUFS)
              </label>
              <input
                type="number"
                value={form.audioNormalizationLufs}
                onChange={(e) => setForm(prev => ({ ...prev, audioNormalizationLufs: Number(e.target.value) }))}
                className="admin-input"
              />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
            FFmpeg Codec & Compression Quality
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Frame Rate (FPS)
              </label>
              <select
                value={form.renderFps}
                onChange={(e) => setForm(prev => ({ ...prev, renderFps: Number(e.target.value) }))}
                className="admin-select"
              >
                <option value={30}>30 FPS (Standard)</option>
                <option value={60}>60 FPS (Ultra Smooth Motion)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Constant Rate Factor (CRF - Lower is higher quality)
              </label>
              <input
                type="number"
                value={form.ffmpegCrf}
                onChange={(e) => setForm(prev => ({ ...prev, ffmpegCrf: Number(e.target.value) }))}
                className="admin-input"
                min={16}
                max={30}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
