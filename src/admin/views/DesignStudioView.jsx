import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function DesignStudioView() {
  const [font, setFont] = useState('Poppins');
  const [highlightColor, setHighlightColor] = useState('#fbbf24');
  const [animation, setAnimation] = useState('karaoke-pop');
  const [boxOpacity, setBoxOpacity] = useState(0.75);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState('top-right');
  const [watermarkText, setWatermarkText] = useState('BangAI Studio');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await adminService.getPlatformSettings();
      if (res.success && res.data?.designSettings) {
        const ds = res.data.designSettings;
        if (ds.defaultFont) setFont(ds.defaultFont);
        if (ds.subtitleColor) setHighlightColor(ds.subtitleColor);
        if (ds.animation) setAnimation(ds.animation);
        if (ds.boxOpacity !== undefined) setBoxOpacity(ds.boxOpacity);
        if (ds.watermarkEnabled !== undefined) setWatermarkEnabled(ds.watermarkEnabled);
        if (ds.watermarkPos) setWatermarkPos(ds.watermarkPos);
        if (ds.watermarkText) setWatermarkText(ds.watermarkText);
      }
    } catch (e) {
      console.warn('Failed to load design settings:', e.message);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.savePlatformSettings({
        designSettings: {
          defaultFont: font,
          subtitleColor: highlightColor,
          animation,
          boxOpacity,
          watermarkEnabled,
          watermarkPos,
          watermarkText
        }
      });
      setSavedMsg('✅ Subtitle typography and branding design presets saved to MongoDB Atlas globally!');
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (e) {
      setSavedMsg(`⚠️ Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Design Studio & Subtitle Typography Standards</h1>
          <p className="admin-view-desc">
            Standardize dynamic word-by-word animated subtitles, highlight color schemes, typography, and brand watermark overlays across all video generation pipelines.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="admin-btn admin-btn-primary"
          >
            {saving ? 'Saving...' : '💾 Save Design Standards'}
          </button>
        </div>
      </div>

      {savedMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13.5px',
          fontWeight: 600
        }}>
          {savedMsg}
        </div>
      )}

      {/* Two Column: Design Controls + Live Visual Preview */}
      <div className="admin-grid admin-grid-2">
        {/* Controls Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Typography Settings */}
          <div className="admin-card">
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>
              Dynamic Subtitle Typography & Colors
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Default Font Family
                </label>
                <select value={font} onChange={(e) => setFont(e.target.value)} className="admin-select">
                  <option value="Poppins">Poppins (Modern Bold - Recommended)</option>
                  <option value="Outfit">Outfit (Cyber Tech)</option>
                  <option value="Montserrat">Montserrat (Classic Clean)</option>
                  <option value="Bebas Neue">Bebas Neue (Impact All-Caps)</option>
                  <option value="Anton">Anton (Heavy Viral Title)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Active Word Highlight Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    style={{ width: '40px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    className="admin-input"
                    style={{ width: '120px', fontFamily: 'var(--admin-font-mono)' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['#fbbf24', '#06b6d4', '#f43f5e', '#10b981', '#a855f7'].map(c => (
                      <div
                        key={c}
                        onClick={() => setHighlightColor(c)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: c,
                          cursor: 'pointer',
                          border: highlightColor === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                          boxShadow: highlightColor === c ? '0 0 8px ' + c : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Caption Animation Style
                </label>
                <select value={animation} onChange={(e) => setAnimation(e.target.value)} className="admin-select">
                  <option value="karaoke-pop">Karaoke Pop (Word pops forward in highlight color)</option>
                  <option value="highlight-box">Bouncing Highlight Box (Rounded rectangular backing)</option>
                  <option value="fade-glow">Neon Glow Pulse (Outer text glow)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Branding & Watermarks Card */}
          <div className="admin-card">
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>
              Branding & Watermark Overlays
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-main)' }}>Enable Channel Watermark</div>
                  <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Overlay branding logo/text on final MP4 renders</div>
                </div>
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--admin-accent-cyan)' }}
                />
              </div>

              {watermarkEnabled && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                      Watermark Brand Text
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                      Watermark Position
                    </label>
                    <select value={watermarkPos} onChange={(e) => setWatermarkPos(e.target.value)} className="admin-select">
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Interactive 9:16 Video Canvas Preview */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Live 9:16 Video Typography Preview
            </h3>
            <span className="admin-badge admin-badge-cyan">1080x1920 Vertical</span>
          </div>

          <div style={{
            width: '280px',
            height: '497px',
            borderRadius: '24px',
            background: 'linear-gradient(180deg, #090d16 0%, #171d2d 100%)',
            border: '3px solid var(--admin-border-glass)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 18px'
          }}>
            {/* Top Bar / Watermark */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
                BANGAI STUDIO
              </span>
              {watermarkEnabled && (
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#fff'
                }}>
                  @{watermarkText}
                </span>
              )}
            </div>

            {/* Dynamic Center Subtitle Mockup */}
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <div style={{
                fontFamily: font,
                fontSize: '24px',
                fontWeight: 900,
                color: '#ffffff',
                textShadow: '0 4px 12px rgba(0,0,0,0.9)',
                lineHeight: 1.2
              }}>
                THIS IS THE
              </div>
              <div style={{
                fontFamily: font,
                fontSize: '32px',
                fontWeight: 900,
                color: highlightColor,
                textShadow: `0 0 20px ${highlightColor}88, 0 4px 12px rgba(0,0,0,0.9)`,
                transform: 'scale(1.08)',
                letterSpacing: '-0.02em'
              }}>
                DARKEST SECRET
              </div>
              <div style={{
                fontFamily: font,
                fontSize: '22px',
                fontWeight: 800,
                color: '#ffffff',
                textShadow: '0 4px 12px rgba(0,0,0,0.9)'
              }}>
                EVER RECORDED!
              </div>
            </div>

            {/* Bottom Controls Indicator */}
            <div style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
              Font: {font} • Style: {animation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
