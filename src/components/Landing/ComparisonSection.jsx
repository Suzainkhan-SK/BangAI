import React from 'react';
import { X, Check, Clock, DollarSign, Sparkles, Zap, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function ComparisonSection() {
  const comparisons = [
    {
      feature: 'Story & Screenplay Writing',
      oldWay: '3–4 hours researching topics, structuring hooks, writing scripts manually',
      shortsAi: 'Stage 0–2 AI Engine auto-writes 5 scenes with strict 190–200 character pacing in 10s',
      highlight: true
    },
    {
      feature: 'Voiceover & Audio Narration',
      oldWay: 'Hiring voice actors ($50–$150/video) or recording mic audio with retakes',
      shortsAi: 'Studio ElevenLabs Turbo v2.5 voice models with automatic pitch and speed casting',
      highlight: true
    },
    {
      feature: 'Video & CGI Footage Creation',
      oldWay: 'Searching generic stock footage libraries or paying 3D VFX artists ($300+)',
      shortsAi: 'Grok Imagine 1.5 generates 5 direct 4K 9:16 vertical video scenes in parallel',
      highlight: true
    },
    {
      feature: 'Subtitles, BGM & Sound Design',
      oldWay: '2 hours manually syncing word-by-word captions and setting volume keyframes',
      shortsAi: 'Automatic animated word-by-word subtitle burn & -18dB dynamic BGM ducking',
      highlight: true
    },
    {
      feature: 'YouTube Upload & SEO Tagging',
      oldWay: 'Manual export, upload, writing descriptions, picking tags, pinning comments',
      shortsAi: '1-Click automated YouTube Data API v3 upload with curiosity-gap title and pinned comment',
      highlight: true
    },
    {
      feature: 'Total Production Time',
      oldWay: '⏱️ 6 to 8 Hours per video ($200+ cost)',
      shortsAi: '⚡ Under 75 Seconds (1-Click Automated)',
      isGrandSummary: true
    }
  ];

  return (
    <section style={{ padding: '80px 0', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px auto' }}>
          <span className="badge badge-amber" style={{ marginBottom: '12px' }}>
            <Flame size={13} />
            <span>The Creator Revolution</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '14px',
            color: 'var(--text-primary)'
          }}>
            Old Manual Editing vs. ShortsAI Studio
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            See why over 100,000+ creators and media agencies switched from complex video editors to our 1-click pipeline.
          </p>
        </div>

        {/* Comparison Table Card */}
        <div className="saas-card" style={{
          overflow: 'hidden',
          borderRadius: '24px',
          border: '1.5px solid var(--border-glow)',
          boxShadow: 'var(--shadow-glow)'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1.2fr',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-medium)',
            padding: '18px 24px',
            fontWeight: 800,
            fontSize: '14px'
          }}>
            <div style={{ color: 'var(--text-muted)' }}>PRODUCTION STEP</div>
            <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <X size={16} /> TRADITIONAL MANUAL EDITING
            </div>
            <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} /> SHORTSAI 75S AUTONOMOUS
            </div>
          </div>

          {/* Table Rows */}
          {comparisons.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1.2fr',
                padding: '20px 24px',
                borderBottom: idx < comparisons.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                background: row.isGrandSummary ? 'rgba(99, 102, 241, 0.12)' : idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              {/* Feature */}
              <div style={{ fontWeight: 700, fontSize: row.isGrandSummary ? '16px' : '13.5px', color: 'var(--text-primary)' }}>
                {row.feature}
              </div>

              {/* Old Way */}
              <div style={{
                fontSize: '13px',
                color: row.isGrandSummary ? '#f87171' : 'var(--text-secondary)',
                fontWeight: row.isGrandSummary ? 800 : 400,
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <span style={{ color: '#ef4444', marginTop: '2px' }}>✕</span>
                <span>{row.oldWay}</span>
              </div>

              {/* ShortsAI */}
              <div style={{
                fontSize: '13px',
                color: row.isGrandSummary ? '#34d399' : 'var(--text-primary)',
                fontWeight: row.isGrandSummary ? 900 : 600,
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <span style={{ color: '#10b981', marginTop: '2px' }}>✓</span>
                <span>{row.shortsAi}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
