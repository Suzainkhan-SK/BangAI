import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

// Real Subtitle Styles extracted directly from BangAI/src/data/subtitleStyles.js
export const OFFICIAL_SUBTITLE_STYLES = [
  {
    id: 'mrbeast-viral',
    name: 'MrBeast Viral Yellow',
    creator: 'MrBeast',
    badge: '🔥 Most Viral',
    icon: '⚡',
    color: '#FFE600',
    fontFamily: 'Montserrat',
    fontSize: 78,
    outlineWidth: 10,
    boxColor: 'None',
    sample: 'THIS IS HOW WE GAINED 10 MILLION VIEWS',
    desc: 'High-energy electric yellow active word with heavy black stroke — #1 retention style on YouTube.'
  },
  {
    id: 'hormozi-box-green',
    name: 'Hormozi Neon Box',
    creator: 'Alex Hormozi',
    badge: '💼 Top Creator',
    icon: '📦',
    color: '#22C55E',
    fontFamily: 'Montserrat',
    fontSize: 74,
    outlineWidth: 8,
    boxColor: '#16A34A',
    sample: 'IF YOU CANNOT SELL YOU CANNOT SCALE',
    desc: 'Bright neon green highlight on solid dark badge — maximum mobile screen readability & punch.'
  },
  {
    id: 'gadzhi-luxury-gold',
    name: 'Iman Gadzhi Luxury Gold',
    creator: 'Iman Gadzhi',
    badge: '✨ Aesthetic',
    icon: '👑',
    color: '#F5D061',
    fontFamily: 'Cinzel / Serif',
    fontSize: 70,
    outlineWidth: 6,
    boxColor: 'None',
    sample: 'THE SECRETS OF THE TOP ONE PERCENT',
    desc: 'Champagne gold word highlight with editorial typography — premium luxury aesthetic.'
  },
  {
    id: 'abdaal-minimal',
    name: 'Ali Abdaal Clean Minimal',
    creator: 'Ali Abdaal',
    badge: '📚 Educational',
    icon: '🎓',
    color: '#38BDF8',
    fontFamily: 'Poppins',
    fontSize: 68,
    outlineWidth: 6,
    boxColor: 'None',
    sample: 'HOW TO BUILD A SECOND BRAIN IN 2026',
    desc: 'Clean modern sans-serif with subtle electric blue highlight — educational & tech perfection.'
  },
  {
    id: 'vox-documentary',
    name: 'Vox Documentarian',
    creator: 'Vox / Johnny Harris',
    badge: '🎥 Cinematic',
    icon: '📰',
    color: '#FACC15',
    fontFamily: 'Komika Axis',
    fontSize: 72,
    outlineWidth: 8,
    boxColor: '#854D0E',
    sample: 'THE MAP THAT CHANGED GLOBAL HISTORY',
    desc: 'Authoritative documentary headline typography with bright yellow tape highlight.'
  }
];

