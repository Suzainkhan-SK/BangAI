import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function StockStudioManagerView() {
  const [form, setForm] = useState({
    renderingEngine: 'json2video-v2',
    j2vKeyCount: 12,
    pexelsApiKey: '563492ad6f917000010000018f921a8b27341094892c',
    pexelsFallbackMode: 'auto-generate-ai',
    defaultDuration: 75,
    scenesCount: 5,
    defaultAspect: '9:16',
    defaultVoiceSpeed: 1.10,
    minVoiceSpeed: 1.10,
    maxVoiceSpeed: 1.50,
    backgroundMusicVolume: 0.08,
    audioDuckingPercent: 16,
    subtitleEngine: 'json2video-whisper',
    defaultSubtitlePreset: 'mrbeast-viral',
    aiScriptEngine: 'Claude Haiku 4.5 & Gemini 2.5 Flash',
    renderResolution: '1080p',
    renderFps: 60
  });

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const fetchSettings = async () => {
    try {
      const [settingsRes, keysRes] = await Promise.all([
        adminService.getPlatformSettings(),
        adminService.getKeys()
      ]);
      if (settingsRes.success && settingsRes.data?.stockStudio) {
        setForm(prev => ({ ...prev, ...settingsRes.data.stockStudio }));
      }
      if (keysRes.success && keysRes.data?.json2video) {
        setForm(prev => ({ ...prev, j2vKeyCount: keysRes.data.json2video.length }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await adminService.savePlatformSettings({ stockStudio: form });
      setToastMsg('✅ Stock Studio & JSON2Video pipeline configuration updated in MongoDB Atlas!');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      setToastMsg(`⚠️ Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Stock Studio & Video Engine Architecture</h1>
          <p className="admin-view-desc">
            Configure the real <strong>JSON2Video v2 movie rendering engine</strong>, 1.10x–1.50x voice pacing, 75-second 5-scene structure, Pexels API credentials, and Whisper subtitles.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary">
            {saving ? 'Saving...' : '💾 Save Video Pipeline Settings'}
          </button>
        </div>
      </div>

      {toastMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13.5px',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Engine Status Banner */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0' }}>
              Core Video Pipeline: JSON2Video Cloud Multi-Key Cluster
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: 0 }}>
              Autonomous 5-scene vertical video rendering with Whisper subtitle burn-in and audio ducking.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="admin-badge admin-badge-success">● {form.j2vKeyCount} Active Keys</span>
            <span className="admin-badge admin-badge-cyan">1080p Ultra HD</span>
          </div>
        </div>
      </div>

      {/* Video Generation Timing & Assembly Parameters */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>
          Video Scene Pacing & Timing Standards
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
              Voice Speed Pacing (Default: {form.defaultVoiceSpeed}x)
            </label>
            <select
              value={form.defaultVoiceSpeed}
              onChange={(e) => setForm(prev => ({ ...prev, defaultVoiceSpeed: parseFloat(e.target.value) }))}
              className="admin-select"
            >
              <option value={1.10}>1.10x (StudioLab Default - Natural)</option>
              <option value={1.15}>1.15x (Energetic Story)</option>
              <option value={1.20}>1.20x (Fast Pace Action)</option>
              <option value={1.25}>1.25x (Viral High-Retention)</option>
              <option value={1.30}>1.30x (Rapid Fire)</option>
              <option value={1.50}>1.50x (Maximum Cap)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              AI Scriptwriting Brain
            </label>
            <input
              type="text"
              value={form.aiScriptEngine}
              onChange={(e) => setForm(prev => ({ ...prev, aiScriptEngine: e.target.value }))}
              className="admin-input"
            />
          </div>
        </div>
      </div>

      {/* Stock Video & Audio Engineering */}
      <div className="admin-grid admin-grid-2">
        {/* Stock Provider Integration */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>
            Pexels & Pixabay Stock Footage Engine
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Pexels API Key
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
                Fallback When Stock Clip Is Unavailable
              </label>
              <select
                value={form.pexelsFallbackMode}
                onChange={(e) => setForm(prev => ({ ...prev, pexelsFallbackMode: e.target.value }))}
                className="admin-select"
              >
                <option value="auto-generate-ai">Auto-generate AI visual via Kie.ai</option>
                <option value="reuse-previous-clip">Extend / Loop previous clip with Ken Burns zoom</option>
                <option value="color-gradient">Render dynamic animated dark gradient</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audio Engineering & Ducking */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>
            Audio Engineering & Sound Design
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--admin-text-sub)', fontWeight: 600 }}>Default Background Music Volume</span>
                <span style={{ fontWeight: 800, color: 'var(--admin-accent-cyan)' }}>{Math.round(form.backgroundMusicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.40"
                step="0.01"
                value={form.backgroundMusicVolume}
                onChange={(e) => setForm(prev => ({ ...prev, backgroundMusicVolume: parseFloat(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--admin-accent-cyan)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                Website default in StudioLab is 8% (0.08) for clean voiceover clarity.
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--admin-text-sub)', fontWeight: 600 }}>Audio Ducking Under Voiceover</span>
                <span style={{ fontWeight: 800, color: 'var(--admin-accent-purple)' }}>{form.audioDuckingPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={form.audioDuckingPercent}
                onChange={(e) => setForm(prev => ({ ...prev, audioDuckingPercent: parseInt(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--admin-accent-purple)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
