import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  DollarSign, 
  Film, 
  Mic2, 
  Music, 
  Type, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  Award,
  FileCheck
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { useBreakpoint } from '../hooks/useMediaQuery';

export default function CompliancePage({ onNavigateToLanding, onNavigateToDashboard }) {
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

  const licenses = [
    {
      title: 'Visual Footage & B-Roll',
      provider: 'Pexels & Pixabay Commercial API Licenses',
      icon: Film,
      color: '#3b82f6',
      badge: '100% Royalty-Free',
      description: 'All visual clips assembled by Stock Studio originate from licensed commercial media repositories. The licenses grant irrevocable, worldwide rights to modify, compile, and broadcast footage commercially across YouTube, television, web streaming, and social networks without copyright claims.'
    },
    {
      title: 'Neural Speech & Voiceovers',
      provider: 'ElevenLabs & json2video Commercial Voice Engine',
      icon: Mic2,
      color: '#8b5cf6',
      badge: 'Commercial Broadcast Cleared',
      description: 'All generated character voice tracks and narrator voices carry full commercial rights. Generated audio tracks are cleared for commercial monetization under the YouTube Partner Program (YPP) and commercial advertising campaigns.'
    },
    {
      title: 'Typography & Subtitles',
      provider: 'Open Font License (OFL) & Google Fonts',
      icon: Type,
      color: '#10b981',
      badge: 'Permissive Commercial Use',
      description: 'All kinetic subtitles, word-by-word highlight fonts (including Nirmala UI, Devanagari Unicode, Montserrat, and Inter), and styling presets use SIL Open Font License (OFL) standards, free for commercial distribution without licensing fees.'
    },
    {
      title: 'Soundtracks & Background Audio',
      provider: 'Mastered Royalty-Free Audio Stems',
      icon: Music,
      color: '#f59e0b',
      badge: 'Content ID Safe',
      description: 'Background audio tracks included in BangAI are curated, royalty-free audio beds engineered with dynamic speech ducking curves (-18dB) so your narration cuts through clearly without triggering Content ID monetization claims.'
    }
  ];

  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - var(--nav-h, 58px))',
      background: 'var(--bg-app)',
      color: 'var(--text-primary)',
      paddingTop: isMobile ? '28px' : '48px',
      paddingBottom: '80px',
      position: 'relative',
      overflowY: 'visible'
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
        <div style={{ marginBottom: '40px' }}>
          <div className="glow-pill" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            marginBottom: '16px'
          }}>
            <Award size={14} color="#10b981" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Commercial Rights & Copyright
            </span>
          </div>

          <h1 className="font-display" style={{
            fontSize: 'clamp(32px, 5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '12px',
            color: 'var(--text-primary)'
          }}>
            Commercial Rights & Monetization Compliance
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Every asset, voiceover, and script beat produced by BangAI is engineered for <strong>100% legal safety, commercial monetization, and copyright freedom</strong>.
          </p>
        </div>

        {/* Guaranteed Commercial Freedom Card */}
        <div style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1.5px solid rgba(16, 185, 129, 0.28)',
          marginBottom: '36px',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <FileCheck size={22} color="#10b981" />
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#10b981', margin: 0 }}>
              Official Commercial Clearance Certificate
            </h3>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
            Videos generated on BangAI are categorized as original transformative multimedia works. You are granted complete commercial rights to monetize, distribute, sponsor, or sell your final MP4 video outputs across YouTube, TikTok, Meta Reels, and client projects worldwide with zero ongoing royalty obligations to BangAI.
          </p>
        </div>

        {/* Asset License Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '20px',
          marginBottom: '36px'
        }}>
          {licenses.map((item, idx) => {
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={18} color={item.color} />
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: `${item.color}18`,
                    color: item.color,
                    border: `1px solid ${item.color}35`
                  }}>
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {item.provider}
                  </div>
                </div>

                <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Avoiding Reused Content on YouTube */}
        <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            How BangAI Prevents &quot;Reused Content&quot; Demonetization on YouTube
          </h2>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            YouTube’s Partner Program evaluates channels for genuine transformative value and originality. BangAI is explicitly architected to satisfy YouTube&apos;s monetization standards through:
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Original 5-Act Screenplays:</strong> Every script is generated de novo with unique narrative hooks, pacing, and story structure rather than scraping existing text.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Multi-Scene Dynamic Assembly:</strong> Video clips change dynamically every 4 to 12 seconds in sync with narration pacing, avoiding static repeating loops.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Custom Dynamic Subtitles:</strong> Animated phrase-by-phrase typography provides substantial visual modification to stock footage.
            </li>
            <li>
              <strong style={{ color: 'var(--text-primary)' }}>Layered Audio Mixing:</strong> Combines voiceover narration, audio ducking, and background tracks into a unified master track.
            </li>
          </ul>
        </section>

        {/* Safe Creator Practices */}
        <section className="saas-card" style={{ padding: isMobile ? '20px' : '28px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            Best Practices for 100% Strike-Free Channel Growth
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <p style={{ margin: 0 }}>
              1. <strong>Avoid Copyrighted Song Lyrics:</strong> Do not enter copyrighted pop song lyrics or proprietary movie dialogues into prompts.
            </p>
            <p style={{ margin: 0 }}>
              2. <strong>Inspect Output Previews:</strong> Always preview the generated script and video before pushing to live YouTube channels.
            </p>
            <p style={{ margin: 0 }}>
              3. <strong>Respect YouTube Community Guidelines:</strong> Ensure custom topics avoid sensitive topics, hate speech, or dangerous activities.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
