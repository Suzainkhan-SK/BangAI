import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Square, Volume2, Sliders, Check, Search, ShieldCheck, VolumeX, Volume1 } from 'lucide-react';
import { MUSIC_TRACKS } from '../../data/musicTracks';

export default function MusicLibrary({ selectedMusicId, onSelectMusic, volume: propVolume, onVolumeChange }) {
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [ducking, setDucking] = useState(18);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [localVolume, setLocalVolume] = useState(propVolume !== undefined ? propVolume : 0.15);
  const audioRef = useRef(null);

  const currentVolume = propVolume !== undefined ? propVolume : localVolume;

  const handleVolumeUpdate = (newVol) => {
    const clamped = Math.max(0, Math.min(1, parseFloat(newVol) || 0));
    setLocalVolume(clamped);
    if (onVolumeChange) onVolumeChange(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Sync volume in real-time
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = currentVolume;
    }
  }, [currentVolume]);

  // Combined track list
  const allTracks = showSearch && searchResults.length > 0
    ? [...MUSIC_TRACKS, ...searchResults.filter(sr => !MUSIC_TRACKS.some(t => t.id === sr.id))]
    : MUSIC_TRACKS;

  const handleTogglePlay = (e, track) => {
    e.stopPropagation();

    // If "No Background Music", don't play audio
    if (!track.audioUrl && !track.previewUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingTrackId(null);
      if (onSelectMusic) onSelectMusic(track.id);
      return;
    }

    // If already playing this track, stop
    if (playingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingTrackId(null);
      return;
    }

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioUrl = track.previewUrl || track.audioUrl;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.volume = currentVolume;
      audioRef.current = audio;
      setPlayingTrackId(track.id);

      audio.play().catch(err => {
        console.warn('Music play failed:', err);
        setPlayingTrackId(null);
      });

      audio.onended = () => {
        setPlayingTrackId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingTrackId(null);
        audioRef.current = null;
      };
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
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14.5px' }}>
            Adaptive BGM Sound Score
          </span>
        </div>
        <span className="badge-pill badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
          <ShieldCheck size={11} /> 100% Content ID Free
        </span>
      </div>

      {/* Track List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
        {allTracks.map((track) => {
          const isSelected = selectedMusicId === track.id;
          const isPlaying = playingTrackId === track.id;
          const isPureVoiceover = track.id === 'none';

          return (
            <div
              key={track.id}
              onClick={() => onSelectMusic && onSelectMusic(track.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '10px',
                background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: `1.5px solid ${isSelected ? (track.color || 'var(--accent-cyan)') : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                {!isPureVoiceover && (
                  <button
                    onClick={(e) => handleTogglePlay(e, track)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: isPlaying ? track.color : 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: isPlaying ? '#000' : 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isPlaying ? <Square size={10} fill="#000" /> : <Play size={10} fill="currentColor" />}
                  </button>
                )}

                {isPureVoiceover && (
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: '12px' }}>🎙️</span>
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {track.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {track.artist} • {track.genre}
                  </div>
                </div>
              </div>

              {/* Selection Checkmark */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{track.duration}</span>
                {isSelected && (
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: track.color || 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={11} color="#000" strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Volume & Ducking Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Volume2 size={12} color="var(--accent-cyan)" />
              Sound Volume
            </span>
            <span style={{ color: '#fff', fontWeight: 800, background: 'rgba(6,182,212,0.15)', padding: '1px 6px', borderRadius: '4px' }}>
              {Math.round(currentVolume * 100)}%
            </span>
          </div>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={currentVolume}
            onChange={(e) => handleVolumeUpdate(e.target.value)}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer', height: '5px' }}
          />

          {/* Quick Volume Preset Pills */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '6px', justifyContent: 'space-between' }}>
            {[
              { label: 'Mute', val: 0 },
              { label: '10%', val: 0.10 },
              { label: '20%', val: 0.20 },
              { label: '35%', val: 0.35 },
              { label: '50%', val: 0.50 }
            ].map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleVolumeUpdate(p.val)}
                style={{
                  background: Math.abs(currentVolume - p.val) < 0.03 ? 'rgba(6,182,212,0.25)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${Math.abs(currentVolume - p.val) < 0.03 ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  color: Math.abs(currentVolume - p.val) < 0.03 ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  borderRadius: '5px',
                  padding: '2px 6px',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
