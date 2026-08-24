import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Flame, 
  Layers, 
  Volume2, 
  Clock, 
  FileText, 
  Check, 
  ArrowRight,
  Loader2,
  Film,
  Wand2,
  ChevronDown,
  ChevronUp,
  Zap,
  Tag,
  AlertTriangle,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
  Mic2,
  Type,
  Music,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Palette,
  Timer,
  ExternalLink,
  Radio,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { VOICES, VOICE_CATEGORIES, VOICE_ACCENTS } from '../../data/voices';
import { SUBTITLE_STYLES, SUBTITLE_FONTS, SUBTITLE_POSITIONS } from '../../data/subtitleStyles';
import { MUSIC_TRACKS, MUSIC_MOODS } from '../../data/musicTracks';

// Canonical Preset Definitions for Story Brief (Stage 1)
const STORY_PRESETS = [
  {
    id: 'title_only',
    label: 'Refine Title Only',
    mode: 'title_only',
    icon: '🔥',
    canonicalPrompt: 'Refine only the suggestedTitle of the story brief. Do not change viralHook or storyBrief.'
  },
  {
    id: 'hook_only',
    label: 'Refine Hook Only',
    mode: 'hook_only',
    icon: '⚡',
    canonicalPrompt: 'Refine only the viralHook (3-second hook) for maximum curiosity and retention. Do not change suggestedTitle or storyBrief.'
  },
  {
    id: 'brief_only',
    label: 'Refine Story Brief Only',
    mode: 'brief_only',
    icon: '📝',
    canonicalPrompt: 'Refine only the 5-act narrative storyBrief. Maintain the suggestedTitle and viralHook.'
  },
  {
    id: 'emotional',
    label: 'Make It More Emotional',
    mode: 'tone_shift',
    icon: '❤️',
    canonicalPrompt: 'Adjust the tone of the story brief to be deeply emotional, heartfelt, and resonant.'
  },
  {
    id: 'dramatic',
    label: 'Make It More Dramatic',
    mode: 'tone_shift',
    icon: '🎭',
    canonicalPrompt: 'Inject high tension, intense drama, and suspense throughout the story brief.'
  },
  {
    id: 'funnier',
    label: 'Make It Funnier',
    mode: 'tone_shift',
    icon: '😂',
    canonicalPrompt: 'Adjust the tone of the story brief to be witty, entertaining, comedic, and humorous.'
  },
  {
    id: 'simplify_lang',
    label: 'Simplify The Language',
    mode: 'language_shift',
    icon: '🗣️',
    canonicalPrompt: 'Simplify the vocabulary and language structure of the story brief so it is easy to understand for everyone.'
  },
  {
    id: 'full_story',
    label: 'Full Refine',
    mode: 'full',
    icon: '✨',
    canonicalPrompt: 'Perform a complete creative polish across title, 3-second hook, and 5-act narrative brief for peak viral retention.'
  }
];

// Canonical Preset Definitions for Screenplay (Stage 2 - 5 Scenes)
const SCREENPLAY_PRESETS = [
  {
    id: 'voiceover_only',
    label: 'Refine Voiceover Text Only',
    mode: 'voiceover_only',
    icon: '🎙️',
    canonicalPrompt: 'Refine only the voiceoverText of all 5 scenes. Do not change any videoPrompt.'
  },
  {
    id: 'visuals_only',
    label: 'Refine Visual Prompts Only',
    mode: 'visuals_only',
    icon: '🎨',
    canonicalPrompt: 'Refine only the videoPrompt visual prompts for all 5 scenes. Do not change the voiceoverText.'
  },
  {
    id: 'length_fix',
    label: 'Fix Voiceover Length Only',
    mode: 'length_fix',
    icon: '📏',
    canonicalPrompt: 'Strictly adjust the voiceoverText length across all 5 scenes to hit the exact 190-200 character target per scene.'
  },
  {
    id: 'cinematic_visuals',
    label: 'More Cinematic Visuals',
    mode: 'visual_polish',
    icon: '🎬',
    canonicalPrompt: 'Enhance the visualPrompts with 4K cinematic lighting, volumetric smoke, photorealistic camera angles, and dramatic color grading.'
  },
  {
    id: 'punchier_pace',
    label: 'Punchier Voiceover Pacing',
    mode: 'pace_boost',
    icon: '⚡',
    canonicalPrompt: 'Make the voiceover text faster, punchier, and full of high-energy pattern interrupts.'
  },
  {
    id: 'full_scenes',
    label: 'Full Polish (All 5 Scenes)',
    mode: 'full_screenplay',
    icon: '✨',
    canonicalPrompt: 'Perform a comprehensive polish of all 5 scenes: perfect 190-200 char voiceover text and ultra-detailed cinematic visual prompts.'
  }
];

const DURATION_OPTIONS = [
  { value: 5,  label: '5s' },
  { value: 10, label: '10s' },
  { value: 15, label: '15s (Scene Target)' },
  { value: 20, label: '20s' },
  { value: 30, label: '30s' }
];

