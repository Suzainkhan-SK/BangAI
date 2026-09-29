import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  TrendingUp,
  Zap,
  Flame,
  CheckCircle2,
  ExternalLink
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
      maxWidth: '860px',
      margin: '16px auto 0 auto',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    }}>
      {/* Hero Greeting */}
      <div>
        <h1 className="font-display" style={{
          fontSize: 'clamp(28px, 5vw, 38px)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '6px',
          background: 'var(--grad-gemini)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Hello, Creator
        </h1>
        <h2 style={{
          fontSize: 'clamp(15px, 2.5vw, 18px)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '4px'
        }}>
          What viral video should we create today?
        </h2>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          maxWidth: '540px',
          margin: '0 auto',
          lineHeight: 1.5
        }}>
          Pick a prompt idea below, or type your custom idea in the prompt bar.
        </p>
      </div>

      {/* Prompt Inspiration Cards */}
      <div style={{ width: '100%', marginTop: '4px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '10px', padding: '0 4px'
        }}>
          <span style={{
            fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>
            START FROM A PROMPT IDEA
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(230px, 100%), 1fr))',
          gap: '12px',
          width: '100%',
          textAlign: 'left'
        }}>
          {templates.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className="saas-card"
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{item.emoji}</span>
                  <span style={{
                    fontSize: '10px', fontWeight: 800, padding: '2px 7px',
                    borderRadius: '99px', background: `${item.accentColor}20`,
                    color: item.accentColor, border: `1px solid ${item.accentColor}40`
                  }}>
                    {item.category}
                  </span>
                </div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {item.prompt}
                </p>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)',
                fontSize: '11px', color: 'var(--text-muted)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={12} color="#10b981" />
                  {item.stats}
                </span>
                <span style={{ color: item.accentColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  Use Prompt <ArrowRight size={11} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
