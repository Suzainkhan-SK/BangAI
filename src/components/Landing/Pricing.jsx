import React, { useState } from 'react';
import { Check, Sparkles, Zap, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { useBreakpoint } from '../../hooks/useMediaQuery';

export default function Pricing({ onSelectPlan }) {
  const { isMobile } = useBreakpoint();
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Free Creator',
      badge: 'Starter',
      price: '$0',
      period: 'forever',
      desc: 'Perfect for exploring the AI studio and creating your first viral videos.',
      features: [
        '5 Full AI Videos / Month',
        'All Aspect Ratios (9:16, 16:9, 1:1)',
        'Proprietary High-Fidelity Video Engine',
        'Studio Voice Synthesis & Narration',
        'Curated Dynamic Soundtrack Library',
        'Full HD 1080p Master Export',
        'Community Creator Support'
      ],
      isPopular: false,
      btnText: 'Start Free — No Card Needed',
      btnClass: 'btn-outline'
    },
    {
      name: 'Creator Pro',
      badge: 'Most Popular',
      price: isYearly ? '$29' : '$39',
      period: 'per month',
      desc: 'For serious creators, agencies, and faceless channels scaling cross-platform.',
      features: [
        '50 Full AI Videos / Month',
        'Priority Parallel Scene Generation',
        'All Studio Voice Models in 31+ Languages',
        'Dynamic BGM with -18dB Speech Ducking',
        '7-Checkpoint Narrative Quality Critic',
        '1-Click Publishing (YouTube, Reels, TikTok, LinkedIn)',
        'Kinetic Subtitles with Emoji & Font Presets',
        'High-CTR AI Thumbnail & Title Suggestions',
        'Priority 24/7 Creator Support'
      ],
      isPopular: true,
      btnText: 'Get Creator Pro',
      btnClass: 'btn-glow'
    },
    {
      name: 'Studio Agency',
      badge: 'Enterprise',
      price: isYearly ? '$99' : '$129',
      period: 'per month',
      desc: 'For media companies, marketing agencies, and automated content networks.',
      features: [
        'Unlimited AI Video Generations',
        'Omnichannel Syndication across 4 Networks',
        'Custom Voice Cloning & Custom Music Ingestion',
        'Developer REST API & Enterprise Webhooks',
        'Dedicated Cloud Compute Priority',
        'Commercial Rights & White-Label Export',
        'Dedicated Technical Account Manager'
      ],
      isPopular: false,
      btnText: 'Contact Agency Team',
      btnClass: 'btn-outline'
    }
  ];

  const handleToggle = () => {
    audioEngine.playSfx('click');
    setIsYearly(!isYearly);
  };

  return (
    <section id="pricing" style={{
      paddingTop: isMobile ? '48px' : '80px',
      paddingBottom: isMobile ? '48px' : '80px',
      borderTop: '1px solid var(--border-subtle)'
    }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
          <span className="badge badge-brand" style={{ marginBottom: '12px' }}>
            <Sparkles size={13} />
            <span>Transparent Creator Pricing</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: 'clamp(26px, 5vw, 38px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '14px',
            color: 'var(--text-primary)'
          }}>
            Simple, Transparent Plans for Every Creator
          </h2>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-secondary)' }}>
            Start for free. Scale when you're ready to dominate YouTube, Reels, TikTok, and LinkedIn.
          </p>

          {/* Monthly / Annual Toggle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '24px',
            background: 'var(--bg-input)',
            padding: '4px 6px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={handleToggle}
              style={{
                background: !isYearly ? 'var(--grad-primary)' : 'transparent',
                color: !isYearly ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Monthly Billing
            </button>

            <button
              type="button"
              onClick={handleToggle}
              style={{
                background: isYearly ? 'var(--grad-primary)' : 'transparent',
                color: isYearly ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Annual Billing</span>
              <span style={{
                background: '#10b981',
                color: '#ffffff',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '5px',
                fontWeight: 800
              }}>
                SAVE 25%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(290px, 100%), 1fr))',
          gap: isMobile ? '20px' : '28px',
          alignItems: 'stretch',
          maxWidth: '1100px',
          margin: '0 auto'
        }}>
          {plans.map((p, idx) => (
            <div
              key={idx}
              className="saas-card"
              style={{
                padding: isMobile ? '24px 20px' : '32px 28px',
                borderRadius: '24px',
                border: p.isPopular ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                boxShadow: p.isPopular ? 'var(--shadow-glow)' : 'var(--shadow-card)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {p.isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--grad-primary)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 12px',
                  borderRadius: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                }}>
                  {p.badge}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {p.name}
                  </h3>
                  {!p.isPopular && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {p.badge}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px', minHeight: '40px' }}>
                  {p.desc}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '42px', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {p.price}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    /{p.period}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '28px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  {p.features.map((feat, fIdx) => (
                    <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <Check size={16} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  audioEngine.playSfx('boom');
                  onSelectPlan(p);
                }}
                className={p.btnClass}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px 18px',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: '12px'
                }}
              >
                <span>{p.btnText}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
