import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, CheckCircle2, AlertCircle, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, ChevronRight, Mic, Type, Play,
  Square, XCircle, ExternalLink, Cpu, Brain,
  Clapperboard, Mic2, Video, RefreshCw, Film, ArrowRight,
  Sliders, Search, X, Sparkles, Eye, ShieldCheck
} from 'lucide-react';
import AppShell from '../components/Layout/AppShell';
import GenerationThinkingAnimation from '../components/Dashboard/GenerationThinkingAnimation';
import { audioEngine } from '../audio/audioEngine';
import { getAuthToken, openGoogleOAuthPopup } from '../utils/authClient';
import { VOICES, getVoiceById } from '../data/voices';
import { getMusicTrackById } from '../data/musicTracks';
import { useVideoSettings } from '../state/videoSettings';
import { useVoiceCatalog } from '../hooks/useVoiceCatalog';
import { useBreakpoint } from '../hooks/useMediaQuery';

const YouTubeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" fill="#ef4444" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#ffffff" />
  </svg>
);

// Exact speed range from StudioLab
const SPEED_MIN  = 1.10;
const SPEED_MAX  = 1.50;
const SPEED_DEF  = 1.10;
const SPEED_STEP = 0.05;

export const ACTIVE_TEMPLATES = [
  {
    id: 'world-mysteries',
    emoji: '🛸',
    title: 'World Mysteries & Paranormal',
    category: 'mysteries',
    label: 'World Mysteries',
    desc: 'Self-researches unrepeated paranormal mysteries, scripts 5 cinematic scenes, renders photorealistic AI video, and uploads directly to YouTube — zero manual review.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    demoImage: '/template-demo-phone.jpg',
    videoTitle: "The Bermuda Triangle's Darkest Secret",
    specs: '1080p Ultra HD · 9:16 Vertical · 5 Scenes',
    color: '#6366f1',
    aiBrain: 'Claude Haiku 4.5 & Gemini'
  },
  {
    id: 'last-24-hours',
    emoji: '⏳',
    title: 'Last 24 Hours [True Stories]',
    category: 'history',
    label: 'True Stories',
    desc: 'Counts down the poignant and dramatic final 24 hours of legendary figures, heroic sacrifices, and historic events with empathetic narration and emotional hooks.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    demoImage: '/template-last-24-hours.jpg',
    videoTitle: 'Princess Diana: The Final 24 Hours',
    specs: '1080p Ultra HD · 9:16 Vertical · 5 Scenes',
    color: '#f59e0b',
    aiBrain: 'Claude Haiku 4.5 & Gemini'
  },
  {
    id: '3am-horror',
    emoji: '👻',
    title: '3-AM Horror & Paranormal',
    category: 'psychology',
    label: 'Horror & Paranormal',
    desc: 'Bone-chilling psychological terror and terrifying 3 AM encounters. Maximum camera movement, eerie suspense, and dark sound design crafted for viral retention.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    demoImage: '/template-3am-horror.jpg',
    videoTitle: 'The Dyatlov Incident: 3 AM Anomaly',
    specs: '1080p Ultra HD · 9:16 Vertical · 5 Scenes',
    color: '#ef4444',
    aiBrain: 'Claude Haiku 4.5 & Gemini'
  }
];

export const UPCOMING_TEMPLATES = [
  { id: 'ancient-history', emoji: '🏛️', category: 'history', label: 'History & Lore', title: 'Ancient History & Lost Civilizations', desc: 'Deep-dives into forgotten dynasties, ancient monoliths, and lost technological wonders.', duration: '75s', scenes: '5 Scenes' },
  { id: 'dark-psychology', emoji: '🧠', category: 'psychology', label: 'Dark Psychology', title: 'Dark Psychology & Human Behavior', desc: 'Reveals behavioral quirks, subconscious micro-signals, and persuasion breakdowns.', duration: '60s', scenes: '4 Scenes' },
  { id: 'cosmic-space', emoji: '🌌', category: 'scifi', label: 'Space & Tech', title: 'Deep Space & Cosmic Wonders', desc: 'Explores black hole anomalies, quantum paradoxes, and deep cosmos discoveries.', duration: '75s', scenes: '5 Scenes' },
  { id: 'mythical-heists', emoji: '💎', category: 'mysteries', label: 'World Mysteries', title: 'Legendary Heists & Unsolved Enigmas', desc: 'Fast-paced breakdowns of impossible vaults, art heists, and unexplained escapes.', duration: '75s', scenes: '5 Scenes' }
];

export const CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'mysteries', label: 'World Mysteries' },
  { id: 'history', label: 'True Stories' },
  { id: 'psychology', label: 'Horror & Paranormal' },
  { id: 'scifi', label: 'Space & Tech' }
];

