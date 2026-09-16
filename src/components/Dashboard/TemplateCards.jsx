import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  TrendingUp,
  Zap,
  Flame,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function TemplateCards({ onSelectTemplate, onSelectPreset, onNavigate, user }) {
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState(null);

  const handleSelect = (item) => {
    audioEngine.playSfx('click');
    if (typeof onSelectTemplate === 'function') {
      onSelectTemplate(item);
    } else if (typeof onSelectPreset === 'function') {
      onSelectPreset(item.id);
    }
  };

  const handle1ClickLaunch = async (templateId = 'world-mysteries') => {
    audioEngine.playSfx('click');
    if (!user) {
      if (typeof onNavigate === 'function') {
        onNavigate('login');
      }
      return;
    }

    setLaunching(true);
    setLaunchError(null);

    try {
      const token = localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token') || localStorage.getItem('token') || localStorage.getItem('user_token') || '';
      const res = await fetch('/.netlify/functions/generate-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          templateId,
          token
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch template workflow');
      }

      audioEngine.playSfx('success');
      setTimeout(() => {
        if (data.threadId && typeof onNavigate === 'function') {
          onNavigate(`dashboard/t/${data.threadId}`);
        }
      }, 1000);

    } catch (err) {
      console.error('[TemplateCards] 1-Click launch error:', err);
      audioEngine.playSfx('error');
      setLaunchError(err.message || 'Error launching template pipeline');
      setLaunching(false);
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
          Launch our pre-built autonomous template below, or type your custom idea in the prompt bar.
        </p>
      </div>

      {/* ═══════ FEATURED 1-CLICK AUTONOMOUS TEMPLATE HERO CARD ═══════ */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(135deg, rgba(30, 20, 56, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        borderRadius: '20px',
        padding: '24px 28px',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 16px 40px rgba(0,0,0,0.4), 0 0 30px rgba(99,102,241,0.15)',
        backdropFilter: 'blur(16px)'
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1
        }}>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', fontSize: '10.5px', fontWeight: 800, padding: '3px 9px',
                borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                letterSpacing: '0.04em', textTransform: 'uppercase'
              }}>
                <Zap size={11} fill="#fff" />
                Featured 1-Click Template
              </span>
              <span style={{
                background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)',
                color: '#c084fc', fontSize: '10.5px', fontWeight: 700, padding: '3px 9px',
                borderRadius: '99px'
              }}>
                75s • 5 Scenes • Auto-Upload
              </span>
            </div>

            <h3 style={{
              fontSize: '20px', fontWeight: 800, color: '#ffffff',
              margin: '0 0 6px 0', fontFamily: 'Space Grotesk, sans-serif'
            }}>
              World Mysteries & Paranormal
            </h3>

            <p style={{
              fontSize: '13px', color: '#94a3b8', lineHeight: 1.55, margin: 0
            }}>
              Runs the complete 75-second automated video pipeline. Researches unrepeated paranormal topics, scripts 5 scenes, generates cinematic video, and auto-uploads directly to your connected YouTube channel without asking for reviews.
            </p>

            {launchError && (
              <div style={{
                marginTop: '10px', fontSize: '12px', color: '#f87171',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <AlertCircle size={14} color="#ef4444" />
                <span>{launchError}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, minWidth: '220px' }}>
            <button
              disabled={launching}
              onClick={() => handle1ClickLaunch('world-mysteries')}
              style={{
                padding: '13px 20px',
                borderRadius: '12px',
                border: 'none',
                cursor: launching ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 800,
                fontFamily: 'Space Grotesk, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(99,102,241,0.45)',
                transition: 'all 0.15s ease'
              }}
            >
              {launching ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Launching Pipeline...</span>
                </>
              ) : (
                <>
                  <Zap size={16} fill="#ffffff" />
                  <span>⚡ 1-Click Generate</span>
                </>
              )}
            </button>

            {typeof onNavigate === 'function' && (
              <button
                type="button"
                onClick={() => { audioEngine.playSfx('click'); onNavigate('templates'); }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#c084fc',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Browse All Templates</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Or Prompt Inspiration Cards */}
      <div style={{ width: '100%', marginTop: '4px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '10px', padding: '0 4px'
        }}>
          <span style={{
            fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>
            OR START FROM A PROMPT IDEA
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
