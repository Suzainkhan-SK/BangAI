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
import { useVideoSettings } from '../../state/videoSettings';
import { getMusicTrackById } from '../../data/musicTracks';

export default function TemplateCards({ onSelectTemplate, onSelectPreset, onNavigate, user }) {
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState(null);

  const { settings: videoSettings } = useVideoSettings();

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
      const chosenMusic = getMusicTrackById(videoSettings?.musicId || 'mystery2');
      const res = await fetch('/.netlify/functions/generate-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          templateId,
          token,
          voiceId: videoSettings?.voiceId || 'adam',
          elevenLabsVoiceId: videoSettings?.elevenLabsVoiceId || '',
          voiceSpeed: videoSettings?.voiceSpeed || 1.20,
          voiceVolume: videoSettings?.voiceVolume ?? 1.0,
          subtitleSettings: videoSettings?.subtitleSettings || null,
          subtitleStyle: videoSettings?.subtitleStyle || 'hormozi',
          musicId: videoSettings?.musicId || 'mystery2',
          musicTrackUrl: videoSettings?.musicTrackUrl || chosenMusic?.audioUrl || '',
          musicVolume: videoSettings?.musicVolume ?? 0.08
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

  const AUTONOMOUS_TEMPLATES = [
    {
      id: 'world-mysteries',
      emoji: '🛸',
      title: 'World Mysteries & Paranormal',
      desc: 'Uncover unexplained phenomena. Self-scripts 5 scenes, renders cinematic visuals, and uploads directly to YouTube without manual review.',
      tagline: '75s • 5 Scenes • Auto-Upload',
      accentColor: '#6366f1'
    },
    {
      id: 'last-24-hours',
      emoji: '⏳',
      title: 'Last 24 Hours [True Stories]',
      desc: 'Counts down the poignant and dramatic final 24 hours of legendary figures, heroic sacrifices, and historic events with emotional narration.',
      tagline: '75s • 5 Scenes • Emotional & Inspiring',
      accentColor: '#f59e0b'
    },
    {
      id: '3am-horror',
      emoji: '👻',
      title: '3-AM Horror & Paranormal',
      desc: 'Bone-chilling psychological terror and terrifying 3 AM encounters. Maximum camera movement, eerie suspense, and dark sound design.',
      tagline: '75s • 5 Scenes • Extreme Suspense',
      accentColor: '#ef4444'
    }
  ];

  const [selectedAutonomousId, setSelectedAutonomousId] = useState('world-mysteries');
  const activeAutoTpl = AUTONOMOUS_TEMPLATES.find(t => t.id === selectedAutonomousId) || AUTONOMOUS_TEMPLATES[0];

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
          Launch any of our 3 autonomous templates below, or type your custom idea in the prompt bar.
        </p>
      </div>

      {/* ═══════ FEATURED 1-CLICK AUTONOMOUS TEMPLATE HERO CARD ═══════ */}
      <div className="saas-card" style={{
        width: '100%',
        padding: '20px 24px',
        textAlign: 'left',
        position: 'relative',
        borderRadius: '16px'
      }}>
        {/* Template Switcher Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '14px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          {AUTONOMOUS_TEMPLATES.map(tpl => {
            const isSelected = selectedAutonomousId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  audioEngine.playSfx('click');
                  setSelectedAutonomousId(tpl.id);
                  setLaunchError(null);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1.5px solid ${tpl.accentColor}` : '1px solid var(--border-medium)',
                  background: isSelected ? `${tpl.accentColor}15` : 'var(--bg-card)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tpl.emoji}</span>
                <span>{tpl.title.split(' [')[0]}</span>
                {isSelected && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: tpl.accentColor }} />
                )}
              </button>
            );
          })}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '16px'
        }}>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10b981', fontSize: '11px', fontWeight: 700, padding: '2px 8px',
                borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '5px'
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                1-Click Autonomous
              </span>
              <span style={{
                background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                borderRadius: '99px'
              }}>
                {activeAutoTpl.tagline}
              </span>
            </div>

            <h3 style={{
              fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)',
              margin: '0 0 5px 0', fontFamily: 'Space Grotesk, sans-serif'
            }}>
              {activeAutoTpl.title}
            </h3>

            <p style={{
              fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0
            }}>
              {activeAutoTpl.desc}
            </p>

            {launchError && (
              <div style={{
                marginTop: '10px', fontSize: '12px', color: '#ef4444',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <AlertCircle size={14} color="#ef4444" />
                <span>{launchError}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {typeof onNavigate === 'function' && (
              <button
                type="button"
                onClick={() => { audioEngine.playSfx('click'); onNavigate('templates'); }}
                className="btn-outline"
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)'
                }}
              >
                <span>Browse All</span>
                <ArrowRight size={13} />
              </button>
            )}

            <button
              disabled={launching}
              onClick={() => handle1ClickLaunch(selectedAutonomousId)}
              className="btn-glow"
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                cursor: launching ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                color: '#ffffff'
              }}
            >
              {launching ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <Zap size={14} fill="#ffffff" />
                  <span>1-Click Generate</span>
                </>
              )}
            </button>
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
