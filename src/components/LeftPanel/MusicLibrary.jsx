import React, { useState, useEffect } from 'react';
import { Music, Play, Square, Volume2, Sliders, Check } from 'lucide-react';
import { MUSIC_TRACKS } from '../../data/musicTracks';
import { audioEngine } from '../../audio/audioEngine';

export default function MusicLibrary({ selectedMusicId, onSelectMusic }) {
  const [audioState, setAudioState] = useState({ isPlayingBgm: false, currentBgmId: null });
  const [ducking, setDucking] = useState(18);

  useEffect(() => {
    return audioEngine.subscribe((state) => setAudioState(state));
  }, []);

  const handleTogglePlay = (e, track) => {
    e.stopPropagation();
    if (audioState.isPlayingBgm && audioState.currentBgmId === track.id) {
      audioEngine.stopBgm();
    } else {
      audioEngine.playBgm(track.id, ducking / 100);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Music size={16} color="#67e8f9" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
            Adaptive BGM Sound Score
          </span>
        </div>
        <span className="badge-pill badge-cyan">
          Dynamic Ducking
        </span>
      </div>

      {/* Track List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '190px', overflowY: 'auto', paddingRight: '4px' }}>
        {MUSIC_TRACKS.map((track) => {
          const isSelected = selectedMusicId === track.id;
          const isPlayingThis = audioState.isPlayingBgm && audioState.currentBgmId === track.id;

          return (
            <div
              key={track.id}
              onClick={() => {
                audioEngine.playSfx('click');
                onSelectMusic(track.id);
              }}
              style={{
                background: isSelected ? 'rgba(30, 41, 69, 0.9)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isSelected ? track.color : 'var(--border-subtle)'}`,
                borderRadius: '10px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 0 12px ${track.color}35` : 'none'
              }}
            >
              {/* Track Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={(e) => handleTogglePlay(e, track)}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: isPlayingThis ? track.color : 'rgba(255, 255, 255, 0.08)',
                    color: isPlayingThis ? '#000000' : '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isPlayingThis ? <Square size={12} fill="#000000" /> : <Play size={12} fill="#ffffff" />}
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '12px', color: '#ffffff' }}>
                      {track.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {track.genre} • {track.tempo}
                  </div>
                </div>
              </div>

              {/* Waveform / Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={`live-waveform ${isPlayingThis ? 'playing' : ''}`}>
                  <div className="bar" style={{ background: track.color }}></div>
                  <div className="bar" style={{ background: track.color }}></div>
                  <div className="bar" style={{ background: track.color }}></div>
                  <div className="bar" style={{ background: track.color }}></div>
                  <div className="bar" style={{ background: track.color }}></div>
                </div>
                {isSelected && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: track.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={10} color="#000000" strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ducking Slider */}
      <div style={{ paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
          <span>Speech Volume Ducking (BGM volume during voiceover)</span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{ducking}%</span>
        </div>
        <input
          type="range"
          min="8"
          max="35"
          step="1"
          value={ducking}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setDucking(val);
            if (audioState.isPlayingBgm) {
              audioEngine.playBgm(audioState.currentBgmId, val / 100);
            }
          }}
          style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
        />
      </div>
    </div>
  );
}
