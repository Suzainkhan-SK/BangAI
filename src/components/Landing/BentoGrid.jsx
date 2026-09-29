import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  Mic2, 
  Volume2, 
  Music, 
  CheckCircle2, 
  Smartphone, 
  Monitor, 
  Square, 
  ShieldCheck, 
  Sliders, 
  Zap, 
  ArrowRight,
  Eye,
  Type
} from 'lucide-react';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { audioEngine } from '../../audio/audioEngine';

export default function BentoGrid() {
  const { isMobile } = useBreakpoint();
  const [activeSubtitleStyle, setActiveSubtitleStyle] = useState('hormozi');
  const [activeAspect, setActiveAspect] = useState('9:16');
  const [activeLang, setActiveLang] = useState('en');

  const subtitleStyles = [
    { id: 'hormozi', name: 'Punchy Highlight', sample: 'THE SECRET TO VIRAL VIDEOS' },
    { id: 'minimal', name: 'Clean Sans', sample: 'Every word crafted to hold attention' },
    { id: 'neon', name: 'Cyber Glow', sample: 'UNMATCHED CINEMATIC QUALITY' }
  ];

  const languages = [
    { code: 'en', label: 'English (US/UK)' },
    { code: 'hi', label: 'Hindi & Hinglish' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'ja', label: 'Japanese' }
  ];

  return (
    <section id="features" style={{
      paddingTop: isMobile ? '56px' : '90px',
      paddingBottom: isMobile ? '56px' : '90px',
      background: 'var(--bg-app)',
      position: 'relative'
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: isMobile ? '0 auto 36px auto' : '0 auto 52px auto' }}>
          <div className="glow-pill" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(255, 79, 0, 0.08)',
            border: '1px solid rgba(255, 79, 0, 0.25)',
            marginBottom: '16px'
          }}>
            <Sparkles size={14} color="var(--accent-primary)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Proprietary Video Intelligence Engine
            </span>
          </div>

          <h2 className="font-display" style={{
            fontSize: 'clamp(28px, 5.5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
            color: 'var(--text-primary)'
          }}>
            Engineered for <span className="grad-text">Flawless Video Production</span>
          </h2>

          <p style={{
            fontSize: isMobile ? '15px' : '17px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Every component of our autonomous pipeline works in unison to transform raw ideas into 
            studio-mastered, high-retention video ready for any screen.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {/* Card 1: Multi-Act AI Screenwriter (8 cols) */}
          <div className="bento-card bento-col-8">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 79, 0, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Layers size={20} color="var(--accent-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Autonomous Multi-Act Screenplay Architect
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Hook-first narrative design • Scene timing calibration
                  </div>
                </div>
              </div>
              <span className="badge badge-brand" style={{ fontSize: '11px', padding: '3px 8px' }}>
                Dynamic Pacing
              </span>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Analyzes core themes and generates structured, cinematic scene breakdowns. Each act includes precise dialogue limits, visual stage directions, and auditory hooks to maximize audience retention.
            </p>

            {/* Visual Script Simulation Card */}
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Act 1: The Curiosity Hook (0.0s – 3.2s)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  18 Words • High Velocity
                </span>
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "Deep beneath the ocean floor lies a geological anomaly that modern science still cannot explain..."
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', background: 'var(--bg-pill)', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                  Camera: Slow Underwater Push-In
                </span>
                <span style={{ fontSize: '11px', background: 'var(--bg-pill)', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                  Sound: Sub-Bass Whoosh
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Studio Voice Synthesis (4 cols) */}
          <div className="bento-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Mic2 size={20} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Neural Voice Synthesis
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  31+ Languages & Dialects
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Emotionally expressive speech synthesis with natural cadence, breath simulation, and dialect accuracy.
            </p>

            {/* Interactive Language Selector Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    audioEngine.playSfx('click');
                    setActiveLang(l.code);
                  }}
                  style={{
                    background: activeLang === l.code ? '#10b981' : 'var(--bg-input)',
                    color: activeLang === l.code ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Waveform graphic */}
            <div style={{
              background: 'var(--bg-input)',
              borderRadius: '10px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4px',
              height: '48px'
            }}>
              {[30, 60, 90, 45, 80, 100, 75, 40, 65, 85, 95, 50, 70, 40, 60].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    height: `${h}%`,
                    background: '#10b981',
                    borderRadius: '2px',
                    opacity: 0.85
                  }}
                />
              ))}
            </div>
          </div>

          {/* Card 3: Adaptive BGM & Speech Ducking (4 cols) */}
          <div className="bento-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Music size={20} color="#f59e0b" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Smart -18dB Audio Ducking
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Acoustic Speech Priority
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Background music automatically ducks by -18dB whenever narration begins and swells naturally during dramatic scene pauses.
            </p>

            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Voice Narration</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>0 dB (Primary)</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ width: '85%', height: '100%', background: '#10b981' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Dynamic Soundtrack</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>-18 dB (Ducked)</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '38%', height: '100%', background: '#f59e0b' }} />
              </div>
            </div>
          </div>

          {/* Card 4: Kinetic Subtitles & Typography (4 cols) */}
          <div className="bento-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Type size={20} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Kinetic Subtitles
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Word-by-word active highlight
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              Synchronized animated captions formatted for mobile sound-off viewing with customizable fonts and color pops.
            </p>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              {subtitleStyles.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    audioEngine.playSfx('click');
                    setActiveSubtitleStyle(s.id);
                  }}
                  style={{
                    background: activeSubtitleStyle === s.id ? '#38bdf8' : 'var(--bg-input)',
                    color: activeSubtitleStyle === s.id ? '#090a0d' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 900,
                letterSpacing: '0.02em',
                color: activeSubtitleStyle === 'neon' ? '#38bdf8' : (activeSubtitleStyle === 'hormozi' ? '#f59e0b' : 'var(--text-primary)'),
                textShadow: activeSubtitleStyle === 'neon' ? '0 0 10px rgba(56, 189, 248, 0.6)' : 'none'
              }}>
                {subtitleStyles.find(s => s.id === activeSubtitleStyle)?.sample}
              </span>
            </div>
          </div>

          {/* Card 5: Automated 7-Checkpoint Quality Critic (4 cols) */}
          <div className="bento-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={20} color="#818cf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Automated Quality Critic
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Pre-export validation suite
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              Validates speech bounds, audio balance, visual style coherence, and format compliance before rendering.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                'Speech & Audio Waveform Balance',
                'Visual Style & Color Continuity',
                'Subtitle Synchrony & Readability',
                'Format Framing & Safety Margins'
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 6: Omnichannel Multi-Aspect Studio (12 cols) */}
          <div className="bento-card bento-col-12">
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Omnichannel Multi-Aspect Studio
                  </h3>
                  <span className="badge badge-brand" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    Zero Cropping Distortion
                  </span>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
                  Render once, publish natively across all platforms with native framing for mobile feeds and widescreen monitors.
                </p>
              </div>

              {/* Aspect Ratio Switcher */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-input)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)'
              }}>
                {[
                  { id: '9:16', label: '9:16 Vertical', desc: 'Shorts • Reels • TikTok', icon: <Smartphone size={14} /> },
                  { id: '16:9', label: '16:9 Cinema', desc: 'YouTube • TV • Web', icon: <Monitor size={14} /> },
                  { id: '1:1', label: '1:1 Square', desc: 'Feed • Carousels • Ads', icon: <Square size={14} /> }
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      audioEngine.playSfx('click');
                      setActiveAspect(a.id);
                    }}
                    style={{
                      background: activeAspect === a.id ? 'var(--accent-primary)' : 'transparent',
                      color: activeAspect === a.id ? '#ffffff' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: activeAspect === a.id ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {a.icon}
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Showcase Visual of 3 formats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '14px'
            }}>
              <div style={{
                background: activeAspect === '9:16' ? 'rgba(255, 79, 0, 0.08)' : 'var(--bg-input)',
                border: `1.5px solid ${activeAspect === '9:16' ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                borderRadius: '14px',
                padding: '16px',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Smartphone size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>9:16 Vertical Feed</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  Calibrated for mobile edge-to-edge viewing with safe zones above interaction buttons.
                </p>
              </div>

              <div style={{
                background: activeAspect === '16:9' ? 'rgba(255, 79, 0, 0.08)' : 'var(--bg-input)',
                border: `1.5px solid ${activeAspect === '16:9' ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                borderRadius: '14px',
                padding: '16px',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Monitor size={16} color="#38bdf8" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>16:9 Cinematic Widescreen</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  Rich horizontal canvas for documentary deep dives, YouTube longform, and presentation video.
                </p>
              </div>

              <div style={{
                background: activeAspect === '1:1' ? 'rgba(255, 79, 0, 0.08)' : 'var(--bg-input)',
                border: `1.5px solid ${activeAspect === '1:1' ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                borderRadius: '14px',
                padding: '16px',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Square size={16} color="#10b981" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>1:1 Square Feed</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  High-converting square format engineered for Instagram timeline feeds and LinkedIn sponsored campaigns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
