import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic2, 
  Type, 
  Music, 
  Sparkles, 
  Volume2, 
  Square, 
  Play, 
  Check, 
  Loader2, 
  Search, 
  Sliders, 
  Palette, 
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Zap,
  Film,
  Download,
  Share2,
  ChevronDown,
  Layers,
  Flame,
  Radio
} from 'lucide-react';
import { VOICES as STATIC_VOICES } from '../../data/voices';
import { SUBTITLE_STYLES, SUBTITLE_FONTS, SUBTITLE_POSITIONS } from '../../data/subtitleStyles';
import { MUSIC_TRACKS as STATIC_MUSIC } from '../../data/musicTracks';
import { audioEngine } from '../../audio/audioEngine';

export default function StudioLab({ 
  initialTab = 'voices',
  selectedVoiceId,
  onSelectVoice,
  subtitleSettings,
  onSubtitleChange,
  selectedMusicId,
  onSelectMusic,
  onApplySettingsToVideo,
  onClose
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'voices' | 'subtitles' | 'music'

  // ─── 1. VOICE STUDIO STATE ───────────────────────────────────────
  const [voices, setVoices] = useState(STATIC_VOICES);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [voiceGenderFilter, setVoiceGenderFilter] = useState('all'); // 'all', 'male', 'female'
  const [voiceAccentFilter, setVoiceAccentFilter] = useState('all');
  const [customTtsText, setCustomTtsText] = useState('In the depths of space, a signal from an unknown civilization was just detected.');
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [generatingVoiceId, setGeneratingVoiceId] = useState(null);
  const [voiceAudioCache, setVoiceAudioCache] = useState({}); // { voiceId: base64Audio }

  // ─── 2. SUBTITLE STUDIO STATE ────────────────────────────────────
  const [currentSubtitleSettings, setCurrentSubtitleSettings] = useState(() => {
    return subtitleSettings || {
      presetId: 'viral-progressive',
      style: 'classic-progressive',
      fontFamily: 'Montserrat',
      fontSize: 280,
      wordColor: '#FFFF00',
      lineColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 10,
      boxColor: '#FF0000',
      position: 'center-center',
      allCaps: true
    };
  });
  const [subtitleCustomText, setSubtitleCustomText] = useState('Watch how these animated subtitles boost your viewer retention by 300%!');
  const [isSubtitleRendering, setIsSubtitleRendering] = useState(false);
  const [renderedSubtitleVideoUrl, setRenderedSubtitleVideoUrl] = useState(null);
  const [subtitleRenderError, setSubtitleRenderError] = useState(null);

  // ─── 3. MUSIC STUDIO STATE ───────────────────────────────────────
  const [musicTracks, setMusicTracks] = useState(STATIC_MUSIC);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [musicMoodFilter, setMusicMoodFilter] = useState('all');
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [playingMusicId, setPlayingMusicId] = useState(null);
  const [musicVolume, setMusicVolume] = useState(0.25);
  const [duckingLevel, setDuckingLevel] = useState(18);

  const voiceAudioRef = useRef(null);
  const musicAudioRef = useRef(null);
  const subtitleVideoRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceAudioRef.current) voiceAudioRef.current.pause();
      if (musicAudioRef.current) musicAudioRef.current.pause();
    };
  }, []);

  // Fetch real ElevenLabs voices on mount
  useEffect(() => {
    async function loadVoices() {
      setIsLoadingVoices(true);
      try {
        const res = await fetch('/.netlify/functions/list-voices');
        const data = await res.json();
        if (data.voices && Array.isArray(data.voices) && data.voices.length > 0) {
          // Merge API voices with our rich metadata
          const merged = data.voices.map(apiV => {
            const matchedStatic = STATIC_VOICES.find(sv => 
              sv.elevenLabsId === apiV.voice_id || 
              sv.name.toLowerCase() === apiV.name.toLowerCase()
            );
            return {
              id: matchedStatic?.id || apiV.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              name: apiV.name,
              elevenLabsId: apiV.voice_id,
              gender: apiV.gender || matchedStatic?.gender || 'Unknown',
              accent: apiV.accent || matchedStatic?.flag || 'Global',
              tag: matchedStatic?.tag || apiV.category || 'Natural AI Voice',
              tone: matchedStatic?.tone || apiV.description || 'Clear & Expressive',
              previewUrl: apiV.preview_url || matchedStatic?.previewUrl || null,
              sampleText: matchedStatic?.sampleText || 'Experience the future of viral AI short-form content creation.',
              color: matchedStatic?.color || '#6366f1',
              bestFor: matchedStatic?.bestFor || ['Shorts', 'Reels', 'TikTok', 'Storytelling']
            };
          });
          setVoices(merged);
        }
      } catch (err) {
        console.warn('Could not load live voices, using static catalog:', err.message);
      } finally {
        setIsLoadingVoices(false);
      }
    }
    loadVoices();
  }, []);

  // Filter voices
  const filteredVoices = voices.filter(v => {
    const matchesSearch = !voiceSearchQuery.trim() || 
      v.name.toLowerCase().includes(voiceSearchQuery.toLowerCase()) ||
      v.accent.toLowerCase().includes(voiceSearchQuery.toLowerCase()) ||
      v.tag.toLowerCase().includes(voiceSearchQuery.toLowerCase()) ||
      v.bestFor.some(bf => bf.toLowerCase().includes(voiceSearchQuery.toLowerCase()));

    const matchesGender = voiceGenderFilter === 'all' || 
      v.gender.toLowerCase().includes(voiceGenderFilter.toLowerCase());

    const matchesAccent = voiceAccentFilter === 'all' || 
      v.accent.toLowerCase().includes(voiceAccentFilter.toLowerCase());

    return matchesSearch && matchesGender && matchesAccent;
  });

  // Play pre-recorded sample
  const handlePlayVoiceSample = (e, voice) => {
    e.stopPropagation();
    if (playingVoiceId === voice.id) {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    if (voiceAudioRef.current) voiceAudioRef.current.pause();

    const sampleUrl = voice.previewUrl;
    if (sampleUrl) {
      const audio = new Audio(sampleUrl);
      voiceAudioRef.current = audio;
      setPlayingVoiceId(voice.id);
      audio.play().catch(() => setPlayingVoiceId(null));
      audio.onended = () => setPlayingVoiceId(null);
      audio.onerror = () => setPlayingVoiceId(null);
    }
  };

  // Synthesize real ElevenLabs TTS
  const handleGenerateTts = async (e, voice) => {
    e.stopPropagation();
    if (generatingVoiceId) return;

    const textToSpeak = customTtsText.trim() || voice.sampleText;

    // Check cache
    const cacheKey = `${voice.elevenLabsId}_${textToSpeak}`;
    if (voiceAudioCache[cacheKey]) {
      if (voiceAudioRef.current) voiceAudioRef.current.pause();
      const audio = new Audio(`data:audio/mpeg;base64,${voiceAudioCache[cacheKey]}`);
      voiceAudioRef.current = audio;
      setPlayingVoiceId(voice.id);
      audio.play().catch(() => setPlayingVoiceId(null));
      audio.onended = () => setPlayingVoiceId(null);
      return;
    }

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
        setVoiceAudioCache(prev => ({ ...prev, [cacheKey]: data.audio }));
        if (voiceAudioRef.current) voiceAudioRef.current.pause();
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
        voiceAudioRef.current = audio;
        setPlayingVoiceId(voice.id);
        audio.play().catch(() => setPlayingVoiceId(null));
        audio.onended = () => setPlayingVoiceId(null);
      }
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setGeneratingVoiceId(null);
    }
  };

  // Play Background Music Track
  const handleTogglePlayMusic = (e, track) => {
    e.stopPropagation();
    if (playingMusicId === track.id) {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
      setPlayingMusicId(null);
      return;
    }

    if (musicAudioRef.current) musicAudioRef.current.pause();

    const audioUrl = track.previewUrl || track.audioUrl;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.volume = musicVolume;
      musicAudioRef.current = audio;
      setPlayingMusicId(track.id);
      audio.play().catch(() => setPlayingMusicId(null));
      audio.onended = () => setPlayingMusicId(null);
      audio.onerror = () => setPlayingMusicId(null);
    }
  };

  // Search Jamendo API
  const handleSearchMusic = async () => {
    if (!musicSearchQuery.trim()) return;
    setIsSearchingMusic(true);
    try {
      const res = await fetch(`/.netlify/functions/search-music?q=${encodeURIComponent(musicSearchQuery)}&source=all`);
      const data = await res.json();
      if (data.success && data.tracks) {
        setMusicTracks(data.tracks);
      }
    } catch (err) {
      console.warn('Music search failed:', err);
    } finally {
      setIsSearchingMusic(false);
    }
  };

  // Render Subtitle Preview via json2video
  const handleRenderSubtitlePreview = async () => {
    setIsSubtitleRendering(true);
    setSubtitleRenderError(null);
    setRenderedSubtitleVideoUrl(null);

    const chosenVoice = voices.find(v => v.id === selectedVoiceId) || voices[0];

    try {
      const res = await fetch('/.netlify/functions/preview-subtitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtitleSettings: currentSubtitleSettings,
          text: subtitleCustomText.substring(0, 180),
          voiceId: chosenVoice.name || 'Adam'
        })
      });

      const data = await res.json();
      if (data.success && data.videoUrl) {
        setRenderedSubtitleVideoUrl(data.videoUrl);
      } else {
        setSubtitleRenderError(data.error || 'Render failed');
      }
    } catch (err) {
      setSubtitleRenderError(err.message || 'Network error rendering subtitles');
    } finally {
      setIsSubtitleRendering(false);
    }
  };

  // Handle preset select
  const handleSelectSubtitlePreset = (preset) => {
    const updated = {
      presetId: preset.id,
      style: preset.style,
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      wordColor: preset.wordColor,
      lineColor: preset.lineColor,
      outlineColor: preset.outlineColor,
      outlineWidth: preset.outlineWidth,
      boxColor: preset.boxColor || '',
      position: preset.position,
      allCaps: preset.allCaps
    };
    setCurrentSubtitleSettings(updated);
    if (typeof onSubtitleChange === 'function') onSubtitleChange(updated);
  };

  const handleUpdateSubtitleSetting = (key, value) => {
    const updated = { ...currentSubtitleSettings, [key]: value };
    setCurrentSubtitleSettings(updated);
    if (typeof onSubtitleChange === 'function') onSubtitleChange(updated);
  };

  // Apply all selections to dashboard
  const handleApplyToVideo = () => {
    audioEngine.playSfx('success');
    if (typeof onApplySettingsToVideo === 'function') {
      const chosenVoice = voices.find(v => v.id === selectedVoiceId) || voices[0];
      const chosenMusic = musicTracks.find(m => m.id === selectedMusicId) || musicTracks[0];
      onApplySettingsToVideo({
        voiceId: selectedVoiceId,
        elevenLabsVoiceId: chosenVoice?.elevenLabsId || chosenVoice?.id || selectedVoiceId,
        subtitleSettings: currentSubtitleSettings,
        musicId: selectedMusicId,
        musicTrackUrl: chosenMusic?.audioUrl || '',
        musicVolume: musicVolume
      });
    }
    if (typeof onClose === 'function') onClose();
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px 20px 80px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* ─── TOP HERO / BANNER ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8), rgba(15, 23, 42, 0.95))',
        borderRadius: '24px',
        border: '1.5px solid rgba(99, 102, 241, 0.4)',
        padding: '24px 28px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
          }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                Audiovisual Design Studio
              </h1>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '11px', fontWeight: 800 }}>
                Live Sandbox Mode
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Test real ElevenLabs voices, render live subtitle clips via json2video API, and audition background music tracks before generating shorts.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleApplyToVideo}
            className="btn-glow"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              gap: '8px'
            }}
          >
            <Check size={16} />
            <span>Apply Selections to Video Generator</span>
          </button>
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '12px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('voices')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: `1.5px solid ${activeTab === 'voices' ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`,
            background: activeTab === 'voices' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'voices' ? '#34d399' : 'var(--text-muted)',
            fontSize: '13.5px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'voices' ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none'
          }}
        >
          <Mic2 size={16} />
          <span>ElevenLabs Voice Matrix ({voices.length} Voices)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subtitles')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: `1.5px solid ${activeTab === 'subtitles' ? '#fbbf24' : 'rgba(255, 255, 255, 0.08)'}`,
            background: activeTab === 'subtitles' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'subtitles' ? '#fbbf24' : 'var(--text-muted)',
            fontSize: '13.5px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'subtitles' ? '0 0 16px rgba(245, 158, 11, 0.25)' : 'none'
          }}
        >
          <Type size={16} />
          <span>Subtitle Studio & json2video Live Render</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('music')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: `1.5px solid ${activeTab === 'music' ? '#67e8f9' : 'rgba(255, 255, 255, 0.08)'}`,
            background: activeTab === 'music' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'music' ? '#67e8f9' : 'var(--text-muted)',
            fontSize: '13.5px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'music' ? '0 0 16px rgba(6, 182, 212, 0.25)' : 'none'
          }}
        >
          <Music size={16} />
          <span>Background Music Library</span>
        </button>
      </div>

      {/* ─── TAB 1: ELEVENLABS VOICE MATRIX ─────────────────────────── */}
      {activeTab === 'voices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Custom Text Prompt Input Box */}
          <div style={{
            background: 'var(--bg-input)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="#34d399" />
                Custom Text to Synthesize with Any Voice:
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {customTtsText.length} / 500 chars (Uses rotated ElevenLabs API keys)
              </span>
            </div>
            <textarea
              value={customTtsText}
              onChange={(e) => setCustomTtsText(e.target.value)}
              placeholder="Type any narration or hook to hear how each voice sounds with your exact words..."
              rows={2}
              maxLength={500}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '13.5px',
                lineHeight: 1.5,
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'none'
              }}
            />
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
              <div style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                alignItems: 'center'
              }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  value={voiceSearchQuery}
                  onChange={(e) => setVoiceSearchQuery(e.target.value)}
                  placeholder="Search voices by name, accent, gender, or use-case..."
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '8px 12px 8px 34px',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {['all', 'male', 'female'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setVoiceGenderFilter(g)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${voiceGenderFilter === g ? '#34d399' : 'var(--border-subtle)'}`,
                    background: voiceGenderFilter === g ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                    color: voiceGenderFilter === g ? '#34d399' : 'var(--text-muted)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {g === 'all' ? 'All Genders' : g}
                </button>
              ))}

              {['all', 'american', 'british', 'indian', 'swedish'].map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setVoiceAccentFilter(a)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${voiceAccentFilter === a ? '#6366f1' : 'var(--border-subtle)'}`,
                    background: voiceAccentFilter === a ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)',
                    color: voiceAccentFilter === a ? '#a5b4fc' : 'var(--text-muted)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {a === 'all' ? 'All Accents' : a}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Cards Grid */}
          {isLoadingVoices ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
              <div>Fetching latest voices from ElevenLabs API...</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '14px'
            }}>
              {filteredVoices.map((voice) => {
                const isSelected = selectedVoiceId === voice.id || selectedVoiceId === voice.elevenLabsId;
                const isPlayingThis = playingVoiceId === voice.id;
                const isGeneratingThis = generatingVoiceId === voice.id;

                return (
                  <div
                    key={voice.id}
                    onClick={() => onSelectVoice(voice.id)}
                    style={{
                      background: isSelected ? 'rgba(30, 41, 69, 0.95)' : 'var(--bg-card)',
                      border: `1.5px solid ${isSelected ? voice.color : 'var(--border-subtle)'}`,
                      borderRadius: '16px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: isSelected ? `0 0 20px ${voice.color}40` : 'var(--shadow-card)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Header: Avatar, Name, Accent */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: `${voice.color}25`,
                          border: `1.5px solid ${voice.color}60`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '14px',
                          color: voice.color
                        }}>
                          {voice.name[0]}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>
                              {voice.name}
                            </span>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {voice.accent}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: voice.color, fontWeight: 600 }}>
                            {voice.tag}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: voice.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Check size={13} color="#000" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Tone / Description */}
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {voice.tone}
                    </div>

                    {/* Best For Tags */}
                    {voice.bestFor && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {voice.bestFor.map((bf, idx) => (
                          <span key={idx} style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-muted)'
                          }}>
                            {bf}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons: Sample vs Generate TTS */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        type="button"
                        onClick={(e) => handlePlayVoiceSample(e, voice)}
                        style={{
                          flex: 1,
                          background: isPlayingThis ? voice.color : 'rgba(255, 255, 255, 0.08)',
                          color: isPlayingThis ? '#000000' : '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        {isPlayingThis ? <Square size={11} fill="#000" /> : <Volume2 size={12} />}
                        <span>{isPlayingThis ? 'Stop' : 'Sample'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleGenerateTts(e, voice)}
                        disabled={isGeneratingThis}
                        style={{
                          flex: 1.4,
                          background: isGeneratingThis ? `${voice.color}30` : 'rgba(16, 185, 129, 0.15)',
                          color: isGeneratingThis ? voice.color : '#34d399',
                          border: `1.5px solid ${isGeneratingThis ? voice.color : '#34d39950'}`,
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: isGeneratingThis ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        {isGeneratingThis ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={11} />}
                        <span>{isGeneratingThis ? 'Synthesizing...' : 'Generate AI TTS'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: SUBTITLE STUDIO & JSON2VIDEO LIVE RENDER ────────── */}
      {activeTab === 'subtitles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(300px, 0.8fr)', gap: '20px' }}>
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Custom Preview Text */}
            <div style={{
              background: 'var(--bg-input)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                Test Subtitle Narration Text:
              </span>
              <input
                type="text"
                value={subtitleCustomText}
                onChange={(e) => setSubtitleCustomText(e.target.value)}
                maxLength={180}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Presets Grid */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                1. Select Subtitle Style Preset:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {SUBTITLE_STYLES.map((preset) => {
                  const isActive = currentSubtitleSettings.presetId === preset.id || currentSubtitleSettings.style === preset.style;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectSubtitlePreset(preset)}
                      style={{
                        background: isActive ? `${preset.color}25` : 'var(--bg-input)',
                        border: `1.5px solid ${isActive ? preset.color : 'var(--border-subtle)'}`,
                        borderRadius: '12px',
                        padding: '12px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isActive ? `0 0 14px ${preset.color}35` : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{preset.icon}</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: isActive ? preset.color : '#fff', textAlign: 'center' }}>
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Styling Matrix */}
            <div style={{
              background: 'var(--bg-input)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                2. Fine-Tune Typography & Colors:
              </div>

              {/* Font Family & Size */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Font Family</label>
                  <select
                    value={currentSubtitleSettings.fontFamily}
                    onChange={(e) => handleUpdateSubtitleSetting('fontFamily', e.target.value)}
                    style={{ width: '100%', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 10px', color: '#fff', fontSize: '12px', outline: 'none' }}
                  >
                    {SUBTITLE_FONTS.map(f => (
                      <option key={f.id} value={f.family} style={{ background: '#1a1a2e' }}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Font Size</span>
                    <span style={{ color: '#fff', fontWeight: 700 }}>{currentSubtitleSettings.fontSize}px</span>
                  </div>
                  <input
                    type="range" min="180" max="400" step="20"
                    value={currentSubtitleSettings.fontSize}
                    onChange={(e) => handleUpdateSubtitleSetting('fontSize', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Color Pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <ColorPicker label="Word Highlight Color" value={currentSubtitleSettings.wordColor} onChange={(v) => handleUpdateSubtitleSetting('wordColor', v)} />
                <ColorPicker label="Line Text Color" value={currentSubtitleSettings.lineColor} onChange={(v) => handleUpdateSubtitleSetting('lineColor', v)} />
                <ColorPicker label="Outline Color" value={currentSubtitleSettings.outlineColor} onChange={(v) => handleUpdateSubtitleSetting('outlineColor', v)} />
                <ColorPicker label="Box Background Color" value={currentSubtitleSettings.boxColor} onChange={(v) => handleUpdateSubtitleSetting('boxColor', v)} />
              </div>

              {/* Outline Width */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Outline Stroke Width</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{currentSubtitleSettings.outlineWidth}px</span>
                </div>
                <input
                  type="range" min="0" max="20" step="2"
                  value={currentSubtitleSettings.outlineWidth}
                  onChange={(e) => handleUpdateSubtitleSetting('outlineWidth', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
                />
              </div>

              {/* Position */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Screen Position</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {SUBTITLE_POSITIONS.map(pos => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => handleUpdateSubtitleSetting('position', pos.value)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: currentSubtitleSettings.position === pos.value ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1.5px solid ${currentSubtitleSettings.position === pos.value ? '#fbbf24' : 'var(--border-subtle)'}`,
                        borderRadius: '8px',
                        color: currentSubtitleSettings.position === pos.value ? '#fbbf24' : '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      {pos.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Render Button */}
            <button
              type="button"
              onClick={handleRenderSubtitlePreview}
              disabled={isSubtitleRendering}
              className="btn-glow"
              style={{
                background: isSubtitleRendering
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                padding: '12px 20px',
                borderRadius: '12px',
                color: '#000000',
                fontSize: '13.5px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isSubtitleRendering ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="#000" />}
              <span>{isSubtitleRendering ? 'Rendering Real Video via json2video API...' : 'Render Live Subtitle Video Clip'}</span>
            </button>
          </div>

          {/* Video Preview Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: '#000000',
              borderRadius: '20px',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '420px',
              position: 'relative'
            }}>
              {isSubtitleRendering ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#fbbf24' }}>
                  <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 16px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '6px' }}>
                    Rendering with json2video Cloud Engine...
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Synthesizing ElevenLabs speech & baking subtitle animations
                  </div>
                </div>
              ) : renderedSubtitleVideoUrl ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <video
                    ref={subtitleVideoRef}
                    src={renderedSubtitleVideoUrl}
                    autoPlay
                    loop
                    controls
                    playsInline
                    style={{ width: '100%', maxHeight: '460px', objectFit: 'contain' }}
                  />
                  <div style={{
                    width: '100%',
                    padding: '8px 14px',
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
                      ✅ Real json2video Rendered MP4
                    </span>
                    <a
                      href={renderedSubtitleVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <span>Open Clip</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Type size={40} color="rgba(245, 158, 11, 0.4)" style={{ margin: '0 auto 14px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                    Realtime Video Subtitle Preview
                  </div>
                  <div style={{ fontSize: '12px', maxWidth: '260px', margin: '0 auto' }}>
                    Select your colors, font, and style, then click <strong>"Render Live Subtitle Video Clip"</strong> to test json2video rendering.
                  </div>
                </div>
              )}
            </div>

            {subtitleRenderError && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontSize: '12px'
              }}>
                ⚠️ <strong>Render Error:</strong> {subtitleRenderError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: BACKGROUND MUSIC LIBRARY ────────────────────────── */}
      {activeTab === 'music' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Music Search & Mood Filter */}
          <div style={{
            background: 'var(--bg-input)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  value={musicSearchQuery}
                  onChange={(e) => setMusicSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchMusic()}
                  placeholder="Search Jamendo & archive.org music catalog (e.g. epic, dark, lofi)..."
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '8px 12px 8px 34px',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleSearchMusic}
                disabled={isSearchingMusic}
                style={{
                  background: 'rgba(6, 182, 212, 0.2)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  color: '#67e8f9',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isSearchingMusic ? 'not-allowed' : 'pointer'
                }}
              >
                {isSearchingMusic ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
              </button>
            </div>

            {/* Volume & Ducking Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={14} color="#67e8f9" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Volume: {Math.round(musicVolume * 100)}%</span>
                <input
                  type="range" min="0.05" max="0.5" step="0.05"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  style={{ width: '80px', accentColor: '#67e8f9', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={14} color="#67e8f9" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ducking: -{duckingLevel}dB</span>
                <input
                  type="range" min="8" max="28" step="2"
                  value={duckingLevel}
                  onChange={(e) => setDuckingLevel(parseInt(e.target.value))}
                  style={{ width: '80px', accentColor: '#67e8f9', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Music Track Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px'
          }}>
            {musicTracks.map((track) => {
              const isSelected = selectedMusicId === track.id;
              const isPlayingThis = playingMusicId === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => onSelectMusic(track.id)}
                  style={{
                    background: isSelected ? 'rgba(30, 41, 69, 0.95)' : 'var(--bg-card)',
                    border: `1.5px solid ${isSelected ? track.color : 'var(--border-subtle)'}`,
                    borderRadius: '16px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: isSelected ? `0 0 16px ${track.color}40` : 'var(--shadow-card)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePlayMusic(e, track)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
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
                        {isPlayingThis ? <Square size={13} fill="#000" /> : <Play size={14} fill="#fff" />}
                      </button>

                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                          {track.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {track.genre} • {track.tempo}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: track.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={12} color="#000" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    <span>{track.mood}</span>
                    <span>{track.duration}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Color Picker Helper Component
function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          type="color"
          value={value || '#FFFFFF'}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '28px',
            height: '24px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0
          }}
        />
        <span style={{ fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}>{value || '#FFFFFF'}</span>
      </div>
    </div>
  );
}
