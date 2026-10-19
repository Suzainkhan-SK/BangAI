import React from 'react';
import { 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Mic2, 
  Layers, 
  Zap, 
  Music, 
  Globe2, 
  ShieldCheck, 
  CheckCircle2,
  Film,
  Flame,
  Share2
} from 'lucide-react';
import { useBreakpoint } from '../../hooks/useMediaQuery';

const ROW_ONE = [
  { icon: <Sparkles size={14} color="var(--accent-primary)" />, text: 'Generative AI Video Engine' },
  { icon: <Film size={14} color="#38bdf8" />, text: 'Autonomous AI Video Templates' },
  { icon: <Flame size={14} color="#f59e0b" />, text: '5-Act Cinematic AI Screenplays' },
  { icon: <Zap size={14} color="var(--accent-primary)" />, text: '20 Parallel GPU Cloud Workers' },
  { icon: <Mic2 size={14} color="#10b981" />, text: 'ElevenLabs Neural Speech Matrix' },
  { icon: <Sparkles size={14} color="#ec4899" />, text: '1-Click AI Thumbnail Studio' },
  { icon: <Globe2 size={14} color="#8b5cf6" />, text: 'Authentic Hindi & 31+ Languages' },
  { icon: <ShieldCheck size={14} color="#10b981" />, text: '100% Commercial Monetization Rights' },
  { icon: <Monitor size={14} color="#38bdf8" />, text: 'Ultra HD 1080p 60 FPS Export' }
];

const ROW_TWO = [
  { icon: <Film size={14} color="#6366f1" />, text: '🛸 World Mysteries AI Pipeline' },
  { icon: <Film size={14} color="#f59e0b" />, text: '⏳ Last 24 Hours AI Pipeline' },
  { icon: <Film size={14} color="#ef4444" />, text: '👻 3-AM Horror AI Pipeline' },
  { icon: <Layers size={14} color="var(--accent-primary)" />, text: 'Stock Studio 24-Hour Autopilot' },
  { icon: <Smartphone size={14} color="#ef4444" />, text: 'Official Google OAuth 2.0 Token Vault' },
  { icon: <Share2 size={14} color="#ec4899" />, text: 'Direct YouTube Data API v3 Auto-Publish' },
  { icon: <Music size={14} color="#f59e0b" />, text: '-18dB Dynamic Speech Ducking' },
  { icon: <CheckCircle2 size={14} color="#10b981" />, text: 'HTTP 206 Video Streaming Playback' },
  { icon: <Sparkles size={14} color="#38bdf8" />, text: 'Face-Swap Brand Consistency' }
];

export default function MarqueeTicker() {
  const { isMobile } = useBreakpoint();

  return (
    <section style={{
      padding: isMobile ? '24px 0' : '40px 0',
      background: 'var(--bg-app)',
      borderTop: '1px solid var(--border-subtle)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient shimmer */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '80px',
        background: 'radial-gradient(ellipse, rgba(255, 79, 0, 0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />

      {/* Row 1: Left to Right */}
      <div className="marquee-container" style={{ marginBottom: '12px' }}>
        <div className="marquee-track">
          {ROW_ONE.concat(ROW_ONE).concat(ROW_ONE).map((item, idx) => (
            <div key={`r1-${idx}`} className="marquee-pill">
              {item.icon}
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Right to Left */}
      <div className="marquee-container">
        <div className="marquee-track-reverse">
          {ROW_TWO.concat(ROW_TWO).concat(ROW_TWO).map((item, idx) => (
            <div key={`r2-${idx}`} className="marquee-pill">
              {item.icon}
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
