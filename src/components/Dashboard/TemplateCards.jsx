import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { PRESETS } from '../../data/presets';
import { audioEngine } from '../../audio/audioEngine';

export default function TemplateCards({ onSelectPreset }) {
  const suggestions = [
    {
      id: 'bermuda',
      emoji: '🌊',
      title: 'Bermuda Triangle Flight 19',
      category: 'Mystery',
      prompt: 'Unsolved disappearance of Flight 19 in Bermuda Triangle with cockpit static.',
      color: '#6366f1'
    },
    {
      id: 'dragons',
      emoji: '🐉',
      title: 'Eastern vs Western Dragons',
      category: 'CGI Battle',
      prompt: 'Epic clash between serpentine dragon Long and fire-breathing Dracon.',
      color: '#8b5cf6'
    },
    {
      id: 'fruits',
      emoji: '🍍',
      title: 'Talking Pineapple Escape',
      category: 'Pixar 3D',
      prompt: 'Cute pineapple and apple riding grocery carts to escape supermarket blender.',
      color: '#f59e0b'
    },
    {
      id: 'tatasteve',
      emoji: '💔',
      title: 'Ratan Tata: Final 24 Hours',
      category: 'Emotional',
      prompt: 'Touching final day of iconic Indian philanthropist Ratan Tata.',
      color: '#ec4899'
    }
  ];

  return (
    <div style={{ maxWidth: '840px', margin: '20px auto 0 auto', textAlign: 'center' }}>
      {/* Gemini Gradient Greeting */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="font-display" style={{
          fontSize: '38px',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '8px',
          background: 'var(--grad-gemini)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Hello, Creator
        </h1>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          What viral YouTube Short should we create today?
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Type any story topic in the prompt bar below, or pick a proven viral template to begin.
        </p>
      </div>

      {/* Quick Prompt Suggestion Cards (Compact & Responsive) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        textAlign: 'left'
      }}>
        {suggestions.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              audioEngine.playSfx('click');
              onSelectPreset(item.id);
            }}
            className="saas-card"
            style={{
              padding: '14px',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '130px',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{item.emoji}</span>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: item.color,
                  background: `${item.color}15`,
                  padding: '2px 6px',
                  borderRadius: '5px'
                }}>
                  {item.category}
                </span>
              </div>

              <h3 className="font-display" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                {item.prompt.substring(0, 50)}...
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '10px',
              paddingTop: '6px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--accent-primary)',
              fontWeight: 600
            }}>
              <span>Use Prompt</span>
              <ArrowRight size={11} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
