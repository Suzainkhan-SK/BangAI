import React, { useState } from 'react';
import { Check, Sparkles, Zap, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

export default function PricingPage({ onSelectPlan }) {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      id: 'starter',
      name: 'Free Starter',
      badge: 'Test Free',
      price: '$0',
      period: 'forever',
      description: 'Ideal for trying out 75-second multi-scene shorts creation.',
      features: [
        '10 75-second Shorts per month',
        'Standard HD 1080p Export',
        '2 ElevenLabs Voice Models (Adam & Priya)',
        '3 Visual Art Styles',
        'Standard YouTube Upload'
      ],
      btnText: 'Start Free Trial',
      popular: false
    },
    {
      id: 'pro',
      name: 'Creator Pro',
      badge: 'MOST POPULAR',
      price: isAnnual ? '$29' : '$39',
      period: 'per month',
      description: 'Everything serious faceless channel creators need to dominate.',
      features: [
        '100 75-second Shorts per month',
        '1080×1920 Full HD master export',
        'All 6 ElevenLabs Turbo v2.5 Voices',
        'All 6 Visual Art Styles + Pixar 3D',
        'Automatic Word-by-Word Subtitle Burn',
        '1-Click Automated YouTube Upload',
        'Priority GPU Video Rendering'
      ],
      btnText: 'Get Creator Pro',
      popular: true
    },
    {
      id: 'agency',
      name: 'Studio Agency',
      badge: 'SCALE CHANNELS',
      price: isAnnual ? '$89' : '$119',
      period: 'per month',
      description: 'For media companies running 5+ monetized YouTube channels.',
      features: [
        '500 75-second Shorts per month',
        'Unlimited 1080×1920 master exports',
        'Custom ElevenLabs Voice Cloning',
        'Custom Art Style LoRA Training',
        'n8n & REST API Webhook Access',
        'Multi-Channel YouTube Integration',
        'Dedicated 24/7 Account Manager'
      ],
      btnText: 'Get Studio Agency',
      popular: false
    }
  ];

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '50px 24px 80px 24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 40px auto' }}>
        <span className="badge badge-brand" style={{ marginBottom: '12px' }}>
          <Sparkles size={13} />
          <span>Simple, Transparent Pricing</span>
        </span>
        <h1 className="font-display" style={{ fontSize: 'clamp(27px, 5.2vw, 38px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '14px', color: 'var(--text-primary)' }}>
          Scale Your YouTube Shorts Empire
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Zero manual editing. Zero voice actors. Choose the plan that matches your ambition.
        </p>

        {/* Monthly/Yearly Toggle */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: '999px',
          padding: '4px',
          marginTop: '24px'
        }}>
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              setIsAnnual(false);
            }}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              border: 'none',
              background: !isAnnual ? 'var(--grad-primary)' : 'transparent',
              color: !isAnnual ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              setIsAnnual(true);
            }}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              border: 'none',
              background: isAnnual ? 'var(--grad-primary)' : 'transparent',
              color: isAnnual ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Annual Billing</span>
            <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
              Save 25%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(290px, 100%), 1fr))',
        gap: '24px'
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="saas-card"
            style={{
              borderRadius: '24px',
              padding: '32px 28px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: plan.popular ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              boxShadow: plan.popular ? 'var(--shadow-glow)' : 'var(--shadow-card)'
            }}
          >
            <div>
              {/* Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span className={plan.popular ? 'badge badge-brand' : 'badge'} style={{ fontSize: '11px' }}>
                  {plan.badge}
                </span>
              </div>

              {/* Title & Price */}
              <h3 className="font-display" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {plan.name}
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px', minHeight: '36px', lineHeight: 1.4 }}>
                {plan.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                <span className="font-display" style={{ fontSize: 'clamp(33px, 5.6vw, 42px)', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  /{plan.period}
                </span>
              </div>

              {/* Features list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                    <Check size={15} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                audioEngine.playSfx('boom');
                onSelectPlan(plan.id);
              }}
              className={plan.popular ? 'btn-glow' : 'btn-outline'}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '28px' }}
            >
              <span>{plan.btnText}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
