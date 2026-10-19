import React from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  Zap, 
  Cpu, 
  Layers, 
  Film, 
  ShieldCheck, 
  Globe2, 
  Heart, 
  ArrowRight,
  Server,
  Code2,
  CheckCircle2,
  Users
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { useBreakpoint } from '../hooks/useMediaQuery';

export default function AboutPage({ onNavigateToLanding, onNavigateToDashboard, onNavigateToRegister }) {
  const { isMobile } = useBreakpoint();

  const handleBack = () => {
    audioEngine.playSfx('click');
    if (onNavigateToLanding) {
      onNavigateToLanding();
    } else if (onNavigateToDashboard) {
      onNavigateToDashboard();
    } else {
      window.location.hash = '';
    }
  };

  const handleAction = () => {
    audioEngine.playSfx('boom');
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else if (onNavigateToDashboard) {
      onNavigateToDashboard();
    } else {
      window.location.hash = '#/register';
    }
  };

  const pillars = [
    {
      icon: Cpu,
      color: '#3b82f6',
      title: '20-Worker GPU Cloud Render Engine',
      description: 'Powered by Modal.com with 20 parallel containers, zero thread-blocking locks, intelligent FIFO queue position tracking, and native HTTP 206 range-streaming playback.'
    },
    {
      icon: Layers,
      color: '#8b5cf6',
      title: '54 Autonomous Workflow Pipelines',
      description: 'Orchestrated via n8n Cloud and multi-tier dynamic fallback chains, autonomously researching viral hooks, writing 5-act screenplays, and ducking audio in real time.'
    },
    {
      icon: Globe2,
      color: '#10b981',
      title: 'Multi-Channel YouTube Token Vault',
      description: 'Direct Google OAuth 2.0 channel integration enabling 1-click publishing and scheduled 24-hour Autopilot video distribution without token expirations.'
    },
    {
      icon: ShieldCheck,
      color: '#f59e0b',
      title: 'Two-Tier Zero-Leak Security Architecture',
      description: 'Hardened separation of infrastructure secrets and dynamic MongoDB secret vaults, completely shielding vendor API keys from browser DevTools inspection.'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-app)',
      color: 'var(--text-primary)',
      paddingTop: isMobile ? '32px' : '64px',
      paddingBottom: '80px',
      position: 'relative'
    }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        
        {/* Navigation Back Button */}
        <button
          onClick={handleBack}
          className="admin-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '32px'
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </button>

        {/* Header Hero */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <div className="glow-pill" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            marginBottom: '16px'
          }}>
            <Sparkles size={14} color="#6366f1" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#6366f1', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              About BangAI Studio
            </span>
          </div>

          <h1 className="font-display" style={{
            fontSize: 'clamp(32px, 5.5vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
            color: 'var(--text-primary)'
          }}>
            The Universal Autonomous Video Engine
          </h1>

          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '720px', margin: '0 auto', lineHeight: 1.6 }}>
            BangAI was created with a single mission: to empower video creators, media agencies, and storytellers to produce <strong>cinematic, high-retention videos at infinite scale</strong> without manual editing bottlenecks.
          </p>
        </div>

        {/* Mission Statement Card */}
        <div style={{
          padding: isMobile ? '24px' : '36px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 27, 75, 0.4) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          marginBottom: '48px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>
            Our Vision: Radical Creative Leverage
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
            Modern video platforms demand consistent, daily high-quality uploads. Traditional video creation requires hours of scripting, hiring voice artists, hunting stock b-roll, keyframing subtitles, and configuring exports. BangAI compresses this entire 6-hour workflow into <strong>75 seconds of automated cloud compute</strong>. You bring the ideas; our autonomous engines handle the cinematography, audio mastering, and publishing.
          </p>
        </div>

        {/* Architecture Pillars Grid */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px', textAlign: 'center' }}>
            Built on Enterprise Cloud Architecture
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '20px'
          }}>
            {pillars.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="saas-card"
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={20} color={item.color} />
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Core Promises */}
        <section className="saas-card" style={{ padding: isMobile ? '24px' : '32px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            The BangAI Creator Guarantee
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Zero Watermarks:</strong> We never brand your creations. Every export is 100% white-label.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Complete Commercial Freedom:</strong> You retain full copyright ownership of your rendered media.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Multi-Tenant Privacy:</strong> User tasks and BYOK credentials are strictly sandboxed.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Continuous Innovation:</strong> Zero-downtime hot-swappable key vaults and cluster failovers.
              </div>
            </div>
          </div>
        </section>

        {/* CTA Launch Box */}
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '32px 20px' : '44px 32px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.06) 100%)',
          border: '1.5px solid rgba(99, 102, 241, 0.25)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
            Ready to Build Your Video Empire?
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 24px auto' }}>
            Join creators and studios deploying automated, high-retention videos on YouTube, Instagram, and TikTok daily.
          </p>
          <button
            onClick={handleAction}
            className="btn btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 700,
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <span>Start Creating Now</span>
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
