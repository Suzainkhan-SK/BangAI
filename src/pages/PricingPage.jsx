import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  HelpCircle,
  Film,
  Crown,
  Lock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Globe2,
  Clock,
  HeartHandshake,
  CreditCard,
  Layers,
  Sliders,
  Share2,
  Code2,
  Minus
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { useBreakpoint } from '../hooks/useMediaQuery';

export default function PricingPage({ user, onNavigateToRegister, onNavigateToDashboard, onSelectPlan }) {
  const { isMobile, isTablet } = useBreakpoint();
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(0);

  const handleAction = (planId) => {
    audioEngine.playSfx('boom');
    if (onSelectPlan) {
      onSelectPlan(planId);
    } else if (user && onNavigateToDashboard) {
      onNavigateToDashboard();
    } else if (onNavigateToRegister) {
      onNavigateToRegister();
    }
  };

  const plans = [
    {
      id: 'starter',
      name: 'Free Starter',
      badge: 'Sandbox',
      price: '$0',
      period: 'forever',
      description: 'Ideal for creators testing the autonomous engine and producing their first viral videos.',
      features: [
        '5 Full AI Videos / Month',
        'All Aspect Ratios (9:16, 16:9, 1:1)',
        'Full HD 1080p Master Export',
        'Studio Voice Models in 31+ Languages',
        'Word-by-Word Kinetic Subtitles',
        'Curated Background Music Library',
        'Zero Watermark on All Exports',
        'Community Creator Support'
      ],
      btnText: user ? 'Current Free Tier' : 'Start Free Sandbox',
      popular: false,
      btnClass: 'btn-outline'
    },
    {
      id: 'pro',
      name: 'Creator Pro',
      badge: 'MOST POPULAR',
      price: isAnnual ? '$29' : '$39',
      period: 'per month',
      description: 'Everything serious creators, agencies, and faceless channels need to scale across networks.',
      features: [
        '50 Full AI Videos / Month',
        'Full HD 1080p & 4K Master Renders',
        'All Studio Voice Models with Emotion Pitch',
        'Smart -18dB Acoustic Speech Ducking',
        '7-Checkpoint Narrative Quality Critic',
        '1-Click Direct Syndication (YouTube, Reels, TikTok, LinkedIn)',
        'Kinetic Subtitles with Emoji & Font Presets',
        'High-CTR AI SEO Titles, Descriptions & Pinned Questions',
        'Priority GPU Rendering Queue',
        'Priority 24/7 Creator Support'
      ],
      btnText: user ? 'Upgrade to Pro' : 'Get Creator Pro',
      popular: true,
      btnClass: 'btn-glow'
    },
    {
      id: 'agency',
      name: 'Studio Agency',
      badge: 'ENTERPRISE',
      price: isAnnual ? '$89' : '$119',
      period: 'per month',
      description: 'For media companies, marketing agencies, and high-volume automated content networks.',
      features: [
        'Unlimited AI Videos / Month',
        'Omnichannel Syndication across 4 Networks',
        'Custom Voice Cloning & Custom Music Ingestion',
        'Developer REST API & Enterprise Webhooks',
        'Dedicated Cloud Compute Priority',
        'Multi-Channel YouTube & Social Management',
        'Full Commercial Rights & White-Label Export',
        'Dedicated 24/7 Technical Account Manager'
      ],
      btnText: user ? 'Upgrade to Agency' : 'Scale with Agency',
      popular: false,
      btnClass: 'btn-outline'
    }
  ];

  // Feature Comparison Matrix Data
  const comparisonSections = [
    {
      category: 'Video Generation & Formats',
      rows: [
        { name: 'Monthly Video Quota', starter: '5 Videos', pro: '50 Videos', agency: 'Unlimited' },
        { name: '9:16 Vertical (Shorts, Reels, TikTok)', starter: true, pro: true, agency: true },
        { name: '16:9 Cinema (YouTube, Web, TV)', starter: true, pro: true, agency: true },
        { name: '1:1 Square (Feed & Paid Ads)', starter: true, pro: true, agency: true },
        { name: 'Max Render Resolution', starter: '1080p Full HD', pro: '4K Ultra HD', agency: '4K Ultra Broadcast' },
        { name: 'Watermark-Free Export', starter: true, pro: true, agency: true },
        { name: 'GPU Rendering Queue', starter: 'Standard', pro: 'Priority Fast-Lane', agency: 'Dedicated Cluster' }
      ]
    },
    {
      category: 'Audio, Speech & Sound Design',
      rows: [
        { name: 'Languages & Dialects Supported', starter: '31+ Languages', pro: '31+ Languages', agency: '31+ Languages' },
        { name: 'Studio Voice Synthesis', starter: 'Standard Models', pro: 'Expressive Emotion Pitch', agency: 'Custom Voice Cloning' },
        { name: 'Smart -18dB Audio Ducking', starter: 'Basic', pro: 'Automated Curve (-18dB)', agency: 'Custom Ducking Profiles' },
        { name: 'Dynamic Background Music', starter: 'Standard Library', pro: 'Curated Multi-Genre', agency: 'Custom Music Ingestion' },
        { name: 'Cinematic Sound Effects & Whooshes', starter: false, pro: true, agency: true }
      ]
    },
    {
      category: 'Subtitles & Narrative Quality',
      rows: [
        { name: 'Kinetic Subtitles & Emoji Sync', starter: true, pro: true, agency: true },
        { name: 'Custom Subtitle Font Presets', starter: '1 Style', pro: 'All Creator Styles', agency: 'Custom Brand Typography' },
        { name: '7-Checkpoint Quality Critic', starter: false, pro: true, agency: true },
        { name: 'Automated Curiosity Hook Engine', starter: true, pro: true, agency: true }
      ]
    },
    {
      category: 'Publishing, API & Automation',
      rows: [
        { name: '1-Click Direct YouTube Upload', starter: true, pro: true, agency: true },
        { name: 'Multi-Platform Syndication (Reels, TikTok, LinkedIn)', starter: false, pro: true, agency: true },
        { name: 'Auto-Pin Curiosity Question Comment', starter: false, pro: true, agency: true },
        { name: 'Developer REST API Access', starter: false, pro: 'Standard API', agency: 'High-Volume Enterprise API' },
        { name: 'Cloud Event Webhooks', starter: false, pro: false, agency: true },
        { name: 'Google Sheets Multi-Sheet Sync', starter: true, pro: true, agency: true }
      ]
    },
    {
      category: 'Licensing & Creator Support',
      rows: [
        { name: 'Commercial Rights & Monetization', starter: true, pro: true, agency: true },
        { name: 'YouTube & Social Monetization Safe', starter: true, pro: true, agency: true },
        { name: 'Support SLA', starter: 'Community Help', pro: 'Priority 24/7 Creator Support', agency: 'Dedicated Account Manager' }
      ]
    }
  ];

  // Pricing FAQs
  const faqs = [
    {
      q: 'Can I monetize videos generated with Bang AI on YouTube and TikTok?',
      a: 'Yes, 100%. All visual scenes, studio voiceovers, and dynamic soundtrack scores generated through Bang AI include full commercial rights. You own your content completely and can monetize immediately via YouTube Partner Program, TikTok Creator Rewards, and Instagram Reels bonuses.'
    },
    {
      q: 'Can I cancel, upgrade, or downgrade my plan at any time?',
      a: 'Yes, absolutely. There are zero long-term contracts. You can cancel or change your plan at any time directly from your billing settings. If you cancel, your subscription remains active until the end of your current billing period.'
    },
    {
      q: 'Do you put watermarks on videos created on the Free Starter plan?',
      a: 'No. Every video exported from Bang AI is completely watermark-free, even on our Free Starter plan. We want you to see the real production quality before deciding to scale.'
    },
    {
      q: 'What formats and aspect ratios are supported across plans?',
      a: 'All plans include full support for 9:16 Vertical (ideal for Shorts, Reels, and TikTok), 16:9 Cinematic Widescreen (ideal for YouTube longform, TV, and web), and 1:1 Square (for feeds and paid ads).'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover), as well as Apple Pay, Google Pay, and international bank transfers for Enterprise Studio plans.'
    },
    {
      q: 'Is there a money-back guarantee?',
      a: 'Yes! We offer an unconditional 14-day money-back guarantee on all paid plans. If you are not completely delighted with your video output quality, simply reach out to support for a prompt refund.'
    }
  ];

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: isMobile ? '24px 12px 60px 12px' : '50px 24px 90px 24px' }}>
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', maxWidth: '780px', margin: isMobile ? '0 auto 32px auto' : '0 auto 48px auto' }}>
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
            Transparent Predictable Pricing
          </span>
        </div>

        <h1 className="font-display" style={{
          fontSize: 'clamp(26px, 6vw, 46px)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          marginBottom: '16px',
          color: 'var(--text-primary)'
        }}>
          Simple Plans for <span className="grad-text">Every Creator & Studio</span>
        </h1>
        <p style={{ fontSize: isMobile ? '14.5px' : '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          No hidden rendering fees. Zero watermarks. Full commercial rights. 
          Choose the plan that powers your multi-platform video output.
        </p>

        {/* ── MONTHLY / ANNUAL BILLING TOGGLE ─────────────────────── */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: '999px',
          padding: '4px',
          marginTop: isMobile ? '20px' : '28px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <button
            type="button"
            onClick={() => {
              audioEngine.playSfx('click');
              setIsAnnual(false);
            }}
            style={{
              padding: isMobile ? '7px 14px' : '8px 20px',
              borderRadius: '999px',
              border: 'none',
              background: !isAnnual ? 'var(--accent-primary)' : 'transparent',
              color: !isAnnual ? '#ffffff' : 'var(--text-secondary)',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => {
              audioEngine.playSfx('click');
              setIsAnnual(true);
            }}
            style={{
              padding: isMobile ? '7px 14px' : '8px 20px',
              borderRadius: '999px',
              border: 'none',
              background: isAnnual ? 'var(--accent-primary)' : 'transparent',
              color: isAnnual ? '#ffffff' : 'var(--text-secondary)',
              fontSize: isMobile ? '12px' : '13px',
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
              fontSize: '10.5px',
              background: '#10b981',
              color: '#ffffff',
              padding: '2px 7px',
              borderRadius: '99px',
              fontWeight: 800,
              letterSpacing: '0.02em'
            }}>
              SAVE 25%
            </span>
          </button>
        </div>
      </div>

      {/* ── PRICING CARDS GRID ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(310px, 100%), 1fr))',
        gap: isMobile ? '16px' : '24px',
        marginBottom: isMobile ? '40px' : '64px',
        alignItems: 'stretch'
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="saas-card"
            style={{
              borderRadius: isMobile ? '20px' : '24px',
              padding: isMobile ? '24px 18px' : '36px 30px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: plan.popular ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              boxShadow: plan.popular ? 'var(--shadow-glow)' : 'var(--shadow-card)',
              background: 'var(--bg-card)',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}
          >
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: '-13px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 14px',
                borderRadius: '99px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 14px rgba(255, 79, 0, 0.4)'
              }}>
                {plan.badge}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 className="font-display" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {plan.name}
                </h3>
                {!plan.popular && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-pill)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    {plan.badge}
                  </span>
                )}
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '22px', minHeight: isMobile ? 'auto' : '38px', lineHeight: 1.5 }}>
                {plan.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '26px' }}>
                <span className="font-display" style={{ fontSize: 'clamp(36px, 6vw, 48px)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
                  /{plan.period}
                </span>
              </div>

              {/* Feature Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '22px' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    <Check size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleAction(plan.id)}
              className={plan.popular ? 'btn-glow' : 'btn-outline'}
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '14px', fontWeight: 700, marginTop: isMobile ? '22px' : '32px' }}
            >
              <span>{plan.btnText}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* ── TRUST & SATISFACTION BANNER ────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: isMobile ? '12px' : '16px',
        marginBottom: isMobile ? '40px' : '64px'
      }}>
        {[
          { icon: <HeartHandshake size={20} color="var(--accent-primary)" />, title: '14-Day Money-Back Guarantee', desc: 'Risk-free trial. Full refund if not completely satisfied.' },
          { icon: <ShieldCheck size={20} color="#10b981" />, title: 'Full Commercial Rights', desc: '100% monetization-safe content with zero copyright claims.' },
          { icon: <Clock size={20} color="#38bdf8" />, title: 'Cancel Anytime in 1-Click', desc: 'Zero long-term lock-in. Downgrade or pause whenever you wish.' },
          { icon: <CreditCard size={20} color="#f59e0b" />, title: 'No Hidden Export Fees', desc: 'Predictable pricing with full transparency on every render.' }
        ].map((item, idx) => (
          <div
            key={idx}
            className="saas-card"
            style={{
              padding: isMobile ? '16px' : '20px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--bg-input)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── DETAILED FEATURE COMPARISON TABLE ──────────────────────── */}
      <div className="saas-card" style={{ padding: isMobile ? '20px 14px' : '36px', borderRadius: isMobile ? '18px' : '24px', marginBottom: isMobile ? '40px' : '64px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: isMobile ? '0 auto 20px auto' : '0 auto 36px auto' }}>
          <h2 className="font-display" style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Compare Plan Capabilities
          </h2>
          <p style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-secondary)' }}>
            Deep-dive into technical features, export quotas, and automation tools across every tier.
          </p>
        </div>

        {isMobile && (
          <div style={{
            fontSize: '11.5px',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span>👉</span>
            <span>Swipe horizontally to compare all features</span>
          </div>
        )}

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: isMobile ? '560px' : '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-medium)' }}>
                <th style={{ padding: isMobile ? '12px 10px' : '14px 16px', fontSize: isMobile ? '13px' : '14px', fontWeight: 800, color: 'var(--text-primary)', width: '40%' }}>
                  Features & Capabilities
                </th>
                <th style={{ padding: isMobile ? '12px 10px' : '14px 16px', fontSize: isMobile ? '12.5px' : '13.5px', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', width: '20%' }}>
                  Free Starter
                </th>
                <th style={{ padding: isMobile ? '12px 10px' : '14px 16px', fontSize: isMobile ? '12.5px' : '13.5px', fontWeight: 800, color: 'var(--accent-primary)', textAlign: 'center', width: '20%' }}>
                  Creator Pro
                </th>
                <th style={{ padding: isMobile ? '12px 10px' : '14px 16px', fontSize: isMobile ? '12.5px' : '13.5px', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', width: '20%' }}>
                  Studio Agency
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonSections.map((sec, secIdx) => (
                <React.Fragment key={secIdx}>
                  <tr style={{ background: 'var(--bg-input)' }}>
                    <td
                      colSpan={4}
                      style={{
                        padding: isMobile ? '8px 10px' : '10px 16px',
                        fontSize: isMobile ? '11px' : '12px',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {sec.category}
                    </td>
                  </tr>
                  {sec.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: isMobile ? '10px 10px' : '12px 16px', fontSize: isMobile ? '12px' : '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {row.name}
                      </td>
                      <td style={{ padding: isMobile ? '10px 8px' : '12px 16px', fontSize: isMobile ? '11.5px' : '12.5px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {typeof row.starter === 'boolean' ? (
                          row.starter ? <Check size={16} color="#10b981" style={{ margin: '0 auto' }} /> : <Minus size={16} color="var(--text-muted)" style={{ margin: '0 auto' }} />
                        ) : row.starter}
                      </td>
                      <td style={{ padding: isMobile ? '10px 8px' : '12px 16px', fontSize: isMobile ? '11.5px' : '12.5px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? <Check size={16} color="#10b981" style={{ margin: '0 auto' }} /> : <Minus size={16} color="var(--text-muted)" style={{ margin: '0 auto' }} />
                        ) : row.pro}
                      </td>
                      <td style={{ padding: isMobile ? '10px 8px' : '12px 16px', fontSize: isMobile ? '11.5px' : '12.5px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 700 }}>
                        {typeof row.agency === 'boolean' ? (
                          row.agency ? <Check size={16} color="#10b981" style={{ margin: '0 auto' }} /> : <Minus size={16} color="var(--text-muted)" style={{ margin: '0 auto' }} />
                        ) : row.agency}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PRICING FAQ ACCORDION ──────────────────────────────────── */}
      <div className="saas-card" style={{ padding: isMobile ? '20px 14px' : '36px', borderRadius: isMobile ? '18px' : '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: isMobile ? '0 auto 24px auto' : '0 auto 32px auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
            <HelpCircle size={15} />
            <span>PRICING & BILLING QUESTIONS</span>
          </div>
          <h2 className="font-display" style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Frequently Asked Billing Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '820px', margin: '0 auto' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                onClick={() => {
                  audioEngine.playSfx('click');
                  setOpenFaq(isOpen ? -1 : idx);
                }}
                style={{
                  background: isOpen ? 'var(--bg-elevated)' : 'var(--bg-input)',
                  border: `1.5px solid ${isOpen ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  borderRadius: isMobile ? '14px' : '16px',
                  padding: isMobile ? '14px 14px' : '18px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <h3 style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 700, color: isOpen ? 'var(--accent-primary)' : 'var(--text-primary)', margin: 0 }}>
                    {faq.q}
                  </h3>
                  {isOpen ? <ChevronUp size={18} color="var(--accent-primary)" style={{ flexShrink: 0 }} /> : <ChevronDown size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
                </div>

                {isOpen && (
                  <p style={{ fontSize: isMobile ? '13px' : '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '12px', marginBottom: 0 }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
