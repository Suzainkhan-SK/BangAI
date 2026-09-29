import React from 'react';
import { 
  Zap, 
  Mic2, 
  Video, 
  Music, 
  ShieldCheck, 
  Share2, 
  Sparkles, 
  Layers,
  Sliders,
  Cpu,
  Monitor,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useBreakpoint } from '../../hooks/useMediaQuery';

export default function Features() {
  const { isMobile } = useBreakpoint();

  const steps = [
    {
      step: '01',
      title: 'Input Raw Topic or Voice Memo',
      desc: 'Stage 0 Neural Classifier analyzes your prompt, detects genre and emotional tone, and structures retention-optimized narrative beats.',
      icon: <Sparkles size={22} color="#6366f1" />,
      color: '#6366f1'
    },
    {
      step: '02',
      title: 'Autonomous Screenplay & Voice Casting',
      desc: 'Writes scene-by-scene script with calibrated speech limits, casts the perfect ElevenLabs narrator, and composes an adaptive score.',
      icon: <Layers size={22} color="#8b5cf6" />,
      color: '#8b5cf6'
    },
    {
      step: '03',
      title: '1-Click Multi-Platform Syndication',
      desc: 'Renders high-definition visuals, burns animated word-by-word captions, and publishes directly to YouTube, Reels, TikTok, and LinkedIn.',
      icon: <Zap size={22} color="#06b6d4" />,
      color: '#06b6d4'
    }
  ];

  const gridFeatures = [
    {
      title: 'Multi-Model AI Video Engine',
      desc: 'Leverages Wan 2.1 and Grok Imagine to generate cinematic video scenes in 9:16 vertical or 16:9 widescreen with 4K clarity.',
      icon: <Video size={22} color="#06b6d4" />,
      tag: 'Wan 2.1 + Grok'
    },
    {
      title: 'Studio Voice Casting (9,650+ Voices)',
      desc: 'Instant access to ElevenLabs Turbo v2.5 and json2video premium voices across 31+ languages with emotional nuance and speed control.',
      icon: <Mic2 size={22} color="#10b981" />,
      tag: '31+ Languages'
    },
    {
      title: 'Adaptive BGM & -18dB Speech Ducking',
      desc: 'Multi-genre soundtrack library with automated -18dB speech ducking curves so voice narration is always crystal clear.',
      icon: <Music size={22} color="#ec4899" />,
      tag: 'Dynamic Audio'
    },
    {
      title: '7-Checkpoint Quality Critic Auditor',
      desc: 'Built-in automated QA auditor inspects character speech timing, visual style continuity, and platform policy safety before export.',
      icon: <ShieldCheck size={22} color="#f59e0b" />,
      tag: 'Autonomous QA'
    },
    {
      title: 'Kinetic Subtitles & Emoji Sync',
      desc: 'Auto-burns viral word-by-word highlighted captions with custom color themes, animation styles, and multi-language Devanagari/Latin support.',
      icon: <Sparkles size={22} color="#8b5cf6" />,
      tag: 'Auto-Burned'
    },
    {
      title: 'Cross-Platform Syndication & Webhooks',
      desc: 'Direct automated publishing to YouTube, Instagram Reels, TikTok, and LinkedIn with tailored aspect ratios and SEO tags.',
      icon: <Share2 size={22} color="#3b82f6" />,
      tag: 'Omnichannel'
    }
  ];

  return (
    <section id="features" style={{
      paddingTop: isMobile ? '48px' : '80px',
      paddingBottom: isMobile ? '48px' : '80px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)'
    }}>
      <div className="container">
        {/* Workflow Overview */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px auto' }}>
          <span className="badge badge-brand" style={{ marginBottom: '12px' }}>
            <Zap size={13} />
            <span>End-to-End Autonomous Pipeline</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: 'clamp(26px, 5vw, 38px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '14px',
            color: 'var(--text-primary)'
          }}>
            How Bang AI Creates Videos in 3 Seamless Steps
          </h2>
          <p style={{ fontSize: isMobile ? '14.5px' : '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            From raw prompt or voice note to a polished, published cinematic video in under 2 minutes.
          </p>
        </div>

        {/* 3-Step Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(290px, 100%), 1fr))',
          gap: isMobile ? '16px' : '24px',
          marginBottom: isMobile ? '50px' : '80px'
        }}>
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="saas-card saas-card-interactive"
              style={{
                padding: isMobile ? '22px 18px' : '30px 24px',
                position: 'relative',
                borderRadius: '20px',
                border: '1.5px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${s.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${s.color}30`
                  }}>
                    {s.icon}
                  </div>

                  <span style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '28px',
                    fontWeight: 900,
                    color: 'var(--border-medium)',
                    lineHeight: 1
                  }}>
                    {s.step}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '10px',
                  letterSpacing: '-0.01em'
                }}>
                  {s.title}
                </h3>

                <p style={{
                  fontSize: '13.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55
                }}>
                  {s.desc}
                </p>
              </div>

              <div style={{
                marginTop: '20px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                color: '#38bdf8',
                fontWeight: 600
              }}>
                <CheckCircle2 size={13} /> Automated In 10 Seconds
              </div>
            </div>
          ))}
        </div>

        {/* 6-Engine Feature Grid */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px auto' }}>
          <span className="badge badge-amber" style={{ marginBottom: '12px' }}>
            <Sliders size={13} />
            <span>Industrial-Grade Technology</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: 'clamp(24px, 4.5vw, 34px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)'
          }}>
            The 6 Pillars Powering Every Bang AI Production
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
          gap: isMobile ? '16px' : '24px'
        }}>
          {gridFeatures.map((f, i) => (
            <div
              key={i}
              className="saas-card saas-card-interactive"
              style={{
                padding: '24px',
                borderRadius: '18px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--bg-input)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {f.icon}
                  </div>

                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-input)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {f.tag}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  {f.title}
                </h3>

                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