export default function StoryApprovalCard({ 
  story, 
  scenes, 
  threadLanguage = 'English', 
  initialVoiceId = 'adam',
  initialSubtitleSettings = null,
  initialMusicId = 'mystery',
  initialMusicVolume = 0.2,
  onApprove, 
  onReject, 
  onRefine,
  isSubmitting = false 
}) {
  const [approvedState, setApprovedState] = useState(null);
  const [showAllScenes, setShowAllScenes] = useState(true);
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [selectedScenes, setSelectedScenes] = useState([]); // [1, 2, 3, 4, 5] for scene-specific
  const [isRefining, setIsRefining] = useState(false);

  // ─── AUDIOVISUAL CUSTOMIZATION STATE ─────────────────────────────
  const [liveVoices, setLiveVoices] = useState(VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState(() => story?.voiceId || initialVoiceId || 'adam');
  const [voiceCategoryFilter, setVoiceCategoryFilter] = useState('all');
  const [selectedSubtitleSettings, setSelectedSubtitleSettings] = useState(() => {
    return initialSubtitleSettings || {
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
      position: 'center-center',
      allCaps: true,
      maxWordsPerLine: 3
    };
  });
  const [selectedMusicId, setSelectedMusicId] = useState(() => story?.musicId || initialMusicId || 'mystery');
  const [musicVolume, setMusicVolume] = useState(() => initialMusicVolume ?? 0.2);
  const [duckingLevel, setDuckingLevel] = useState(18);
  const [musicMoodFilter, setMusicMoodFilter] = useState('all');

  const [activeMediaTab, setActiveMediaTab] = useState('voice'); // 'voice' | 'subtitles' | 'music'
  const [isMediaStudioOpen, setIsMediaStudioOpen] = useState(false);

  // Audio Playback states for Voice Previews
  const [playingVoiceSampleId, setPlayingVoiceSampleId] = useState(null);
  const [playingMusicId, setPlayingMusicId] = useState(null);

  // ─── 5-SCENE ADVANCED VOICE AUDITION & PLAYER STATE ──────────────
  const [sceneAudioMap, setSceneAudioMap] = useState({}); // { [cacheKey]: base64Audio }
  const [activePlayingIndex, setActivePlayingIndex] = useState(null); // null | 0..4 | 'all'
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [generatingSceneIndex, setGeneratingSceneIndex] = useState(null);
  const [sceneCurrentTime, setSceneCurrentTime] = useState({}); // { [sceneIdx]: number }
  const [sceneDuration, setSceneDuration] = useState({}); // { [sceneIdx]: number }
  const [sceneTargetDuration, setSceneTargetDuration] = useState({ 0: 15, 1: 15, 2: 15, 3: 15, 4: 15 });
  const [masterTargetDuration, setMasterTargetDuration] = useState(75);

  // Master Audition State
  const [isPlayingAllScenes, setIsPlayingAllScenes] = useState(false);
  const [allScenesProgress, setAllScenesProgress] = useState(0);
  const [masterCurrentTime, setMasterCurrentTime] = useState(0);
  const [masterTotalDuration, setMasterTotalDuration] = useState(75);

  // Subtitle real preview states
  const [isSubtitleRendering, setIsSubtitleRendering] = useState(false);
  const [subtitlePreviewVideoUrl, setSubtitlePreviewVideoUrl] = useState(null);
  const [subtitlePreviewError, setSubtitlePreviewError] = useState(null);

  const audioPlayerRef = useRef(null);
  const musicPlayerRef = useRef(null);

  useEffect(() => {
    setIsRefining(false);
  }, [story?.errorMessage, story?.storyBrief, story?.suggestedTitle, story?.scenes, isSubmitting]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      if (musicPlayerRef.current) musicPlayerRef.current.pause();
    };
  }, []);

  // Fetch live voices from ElevenLabs on mount
  useEffect(() => {
    fetch('/.netlify/functions/list-voices')
      .then(res => res.json())
      .then(data => {
        if (data.voices && Array.isArray(data.voices) && data.voices.length > 0) {
          const merged = data.voices.map(apiV => {
            const matchedStatic = VOICES.find(sv => 
              sv.elevenLabsId === apiV.voice_id || 
              sv.name.toLowerCase() === apiV.name.toLowerCase()
            );
            return {
              id: matchedStatic?.id || apiV.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              name: apiV.name,
              elevenLabsId: apiV.voice_id,
              gender: matchedStatic?.gender || apiV.gender || 'Unknown',
              accent: matchedStatic?.accent || 'american',
              flag: matchedStatic?.flag || apiV.accent || '🌍',
              age: matchedStatic?.age || 'Middle-Aged',
              category: matchedStatic?.category || 'conversational',
              badge: matchedStatic?.badge || '',
              tag: matchedStatic?.tag || apiV.category || 'AI Voice',
              tone: matchedStatic?.tone || apiV.description || 'Clear & Expressive',
              previewUrl: apiV.preview_url || matchedStatic?.previewUrl || null,
              sampleText: matchedStatic?.sampleText || 'Experience the future of viral AI short-form content creation.',
              color: matchedStatic?.color || '#6366f1',
              bestFor: matchedStatic?.bestFor || ['Shorts', 'Reels', 'Storytelling']
            };
          });
          VOICES.forEach(sv => {
            if (!merged.find(m => m.elevenLabsId === sv.elevenLabsId && m.id === sv.id)) {
              merged.push(sv);
            }
          });
          setLiveVoices(merged);
        }
      })
      .catch(() => {});
  }, []);

  if (!story) return null;

  const displayScenes = (scenes && Array.isArray(scenes) && scenes.length > 0) 
    ? scenes 
    : (story.scenes && Array.isArray(story.scenes) ? story.scenes : null);

  const isFinalScenesStage = !!displayScenes;

  // Refinement result metadata
  const changeSummary = story.changeSummary || null;
  const changedFields = Array.isArray(story.changedFields) ? story.changedFields : [];
  const changedScenes = Array.isArray(story.changedScenes) ? story.changedScenes : [];
  const refineFailed = story.refineFailed === true;
  const failReason = story.failReason || null;
  const refineRound = story.refineRound || 1;
  const errorMessage = story.errorMessage || null;

  const isFieldChanged = (fieldName) => {
    return changedFields.includes(fieldName) || 
           (fieldName === 'title' && (changedFields.includes('suggestedTitle') || changedFields.includes('title'))) ||
           (fieldName === 'viralHook' && (changedFields.includes('viralHook') || changedFields.includes('hook'))) ||
           (fieldName === 'storyBrief' && (changedFields.includes('storyBrief') || changedFields.includes('brief')));
  };

  const isSceneChanged = (sceneNum, sceneObj) => {
    return changedScenes.includes(sceneNum) || 
           changedScenes.includes(sceneNum - 1) || 
           sceneObj?.refined === true;
  };

  // Character count color helper for 190-200 target
  const getCharCountBadgeStyle = (charCount) => {
    if (charCount >= 190 && charCount <= 200) {
      return {
        color: '#10b981',
        background: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
        status: 'Optimal (190-200)'
      };
    } else if ((charCount >= 180 && charCount < 190) || (charCount > 200 && charCount <= 210)) {
      return {
        color: '#f59e0b',
        background: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
        status: 'Acceptable (180-210)'
      };
    } else {
      return {
        color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
        status: charCount < 180 ? 'Too Short (<180)' : 'Too Long (>210)'
      };
    }
  };

  // Format seconds to M:SS
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ─── AUDIO PLAYBACK HANDLERS ─────────────────────────────────────
  const handlePlayVoiceSample = (e, voice) => {
    e.stopPropagation();
    if (playingVoiceSampleId === voice.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      setPlayingVoiceSampleId(null);
      return;
    }

    if (audioPlayerRef.current) audioPlayerRef.current.pause();

    if (voice.previewUrl) {
      const audio = new Audio(voice.previewUrl);
      audioPlayerRef.current = audio;
      setPlayingVoiceSampleId(voice.id);
      audio.play().catch(() => setPlayingVoiceSampleId(null));
      audio.onended = () => setPlayingVoiceSampleId(null);
      audio.onerror = () => setPlayingVoiceSampleId(null);
    }
  };

  // Generate / Play Scene Audio with Scrubber Support
  const handleAuditionScene = async (sceneIndex, sceneText) => {
    const chosenVoice = liveVoices.find(v => v.id === selectedVoiceId) || liveVoices[0];
    const cacheKey = `${chosenVoice.elevenLabsId || chosenVoice.id}_${sceneIndex}_${sceneText}`;

    // If this scene is already playing, toggle pause/play
    if (activePlayingIndex === sceneIndex && audioPlayerRef.current) {
      if (audioPlayerRef.current.paused) {
        audioPlayerRef.current.play();
        setIsAudioPaused(false);
      } else {
        audioPlayerRef.current.pause();
        setIsAudioPaused(true);
      }
      return;
    }

    // Stop current audio if playing something else
    if (audioPlayerRef.current) audioPlayerRef.current.pause();

    const startAudioPlayback = (audioSrc) => {
      const audio = new Audio(audioSrc);
      audioPlayerRef.current = audio;
      setActivePlayingIndex(sceneIndex);
      setIsAudioPaused(false);

      audio.onloadedmetadata = () => {
        setSceneDuration(prev => ({ ...prev, [sceneIndex]: audio.duration }));
      };

      audio.ontimeupdate = () => {
        setSceneCurrentTime(prev => ({ ...prev, [sceneIndex]: audio.currentTime }));
      };

      audio.onended = () => {
        setActivePlayingIndex(null);
        setIsAudioPaused(false);
        setSceneCurrentTime(prev => ({ ...prev, [sceneIndex]: 0 }));
      };

      audio.play().catch(() => {
        setActivePlayingIndex(null);
        setIsAudioPaused(false);
      });
    };

    // Check Cache
    if (sceneAudioMap[cacheKey]) {
      startAudioPlayback(`data:audio/mpeg;base64,${sceneAudioMap[cacheKey]}`);
      return;
    }

    // Synthesize via ElevenLabs
    setGeneratingSceneIndex(sceneIndex);
    try {
      const res = await fetch('/.netlify/functions/preview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: chosenVoice.elevenLabsId || chosenVoice.id,
          text: sceneText
        })
      });

      const data = await res.json();
      if (data.success && data.audio) {
        setSceneAudioMap(prev => ({ ...prev, [cacheKey]: data.audio }));
        startAudioPlayback(`data:audio/mpeg;base64,${data.audio}`);
      }
    } catch (err) {
      console.warn('Scene TTS audition error:', err.message);
    } finally {
      setGeneratingSceneIndex(null);
    }
  };

  // Seek / Scrub Audio
  const handleSeekScene = (sceneIndex, newTime) => {
    if (activePlayingIndex === sceneIndex && audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = newTime;
      setSceneCurrentTime(prev => ({ ...prev, [sceneIndex]: newTime }));
    }
  };

  // Skip -5s or +5s
  const handleSkipScene = (sceneIndex, delta) => {
    if (activePlayingIndex === sceneIndex && audioPlayerRef.current) {
      const target = Math.max(0, Math.min(audioPlayerRef.current.duration || 15, audioPlayerRef.current.currentTime + delta));
      audioPlayerRef.current.currentTime = target;
      setSceneCurrentTime(prev => ({ ...prev, [sceneIndex]: target }));
    }
  };

  // Master 5-Scene Sequential Audition
  const handleAuditionAllScenes = async () => {
    if (!displayScenes || displayScenes.length === 0) return;
    if (isPlayingAllScenes) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      setIsPlayingAllScenes(false);
      setActivePlayingIndex(null);
      return;
    }

    setIsPlayingAllScenes(true);
    const chosenVoice = liveVoices.find(v => v.id === selectedVoiceId) || liveVoices[0];

    for (let i = 0; i < displayScenes.length; i++) {
      setAllScenesProgress(i + 1);
      setActivePlayingIndex(i);
      const text = displayScenes[i].voiceoverText;
      const cacheKey = `${chosenVoice.elevenLabsId || chosenVoice.id}_${i}_${text}`;

      let base64 = sceneAudioMap[cacheKey];
      if (!base64) {
        setGeneratingSceneIndex(i);
        try {
          const res = await fetch('/.netlify/functions/preview-voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              voiceId: chosenVoice.elevenLabsId || chosenVoice.id,
              text: text
            })
          });
          const data = await res.json();
          if (data.success && data.audio) {
            base64 = data.audio;
            setSceneAudioMap(prev => ({ ...prev, [cacheKey]: data.audio }));
          }
        } catch (e) {
          console.warn('Error synthesizing scene ' + (i + 1), e);
        } finally {
          setGeneratingSceneIndex(null);
        }
      }

      if (base64) {
        await new Promise((resolve) => {
          if (audioPlayerRef.current) audioPlayerRef.current.pause();
          const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
          audioPlayerRef.current = audio;
          
          audio.ontimeupdate = () => {
            setSceneCurrentTime(prev => ({ ...prev, [i]: audio.currentTime }));
          };
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
      }
    }

    setIsPlayingAllScenes(false);
    setActivePlayingIndex(null);
    setAllScenesProgress(0);
  };

  // Play background music track
  const handlePlayMusic = (e, track) => {
    e.stopPropagation();
    if (playingMusicId === track.id) {
      if (musicPlayerRef.current) {
        musicPlayerRef.current.pause();
        musicPlayerRef.current = null;
      }
      setPlayingMusicId(null);
      return;
    }

    if (musicPlayerRef.current) musicPlayerRef.current.pause();

    const audioUrl = track.previewUrl || track.audioUrl;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.volume = musicVolume;
      audio.crossOrigin = 'anonymous';
      musicPlayerRef.current = audio;
      setPlayingMusicId(track.id);
      audio.play().catch(() => setPlayingMusicId(null));
      audio.onended = () => setPlayingMusicId(null);
      audio.onerror = () => setPlayingMusicId(null);
    }
  };

  // Render Real Subtitle Preview Video
  const handleRenderSubtitlePreview = async () => {
    setIsSubtitleRendering(true);
    setSubtitlePreviewError(null);
    setSubtitlePreviewVideoUrl(null);

    const sampleText = displayScenes && displayScenes[0]?.voiceoverText
      ? displayScenes[0].voiceoverText.substring(0, 140)
      : (story.viralHook || 'Watch how these subtitles boost retention by 300%!');

    const chosenVoice = liveVoices.find(v => v.id === selectedVoiceId) || liveVoices[0];

    try {
      const res = await fetch('/.netlify/functions/preview-subtitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtitleSettings: selectedSubtitleSettings,
          text: sampleText,
          voiceId: chosenVoice.name || 'Adam'
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to initiate subtitle render');
      }

      if (data.videoUrl) {
        setSubtitlePreviewVideoUrl(data.videoUrl);
        return;
      }

      // If async rendering in progress, poll with GET endpoint
      if (data.project && data.apiKey) {
        const projectId = data.project;
        const apiKey = data.apiKey;
        const start = Date.now();

        while (Date.now() - start < 45000) {
          await new Promise(r => setTimeout(r, 2000));
          const pollRes = await fetch(`/.netlify/functions/preview-subtitle?project=${encodeURIComponent(projectId)}&apiKey=${encodeURIComponent(apiKey)}`);
          const pollData = await pollRes.json();
          if (pollData.success && pollData.videoUrl) {
            setSubtitlePreviewVideoUrl(pollData.videoUrl);
            return;
          }
          if (pollData.status === 'error') {
            throw new Error(pollData.error || 'Render failed on cloud engine');
          }
        }
        throw new Error('Subtitle render timed out. Please retry.');
      }
    } catch (err) {
      setSubtitlePreviewError(err.message || 'Error communicating with subtitle renderer');
    } finally {
      setIsSubtitleRendering(false);
    }
  };

  // Approve Story / Scenes with Audiovisual Settings
  const handleApprove = () => {
    audioEngine.playSfx('success');
    setApprovedState('approved');
    if (typeof onApprove === 'function') {
      const chosenVoice = liveVoices.find(v => v.id === selectedVoiceId) || liveVoices[0];
      const chosenMusic = MUSIC_TRACKS.find(m => m.id === selectedMusicId) || MUSIC_TRACKS[0];
      onApprove(story.approveUrl, {
        voiceId: selectedVoiceId,
        elevenLabsVoiceId: chosenVoice?.elevenLabsId || chosenVoice?.id || selectedVoiceId,
        subtitleSettings: selectedSubtitleSettings,
        musicId: selectedMusicId,
        musicTrackUrl: chosenMusic?.audioUrl || '',
        musicVolume: musicVolume
      });
    }
  };

  const handleCancel = () => {
    audioEngine.playSfx('click');
    setApprovedState('rejected');
    if (typeof onReject === 'function') {
      onReject(story.cancelUrl);
    }
  };

  const handleRefineSubmit = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!refineText.trim() && !selectedPresetId) return;

    audioEngine.playSfx('shimmer');
    setIsRefining(true);

    const preset = (isFinalScenesStage ? SCREENPLAY_PRESETS : STORY_PRESETS).find(p => p.id === selectedPresetId);
    let promptToSend = refineText.trim();
    let modeToSend = preset ? preset.mode : (isFinalScenesStage ? 'free_screenplay' : 'free_story');

    if (preset && !promptToSend) {
      promptToSend = preset.canonicalPrompt;
    } else if (preset && promptToSend) {
      promptToSend = `${preset.canonicalPrompt}\nUser custom note: ${promptToSend}`;
    }

    const action = isFinalScenesStage ? 'REFINE_SCENES' : 'REFINE_STORY';

    if (typeof onRefine === 'function') {
      onRefine({
        actionType: action,
        refinePrompt: promptToSend,
        refineMode: modeToSend,
        refineScenes: selectedScenes,
        refineRound: refineRound,
        approveUrl: story?.approveUrl || story?.resumeUrl
      });
    }
  };

  // Helper for duration status badge
  const getSceneDurationBadge = (sceneIdx) => {
    const actual = sceneDuration[sceneIdx];
    const target = sceneTargetDuration[sceneIdx] || 15;
    if (!actual) return null;
    const diff = actual - target;
    if (diff <= 0) {
      return { text: `${actual.toFixed(1)}s / ${target}s (Optimal Pace) ✅`, color: '#10b981' };
    } else if (diff <= 2) {
      return { text: `${actual.toFixed(1)}s / ${target}s (+${diff.toFixed(1)}s Pace) ⚠️`, color: '#f59e0b' };
    } else {
      return { text: `${actual.toFixed(1)}s / ${target}s (+${diff.toFixed(1)}s Over Limit) ❌`, color: '#ef4444' };
    }
  };

  const selectedVoiceObj = liveVoices.find(v => v.id === selectedVoiceId) || liveVoices[0];
  const selectedMusicObj = MUSIC_TRACKS.find(m => m.id === selectedMusicId) || MUSIC_TRACKS[0];

  return (
    <div className="saas-card" style={{
      background: 'var(--bg-card)',
      border: '1.5px solid var(--border-medium)',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: 'var(--shadow-card)',
      marginBottom: '28px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ─── 1. TOP HERO HEADER ─────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: isFinalScenesStage
              ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
              : 'linear-gradient(135deg, #6366f1, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.35)',
            flexShrink: 0
          }}>
            {isFinalScenesStage ? <Film size={20} /> : <Zap size={20} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: 0
              }}>
                {isFinalScenesStage ? 'Stage 2: 5-Scene Screenplay Review' : 'Stage 1: Viral Story Pitch Review'}
              </h2>
              <span className={`badge ${isFinalScenesStage ? 'badge-cyan' : 'badge-brand'}`} style={{ fontSize: '11px', fontWeight: 800 }}>
                {isFinalScenesStage ? '🎬 75s Video Pipeline' : '⚡ 2-Stage Approval'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {isFinalScenesStage
                ? 'Review 5 cinematic scenes, audition voices with scrubber, fine-tune typography & select BGM.'
                : 'Review 3-second hook & 5-act brief before generating screenplay.'}
            </p>
          </div>
        </div>

        {/* Badges / Platform metadata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '99px', padding: '4px 10px', fontSize: '11.5px', fontWeight: 800, color: '#10b981'
          }}>
            <Flame size={13} />
            <span>98% Viral Retention Score</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
            borderRadius: '99px', padding: '4px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)'
          }}>
            <Clock size={13} />
            <span>{isFinalScenesStage ? '75s • 5 Scenes' : '5-Act Story Brief'}</span>
          </div>
        </div>
      </div>

      {/* ─── 2. APPLIED AUDIOVISUAL CONFIGURATION PILL ───────────────── */}
      <div style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        padding: '10px 14px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <SlidersHorizontal size={13} color="var(--accent-primary)" />
            Applied Studio Settings:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '12px' }}>
            <span style={{
              background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)',
              padding: '2px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid rgba(99,102,241,0.25)'
            }}>
              🎙️ {selectedVoiceObj?.name} ({selectedVoiceObj?.flag || 'US'})
            </span>
            <span style={{
              background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b',
              padding: '2px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid rgba(245,158,11,0.25)'
            }}>
              ✨ {SUBTITLE_STYLES.find(s => s.id === selectedSubtitleSettings.presetId)?.name || 'Viral Subs'} ({selectedSubtitleSettings.fontFamily})
            </span>
            <span style={{
              background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4',
              padding: '2px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid rgba(6,182,212,0.25)'
            }}>
              🎵 {selectedMusicObj?.name} ({Math.round(musicVolume * 100)}% vol)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMediaStudioOpen(!isMediaStudioOpen)}
          style={{
            background: isMediaStudioOpen ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            padding: '5px 12px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: isMediaStudioOpen ? 'var(--accent-primary)' : 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease'
          }}
        >
          <Sliders size={12} />
          <span>{isMediaStudioOpen ? 'Hide Studio Hub' : 'Customize Voice / Subs / BGM'}</span>
          {isMediaStudioOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* ─── 3. INLINE AUDIOVISUAL STUDIO HUB (Expandable) ──────────── */}
      {isMediaStudioOpen && (
        <div style={{
          background: 'var(--bg-input)',
          border: '1.5px solid var(--border-medium)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-glow)'
        }}>
          {/* Hub Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setActiveMediaTab('voice')}
              style={{
                padding: '6px 14px', borderRadius: '8px',
                border: `1.5px solid ${activeMediaTab === 'voice' ? '#10b981' : 'var(--border-subtle)'}`,
                background: activeMediaTab === 'voice' ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)',
                color: activeMediaTab === 'voice' ? '#10b981' : 'var(--text-muted)',
                fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Mic2 size={13} />
              <span>1. Voice Matrix ({liveVoices.length} Voices)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMediaTab('subtitles')}
              style={{
                padding: '6px 14px', borderRadius: '8px',
                border: `1.5px solid ${activeMediaTab === 'subtitles' ? '#f59e0b' : 'var(--border-subtle)'}`,
                background: activeMediaTab === 'subtitles' ? 'rgba(245,158,11,0.15)' : 'var(--bg-card)',
                color: activeMediaTab === 'subtitles' ? '#f59e0b' : 'var(--text-muted)',
                fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Type size={13} />
              <span>2. Subtitle Styles</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMediaTab('music')}
              style={{
                padding: '6px 14px', borderRadius: '8px',
                border: `1px solid ${activeMediaTab === 'music' ? '#06b6d4' : 'var(--border-subtle)'}`,
                background: activeMediaTab === 'music' ? 'rgba(6,182,212,0.15)' : 'var(--bg-card)',
                color: activeMediaTab === 'music' ? '#06b6d4' : 'var(--text-muted)',
                fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Music size={13} />
              <span>3. Background Music (12 Tracks)</span>
            </button>
          </div>

          {/* TAB 1: VOICES */}
          {activeMediaTab === 'voice' && (
            <div>
              {/* Category Filter Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {VOICE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setVoiceCategoryFilter(cat.id)}
                    style={{
                      padding: '4px 10px', borderRadius: '6px',
                      border: `1px solid ${voiceCategoryFilter === cat.id ? '#6366f1' : 'var(--border-subtle)'}`,
                      background: voiceCategoryFilter === cat.id ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
                      color: voiceCategoryFilter === cat.id ? '#a5b4fc' : 'var(--text-muted)',
                      fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>

              {/* Voices Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '8px', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px'
              }}>
                {liveVoices
                  .filter(v => voiceCategoryFilter === 'all' || v.category === voiceCategoryFilter)
                  .map(voice => {
                    const isSelected = selectedVoiceId === voice.id;
                    const isPlaying = playingVoiceSampleId === voice.id;
                    return (
                      <div
                        key={voice.id}
                        onClick={() => setSelectedVoiceId(voice.id)}
                        style={{
                          background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                          border: `1.5px solid ${isSelected ? voice.color : 'var(--border-subtle)'}`,
                          borderRadius: '10px', padding: '10px', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', gap: '6px',
                          boxShadow: isSelected ? `0 0 12px ${voice.color}30` : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '8px',
                              background: `${voice.color}20`, color: voice.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 900, fontSize: '12px'
                            }}>
                              {voice.name[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                                {voice.name}
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                {voice.flag} • {voice.gender}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={(e) => handlePlayVoiceSample(e, voice)}
                              style={{
                                background: isPlaying ? voice.color : 'var(--bg-input)',
                                color: isPlaying ? '#fff' : 'var(--text-primary)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '6px', padding: '4px 8px',
                                fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '3px'
                              }}
                            >
                              {isPlaying ? <Square size={9} /> : <Play size={9} />}
                              <span>{isPlaying ? 'Stop' : 'Sample'}</span>
                            </button>
                            {isSelected && (
                              <div style={{
                                width: '18px', height: '18px', borderRadius: '50%',
                                background: voice.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <Check size={11} color="#fff" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: '10.5px', color: voice.color, fontWeight: 600 }}>{voice.tag}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 2: SUBTITLES */}
          {activeMediaTab === 'subtitles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Top YouTuber Preset Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
                {SUBTITLE_STYLES.map(preset => {
                  const isActive = selectedSubtitleSettings.presetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setSelectedSubtitleSettings(prev => ({
                          ...prev,
                          presetId: preset.id,
                          style: preset.style,
                          fontFamily: preset.fontFamily,
                          fontSize: preset.fontSize,
                          wordColor: preset.wordColor,
                          lineColor: preset.lineColor,
                          outlineColor: preset.outlineColor,
                          outlineWidth: preset.outlineWidth,
                          shadowColor: preset.shadowColor || '#000000',
                          boxColor: preset.boxColor || '',
                          position: preset.position,
                          allCaps: preset.allCaps,
                          maxWordsPerLine: preset.maxWordsPerLine || 3
                        }));
                      }}
                      style={{
                        background: isActive ? `${preset.color}14` : 'var(--bg-card)',
                        border: `1.5px solid ${isActive ? preset.color : 'var(--border-subtle)'}`,
                        borderRadius: '12px', padding: '12px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: '8px',
                        boxShadow: isActive ? `0 0 16px ${preset.color}30` : 'none',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '16px' }}>{preset.icon}</span>
                          <div>
                            <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)' }}>{preset.name}</div>
                            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Used by {preset.creator}</div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px',
                          background: `${preset.color}25`, color: preset.color
                        }}>
                          {preset.badge}
                        </span>
                      </div>

                      {/* Live Mini Preview */}
                      <div style={{
                        background: '#09090b', borderRadius: '8px', padding: '8px 10px',
                        textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        <span style={{
                          fontFamily: preset.fontFamily,
                          fontWeight: 900,
                          fontSize: '11px',
                          color: preset.wordColor,
                          textTransform: preset.allCaps ? 'uppercase' : 'none',
                          letterSpacing: '0.04em',
                          textShadow: `0 0 4px ${preset.outlineColor}, 0 2px 4px rgba(0,0,0,0.8)`,
                          background: preset.boxColor ? `${preset.boxColor}90` : 'transparent',
                          padding: preset.boxColor ? '2px 6px' : '0',
                          borderRadius: preset.boxColor ? '4px' : '0'
                        }}>
                          {preset.samplePreview}
                        </span>
                      </div>

                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                        {preset.description}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Advanced Subtitle Customization */}
              <div style={{
                background: 'var(--bg-card)', borderRadius: '12px', padding: '14px',
                border: '1px solid var(--border-subtle)', display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px'
              }}>
                <div>
                  <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Font Family</label>
                  <select
                    value={selectedSubtitleSettings.fontFamily}
                    onChange={e => setSelectedSubtitleSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '6px 8px', color: 'var(--text-primary)', fontSize: '11px', outline: 'none' }}
                  >
                    {SUBTITLE_FONTS.map(f => (
                      <option key={f.id} value={f.family}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Font Size</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{selectedSubtitleSettings.fontSize}px</span>
                  </div>
                  <input
                    type="range" min="56" max="100" step="2"
                    value={selectedSubtitleSettings.fontSize}
                    onChange={e => setSelectedSubtitleSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                    style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Screen Position</label>
                  <select
                    value={selectedSubtitleSettings.position}
                    onChange={e => setSelectedSubtitleSettings(prev => ({ ...prev, position: e.target.value }))}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '6px 8px', color: 'var(--text-primary)', fontSize: '11px', outline: 'none' }}
                  >
                    {SUBTITLE_POSITIONS.map(p => (
                      <option key={p.id} value={p.value}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Active Word Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="color"
                      value={selectedSubtitleSettings.wordColor || '#FFE600'}
                      onChange={e => setSelectedSubtitleSettings(prev => ({ ...prev, wordColor: e.target.value }))}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={selectedSubtitleSettings.wordColor || '#FFE600'}
                      onChange={e => setSelectedSubtitleSettings(prev => ({ ...prev, wordColor: e.target.value }))}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '5px 8px', color: 'var(--text-primary)', fontSize: '11px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Base Text Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="color"
                      value={selectedSubtitleSettings.lineColor || '#FFFFFF'}
                      onChange={e => setSelectedSubtitleSettings(prev => ({ ...prev, lineColor: e.target.value }))}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={selectedSubtitleSettings.lineColor || '#FFFFFF'}
                      onChange={e => setSelectedSubtitleSettings(prev => ({ ...prev, lineColor: e.target.value }))}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '5px 8px', color: 'var(--text-primary)', fontSize: '11px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Render Real Subtitle Preview Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleRenderSubtitlePreview}
                  disabled={isSubtitleRendering}
                  style={{
                    background: isSubtitleRendering ? 'rgba(245,158,11,0.1)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: 'none', borderRadius: '8px', padding: '8px 16px',
                    color: isSubtitleRendering ? '#f59e0b' : '#000',
                    fontSize: '11.5px', fontWeight: 800, cursor: isSubtitleRendering ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  {isSubtitleRendering ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="#000" />}
                  <span>{isSubtitleRendering ? 'Rendering via json2video...' : 'Render Live Subtitle Preview Video'}</span>
                </button>

                {subtitlePreviewVideoUrl && (
                  <a
                    href={subtitlePreviewVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 700 }}
                  >
                    <span>✓ Preview MP4 Ready (Open Video)</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BACKGROUND MUSIC */}
          {activeMediaTab === 'music' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Mood Filter + Volume */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  {MUSIC_MOODS.map(mood => (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => setMusicMoodFilter(mood.id)}
                      style={{
                        padding: '3px 8px', borderRadius: '6px',
                        border: `1px solid ${musicMoodFilter === mood.id ? '#06b6d4' : 'var(--border-subtle)'}`,
                        background: musicMoodFilter === mood.id ? 'rgba(6,182,212,0.12)' : 'var(--bg-card)',
                        color: musicMoodFilter === mood.id ? '#06b6d4' : 'var(--text-muted)',
                        fontSize: '10.5px', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {mood.icon} {mood.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Volume2 size={13} color="#06b6d4" />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Volume: {Math.round(musicVolume * 100)}%</span>
                  <input
                    type="range" min="0.05" max="0.5" step="0.05"
                    value={musicVolume}
                    onChange={e => setMusicVolume(parseFloat(e.target.value))}
                    style={{ width: '80px', accentColor: '#06b6d4', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Music Tracks Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px'
              }}>
                {MUSIC_TRACKS
                  .filter(t => musicMoodFilter === 'all' || t.mood === musicMoodFilter)
                  .map(track => {
                    const isSelected = selectedMusicId === track.id;
                    const isPlaying = playingMusicId === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => setSelectedMusicId(track.id)}
                        style={{
                          background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                          border: `1.5px solid ${isSelected ? track.color : 'var(--border-subtle)'}`,
                          borderRadius: '10px', padding: '10px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          boxShadow: isSelected ? `0 0 12px ${track.color}30` : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={(e) => handlePlayMusic(e, track)}
                            style={{
                              width: '28px', height: '28px', borderRadius: '7px',
                              background: isPlaying ? track.color : 'var(--bg-input)',
                              color: isPlaying ? '#fff' : 'var(--text-primary)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            {isPlaying ? <Square size={10} /> : <Play size={10} fill="currentColor" />}
                          </button>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>{track.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{track.genre} • {track.duration}</div>
                          </div>
                        </div>

                        {isSelected && (
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '50%',
                            background: track.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Check size={11} color="#fff" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 4. STAGE 1: STORY PITCH BRIEF ──────────────────────────── */}
      {!displayScenes && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {/* Suggested Title */}
          {story.suggestedTitle && (
            <div style={{
              background: 'var(--bg-input)', borderRadius: '16px', padding: '16px',
              border: isFieldChanged('title') ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
              boxShadow: isFieldChanged('title') ? '0 0 14px rgba(16,185,129,0.25)' : 'none'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Tag size={12} color="var(--accent-primary)" />
                Suggested YouTube Short Title:
                {isFieldChanged('title') && <span style={{ color: '#10b981', marginLeft: '6px' }}>✓ Refined</span>}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                "{story.suggestedTitle}"
              </div>
            </div>
          )}

          {/* 3-Second Pattern Interrupt Viral Hook */}
          {story.viralHook && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.08))',
              borderRadius: '16px', padding: '16px',
              border: isFieldChanged('viralHook') ? '1.5px solid #10b981' : '1.5px solid rgba(245, 158, 11, 0.35)'
            }}>
              <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Flame size={14} color="#ef4444" />
                3-Second Pattern Interrupt Hook:
                {isFieldChanged('viralHook') && <span style={{ color: '#10b981', marginLeft: '6px' }}>✓ Refined</span>}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                "{story.viralHook}"
              </div>
            </div>
          )}

          {/* 5-Act Narrative Brief */}
          {story.storyBrief && (
            <div style={{
              background: 'var(--bg-input)', borderRadius: '16px', padding: '16px',
              border: isFieldChanged('storyBrief') ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
              boxShadow: isFieldChanged('storyBrief') ? '0 0 14px rgba(16,185,129,0.25)' : 'none'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileText size={12} color="var(--accent-primary)" />
                5-Act Narrative Story Brief:
                {isFieldChanged('storyBrief') && <span style={{ color: '#10b981', marginLeft: '6px' }}>✓ Refined</span>}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                {story.storyBrief}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 5. STAGE 2: 5-SCENE MASTER SCREENPLAY ───────────────────── */}
      {displayScenes && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {/* Master Screenplay Audio Bar */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.12))',
            borderRadius: '16px',
            border: '1.5px solid rgba(99, 102, 241, 0.35)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                <Mic2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Master 5-Scene Voiceover Audition (75s Total Narration)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Synthesizes and auditions all 5 scenes back-to-back with <strong>{selectedVoiceObj?.name}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Target Duration for Master */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Timer size={13} color="var(--text-muted)" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target:</span>
                <select
                  value={masterTargetDuration}
                  onChange={e => setMasterTargetDuration(Number(e.target.value))}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    borderRadius: '6px', padding: '3px 8px', color: 'var(--text-primary)',
                    fontSize: '11px', outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value={60}>60s</option>
                  <option value={75}>75s (Standard)</option>
                  <option value={90}>90s</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAuditionAllScenes}
                style={{
                  background: isPlayingAllScenes ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  border: `1.5px solid ${isPlayingAllScenes ? '#ef4444' : 'transparent'}`,
                  borderRadius: '10px',
                  padding: '9px 18px',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isPlayingAllScenes ? (
                  <>
                    <Square size={13} fill="#fff" />
                    <span>Stop Master Audition (Scene {allScenesProgress}/5)</span>
                  </>
                ) : (
                  <>
                    <Play size={13} fill="#fff" />
                    <span>Audition All 5 Scenes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 5 Individual Scene Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {displayScenes.map((scene, idx) => {
              const sceneNum = idx + 1;
              const charCount = scene.voiceoverCharCount !== undefined ? scene.voiceoverCharCount : (scene.voiceoverText || '').length;
              const charBadge = getCharCountBadgeStyle(charCount);
              const sceneChanged = isSceneChanged(sceneNum, scene);
              const isPlayingThisScene = activePlayingIndex === idx;
              const isGeneratingThis = generatingSceneIndex === idx;
              const durationBadge = getSceneDurationBadge(idx);
              const currentSec = sceneCurrentTime[idx] || 0;
              const totalSec = sceneDuration[idx] || 15;
              const chosenVoice = liveVoices.find(v => v.id === selectedVoiceId) || liveVoices[0];
              const cacheKey = `${chosenVoice.elevenLabsId || chosenVoice.id}_${idx}_${scene.voiceoverText}`;
              const isCached = !!sceneAudioMap[cacheKey];

              return (
                <div
                  key={idx}
                  style={{
                    background: sceneChanged ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-input)',
                    borderRadius: '18px',
                    padding: '18px',
                    border: sceneChanged ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                    boxShadow: sceneChanged ? '0 0 16px rgba(16, 185, 129, 0.2)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Scene Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-brand" style={{ fontSize: '11.5px', fontWeight: 800 }}>
                        Scene {sceneNum} of 5 • {scene.duration || 15}s
                      </span>
                      {sceneChanged && (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '10.5px' }}>
                          ✓ Scene {sceneNum} Refined
                        </span>
                      )}
                    </div>

                    {/* Character Count UI */}
                    <div
                      title={`Target: 190-200 characters. Status: ${charBadge.status}`}
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: charBadge.color,
                        background: charBadge.background,
                        border: `1px solid ${charBadge.borderColor}`,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{charCount} / 190–200 chars</span>
                      <span style={{ fontSize: '9.5px', opacity: 0.85 }}>({charBadge.status})</span>
                    </div>
                  </div>

                  {/* Voiceover Text Quote */}
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    lineHeight: 1.55,
                    padding: '10px 14px',
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 800, marginRight: '6px' }}>🎙️ Voiceover:</span>
                    "{scene.voiceoverText}"
                  </div>

                  {/* ── ADVANCED AUDIO PLAYER WITH SCRUBBER & DURATION TESTER ── */}
                  <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    border: isPlayingThisScene ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    marginBottom: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      {/* Left: Playback Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Play / Pause Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleAuditionScene(idx, scene.voiceoverText)}
                          disabled={isGeneratingThis}
                          style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: isPlayingThisScene && !isAudioPaused
                              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                              : 'var(--bg-input)',
                            border: '1.5px solid var(--border-medium)',
                            color: '#fff', cursor: isGeneratingThis ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isGeneratingThis ? (
                            <Loader2 size={15} className="animate-spin" color="var(--accent-primary)" />
                          ) : isPlayingThisScene && !isAudioPaused ? (
                            <Pause size={14} fill="#fff" />
                          ) : (
                            <Play size={14} fill="var(--accent-primary)" color="var(--accent-primary)" />
                          )}
                        </button>

                        {/* Rewind 5s */}
                        <button
                          type="button"
                          onClick={() => handleSkipScene(idx, -5)}
                          disabled={!isPlayingThisScene}
                          title="Rewind 5s"
                          style={{
                            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                            borderRadius: '8px', padding: '6px 8px', color: 'var(--text-muted)',
                            cursor: isPlayingThisScene ? 'pointer' : 'default', display: 'flex', alignItems: 'center'
                          }}
                        >
                          <Rewind size={13} />
                        </button>

                        {/* Fast Forward 5s */}
                        <button
                          type="button"
                          onClick={() => handleSkipScene(idx, 5)}
                          disabled={!isPlayingThisScene}
                          title="Forward 5s"
                          style={{
                            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                            borderRadius: '8px', padding: '6px 8px', color: 'var(--text-muted)',
                            cursor: isPlayingThisScene ? 'pointer' : 'default', display: 'flex', alignItems: 'center'
                          }}
                        >
                          <FastForward size={13} />
                        </button>

                        <div style={{ fontSize: '11.5px', color: 'var(--text-primary)', fontWeight: 700, marginLeft: '4px' }}>
                          <span>{selectedVoiceObj?.name} Voiceover</span>
                          {isCached && (
                            <span style={{ fontSize: '10px', color: '#10b981', marginLeft: '6px', fontWeight: 600 }}>
                              ✓ Saved Audio
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Target Duration Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Timer size={12} color="var(--text-muted)" />
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Target:</span>
                          <select
                            value={sceneTargetDuration[idx] || 15}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setSceneTargetDuration(prev => ({ ...prev, [idx]: val }));
                            }}
                            style={{
                              background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                              borderRadius: '6px', padding: '2px 6px', color: 'var(--text-primary)',
                              fontSize: '10.5px', outline: 'none', cursor: 'pointer'
                            }}
                          >
                            {DURATION_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        {durationBadge && (
                          <div style={{
                            fontSize: '10.5px', fontWeight: 700, color: durationBadge.color,
                            padding: '2px 6px', borderRadius: '4px',
                            background: `${durationBadge.color}15`, border: `1px solid ${durationBadge.color}35`
                          }}>
                            {durationBadge.text}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scrubber Progress Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', minWidth: '32px', fontFamily: 'monospace' }}>
                        {formatTime(currentSec)}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={totalSec || 15}
                        step="0.1"
                        value={currentSec}
                        onChange={e => handleSeekScene(idx, parseFloat(e.target.value))}
                        style={{
                          flex: 1,
                          accentColor: 'var(--accent-primary)',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', minWidth: '32px', fontFamily: 'monospace' }}>
                        {formatTime(totalSec)}
                      </span>
                    </div>
                  </div>

                  {/* Visual Prompt Block */}
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-card)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    lineHeight: 1.5,
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <strong style={{ color: 'var(--accent-cyan)', marginRight: '6px' }}>🎨 Visual Prompt:</strong>
                    {scene.videoPrompt}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 6. AI AGENT REFINEMENT PANEL (Doctor Presets + Free Text) ─ */}
      <div style={{
        marginBottom: '20px',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        background: isRefineOpen ? 'var(--bg-input)' : 'transparent',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        <button
          type="button"
          onClick={() => setIsRefineOpen(!isRefineOpen)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: 'var(--accent-rose)',
            fontSize: '13px',
            fontWeight: 800
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wand2 size={15} />
            <span>
              {isFinalScenesStage ? '✍️ Refine 5-Scene Screenplay with AI Doctor' : '✍️ Refine Story Brief with AI Doctor'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isRefineOpen ? 'Close Refine Panel' : 'Presets & Custom Refinement'}
            </span>
            {isRefineOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {isRefineOpen && (
          <form onSubmit={handleRefineSubmit} style={{ padding: '0 16px 16px 16px' }}>
            {/* Presets Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '8px',
              marginBottom: '12px'
            }}>
              {(isFinalScenesStage ? SCREENPLAY_PRESETS : STORY_PRESETS).map(preset => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedPresetId(null);
                        setRefineText('');
                      } else {
                        setSelectedPresetId(preset.id);
                        setRefineText(preset.canonicalPrompt);
                      }
                    }}
                    style={{
                      background: isSelected ? 'rgba(236, 72, 153, 0.15)' : 'var(--bg-card)',
                      border: `1.5px solid ${isSelected ? '#ec4899' : 'var(--border-subtle)'}`,
                      borderRadius: '10px',
                      padding: '8px 10px',
                      color: isSelected ? '#ec4899' : 'var(--text-primary)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textAlign: 'left'
                    }}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Textarea */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <textarea
                value={refineText}
                onChange={e => setRefineText(e.target.value)}
                placeholder="Give specific creative direction to the AI Doctor (e.g. 'Make Scene 1 more mysterious and fix character count to 195')..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleRefineSubmit}
              disabled={isRefining || (!refineText.trim() && !selectedPresetId)}
              style={{
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 18px',
                color: '#fff',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: (isRefining || (!refineText.trim() && !selectedPresetId)) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isRefining ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>{isRefining ? 'AI Doctor Refining in n8n Cloud...' : 'Apply Refinements with AI Doctor'}</span>
            </button>
          </form>
        )}
      </div>

      {/* ─── 7. ACTION FOOTER ───────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '18px'
      }}>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting || approvedState !== null}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '10px 18px',
            color: 'var(--text-muted)',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <XCircle size={15} />
          <span>Cancel & Start Over</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting || approvedState !== null}
            style={{
              background: isFinalScenesStage
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              color: '#fff',
              fontSize: '13.5px',
              fontWeight: 900,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isFinalScenesStage
                ? '0 4px 20px rgba(16, 185, 129, 0.4)'
                : '0 4px 20px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isFinalScenesStage ? (
              <Film size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}
            <span>
              {isFinalScenesStage
                ? '🚀 Approve & Render 4K Video (All 5 Scenes)'
                : '🎬 Approve Story Brief & Generate 5 Scenes'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