export default function DesignStudioView() {
  const [selectedStyleId, setSelectedStyleId] = useState('mrbeast-viral');
  const [position, setPosition] = useState('center-center');
  const [allCaps, setAllCaps] = useState(true);
  const [maxWordsPerLine, setMaxWordsPerLine] = useState(3);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('BangAI Studio');
  const [watermarkPos, setWatermarkPos] = useState('top-right');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const activeStyle = OFFICIAL_SUBTITLE_STYLES.find(s => s.id === selectedStyleId) || OFFICIAL_SUBTITLE_STYLES[0];

  const fetchSettings = async () => {
    try {
      const res = await adminService.getPlatformSettings();
      if (res.success && res.data?.designSettings) {
        const ds = res.data.designSettings;
        if (ds.selectedStyleId) setSelectedStyleId(ds.selectedStyleId);
        if (ds.position) setPosition(ds.position);
        if (ds.allCaps !== undefined) setAllCaps(ds.allCaps);
        if (ds.maxWordsPerLine) setMaxWordsPerLine(ds.maxWordsPerLine);
        if (ds.watermarkEnabled !== undefined) setWatermarkEnabled(ds.watermarkEnabled);
        if (ds.watermarkText) setWatermarkText(ds.watermarkText);
        if (ds.watermarkPos) setWatermarkPos(ds.watermarkPos);
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
          selectedStyleId,
          styleName: activeStyle.name,
          color: activeStyle.color,
          fontFamily: activeStyle.fontFamily,
          fontSize: activeStyle.fontSize,
          position,
          allCaps,
          maxWordsPerLine,
          watermarkEnabled,
          watermarkText,
          watermarkPos
        }
      });
      setSavedMsg(`✅ Subtitle preset [${activeStyle.name}] saved to MongoDB Atlas globally!`);
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
          <h1 className="admin-view-title">Design Studio & Subtitle Typography Presets</h1>
          <p className="admin-view-desc">
            Directly configure the real <strong>JSON2Video Whisper subtitle presets</strong> from <code>subtitleStyles.js</code> (MrBeast, Hormozi, Iman Gadzhi, Ali Abdaal, Vox), positions, and watermark overlays.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="admin-btn admin-btn-primary"
          >
            {saving ? 'Saving...' : '💾 Save Subtitle Standards'}
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

      {/* Subtitle Presets Grid */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-sub)', marginBottom: '12px' }}>
          Official Subtitle Presets (Active in BangAI StudioLab)
        </h3>
        <div className="admin-grid admin-grid-3">
          {OFFICIAL_SUBTITLE_STYLES.map((st) => {
            const isSelected = selectedStyleId === st.id;
            return (
              <div
                key={st.id}
                onClick={() => setSelectedStyleId(st.id)}
                className="admin-card"
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--admin-accent-cyan)' : '1px solid var(--admin-border-glass)',
                  background: isSelected ? 'var(--admin-bg-elevated)' : 'var(--admin-bg-card)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.2s ease',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{st.icon}</span>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    background: 'rgba(255,255,255,0.08)',
                    color: st.color
                  }}>
                    {st.badge}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--admin-text-main)', marginBottom: '4px' }}>
                  {st.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginBottom: '8px' }}>
                  Creator: <strong>{st.creator}</strong> • Font: {st.fontFamily}
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', lineHeight: 1.4, margin: '0 0 10px 0', minHeight: '32px' }}>
                  {st.desc}
                </p>
                <div style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: '#090d16',
                  border: '1px solid rgba(255,255,255,0.06)',
                  textAlign: 'center',
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 900,
                  fontSize: '13px',
                  color: st.color,
                  letterSpacing: '0.04em'
                }}>
                  {st.sample}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Detailed Settings + Live Mobile Preview */}
      <div className="admin-grid admin-grid-2">
        {/* Controls Column */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>
            Whisper Burn-In Hyperparameters ({activeStyle.name})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="admin-grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Vertical Canvas Placement
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="admin-select"
                >
                  <option value="center-center">Center-Center (Maximum Eyeball Retention)</option>
                  <option value="bottom-center">Bottom-Center (Lower Third)</option>
                  <option value="top-center">Top-Center (Headline Overlay)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Max Words Per Screen Flash
                </label>
                <select
                  value={maxWordsPerLine}
                  onChange={(e) => setMaxWordsPerLine(Number(e.target.value))}
                  className="admin-select"
                >
                  <option value={2}>2 Words (Hyper-Fast TikTok Pacing)</option>
                  <option value={3}>3 Words (Standard YouTube Shorts)</option>
                  <option value={4}>4 Words (Documentary Style)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-main)' }}>
                <input
                  type="checkbox"
                  checked={allCaps}
                  onChange={(e) => setAllCaps(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--admin-accent-cyan)' }}
                />
                Enforce ALL CAPS High-Energy Text Rendering
              </label>
            </div>

            {/* Watermark Section */}
            <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--admin-border-glass)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-main)', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--admin-accent-cyan)' }}
                />
                Enable Studio Brand Watermark Overlay
              </label>

              {watermarkEnabled && (
                <div className="admin-grid-2">
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
                      Screen Corner Position
                    </label>
                    <select
                      value={watermarkPos}
                      onChange={(e) => setWatermarkPos(e.target.value)}
                      className="admin-select"
                    >
                      <option value="top-right">Top Right Corner</option>
                      <option value="top-left">Top Left Corner</option>
                      <option value="bottom-right">Bottom Right Corner</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Vertical Mockup */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Live 9:16 Mobile Screen Preview
            </h3>
            <span className="admin-badge admin-badge-cyan">1080 × 1920 CANVAS</span>
          </div>

          <div style={{
            width: '260px',
            height: '460px',
            margin: '0 auto',
            borderRadius: '24px',
            border: '8px solid #1e293b',
            background: 'linear-gradient(180deg, #090d16 0%, #172554 50%, #0f172a 100%)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: position === 'center-center' ? 'center' : position === 'top-center' ? 'flex-start' : 'flex-end',
            padding: '24px 16px',
            alignItems: 'center'
          }}>
            {/* Top Phone Speaker Bar */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.3)'
            }} />

            {/* Optional Watermark */}
            {watermarkEnabled && (
              <div style={{
                position: 'absolute',
                top: watermarkPos.includes('top') ? '24px' : 'auto',
                bottom: watermarkPos.includes('bottom') ? '24px' : 'auto',
                right: watermarkPos.includes('right') ? '16px' : 'auto',
                left: watermarkPos.includes('left') ? '16px' : 'auto',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(0,0,0,0.6)',
                fontSize: '9px',
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '0.05em'
              }}>
                {watermarkText}
              </div>
            )}

            {/* Subtitle Rendering Box */}
            <div style={{
              textAlign: 'center',
              padding: activeStyle.boxColor !== 'None' ? '8px 14px' : '0',
              borderRadius: activeStyle.boxColor !== 'None' ? '8px' : '0',
              background: activeStyle.boxColor !== 'None' ? activeStyle.boxColor : 'transparent',
              maxWidth: '90%'
            }}>
              <span style={{
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 900,
                fontSize: '18px',
                color: activeStyle.color,
                textTransform: allCaps ? 'uppercase' : 'none',
                textShadow: activeStyle.outlineWidth ? '0 2px 8px rgba(0,0,0,0.9)' : 'none',
                letterSpacing: '0.03em',
                lineHeight: 1.2
              }}>
                {activeStyle.sample}
              </span>
            </div>

            {/* Bottom Shorts UI Controls simulation */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              alignItems: 'center',
              opacity: 0.6
            }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
