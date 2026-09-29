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
  { icon: <Film size={14} color="var(--accent-primary)" />, text: '9:16 Vertical & 16:9 Cinema' },
  { icon: <Mic2 size={14} color="#10b981" />, text: 'Studio-Grade Voice Synthesis' },
  { icon: <Sparkles size={14} color="#38bdf8" />, text: 'Dynamic Kinetic Subtitles' },
  { icon: <Share2 size={14} color="#ec4899" />, text: 'Multi-Platform 1-Click Export' },
  { icon: <Music size={14} color="#f59e0b" />, text: '-18dB Adaptive Audio Ducking' },
  { icon: <Globe2 size={14} color="#8b5cf6" />, text: '31+ Languages & Dialects' },
  { icon: <Monitor size={14} color="var(--accent-primary)" />, text: 'Ultra HD 1080p Master Renders' },
  { icon: <ShieldCheck size={14} color="#10b981" />, text: 'Full Commercial Licensing' },
  { icon: <Zap size={14} color="#38bdf8" />, text: 'Zero Watermark Export' },
  { icon: <Layers size={14} color="#ec4899" />, text: 'Autonomous Multi-Act Screenplay' }
];

const ROW_TWO = [
  { icon: <Smartphone size={14} color="#ef4444" />, text: 'YouTube Shorts & Widescreen' },
  { icon: <Sparkles size={14} color="#ec4899" />, text: 'Instagram Reels & Stories' },
  { icon: <Zap size={14} color="#06b6d4" />, text: 'TikTok FYP Pacing & Loops' },
  { icon: <Monitor size={14} color="#3b82f6" />, text: 'LinkedIn Video Explainers' },
  { icon: <Flame size={14} color="var(--accent-primary)" />, text: 'Hook-First Narrative Architecture' },
  { icon: <CheckCircle2 size={14} color="#10b981" />, text: 'Automated 7-Point QA Critic' },
  { icon: <Music size={14} color="#8b5cf6" />, text: 'Cinematic Score Selection' },
  { icon: <Layers size={14} color="#f59e0b" />, text: 'Faceless Channel Automation' },
  { icon: <Globe2 size={14} color="#38bdf8" />, text: 'Automated Multi-Platform SEO' }
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
