import React, { useState, useEffect } from 'react';
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
  Palette
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { VOICES } from '../../data/voices';
import { SUBTITLE_STYLES, SUBTITLE_FONTS, SUBTITLE_POSITIONS } from '../../data/subtitleStyles';
import { MUSIC_TRACKS } from '../../data/musicTracks';

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
    label: 'Make Visuals More Cinematic',
    mode: 'visuals_only',
    icon: '🎥',
    canonicalPrompt: 'Elevate the videoPrompt visual prompts across all scenes with cinematic 8k lighting, dynamic camera motion, and vivid atmosphere.'
  },
  {
    id: 'hook_scene',
    label: 'Strengthen The Hook Scene',
    mode: 'scene_specific',
    scenes: [1],
    icon: '🪝',
    canonicalPrompt: 'Strengthen Scene 1 (0-15s hook) voiceover and visual prompt for immediate pattern interrupt and retention.'
  },
  {
    id: 'full_scenes',
    label: 'Full Refine',
    mode: 'full',
    icon: '✨',
    canonicalPrompt: 'Perform a comprehensive full refinement of voiceoverText and videoPrompt across all 5 scenes.'
  }
];

export default function StoryApprovalCard({
  story,
  scenes,
  onApprove,
  onReject,
  onRefine,
  threadLanguage = 'English',
  isSubmitting = false
}) {
  const [approvedState, setApprovedState] = useState(null);
  const [showAllScenes, setShowAllScenes] = useState(true);
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [selectedScenes, setSelectedScenes] = useState([]); // [1, 2, 3, 4, 5] for scene-specific
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    setIsRefining(false);
  }, [story?.errorMessage, story?.storyBrief, story?.suggestedTitle, story?.scenes, isSubmitting]);

  if (!story) return null;

  const displayScenes = (scenes && Array.isArray(scenes) && scenes.length > 0) 
    ? scenes 
    : (story.scenes && Array.isArray(story.scenes) ? story.scenes : null);

  const isFinalScenesStage = !!displayScenes;

  // Refinement result metadata from n8n callback
  const changeSummary = story.changeSummary || null;
  const changedFields = Array.isArray(story.changedFields) ? story.changedFields : [];
  const changedScenes = Array.isArray(story.changedScenes) ? story.changedScenes : [];
  const refineFailed = story.refineFailed === true;
  const failReason = story.failReason || null;
  const refineRound = story.refineRound || 1;
  const errorMessage = story.errorMessage || null;

  // Helper to check if a field changed
  const isFieldChanged = (fieldName) => {
    return changedFields.includes(fieldName) || 
           (fieldName === 'title' && (changedFields.includes('suggestedTitle') || changedFields.includes('title'))) ||
           (fieldName === 'viralHook' && (changedFields.includes('viralHook') || changedFields.includes('hook'))) ||
           (fieldName === 'storyBrief' && (changedFields.includes('storyBrief') || changedFields.includes('brief')));
  };

  // Helper to check if a scene changed
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
        background: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
        status: 'Optimal (190-200)'
      };
    } else if ((charCount >= 180 && charCount < 190) || (charCount > 200 && charCount <= 210)) {
      return {
        color: '#f59e0b',
        background: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
        status: 'Acceptable (180-210)'
      };
    } else {
      return {
        color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
        status: charCount < 180 ? 'Too Short (<180)' : 'Too Long (>210)'
      };
    }
  };

  // ─── AUDIOVISUAL CUSTOMIZATION STATE (Stage 2) ───────────────────
  const [liveVoices, setLiveVoices] = useState(VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState(story?.voiceId || 'adam');
  const [selectedSubtitleSettings, setSelectedSubtitleSettings] = useState(() => {
    const base = SUBTITLE_STYLES[0];
    return {
      presetId: base.id,
      style: base.style,
      fontFamily: base.fontFamily,
      fontSize: base.fontSize,
      wordColor: base.wordColor,
      lineColor: base.lineColor,
      outlineColor: base.outlineColor,
      outlineWidth: base.outlineWidth,
      boxColor: base.boxColor || '',
      position: base.position,
      allCaps: base.allCaps
    };
  });
  const [selectedMusicId, setSelectedMusicId] = useState(story?.musicId || 'mystery');
  const [activeMediaTab, setActiveMediaTab] = useState('voice'); // 'voice' | 'subtitles' | 'music'
  const [isMediaStudioOpen, setIsMediaStudioOpen] = useState(true);

  // Audio Playback & TTS states
  const [playingVoiceSampleId, setPlayingVoiceSampleId] = useState(null);
  const [isVoiceAuditioning, setIsVoiceAuditioning] = useState(false);
  const [auditioningVoiceId, setAuditioningVoiceId] = useState(null);
  const [playingMusicId, setPlayingMusicId] = useState(null);
  const [musicVolume, setMusicVolume] = useState(0.2);

  // 5-Scene Individual & Batch Voiceover Audition State
  const [sceneAudioMap, setSceneAudioMap] = useState({}); // { [cacheKey]: base64Audio }
  const [playingSceneIndex, setPlayingSceneIndex] = useState(null);
  const [generatingSceneIndex, setGeneratingSceneIndex] = useState(null);
  const [isPlayingAllScenes, setIsPlayingAllScenes] = useState(false);
  const [allScenesProgress, setAllScenesProgress] = useState(0);

  // Subtitle real preview states
  const [isSubtitleRendering, setIsSubtitleRendering] = useState(false);
  const [subtitlePreviewVideoUrl, setSubtitlePreviewVideoUrl] = useState(null);
  const [subtitlePreviewError, setSubtitlePreviewError] = useState(null);

  const audioPlayerRef = React.useRef(null);
  const musicPlayerRef = React.useRef(null);

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
              gender: apiV.gender || matchedStatic?.gender || 'Unknown',
              flag: apiV.accent || matchedStatic?.flag || '🌍',
              tag: matchedStatic?.tag || apiV.category || 'AI Voice',
              previewUrl: apiV.preview_url || matchedStatic?.previewUrl || null,
              sampleText: matchedStatic?.sampleText || 'Experience the future of viral AI content creation.',
              color: matchedStatic?.color || '#6366f1'
            };
          });
          setLiveVoices(merged);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      if (musicPlayerRef.current) musicPlayerRef.current.pause();
    };
  }, []);

  // Play pre-recorded ElevenLabs voice sample
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

  // Generate real ElevenLabs TTS audio for any scene
  const handleAuditionScene = async (sceneIndex, sceneText) => {
    if (generatingSceneIndex !== null) return;
    const chosenVoice = liveVoices.find(v => v.id === selectedVoiceId) || liveVoices[0];
    const cacheKey = `${chosenVoice.elevenLabsId || chosenVoice.id}_${sceneIndex}_${sceneText}`;

    if (sceneAudioMap[cacheKey]) {
      if (playingSceneIndex === sceneIndex) {
        if (audioPlayerRef.current) audioPlayerRef.current.pause();
        setPlayingSceneIndex(null);
        return;
      }
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      const audio = new Audio(`data:audio/mpeg;base64,${sceneAudioMap[cacheKey]}`);
      audioPlayerRef.current = audio;
      setPlayingSceneIndex(sceneIndex);
      audio.play().catch(() => setPlayingSceneIndex(null));
      audio.onended = () => setPlayingSceneIndex(null);
      return;
    }

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
        if (audioPlayerRef.current) audioPlayerRef.current.pause();
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
        audioPlayerRef.current = audio;
        setPlayingSceneIndex(sceneIndex);
        audio.play().catch(() => setPlayingSceneIndex(null));
        audio.onended = () => setPlayingSceneIndex(null);
      }
    } catch (err) {
      console.warn('Scene TTS audition error:', err.message);
    } finally {
      setGeneratingSceneIndex(null);
    }
  };

  // Audition all 5 scenes sequentially
  const handleAuditionAllScenes = async () => {
    if (!displayScenes || displayScenes.length === 0) return;
    if (isPlayingAllScenes) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      setIsPlayingAllScenes(false);
      setPlayingSceneIndex(null);
      return;
    }

    setIsPlayingAllScenes(true);
    const chosenVoice = liveVoices.find(v => v.id === selectedVoiceId) || liveVoices[0];

    for (let i = 0; i < displayScenes.length; i++) {
      setAllScenesProgress(i + 1);
      setPlayingSceneIndex(i);
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
          audio.play().catch(() => resolve());
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
        });
      }
    }

    setIsPlayingAllScenes(false);
    setPlayingSceneIndex(null);
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
      musicPlayerRef.current = audio;
      setPlayingMusicId(track.id);
      audio.play().catch(() => setPlayingMusicId(null));
      audio.onended = () => setPlayingMusicId(null);
      audio.onerror = () => setPlayingMusicId(null);
    }
  };

  // Render real subtitle preview via json2video API
  const handleRenderSubtitlePreview = async () => {
    setIsSubtitleRendering(true);
    setSubtitlePreviewError(null);
    setSubtitlePreviewVideoUrl(null);

    const sampleText = displayScenes && displayScenes[0]?.voiceoverText
      ? displayScenes[0].voiceoverText.substring(0, 140)
      : 'This is how your subtitles will look in the final video.';

    const chosenVoice = VOICES.find(v => v.id === selectedVoiceId) || VOICES[0];

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
      if (data.success && data.videoUrl) {
        setSubtitlePreviewVideoUrl(data.videoUrl);
      } else {
        setSubtitlePreviewError(data.error || 'Failed to render preview');
      }
    } catch (err) {
      setSubtitlePreviewError(err.message || 'Network error');
    } finally {
      setIsSubtitleRendering(false);
    }
  };

  const handleApprove = () => {
    audioEngine.playSfx('success');
    setApprovedState('approved');
    if (typeof onApprove === 'function') {
      const chosenVoice = VOICES.find(v => v.id === selectedVoiceId) || VOICES[0];
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

  const handleReject = () => {
    audioEngine.playSfx('click');
    setApprovedState('rejected');
    if (typeof onReject === 'function') {
      onReject(story.cancelUrl || story.approveUrl);
    }
  };

  // Toggle scene selection for scene-specific refinement
  const toggleSceneSelect = (sceneNum) => {
    audioEngine.playSfx('click');
    setSelectedScenes(prev => {
      if (prev.includes(sceneNum)) {
        return prev.filter(n => n !== sceneNum);
      } else {
        return [...prev, sceneNum].sort((a, b) => a - b);
      }
    });
  };

  // Select/Unselect Preset
  const handleSelectPreset = (preset) => {
    audioEngine.playSfx('click');
    if (selectedPresetId === preset.id) {
      setSelectedPresetId(null);
      if (preset.mode === 'scene_specific') setSelectedScenes([]);
    } else {
      setSelectedPresetId(preset.id);
      if (preset.scenes) {
        setSelectedScenes(preset.scenes);
      } else if (preset.mode === 'scene_specific') {
        if (selectedScenes.length === 0) setSelectedScenes([1]);
      } else {
        setSelectedScenes([]);
      }
    }
  };

  const handleRefineSubmit = (e) => {
    if (e) e.preventDefault();
    if (isRefining) return;

    // Find active preset if selected
    const activePresetList = isFinalScenesStage ? SCREENPLAY_PRESETS : STORY_PRESETS;
    const activePreset = activePresetList.find(p => p.id === selectedPresetId);

    let refineMode = activePreset?.mode || (selectedScenes.length > 0 ? 'scene_specific' : 'full');
    let refineScenes = selectedScenes;
    let presetCanonicalSentence = activePreset?.canonicalPrompt || '';

    // If scenes are manually selected
    if (selectedScenes.length > 0 && refineMode !== 'scene_specific') {
      refineMode = 'scene_specific';
    }

    if (refineMode === 'scene_specific' && selectedScenes.length > 0 && !presetCanonicalSentence) {
      presetCanonicalSentence = `Refine only Scene ${selectedScenes.join(', ')}. Keep all other scenes completely unchanged.`;
    }

    const freeText = refineText.trim();

    // Build human-readable refinePrompt according to contract:
    // If user typed free text only: send free text.
    // If user only clicked a preset: send preset canonical sentence.
    // If user did both: send preset sentence + " Additional instruction from creator: " + free text.
    let finalRefinePrompt = '';
    if (presetCanonicalSentence && freeText) {
      finalRefinePrompt = `${presetCanonicalSentence} Additional instruction from creator: ${freeText}`;
    } else if (presetCanonicalSentence && !freeText) {
      finalRefinePrompt = presetCanonicalSentence;
    } else if (!presetCanonicalSentence && freeText) {
      finalRefinePrompt = freeText;
    }

    if (!finalRefinePrompt.trim()) return;

    audioEngine.playSfx('shimmer');
    setIsRefining(true);

    if (typeof onRefine === 'function') {
      onRefine({
        refinePrompt: finalRefinePrompt.trim(),
        refineMode,
        refineScenes: refineMode === 'scene_specific' ? refineScenes : [],
        actionType: isFinalScenesStage ? 'REFINE_SCENES' : 'REFINE_STORY',
        approveUrl: story?.approveUrl || story?.resumeUrl || story?.cancelUrl
      });
    }
  };

  return (
    <div className="saas-card animate-float" style={{
      maxWidth: '840px',
      margin: '0 auto 28px auto',
      padding: '24px',
      border: `2px solid ${isFinalScenesStage ? '#10b981' : 'var(--accent-primary)'}`,
      boxShadow: isFinalScenesStage ? '0 12px 40px rgba(16, 185, 129, 0.25)' : '0 12px 40px rgba(99, 102, 241, 0.25)',
      background: 'var(--bg-card)',
      borderRadius: '20px'
    }}>
      {/* ─── 0. REFINEMENT RESULT BANNERS ─────────────────────────────── */}
      {/* Case 0: Dispatch / Network Error Banner */}
      {errorMessage && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1.5px solid rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444', marginBottom: '2px' }}>
                Dispatch Notice
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {errorMessage}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsRefineOpen(true)}
            className="btn-outline"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.5)',
              color: '#ef4444',
              fontSize: '11.5px',
              padding: '4px 10px',
              flexShrink: 0,
              gap: '4px'
            }}
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Case A: Refinement Failure Banner */}
      {refineFailed && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1.5px solid rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444', marginBottom: '2px' }}>
                Refinement Constraints Not Met
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {failReason || 'The AI Doctor could not satisfy your exact constraints. Please adjust instructions and retry.'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsRefineOpen(true)}
            className="btn-outline"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.5)',
              color: '#ef4444',
              fontSize: '11.5px',
              padding: '4px 10px',
              flexShrink: 0,
              gap: '4px'
            }}
          >
            <RefreshCw size={12} />
            <span>Retry Refine</span>
          </button>
        </div>
      )}

      {/* Case B: Refinement Success / Change Summary Banner */}
      {!refineFailed && changeSummary && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Sparkles size={18} color="#10b981" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
                Refinement Applied (Round {refineRound})
              </span>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '10.5px' }}>
                ✓ Updated
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {changeSummary}
            </div>
          </div>
        </div>
      )}

      {/* ─── 1. TOP HEADER BANNER ─────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: isFinalScenesStage ? 'linear-gradient(135deg, #10b981, #38bdf8)' : 'var(--grad-gemini)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isFinalScenesStage ? <Film size={16} color="#ffffff" /> : <Sparkles size={16} color="#ffffff" />}
          </div>
          <div>
            <div className="font-display" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isFinalScenesStage ? '🎬 Final 5-Scene Production Screenplay Ready for Approval' : '⚡ AI Story Ready for Review & Approval'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isFinalScenesStage 
                ? 'Review 5 scene voiceovers (190-200 chars) & visual prompts • Approve or refine with presets below' 
                : 'Generated by n8n Strategy Engine • 75s (5 Acts) • Approve or refine with presets below'}
            </div>
          </div>
        </div>

        <span className={`badge ${isFinalScenesStage ? 'badge-cyan' : 'badge-brand'}`} style={{ fontSize: '11px' }}>
          {isFinalScenesStage ? '✓ 5 Final Scenes' : '⚡ 1-Tap Review'}
        </span>
      </div>

      {/* ─── 2. META SPECS GRID ───────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px',
        marginBottom: '16px'
      }}>
        <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Genre / Format</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {story.genre || story.category || 'Viral Short'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pacing & Structure</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
            5 Acts • 75s Total
          </div>
        </div>

        <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Language</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
            {story.language || threadLanguage || 'English'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Visual Style Hint</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
            {story.visualStyle || 'Cinematic'}
          </div>
        </div>
      </div>

      {/* ─── 3. SUGGESTED TITLE ──────────────────────────────────────── */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Suggested Video Title:
          </div>
          {isFieldChanged('title') && (
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '10px' }}>
              ✓ Refined
            </span>
          )}
        </div>
        <div style={{
          fontSize: '15px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          background: 'var(--bg-input)',
          padding: '10px 14px',
          borderRadius: '10px',
          border: isFieldChanged('title') ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
          boxShadow: isFieldChanged('title') ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease'
        }}>
          <span>🔥</span>
          <span>{story.suggestedTitle || story.title}</span>
        </div>
      </div>

      {/* ─── 4. VIRAL HOOK (First 3 Seconds) ─────────────────────────── */}
      {story.viralHook && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={12} /> Viral Hook (First 3 Seconds):
            </div>
            {isFieldChanged('viralHook') && (
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '10px' }}>
                ✓ Refined
              </span>
            )}
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            background: 'rgba(245, 158, 11, 0.08)',
            padding: '10px 14px',
            borderRadius: '10px',
            border: isFieldChanged('viralHook') ? '1.5px solid #10b981' : '1px solid rgba(245, 158, 11, 0.25)',
            boxShadow: isFieldChanged('viralHook') ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none',
            lineHeight: 1.5,
            transition: 'all 0.2s ease'
          }}>
            "{story.viralHook}"
          </div>
        </div>
      )}

      {/* ─── 5. SCENE CARDS VIEW (Stage 2) with 190-200 Char Count ───── */}
      {displayScenes && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} color="#10b981" />
              <span>Full 5-Scene Master Screenplay ({displayScenes.length} Scenes)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllScenes(!showAllScenes)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '11.5px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {showAllScenes ? 'Collapse' : 'Expand All'}
            </button>
          </div>

          {showAllScenes && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Master Full Screenplay Audition Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.15))',
                borderRadius: '14px',
                border: '1.5px solid rgba(99, 102, 241, 0.35)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                  }}>
                    <Mic2 size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                      Master Screenplay Voiceover Audio (75s • 5 Scenes)
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Audition all 5 scenes back-to-back with <strong>{liveVoices.find(v => v.id === selectedVoiceId)?.name || 'Adam'}</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAuditionAllScenes}
                  style={{
                    background: isPlayingAllScenes ? 'rgba(239, 68, 68, 0.25)' : 'linear-gradient(135deg, #6366f1, #ec4899)',
                    border: `1.5px solid ${isPlayingAllScenes ? '#ef4444' : 'rgba(99, 102, 241, 0.5)'}`,
                    borderRadius: '10px',
                    padding: '8px 18px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  {isPlayingAllScenes ? (
                    <>
                      <Square size={13} fill="#fff" />
                      <span>Stop Audition (Scene {allScenesProgress}/5)</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} fill="#fff" />
                      <span>Audition All 5 Scenes Voiceover</span>
                    </>
                  )}
                </button>
              </div>

              {displayScenes.map((s, idx) => {
                const sceneNum = idx + 1;
                const charCount = s.voiceoverCharCount !== undefined ? s.voiceoverCharCount : (s.voiceoverText || '').length;
                const charBadge = getCharCountBadgeStyle(charCount);
                const sceneChanged = isSceneChanged(sceneNum, s);

                return (
                  <div
                    key={idx}
                    style={{
                      background: sceneChanged ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-input)',
                      borderRadius: '14px',
                      padding: '16px',
                      border: sceneChanged ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                      boxShadow: sceneChanged ? '0 0 14px rgba(16, 185, 129, 0.2)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-brand" style={{ fontSize: '11.5px', fontWeight: 800 }}>
                          Scene {sceneNum} of 5 • {s.duration || 15}s
                        </span>
                        {sceneChanged && (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '10.5px' }}>
                            ✓ Scene {sceneNum} Refined
                          </span>
                        )}
                      </div>

                      {/* Character Count UI (Requirement 5) */}
                      <div 
                        title={`Target: 190-200 characters. Status: ${charBadge.status}`}
                        style={{
                          fontSize: '11.5px',
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
                        <span style={{ fontSize: '9px', opacity: 0.85 }}>({charBadge.status})</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.5 }}>
                      <strong>🎙️ Voiceover:</strong> "{s.voiceoverText}"
                    </div>

                    {/* Scene Voiceover Audition Bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      marginBottom: '10px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          Voiceover Audio:
                        </span>
                        <span style={{ fontSize: '11px', color: '#a5b4fc', fontWeight: 700 }}>
                          {liveVoices.find(v => v.id === selectedVoiceId)?.name || 'Adam'}
                        </span>
                        {playingSceneIndex === idx && (
                          <span style={{ fontSize: '10.5px', color: '#34d399', fontWeight: 700, marginLeft: '6px' }}>
                            ▶ Playing audio...
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAuditionScene(idx, s.voiceoverText)}
                        disabled={generatingSceneIndex === idx}
                        style={{
                          background: playingSceneIndex === idx 
                            ? 'rgba(239, 68, 68, 0.25)' 
                            : (generatingSceneIndex === idx ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)'),
                          border: `1px solid ${playingSceneIndex === idx ? '#ef4444' : '#34d39950'}`,
                          borderRadius: '8px',
                          padding: '5px 12px',
                          color: playingSceneIndex === idx ? '#ef4444' : '#34d399',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: generatingSceneIndex === idx ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        {generatingSceneIndex === idx ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Synthesizing ElevenLabs...</span>
                          </>
                        ) : playingSceneIndex === idx ? (
                          <>
                            <Square size={11} fill="#ef4444" />
                            <span>Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <Play size={11} fill="#34d399" />
                            <span>Audition Scene {sceneNum} Voice</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div style={{
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      lineHeight: 1.4
                    }}>
                      <strong style={{ color: 'var(--accent-cyan)' }}>🎨 Visual Prompt:</strong> {s.videoPrompt}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── 5.5 AUDIOVISUAL DESIGN STUDIO (Stage 2 Voice, Subtitles & BGM) ── */}
      {displayScenes && (
        <div style={{
          marginBottom: '20px',
          borderRadius: '16px',
          border: '1.5px solid rgba(99, 102, 241, 0.35)',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.45), rgba(15, 23, 42, 0.6))',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden'
        }}>
          {/* Header Bar */}
          <div
            onClick={() => setIsMediaStudioOpen(!isMediaStudioOpen)}
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderBottom: isMediaStudioOpen ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
              background: 'rgba(255, 255, 255, 0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Sparkles size={14} />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                  Audiovisual Design Studio
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  Audition voices, customize subtitles & select BGM before final render
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontSize: '10.5px' }}>
                🎙️ {VOICES.find(v => v.id === selectedVoiceId)?.name || selectedVoiceId} • ✨ {selectedSubtitleSettings.style} • 🎵 {selectedMusicId}
              </span>
              {isMediaStudioOpen ? <ChevronUp size={16} color="#a5b4fc" /> : <ChevronDown size={16} color="#a5b4fc" />}
            </div>
          </div>

          {isMediaStudioOpen && (
            <div style={{ padding: '16px' }}>
              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('voice')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${activeMediaTab === 'voice' ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`,
                    background: activeMediaTab === 'voice' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    color: activeMediaTab === 'voice' ? '#34d399' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Mic2 size={13} />
                  <span>ElevenLabs Voices</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMediaTab('subtitles')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${activeMediaTab === 'subtitles' ? '#fbbf24' : 'rgba(255, 255, 255, 0.08)'}`,
                    background: activeMediaTab === 'subtitles' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    color: activeMediaTab === 'subtitles' ? '#fbbf24' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Type size={13} />
                  <span>Subtitle Styles & Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMediaTab('music')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${activeMediaTab === 'music' ? '#67e8f9' : 'rgba(255, 255, 255, 0.08)'}`,
                    background: activeMediaTab === 'music' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    color: activeMediaTab === 'music' ? '#67e8f9' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Music size={13} />
                  <span>Background Music</span>
                </button>
              </div>

              {/* ─── TAB 1: ELEVENLABS VOICES ──────────────────────────── */}
              {activeMediaTab === 'voice' && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Select voice and click <strong>"Audition Scene 1"</strong> to hear real AI audio of your scene:</span>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>Active Voice: {VOICES.find(v => v.id === selectedVoiceId)?.name}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {VOICES.map((voice) => {
                      const isSelected = selectedVoiceId === voice.id;
                      const isPlayingThis = playingVoiceSampleId === voice.id;
                      const isAuditioningThis = auditioningVoiceId === voice.id;

                      return (
                        <div
                          key={voice.id}
                          onClick={() => setSelectedVoiceId(voice.id)}
                          style={{
                            background: isSelected ? 'rgba(30, 41, 69, 0.95)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1.5px solid ${isSelected ? voice.color : 'var(--border-subtle)'}`,
                            borderRadius: '10px',
                            padding: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            boxShadow: isSelected ? `0 0 14px ${voice.color}40` : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                background: `${voice.color}25`,
                                border: `1px solid ${voice.color}50`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '12px',
                                color: voice.color
                              }}>
                                {voice.name[0]}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#ffffff' }}>{voice.name}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{voice.flag}</span>
                                </div>
                                <div style={{ fontSize: '10.5px', color: voice.color }}>{voice.tag}</div>
                              </div>
                            </div>

                            {isSelected && (
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: voice.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={11} color="#000" strokeWidth={3} />
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={(e) => handlePlayVoiceSample(e, voice)}
                              style={{
                                flex: 1,
                                background: isPlayingThis ? voice.color : 'rgba(255, 255, 255, 0.08)',
                                color: isPlayingThis ? '#000000' : '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              {isPlayingThis ? <Square size={10} fill="#000" /> : <Volume2 size={11} />}
                              <span>{isPlayingThis ? 'Stop' : 'Sample'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleAuditionSceneVoice(e, voice)}
                              disabled={isVoiceAuditioning}
                              style={{
                                flex: 1.3,
                                background: isAuditioningThis ? `${voice.color}30` : 'rgba(16, 185, 129, 0.15)',
                                color: isAuditioningThis ? voice.color : '#34d399',
                                border: `1px solid ${isAuditioningThis ? voice.color : '#34d39950'}`,
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: isVoiceAuditioning ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              {isAuditioningThis ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                              <span>{isAuditioningThis ? 'Generating...' : 'Audition Scene 1'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── TAB 2: SUBTITLE STYLES & REAL PREVIEW ─────────────── */}
              {activeMediaTab === 'subtitles' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Pick a subtitle style, customize colors, and render a real video preview via json2video API:
                  </div>

                  {/* Preset Pills */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                    {SUBTITLE_STYLES.map((preset) => {
                      const isActive = selectedSubtitleSettings.presetId === preset.id || selectedSubtitleSettings.style === preset.style;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedSubtitleSettings({
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
                          })}
                          style={{
                            background: isActive ? `${preset.color}25` : 'rgba(255, 255, 255, 0.03)',
                            border: `1.5px solid ${isActive ? preset.color : 'var(--border-subtle)'}`,
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>{preset.icon}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: isActive ? preset.color : '#fff', textAlign: 'center' }}>
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Color & Font Controls */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '8px',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Font Family</label>
                      <select
                        value={selectedSubtitleSettings.fontFamily}
                        onChange={(e) => setSelectedSubtitleSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                        style={{ width: '100%', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '4px 6px', color: '#fff', fontSize: '11px', outline: 'none' }}
                      >
                        {SUBTITLE_FONTS.map(f => (
                          <option key={f.id} value={f.family} style={{ background: '#1a1a2e' }}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Word Highlight Color</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="color"
                          value={selectedSubtitleSettings.wordColor || '#FFFF00'}
                          onChange={(e) => setSelectedSubtitleSettings(prev => ({ ...prev, wordColor: e.target.value }))}
                          style={{ width: '28px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '10px', color: '#fff', fontFamily: 'monospace' }}>{selectedSubtitleSettings.wordColor}</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Line Text Color</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="color"
                          value={selectedSubtitleSettings.lineColor || '#FFFFFF'}
                          onChange={(e) => setSelectedSubtitleSettings(prev => ({ ...prev, lineColor: e.target.value }))}
                          style={{ width: '28px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '10px', color: '#fff', fontFamily: 'monospace' }}>{selectedSubtitleSettings.lineColor}</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Outline Color</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="color"
                          value={selectedSubtitleSettings.outlineColor || '#000000'}
                          onChange={(e) => setSelectedSubtitleSettings(prev => ({ ...prev, outlineColor: e.target.value }))}
                          style={{ width: '28px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '10px', color: '#fff', fontFamily: 'monospace' }}>{selectedSubtitleSettings.outlineColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Render Real Subtitle Preview Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleRenderSubtitlePreview}
                      disabled={isSubtitleRendering}
                      style={{
                        background: isSubtitleRendering ? 'rgba(245, 158, 11, 0.1)' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 88, 12, 0.25))',
                        border: '1.5px solid rgba(245, 158, 11, 0.5)',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        color: '#fbbf24',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: isSubtitleRendering ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isSubtitleRendering ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      <span>{isSubtitleRendering ? 'Rendering Real Video via json2video API...' : 'Generate Real Subtitle Preview'}</span>
                    </button>
                  </div>

                  {subtitlePreviewVideoUrl && (
                    <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1.5px solid rgba(245, 158, 11, 0.4)', background: '#000', maxWidth: '300px' }}>
                      <video src={subtitlePreviewVideoUrl} autoPlay loop muted playsInline style={{ width: '100%', display: 'block', maxHeight: '180px', objectFit: 'contain' }} />
                      <div style={{ padding: '4px 8px', fontSize: '9px', color: '#fbbf24', textAlign: 'center', background: 'rgba(0,0,0,0.5)' }}>
                        ✅ Rendered by json2video API
                      </div>
                    </div>
                  )}

                  {subtitlePreviewError && (
                    <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '11px' }}>
                      ⚠️ {subtitlePreviewError}
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB 3: BACKGROUND MUSIC ───────────────────────────── */}
              {activeMediaTab === 'music' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Audition and select background score for your video:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px' }}>Volume: {Math.round(musicVolume * 100)}%</span>
                      <input
                        type="range" min="0.05" max="0.5" step="0.05"
                        value={musicVolume}
                        onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                        style={{ width: '80px', accentColor: '#67e8f9', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {MUSIC_TRACKS.map((track) => {
                      const isSelected = selectedMusicId === track.id;
                      const isPlayingThis = playingMusicId === track.id;

                      return (
                        <div
                          key={track.id}
                          onClick={() => setSelectedMusicId(track.id)}
                          style={{
                            background: isSelected ? 'rgba(30, 41, 69, 0.95)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1.5px solid ${isSelected ? track.color : 'var(--border-subtle)'}`,
                            borderRadius: '10px',
                            padding: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? `0 0 14px ${track.color}35` : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={(e) => handlePlayMusic(e, track)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                background: isPlayingThis ? track.color : 'rgba(255, 255, 255, 0.08)',
                                color: isPlayingThis ? '#000' : '#fff',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              {isPlayingThis ? <Square size={10} fill="#000" /> : <Play size={11} fill="#fff" />}
                            </button>
                            <div>
                              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#fff' }}>{track.name}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{track.genre} • {track.tempo}</div>
                            </div>
                          </div>

                          {isSelected && (
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: track.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={10} color="#000" strokeWidth={3} />
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
        </div>
      )}

      {/* ─── 6. 5-ACT NARRATIVE BRIEF (Stage 1) ──────────────────────── */}
      {!displayScenes && story.storyBrief && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={12} /> 5-Act Narrative Brief:
            </div>
            {isFieldChanged('storyBrief') && (
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '10px' }}>
                ✓ Refined
              </span>
            )}
          </div>
          <div style={{
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-input)',
            padding: '12px 14px',
            borderRadius: '12px',
            border: isFieldChanged('storyBrief') ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
            boxShadow: isFieldChanged('storyBrief') ? '0 0 12px rgba(16, 185, 129, 0.25)' : 'none',
            whiteSpace: 'pre-line',
            lineHeight: 1.6,
            transition: 'all 0.2s ease'
          }}>
            {story.storyBrief}
          </div>
        </div>
      )}

      {/* ─── 7. INLINE AI AGENT REFINEMENT PANEL (Presets + Free Text) ─ */}
      <div style={{
        marginBottom: '16px',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle)',
        background: isRefineOpen ? 'rgba(236, 72, 153, 0.04)' : 'transparent',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        <button
          type="button"
          onClick={() => setIsRefineOpen(!isRefineOpen)}
          style={{
            width: '100%',
            padding: '11px 14px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: '#ec4899',
            fontSize: '13px',
            fontWeight: 700
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
              {isRefineOpen ? 'Close Panel' : 'Presets & Custom Text'}
            </span>
            {isRefineOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {isRefineOpen && (
          <form onSubmit={handleRefineSubmit} style={{ padding: '0 14px 14px 14px' }}>
            {/* Presets Header */}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sliders size={12} /> Refinement Presets:
            </div>

            {/* Presets Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {(isFinalScenesStage ? SCREENPLAY_PRESETS : STORY_PRESETS).map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'var(--bg-input)',
                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      border: `1.5px solid ${isSelected ? '#ec4899' : 'var(--border-subtle)'}`,
                      borderRadius: '99px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      padding: '5px 12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Multi-Scene Selection Buttons (Screenplay Stage Only) */}
            {isFinalScenesStage && (
              <div style={{
                marginBottom: '12px',
                padding: '10px 12px',
                background: 'var(--bg-input)',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                  🎯 Target Specific Scenes (Multi-Select):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((sceneNum) => {
                    const isTargeted = selectedScenes.includes(sceneNum);
                    return (
                      <button
                        key={sceneNum}
                        type="button"
                        onClick={() => toggleSceneSelect(sceneNum)}
                        style={{
                          background: isTargeted ? '#10b981' : 'transparent',
                          color: isTargeted ? '#ffffff' : 'var(--text-secondary)',
                          border: `1px solid ${isTargeted ? '#10b981' : 'var(--border-medium)'}`,
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isTargeted ? <CheckSquare size={13} /> : <Square size={13} />}
                        <span>Scene {sceneNum}</span>
                      </button>
                    );
                  })}
                  {selectedScenes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedScenes([])}
                      style={{
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: 'none',
                        fontSize: '11px',
                        cursor: 'pointer',
                        marginLeft: '4px',
                        textDecoration: 'underline'
                      }}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Free-Text Refinement Input Box (Always Available) */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>
                ✍️ Custom Instruction (Optional or Standalone):
              </div>
              <textarea
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder={isFinalScenesStage 
                  ? "Type custom instructions alone or add to selected preset (e.g. 'Make Scene 3 visual prompt an aerial drone camera shot and tighten scene 4 voiceover')..."
                  : "Type custom instructions alone or add to selected preset (e.g. 'Emphasize the secret revelation in act 4 and make the ending more emotional')..."
                }
                rows={2}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  lineHeight: 1.4,
                  resize: 'none',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {selectedPresetId || selectedScenes.length > 0 || refineText.trim() ? (
                  <span style={{ color: 'var(--text-primary)' }}>
                    Ready to send: <strong>{selectedPresetId || (selectedScenes.length > 0 ? `Scenes ${selectedScenes.join(', ')}` : 'Custom Text')}</strong>
                  </span>
                ) : (
                  <span>Select a preset above or type custom instructions</span>
                )}
              </div>

              <button
                type="submit"
                disabled={(!selectedPresetId && selectedScenes.length === 0 && !refineText.trim()) || isRefining}
                className="btn-glow"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  fontSize: '12.5px',
                  padding: '7px 18px',
                  gap: '6px',
                  opacity: (!selectedPresetId && selectedScenes.length === 0 && !refineText.trim()) || isRefining ? 0.5 : 1,
                  cursor: (!selectedPresetId && selectedScenes.length === 0 && !refineText.trim()) || isRefining ? 'not-allowed' : 'pointer'
                }}
              >
                {isRefining ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                <span>{isRefining ? 'Refining with AI Agent...' : 'Send Refine Instruction to n8n'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── 8. MAIN ACTION BUTTONS ──────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '16px'
      }}>
        <button
          type="button"
          onClick={handleReject}
          disabled={approvedState !== null || isSubmitting}
          className="btn-outline"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            fontSize: '13px',
            padding: '8px 18px',
            gap: '6px'
          }}
        >
          <XCircle size={15} />
          <span>Cancel & Terminate</span>
        </button>

        <button
          type="button"
          onClick={handleApprove}
          disabled={approvedState !== null || isSubmitting}
          className="btn-glow"
          style={{
            background: isFinalScenesStage ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--grad-primary)',
            fontSize: '13px',
            padding: '8px 22px',
            gap: '8px'
          }}
        >
          {approvedState === 'approved' ? (
            <>
              <Check size={16} />
              <span>{isFinalScenesStage ? 'Approved! Rendering Video...' : 'Approved! Generating Scenes...'}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>{isFinalScenesStage ? 'Approve 5 Scenes & Render Video' : 'Approve Story & Generate 5 Scenes'}</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
