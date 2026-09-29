import React, { useState } from 'react';
import { Zap, ArrowRight, Sparkles, Check } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { useBreakpoint } from '../../hooks/useMediaQuery';

export default function CallToAction({ onStartCreation }) {
  const { isMobile } = useBreakpoint();
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    audioEngine.playSfx('boom');
    onStartCreation(prompt.trim() || 'The secret history of lost ancient civilizations');
  };

  return (
    <section style={{
      position: 'relative',
      paddingTop: isMobile ? '56px' : '90px',
      paddingBottom: isMobile ? '56px' : '90px',
      overflow: 'hidden',
      borderTop: '1px solid var(--border-subtle)',
      background: 'linear-gradient(180deg, var(--bg-surface) 0%, #03060f 100%)'
    }}>
      {/* Cosmic Glow Mesh */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '900px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.15) 45%, transparent 70%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 10, maxWidth: '880px', textAlign: 'center' }}>
        <div className="glow-pill animate-float" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          marginBottom: '20px'
        }}>
          <Sparkles size={14} color="#38bdf8" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Start Creating in Under 60 Seconds
          </span>
        </div>

        <h2 className="font-display" style={{
          fontSize: 'clamp(30px, 6.5vw, 52px)',
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          marginBottom: '18px',
          color: 'var(--text-primary)'
        }}>
          Ready to Build Your Viral Video Empire?
        </h2>

        <p style={{
          fontSize: isMobile ? '15px' : '17.5px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '640px',
          margin: '0 auto 36px auto'
        }}>
          Join over 120,000+ creators, media companies, and agencies producing high-retention content with Bang AI.
        </p>

        {/* Action Form */}
        <form onSubmit={handleSubmit} style={{
          maxWidth: '620px',
          margin: '0 auto 24px auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '10px',
          background: 'rgba(16, 22, 40, 0.85)',
          padding: '8px',
          borderRadius: '16px',
          border: '1.5px solid var(--border-glow)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.2)'
        }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter any topic (e.g. Deep Space Mysteries, Tech AI, True Crime)..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '12px 16px',
              fontSize: '14.5px',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />

          <button
            type="submit"
            className="btn-glow"
            style={{
              padding: '12px 24px',
              fontSize: '14.5px',
              fontWeight: 700,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <Zap size={16} fill="#ffffff" />
            <span>Generate Free</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Feature Checkmarks */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: isMobile ? '12px 18px' : '24px',
          fontSize: '12.5px',
          color: 'var(--text-muted)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={14} color="#10b981" /> Free 5 Videos / Month
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={14} color="#10b981" /> No Credit Card Required
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={14} color="#10b981" /> Multi-Platform 1-Click Export
          </span>
        </div>
      </div>
    </section>
  );
}
