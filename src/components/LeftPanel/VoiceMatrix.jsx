import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic2, 
  Volume2, 
  Square, 
  Sliders, 
  Check, 
  Loader2, 
  Sparkles, 
  Play, 
  Search, 
  Globe, 
  Flame, 
  Layers, 
  Filter,
  ChevronDown
} from 'lucide-react';
import { 
  VOICES, 
  JSON2VIDEO_VOICES, 
  VOICE_PROVIDERS, 
  VOICE_CATEGORIES, 
  VOICE_LANGUAGES, 
  VOICE_ACCENTS,
  getAllVoices,
  getVoiceById
} from '../../data/voices';

export default function VoiceMatrix({ selectedVoiceId, onSelectVoice, voiceSpeed = 1.0, onVoiceSpeedChange }) {
  // Provider: 'all' | 'elevenlabs' | 'json2video'
  const [providerFilter, setProviderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [accentFilter, setAccentFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [visibleCount, setVisibleCount] = useState(30);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [generatingVoiceId, setGeneratingVoiceId] = useState(null);
  const [speed, setSpeed] = useState(Number(voiceSpeed) || 1.0);
  const [stability, setStability] = useState(75);
  const [customText, setCustomText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const audioRef = useRef(null);

  // Sync speed prop
  useEffect(() => {
    if (voiceSpeed !== undefined) {
      setSpeed(Number(voiceSpeed) || 1.0);
    }
  }, [voiceSpeed]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Filtered voice catalog with fast memoization
  const filteredVoices = useMemo(() => {
    let sourceList = [];
    if (providerFilter === 'elevenlabs') {
      sourceList = VOICES;
    } else if (providerFilter === 'json2video') {
      sourceList = JSON2VIDEO_VOICES;
    } else {
      sourceList = getAllVoices();
    }

    const q = searchQuery.trim().toLowerCase();

    return sourceList.filter(v => {
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      if (genderFilter !== 'all' && v.gender && v.gender.toLowerCase() !== genderFilter.toLowerCase()) return false;
      
      if (languageFilter !== 'all') {
        const vLang = v.language || 'English';
        if (vLang.toLowerCase() !== languageFilter.toLowerCase()) return false;
      }

      if (accentFilter !== 'all') {
        const vAcc = v.accent || '';
        if (!vAcc.toLowerCase().includes(accentFilter.toLowerCase())) return false;
      }

      if (q) {
        const matchName = v.name && v.name.toLowerCase().includes(q);
        const matchId = (v.id && v.id.toLowerCase().includes(q)) || (v.elevenLabsId && v.elevenLabsId.toLowerCase().includes(q));
        const matchDesc = v.description && v.description.toLowerCase().includes(q);
        const matchTag = v.tag && v.tag.toLowerCase().includes(q);
        const matchLang = v.language && v.language.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDesc && !matchTag && !matchLang) return false;
      }

      return true;
    });
  }, [providerFilter, categoryFilter, languageFilter, accentFilter, genderFilter, searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(30);
  }, [providerFilter, categoryFilter, languageFilter, accentFilter, genderFilter, searchQuery]);

  // Play pre-recorded preview sample
  const handlePlaySample = (e, voice) => {
    e.stopPropagation();

    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (voice.previewUrl) {
      const audio = new Audio(voice.previewUrl);
      audioRef.current = audio;
      setPlayingVoiceId(voice.id);

      audio.play().catch(err => {
        console.warn('Audio play failed:', err);
        setPlayingVoiceId(null);
      });

      audio.onended = () => {
        setPlayingVoiceId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingVoiceId(null);
        audioRef.current = null;
      };
    }
  };

  // Generate real TTS preview via ElevenLabs API
  const handleGeneratePreview = async (e, voice) => {
    e.stopPropagation();

    if (generatingVoiceId) return;

    const textToSpeak = customText.trim() || voice.sampleText || voice.description || 'Welcome to Viral Shorts AI Studio with ElevenLabs synthesis.';
    setGeneratingVoiceId(voice.id);

    try {
      const res = await fetch('/.netlify/functions/preview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voice.elevenLabsId || voice.id,
          text: textToSpeak
        })
      });

      const data = await res.json();

      if (data.success && data.audio) {
        if (audioRef.current) audioRef.current.pause();

        const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
        audioRef.current = audio;
        setPlayingVoiceId(voice.id);

        audio.play().catch(err => {
          console.warn('TTS audio play failed:', err);
          setPlayingVoiceId(null);
        });

        audio.onended = () => {
          setPlayingVoiceId(null);
          audioRef.current = null;
        };
      } else {
        console.error('TTS generation failed:', data.error);
      }
    } catch (err) {
      console.error('TTS preview error:', err);
    } finally {
      setGeneratingVoiceId(null);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Title & Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Mic2 size={16} color="#818cf8" />
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
              Voice Matrix
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
              ({filteredVoices.length.toLocaleString()} available)
            </span>
          </div>
        </div>
        <span className="badge-pill" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', fontSize: '10px', fontWeight: 800 }}>
          ⚡ 9,670+ Models
        </span>
      </div>

      {/* Provider Switcher Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '3px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)'
      }}>
        {VOICE_PROVIDERS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProviderFilter(p.id)}
            style={{
              background: providerFilter === p.id ? 'var(--accent-primary)' : 'transparent',
              color: providerFilter === p.id ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 4px',
              fontSize: '10.5px',
              fontWeight: providerFilter === p.id ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{p.icon}</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.id === 'all' ? 'All' : (p.id === 'elevenlabs' ? 'Native (23)' : 'Premium (9.6k)')}
            </span>
          </button>
        ))}
      </div>

      {/* Live Search & Custom TTS Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 9,650+ voices by name, vibe, accent, ID..."
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 10px 6px 30px',
              fontSize: '11px',
              color: '#ffffff',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Custom Text Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            style={{
              background: showCustomInput ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${showCustomInput ? '#818cf8' : 'var(--border-subtle)'}`,
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 600,
              color: showCustomInput ? '#a5b4fc' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={10} />
            <span>Custom Sample Text</span>
          </button>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
            Showing {Math.min(visibleCount, filteredVoices.length)} of {filteredVoices.length.toLocaleString()}
          </span>
        </div>
      </div>

      {showCustomInput && (
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Type custom text to preview with any voice... (max 500 chars)"
          maxLength={500}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '11px',
            color: '#ffffff',
            resize: 'vertical',
            minHeight: '44px',
            maxHeight: '70px',
            fontFamily: 'inherit',
            outline: 'none'
          }}
        />
      )}

      {/* Categorization & Filter Dropdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {/* Language Filter */}
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '4px 6px',
            fontSize: '10.5px',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {VOICE_LANGUAGES.map(l => (
            <option key={l.id} value={l.id} style={{ background: '#121216', color: '#fff' }}>
              {l.flag} {l.label} ({l.count})
            </option>
          ))}
        </select>

        {/* Accent Filter */}
        <select
          value={accentFilter}
          onChange={(e) => setAccentFilter(e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '4px 6px',
            fontSize: '10.5px',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {VOICE_ACCENTS.map(a => (
            <option key={a.id} value={a.id} style={{ background: '#121216', color: '#fff' }}>
              {a.flag} {a.label}
            </option>
          ))}
        </select>
      </div>

      {/* Gender & Category Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
        {['all', 'Female', 'Male'].map(g => (
          <button
            key={g}
            type="button"
            onClick={() => setGenderFilter(g)}
            style={{
              padding: '2px 8px',
              borderRadius: '5px',
              border: `1px solid ${genderFilter === g ? '#6366f1' : 'var(--border-subtle)'}`,
              background: genderFilter === g ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
              color: genderFilter === g ? '#ffffff' : 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {g === 'all' ? 'All Genders' : (g === 'Female' ? '👩 Female' : '👨 Male')}
          </button>
        ))}

        <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)', margin: '0 2px' }} />

        {VOICE_CATEGORIES.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryFilter(c.id)}
            style={{
              padding: '2px 8px',
              borderRadius: '5px',
              border: `1px solid ${categoryFilter === c.id ? '#6366f1' : 'var(--border-subtle)'}`,
              background: categoryFilter === c.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
              color: categoryFilter === c.id ? '#ffffff' : 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Voice Selection Cards (Virtualized / Paged List) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        maxHeight: '290px',
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {filteredVoices.slice(0, visibleCount).map((voice) => {
          const isSelected = selectedVoiceId === voice.id || selectedVoiceId === voice.elevenLabsId;
          const isPlayingThis = playingVoiceId === voice.id;
          const isGeneratingThis = generatingVoiceId === voice.id;
          const accentColor = voice.color || '#6366f1';

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice.elevenLabsId || voice.id)}
              style={{
                background: isSelected ? 'rgba(30, 41, 69, 0.9)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isSelected ? accentColor : 'var(--border-subtle)'}`,
                borderRadius: '8px',
                padding: '7px 9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 0 10px ${accentColor}30` : 'none'
              }}
            >
              {/* Voice info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: `${accentColor}25`,
                  border: `1px solid ${accentColor}50`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '12px',
                  color: accentColor,
                  flexShrink: 0
                }}>
                  {voice.name ? voice.name[0] : 'V'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '12.5px',
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {voice.name}
                    </span>
                    {voice.source === 'json2video' ? (
                      <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '1px 4px', borderRadius: '4px', flexShrink: 0 }}>
                        💎 Premium
                      </span>
                    ) : (
                      <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '1px 4px', borderRadius: '4px', flexShrink: 0 }}>
                        ⚡ Native
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {voice.flag || voice.language || 'English'} • {voice.gender || 'Universal'} {voice.accent ? `• ${voice.accent}` : ''}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                {/* Sample Audio Button */}
                {voice.previewUrl && (
                  <button
                    type="button"
                    onClick={(e) => handlePlaySample(e, voice)}
                    title="Play audio sample"
                    style={{
                      background: isPlayingThis && !isGeneratingThis ? accentColor : 'rgba(255, 255, 255, 0.06)',
                      color: isPlayingThis && !isGeneratingThis ? '#000000' : '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '3px 6px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    {isPlayingThis ? <Square size={8} fill="#000000" /> : <Volume2 size={9} />}
                    <span>{isPlayingThis ? 'Stop' : 'Sample'}</span>
                  </button>
                )}

                {/* Selected Checkmark */}
                {isSelected && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: accentColor,
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

        {/* Load More Button */}
        {visibleCount < filteredVoices.length && (
          <button
            type="button"
            onClick={() => setVisibleCount(prev => prev + 50)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '6px',
              color: 'var(--accent-primary)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            Load 50 More ({(filteredVoices.length - visibleCount).toLocaleString()} remaining)
          </button>
        )}

        {filteredVoices.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
            No voices found matching current filters.
          </div>
        )}
      </div>

      {/* Speed & Stability Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '3px' }}>
            <span>Speech Speed</span>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>{speed}x</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.25"
            step="0.05"
            value={speed}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSpeed(val);
              if (typeof onVoiceSpeedChange === 'function') onVoiceSpeedChange(val);
            }}
            style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '3px' }}>
            <span>Clarity & Stability</span>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>{stability}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={stability}
            onChange={(e) => setStability(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
}
