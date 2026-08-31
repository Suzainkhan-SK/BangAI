import React, { useState, useRef } from 'react';
import { Type, Loader2, Play, Check, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { SUBTITLE_STYLES, SUBTITLE_FONTS, SUBTITLE_POSITIONS } from '../../data/subtitleStyles';

export default function SubtitleStylePicker({ subtitleSettings, onSubtitleChange }) {
  const [selectedPresetId, setSelectedPresetId] = useState(subtitleSettings?.presetId || 'mrbeast-viral');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const videoRef = useRef(null);

  // Current settings (either from preset or customized)
  const currentPreset = SUBTITLE_STYLES.find(s => s.id === selectedPresetId) || SUBTITLE_STYLES[0];
  const settings = {
    presetId: selectedPresetId,
    style: subtitleSettings?.style || currentPreset.style,
    fontFamily: subtitleSettings?.fontFamily || currentPreset.fontFamily,
    fontSize: subtitleSettings?.fontSize || currentPreset.fontSize,
    wordColor: subtitleSettings?.wordColor || currentPreset.wordColor,
    lineColor: subtitleSettings?.lineColor || currentPreset.lineColor,
    outlineColor: subtitleSettings?.outlineColor || currentPreset.outlineColor,
    outlineWidth: subtitleSettings?.outlineWidth ?? currentPreset.outlineWidth,
    boxColor: subtitleSettings?.boxColor || currentPreset.boxColor || '',
    position: subtitleSettings?.position || currentPreset.position,
    allCaps: subtitleSettings?.allCaps ?? currentPreset.allCaps
  };

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setPreviewVideoUrl(null);
    onSubtitleChange({
      presetId: preset.id,
      style: preset.style,
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      wordColor: preset.wordColor,
      lineColor: preset.lineColor,
      outlineColor: preset.outlineColor,
      outlineWidth: preset.outlineWidth,
      boxColor: preset.boxColor || '',
      position: preset.position,
      allCaps: preset.allCaps
    });
  };

  const handleSettingChange = (key, value) => {
    const updated = { ...settings, [key]: value };
    onSubtitleChange(updated);
  };

  // Generate real subtitle preview via json2video API
  const handleRenderPreview = async () => {
    setIsRendering(true);
    setPreviewError(null);
    setPreviewVideoUrl(null);

    try {
      const res = await fetch('/.netlify/functions/preview-subtitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtitleSettings: settings,
          text: 'This is how your viral subtitles will look in the final video. High retention and high energy!'
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to render preview');
      }

      if (data.videoUrl) {
        setPreviewVideoUrl(data.videoUrl);
        return;
      }

      if (data.project && data.apiKey) {
        const projectId = data.project;
        const apiKey = data.apiKey;
        const start = Date.now();

        while (Date.now() - start < 45000) {
          await new Promise(r => setTimeout(r, 2000));
          const pollRes = await fetch(`/.netlify/functions/preview-subtitle?project=${encodeURIComponent(projectId)}`);
          const pollData = await pollRes.json();
          if (pollData.success && pollData.videoUrl) {
            setPreviewVideoUrl(pollData.videoUrl);
            return;
          }
          if (pollData.status === 'error') {
            throw new Error(pollData.error || 'Render failed');
          }
        }
        throw new Error('Preview render timed out. Please retry.');
      }
    } catch (err) {
      setPreviewError(err.message || 'Network error');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Type size={16} color="#fbbf24" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
            Subtitle Style Studio
          </span>
        </div>
        <span className="badge-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>
          Real Preview
        </span>
      </div>

      {/* Preset Style Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {SUBTITLE_STYLES.map((preset) => {
          const isActive = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              style={{
                background: isActive ? `${preset.color}20` : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isActive ? preset.color : 'var(--border-subtle)'}`,
                borderRadius: '8px',
                padding: '8px 6px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '16px' }}>{preset.icon}</span>
              <span style={{ fontSize: '9px', fontWeight: 600, color: isActive ? preset.color : '#ffffff', textAlign: 'center', lineHeight: 1.2 }}>
                {preset.name}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: preset.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Check size={8} color="#000" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Customization Toggle */}
      <button
        onClick={() => setIsCustomizing(!isCustomizing)}
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '6px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 600
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Palette size={12} color="#fbbf24" />
          Customize Colors & Font
        </span>
        {isCustomizing ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Customization Panel */}
      {isCustomizing && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '10px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* Font Family */}
          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>Font Family</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '5px 8px',
                color: '#ffffff',
                fontSize: '11px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {SUBTITLE_FONTS.map(f => (
                <option key={f.id} value={f.family} style={{ background: '#1a1a2e' }}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
              <span>Font Size</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{settings.fontSize}px</span>
            </div>
            <input
              type="range" min="56" max="100" step="2"
              value={settings.fontSize}
              onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
            />
          </div>

          {/* Color Pickers Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <ColorPicker label="Word Color" value={settings.wordColor} onChange={(v) => handleSettingChange('wordColor', v)} />
            <ColorPicker label="Line Color" value={settings.lineColor} onChange={(v) => handleSettingChange('lineColor', v)} />
            <ColorPicker label="Outline Color" value={settings.outlineColor} onChange={(v) => handleSettingChange('outlineColor', v)} />
            {(settings.style === 'boxed-word' || settings.style === 'boxed-line') && (
              <ColorPicker label="Box Color" value={settings.boxColor} onChange={(v) => handleSettingChange('boxColor', v)} />
            )}
          </div>

          {/* Outline Width */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
              <span>Outline Width</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{settings.outlineWidth}px</span>
            </div>
            <input
              type="range" min="0" max="20" step="2"
              value={settings.outlineWidth}
              onChange={(e) => handleSettingChange('outlineWidth', parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
            />
          </div>

          {/* Position */}
          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>Position</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {SUBTITLE_POSITIONS.map(pos => (
                <button
                  key={pos.id}
                  onClick={() => handleSettingChange('position', pos.value)}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    background: settings.position === pos.value ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${settings.position === pos.value ? '#fbbf24' : 'var(--border-subtle)'}`,
                    borderRadius: '6px',
                    color: settings.position === pos.value ? '#fbbf24' : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {pos.name}
                </button>
              ))}
            </div>
          </div>

          {/* All Caps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={settings.allCaps}
              onChange={(e) => handleSettingChange('allCaps', e.target.checked)}
              style={{ accentColor: '#fbbf24', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '11px', color: '#fff' }}>ALL CAPS</span>
          </div>
        </div>
      )}

      {/* Render Preview Button */}
      <button
        onClick={handleRenderPreview}
        disabled={isRendering}
        style={{
          background: isRendering
            ? 'rgba(245, 158, 11, 0.1)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.2))',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: '#fbbf24',
          fontSize: '12px',
          fontWeight: 700,
          cursor: isRendering ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.2s ease'
        }}
      >
        {isRendering ? (
          <>
            <Loader2 size={14} className="spin-animation" />
            Rendering Preview via json2video...
          </>
        ) : (
          <>
            <Play size={14} />
            Generate Real Subtitle Preview
          </>
        )}
      </button>

      {/* Preview Video */}
      {previewVideoUrl && (
        <div style={{
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          background: '#000'
        }}>
          <video
            ref={videoRef}
            src={previewVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', display: 'block', maxHeight: '200px', objectFit: 'contain' }}
          />
          <div style={{ padding: '6px 10px', fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center' }}>
            ✅ Real json2video rendered preview
          </div>
        </div>
      )}

      {/* Error */}
      {previewError && (
        <div style={{
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          fontSize: '11px',
          color: '#f87171'
        }}>
          ⚠️ {previewError}
        </div>
      )}
    </div>
  );
}

// Color Picker helper component
function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', display: 'block' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          type="color"
          value={value || '#FFFFFF'}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '28px',
            height: '24px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0
          }}
        />
        <span style={{ fontSize: '10px', color: '#fff', fontFamily: 'monospace' }}>{value || '#FFFFFF'}</span>
      </div>
    </div>
  );
}