export default function TemplatesPage({
  user,
  currentRoutePath = 'templates',
  collapsed = false,
  onToggleCollapse,
  onNavigate
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [customizingId, setCustomizingId]   = useState(null); // id of template whose settings drawer is open
  const [previewTemplate, setPreviewTemplate] = useState(null); // template currently in preview modal
  const { isMobile, isTablet }              = useBreakpoint();

  // Per-template custom topics map
  const [customTopics, setCustomTopics]     = useState({
    'world-mysteries': '',
    'last-24-hours': '',
    '3am-horror': ''
  });

  const [launchingId, setLaunchingId]       = useState(null);
  const [errorMsg, setErrorMsg]             = useState(null);
  const [successInfo, setSuccessInfo]       = useState(null);

  // Generation & Cancel states
  const [isGenerating, setIsGenerating]                 = useState(false);
  const [generatingThreadId, setGeneratingThreadId]     = useState(null);
  const [generatingTemplateId, setGeneratingTemplateId] = useState(null);
  const [isCancelling, setIsCancelling]                 = useState(false);
  const [cancelNotice, setCancelNotice]                 = useState(null);
  const abortControllerRef                              = useRef(null);

  // Connect to shared video settings so selected voice/speed applies smoothly across Bang AI
  const { settings: videoSettings, updateSettings: updateVideoSettings } = useVideoSettings();
  useVoiceCatalog();

  const voiceId = videoSettings?.voiceId || 'adam';
  const voiceSpeed = typeof videoSettings?.voiceSpeed === 'number'
    ? Math.max(SPEED_MIN, Math.min(SPEED_MAX, videoSettings.voiceSpeed))
    : SPEED_DEF;

  const uid = user?.id || user?.userId || user?._id || '';
  const threadCacheKey = uid ? `shortsai_threads_${uid}` : 'shortsai_all_threads';

  const activeVoiceObj = getVoiceById(voiceId) || VOICES.find(v => v.id === voiceId || v.elevenLabsId === voiceId) || VOICES[0];
  const isCustomVoice = !VOICES.some(v => v.id === voiceId || v.elevenLabsId === voiceId);

  const generatingTpl = ACTIVE_TEMPLATES.find(t => t.id === generatingTemplateId) || ACTIVE_TEMPLATES[0];

  const handleVoiceChange = (newVal) => {
    if (newVal === '__open_studio__') {
      audioEngine.playSfx('click');
      if (typeof onNavigate === 'function') onNavigate('studio/voices');
      else window.location.hash = '#/studio/voices';
      return;
    }
    audioEngine.playSfx('click');
    const matched = getVoiceById(newVal) || VOICES.find(v => v.id === newVal || v.elevenLabsId === newVal);
    const chosenId = matched?.id || newVal;
    const chosenElId = matched?.elevenLabsId || (matched?.source === 'elevenlabs' ? matched.id : 'pNInz6obpgDQGcFmaJgB');
    if (typeof updateVideoSettings === 'function') {
      updateVideoSettings({
        voiceId: chosenId,
        elevenLabsVoiceId: chosenElId
      });
    }
  };

  const handleSpeedChange = (newVal) => {
    const clamped = Math.max(SPEED_MIN, Math.min(SPEED_MAX, Number(newVal) || SPEED_DEF));
    if (typeof updateVideoSettings === 'function') {
      updateVideoSettings({ voiceSpeed: clamped });
    }
  };

  // ── YouTube channels (same as ProfilePage) ──
  const [channels, setChannels]             = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState('');

  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) { setLoadingChannels(false); return; }
      try {
        const token = getAuthToken();
        const res  = await fetch('/.netlify/functions/google-oauth?action=channels', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data && Array.isArray(data.channels)) {
          setChannels(data.channels);
          const def = data.channels.find(c => c.isDefault) || data.channels[0];
          if (def?.channelId) setSelectedChannelId(def.channelId);
        }
      } catch (err) {
        console.error('[TemplatesPage] Error loading channels:', err);
      } finally {
        setLoadingChannels(false);
      }
    };
    fetchChannels();
  }, [user]);

  const selectedChannel = channels.find(c => c.channelId === selectedChannelId) || channels[0] || null;
  const isChannelTokenExpired = !!(selectedChannel && (selectedChannel.needsReconnect || selectedChannel.isTokenExpired));

  // Listen for OAuth completion from popup
  useEffect(() => {
    const handleAuthMessage = (event) => {
      if (event.data?.type === 'BANG_OAUTH_SUCCESS') {
        fetch('/.netlify/functions/google-oauth?action=channels')
          .then(res => res.json())
          .then(data => {
            if (data && Array.isArray(data.channels)) {
              setChannels(data.channels);
              setErrorMsg(null);
            }
          })
          .catch(() => {});
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  // Poll generation status
  useEffect(() => {
    if (!isGenerating || !generatingThreadId) return;

    let timer;
    let stopped = false;
    const pollStatus = async () => {
      if (stopped) return;
      try {
        const res = await fetch(`/.netlify/functions/story-approval?threadId=${encodeURIComponent(generatingThreadId)}&_t=${Date.now()}`);
        if (res.ok && !stopped) {
          const data = await res.json();
          if (data.status === 'CANCELLED') {
            setIsGenerating(false);
            setLaunchingId(null);
            setCancelNotice('Generation cancelled.');
            return;
          }
          if (data.status === 'COMPLETED' || data.videoUrl || data.story?.videoUrl) {
            setIsGenerating(false);
            setLaunchingId(null);
            audioEngine.playSfx('boom');
            const vUrl = data.videoUrl || data.story?.videoUrl || '';
            const ytUrl = data.youtubeUrl || data.story?.youtubeUrl || (data.videoId ? `https://youtube.com/shorts/${data.videoId}` : '');
            const currentTpl = ACTIVE_TEMPLATES.find(t => t.id === generatingTemplateId) || ACTIVE_TEMPLATES[0];
            const currentCustomTopic = (customTopics[generatingTemplateId] || '').trim();
            const vidTitle = data.title || data.story?.title || currentCustomTopic || currentTpl.title;

            try {
              const stored = JSON.parse(localStorage.getItem(threadCacheKey) || '[]');
              const updated = stored.map(t => {
                if ((t.threadId || t.id) === generatingThreadId) {
                  return {
                    ...t,
                    status: 'COMPLETED',
                    videoUrl: vUrl,
                    youtubeUrl: ytUrl,
                    videoId: data.videoId || data.story?.videoId,
                    title: vidTitle,
                    scenes: data.scenes || data.story?.scenes || t.scenes,
                    messages: [
                      ...(t.messages || []),
                      {
                        role: 'assistant',
                        content: ytUrl ? `🎉 **Video Uploaded to YouTube!**\n\n📺 ${ytUrl}` : `🎉 **Video Render Complete!**`
                      }
                    ]
                  };
                }
                return t;
              });
              localStorage.setItem(threadCacheKey, JSON.stringify(updated));
            } catch (e) {
              console.warn('[TemplatesPage] localStorage update error:', e);
            }

            setSuccessInfo({
              message: ytUrl ? '🎉 75s Video produced and uploaded to YouTube Shorts!' : '🎉 75s Video produced and rendered successfully!',
              threadId: generatingThreadId,
              videoUrl: vUrl,
              youtubeUrl: ytUrl,
              videoId: data.videoId || data.story?.videoId,
              title: vidTitle
            });
            return;
          }
        }
      } catch (err) {
        console.warn('[TemplatesPage] Polling warning:', err.message);
      }
      if (!stopped) {
        timer = setTimeout(pollStatus, 3500);
      }
    };

    timer = setTimeout(pollStatus, 3500);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [isGenerating, generatingThreadId, generatingTemplateId, customTopics]);

  // ── Launch handler ──
  const handleLaunchTemplate = async (templateId) => {
    audioEngine.playSfx('click');
    if (!user) { if (typeof onNavigate === 'function') onNavigate('login'); return; }

    if (isChannelTokenExpired) {
      audioEngine.playSfx('warning');
      setErrorMsg(`⚠️ YouTube Authorization Expired: The connection for "${selectedChannel?.title || selectedChannel?.channelTitle || 'your channel'}" has expired. Please click Reconnect before launching.`);
      return;
    }

    const targetTpl = ACTIVE_TEMPLATES.find(t => t.id === templateId) || ACTIVE_TEMPLATES[0];
    const targetTopic = (customTopics[templateId] || '').trim();
    const newThreadId = `thread-template-${templateId}-${Date.now()}`;
    const sessionId = `session-${Date.now()}`;

    setLaunchingId(templateId);
    setIsGenerating(true);
    setGeneratingThreadId(newThreadId);
    setGeneratingTemplateId(templateId);
    setIsCancelling(false);
    setCancelNotice(null);
    setErrorMsg(null);
    setSuccessInfo(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const token = getAuthToken() || '';
      const elevenLabsVoiceId = activeVoiceObj?.elevenLabsId || videoSettings?.elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJgB';
      const clampedSpeed = Math.max(SPEED_MIN, Math.min(SPEED_MAX, voiceSpeed));

      try {
        const provisional = {
          id: newThreadId,
          threadId: newThreadId,
          sessionId,
          templateId,
          title: targetTopic ? `${targetTpl.title}: ${targetTopic}` : `${targetTpl.title} [1-Click]`,
          rawUserInput: targetTopic || `${targetTpl.title} (Autonomous 75s)`,
          status: 'GENERATING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [
            {
              role: 'system',
              content: `1-Click Autonomous Generation started for template: ${targetTpl.title} [75s].`
            }
          ]
        };
        const stored = JSON.parse(localStorage.getItem(threadCacheKey) || '[]');
        localStorage.setItem(threadCacheKey, JSON.stringify([provisional, ...stored.filter(t => (t.threadId || t.id) !== newThreadId)]));
      } catch (e) {
        console.warn('[TemplatesPage] localStorage write error:', e);
      }

      const chosenMusic = getMusicTrackById(videoSettings?.musicId || 'mystery2');
      const res = await fetch('/.netlify/functions/generate-template', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({
          templateId,
          threadId: newThreadId,
          sessionId,
          selectedChannelId: selectedChannelId || undefined,
          token,
          prompt:           targetTopic,
          voiceId:          activeVoiceObj?.id || voiceId,
          elevenLabsVoiceId,
          voiceSpeed:       clampedSpeed,
          voiceVolume:      videoSettings?.voiceVolume ?? 1.0,
          subtitleSettings: videoSettings?.subtitleSettings || null,
          subtitleStyle:    videoSettings?.subtitleStyle || 'hormozi',
          musicId:          videoSettings?.musicId || 'mystery2',
          musicTrackUrl:    videoSettings?.musicTrackUrl || chosenMusic?.audioUrl || '',
          musicVolume:      videoSettings?.musicVolume ?? 0.08
        })
      });

      if (controller.signal.aborted) return;

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to dispatch template workflow');

      audioEngine.playSfx('success');
      setSuccessInfo({
        message: 'Autonomous pipeline dispatched! Producing video now...',
        threadId: data.threadId || newThreadId
      });
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        console.log('[TemplatesPage] Generation request aborted.');
        return;
      }
      console.error('[TemplatesPage] Launch error:', err);
      audioEngine.playSfx('error');
      setErrorMsg(err.message || 'Something went wrong launching this template.');
      setIsGenerating(false);
      setLaunchingId(null);
    }
  };

  // ── Cancel Handler ──
  const handleCancelTemplateGeneration = async () => {
    audioEngine.playSfx('click');
    setIsCancelling(true);

    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch (e) {}
    }

    const targetThreadId = generatingThreadId;

    if (targetThreadId) {
      try {
        const stored = JSON.parse(localStorage.getItem(threadCacheKey) || '[]');
        const updated = stored.map(t => {
          if ((t.threadId || t.id) === targetThreadId) {
            return {
              ...t,
              status: 'CANCELLED',
              errorMessage: 'Generation was cancelled by creator.',
              messages: [
                ...(t.messages || []),
                { role: 'assistant', content: '⏹️ Generation cancelled by creator from Templates.' }
              ]
            };
          }
          return t;
        });
        localStorage.setItem(threadCacheKey, JSON.stringify(updated));
      } catch (e) {
        console.warn('[TemplatesPage] Cancel localStorage error:', e);
      }
    }

    try {
      await fetch('/.netlify/functions/terminate-execution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: targetThreadId,
          reason: 'Creator clicked Cancel Generation from Templates'
        })
      });
    } catch (e) {
      console.warn('[TemplatesPage] terminate-execution call error:', e.message);
    }

    setIsGenerating(false);
    setLaunchingId(null);
    setIsCancelling(false);
    setSuccessInfo(null);
    setCancelNotice('Generation was successfully cancelled.');
    setTimeout(() => setCancelNotice(null), 5000);
  };

  // Step progression for template generation animation
  const templateSteps = [
    {
      icon: Cpu,
      color: generatingTpl.color,
      glow: `${generatingTpl.color}55`,
      label: 'Autonomous Cloud Dispatch',
      sub: `Connecting to autonomous pipeline for ${generatingTpl.label}`,
      logLines: [
        `POST /pipeline/template-${generatingTpl.id} → 200 OK`,
        `Execution: ${generatingThreadId || 'exec-pipeline'}`,
        'Channel Target: ' + (selectedChannel?.title || 'YouTube Channel')
      ]
    },
    {
      icon: Brain,
      color: '#38bdf8',
      glow: 'rgba(56,189,248,0.35)',
      label: `${generatingTpl.aiBrain}: Topic Engine`,
      sub: `Mining unrepeated ${generatingTpl.label.toLowerCase()} & high-retention angles`,
      logLines: [
        'Model: claude-haiku-4-5 / gemini',
        'Topic: ' + ((customTopics[generatingTpl.id] || '').trim() || generatingTpl.title),
        'Hook Retention: 98/100 Curiosity Score'
      ]
    },
    {
      icon: Clapperboard,
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.35)',
      label: '5-Beat Viral Screenplay Arc',
      sub: 'Scripting 5 scenes with 15s pacing, camera angles & suspense pacing',
      logLines: [
        'Pacing: 15s × 5 acts = 75s master short',
        'Scene 1: Cold Open Hook (0-15s)',
        'Scenes 2-5: Narrative escalation & climax'
      ]
    },
    {
      icon: Mic2,
      color: '#ec4899',
      glow: 'rgba(236,72,153,0.35)',
      label: 'Studio Narration & Sound Design',
      sub: `ElevenLabs voice (${activeVoiceObj?.name || 'Adam'} @ ${voiceSpeed.toFixed(2)}x) + ambient sound`,
      logLines: [
        `Voice: ${activeVoiceObj?.name || 'Adam'} (${activeVoiceObj?.gender || 'Studio'})`,
        `Speed: ${voiceSpeed.toFixed(2)}x`,
        'Audio Ducking: -18dB Dynamic Background Mix'
      ]
    },
    {
      icon: Video,
      color: '#10b981',
      glow: 'rgba(16,185,129,0.35)',
      label: '1080p Video Rendering & YouTube Auto-Upload',
      sub: 'Parallel scene generation, captions burn-in & direct channel delivery',
      logLines: [
        'Resolution: 1080×1920 (9:16 Vertical)',
        'Captions: Animated High-Retention Typography',
        'Upload: Direct to YouTube Shorts ✓'
      ]
    }
  ];

  // Filtering
  const filteredActive = ACTIVE_TEMPLATES.filter(tpl => {
    const matchCat = activeCategory === 'all' || tpl.category === activeCategory;
    const matchSearch = !searchQuery.trim() ||
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredUpcoming = UPCOMING_TEMPLATES.filter(tpl => {
    const matchCat = activeCategory === 'all' || tpl.category === activeCategory;
    const matchSearch = !searchQuery.trim() ||
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <AppShell user={user} currentRoutePath={currentRoutePath} onNavigate={onNavigate} collapsed={collapsed} onToggleCollapse={onToggleCollapse}>
      <div style={{
        flex: 1, width: '100%', minHeight: '100%',
        backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)',
        padding: isMobile ? '16px 12px 60px 12px' : '36px 32px 80px 32px',
        overflowY: isMobile ? 'visible' : 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

          {/* ── Top Header & Stats ── */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '99px',
                  background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                  fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)'
                }}>
                  <Sparkles size={11} color="var(--accent-primary, #ff4f00)" />
                  Autonomous Video Workflows (75s)
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  Autonomous Engine Connected
                </span>
              </div>

              {/* YouTube connection indicator in header */}
              {user && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '5px 12px', borderRadius: '99px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  fontSize: '12px', color: 'var(--text-secondary)'
                }}>
                  <YouTubeIcon size={15} />
                  {loadingChannels ? (
                    <span style={{ color: 'var(--text-muted)' }}>Loading YouTube...</span>
                  ) : channels.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedChannel?.title || 'YouTube Connected'}
                      </span>
                      {isChannelTokenExpired ? (
                        <button
                          type="button"
                          onClick={() => { audioEngine.playSfx('shimmer'); openGoogleOAuthPopup('templates'); }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#ef4444', padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Reconnect
                        </button>
                      ) : (
                        <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 600 }}>✓ Auto-Upload Active</span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { audioEngine.playSfx('click'); if (typeof onNavigate === 'function') onNavigate('profile'); }}
                      style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-primary, #ff4f00)', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      Connect YouTube Channel <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <h1 className="font-display" style={{
              fontSize: 'clamp(26px, 3.5vw, 34px)', fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '0 0 8px 0'
            }}>
              Autonomous AI Templates
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55, maxWidth: '680px' }}>
              Instant 1-click video creation. Researches compelling unrepeated stories, crafts high-retention 5-act screenplays, renders 1080p AI video scenes, and publishes directly to YouTube Shorts.
            </p>
          </div>

          {/* ── Search & Filter Controls ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '12px', marginBottom: isMobile ? '20px' : '28px',
            padding: isMobile ? '10px 12px' : '12px 16px', borderRadius: '14px',
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)'
          }}>
            {/* Category pills */}
            <div
              className={isMobile ? 'rail' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                flexWrap: isMobile ? 'nowrap' : 'wrap',
                overflowX: isMobile ? 'auto' : 'visible',
                width: isMobile ? '100%' : 'auto',
                paddingBottom: isMobile ? '4px' : '0'
              }}
            >
              {CATEGORIES.map(cat => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { audioEngine.playSfx('click'); setActiveCategory(cat.id); }}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--text-primary)' : 'transparent'}`,
                      background: active ? 'var(--text-primary)' : 'var(--bg-input)',
                      color: active ? 'var(--bg-app)' : 'var(--text-secondary)',
                      fontSize: '12px', fontWeight: active ? 700 : 500, transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap', flexShrink: 0
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: isMobile ? '100%' : 'auto', minWidth: isMobile ? '100%' : '220px', flex: isMobile ? '1 1 100%' : '0 1 280px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search templates or topics..."
                style={{
                  width: '100%', padding: '7px 28px 7px 30px', borderRadius: '8px',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-input)',
                  color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.15s ease'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary, #ff4f00)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* ── Alerts ── */}
          {cancelNotice && (
            <div style={{
              marginBottom: '24px', padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={16} />
                <span>{cancelNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setCancelNotice(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: '2px 6px' }}
              >
                Dismiss
              </button>
            </div>
          )}

          {errorMsg && (
            <div style={{
              marginBottom: '24px', padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
              >
                Dismiss
              </button>
            </div>
          )}

          {successInfo && (
            <div style={{
              marginBottom: '28px', padding: '16px 20px', borderRadius: '14px',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
              color: '#10b981', fontSize: '13.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} />
                <span style={{ fontWeight: 700 }}>{successInfo.message}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {successInfo.youtubeUrl && (
                  <a
                    href={successInfo.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
                      color: '#ef4444', padding: '6px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none'
                    }}
                  >
                    <YouTubeIcon size={14} />
                    <span>Watch Short</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                {successInfo.videoUrl && (
                  <a
                    href={successInfo.videoUrl}
                    download="viral-short-75s.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                      color: '#10b981', padding: '6px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, textDecoration: 'none'
                    }}
                  >
                    <span>Download MP4</span>
                  </a>
                )}
                {successInfo.threadId && (
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playSfx('click');
                      if (typeof onNavigate === 'function') onNavigate(`dashboard/t/${successInfo.threadId}`);
                      else if (typeof onNavigate === 'function') onNavigate('dashboard');
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'var(--accent-primary, #ff4f00)', border: 'none',
                      color: '#ffffff', padding: '6px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    <span>Open in Studio</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ═══ LIVE GENERATION ANIMATION ═══ */}
          {isGenerating && (
            <div style={{ marginBottom: '36px' }}>
              <GenerationThinkingAnimation
                prompt={(customTopics[generatingTpl.id] || '').trim() || `${generatingTpl.title} (Autonomous 75s Short)`}
                steps={templateSteps}
                stepDuration={5500}
                title={`Autonomous Pipeline: ${generatingTpl.title}`}
                subtitle={`${generatingTpl.aiBrain} · ${activeVoiceObj?.name || 'Adam'} voice (${voiceSpeed.toFixed(2)}x) · Cloud Pipeline`}
                badgeText="Template AI"
                model={generatingTpl.aiBrain}
                onCancel={handleCancelTemplateGeneration}
                isCancelling={isCancelling}
                extraActions={
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playSfx('click');
                      if (generatingThreadId && typeof onNavigate === 'function') {
                        onNavigate(`dashboard/t/${generatingThreadId}`);
                      } else if (typeof onNavigate === 'function') {
                        onNavigate('dashboard');
                      }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                      color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600,
                      padding: '6px 12px', borderRadius: '99px', cursor: 'pointer'
                    }}
                  >
                    <span>Open in Studio</span>
                    <ExternalLink size={12} />
                  </button>
                }
              />
            </div>
          )}

          {/* ═══ ACTIVE TEMPLATES CARD GALLERY ═══ */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Featured Production Pipelines ({filteredActive.length})
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                1-Click Ready · Full 75s Video Arc
              </span>
            </div>

            {filteredActive.length === 0 ? (
              <div style={{
                padding: '48px 24px', textAlign: 'center', background: 'var(--bg-card)',
                borderRadius: '16px', border: '1px dashed var(--border-subtle)'
              }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                  No active templates found matching "{searchQuery}".
                </p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  style={{
                    padding: '6px 16px', borderRadius: '8px', background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
                    fontSize: '12.5px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: isMobile ? '16px' : '22px'
              }}>
                {filteredActive.map(tpl => {
                  const isCurrentGenerating = isGenerating && generatingTemplateId === tpl.id;
                  const isCustomizing = customizingId === tpl.id;
                  const currentTopic = customTopics[tpl.id] || '';

                  return (
                    <div
                      key={tpl.id}
                      className="saas-card"
                      style={{
                        borderRadius: '18px',
                        border: isCurrentGenerating ? `1.5px solid ${tpl.color}` : '1px solid var(--border-subtle)',
                        background: 'var(--bg-card)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                        boxShadow: isCurrentGenerating ? `0 8px 30px ${tpl.color}25` : 'none',
                        position: 'relative'
                      }}
                    >
                      {/* ── Card Cover Header ── */}
                      <div
                        style={{
                          position: 'relative', width: '100%', height: '185px',
                          overflow: 'hidden', background: '#0a0d14', cursor: 'pointer'
                        }}
                        onClick={() => {
                          audioEngine.playSfx('click');
                          setPreviewTemplate(tpl);
                        }}
                      >
                        <img
                          src={tpl.demoImage}
                          alt={tpl.title}
                          style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            transition: 'transform 0.4s ease', display: 'block'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
                        />
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 100%)',
                          pointerEvents: 'none'
                        }} />

                        {/* Top Badges */}
                        <div style={{
                          position: 'absolute', top: '12px', left: '12px', right: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          pointerEvents: 'none'
                        }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff',
                            padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 700
                          }}>
                            <span>{tpl.emoji}</span>
                            <span>{tpl.label}</span>
                          </span>

                          <span style={{
                            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff',
                            padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600
                          }}>
                            {tpl.tagline}
                          </span>
                        </div>

                        {/* Centered Play overlay */}
                        <div
                          style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: '42px', height: '42px', borderRadius: '50%',
                            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                            border: '1.5px solid rgba(255,255,255,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s ease', color: '#ffffff'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
                            e.currentTarget.style.background = tpl.color;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.0)';
                            e.currentTarget.style.background = 'rgba(0,0,0,0.65)';
                          }}
                        >
                          <Play size={16} fill="#ffffff" style={{ marginLeft: '2px' }} />
                        </div>

                        {/* Bottom overlay inside image: Sample angle */}
                        <div style={{
                          position: 'absolute', bottom: '10px', left: '12px', right: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                          <span style={{
                            fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: 600,
                            textShadow: '0 1px 3px rgba(0,0,0,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            Sample: {tpl.videoTitle}
                          </span>
                          <span style={{
                            fontSize: '10px', color: 'rgba(255,255,255,0.7)',
                            background: 'rgba(0,0,0,0.5)', padding: '1px 6px', borderRadius: '4px'
                          }}>
                            Preview 👁️
                          </span>
                        </div>
                      </div>

                      {/* ── Card Content ── */}
                      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                        <div>
                          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
                            {tpl.title}
                          </h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, minHeight: '38px' }}>
                            {tpl.desc}
                          </p>
                        </div>

                        {/* Spec Pills */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                            padding: '3px 8px', borderRadius: '6px'
                          }}>
                            🧠 {tpl.aiBrain.split('&')[0].trim()}
                          </span>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                            padding: '3px 8px', borderRadius: '6px'
                          }}>
                            🎙️ {activeVoiceObj?.name || 'Adam'} ({voiceSpeed.toFixed(2)}x)
                          </span>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                            padding: '3px 8px', borderRadius: '6px'
                          }}>
                            📱 9:16 Shorts
                          </span>
                        </div>

                        {/* ── Customization Accordion ── */}
                        <div style={{ marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => {
                              audioEngine.playSfx('click');
                              setCustomizingId(isCustomizing ? null : tpl.id);
                            }}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '8px 12px', borderRadius: '10px',
                              background: isCustomizing ? 'var(--bg-elevated)' : 'var(--bg-input)',
                              border: '1px solid var(--border-subtle)',
                              color: isCustomizing ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Sliders size={13} color="var(--accent-primary, #ff4f00)" />
                              <span>{isCustomizing ? 'Hide Customization' : 'Customize Topic, Voice & Speed'}</span>
                            </span>
                            {isCustomizing ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {/* Expanded settings inside card */}
                          {isCustomizing && (
                            <div style={{
                              marginTop: '10px', padding: '12px', borderRadius: '12px',
                              background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                              display: 'flex', flexDirection: 'column', gap: '10px'
                            }}>
                              {/* Custom Topic Input */}
                              <div>
                                <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', textTransform: 'uppercase' }}>
                                  <Type size={11} /> Specific Topic (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={currentTopic}
                                  onChange={e => setCustomTopics(prev => ({ ...prev, [tpl.id]: e.target.value }))}
                                  placeholder={`e.g. ${tpl.videoTitle} (or auto-researched)`}
                                  style={{
                                    width: '100%', padding: '7px 10px', borderRadius: '7px',
                                    border: '1px solid var(--border-subtle)', background: 'var(--bg-card)',
                                    color: 'var(--text-primary)', fontSize: '12px', outline: 'none',
                                    boxSizing: 'border-box'
                                  }}
                                />
                              </div>

                              {/* Voice selector */}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                                    <Mic size={11} /> Voice
                                  </label>
                                  {isCustomVoice && (
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '1px 5px', borderRadius: '4px' }}>
                                      Studio Selected
                                    </span>
                                  )}
                                </div>
                                <div style={{ position: 'relative' }}>
                                  <select
                                    value={activeVoiceObj?.id || voiceId}
                                    aria-label="Narration voice"
                                    onChange={(e) => handleVoiceChange(e.target.value)}
                                    style={{
                                      width: '100%', padding: '7px 28px 7px 10px', borderRadius: '7px',
                                      border: '1px solid var(--border-subtle)', background: 'var(--bg-card)',
                                      color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600,
                                      outline: 'none', cursor: 'pointer', appearance: 'none'
                                    }}
                                  >
                                    {isCustomVoice && activeVoiceObj && (
                                      <option value={activeVoiceObj.id}>
                                        💎 {activeVoiceObj.name} ({activeVoiceObj.flag || activeVoiceObj.language || 'Premium'})
                                      </option>
                                    )}
                                    <optgroup label="⚡ Native ElevenLabs Voices">
                                      {VOICES.map((v) => (
                                        <option key={v.id} value={v.id}>
                                          🎙️ {v.name} ({v.flag || v.gender || 'Universal'})
                                        </option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="🌐 Full Voice Library">
                                      <option value="__open_studio__">🌐 Browse 9,650+ Voices in Studio...</option>
                                    </optgroup>
                                  </select>
                                  <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                </div>
                              </div>

                              {/* Speed Slider */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Narration Speed</span>
                                  <span style={{
                                    background: 'rgba(255, 79, 0, 0.12)', padding: '1px 6px', borderRadius: '4px',
                                    fontSize: '10px', fontWeight: 700, color: 'var(--accent-primary, #ff4f00)'
                                  }}>{voiceSpeed.toFixed(2)}x</span>
                                </div>
                                <input
                                  type="range"
                                  min={SPEED_MIN} max={SPEED_MAX} step={SPEED_STEP}
                                  value={voiceSpeed}
                                  onChange={e => handleSpeedChange(parseFloat(e.target.value))}
                                  style={{ width: '100%', accentColor: 'var(--accent-primary, #ff4f00)', cursor: 'pointer' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>{SPEED_MIN}x</span>
                                  <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>{SPEED_MAX}x</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── Card Footer Actions ── */}
                      <div style={{
                        padding: '14px 20px 18px 20px',
                        borderTop: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        {/* Auto-upload target indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                            <YouTubeIcon size={14} />
                            {selectedChannel?.title ? (
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {selectedChannel.title}
                              </span>
                            ) : (
                              <span>Direct to YouTube Shorts</span>
                            )}
                          </div>
                          {isChannelTokenExpired && (
                            <button
                              type="button"
                              onClick={() => { audioEngine.playSfx('shimmer'); openGoogleOAuthPopup('templates'); }}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#ef4444', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer'
                              }}
                            >
                              ⚡ Reconnect
                            </button>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {isCurrentGenerating ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={handleCancelTemplateGeneration}
                              disabled={isCancelling}
                              style={{
                                flex: 1, padding: '9px 14px', borderRadius: '10px',
                                border: '1.5px solid rgba(239, 68, 68, 0.6)',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444', fontSize: '12.5px', fontWeight: 700,
                                cursor: isCancelling ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                              }}
                            >
                              {isCancelling ? (
                                <><Loader2 size={13} className="animate-spin" /><span>Cancelling...</span></>
                              ) : (
                                <><Square size={12} fill="#ef4444" /><span>Cancel Generation</span></>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                audioEngine.playSfx('click');
                                if (generatingThreadId && typeof onNavigate === 'function') {
                                  onNavigate(`dashboard/t/${generatingThreadId}`);
                                } else if (typeof onNavigate === 'function') {
                                  onNavigate('dashboard');
                                }
                              }}
                              style={{
                                padding: '9px 12px', borderRadius: '10px',
                                border: '1px solid var(--border-medium)', background: 'var(--bg-input)',
                                color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                              }}
                              title="Open in Studio"
                            >
                              <ExternalLink size={13} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              disabled={isGenerating || launchingId === tpl.id}
                              onClick={() => handleLaunchTemplate(tpl.id)}
                              className="btn-glow"
                              style={{
                                flex: 1, padding: '10px 16px', borderRadius: '10px', border: 'none',
                                cursor: (isGenerating || launchingId === tpl.id) ? 'not-allowed' : 'pointer',
                                fontSize: '13px', fontWeight: 700, color: '#ffffff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                opacity: (isGenerating && !isCurrentGenerating) ? 0.6 : 1
                              }}
                            >
                              {launchingId === tpl.id ? (
                                <><Loader2 size={14} className="animate-spin" /><span>Dispatching...</span></>
                              ) : (
                                <><Zap size={14} fill="#ffffff" /><span>1-Click Generate (75s)</span></>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                audioEngine.playSfx('click');
                                setPreviewTemplate(tpl);
                              }}
                              style={{
                                padding: '10px 12px', borderRadius: '10px',
                                border: '1px solid var(--border-subtle)', background: 'var(--bg-input)',
                                color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                              title="Preview Template Mockup"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ UPCOMING TEMPLATES GALLERY ═══ */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 className="font-display" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                Upcoming Autonomous Niches ({filteredUpcoming.length})
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                High-converting niche templates queued for cloud pipeline release.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(270px, 100%), 1fr))', gap: '16px' }}>
              {filteredUpcoming.map(tpl => (
                <div
                  key={tpl.id}
                  className="saas-card"
                  style={{
                    padding: '20px', borderRadius: '16px',
                    border: '1px solid var(--border-subtle)', background: 'var(--bg-card)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                        background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                        padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <span>{tpl.emoji}</span>
                        <span>{tpl.label}</span>
                      </span>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)',
                        background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '99px'
                      }}>
                        Coming Soon
                      </span>
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                      {tpl.title}
                    </h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {tpl.desc}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {tpl.duration} · {tpl.scenes}
                    </span>
                    <button
                      disabled
                      style={{
                        padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)', color: 'var(--text-muted)',
                        fontSize: '11px', fontWeight: 600, cursor: 'not-allowed'
                      }}
                    >
                      Queued
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ═══ LIGHTWEIGHT PREVIEW MODAL ═══ */}
      {previewTemplate && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="saas-card"
            style={{
              position: 'relative', width: '100%', maxWidth: '640px',
              borderRadius: '20px', background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{previewTemplate.emoji}</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {previewTemplate.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Phone mockup + specs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '180px minmax(0, 1fr)',
              gap: isMobile ? '16px' : '24px',
              padding: isMobile ? '16px' : '24px',
              alignItems: 'center'
            }}>
              {/* Vertical Phone Screen */}
              <div style={{
                width: '180px', height: '320px', borderRadius: '24px',
                border: '3px solid var(--border-medium)', background: '#000',
                overflow: 'hidden', position: 'relative', margin: '0 auto',
                boxShadow: '0 16px 40px rgba(0,0,0,0.4)'
              }}>
                <img
                  src={previewTemplate.demoImage}
                  alt={previewTemplate.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '10px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))'
                }}>
                  <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#fff', marginBottom: '2px', lineHeight: 1.3 }}>
                    {previewTemplate.videoTitle}
                  </div>
                  <div style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.7)' }}>
                    {previewTemplate.specs}
                  </div>
                </div>
              </div>

              {/* Right column specs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, color: previewTemplate.color,
                    background: `${previewTemplate.color}18`, padding: '2px 8px', borderRadius: '6px',
                    display: 'inline-block', marginBottom: '6px'
                  }}>
                    {previewTemplate.label} · 75s Short Arc
                  </span>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                    {previewTemplate.desc}
                  </p>
                </div>

                <div style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <strong>Screenplay:</strong> 5 acts, 15s each (Hook → Build → Climax)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <strong>AI Engine:</strong> {previewTemplate.aiBrain}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <strong>Format:</strong> 1080×1920 (9:16) with Dynamic Captions
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => {
                      setPreviewTemplate(null);
                      handleLaunchTemplate(previewTemplate.id);
                    }}
                    className="btn-glow"
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: '10px', border: 'none',
                      color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <Zap size={14} fill="#ffffff" />
                    <span>Launch This Template Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
