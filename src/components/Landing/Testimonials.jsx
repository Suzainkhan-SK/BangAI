import React from 'react';
import { Star, CheckCircle, Quote, Sparkles } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useMediaQuery';

const TESTIMONIALS = [
  {
    name: 'Marcus Vance',
    role: 'Documentary Channel Producer',
    avatar: '🎬',
    stars: 5,
    tag: 'Longform & Shorts',
    quote: 'Being able to take one historical concept and generate both 9:16 vertical shorts and 16:9 widescreen cinema without re-editing saves our studio at least 15 hours every single week.'
  },
  {
    name: 'Elena Rostova',
    role: 'Multilingual Content Creator',
    avatar: '🎙️',
    stars: 5,
    tag: '31+ Languages',
    quote: 'The pronunciation accuracy in Spanish and French blew me away. The voice emotional pitch sounds like a genuine studio narrator, not an artificial robot.'
  },
  {
    name: 'David Chen',
    role: 'Faceless Media Agency Founder',
    avatar: '⚡',
    stars: 5,
    tag: 'Multi-Platform',
    quote: 'We run 4 channels across YouTube, Instagram, and TikTok. Bang AI eliminated our bottleneck—our team handles the prompt direction, and the engine handles scripting, visuals, and dynamic subtitles.'
  },
  {
    name: 'Aisha Patel',
    role: 'Tech & Science Educator',
    avatar: '🧬',
    stars: 5,
    tag: 'Kinetic Subtitles',
    quote: 'The automatic -18dB background music ducking is brilliant. The voice narration is always crystal clear over the score, and the burned-in captions mean sound-off mobile viewers stay hooked.'
  },
  {
    name: 'Jordan Miller',
    role: 'Social Growth Lead',
    avatar: '🚀',
    stars: 5,
    tag: 'Format Agnostic',
    quote: 'Most AI video generators only do one format or limit you to 60-second clips. Bang AI gives us total flexibility for 1:1 ads, vertical reels, and full-length explainers.'
  },
  {
    name: 'Sofia Al-Mansoor',
    role: 'Brand Storyteller',
    avatar: '✨',
    stars: 5,
    tag: 'Studio Master',
    quote: 'The visual consistency across scenes is what sets this apart. It creates a coherent narrative arc from the first hook to the final payoff rather than disjointed random clips.'
  }
];

export default function Testimonials() {
  const { isMobile } = useBreakpoint();

  return (
    <section style={{
      paddingTop: isMobile ? '56px' : '90px',
      paddingBottom: isMobile ? '56px' : '90px',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-subtle)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: isMobile ? '0 auto 36px auto' : '0 auto 52px auto' }}>
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
              Creator Community
            </span>
          </div>

          <h2 className="font-display" style={{
            fontSize: 'clamp(28px, 5.5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
            color: 'var(--text-primary)'
          }}>
            Trusted by Storytellers & <span className="grad-text">Digital Studios</span>
          </h2>

          <p style={{
            fontSize: isMobile ? '15px' : '17px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Here is how modern creators and media teams are streamlining their video production workflows with Bang AI.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px'
        }}>
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="saas-card"
              style={{
                padding: '24px',
                borderRadius: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                {/* Top row: stars + tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[...Array(t.stars)].map((_, i) => (
                      <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    background: 'rgba(255, 79, 0, 0.08)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {t.tag}
                  </span>
                </div>

                {/* Quote */}
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  fontStyle: 'normal',
                  marginBottom: '20px'
                }}>
                  "{t.quote}"
                </p>
              </div>

              {/* Author footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t.name}
                    </span>
                    <CheckCircle size={13} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
