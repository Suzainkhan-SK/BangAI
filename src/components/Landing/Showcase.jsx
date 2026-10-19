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
  Zap,
  ExternalLink
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
      subtitle: 'World Mysteries & Paranormal • 5 Acts • 1080p',
      duration: '75s+ • 5 Scenes',
      aspectRatio: '9:16 Vertical',
      voiceModel: 'Adam (Deep Cinematic)',
      soundtrack: 'Deep Ocean Score (-18dB)',
      gradient: 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 70%, #020617 100%)',
      badge: 'World Mysteries',
      color: '#6366f1',
      voice: 'Adam (Deep Cinematic)',
      icon: '🛸',
      youtubeUrl: 'https://youtube.com/shorts/r3LTM0G7BTc?si=a5xHNd5fSDyfAny9'
    },
    {
      id: 'tatasteve',
      category: 'bio',
      title: 'Last 24 Hours [True Stories]',
      subtitle: 'Emotional True Stories • Archival Atmosphere • 5 Acts',
      duration: '75s+ • 5 Scenes',
      aspectRatio: '9:16 & 16:9',
      voiceModel: 'Marcus (Warm Storyteller)',
      soundtrack: 'Emotional Piano & Strings',
      gradient: 'radial-gradient(circle at 50% 30%, #1c1917 0%, #0f172a 70%, #000000 100%)',
      badge: 'True Stories & Bio',
      color: '#f59e0b',
      voice: 'Marcus (Warm Storyteller)',
      icon: '⏳',
      youtubeUrl: 'https://youtube.com/shorts/1ySvtrgDTnE?si=pMbTnIisLg7ftrg-'
    },
    {
      id: 'dragons',
      category: 'cgi',
      title: 'Dragons: Eastern vs Western War',
      subtitle: 'Epic Mythological CGI • Unreal Engine 5 VFX',
      duration: '75s+ • 5 Scenes',
      aspectRatio: '9:16 & 16:9',
      voiceModel: 'George (Epic British)',
      soundtrack: 'Orchestral Hybrid Score',
      gradient: 'radial-gradient(circle at 50% 30%, #311042 0%, #1e102f 70%, #05020a 100%)',
      badge: 'Mythological VFX',
      color: '#8b5cf6',
      voice: 'George (Epic British)',
      icon: '🐉'
    },
    {
      id: 'fruits',
      category: 'comedy',
      title: 'Talking Pineapple Supermarket Escape',
      subtitle: 'Pixar 3D Animation • Viral Cartoon Comedy',
      duration: '60s+ • 60 FPS',
      aspectRatio: '9:16 Vertical',
      voiceModel: 'Charlie (Playful Cartoon)',
      soundtrack: 'Playful Pizzicato Score',
      gradient: 'radial-gradient(circle at 50% 30%, #451a03 0%, #1c0a00 70%, #0c0a09 100%)',
      badge: '3D Pixar Animation',
      color: '#ec4899',
      voice: 'Charlie (Playful Cartoon)',
      icon: '🍍'
    }
  ];

  const filterTabs = [
    { id: 'all', label: 'All Pipelines' },
    { id: 'mystery', label: 'World Mysteries' },
    { id: 'bio', label: 'True Stories' },
    { id: 'cgi', label: 'Mythological VFX' },
    { id: 'comedy', label: '3D Animation' }
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
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 36px auto' }}>
          <span className="badge badge-brand" style={{ marginBottom: '12px' }}>
            <Sparkles size={13} />
            <span>Autonomous AI Video Templates</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: 'clamp(26px, 5vw, 38px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '14px',
            color: 'var(--text-primary)'
          }}>
            Explore Pre-Trained Generative AI Video Blueprints
          </h2>
          <p style={{ fontSize: isMobile ? '14.5px' : '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Each template is a complete autonomous pipeline: original 5-act screenplay writing, photorealistic 
            generative video prompts, emotional neural voice synthesis, and direct-to-YouTube auto-publishing.
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
                      AI TEMPLATE • {card.badge}
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
                        🎙️ {card.voiceModel}
                      </span>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                        {card.duration}
                      </span>
                    </div>
                  </div>

                  {/* Clone & Open CTA Row */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleClonePreset(card.id)}
                      className="btn-glow"
                      style={{
                        flex: 1,
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
                      <span>Create with Blueprint</span>
                      <ArrowRight size={15} />
                    </button>

                    {card.youtubeUrl && (
                      <a
                        href={card.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline"
                        title="Watch real generated sample on YouTube Shorts"
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
