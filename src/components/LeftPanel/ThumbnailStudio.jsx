import React from 'react';
import { Image, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function ThumbnailStudio({ title, visualStyleName, thumbnailPrompt, setThumbnailPrompt }) {
  const styles = [
    { name: 'High-Contrast Neon', desc: 'Glowing cyber rim light & deep shadows' },
    { name: 'Dramatic Face Reveal', desc: 'Emotional expressive close-up with bokeh' },
    { name: 'Action Collision', desc: 'Mid-air dynamic clash with particle effects' }
  ];

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Image size={16} color="#c084fc" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
            AI Thumbnail & 9:16 Cover
          </span>
        </div>
        <span className="badge-pill badge-indigo">
          FLUX / Imagen 3
        </span>
      </div>

      {/* Prompt preview */}
      <div style={{
        background: 'rgba(10, 15, 26, 0.8)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '10px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
        fontFamily: 'var(--font-mono)'
      }}>
        <div style={{ color: 'var(--accent-secondary)', fontWeight: 600, marginBottom: '4px' }}>
          [9:16 Vertical Cover Prompt]:
        </div>
        <div>
          {thumbnailPrompt || `High-CTR YouTube Shorts cover: Dramatic cinematic focal subject for "${title}", intense lighting, vibrant ${visualStyleName} style, 8K photorealistic, 9:16 aspect ratio.`}
        </div>
      </div>

      {/* Preset Buttons */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {styles.map((st, i) => (
          <button
            key={i}
            onClick={() => {
              audioEngine.playSfx('click');
              setThumbnailPrompt(`High-CTR YouTube Shorts cover: ${st.desc} for "${title}", ${visualStyleName} aesthetic, 8K ultra-detailed, 9:16 vertical.`);
            }}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '5px',
              color: 'var(--text-secondary)',
              fontSize: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'var(--accent-secondary)';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'var(--border-subtle)';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            {st.name}
          </button>
        ))}
      </div>
    </div>
  );
}
