import React, { useState } from 'react';
import { 
  Share2, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  Monitor, 
  Smartphone,
  Eye,
  Layers,
  Flame,
  Zap
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { useBreakpoint } from '../../hooks/useMediaQuery';

function YouTubeIcon({ size = 18, color = '#ef4444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function InstagramIcon({ size = 18, color = '#ec4899' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function TikTokIcon({ size = 18, color = '#06b6d4' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  );
}

function LinkedInIcon({ size = 18, color = '#3b82f6' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  );
}

export default function PlatformShowcase({ onSelectPreset }) {
  const { isMobile, isTablet } = useBreakpoint();
  const [activePlatform, setActivePlatform] = useState('youtube');

  const platforms = [
    {
      id: 'youtube',
      name: 'YouTube',
      tagline: 'Shorts & Longform',
      icon: <YouTubeIcon size={18} color="#ef4444" />,
      color: '#ef4444',
      aspectRatio: '9:16 / 16:9',
      features: [
        'Curiosity-Gap Titles with High CTR Emojis',
        '800+ Character SEO Descriptions & 10 Viral Tags',
        'Automatic Pinned Engagement Comments',
        '1-Click YouTube Data API v3 Direct Publishing'
      ],
      sampleTitle: 'The 3-Second Mystery That Shocked Marine Biologists 🌊',
      sampleStats: 'High-CTR SEO Titles, Tags & Pinned Comments'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      tagline: 'Reels & Stories',
      icon: <InstagramIcon size={18} color="#ec4899" />,
      color: '#ec4899',
      aspectRatio: '9:16 Vertical',
      features: [
        'Aesthetic Color Grading & Cinematic Visual Realism',
        'Trendy Kinetic Subtitle Typography',
        'Optimized First-Frame Visual Thumbnails',
        'Hashtag Groups Optimized for Explore Page Discovery'
      ],
      sampleTitle: 'This ancient secret was buried for 2,000 years... ✨',
      sampleStats: 'Native 9:16 Vertical & Burned-In Typography'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      tagline: 'Viral Sounds & FYP',
      icon: <TikTokIcon size={18} color="#06b6d4" />,
      color: '#06b6d4',
      aspectRatio: '9:16 Vertical',
      features: [
        'Sub-1-Second Visual Pattern Interrupts',
        'Trending Sound Sync & Dynamic Beat Matching',
        'Native TikTok Font Presets & Bold Highlight Emojis',
        'High-Completion Loop Pacing'
      ],
      sampleTitle: 'Wait until the end... you won\'t believe what happened! 🤯',
      sampleStats: 'Loop Pacing & Synchronized Kinetic Subtitles'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      tagline: 'Business & Thought Leadership',
      icon: <LinkedInIcon size={18} color="#3b82f6" />,
      color: '#3b82f6',
      aspectRatio: '16:9 / 1:1',
      features: [
        'Crisp Corporate Case Studies & Explainer Videos',
        'Clean Accessible Captions for Sound-Off Mobile Feeds',
        'Executive Storytelling Voice Models',
        'High-Trust Narrative Architecture'
      ],
      sampleTitle: 'How Autonomous AI Workflows Slashed Production Costs by 90%',
      sampleStats: 'Crisp Audio & Sound-Off Accessible Captions'
    },
    {
      id: 'ads',
      name: 'Video Ads',
      tagline: 'High-ROAS Performance Creatives',
      icon: <Zap size={18} color="#f59e0b" />,
      color: '#f59e0b',
      aspectRatio: '9:16 / 1:1 / 16:9',
      features: [
        'A/B Testing 5 Different Opening Hook Variants',
        'Direct Problem → Agitate → Solution Story Structure',
        'Prominent High-Contrast Call to Action Cards',
        'Broadcast-Quality 4K Master Render'
      ],
      sampleTitle: 'Stop Spending $500 per Video. Here is the Secret Tool ⚡',
      sampleStats: 'Multiple Hook Variants & Direct Call-to-Action'
    }
  ];

  const current = platforms.find(p => p.id === activePlatform) || platforms[0];

  const handleTab = (id) => {
    audioEngine.playSfx('click');
    setActivePlatform(id);
  };

  return (
    <section style={{
      paddingTop: isMobile ? '48px' : '76px',
      paddingBottom: isMobile ? '48px' : '76px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      position: 'relative'
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px auto' }}>
          <span className="badge badge-brand" style={{ marginBottom: '14px' }}>
            <Share2 size={13} />
            <span>Omnichannel Content Multiplier</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: 'clamp(26px, 5vw, 40px)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            marginBottom: '14px',
            color: 'var(--text-primary)'
          }}>
            One Script. Generated & Formatted for Every Major Network.
          </h2>
          <p style={{ fontSize: isMobile ? '14.5px' : '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Never limit your reach to a single platform. Bang AI automatically tailors visual aspect ratios, 
            caption typography, voice pacing, and metadata for maximum viral engagement on every channel.
          </p>
        </div>

        {/* Platform Selector Buttons */}
        <div 
          className={isMobile ? 'rail' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'flex-start' : 'center',
            gap: '8px',
            overflowX: isMobile ? 'auto' : 'visible',
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            paddingBottom: isMobile ? '6px' : '0',
            marginBottom: isMobile ? '24px' : '36px',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {platforms.map((p) => {
            const isSelected = activePlatform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleTab(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: isMobile ? '8px 14px' : '10px 18px',
                  borderRadius: '12px',
                  background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-input)',
                  border: `1.5px solid ${isSelected ? p.color : 'var(--border-subtle)'}`,
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: isMobile ? '12.5px' : '14px',
                  fontWeight: isSelected ? 700 : 500,
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 0 20px ${p.color}25` : 'none',
                  flexShrink: 0
                }}
              >
                {p.icon}
                <span>{p.name}</span>
                {!isMobile && (
                  <span style={{
                    fontSize: '11px',
                    color: isSelected ? p.color : 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    {p.tagline}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Interactive Platform Preview Card */}
        <div className="saas-card" style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: isMobile ? '20px 16px' : '36px',
          borderRadius: '24px',
          border: '1.5px solid var(--border-medium)',
          boxShadow: 'var(--shadow-card)',
          background: 'var(--bg-card)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isTablet || isMobile ? '1fr' : '1.1fr 0.9fr',
            gap: isMobile ? '24px' : '36px',
            alignItems: 'center'
          }}>
            {/* Left Column: Feature Highlights */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                  background: `${current.color}20`,
                  color: current.color,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  {current.icon}
                  {current.name} Optimization Protocol
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Format: <strong>{current.aspectRatio}</strong>
                </span>
              </div>

              <h3 style={{
                fontSize: isMobile ? '20px' : '26px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '16px',
                letterSpacing: '-0.02em'
              }}>
                Engineered for {current.name} Dominance
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {current.features.map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: `${current.color}20`,
                      color: current.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <CheckCircle2 size={13} />
                    </div>
                    <span style={{ fontSize: isMobile ? '13px' : '14.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                background: 'var(--bg-input)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Performance Benchmark:
                </span>
                <span style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={14} /> {current.sampleStats}
                </span>
              </div>
            </div>

            {/* Right Column: Native Feed Mockup Preview */}
            <div style={{
              background: 'var(--bg-elevated)',
              borderRadius: '20px',
              border: `1.5px solid ${current.color}40`,
              padding: '16px',
              boxShadow: 'var(--shadow-card)',
              position: 'relative'
            }}>
              {/* Native App Top Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  {current.icon}
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                    {current.name} App Preview
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '10px' }}>
                  Auto-Rendered
                </span>
              </div>

              {/* Video Thumbnail Frame */}
              <div style={{
                height: isMobile ? '160px' : '190px',
                borderRadius: '14px',
                background: 'radial-gradient(circle at 50% 40%, #1e1b4b 0%, #0f172a 70%, #020617 100%)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ textAlign: 'center', padding: '14px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>⚡</div>
                  <div style={{
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    Kinetic Subtitles Burned On-The-Fly
                  </div>
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  {current.aspectRatio.includes('16:9') ? '1080p Cinema' : '1080×1920 60fps'}
                </div>
              </div>

              {/* Sample Title / Metadata Preview */}
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {current.sampleTitle}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>@BangAI.Studio</span>
                <span>• Just now</span>
                <span style={{ color: current.color }}>#Viral #AIContent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
