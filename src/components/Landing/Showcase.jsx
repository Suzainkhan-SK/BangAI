import React, { useState } from 'react';
import { Play, Pause, Sparkles, ArrowRight, Volume2, Star, Eye } from 'lucide-react';
import { PRESETS } from '../../data/presets';
import { audioEngine } from '../../audio/audioEngine';

export default function Showcase({ onSelectPreset }) {
  const [filter, setFilter] = useState('all');
  const [playingId, setPlayingId] = useState(null);

  const cards = [
    {
      id: 'bermuda',
      category: 'mystery',
      title: 'Bermuda Triangle: Flight 19',
      subtitle: 'Mystery & Thriller • 5 Scenes • Hinglish',
      views: '1.4M views',
      rating: '4.9 ★',
      gradient: 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 70%, #020617 100%)',
      badge: 'Trending Mystery',
      color: '#6366f1',
      voice: 'Adam (Deep Cinematic)'
    },
    {
      id: 'dragons',
      category: 'cgi',
      title: 'Dragons: Eastern vs Western War',
      subtitle: 'Epic Mythological CGI • 5 Scenes • Hindi/Eng',
      views: '2.8M views',
      rating: '5.0 ★',
      gradient: 'radial-gradient(circle at 50% 30%, #311042 0%, #1e102f 70%, #05020a 100%)',
      badge: 'Billion VFX',
      color: '#8b5cf6',
      voice: 'George (Epic British)'
    },
    {
      id: 'fruits',
      category: 'comedy',
      title: 'Talking Pineapple Supermarket Escape',
      subtitle: 'Pixar 3D Animation • 5 Scenes • Comedy',
      views: '3.6M views',
      rating: '4.8 ★',
      gradient: 'radial-gradient(circle at 50% 30%, #451a03 0%, #1c0a00 70%, #0c0a09 100%)',
      badge: 'Viral TikTok',
      color: '#f59e0b',
      voice: 'Charlie (Cartoon Playful)'
    },
    {
      id: 'tatasteve',
      category: 'bio',
      title: 'Ratan Tata: The Final 24 Hours',
      subtitle: 'Emotional Biography • 5 Scenes • Archival',
      views: '4.1M views',
      rating: '5.0 ★',
      gradient: 'radial-gradient(circle at 50% 30%, #1c1917 0%, #0f172a 70%, #000000 100%)',
      badge: 'Emotional Hook',
      color: '#ec4899',
      voice: 'Marcus (Warm Storyteller)'
    }
  ];

  const filteredCards = filter === 'all' ? cards : cards.filter(c => c.category === filter);

  const handlePlayVoice = (e, card) => {
    e.stopPropagation();
    if (playingId === card.id) {
      audioEngine.stopVoice();
      setPlayingId(null);
    } else {
      const preset = PRESETS[card.id];
      if (preset) {
        audioEngine.playVoice(preset.voiceId, preset.scenes[0].voiceoverText);
        setPlayingId(card.id);
        setTimeout(() => setPlayingId(null), 5500);
      }
    }
  };

  return (
    <section id="showcase" style={{ padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
          <span className="badge badge-brand" style={{ marginBottom: '12px' }}>
            <Sparkles size={13} />
            <span>Proven High-Retention Formats</span>
          </span>
          <h2 className="font-display" style={{
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '14px',
            color: 'var(--text-primary)'
          }}>
            Explore Pre-Engineered Viral Templates
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Every template is engineered with strict 190–200 character timing per scene, 
            Grok video prompt parameters, and multi-genre audio scores.
          </p>
        </div>

        {/* Genre Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '36px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Templates' },
            { id: 'mystery', label: '🔍 Mystery & Thriller' },
            { id: 'cgi', label: '🐉 CGI & Mythology' },
            { id: 'comedy', label: '🍍 Pixar 3D Comedy' },
            { id: 'bio', label: '💔 Biographies' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                audioEngine.playSfx('click');
                setFilter(tab.id);
              }}
              style={{
                background: filter === tab.id ? 'var(--grad-primary)' : 'var(--bg-card)',
                color: filter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${filter === tab.id ? 'transparent' : 'var(--border-subtle)'}`,
                padding: '7px 16px',
                borderRadius: '99px',
                fontSize: '13px',
                fontWeight: filter === tab.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4 Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px'
        }}>
          {filteredCards.map((card) => (
            <div
              key={card.id}
              onClick={() => {
                audioEngine.playSfx('click');
                onSelectPreset(card.id);
              }}
              className="saas-card"
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Top Visual Poster Mockup */}
              <div style={{
                height: '220px',
                background: card.gradient,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '14px'
              }}>
                {/* Badge Top Left */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    background: 'rgba(0,0,0,0.65)',
                    border: `1px solid ${card.color}60`,
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    {card.badge}
                  </span>
                  <span style={{
                    background: 'rgba(0,0,0,0.65)',
                    color: '#34d399',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '10.5px',
                    fontWeight: 700
                  }}>
                    {card.views}
                  </span>
                </div>

                {/* Center Play Voice Preview Button */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={(e) => handlePlayVoice(e, card)}
                    className="btn-glow"
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px',
                      borderRadius: '99px',
                      background: playingId === card.id ? card.color : 'rgba(0, 0, 0, 0.75)'
                    }}
                  >
                    {playingId === card.id ? <Pause size={13} fill="#ffffff" /> : <Volume2 size={13} />}
                    <span>{playingId === card.id ? 'Playing Narration...' : 'Preview Voice'}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#e2e8f0' }}>
                  <span>🎙️ {card.voice}</span>
                  <span style={{ background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px' }}>
                    75s (5 Scenes)
                  </span>
                </div>
              </div>

              {/* Card Footer Details */}
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                <div>
                  <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                    {card.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {card.subtitle}
                  </div>
                </div>

                <div style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px'
                }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--accent-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Launch in Studio <ArrowRight size={13} />
                  </span>
                  <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>
                    {card.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
