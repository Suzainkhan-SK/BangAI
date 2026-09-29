import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Sparkles, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Star, 
  Eye, 
  Layers, 
  Flame, 
  Monitor, 
  Smartphone,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { PRESETS } from '../../data/presets';
import { audioEngine } from '../../audio/audioEngine';
import { useBreakpoint } from '../../hooks/useMediaQuery';

export default function Showcase({ onSelectPreset }) {
  const { isMobile } = useBreakpoint();
  const [filter, setFilter] = useState('all');
  const [playingId, setPlayingId] = useState(null);

  const cards = [
    {
      id: 'bermuda',
      category: 'mystery',
      title: 'Bermuda Triangle: Flight 19',
      subtitle: 'Mystery & Thriller • 5 Acts • Multi-Language',
      duration: 'Flexible Duration',
      aspectRatio: '9:16 & 16:9',
      views: '1.4M views',
      retention: '98% Retention',
      rating: '4.9 ★',
      gradient: 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 70%, #020617 100%)',
      badge: 'Trending Mystery',
      color: '#6366f1',
      voice: 'Adam (Deep Cinematic)',
      icon: '🌊'
    },
    {
      id: 'dragons',
      category: 'cgi',
      title: 'Dragons: Eastern vs Western War',
      subtitle: 'Epic Mythological CGI • Hyper-Realistic VFX',
      duration: 'Cinematic Narrative',
      aspectRatio: '9:16 & 16:9',
      views: '2.8M views',
      retention: '96% Retention',
      rating: '5.0 ★',
      gradient: 'radial-gradient(circle at 50% 30%, #311042 0%, #1e102f 70%, #05020a 100%)',
      badge: 'Billion VFX',
      color: '#8b5cf6',
      voice: 'George (Epic British)',
      icon: '🐉'
    },
    {
      id: 'fruits',
      category: 'comedy',
      title: 'Talking Pineapple Supermarket Escape',
      subtitle: 'Pixar 3D Animation • Viral Comedy Fiction',
      duration: 'Fast-Paced Viral',
      aspectRatio: '9:16 Vertical',
      views: '3.6M views',
      retention: '99% Retention',
      rating: '4.8 ★',
      gradient: 'radial-gradient(circle at 50% 30%, #451a03 0%, #1c0a00 70%, #0c0a09 100%)',
      badge: 'Viral TikTok & Reels',
      color: '#f59e0b',
      voice: 'Charlie (Cartoon Playful)',
      icon: '🍍'
    },
    {
      id: 'tatasteve',
      category: 'bio',
      title: 'Ratan Tata: The Final 24 Hours',
      subtitle: 'Emotional Biography • Archival Cinematic Story',
      duration: 'Inspiring Deep-Dive',
      aspectRatio: '16:9 & 9:16',
      views: '4.1M views',
      retention: '97% Retention',
      rating: '5.0 ★',
      gradient: 'radial-gradient(circle at 50% 30%, #1c1917 0%, #0f172a 70%, #000000 100%)',
      badge: 'Emotional Hook',
      color: '#ec4899',
      voice: 'Marcus (Warm Storyteller)',
      icon: '💔'
    }
  ];

  const filterTabs = [
    { id: 'all', label: 'All Formats' },
    { id: 'mystery', label: 'Mystery & Thriller' },
    { id: 'cgi', label: 'Epic CGI & VFX' },
    { id: 'comedy', label: '3D Animation' },
    { id: 'bio', label: 'Historical & Bio' }
  ];

  const filteredCards = filter === 'all' ? cards : cards.filter(c => c.category === filter);

  const handlePlayVoice = (e, card) => {
    e.stopPropagation();
    audioEngine.playSfx('click');
    if (playingId === card.id) {
      audioEngine.stopVoice();
      setPlayingId(null);
    } else {
      const preset = PRESETS[card.id];
      if (preset && preset.scenes && preset.scenes[0]) {
        audioEngine.playVoice(preset.voiceId, preset.scenes[0].voiceoverText);
        setPlayingId(card.id);
        setTimeout(() => setPlayingId(null), 5500);
      }
    }
  };

  const handleClonePreset = (presetId) => {
    audioEngine.playSfx('boom');
    onSelectPreset(presetId);
  };

  return (
    <section id="showcase" style={{
      paddingTop: isMobile ? '48px' : '80px',
      paddingBottom: isMobile ? '48px' : '80px',
      borderTop: '1px solid var(--border-subtle)',
      position: 'relative'
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px auto' }}>
          <span className="badge badge-brand" style={{ marginBottom: '12px' }}>
            <Sparkles size={13} />
            <span>Proven High-Retention Blueprints</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: 'clamp(26px, 5vw, 38px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '14px',
            color: 'var(--text-primary)'
          }}>
            Explore Pre-Engineered Viral Video Templates
          </h2>
          <p style={{ fontSize: isMobile ? '14.5px' : '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Every template is scientifically structured with calibrated narrative hooks, multi-act visual prompts, 
            natural voiceover timings, and dynamic background ducking.
          </p>
        </div>

        {/* Filter Chips */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '36px'
        }}>
          {filterTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                audioEngine.playSfx('click');
                setFilter(t.id);
              }}
              style={{
                background: filter === t.id ? 'var(--grad-primary)' : 'var(--bg-input)',
                color: filter === t.id ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${filter === t.id ? 'transparent' : 'var(--border-subtle)'}`,
                borderRadius: '10px',
                padding: isMobile ? '6px 14px' : '8px 18px',
                fontSize: isMobile ? '12px' : '13px',
                fontWeight: filter === t.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid of Showcase Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: isMobile ? '18px' : '28px'
        }}>
          {filteredCards.map((card) => {
            const isPlaying = playingId === card.id;
            return (
              <div
                key={card.id}
                className="saas-card saas-card-interactive"
                style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '1.5px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.25s ease'
                }}
              >
                {/* Visual Preview Banner */}
                <div style={{
                  height: '180px',
                  background: card.gradient,
                  position: 'relative',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden'
                }}>
                  {/* Top Bar inside Card Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      background: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(8px)',
                      color: card.color,
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      border: `1px solid ${card.color}40`
                    }}>
                      {card.badge}
                    </span>

                    <span style={{
                      background: 'rgba(0, 0, 0, 0.65)',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontWeight: 600
                    }}>
                      {card.aspectRatio}
                    </span>
                  </div>

                  {/* Icon & Audition Trigger */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '42px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))' }}>
                      {card.icon}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handlePlayVoice(e, card)}
                      style={{
                        background: isPlaying ? '#ef4444' : 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        color: '#ffffff',
                        borderRadius: '20px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isPlaying ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      <span>{isPlaying ? 'Playing...' : 'Voice Sample'}</span>
                    </button>
                  </div>
                </div>

                {/* Card Content Body */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                      letterSpacing: '-0.01em'
                    }}>
                      {card.title}
                    </h3>

                    <p style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                      marginBottom: '16px'
                    }}>
                      {card.subtitle}
                    </p>

                    {/* Meta Indicators */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      marginBottom: '16px',
                      fontSize: '11.5px',
                      color: 'var(--text-muted)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={13} /> {card.views}
                      </span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        {card.retention}
                      </span>
                    </div>
                  </div>

                  {/* Clone & Open CTA */}
                  <button
                    type="button"
                    onClick={() => handleClonePreset(card.id)}
                    className="btn-outline"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Use This Blueprint</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
