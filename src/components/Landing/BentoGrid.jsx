import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  Mic2, 
  Music, 
  CheckCircle2, 
  Smartphone, 
  Monitor, 
  Square, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Type,
  Cpu,
  Film,
  Image as ImageIcon,
  Key,
  Flame,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { audioEngine } from '../../audio/audioEngine';

export default function BentoGrid() {
  const { isMobile, isTablet } = useBreakpoint();
  const [activePipeline, setActivePipeline] = useState('mysteries');
  const [activeAspect, setActiveAspect] = useState('9:16');
  const [activeLang, setActiveLang] = useState('hi');

  const pipelines = [
    {
      id: 'mysteries',
      icon: '🛸',
      name: 'World Mysteries',
      hook: 'Curiosity-Gap Suspense',
      desc: 'Self-researches unexplained anomalies and oceanic enigmas with 5-act cinematic pacing.',
      stat: '98% Retention Rate'
    },
    {
      id: 'history',
      icon: '⏳',
      name: 'Last 24 Hours',
      hook: 'Emotional Countdown',
      desc: 'Tells the final 24 hours of iconic figures with archival atmosphere and empathetic narration.',
      stat: 'High Viral Share'
    },
    {
      id: 'horror',
      icon: '👻',
      name: '3-AM Horror',
      hook: 'Atmospheric Tension',
      desc: 'Psychological thrillers and paranormal tales with dark ambient SFX and cliffhangers.',
      stat: 'Peak Watch Time'
    },
    {
      id: 'stock',
      icon: '⚡',
      name: 'Stock Autopilot',
      hook: 'Pexels/Pixabay B-Roll',
      desc: 'Automated topic queues rendering full shorts with commercial media and auto-publishing.',
      stat: 'Zero Manual Work'
    }
  ];

  const languages = [
    { code: 'hi', label: 'Hindi (Native)' },
    { code: 'en', label: 'English (Global)' },
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
              Next-Gen Autonomous Architecture
            </span>
          </div>

          <h2 className="font-display" style={{
            fontSize: 'clamp(28px, 5.5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
            color: 'var(--text-primary)'
          }}>
            Built for <span className="grad-text">Unstoppable Video Automation</span>
          </h2>

          <p style={{
            fontSize: isMobile ? '15px' : '17px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            From 20 parallel cloud GPU workers to 1-click YouTube publishing, every system is engineered 
            to eliminate bottlenecks and scale your faceless channel ecosystem.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          
          {/* Card 1: 20-Worker GPU Cloud Cluster (8 cols) */}
          <div className="bento-card bento-col-8">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 79, 0, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Cpu size={22} color="var(--accent-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    20-Worker GPU Cloud Render Cluster
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Modal.com Serverless Compute • Zero Thread Locks • FIFO Queues
                  </div>
                </div>
              </div>
              <span className="badge badge-brand" style={{ fontSize: '11px', padding: '3px 8px' }}>
                Sub-60s Turnaround
              </span>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Our rendering engine is orchestrated across 20 high-performance GPU containers. Tasks are dispatched 
              with intelligent FIFO queue positioning and streamed directly via native HTTP 206 range-streaming for instant, bufferless previews.
            </p>

            {/* GPU Worker Visual Simulation Grid */}
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Live GPU Container Cluster Status
                </span>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                  20/20 Workers Active • 0 Queue Wait
                </span>
              </div>

              {/* 20 GPU worker nodes visual */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gap: '6px',
                marginBottom: '12px'
              }}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    title={`Worker Node #${i + 1} - Online`}
                    style={{
                      height: '24px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#10b981'
                    }}
                  >
                    W{i + 1}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                <span>✓ HTTP 206 Partial Content Streaming</span>
                <span>✓ Automatic Secondary Cluster Failover</span>
                <span>✓ 1080p Ultra HD Hardware Acceleration</span>
              </div>
            </div>
          </div>

          {/* Card 2: 4 Flagship Autonomous Video Pipelines (4 cols) */}
          <div className="bento-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Film size={22} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  4 Autonomous Pipelines
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Tailored High-Retention Blueprints
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              Select a battle-tested viral format with custom scene timing, dramatic audio cues, and viral retention hooks.
            </p>

            {/* Pipeline Selector Rail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {pipelines.map((p) => {
                const isSelected = activePipeline === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      audioEngine.playSfx('click');
                      setActivePipeline(p.id);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-input)',
                      border: `1px solid ${isSelected ? '#38bdf8' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px' }}>{p.icon}</span>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: isSelected ? '#38bdf8' : 'var(--text-primary)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          {p.hook}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', color: isSelected ? '#38bdf8' : 'var(--text-muted)', fontWeight: 600 }}>
                      {p.stat}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Stock Studio 24-Hour Autopilot (4 cols) */}
          <div className="bento-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={22} color="#f59e0b" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  24-Hour Autopilot
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Continuous Topic Queue Scheduling
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Queue your upcoming channel themes. BangAI continuously generates scripts, matches commercial b-roll, burns kinetic subtitles, and auto-publishes to YouTube around the clock.
            </p>

            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                  Next Scheduled Job
                </span>
                <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 700 }}>
                  ● Running Now
                </span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                "Deep Ocean Trench Anomalies"
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Target: Connected YouTube Channel • 9:16 Shorts
              </div>
            </div>
          </div>

          {/* Card 4: AI Thumbnail Studio & Face-Swap (4 cols) */}
          <div className="bento-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(236, 72, 153, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ImageIcon size={22} color="#ec4899" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  AI Thumbnail Studio
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  1-Click High-CTR & Face-Swap
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              Generate thumbnails that boost click-through rates. Blend creator face references to maintain uniform personal branding across your channel.
            </p>

            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={13} color="#ec4899" />
                <span>3D Viral Headline Typography</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={13} color="#ec4899" />
                <span>Creator Face-Swap Consistency</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={13} color="#ec4899" />
                <span>Instant 16:9 & 9:16 Aspect Conversion</span>
              </div>
            </div>
          </div>

          {/* Card 5: Official Google OAuth & Multi-Channel Token Vault (4 cols) */}
          <div className="bento-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Key size={22} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Official Google OAuth Vault
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Multi-Channel YouTube Management
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              Connect multiple YouTube channels and live Google Sheets with encrypted token vaults and automatic refresh token rotation.
            </p>

            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={13} color="#10b981" />
                <span>YouTube Data API v3 Direct Publishing</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={13} color="#10b981" />
                <span>Google Sheets Batch Sync Automation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={13} color="#10b981" />
                <span>Encrypted At-Rest in MongoDB Atlas</span>
              </div>
            </div>
          </div>

          {/* Card 6: Neural Voice Matrix & Smart -18dB Ducking (12 cols) */}
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
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Mic2 size={18} color="#8b5cf6" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Neural Voice Matrix & Smart -18dB Audio Ducking
                  </h3>
                  <span className="badge badge-brand" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    31+ Languages
                  </span>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
                  Emotionally expressive speech synthesis paired with automatic -18dB background music ducking whenever narration plays.
                </p>
              </div>

              {/* Language Pills */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-input)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                flexWrap: 'wrap'
              }}>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      audioEngine.playSfx('click');
                      setActiveLang(l.code);
                    }}
                    style={{
                      background: activeLang === l.code ? '#8b5cf6' : 'transparent',
                      color: activeLang === l.code ? '#ffffff' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '11.5px',
                      fontWeight: activeLang === l.code ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Aspect Format Previews */}
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => { audioEngine.playSfx('click'); setActiveAspect('9:16'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Smartphone size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>9:16 Vertical Shorts</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  Safe-zone margin calibrated for YouTube Shorts, Reels, and TikTok UI overlays.
                </p>
              </div>

              <div style={{
                background: activeAspect === '16:9' ? 'rgba(255, 79, 0, 0.08)' : 'var(--bg-input)',
                border: `1.5px solid ${activeAspect === '16:9' ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                borderRadius: '14px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => { audioEngine.playSfx('click'); setActiveAspect('16:9'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Monitor size={16} color="#38bdf8" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>16:9 Cinematic Widescreen</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  High-resolution landscape framing for YouTube standard videos and desktop streaming.
                </p>
              </div>

              <div style={{
                background: activeAspect === '1:1' ? 'rgba(255, 79, 0, 0.08)' : 'var(--bg-input)',
                border: `1.5px solid ${activeAspect === '1:1' ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                borderRadius: '14px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => { audioEngine.playSfx('click'); setActiveAspect('1:1'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Square size={16} color="#10b981" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>1:1 Square Feed</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  Square framing optimized for feed scrolls, carousels, and high-CTR social ads.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
