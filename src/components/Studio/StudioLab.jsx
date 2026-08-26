import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Radio,
  Clock,
  X,
  Timer,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { 
  VOICES as STATIC_VOICES, 
  JSON2VIDEO_VOICES, 
  VOICE_PROVIDERS, 
  VOICE_CATEGORIES, 
  VOICE_LANGUAGES, 
  VOICE_ACCENTS, 
  getAllVoices, 
  getVoiceById 
} from '../../data/voices';
import { SUBTITLE_STYLES, SUBTITLE_FONTS, SUBTITLE_POSITIONS } from '../../data/subtitleStyles';
import { MUSIC_TRACKS as STATIC_MUSIC, MUSIC_MOODS, getMusicTrackById, resolveMusicId, PLAYABLE_TRACK_COUNT } from '../../data/musicTracks';
import { audioEngine } from '../../audio/audioEngine';
import { useBreakpoint } from '../../hooks/useMediaQuery';

// ─── DURATION TARGETS ─────────────────────────────────────────────────
const DURATION_TARGETS = [
  { value: 0,  label: 'No Limit' },
  { value: 5,  label: '5s' },
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
  { value: 20, label: '20s' },
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '60s' },
];

export default function StudioLab({
  initialTab = 'voices',
  selectedVoiceId,
  onSelectVoice,
  voiceSpeed = 1.0,
  onVoiceSpeedChange,
  subtitleSettings,
  onSubtitleChange,
  selectedMusicId,
  onSelectMusic,
  musicVolume = 0.15,
  onMusicVolumeChange,
  onApplySettingsToVideo,
  onClose
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'voices' | 'subtitles' | 'music'

  // Inline styles beat CSS classes, so structural responsiveness is driven here.
  const { isMobile, isTablet } = useBreakpoint();

  // ─── 1. VOICE STUDIO STATE ───────────────────────────────────────
  const [voices, setVoices] = useState(getAllVoices);
  const [currentVoiceSpeed, setCurrentVoiceSpeed] = useState(Number(voiceSpeed) || 1.0);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [voiceProviderFilter, setVoiceProviderFilter] = useState('all');
  const [voiceLanguageFilter, setVoiceLanguageFilter] = useState('all');
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [voiceGenderFilter, setVoiceGenderFilter] = useState('all'); // 'all', 'male', 'female'
  const [voiceAccentFilter, setVoiceAccentFilter] = useState('all');
  const [voiceCategoryFilter, setVoiceCategoryFilter] = useState('all');
  const [visibleVoiceCount, setVisibleVoiceCount] = useState(40);
  const [customTtsText, setCustomTtsText] = useState('In the depths of space, a signal from an unknown civilization was just detected.');
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [generatingVoiceId, setGeneratingVoiceId] = useState(null);
  const [voiceAudioCache, setVoiceAudioCache] = useState({}); // { voiceId: base64Audio }
  const [targetDuration, setTargetDuration] = useState(0); // seconds, 0 = no limit
  const [lastAudioDuration, setLastAudioDuration] = useState(null); // { voiceId, duration }

  // ─── 2. SUBTITLE STUDIO STATE ────────────────────────────────────
  const [currentSubtitleSettings, setCurrentSubtitleSettings] = useState(() => {
    return subtitleSettings || {
      presetId: 'mrbeast-viral',
      style: 'highlight',
      fontFamily: 'Montserrat',
      fontSize: 78,
      wordColor: '#FFE600',
      lineColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 10,
      shadowColor: '#000000',
      boxColor: '',
      position: 'center-bottom',
      allCaps: true,
      maxWordsPerLine: 3
    };
  });
  const [subtitleCustomText, setSubtitleCustomText] = useState('Watch how these animated subtitles boost your viewer retention by 300%!');
  const [isSubtitleRendering, setIsSubtitleRendering] = useState(false);
  const [renderedSubtitleVideoUrl, setRenderedSubtitleVideoUrl] = useState(null);
  const [subtitleRenderError, setSubtitleRenderError] = useState(null);
  const [subtitleVoiceId, setSubtitleVoiceId] = useState('adam'); // Voice used for subtitle render

  // ─── 3. MUSIC STUDIO STATE ───────────────────────────────────────
  const [musicTracks, setMusicTracks] = useState(STATIC_MUSIC);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [musicMoodFilter, setMusicMoodFilter] = useState('all');
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [playingMusicId, setPlayingMusicId] = useState(null);
  const [currentMusicVolume, setCurrentMusicVolume] = useState(() => Number(musicVolume) || 0.15);
  const [duckingLevel, setDuckingLevel] = useState(18);

  // Sync volume if prop changes
  useEffect(() => {
    if (musicVolume !== undefined) {
      setCurrentMusicVolume(Number(musicVolume) || 0.15);
    }
  }, [musicVolume]);

  const handleMusicVolumeChange = (newVol) => {
    const clamped = Math.max(0, Math.min(1, parseFloat(newVol) || 0));
    setCurrentMusicVolume(clamped);
    if (typeof onMusicVolumeChange === 'function') {
      onMusicVolumeChange(clamped);
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = clamped;
    }
    audioEngine.setBgmVolume(clamped);
  };

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
              gender: matchedStatic?.gender || apiV.gender || 'Unknown',
              accent: matchedStatic?.accent || 'american',
              flag: matchedStatic?.flag || apiV.accent || 'Global',
              age: matchedStatic?.age || 'Middle-Aged',
              category: matchedStatic?.category || 'conversational',
              badge: matchedStatic?.badge || '',
              tag: matchedStatic?.tag || apiV.category || 'Natural AI Voice',
              tone: matchedStatic?.tone || apiV.description || 'Clear & Expressive',
              previewUrl: apiV.preview_url || matchedStatic?.previewUrl || null,
              sampleText: matchedStatic?.sampleText || 'Experience the future of viral AI short-form content creation.',
              color: matchedStatic?.color || '#6366f1',
              bestFor: matchedStatic?.bestFor || ['Shorts', 'Reels', 'TikTok', 'Storytelling']
            };
          });
          // Also add any static voices that weren't in the API (custom Indian voices etc)
          STATIC_VOICES.forEach(sv => {
            if (!merged.find(m => m.elevenLabsId === sv.elevenLabsId && m.id === sv.id)) {
              merged.push(sv);
            }
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

  // Filter voices with fast memoization
  const filteredVoices = useMemo(() => {
    let sourceList = [];
    if (voiceProviderFilter === 'elevenlabs') sourceList = STATIC_VOICES;
    else if (voiceProviderFilter === 'json2video') sourceList = JSON2VIDEO_VOICES;
    else sourceList = voices && voices.length > STATIC_VOICES.length ? voices : getAllVoices();

    const q = voiceSearchQuery.trim().toLowerCase();

    return sourceList.filter(v => {
      if (voiceCategoryFilter !== 'all' && v.category !== voiceCategoryFilter) return false;
      if (voiceGenderFilter !== 'all' && v.gender && v.gender.toLowerCase() !== voiceGenderFilter.toLowerCase()) return false;
      if (voiceLanguageFilter !== 'all') {
        const vLang = v.language || 'English';
        if (vLang.toLowerCase() !== voiceLanguageFilter.toLowerCase()) return false;
      }
      if (voiceAccentFilter !== 'all') {
        const vAcc = v.accent || '';
        if (!vAcc.toLowerCase().includes(voiceAccentFilter.toLowerCase())) return false;
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
  }, [voices, voiceProviderFilter, voiceCategoryFilter, voiceLanguageFilter, voiceAccentFilter, voiceGenderFilter, voiceSearchQuery]);

  useEffect(() => {
    setVisibleVoiceCount(40);
  }, [voiceProviderFilter, voiceCategoryFilter, voiceLanguageFilter, voiceAccentFilter, voiceGenderFilter, voiceSearchQuery]);

  // Filter music tracks by mood
  const filteredMusic = musicTracks.filter(t => {
    if (musicMoodFilter !== 'all' && t.mood !== musicMoodFilter) return false;
    return true;
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
    const cacheKey = `${voice.elevenLabsId || voice.id}_${textToSpeak}`;
    if (voiceAudioCache[cacheKey]) {
      if (voiceAudioRef.current) voiceAudioRef.current.pause();
      const cached = voiceAudioCache[cacheKey];
      const audioSrc = typeof cached === 'string' && (cached.startsWith('http') || cached.startsWith('data:')) ? cached : `data:${cached.mimeType || 'audio/mpeg'};base64,${cached.audio || cached}`;
      const audio = new Audio(audioSrc);
      voiceAudioRef.current = audio;
      setPlayingVoiceId(voice.id);
      audio.play().catch(() => setPlayingVoiceId(null));
      audio.onloadedmetadata = () => {
        setLastAudioDuration({ voiceId: voice.id, duration: audio.duration });
      };
      audio.onended = () => setPlayingVoiceId(null);
      audio.onerror = () => setPlayingVoiceId(null);
      return;
    }

    setGeneratingVoiceId(voice.id);

    try {
      const res = await fetch('/.netlify/functions/preview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voice.elevenLabsId || voice.id,
          text: textToSpeak,
          speed: currentVoiceSpeed,
          provider: voice.source === 'json2video' ? 'json2video' : 'elevenlabs'
        })
      });

      const data = await res.json();
      if (data.success && (data.audio || data.audioUrl)) {
        const audioSrc = data.audioUrl || `data:${data.mimeType || 'audio/mpeg'};base64,${data.audio}`;
        setVoiceAudioCache(prev => ({ ...prev, [cacheKey]: audioSrc }));
        if (voiceAudioRef.current) voiceAudioRef.current.pause();
        const audio = new Audio(audioSrc);
        voiceAudioRef.current = audio;
        setPlayingVoiceId(voice.id);
        audio.play().catch(() => setPlayingVoiceId(null));
        audio.onloadedmetadata = () => {
          setLastAudioDuration({ voiceId: voice.id, duration: audio.duration });
        };
        audio.onended = () => setPlayingVoiceId(null);
        audio.onerror = () => setPlayingVoiceId(null);
      } else {
        console.error('TTS generation failed:', data.error);
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

    // Pure voiceover track (No BGM)
    if (!track.audioUrl && !track.previewUrl) {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
      setPlayingMusicId(null);
      if (onSelectMusic) onSelectMusic(track.id);
      return;
    }

    const audioUrl = track.previewUrl || track.audioUrl;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.volume = Math.max(0, Math.min(1, Number(currentMusicVolume) || 0.15));
      audio.crossOrigin = 'anonymous';
      musicAudioRef.current = audio;
      setPlayingMusicId(track.id);
      audio.play().catch(() => setPlayingMusicId(null));
      audio.onended = () => setPlayingMusicId(null);
      audio.onerror = () => setPlayingMusicId(null);
    }
  };

  // Update volume on playing track in real time, and duck under voiceovers.
  // duckGain converts the -dB slider into the linear multiplier the browser
  // audio element actually understands, so the control is not decorative.
  const duckGain = Math.pow(10, -Math.abs(Number(duckingLevel) || 0) / 20);

  useEffect(() => {
    if (!musicAudioRef.current) return;
    const base = Math.max(0, Math.min(1, Number(currentMusicVolume) || 0));
    musicAudioRef.current.volume = playingVoiceId ? base * duckGain : base;
  }, [currentMusicVolume, duckGain, playingVoiceId]);

  const handleDuckingChange = (db) => {
    const next = Math.max(0, Math.min(40, parseInt(db, 10) || 0));
    setDuckingLevel(next);
    audioEngine.setDuckingDb(next);
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

  // Reset music to curated library
  const handleResetMusicLibrary = () => {
    setMusicTracks(STATIC_MUSIC);
    setMusicSearchQuery('');
    setMusicMoodFilter('all');
  };

  // Render Subtitle Preview via json2video
  const handleRenderSubtitlePreview = async () => {
    setIsSubtitleRendering(true);
    setSubtitleRenderError(null);
    setRenderedSubtitleVideoUrl(null);

    const chosenVoice = voices.find(v => v.id === subtitleVoiceId) || voices[0];

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
      if (!data.success) {
        throw new Error(data.error || 'Render failed');
      }

      if (data.videoUrl) {
        setRenderedSubtitleVideoUrl(data.videoUrl);
        return;
      }

      if (data.project && data.apiKey) {
        const projectId = data.project;
        const apiKey = data.apiKey;
        const start = Date.now();

        while (Date.now() - start < 45000) {
          await new Promise(r => setTimeout(r, 2000));
          const pollRes = await fetch(`/.netlify/functions/preview-subtitle?project=${encodeURIComponent(projectId)}&apiKey=${encodeURIComponent(apiKey)}`);
          const pollData = await pollRes.json();
          if (pollData.success && pollData.videoUrl) {
            setRenderedSubtitleVideoUrl(pollData.videoUrl);
            return;
          }
          if (pollData.status === 'error') {
            throw new Error(pollData.error || 'Render failed on cloud engine');
          }
        }
        throw new Error('Subtitle render timed out. Please retry.');
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
      shadowColor: currentSubtitleSettings.shadowColor || '#000000',
      boxColor: preset.boxColor || '',
      position: preset.position,
      allCaps: preset.allCaps,
      maxWordsPerLine: currentSubtitleSettings.maxWordsPerLine || 3
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
      const chosenVoice = voices.find(v => v.id === selectedVoiceId || v.elevenLabsId === selectedVoiceId) || getVoiceById(selectedVoiceId) || STATIC_VOICES[0];
      const chosenMusic = musicTracks.find(m => m.id === selectedMusicId) || getMusicTrackById(selectedMusicId);
      onApplySettingsToVideo({
        voiceId: selectedVoiceId,
        elevenLabsVoiceId: chosenVoice?.elevenLabsId || chosenVoice?.id || selectedVoiceId,
        voiceSpeed: currentVoiceSpeed,
        subtitleSettings: currentSubtitleSettings,
        musicId: chosenMusic?.id || resolveMusicId(selectedMusicId),
        musicTrackUrl: chosenMusic?.audioUrl || chosenMusic?.previewUrl || '',
        musicVolume: currentMusicVolume
      });
    }
    if (typeof onClose === 'function') onClose();
  };

  // Duration badge helper
  const getDurationBadge = (voiceId) => {
    if (!lastAudioDuration || lastAudioDuration.voiceId !== voiceId) return null;
    if (targetDuration <= 0) return null;
    const actual = lastAudioDuration.duration;
    const diff = actual - targetDuration;
    if (diff <= 0) return { type: 'success', text: `${actual.toFixed(1)}s — fits in ${targetDuration}s ✅`, color: '#10b981' };
    if (diff <= 2) return { type: 'warning', text: `${actual.toFixed(1)}s — over by ${diff.toFixed(1)}s ⚠️`, color: '#f59e0b' };
    return { type: 'error', text: `${actual.toFixed(1)}s — exceeds ${targetDuration}s by ${diff.toFixed(1)}s ❌`, color: '#ef4444' };
  };

  // ─── TABS CONFIG ────────────────────────────────────────────────
  const tabs = [
    { id: 'voices',    label: `Voice Matrix (${voices.length})`, icon: Mic2,  color: '#10b981' },
    { id: 'subtitles', label: 'Subtitle Studio',                 icon: Type,  color: '#f59e0b' },
    { id: 'music',     label: `Music Library (${musicTracks.length})`, icon: Music, color: '#06b6d4' },
  ];

  return (
    <div style={{
      maxWidth: '1200px',
      width: '100%',
      minWidth: 0,
      margin: '0 auto',
      paddingTop: isMobile ? '16px' : '24px',
      paddingLeft: isMobile ? '14px' : '20px',
      paddingRight: isMobile ? '14px' : '20px',
      paddingBottom: isMobile ? 'calc(64px + var(--safe-b, 0px))' : '80px',
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '14px' : '20px'
    }}>
      {/* ─── TOP HERO BANNER ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        border: '1.5px solid var(--border-medium)',
        paddingTop: isMobile ? '16px' : '20px',
        paddingBottom: isMobile ? '16px' : '20px',
        paddingLeft: isMobile ? '16px' : '24px',
        paddingRight: isMobile ? '16px' : '24px',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: isMobile ? '12px' : '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Sparkles size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                Design Studio
              </h2>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
                fontSize: '10px', fontWeight: 800, padding: '2px 8px',
                borderRadius: '6px', border: '1px solid rgba(16,185,129,0.3)'
              }}>
                LIVE SANDBOX
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Test voices, render subtitles, and audition background music — all before generating.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
          <button type="button" onClick={handleApplyToVideo}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              paddingTop: '9px', paddingBottom: '9px', paddingLeft: '18px', paddingRight: '18px',
              borderRadius: '10px',
              fontSize: '12.5px', fontWeight: 800, gap: '6px',
              border: 'none', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flex: isMobile ? '1 1 auto' : '0 0 auto',
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              transition: 'all 0.2s ease'
            }}>
            <Check size={14} /> Apply to Video
          </button>
          {typeof onClose === 'function' && (
            <button type="button" onClick={onClose}
              style={{
                background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                paddingTop: '9px', paddingBottom: '9px', paddingLeft: '14px', paddingRight: '14px',
                cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}>
              <X size={14} /> Close
            </button>
          )}
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─────────────────────────────────────────── */}
      <div
        className={isMobile ? 'rail' : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px'
        }}
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              style={{
                paddingTop: '9px', paddingBottom: '9px',
                paddingLeft: isMobile ? '13px' : '18px',
                paddingRight: isMobile ? '13px' : '18px',
                borderRadius: '10px',
                border: `1.5px solid ${isActive ? tab.color : 'var(--border-subtle)'}`,
                background: isActive ? `${tab.color}18` : 'var(--bg-input)',
                color: isActive ? tab.color : 'var(--text-muted)',
                fontSize: isMobile ? '12px' : '13px', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '7px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 0 14px ${tab.color}25` : 'none'
              }}>
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ TAB 1: ELEVENLABS VOICE MATRIX ═══════════════════════════ */}
      {activeTab === 'voices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Custom Text + Duration Target */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: '16px',
            padding: '16px 20px', border: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="#10b981" />
                Custom Text to Synthesize:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Target Duration Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Timer size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target:</span>
                  <select value={targetDuration}
                    onChange={e => setTargetDuration(Number(e.target.value))}
                    style={{
                      background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                      borderRadius: '6px', padding: '3px 8px', color: 'var(--text-primary)',
                      fontSize: '11px', outline: 'none', cursor: 'pointer'
                    }}>
                    {DURATION_TARGETS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {customTtsText.length}/500
                </span>
              </div>
            </div>
            <textarea
              value={customTtsText}
              onChange={(e) => setCustomTtsText(e.target.value)}
              placeholder="Type any narration or hook to hear how each voice sounds with your exact words..."
              rows={2} maxLength={500}
              style={{
                width: '100%', background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)', borderRadius: '10px',
                padding: '10px 14px', color: 'var(--text-primary)',
                fontSize: '13px', lineHeight: 1.5, outline: 'none',
                fontFamily: 'inherit', resize: 'none'
              }}
            />
          </div>

          {/* Voiceover Speed Selector */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>⚡</span>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)' }}>Voiceover Pacing / Speed:</span>
              <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#6366f1' }}>{currentVoiceSpeed}x</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              {[
                { val: 0.90, label: '0.90x Relaxed' },
                { val: 1.0, label: '1.0x Normal (Recommended)' },
                { val: 1.10, label: '1.10x Dynamic' },
                { val: 1.15, label: '1.15x Engaging' },
                { val: 1.20, label: '1.20x Viral Pacing' },
                { val: 1.25, label: '1.25x High Energy' }
              ].map(s => {
                const isSelected = Math.abs(currentVoiceSpeed - s.val) < 0.01;
                return (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => {
                      setCurrentVoiceSpeed(s.val);
                      if (typeof onVoiceSpeedChange === 'function') onVoiceSpeedChange(s.val);
                    }}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--bg-input)',
                      border: `1px solid ${isSelected ? '#6366f1' : 'var(--border-subtle)'}`,
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      padding: '4px 10px',
                      borderRadius: '7px',
                      fontSize: '11px',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider Switcher Tabs — grid on desktop, swipeable rail on phones */}
          <div
            className={isMobile ? 'rail' : undefined}
            style={{
              display: isMobile ? 'flex' : 'grid',
              gridTemplateColumns: isMobile ? undefined : 'repeat(3, 1fr)',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {VOICE_PROVIDERS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setVoiceProviderFilter(p.id)}
                style={{
                  background: voiceProviderFilter === p.id ? 'var(--accent-primary)' : 'transparent',
                  color: voiceProviderFilter === p.id ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '8px',
                  paddingTop: '7px',
                  paddingBottom: '7px',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  fontSize: isMobile ? '11.5px' : '12px',
                  fontWeight: voiceProviderFilter === p.id ? 800 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Category Filter + Search + Language/Gender Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Category Filter Row */}
            <div
              className={isMobile ? 'rail' : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: isMobile ? 'nowrap' : 'wrap' }}
            >
              {VOICE_CATEGORIES.map(cat => (
                <button key={cat.id} type="button"
                  onClick={() => setVoiceCategoryFilter(cat.id)}
                  style={{
                    paddingTop: '5px', paddingBottom: '5px', paddingLeft: '12px', paddingRight: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${voiceCategoryFilter === cat.id ? '#6366f1' : 'var(--border-subtle)'}`,
                    background: voiceCategoryFilter === cat.id ? 'rgba(99,102,241,0.12)' : 'var(--bg-input)',
                    color: voiceCategoryFilter === cat.id ? '#a5b4fc' : 'var(--text-muted)',
                    fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}>
                  <span>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>

            {/* Search + Language + Gender + Accent Filters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '1fr 1fr' : '1.4fr 1fr auto'),
              gap: '10px',
              alignItems: 'center'
            }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                <input type="text" value={voiceSearchQuery}
                  onChange={(e) => setVoiceSearchQuery(e.target.value)}
                  placeholder="Search 9,650+ voices by name, accent, tone, or ID..."
                  style={{
                    width: '100%', background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)', borderRadius: '10px',
                    padding: '8px 12px 8px 34px', color: 'var(--text-primary)',
                    fontSize: '12px', outline: 'none'
                  }} />
                {voiceSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setVoiceSearchQuery('')}
                    style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Language Selector */}
              <select
                value={voiceLanguageFilter}
                onChange={e => setVoiceLanguageFilter(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {VOICE_LANGUAGES.map(l => (
                  <option key={l.id} value={l.id} style={{ background: '#18181b', color: '#fff' }}>
                    {l.flag} {l.label} ({l.count})
                  </option>
                ))}
              </select>

              {/* Gender Filter Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {['all', 'male', 'female'].map(g => (
                  <button key={g} type="button" onClick={() => setVoiceGenderFilter(g)}
                    style={{
                      flex: isMobile ? '1 1 0' : '0 0 auto',
                      paddingTop: '6px', paddingBottom: '6px', paddingLeft: '12px', paddingRight: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${voiceGenderFilter === g ? '#10b981' : 'var(--border-subtle)'}`,
                      background: voiceGenderFilter === g ? 'rgba(16,185,129,0.12)' : 'var(--bg-input)',
                      color: voiceGenderFilter === g ? '#34d399' : 'var(--text-muted)',
                      fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}>
                    {g === 'all' ? 'All' : g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Voice Cards Grid */}
          {isLoadingVoices ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
              <div>Fetching latest voices from ElevenLabs API...</div>
            </div>
          ) : filteredVoices.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Mic2 size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>No voices match your filters</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting the category, language, or gender filter</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(min(${isMobile ? 220 : 280}px, 100%), 1fr))`,
              gap: '12px'
            }}>
              {filteredVoices.slice(0, visibleVoiceCount).map((voice) => {
                const isSelected = selectedVoiceId === voice.id || selectedVoiceId === voice.elevenLabsId;
                const isPlayingThis = playingVoiceId === voice.id;
                const isGeneratingThis = generatingVoiceId === voice.id;
                const durationBadge = getDurationBadge(voice.id);
                const cardColor = voice.color || '#6366f1';

                return (
                  <div key={voice.id}
                    onClick={() => onSelectVoice(voice.elevenLabsId || voice.id)}
                    style={{
                      background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      border: `1.5px solid ${isSelected ? cardColor : 'var(--border-subtle)'}`,
                      borderRadius: '14px', padding: '14px', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', gap: '10px',
                      boxShadow: isSelected ? `0 0 18px ${cardColor}30` : 'none',
                      transition: 'all 0.2s ease', position: 'relative'
                    }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '9px',
                          background: `${cardColor}20`, border: `1.5px solid ${cardColor}50`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900, fontSize: '13px', color: cardColor,
                          flexShrink: 0
                        }}>
                          {voice.name ? voice.name[0] : 'V'}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                              {voice.name}
                            </span>
                            {voice.source === 'json2video' ? (
                              <span style={{ fontSize: '8.5px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', flexShrink: 0 }}>
                                💎 Premium
                              </span>
                            ) : (
                              <span style={{ fontSize: '8.5px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: `${cardColor}18`, color: cardColor, flexShrink: 0 }}>
                                ⚡ Native
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span>{voice.flag || voice.language || 'English'}</span>
                            <span>•</span>
                            <span>{voice.gender || 'Universal'}</span>
                            {voice.accent && <><span>•</span><span>{voice.accent}</span></>}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: cardColor, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Check size={13} color="#000" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Tag + Tone / Description */}
                    {voice.tag && <div style={{ fontSize: '11px', color: cardColor, fontWeight: 600 }}>{voice.tag}</div>}
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, maxHeight: '38px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {voice.description || voice.tone}
                    </div>

                    {/* Best For Tags */}
                    {voice.bestFor && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {voice.bestFor.slice(0, 5).map((bf, idx) => (
                          <span key={idx} style={{
                            fontSize: '9px', fontWeight: 700, padding: '2px 5px',
                            borderRadius: '4px', background: 'var(--bg-input)',
                            color: 'var(--text-muted)', border: '1px solid var(--border-subtle)'
                          }}>
                            {bf}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Duration Badge */}
                    {durationBadge && (
                      <div style={{
                        fontSize: '11px', fontWeight: 700, color: durationBadge.color,
                        padding: '4px 8px', borderRadius: '6px',
                        background: `${durationBadge.color}15`,
                        border: `1px solid ${durationBadge.color}40`,
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <Clock size={11} /> {durationBadge.text}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                      {voice.previewUrl && (
                        <button type="button" onClick={(e) => handlePlayVoiceSample(e, voice)}
                          style={{
                            flex: 1, background: isPlayingThis ? cardColor : 'var(--bg-input)',
                            color: isPlayingThis ? '#000' : 'var(--text-primary)',
                            border: `1px solid ${isPlayingThis ? cardColor : 'var(--border-subtle)'}`,
                            borderRadius: '8px', padding: '6px 8px', fontSize: '11px',
                            fontWeight: 700, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: '4px',
                            transition: 'all 0.15s ease'
                          }}>
                          {isPlayingThis ? <Square size={10} fill="#000" /> : <Volume2 size={11} />}
                          <span>{isPlayingThis ? 'Stop' : 'Sample'}</span>
                        </button>
                      )}

                      <button type="button" onClick={(e) => handleGenerateTts(e, voice)}
                        disabled={!!generatingVoiceId}
                        style={{
                          flex: 1.4, background: isGeneratingThis ? `${cardColor}15` : 'rgba(16,185,129,0.1)',
                          color: isGeneratingThis ? cardColor : '#10b981',
                          border: `1px solid ${isGeneratingThis ? cardColor : 'rgba(16,185,129,0.3)'}`,
                          borderRadius: '8px', padding: '6px 8px', fontSize: '11px',
                          fontWeight: 700, cursor: generatingVoiceId ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                          transition: 'all 0.15s ease'
                        }}>
                        {isGeneratingThis ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={10} />}
                        <span>{isGeneratingThis ? 'Synthesizing...' : 'Generate TTS'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Load More Button */}
              {visibleVoiceCount < filteredVoices.length && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setVisibleVoiceCount(prev => prev + 50)}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      color: 'var(--accent-primary)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Load 50 More ({(filteredVoices.length - visibleVoiceCount).toLocaleString()} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 2: SUBTITLE STUDIO ═══════════════════════════════════ */}
      {activeTab === 'subtitles' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isTablet ? '1fr' : 'minmax(300px, 1.2fr) minmax(300px, 0.8fr)',
          gap: '20px'
        }}>
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Custom Text + Voice Selector */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: '14px',
              padding: '14px', border: '1px solid var(--border-subtle)',
              display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                Test Subtitle Narration Text:
              </span>
              <input type="text" value={subtitleCustomText}
                onChange={(e) => setSubtitleCustomText(e.target.value)}
                maxLength={180}
                style={{
                  width: '100%', background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)', borderRadius: '8px',
                  padding: '8px 12px', color: 'var(--text-primary)',
                  fontSize: '13px', outline: 'none'
                }} />
              {/* Voice selector for subtitle render */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic2 size={13} color="var(--text-muted)" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Voice for render:</span>
                <select value={subtitleVoiceId}
                  onChange={e => setSubtitleVoiceId(e.target.value)}
                  style={{
                    flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                    borderRadius: '6px', padding: '4px 8px', color: 'var(--text-primary)',
                    fontSize: '11px', outline: 'none', cursor: 'pointer'
                  }}>
                  {voices.slice(0, 23).map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.flag})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Presets Grid */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                1. Select YouTuber Subtitle Preset:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(min(${isMobile ? 150 : 200}px, 100%), 1fr))`, gap: '8px' }}>
                {SUBTITLE_STYLES.map((preset) => {
                  const isActive = currentSubtitleSettings.presetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectSubtitlePreset(preset)}
                      style={{
                        background: isActive ? `${preset.color}15` : 'var(--bg-input)',
                        border: `1.5px solid ${isActive ? preset.color : 'var(--border-subtle)'}`,
                        borderRadius: '12px', padding: '12px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: '6px',
                        boxShadow: isActive ? `0 0 16px ${preset.color}30` : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '16px' }}>{preset.icon}</span>
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {preset.name}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '9px', fontWeight: 800, padding: '2px 5px', borderRadius: '5px',
                          background: `${preset.color}25`, color: preset.color
                        }}>
                          {preset.badge}
                        </span>
                      </div>

                      <div style={{
                        background: '#09090b', borderRadius: '7px', padding: '6px 8px',
                        textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        <span style={{
                          fontFamily: preset.fontFamily,
                          fontWeight: 900,
                          fontSize: '10.5px',
                          color: preset.wordColor,
                          textTransform: preset.allCaps ? 'uppercase' : 'none',
                          background: preset.boxColor ? `${preset.boxColor}90` : 'transparent',
                          padding: preset.boxColor ? '2px 5px' : '0',
                          borderRadius: '3px'
                        }}>
                          {preset.samplePreview}
                        </span>
                      </div>

                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                        {preset.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Typography Controls */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: '14px',
              padding: '14px', border: '1px solid var(--border-subtle)',
              display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                2. Fine-Tune Typography & Colors:
              </div>

              {/* Font Family, Size, Max Words */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Font Family</label>
                  <select value={currentSubtitleSettings.fontFamily}
                    onChange={(e) => handleUpdateSubtitleSetting('fontFamily', e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '7px', padding: '5px 8px', color: 'var(--text-primary)', fontSize: '11px', outline: 'none' }}>
                    {SUBTITLE_FONTS.map(f => (
                      <option key={f.id} value={f.family}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                    <span>Font Size</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{currentSubtitleSettings.fontSize}px</span>
                  </div>
                  <input type="range" min="56" max="100" step="2"
                    value={currentSubtitleSettings.fontSize}
                    onChange={(e) => handleUpdateSubtitleSetting('fontSize', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Max Words/Line</label>
                  <select value={currentSubtitleSettings.maxWordsPerLine || 3}
                    onChange={(e) => handleUpdateSubtitleSetting('maxWordsPerLine', parseInt(e.target.value))}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '7px', padding: '5px 8px', color: 'var(--text-primary)', fontSize: '11px', outline: 'none' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n} word{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color Pickers — 5 colors */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '8px' }}>
                <ColorPicker label="Word Highlight" value={currentSubtitleSettings.wordColor} onChange={(v) => handleUpdateSubtitleSetting('wordColor', v)} />
                <ColorPicker label="Line Text" value={currentSubtitleSettings.lineColor} onChange={(v) => handleUpdateSubtitleSetting('lineColor', v)} />
                <ColorPicker label="Outline" value={currentSubtitleSettings.outlineColor} onChange={(v) => handleUpdateSubtitleSetting('outlineColor', v)} />
                <ColorPicker label="Shadow" value={currentSubtitleSettings.shadowColor || '#000000'} onChange={(v) => handleUpdateSubtitleSetting('shadowColor', v)} />
                <ColorPicker label="Box Background" value={currentSubtitleSettings.boxColor} onChange={(v) => handleUpdateSubtitleSetting('boxColor', v)} />
              </div>

              {/* Outline Width */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>Outline Width</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{currentSubtitleSettings.outlineWidth}px</span>
                </div>
                <input type="range" min="0" max="20" step="2"
                  value={currentSubtitleSettings.outlineWidth}
                  onChange={(e) => handleUpdateSubtitleSetting('outlineWidth', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }} />
              </div>

              {/* Position + All-Caps Toggle */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Screen Position</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {SUBTITLE_POSITIONS.map(pos => (
                      <button key={pos.id} type="button"
                        onClick={() => handleUpdateSubtitleSetting('position', pos.value)}
                        style={{
                          flex: 1, padding: '5px 10px', fontSize: '10px', fontWeight: 700,
                          background: currentSubtitleSettings.position === pos.value ? 'rgba(245,158,11,0.2)' : 'var(--bg-input)',
                          border: `1.5px solid ${currentSubtitleSettings.position === pos.value ? '#f59e0b' : 'var(--border-subtle)'}`,
                          borderRadius: '7px',
                          color: currentSubtitleSettings.position === pos.value ? '#f59e0b' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}>
                        {pos.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* All-Caps Toggle */}
                <button type="button"
                  onClick={() => handleUpdateSubtitleSetting('allCaps', !currentSubtitleSettings.allCaps)}
                  style={{
                    padding: '5px 14px', borderRadius: '7px', fontSize: '11px', fontWeight: 800,
                    background: currentSubtitleSettings.allCaps ? 'rgba(245,158,11,0.2)' : 'var(--bg-input)',
                    border: `1.5px solid ${currentSubtitleSettings.allCaps ? '#f59e0b' : 'var(--border-subtle)'}`,
                    color: currentSubtitleSettings.allCaps ? '#f59e0b' : 'var(--text-muted)',
                    cursor: 'pointer', whiteSpace: 'nowrap'
                  }}>
                  {currentSubtitleSettings.allCaps ? 'ALL CAPS ON' : 'All Caps Off'}
                </button>
              </div>
            </div>

            {/* Render Button */}
            <button type="button" onClick={handleRenderSubtitlePreview}
              disabled={isSubtitleRendering}
              style={{
                background: isSubtitleRendering ? 'rgba(245,158,11,0.15)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                padding: '11px 20px', borderRadius: '10px',
                color: isSubtitleRendering ? '#f59e0b' : '#000',
                fontSize: '13px', fontWeight: 900, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', cursor: isSubtitleRendering ? 'not-allowed' : 'pointer',
                boxShadow: isSubtitleRendering ? 'none' : '0 4px 14px rgba(245,158,11,0.3)',
                transition: 'all 0.2s ease'
              }}>
              {isSubtitleRendering ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} fill="#000" />}
              <span>{isSubtitleRendering ? 'Rendering via json2video API...' : 'Render Live Subtitle Video Clip'}</span>
            </button>
          </div>

          {/* Video Preview Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: '#000', borderRadius: '16px',
              border: '2px solid rgba(245,158,11,0.3)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: '400px', position: 'relative'
            }}>
              {isSubtitleRendering ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#fbbf24' }}>
                  <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 14px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '4px' }}>
                    Rendering with json2video Cloud...
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Synthesizing voice & baking subtitle animations
                  </div>
                </div>
              ) : renderedSubtitleVideoUrl ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <video ref={subtitleVideoRef} src={renderedSubtitleVideoUrl}
                    autoPlay loop controls playsInline
                    style={{ width: '100%', maxHeight: '440px', objectFit: 'contain' }} />
                  <div style={{
                    width: '100%', padding: '8px 14px', background: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
                      ✅ Real json2video Rendered MP4
                    </span>
                    <a href={renderedSubtitleVideoUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                      <span>Open Clip</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Type size={36} color="rgba(245,158,11,0.3)" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Live Subtitle Preview
                  </div>
                  <div style={{ fontSize: '12px', maxWidth: '240px', margin: '0 auto' }}>
                    Select your style, then click <strong>"Render Live Subtitle Video Clip"</strong> to preview.
                  </div>
                </div>
              )}
            </div>

            {subtitleRenderError && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)',
                color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <AlertTriangle size={14} />
                <strong>Render Error:</strong> {subtitleRenderError}
              </div>
            )}

            {/* Current Settings Summary */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: '12px',
              padding: '12px', border: '1px solid var(--border-subtle)',
              fontSize: '11px', color: 'var(--text-muted)'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>Current Settings:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                <span>Font: <strong style={{ color: 'var(--text-primary)' }}>{currentSubtitleSettings.fontFamily}</strong></span>
                <span>Size: <strong style={{ color: 'var(--text-primary)' }}>{currentSubtitleSettings.fontSize}px</strong></span>
                <span>Voice: <strong style={{ color: 'var(--text-primary)' }}>{voices.find(v => v.id === subtitleVoiceId)?.name || 'Adam'}</strong></span>
                <span>Position: <strong style={{ color: 'var(--text-primary)' }}>{currentSubtitleSettings.position}</strong></span>
                <span>All Caps: <strong style={{ color: 'var(--text-primary)' }}>{currentSubtitleSettings.allCaps ? 'Yes' : 'No'}</strong></span>
                <span>Words/Line: <strong style={{ color: 'var(--text-primary)' }}>{currentSubtitleSettings.maxWordsPerLine || 3}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 3: BACKGROUND MUSIC LIBRARY ═════════════════════════ */}
      {activeTab === 'music' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Search, Mood Filter, Volume Controls */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: '14px',
            padding: '14px 18px', border: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            {/* Search Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0, display: 'flex', alignItems: 'center' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                <input type="text" value={musicSearchQuery}
                  onChange={(e) => setMusicSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchMusic()}
                  placeholder="Search Jamendo & archive.org (e.g. epic, dark, lofi)..."
                  style={{
                    width: '100%', background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)', borderRadius: '10px',
                    padding: '8px 12px 8px 34px', color: 'var(--text-primary)',
                    fontSize: '12px', outline: 'none'
                  }} />
              </div>
              <button type="button" onClick={handleSearchMusic} disabled={isSearchingMusic}
                style={{
                  background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)',
                  borderRadius: '8px', padding: '8px 14px', color: '#06b6d4',
                  fontSize: '12px', fontWeight: 700, cursor: isSearchingMusic ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                {isSearchingMusic ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                Search
              </button>
              <button type="button" onClick={handleResetMusicLibrary}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  borderRadius: '8px', padding: '8px 10px', color: 'var(--text-muted)',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                <RefreshCw size={12} /> Reset
              </button>
            </div>

            {/* Mood Filter Chips */}
            <div
              className={isMobile ? 'rail' : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: isMobile ? 'nowrap' : 'wrap' }}
            >
              {(MUSIC_MOODS || []).map(mood => (
                <button key={mood.id} type="button"
                  onClick={() => setMusicMoodFilter(mood.id)}
                  style={{
                    paddingTop: '4px', paddingBottom: '4px', paddingLeft: '10px', paddingRight: '10px',
                    borderRadius: '7px',
                    border: `1px solid ${musicMoodFilter === mood.id ? '#06b6d4' : 'var(--border-subtle)'}`,
                    background: musicMoodFilter === mood.id ? 'rgba(6,182,212,0.12)' : 'var(--bg-input)',
                    color: musicMoodFilter === mood.id ? '#22d3ee' : 'var(--text-muted)',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    whiteSpace: 'nowrap'
                  }}>
                  <span>{mood.icon}</span> {mood.label}
                </button>
              ))}
            </div>

            {/* Volume + Ducking */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={14} color="#06b6d4" />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Volume:</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#06b6d4', background: 'rgba(6,182,212,0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                    {Math.round(currentMusicVolume * 100)}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={currentMusicVolume}
                    onChange={(e) => handleMusicVolumeChange(e.target.value)}
                    style={{ width: '90px', accentColor: '#06b6d4', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[
                    { l: 'Mute', v: 0 },
                    { l: '10%', v: 0.10 },
                    { l: '20%', v: 0.20 },
                    { l: '35%', v: 0.35 },
                    { l: '50%', v: 0.50 }
                  ].map(p => (
                    <button
                      key={p.l}
                      type="button"
                      onClick={() => handleMusicVolumeChange(p.v)}
                      style={{
                        background: Math.abs(currentMusicVolume - p.v) < 0.03 ? 'rgba(6,182,212,0.25)' : 'var(--bg-input)',
                        border: `1px solid ${Math.abs(currentMusicVolume - p.v) < 0.03 ? '#06b6d4' : 'var(--border-subtle)'}`,
                        color: Math.abs(currentMusicVolume - p.v) < 0.03 ? '#06b6d4' : 'var(--text-muted)',
                        borderRadius: '4px', padding: '1px 5px', fontSize: '9.5px', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={14} color="#06b6d4" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '80px' }}>Ducking: -{duckingLevel}dB</span>
                <input type="range" min="0" max="30" step="2"
                  value={duckingLevel}
                  onChange={(e) => handleDuckingChange(e.target.value)}
                  title={`While a voiceover plays, music drops to ${Math.round(duckGain * 100)}% of its level`}
                  style={{ width: '90px', accentColor: '#06b6d4', cursor: 'pointer' }} />
                <span style={{
                  fontSize: '10px', fontWeight: 800, color: '#06b6d4',
                  background: 'rgba(6,182,212,0.15)', padding: '1px 6px', borderRadius: '4px'
                }}>
                  → {Math.round(currentMusicVolume * duckGain * 100)}% under voice
                </span>
              </div>
            </div>
          </div>

          {/* Music Track Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(min(${isMobile ? 220 : 280}px, 100%), 1fr))`,
            gap: '10px'
          }}>
            {filteredMusic.map((track) => {
              const isSelected = selectedMusicId === track.id;
              const isPlayingThis = playingMusicId === track.id;

              return (
                <div key={track.id}
                  onClick={() => onSelectMusic(track.id)}
                  style={{
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    border: `1.5px solid ${isSelected ? track.color : 'var(--border-subtle)'}`,
                    borderRadius: '14px', padding: '12px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    boxShadow: isSelected ? `0 0 14px ${track.color}30` : 'none',
                    transition: 'all 0.2s ease'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button type="button" onClick={(e) => handleTogglePlayMusic(e, track)}
                        style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: isPlayingThis ? track.color : 'var(--bg-input)',
                          color: isPlayingThis ? '#fff' : 'var(--text-primary)',
                          border: `1px solid ${isPlayingThis ? track.color : 'var(--border-subtle)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.15s ease'
                        }}>
                        {isPlayingThis ? <Square size={12} /> : <Play size={13} fill="currentColor" />}
                      </button>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {track.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {track.artist} • {track.genre}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: track.color, display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    <span>{track.moodLabel || track.mood}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{track.tempo}</span>
                      <span>•</span>
                      <span>{track.duration}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {track.tags && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {track.tags.slice(0, 4).map((tag, idx) => (
                        <span key={idx} style={{
                          fontSize: '9px', fontWeight: 700, padding: '2px 5px',
                          borderRadius: '4px', background: 'var(--bg-input)',
                          color: 'var(--text-muted)', border: '1px solid var(--border-subtle)'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredMusic.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Music size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>No tracks match this mood</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Try another mood filter or search</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Color Picker Helper Component
function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input type="color" value={value || '#FFFFFF'}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '26px', height: '22px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px', background: 'transparent',
            cursor: 'pointer', padding: 0
          }} />
        <span style={{ fontSize: '10px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{value || '#FFFFFF'}</span>
      </div>
    </div>
  );
}
