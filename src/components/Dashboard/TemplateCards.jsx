import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  TrendingUp 
} from 'lucide-react';
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
      category: 'Viral Mystery',
      accentColor: '#6366f1',
      prompt: 'Unsolved disappearance of Flight 19 in Bermuda Triangle with cockpit radio static and timeline facts.',
      voice: 'adam',
      style: 'cinematic',
      stats: '1.8M Views'
    },
    {
      id: 'psychology',
      emoji: '🧠',
      title: '3 Dark Psychology Secrets',
      category: 'Mind Hack',
      accentColor: '#06b6d4',
      prompt: '3 subtle psychological behaviors that command instant authority and respect in under 60 seconds.',
      voice: 'josh',
      style: 'noir',
      stats: '2.4M Views'
    },
    {
      id: 'billionaire',
      emoji: '💰',
      title: 'From ₹50 to 3 Factories',
      category: 'Hustle & Money',
      accentColor: '#10b981',
      prompt: 'Dramatic motivational story of an Indian tea seller who built an exports empire starting with ₹50.',
      voice: 'adam',
      style: 'cinematic',
      stats: '5.1M Views'
    }
  ];

  return (
    <div style={{
      maxWidth: '820px',
      margin: '20px auto 0 auto',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Gemini Hero Greeting */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="font-display" style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
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
        <h2 style={{
          fontSize: 'clamp(16px, 3vw, 20px)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '6px'
        }}>
          What viral video should we create today?
        </h2>
        <p style={{
          fontSize: '13.5px',
          color: 'var(--text-secondary)',
          maxWidth: '520px',
          margin: '0 auto'
        }}>
          Type your topic in the prompt bar below or select a template to generate a complete 75-second Short.
        </p>
      </div>

      {/* Exactly 3 Clean, Responsive Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '14px',
        width: '100%',
        textAlign: 'left'
      }}>
        {templates.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelect(item)}
            className="saas-card"
            style={{
              padding: '16px 18px',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '140px',
              position: 'relative',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = item.accentColor;
              e.currentTarget.style.boxShadow = `0 8px 24px ${item.accentColor}25`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'var(--shadow-card)';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '22px' }}>{item.emoji}</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: item.accentColor,
                  background: `${item.accentColor}18`,
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {item.category}
                </span>
              </div>

              <h3 className="font-display" style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '4px',
                lineHeight: 1.3
              }}>
                {item.title}
              </h3>

              <p style={{
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.4
              }}>
                {item.prompt.substring(0, 68)}...
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: item.accentColor,
              fontWeight: 600
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={11} />
                {item.stats}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                Use
                <ArrowRight size={12} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
