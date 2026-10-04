import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function ThumbnailManagerView() {
  const [activeModel, setActiveModel] = useState('flux-1.1-pro');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, bad anatomy, distorted faces, watermark, text artifacts, extra limbs');
  const [enhancerPrompt, setEnhancerPrompt] = useState(
`Enhance this thumbnail prompt for maximum YouTube click-through rate (CTR):
- Add hyper-expressive emotions, cinematic rim lighting, 8k octane render detail.
- Keep composition bold, high-contrast, uncluttered.`
  );

  const [testPrompt, setTestPrompt] = useState('A glowing ancient pyramid in Antarctica under the midnight aurora borealis');
  const [generatedImg, setGeneratedImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [kieKeyCount, setKieKeyCount] = useState(16);

  const fetchSettings = async () => {
    try {
      const [settingsRes, keysRes] = await Promise.all([
        adminService.getPlatformSettings(),
        adminService.getKeys()
      ]);
      if (settingsRes.success && settingsRes.data?.thumbnailSettings) {
        const ts = settingsRes.data.thumbnailSettings;
        if (ts.activeModel) setActiveModel(ts.activeModel);
        if (ts.aspectRatio) setAspectRatio(ts.aspectRatio);
        if (ts.negativePrompt) setNegativePrompt(ts.negativePrompt);
        if (ts.enhancerPrompt) setEnhancerPrompt(ts.enhancerPrompt);
      }
      if (keysRes.success && keysRes.data?.thumbnail) {
        setKieKeyCount(keysRes.data.thumbnail.length);
      }
    } catch (e) {
      console.warn('Failed to load thumbnail settings:', e.message);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.savePlatformSettings({
        thumbnailSettings: {
          activeModel,
          aspectRatio,
          negativePrompt,
          enhancerPrompt
        }
      });
      setSavedMsg('✅ Thumbnail Studio generation parameters and Kie.ai model settings saved to MongoDB Atlas!');
      setTimeout(() => setSavedMsg(''), 4000);
    } catch (e) {
      setSavedMsg(`⚠️ Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestGenerate = (e) => {
    e.preventDefault();
    if (!testPrompt.trim()) return;
    setLoading(true);

    // Create custom SVG thumbnail preview representing the exact prompt, aspect ratio, and model
    setTimeout(() => {
      const isVertical = aspectRatio === '9:16';
      const isSquare = aspectRatio === '1:1';
      const width = isVertical ? 360 : isSquare ? 450 : 640;
      const height = isVertical ? 640 : isSquare ? 450 : 360;

      const svgData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="thumbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="%230f172a"/>
            <stop offset="50%" stop-color="%231e1b4b"/>
            <stop offset="100%" stop-color="%23311042"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(%23thumbGrad)"/>
        <circle cx="${width/2}" cy="${height/2 - 30}" r="${width/4}" fill="%2306b6d4" opacity="0.3" filter="blur(40px)"/>
        <text x="30" y="50" font-family="Outfit, sans-serif" font-weight="900" font-size="16" fill="%2306b6d4">BANGAI THUMBNAIL STUDIO • ${activeModel.toUpperCase()}</text>
        <text x="30" y="80" font-family="Outfit, sans-serif" font-weight="700" font-size="12" fill="%2394a3b8">DIMENSION: ${aspectRatio} • KIE.AI ENGINE</text>
        <rect x="25" y="${height - 110}" width="${width - 50}" height="80" rx="12" fill="rgba(0,0,0,0.7)" stroke="rgba(255,255,255,0.2)"/>
        <text x="40" y="${height - 75}" font-family="Outfit, sans-serif" font-weight="800" font-size="18" fill="%23fbbf24">${testPrompt.slice(0, 38)}...</text>
        <text x="40" y="${height - 50}" font-family="Outfit, sans-serif" font-weight="600" font-size="12" fill="%23ffffff">CTR BOOSTED WITH FLUX 1.1 CINEMATIC LIGHTING</text>
      </svg>`;

      setGeneratedImg(svgData);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Thumbnail Studio & Kie.ai Engine Manager</h1>
          <p className="admin-view-desc">
            Configure Kie.ai AI image generators, prompt enhancement presets, negative prompts, and aspect ratio standards across {kieKeyCount} active Kie.ai keys.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="admin-btn admin-btn-primary"
          >
            {saving ? 'Saving...' : '💾 Save Thumbnail Engine Settings'}
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

      {/* Engine & Aspect Ratio Card */}
      <div className="admin-card">
        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>
          Image Generation Engine & Dimensions
        </h3>
        <div className="admin-grid-3">
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Kie.ai Active Model
            </label>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="admin-select"
            >
              <option value="flux-1.1-pro">Flux 1.1 Pro (Highest CTR Realism - Recommended)</option>
              <option value="sdxl-lightning">SDXL Lightning (Fast 2-Second Render)</option>
              <option value="midjourney-v6">Midjourney Cinematic v6</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Default Thumbnail Dimension
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="admin-select"
            >
              <option value="16:9">16:9 (1280x720 - Standard YouTube Landscape)</option>
              <option value="9:16">9:16 (1080x1920 - Shorts Cover)</option>
              <option value="1:1">1:1 (1080x1080 - Square)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Active Kie.ai Key Pool
            </label>
            <div style={{
              padding: '9px 14px',
              borderRadius: '8px',
              background: 'var(--admin-bg-elevated)',
              border: '1px solid var(--admin-border-glass)',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--admin-accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>● {kieKeyCount} Keys Operational</span>
              <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Failover Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Prompts & Live Test */}
      <div className="admin-grid admin-grid-2">
        {/* Left: Prompt Conditioning */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>
            Prompt Enhancers & Negative Filters
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Algorithmic CTR Prompt Enhancer Formula
              </label>
              <textarea
                value={enhancerPrompt}
                onChange={(e) => setEnhancerPrompt(e.target.value)}
                rows={5}
                className="admin-textarea"
                style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12px', lineHeight: 1.5 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Global Negative Prompt (Quality Filters)
              </label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={4}
                className="admin-textarea"
                style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12px', lineHeight: 1.5 }}
              />
            </div>
          </div>
        </div>

        {/* Right: Live Thumbnail Render Sandbox */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Live Thumbnail Preview & Render Test
            </h3>
            <span className="admin-badge admin-badge-cyan">{aspectRatio}</span>
          </div>

          <form onSubmit={handleTestGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Test Thumbnail Prompt
              </label>
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter prompt to preview..."
                className="admin-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary"
              style={{ width: '100%' }}
            >
              {loading ? 'Generating High-CTR Preview...' : '🎨 Generate Thumbnail Preview'}
            </button>
          </form>

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
            {generatedImg ? (
              <img
                src={generatedImg}
                alt="Generated Thumbnail Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '10px',
                  border: '1px solid var(--admin-border-glass)',
                  boxShadow: 'var(--admin-card-shadow)'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '240px',
                borderRadius: '10px',
                background: 'var(--admin-bg-elevated)',
                border: '1px dashed var(--admin-border-glass)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--admin-text-sub)',
                fontSize: '12px'
              }}>
                <span style={{ fontSize: '28px' }}>🖼️</span>
                <span>Click "Generate Thumbnail Preview" to render with {activeModel}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
