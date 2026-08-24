import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Square, Volume2, Sliders, Check, Search, Loader2 } from 'lucide-react';
import { MUSIC_TRACKS } from '../../data/musicTracks';

export default function MusicLibrary({ selectedMusicId, onSelectMusic }) {
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [ducking, setDucking] = useState(18);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Combined track list: curated + search results
  const allTracks = showSearch && searchResults.length > 0
    ? [...MUSIC_TRACKS, ...searchResults.filter(sr => !MUSIC_TRACKS.some(t => t.id === sr.id))]
    : MUSIC_TRACKS;

  const handleTogglePlay = (e, track) => {
    e.stopPropagation();

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
      audio.volume = volume;
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

  // Update volume in real-time
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Search Jamendo API for more tracks
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const res = await fetch(`/.netlify/functions/search-music?q=${encodeURIComponent(searchQuery)}&source=all`);
      const data = await res.json();
      if (data.success && data.tracks) {
        setSearchResults(data.tracks);
      }
    } catch (err) {
      console.error('Music search error:', err);
    } finally {
      setIsSearching(false);
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

      {/* Search Toggle */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => setShowSearch(!showSearch)}
          style={{
            background: showSearch ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${showSearch ? '#67e8f9' : 'var(--border-subtle)'}`,
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '10px',
            fontWeight: 600,
            color: showSearch ? '#67e8f9' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Search size={10} />
          Browse More Music
        </button>
      </div>

      {/* Search Input */}
      {showSearch && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by mood (epic, dark, happy...)"
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11px',
              color: '#ffffff',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            style={{
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#67e8f9',
              cursor: isSearching ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isSearching ? <Loader2 size={12} className="spin-animation" /> : <Search size={12} />}
          </button>
        </div>
      )}

      {/* Track List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
        {allTracks.map((track) => {
          const isSelected = selectedMusicId === track.id;
          const isPlayingThis = playingTrackId === track.id;

          return (
            <div
              key={track.id}
              onClick={() => onSelectMusic(track.id)}
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
                    {track.source === 'jamendo' && (
                      <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                        Jamendo
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {track.artist} • {track.tempo} • {track.mood}
                  </div>
                </div>
              </div>

              {/* Selection checkmark */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{track.duration}</span>
                {isSelected && (
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: track.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={11} color="#000000" strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Volume & Ducking Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
            <span>Preview Volume</span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
            <span>Voice Ducking</span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>-{ducking}dB</span>
          </div>
          <input
            type="range"
            min="8"
            max="28"
            step="2"
            value={ducking}
            onChange={(e) => setDucking(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
}
