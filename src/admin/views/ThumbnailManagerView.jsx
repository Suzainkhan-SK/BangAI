import React, { useState } from 'react';

export default function ThumbnailManagerView() {
  const [activeModel, setActiveModel] = useState('flux-1.1-pro');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, bad anatomy, distorted faces, watermark, text artifacts, extra limbs');
  const [enhancerPrompt, setEnhancerPrompt] = useState(
`Enhance this thumbnail prompt for maximum YouTube click-through rate (CTR):
- Add hyper-expressive emotions, cinematic rim lighting, 8k octane render detail.
- Keep composition bold, high-contrast, uncluttered.`
  );

  const [testPrompt, setTestPrompt] = useState('A mysterious glowing ancient pyramid in Antarctica under the aurora borealis');
  const [generatedImg, setGeneratedImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = () => {
    setSavedMsg('Thumbnail Studio generation parameters and Kie.ai model settings saved!');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  const handleTestGenerate = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setGeneratedImg('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80');
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Thumbnail Studio & Kie.ai Engine Manager</h1>
          <p className="admin-view-desc">
            Configure Kie.ai AI image generators, prompt enhancement presets, negative prompts, and aspect ratio standards.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={handleSave} className="admin-btn admin-btn-primary">
            💾 Save Thumbnail Engine Settings
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

      {/* Engine & Aspect Ratio Card */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
          Image Generation Engine & Aspect Ratios
        </h3>
        <div className="admin-grid admin-grid-3">
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
              Kie.ai Active Model
            </label>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="admin-select"
            >
              <option value="flux-1.1-pro">Flux 1.1 Pro (Highest CTR Realism)</option>
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
              Render Steps / Guidance Scale
            </label>
            <input
              type="text"
              defaultValue="Steps: 28 • CFG: 7.5"
              className="admin-input"
            />
          </div>
        </div>
      </div>

      {/* Two Column: Prompt Presets + Live Generation Bench */}
      <div className="admin-grid admin-grid-2">
        {/* Left: Enhancers & Negative Prompts */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0' }}>
            CTR Prompt Enhancer & Negative Filter
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Automated CTR Prompt Enhancer System Prompt
              </label>
              <textarea
                rows={5}
                value={enhancerPrompt}
                onChange={(e) => setEnhancerPrompt(e.target.value)}
                className="admin-textarea"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Default Negative Prompt (Injected to all renders)
              </label>
              <textarea
                rows={3}
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="admin-textarea"
              />
            </div>
          </div>
        </div>

        {/* Right: Test Generation Bench */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0' }}>
            Test Thumbnail Inference Bench
          </h3>
          <form onSubmit={handleTestGenerate} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="admin-input"
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">
              {loading ? 'Rendering...' : '🎨 Render'}
            </button>
          </form>

          <div style={{
            height: '240px',
            borderRadius: '10px',
            background: 'var(--admin-bg-elevated)',
            border: '1px solid var(--admin-border-glass)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {generatedImg ? (
              <img
                src={generatedImg}
                alt="Test Generated Thumbnail"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: 'var(--admin-text-sub)', fontSize: '13px' }}>
                Click "Render" to test Kie.ai thumbnail pipeline
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
