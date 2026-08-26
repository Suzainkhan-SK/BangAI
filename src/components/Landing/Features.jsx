import React from 'react';
import { 
  Zap, 
  Mic2, 
  Video, 
  Music, 
  ShieldCheck, 
  Share2, 
  Sparkles, 
  Layers 
} from 'lucide-react';

export default function Features() {
  const steps = [
    {
      step: '01',
      title: 'Type Story or Voice Note',
      desc: 'Stage 0 Universal Classifier analyzes your prompt, detects the genre, and applies anti-repetition memory.',
      icon: <Sparkles size={20} color="#6366f1" />
    },
    {
      step: '02',
      title: 'AI Screenplay & Voice Studio',
      desc: 'Writes 5 scenes with strict 190–200 char pacing, casts ElevenLabs narrator, and selects adaptive BGM.',
      icon: <Layers size={20} color="#8b5cf6" />
    },
    {
      step: '03',
      title: '1-Click Render & Publish',
      desc: 'Renders 5 parallel Grok Imagine 1.5 scenes, burns animated subtitles, and uploads directly to YouTube.',
      icon: <Zap size={20} color="#06b6d4" />
    }
  ];

  const gridFeatures = [
    {
      title: 'Grok Imagine 1.5 Video Engine',
      desc: 'Generates 5 direct 15-second cinematic video scenes in parallel, composited into a 1080×1920 vertical master.',
      icon: <Video size={22} color="#06b6d4" />
    },
    {
      title: 'ElevenLabs Voice Casting',
      desc: 'Instant access to studio narrator voices (Adam, Marcus, Aarav, Priya, Charlie) with emotion & speed control.',
      icon: <Mic2 size={22} color="#10b981" />
    },
    {
      title: 'Adaptive Background Score & Ducking',
      desc: 'Multi-genre soundtrack library with automated -18dB speech ducking curve so narration is always crystal clear.',
      icon: <Music size={22} color="#ec4899" />
    },
    {
      title: '7-Checkpoint Quality Critic',
      desc: 'Stage 3 AI auditor inspects character count timing, visual style continuity, and YouTube policy safety before export.',
      icon: <ShieldCheck size={22} color="#f59e0b" />
    },
    {
      title: 'High-CTR YouTube Metadata & Tags',
      desc: 'Auto-generates curiosity-gap titles with emoji, 800-1200 character structured descriptions, and 10 viral tags.',
      icon: <Sparkles size={22} color="#8b5cf6" />
    },
    {
      title: 'Multi-Platform Syndication',
      desc: 'One-click publish to YouTube Shorts, Instagram Reels, and TikTok with platform-optimized formatting.',
      icon: <Share2 size={22} color="#3b82f6" />
    }
  ];

  return (
    <section id="features" style={{ paddingTop: 'clamp(48px, 8vw, 80px)', paddingBottom: 'clamp(48px, 8vw, 80px)', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
      <div className="container">
        {/* 3-Step Workflow */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
          <span className="badge badge-brand" style={{ marginBottom: '12px' }}>
            <Zap size={13} />
            <span>Autonomous Production Pipeline</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: 'clamp(26px, 5vw, 36px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '14px',
            color: 'var(--text-primary)'
          }}>
            How ShortsAI Works in 3 Simple Steps
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            From raw idea to published 75-second vertical video in under 2 minutes.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '24px', marginBottom: '80px' }}>
          {steps.map((s, idx) => (
            <div key={idx} className="saas-card" style={{ padding: '28px', position: 'relative' }}>
              <div style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 'clamp(30px, 6vw, 44px)',
                fontWeight: 900,
                color: 'var(--border-medium)',
                lineHeight: 1,
                marginBottom: '16px'
              }}>
                {s.step}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--bg-card-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {s.icon}
                </div>
                <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {s.title}
                </h3>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        {/* 6 Capabilities Grid */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
          <h2 className="font-display" style={{
            fontSize: 'clamp(24px, 4.6vw, 32px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '14px',
            color: 'var(--text-primary)'
          }}>
            Engineered for Maximum Virality & Retention
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '20px' }}>
          {gridFeatures.map((f, i) => (
            <div key={i} className="saas-card" style={{ padding: '24px', display: 'flex', gap: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'var(--bg-card-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
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
