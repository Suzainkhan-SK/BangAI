import React from 'react';
import { Palette, Film, Sparkles, Flame, Orbit, History, Zap, Check } from 'lucide-react';
import { VISUAL_STYLES } from '../../data/visualStyles';
import { audioEngine } from '../../audio/audioEngine';

export default function VisualStyleGrid({ selectedStyleId, onSelectStyle }) {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Film': return <Film size={15} />;
      case 'Sparkles': return <Sparkles size={15} />;
      case 'Flame': return <Flame size={15} />;
      case 'Orbit': return <Orbit size={15} />;
      case 'History': return <History size={15} />;
      case 'Zap': return <Zap size={15} />;
      default: return <Palette size={15} />;
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
            <Palette size={16} color="#fbbf24" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
            Visual Art Direction
          </span>
        </div>
        <span className="badge-pill badge-amber">
          Grok Video 1.5
        </span>
      </div>

      {/* Grid of 6 Styles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {VISUAL_STYLES.map((style) => {
          const isSelected = selectedStyleId === style.id;
          return (
            <div
              key={style.id}
              onClick={() => {
                audioEngine.playSfx('click');
                onSelectStyle(style.id);
              }}
              style={{
                background: isSelected 
                  ? `linear-gradient(135deg, rgba(30, 41, 69, 0.9) 0%, rgba(13, 18, 31, 0.95) 100%)` 
                  : 'rgba(255, 255, 255, 0.03)',
                border: isSelected 
                  ? `1.5px solid ${style.color}` 
                  : '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                boxShadow: isSelected ? `0 0 16px ${style.color}40` : 'none'
              }}
            >
              {/* Header inside card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: style.color }}>
                  {getIcon(style.icon)}
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#ffffff' }}>
                    {style.name.split(' ')[0]} {style.name.split(' ')[1] || ''}
                  </span>
                </div>
                {isSelected && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: style.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={10} color="#000000" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Subtitle */}
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {style.subtitle.substring(0, 48)}...
              </div>
            </div>
          );
        })}
      </div>

      {/* Style Priority Tip */}
      <div style={{
        padding: '8px 10px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        fontSize: '10.5px',
        color: 'var(--text-muted)',
        lineHeight: 1.4
      }}>
        💡 <strong>Tip:</strong> You can also name a style directly in your prompt, e.g. <em>"anime style"</em>, <em>"documentary look"</em> — words in your prompt take priority.
      </div>
    </div>
  );
}
