import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Brain, 
  DollarSign, 
  Compass, 
  Film, 
  Wand2,
  Zap,
  TrendingUp
} from 'lucide-react';
import { PRESETS } from '../../data/presets';
import { audioEngine } from '../../audio/audioEngine';

export default function TemplateCards({ onSelectTemplate, onSelectPreset }) {
  const handleSelect = (item) => {
    audioEngine.playSfx('click');
    if (typeof onSelectTemplate === 'function') {
      onSelectTemplate(item);
    } else if (typeof onSelectPreset === 'function') {
      onSelectPreset(item.id);
    }
  };

  const templates = [
    {
      id: 'bermuda',
      emoji: '🌊',
      title: 'Bermuda Triangle Flight 19',
      category: '🔥 Viral Mystery',
      color: '#6366f1',
      bgGlow: 'rgba(99, 102, 241, 0.12)',
      prompt: 'Unsolved disappearance of Flight 19 in Bermuda Triangle with cockpit static and timeline facts.',
      voice: 'adam',
      style: 'cinematic',
      stats: '1.8M Views Potential'
    },
    {
      id: 'tatasteve',
      emoji: '💔',
      title: 'Ratan Tata: Final 24 Hours',
      category: '🎭 Emotional Arc',
      color: '#ec4899',
      bgGlow: 'rgba(236, 72, 153, 0.12)',
      prompt: 'Touching final day of iconic Indian philanthropist Ratan Tata and his quiet kindness.',
      voice: 'rachel',
      style: 'documentary',
      stats: '3.2M Views Potential'
    },
    {
      id: 'dragons',
      emoji: '🐉',
      title: 'Eastern vs Western Dragons',
      category: '⚔️ CGI Battle',
      color: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.12)',
      prompt: 'Epic clash between serpentine dragon Long and fire-breathing Dracon with mythic powers.',
      voice: 'arnold',
      style: 'anime',
      stats: '950K Views Potential'
    },
    {
      id: 'fruits',
      emoji: '🍍',
      title: 'Talking Pineapple Escape',
      category: '✨ 3D Animation',
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.12)',
      prompt: 'Cute pineapple and apple riding grocery carts to escape supermarket blender in Pixar 3D style.',
      voice: 'elli',
      style: 'pixar',
      stats: '4.5M Views Potential'
    },
    {
      id: 'psychology',
      emoji: '🧠',
      title: '3 Dark Psychology Secrets',
      category: '👁️ Mind Hack',
      color: '#06b6d4',
      bgGlow: 'rgba(6, 182, 212, 0.12)',
      prompt: '3 subtle psychological behaviors that command instant authority and respect in any room.',
      voice: 'josh',
      style: 'noir',
      stats: '2.4M Views Potential'
    },
    {
      id: 'billionaire',
      emoji: '💰',
      title: 'From ₹50 to 3 Factories',
      category: '🚀 Hustle Story',
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.12)',
      prompt: 'Dramatic motivational story of an Indian tea seller who built an exports empire starting with ₹50.',
      voice: 'adam',
      style: 'cinematic',
      stats: '5.1M Views Potential'
    }
  ];

  return (
    <div style={{ maxWidth: '880px', margin: '16px auto 0 auto', textAlign: 'center' }}>
      {/* Dynamic Hero Badge & Title */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '99px',
          padding: '6px 16px',
          marginBottom: '14px',
          backdropFilter: 'blur(10px)'
        }}>
          <Sparkles size={14} color="#818cf8" />
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#c7d2fe', letterSpacing: '0.04em' }}>
            AUTONOMOUS VIDEO GENERATION STUDIO
          </span>
        </div>

        <h1 className="font-display" style={{
          fontSize: '40px',
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 70%, #38bdf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          What story would you like to create?
        </h1>

        <p style={{
          fontSize: '14.5px',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          margin: '0 auto',
          lineHeight: 1.55
        }}>
          Type your topic in the prompt bar below or pick a proven viral template to generate a complete 75-second 5-scene Short.
        </p>
      </div>

      {/* Grid of 6 Modern Visual Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '14px',
        textAlign: 'left'
      }}>
        {templates.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelect(item)}
            className="saas-card"
            style={{
              padding: '16px 18px',
              borderRadius: '18px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '145px',
              background: `linear-gradient(180deg, ${item.bgGlow} 0%, rgba(15, 23, 42, 0.75) 100%)`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = item.color;
              e.currentTarget.style.boxShadow = `0 12px 30px ${item.color}35`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '24px' }}>{item.emoji}</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: item.color,
                  background: `${item.color}20`,
                  border: `1px solid ${item.color}40`,
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  {item.category}
                </span>
              </div>

              <h3 className="font-display" style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: '6px',
                lineHeight: 1.3
              }}>
                {item.title}
              </h3>

              <p style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.45
              }}>
                {item.prompt.substring(0, 70)}...
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '14px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '11.5px',
              color: item.color,
              fontWeight: 700
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={12} />
                {item.stats}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Use Template
                <ArrowRight size={13} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
