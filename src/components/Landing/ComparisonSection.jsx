import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Clock, 
  DollarSign, 
  Sparkles, 
  Zap, 
  Flame, 
  ShieldAlert, 
  CheckCircle2,
  TrendingUp,
  Sliders,
  Calculator
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { useBreakpoint } from '../../hooks/useMediaQuery';

export default function ComparisonSection() {
  const { isMobile, isTablet } = useBreakpoint();
  const [videoCount, setVideoCount] = useState(20);

  // ROI calculations
  // Traditional: 6 hrs/video, $150 cost/video
  // Bang AI: 2 mins/video, ~98% time saved
  const hoursSaved = Math.round(videoCount * 5.8);
  const dollarsSaved = Math.round(videoCount * 140);
  const potentialReach = (videoCount * 45).toLocaleString();

  const handleSliderChange = (e) => {
    setVideoCount(Number(e.target.value));
  };

  const comparisons = [
    {
      feature: 'Story & Screenplay Writing',
      oldWay: '45–60 minutes of manual scripting, hook research & scene planning',
      shortsAi: 'Stage 0–2 AI Engine auto-architects high-retention multi-act narrative in 10s',
      highlight: true
    },
    {
      feature: 'Voiceover & Actor Narration',
      oldWay: 'Hiring voice actors ($50–$150/video) or noisy amateur mic takes with endless re-records',
      shortsAi: 'Studio ElevenLabs Turbo v2.5 & 9,650+ voices in 31+ languages with emotional pitch calibration',
      highlight: true
    },
    {
      feature: 'Visual Footage & CGI Creation',
      oldWay: 'Browsing repetitive stock video sites or paying 3D VFX artists ($300+ per clip)',
      shortsAi: 'Wan 2.1 & Grok generate custom cinematic scenes in 9:16 vertical or 16:9 widescreen',
      highlight: true
    },
    {
      feature: 'Captions, Subtitles & Sound Design',
      oldWay: '2 hours manually typing word-by-word keyframes and keyframing audio volume',
      shortsAi: 'Automatic animated kinetic typography burn & -18dB dynamic speech ducking curves',
      highlight: true
    },
    {
      feature: 'Cross-Platform Formatting & SEO',
      oldWay: 'Manual re-rendering for each platform, writing separate descriptions, tags & titles',
      shortsAi: '1-Click automated publishing to YouTube, Instagram Reels, TikTok, and LinkedIn simultaneously',
      highlight: true
    },
    {
      feature: 'Total Production Time',
      oldWay: '⏱️ 6 to 8 Hours per video ($200+ cost)',
      shortsAi: '⚡ Under 60 Seconds (Fully Automated Pipeline)',
      isGrandSummary: true
    }
  ];

  return (
    <section style={{
      paddingTop: isMobile ? '52px' : '84px',
      paddingBottom: isMobile ? '52px' : '84px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)'
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: isMobile ? '0 auto 32px auto' : '0 auto 48px auto' }}>
          <span className="badge badge-amber" style={{ marginBottom: '12px' }}>
            <Flame size={13} />
            <span>The Creator Revolution</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: 'clamp(26px, 5vw, 38px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '14px',
            color: 'var(--text-primary)'
          }}>
            Traditional Manual Editing vs. Bang AI Studio
          </h2>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            See why over 120,000+ creators, media agencies, and faceless channels replaced 5 different editing tools with our unified engine.
          </p>
        </div>

        {/* Comparison Table Card */}
        <div className="saas-card" style={{
          overflow: 'hidden',
          borderRadius: isMobile ? '18px' : '24px',
          border: '1.5px solid var(--border-glow)',
          boxShadow: 'var(--shadow-glow)',
          marginBottom: '48px'
        }}>
          {/* Table Header (Desktop/Tablet) */}
          {!isTablet && !isMobile && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1.2fr',
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-medium)',
              padding: '18px 24px',
              fontWeight: 800,
              fontSize: '13.5px'
            }}>
              <div style={{ color: 'var(--text-muted)' }}>PRODUCTION STEP</div>
              <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <X size={16} /> TRADITIONAL MANUAL WORKFLOW
              </div>
              <div style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> BANG AI AUTONOMOUS STUDIO
              </div>
            </div>
          )}

          {/* Table Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {comparisons.map((row, idx) => {
              const isLast = idx === comparisons.length - 1;
              
              if (isTablet || isMobile) {
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '18px 16px',
                      borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                      background: row.isGrandSummary ? 'rgba(56, 189, 248, 0.06)' : 'transparent'
                    }}
                  >
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                      {row.feature}
                    </div>

                    <div style={{
                      background: 'rgba(239, 68, 68, 0.06)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)'
                    }}>
                      <span style={{ color: '#ef4444', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                        Old Way:
                      </span>
                      {row.oldWay}
                    </div>

                    <div style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      fontWeight: 600
                    }}>
                      <span style={{ color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                        Bang AI:
                      </span>
                      {row.shortsAi}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1.2fr',
                    padding: row.isGrandSummary ? '22px 24px' : '16px 24px',
                    borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                    alignItems: 'center',
                    background: row.isGrandSummary ? 'rgba(56, 189, 248, 0.06)' : 'transparent',
                    fontSize: '13.5px'
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {row.feature}
                  </div>

                  <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '16px' }}>
                    <X size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                    <span>{row.oldWay}</span>
                  </div>

                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <span>{row.shortsAi}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Creator ROI & Time-Saved Calculator */}
        <div className="saas-card" style={{
          padding: isMobile ? '24px 18px' : '36px 32px',
          borderRadius: '24px',
          border: '1.5px solid var(--border-subtle)',
          background: 'linear-gradient(135deg, rgba(16, 22, 40, 0.8) 0%, rgba(9, 13, 24, 0.95) 100%)'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 28px auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
              <Calculator size={15} />
              <span>INTERACTIVE PRODUCTIVITY CALCULATOR</span>
            </div>
            <h3 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Calculate How Much Time & Money You Save
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Drag the slider to see your monthly savings compared to traditional editors and voice talent.
            </p>
          </div>

          {/* Slider Control */}
          <div style={{ maxWidth: '540px', margin: '0 auto 36px auto', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Videos Created Per Month:</span>
              <span style={{ color: '#38bdf8', fontSize: '18px', fontWeight: 800 }}>{videoCount} Videos</span>
            </div>

            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={videoCount}
              onChange={handleSliderChange}
              style={{
                width: '100%',
                accentColor: '#38bdf8',
                cursor: 'pointer'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              <span>5 Videos / mo</span>
              <span>50 Videos / mo</span>
              <span>100 Videos / mo</span>
            </div>
          </div>

          {/* Dynamic Savings Display Pills */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '16px',
            maxWidth: '850px',
            margin: '0 auto'
          }}>
            <div style={{
              background: 'var(--bg-input)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                CREATIVE HOURS SAVED
              </div>
              <div style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 900, color: '#38bdf8' }}>
                ~{hoursSaved} hrs
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                per month recovered
              </div>
            </div>

            <div style={{
              background: 'var(--bg-input)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                ESTIMATED DOLLARS SAVED
              </div>
              <div style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 900, color: '#10b981' }}>
                ${dollarsSaved.toLocaleString()}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                vs editors & voice actors
              </div>
            </div>

            <div style={{
              background: 'var(--bg-input)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                ESTIMATED MONTHLY VIEWS
              </div>
              <div style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 900, color: '#ec4899' }}>
                {potentialReach}+
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                cross-platform potential
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
