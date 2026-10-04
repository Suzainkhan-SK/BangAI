import React, { useState } from 'react';

export default function DesignStudioView() {
  const [font, setFont] = useState('Poppins');
  const [highlightColor, setHighlightColor] = useState('#fbbf24');
  const [animation, setAnimation] = useState('karaoke-pop');
  const [boxOpacity, setBoxOpacity] = useState(0.75);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState('top-right');
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = () => {
    setSavedMsg('Subtitle typography and branding design presets updated globally!');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Design Studio & Typography Manager</h1>
          <p className="admin-view-desc">
            Standardize dynamic word-by-word animated subtitles, highlight color schemes, typography, and brand watermark overlays.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={handleSave} className="admin-btn admin-btn-primary">
            💾 Save Design Standards
          </button>
        </div>
      </div>

      {savedMsg && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          ✅ {savedMsg}
        </div>
      )}

      {/* Two Column: Design Controls + Live Visual Preview */}
      <div className="admin-grid admin-grid-2">
        {/* Controls Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Typography Settings */}
          <div className="admin-card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
              Subtitle Typography & Animation
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Default Font Family
                </label>
                <select value={font} onChange={(e) => setFont(e.target.value)} className="admin-select">
                  <option value="Poppins">Poppins (Modern Bold)</option>
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
                    style={{ width: '120px' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['#fbbf24', '#06b6d4', '#f43f5e', '#10b981', '#a855f7'].map(c => (
                      <div
                        key={c}
                        onClick={() => setHighlightColor(c)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: c,
                          cursor: 'pointer',
                          border: highlightColor === c ? '2px solid #fff' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Subtitle Transition & Animation Style
                </label>
                <select value={animation} onChange={(e) => setAnimation(e.target.value)} className="admin-select">
                  <option value="karaoke-pop">Karaoke Pop (Word by word scale punch)</option>
                  <option value="bounce-glow">Bounce & Neon Glow</option>
                  <option value="fade-slide">Smooth Slide Up & Fade</option>
                  <option value="minimalist">Minimalist Flat Jump</option>
                </select>
              </div>
            </div>
          </div>

          {/* Watermark Branding Card */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Platform Watermark Overlay</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  style={{ accentColor: 'var(--admin-accent-cyan)' }}
                />
                <span>{watermarkEnabled ? 'ENABLED' : 'DISABLED'}</span>
              </label>
            </div>

            {watermarkEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                    Watermark Position
                  </label>
                  <select value={watermarkPos} onChange={(e) => setWatermarkPos(e.target.value)} className="admin-select">
                    <option value="top-right">Top Right</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
                  Free tier exports will automatically contain "Made with BangAI" watermark badge. Pro tier exports bypass this watermark.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Vertical Short Preview */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0', alignSelf: 'flex-start' }}>
            Live 9:16 Short Subtitle Preview
          </h3>

          <div style={{
            width: '260px',
            height: '460px',
            borderRadius: '24px',
            background: 'linear-gradient(180deg, #1e1b4b, #0f172a)',
            border: '2px solid var(--admin-border-glass)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            {/* Watermark Mock */}
            {watermarkEnabled && (
              <div style={{
                position: 'absolute',
                top: watermarkPos.includes('top') ? '14px' : 'auto',
                bottom: watermarkPos.includes('bottom') ? '14px' : 'auto',
                left: watermarkPos.includes('left') ? '14px' : 'auto',
                right: watermarkPos.includes('right') ? '14px' : 'auto',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '0.05em'
              }}>
                ⚡ BANGAI
              </div>
            )}

            {/* Subtitle Box Demonstration */}
            <div style={{
              position: 'absolute',
              bottom: '90px',
              padding: '8px 16px',
              background: `rgba(0, 0, 0, ${boxOpacity})`,
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              textAlign: 'center',
              maxWidth: '85%'
            }}>
              <span style={{
                fontFamily: font,
                fontSize: '18px',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: '#ffffff',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)'
              }}>
                NEVER GO <span style={{ color: highlightColor, textShadow: `0 0 12px ${highlightColor}` }}>INSIDE</span> THAT CAVE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
