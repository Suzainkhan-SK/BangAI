import React, { useState } from 'react';
import { Check, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function Pricing({ onSelectPlan }) {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Free Creator',
      badge: 'Starter',
      price: '$0',
      period: 'forever',
      desc: 'Perfect for exploring the AI studio and creating your first viral short.',
      features: [
        '3 75-Second Shorts / Month',
        'Grok Imagine 1.5 Video Generation',
        'Standard ElevenLabs Voice Models',
        '5 Curated Background Music Tracks',
        'Standard 1080p 9:16 Render',
        'Community Support'
      ],
      isPopular: false,
      btnText: 'Start Free',
      btnClass: 'btn-outline'
    },
    {
      name: 'Creator Pro',
      badge: 'Most Popular',
      price: isYearly ? '$29' : '$39',
      period: 'per month',
      desc: 'For serious YouTubers and content creators scaling their channel to millions of views.',
      features: [
        '50 75-Second Shorts / Month',
        'Priority Grok 1.5 Parallel Video Generation',
        'All 6 ElevenLabs Turbo v2.5 Voices',
        'Dynamic BGM Library with Speech Ducking',
        '7-Checkpoint Story Quality Critic Auditor',
        '1-Click Auto YouTube Upload & Pinned Comments',
        'High-CTR AI Thumbnail & Cover Art Generator',
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
      desc: 'For media companies, marketing agencies, and automated faceless channel networks.',
      features: [
        'Unlimited 75-Second Shorts Generation',
        'Multi-Channel YouTube & TikTok Automation',
        'Custom Voice Cloning & Custom Music Ingestion',
        'API Webhook Access & Automated Ingestion',
        'Dedicated Cloud n8n Infrastructure',
        'Dedicated Account Manager'
      ],
      isPopular: false,
      btnText: 'Contact Agency Team',
      btnClass: 'btn-outline'
    }
  ];

  return (
    <section id="pricing" style={{ paddingTop: 'clamp(48px, 8vw, 80px)', paddingBottom: 'clamp(48px, 8vw, 80px)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px auto' }}>
          <span className="badge badge-brand" style={{ marginBottom: '12px' }}>
            <Sparkles size={13} />
            <span>Transparent Pricing</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: 'clamp(26px, 5vw, 36px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '14px',
            color: 'var(--text-primary)'
          }}>
            Simple, Predictable Plans for Every Creator
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            Start free, upgrade as your channel grows. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            padding: '4px 6px',
            borderRadius: '99px',
            marginTop: '24px'
          }}>
            <button
              onClick={() => {
                audioEngine.playSfx('click');
                setIsYearly(false);
              }}
              style={{
                background: !isYearly ? 'var(--accent-primary)' : 'transparent',
                color: !isYearly ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '99px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => {
                audioEngine.playSfx('click');
                setIsYearly(true);
              }}
              style={{
                background: isYearly ? 'var(--accent-primary)' : 'transparent',
                color: isYearly ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '99px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Yearly</span>
              <span style={{ background: '#10b981', color: '#000000', fontSize: '10px', fontWeight: 800, padding: '1px 5px', borderRadius: '99px' }}>
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
          gap: '24px',
          alignItems: 'stretch'
        }}>
          {plans.map((p, idx) => (
            <div
              key={idx}
              className="saas-card"
              style={{
                padding: '32px 24px',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                border: p.isPopular ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                boxShadow: p.isPopular ? 'var(--shadow-glow)' : 'var(--shadow-card)',
                background: p.isPopular ? 'var(--bg-card-hover)' : 'var(--bg-card)'
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
                  padding: '3px 14px',
                  borderRadius: '99px',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 10px rgba(99,102,241,0.5)'
                }}>
                  {p.badge}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <h3 className="font-display" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {p.name}
                  </h3>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', minHeight: '38px' }}>
                  {p.desc}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                  <span className="font-display" style={{ fontSize: 'clamp(32px, 5.4vw, 40px)', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {p.price}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    / {p.period}
                  </span>
                </div>

                {/* Features list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                  {p.features.map((feat, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Check size={11} color="#10b981" strokeWidth={3} />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  audioEngine.playSfx('boom');
                  onSelectPlan(p.name);
                }}
                className={p.btnClass}
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <span>{p.btnText}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
