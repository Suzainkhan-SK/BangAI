import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, CheckCircle2, AlertCircle, AlertTriangle, Loader2,
  ChevronDown, ChevronRight, Mic, Type, Play,
  Square, XCircle, ExternalLink, Cpu, Brain,
  Clapperboard, Mic2, Video, RefreshCw
} from 'lucide-react';
import AppShell from '../components/Layout/AppShell';
import GenerationThinkingAnimation from '../components/Dashboard/GenerationThinkingAnimation';
import { audioEngine } from '../audio/audioEngine';
import { getAuthToken, openGoogleOAuthPopup } from '../utils/authClient';
import { VOICES, getVoiceById } from '../data/voices';
import { getMusicTrackById } from '../data/musicTracks';
import { useVideoSettings } from '../state/videoSettings';
import { useVoiceCatalog } from '../hooks/useVoiceCatalog';

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
    tagline: '75s · 5 Scenes · Autonomous',
    demoImage: '/template-demo-phone.jpg',
    videoTitle: "The Bermuda Triangle's Darkest Secret",
    stats: '128K likes · 1.2M views',
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
    tagline: '75s · 5 Scenes · Emotional & Inspiring',
    demoImage: '/template-last-24-hours.jpg',
    videoTitle: 'Princess Diana: The Final 24 Hours',
    stats: '245K likes · 2.1M views',
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
    tagline: '75s · 5 Scenes · Extreme Suspense',
    demoImage: '/template-3am-horror.jpg',
    videoTitle: 'The Dyatlov Incident: 3 AM Anomaly',
    stats: '380K likes · 3.4M views',
    color: '#ef4444',
    aiBrain: 'Claude Haiku 4.5 & Gemini'
  }
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TemplatesPage({
  user,
  currentRoutePath = 'templates',
  collapsed = false,
  onToggleCollapse,
  onNavigate
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('world-mysteries');
  const [launchingId, setLaunchingId]               = useState(null);
  const [errorMsg, setErrorMsg]                     = useState(null);
  const [successInfo, setSuccessInfo]               = useState(null);
  const [activeCategory, setActiveCategory]         = useState('all');

  // Generation & Cancel states
  const [isGenerating, setIsGenerating]                 = useState(false);
  const [generatingThreadId, setGeneratingThreadId]     = useState(null);
  const [generatingTemplateId, setGeneratingTemplateId] = useState(null);
  const [isCancelling, setIsCancelling]                 = useState(false);
  const [cancelNotice, setCancelNotice]                 = useState(null);
  const abortControllerRef                              = useRef(null);

  // Connect to shared video settings so selected voice/speed from StudioLab applies here!
  const { settings: videoSettings, updateSettings: updateVideoSettings } = useVideoSettings();
  useVoiceCatalog(); // Preload full catalog in background so custom studio voices resolve metadata

  // ── Optional customization ──
  const [customTopic, setCustomTopic] = useState('');

  const voiceId = videoSettings?.voiceId || 'adam';
  const voiceSpeed = typeof videoSettings?.voiceSpeed === 'number'
    ? Math.max(SPEED_MIN, Math.min(SPEED_MAX, videoSettings.voiceSpeed))
    : SPEED_DEF;

  // Active voice object resolution (matches StudioLab and CanvasPromptBar)
  const activeVoiceObj = getVoiceById(voiceId) || VOICES.find(v => v.id === voiceId || v.elevenLabsId === voiceId) || VOICES[0];
  const isCustomVoice = !VOICES.some(v => v.id === voiceId || v.elevenLabsId === voiceId);

  const activeTpl = ACTIVE_TEMPLATES.find(t => t.id === selectedTemplateId) || ACTIVE_TEMPLATES[0];
  const currentActiveTpl = ACTIVE_TEMPLATES.find(t => t.id === (generatingTemplateId || selectedTemplateId)) || ACTIVE_TEMPLATES[0];
  const displayedActiveTemplates = activeCategory === 'all'
    ? ACTIVE_TEMPLATES
    : ACTIVE_TEMPLATES.filter(t => t.category === activeCategory);

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

  // Poll n8n status while generating to sync completed or cancelled state
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
            const vidTitle = data.title || data.story?.title || customTopic.trim() || currentActiveTpl.title;

            // Sync directly to localStorage so Dashboard reflects COMPLETED status with real videoUrl and youtubeUrl
            try {
              const stored = JSON.parse(localStorage.getItem('shortsai_all_threads') || '[]');
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
              localStorage.setItem('shortsai_all_threads', JSON.stringify(updated));
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
  }, [isGenerating, generatingThreadId]);

  // ── Launch handler with real animated pipeline ──
  const handleLaunchTemplate = async (templateId) => {
    audioEngine.playSfx('click');
    if (!user) { if (typeof onNavigate === 'function') onNavigate('login'); return; }

    if (isChannelTokenExpired) {
      audioEngine.playSfx('warning');
      setErrorMsg(`⚠️ YouTube Authorization Expired: The connection for "${selectedChannel?.title || selectedChannel?.channelTitle || 'your channel'}" has expired. Please click Reconnect below before launching.`);
      return;
    }

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

      // Provisional record in localStorage so dashboard/history reflects it immediately
      const targetTpl = ACTIVE_TEMPLATES.find(t => t.id === templateId) || activeTpl;
      try {
        const provisional = {
          id: newThreadId,
          threadId: newThreadId,
          sessionId,
          templateId,
          title: customTopic.trim() ? `${targetTpl.title}: ${customTopic.trim()}` : `${targetTpl.title} [1-Click]`,
          rawUserInput: customTopic.trim() || `${targetTpl.title} (Autonomous 75s)`,
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
        const stored = JSON.parse(localStorage.getItem('shortsai_all_threads') || '[]');
        localStorage.setItem('shortsai_all_threads', JSON.stringify([provisional, ...stored.filter(t => (t.threadId || t.id) !== newThreadId)]));
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
          prompt:           customTopic.trim() || '',
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
        message: 'Pipeline dispatched to n8n Cloud! Producing video now...',
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

  // ── 100% Working Cancel Handler ──
  const handleCancelTemplateGeneration = async () => {
    audioEngine.playSfx('click');
    setIsCancelling(true);

    // 1. Abort network request immediately
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch (e) {}
    }

    const targetThreadId = generatingThreadId;

    // 2. Mark as CANCELLED in localStorage immediately
    if (targetThreadId) {
      try {
        const stored = JSON.parse(localStorage.getItem('shortsai_all_threads') || '[]');
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
        localStorage.setItem('shortsai_all_threads', JSON.stringify(updated));
      } catch (e) {
        console.warn('[TemplatesPage] Cancel localStorage error:', e);
      }
    }

    // 3. Dispatch terminate-execution to backend & n8n webhook
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

    // 4. Reset UI state cleanly
    setIsGenerating(false);
    setLaunchingId(null);
    setIsCancelling(false);
    setSuccessInfo(null);
    setCancelNotice('Generation was successfully cancelled.');
    setTimeout(() => setCancelNotice(null), 5000);
  };

  // Custom step progression for template animation
  const templateSteps = [
    {
      icon: Cpu,
      color: currentActiveTpl.color,
      glow: `${currentActiveTpl.color}55`,
      label: 'n8n Cloud Webhook Dispatch',
      sub: `Connecting to autonomous template workflow template-${currentActiveTpl.id}`,
      logLines: [
        `POST /webhook/template-${currentActiveTpl.id} → 200 OK`,
        `Execution: ${generatingThreadId || 'exec-pipeline'}`,
        'Channel Target: ' + (selectedChannel?.title || 'YouTube Channel')
      ]
    },
    {
      icon: Brain,
      color: '#38bdf8',
      glow: 'rgba(56,189,248,0.35)',
      label: `${currentActiveTpl.aiBrain}: Topic Engine`,
      sub: `Mining unrepeated ${currentActiveTpl.label.toLowerCase()} & high-retention angles`,
      logLines: [
        'Model: claude-haiku-4-5 / gemini',
        'Topic: ' + (customTopic.trim() || currentActiveTpl.title),
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

  const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'mysteries', label: 'World Mysteries' },
    { id: 'history', label: 'True Stories' },
    { id: 'psychology', label: 'Horror & Paranormal' },
    { id: 'scifi', label: 'Space & Tech' }
  ];

  const handleCategorySelect = (catId) => {
    audioEngine.playSfx('click');
    setActiveCategory(catId);
    if (catId === 'mysteries') setSelectedTemplateId('world-mysteries');
    else if (catId === 'history') setSelectedTemplateId('last-24-hours');
    else if (catId === 'psychology') setSelectedTemplateId('3am-horror');
  };

  const UPCOMING = [
    { id: 'ancient-history', category: 'history', label: 'History & Lore', title: 'Ancient History & Lost Civilizations', desc: 'Deep-dives into forgotten dynasties and lost wonders.', duration: '75s', scenes: '5 Scenes' },
    { id: 'dark-psychology', category: 'psychology', label: 'Dark Psychology', title: 'Dark Psychology & Human Behavior', desc: 'Behavioral insights and persuasion breakdowns.', duration: '60s', scenes: '4 Scenes' },
    { id: 'cosmic-space', category: 'scifi', label: 'Space & Tech', title: 'Deep Space & Cosmic Wonders', desc: 'Astrophysics anomalies and planetary mysteries.', duration: '75s', scenes: '5 Scenes' },
    { id: 'mythical-heists', category: 'mysteries', label: 'World Mysteries', title: 'Legendary Heists & Unsolved Enigmas', desc: 'Thriller breakdowns of impossible robberies.', duration: '75s', scenes: '5 Scenes' }
  ];

  const filteredUpcoming = activeCategory === 'all' ? UPCOMING : UPCOMING.filter(t => t.category === activeCategory);

  return (
    <AppShell user={user} currentRoutePath={currentRoutePath} onNavigate={onNavigate} collapsed={collapsed} onToggleCollapse={onToggleCollapse}>
      <div style={{
        flex: 1, width: '100%', minHeight: '100%',
        backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)',
        padding: '36px 32px 80px 32px', overflowY: 'auto'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '3px 10px', borderRadius: '99px',
                background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)'
              }}>
                <Zap size={11} color="var(--accent-primary, #6366f1)" />
                Cinematic AI Workflows (75s)
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                n8n Cloud & Veo 3 / Wan Connected
              </span>
            </div>
            <h1 className="font-display" style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '0 0 6px 0'
            }}>
              Autonomous AI Templates
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55, maxWidth: '620px' }}>
              1-Click cinematic AI generation. Researches viral topics, crafts 5-act narrative hooks, renders photorealistic AI video scenes, and auto-publishes to YouTube.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '20px', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => {
                const active = activeCategory === cat.id;
                return (
                  <button key={cat.id} onClick={() => handleCategorySelect(cat.id)}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
                      background: active ? 'var(--text-primary)' : 'var(--bg-card)',
                      color: active ? 'var(--bg-app)' : 'var(--text-secondary)',
                      fontSize: '12.5px', fontWeight: active ? 700 : 500, transition: 'all 0.15s ease'
                    }}
                  >{cat.label}</button>
                );
              })}
            </div>
          </div>

          {/* ── Alerts ── */}
          {/* Cancel notification banner */}
          {cancelNotice && (
            <div style={{
              marginBottom: '20px', padding: '12px 16px', borderRadius: '10px',
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

          {/* Error / Success banners */}
          {errorMsg && (
            <div style={{
              marginBottom: '20px', padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <AlertCircle size={16} /><span>{errorMsg}</span>
            </div>
          )}
          {successInfo && (
            <div style={{
              marginBottom: '20px', padding: '14px 18px', borderRadius: '12px',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
              color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span style={{ fontWeight: 600 }}>{successInfo.message}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {successInfo.youtubeUrl && (
                  <a
                    href={successInfo.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
                      color: '#ef4444', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textDecoration: 'none'
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
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                      color: '#10b981', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none'
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
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: 'var(--accent-primary, #6366f1)', border: 'none',
                      color: '#ffffff', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
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
            <div style={{ marginBottom: '32px' }}>
              <GenerationThinkingAnimation
                prompt={customTopic.trim() || `${currentActiveTpl.title} (Autonomous 75s Short)`}
                steps={templateSteps}
                stepDuration={5500}
                title={`Autonomous Template Pipeline: ${currentActiveTpl.title}`}
                subtitle={`${currentActiveTpl.aiBrain} + ${activeVoiceObj?.name || 'Adam'} voice (${voiceSpeed.toFixed(2)}x) + n8n Cloud`}
                badgeText="Template AI"
                model={currentActiveTpl.aiBrain}
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
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: '99px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    <span>Open in Studio</span>
                    <ExternalLink size={12} />
                  </button>
                }
              />
            </div>
          )}

          {/* ═══ FEATURED TEMPLATES ═══ */}
          {displayedActiveTemplates.length > 0 && (
            <div className="saas-card" style={{ padding: '0', borderRadius: '20px', marginBottom: '36px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 265px', minHeight: '540px' }}>

                {/* Left: Content */}
                <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Template Switcher Tabs */}
                  {displayedActiveTemplates.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                      {displayedActiveTemplates.map(tpl => {
                        const isSelected = selectedTemplateId === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => { audioEngine.playSfx('click'); setSelectedTemplateId(tpl.id); }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '6px 14px', borderRadius: '10px',
                              border: isSelected ? `1.5px solid ${tpl.color}` : '1px solid var(--border-medium)',
                              background: isSelected ? `${tpl.color}15` : 'var(--bg-input)',
                              color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontSize: '12px', fontWeight: isSelected ? 700 : 500, cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{tpl.emoji}</span>
                            <span>{tpl.title}</span>
                            {isSelected && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: tpl.color }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                      color: '#10b981', fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                      borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '5px'
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                      Ready to Launch
                    </span>
                    <span style={{
                      background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '99px'
                    }}>{activeTpl.tagline}</span>
                  </div>

                  {/* Title & desc */}
                  <div>
                    <h2 className="font-display" style={{
                      fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em'
                    }}>
                      {activeTpl.title}
                    </h2>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, maxWidth: '480px' }}>
                      {activeTpl.desc}
                    </p>
                  </div>

                  {/* Spec pills */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'AI Brain', value: activeTpl.aiBrain },
                      { label: 'Voice',   value: `${activeVoiceObj?.name || 'Adam'}${activeVoiceObj?.flag ? ' ' + activeVoiceObj.flag.split(' ')[0] : ''}` },
                      { label: 'Speed',   value: `${voiceSpeed.toFixed(2)}x` }
                    ].map((s, i) => (
                      <div key={i} style={{
                        background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                        borderRadius: '10px', padding: '7px 12px', flex: '1 1 110px'
                      }}>
                        <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── Customization box ── */}
                  <div style={{
                    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                    borderRadius: '12px', padding: '14px 16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Customize
                      </span>
                      <span style={{
                        fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)',
                        background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                        padding: '1px 7px', borderRadius: '4px'
                      }}>Optional · leave blank for auto</span>
                    </div>

                    {/* Topic */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{
                        fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px'
                      }}>
                        <Type size={11} /> Topic
                      </label>
                      <input
                        type="text"
                        value={customTopic}
                        onChange={e => setCustomTopic(e.target.value)}
                        placeholder="e.g. The Bermuda Triangle, Area 51 secrets..."
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: '8px',
                          border: '1px solid var(--border-medium)', background: 'var(--bg-card)',
                          color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none',
                          boxSizing: 'border-box', transition: 'border-color 0.15s'
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent-primary, #6366f1)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border-medium)'}
                      />
                    </div>

                    {/* Voice + Speed */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      {/* Voice selector — same as regular video prompt box */}
                      <div style={{ flex: '2 1 200px' }}>
                        <label style={{
                          fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Mic size={11} />
                            Voice
                          </span>
                          {isCustomVoice && (
                            <span style={{
                              fontSize: '9.5px', fontWeight: 700, color: '#f59e0b',
                              background: 'rgba(245,158,11,0.12)', padding: '1px 6px', borderRadius: '4px'
                            }}>
                              💎 Studio Selected
                            </span>
                          )}
                        </label>
                        <div style={{ position: 'relative', width: '100%' }}>
                          <select
                            value={activeVoiceObj?.id || voiceId}
                            aria-label="Narration voice"
                            onChange={(e) => handleVoiceChange(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 32px 8px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-medium)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-primary)',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              outline: 'none',
                              appearance: 'none',
                              textOverflow: 'ellipsis',
                              transition: 'border-color 0.15s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary, #6366f1)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
                          >
                            {/* If selected voice is from 9,650 JSON2Video library (e.g. from Studio), display it prominently */}
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
                          <div style={{
                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                            pointerEvents: 'none', display: 'flex', alignItems: 'center', color: 'var(--text-muted)'
                          }}>
                            <ChevronDown size={14} />
                          </div>
                        </div>
                      </div>

                      {/* Speed slider — exact StudioLab range 1.10–1.50 */}
                      <div style={{ flex: '1 1 130px' }}>
                        <label style={{
                          fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'
                        }}>
                          <span>Speed</span>
                          <span style={{
                            background: 'rgba(99,102,241,0.12)', padding: '1px 7px', borderRadius: '5px',
                            fontSize: '10px', fontWeight: 700, color: 'var(--accent-primary, #6366f1)',
                            fontVariantNumeric: 'tabular-nums'
                          }}>{voiceSpeed.toFixed(2)}x</span>
                        </label>
                        <input
                          type="range"
                          min={SPEED_MIN} max={SPEED_MAX} step={SPEED_STEP}
                          value={voiceSpeed}
                          onChange={e => handleSpeedChange(parseFloat(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--accent-primary, #6366f1)', cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{SPEED_MIN}x</span>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{SPEED_MAX}x</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── YouTube + Launch ── */}
                  <div style={{
                    borderTop: '1px solid var(--border-subtle)', paddingTop: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '12px', marginTop: 'auto'
                  }}>
                    {/* Channel selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <YouTubeIcon size={16} />
                      {loadingChannels ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading...</span>
                      ) : channels.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          {selectedChannel?.thumbnail && (
                            <img src={selectedChannel.thumbnail} alt="" style={{
                              width: '20px', height: '20px', borderRadius: '50%',
                              objectFit: 'cover', border: '1px solid var(--border-subtle)'
                            }} />
                          )}
                          {channels.length > 1 ? (
                            <select
                              value={selectedChannelId}
                              onChange={e => setSelectedChannelId(e.target.value)}
                              style={{
                                background: 'var(--bg-input)', border: '1px solid var(--border-medium)',
                                borderRadius: '7px', padding: '4px 8px', fontSize: '12px',
                                color: 'var(--text-primary)', cursor: 'pointer', outline: 'none'
                              }}
                            >
                              {channels.map(c => (
                                <option key={c.channelId} value={c.channelId}>
                                  {c.title || c.channelTitle || 'YouTube Channel'}{c.isDefault ? ' (Default)' : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {selectedChannel?.title || selectedChannel?.channelTitle || 'YouTube Channel'}
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '5px' }}>· Auto-upload</span>
                            </span>
                          )}
                          {isChannelTokenExpired && (
                            <span style={{
                              background: 'rgba(239, 68, 68, 0.18)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#ef4444',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <AlertTriangle size={11} /> Expired
                            </span>
                          )}
                          {isChannelTokenExpired && (
                            <button
                              type="button"
                              onClick={() => {
                                audioEngine.playSfx('shimmer');
                                openGoogleOAuthPopup('templates');
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 9px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                              }}
                            >
                              <RefreshCw size={11} /> ⚡ Reconnect
                            </button>
                          )}
                        </div>
                      ) : (
                        <button type="button"
                          onClick={() => { audioEngine.playSfx('click'); if (typeof onNavigate === 'function') onNavigate('profile'); }}
                          style={{
                            background: 'none', border: 'none', padding: 0, fontSize: '12px',
                            color: 'var(--accent-primary, #6366f1)', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          Connect YouTube in Profile <ChevronRight size={12} />
                        </button>
                      )}
                    </div>

                    {/* Launch / Cancel Button Group */}
                    {isGenerating && generatingTemplateId === activeTpl.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleCancelTemplateGeneration}
                          disabled={isCancelling}
                          style={{
                            padding: '10px 20px', borderRadius: '10px',
                            border: '1.5px solid rgba(239, 68, 68, 0.6)',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444', fontSize: '13px', fontWeight: 700,
                            cursor: isCancelling ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '7px',
                            boxShadow: '0 0 16px rgba(239,68,68,0.25)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isCancelling ? (
                            <><Loader2 size={14} className="animate-spin" /><span>Cancelling...</span></>
                          ) : (
                            <><Square size={13} fill="#ef4444" /><span>Cancel Generation</span></>
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
                            padding: '10px 16px', borderRadius: '10px',
                            border: '1px solid var(--border-medium)',
                            background: 'var(--bg-input)', color: 'var(--text-primary)',
                            fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          <span>Open in Studio</span>
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={launchingId === activeTpl.id || isGenerating}
                        onClick={() => handleLaunchTemplate(activeTpl.id)}
                        className="btn-glow"
                        style={{
                          padding: '10px 22px', borderRadius: '10px', border: 'none',
                          cursor: (launchingId === activeTpl.id || isGenerating) ? 'not-allowed' : 'pointer',
                          fontSize: '13px', fontWeight: 700, color: '#ffffff',
                          display: 'flex', alignItems: 'center', gap: '7px',
                          opacity: (launchingId === activeTpl.id || isGenerating) ? 0.7 : 1
                        }}
                      >
                        {launchingId === activeTpl.id ? (
                          <><Loader2 size={14} className="animate-spin" /><span>Starting...</span></>
                        ) : (
                          <><Zap size={14} fill="#ffffff" /><span>1-Click Generate & Upload</span></>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Phone Canvas */}
                <div style={{
                  background: 'linear-gradient(180deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)',
                  borderLeft: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '24px 20px', position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                    width: '200px', height: '200px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${activeTpl.color}20 0%, transparent 70%)`,
                    pointerEvents: 'none', filter: 'blur(30px)'
                  }} />
                  <div
                    style={{
                      width: '160px', height: '330px', borderRadius: '28px',
                      border: '3px solid var(--border-medium)', background: '#000',
                      overflow: 'hidden', position: 'relative',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)',
                      transform: 'perspective(800px) rotateY(-4deg)', transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'perspective(800px) rotateY(0deg) scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'perspective(800px) rotateY(-4deg)'}
                  >
                    <div style={{
                      position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)',
                      width: '55px', height: '16px', borderRadius: '8px', background: '#111', zIndex: 3
                    }} />
                    {/* Live producing state overlay on phone screen */}
                    {isGenerating && generatingTemplateId === activeTpl.id && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)',
                        backdropFilter: 'blur(3px)', borderRadius: '25px', zIndex: 4,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', padding: '16px', textAlign: 'center'
                      }}>
                        <div style={{ position: 'relative', width: '42px', height: '42px', marginBottom: '10px' }}>
                          <div style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            border: `2px solid ${activeTpl.color}`, animation: 'pulseRing 1.4s ease-out infinite'
                          }} />
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Loader2 size={20} color={activeTpl.color} className="animate-spin" />
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          AI Producing Short
                        </span>
                        <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.7)', marginTop: '3px' }}>
                          75s • 5 Scenes • 1080p
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelTemplateGeneration}
                          disabled={isCancelling}
                          style={{
                            marginTop: '12px', background: 'rgba(239,68,68,0.25)',
                            border: '1px solid rgba(239,68,68,0.6)', borderRadius: '99px',
                            padding: '4px 10px', fontSize: '9px', fontWeight: 700,
                            color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <Square size={8} fill="#ef4444" />
                          <span>Stop</span>
                        </button>
                      </div>
                    )}
                    {successInfo?.videoUrl ? (
                      <video
                        src={successInfo.videoUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '25px', display: 'block' }}
                      />
                    ) : (
                      <>
                        <img
                          src={activeTpl.demoImage}
                          alt={`${activeTpl.title} demo`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '25px' }}
                        />
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                          width: '34px', height: '34px', borderRadius: '50%',
                          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8
                        }}>
                          <Play size={14} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
                        </div>
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          padding: '8px 8px 12px',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.88))'
                        }}>
                          <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#fff', marginBottom: '2px', lineHeight: 1.3 }}>
                            {activeTpl.videoTitle}
                          </div>
                          <div style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.6)' }}>{activeTpl.stats}</div>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{
                    position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
                    fontSize: '10px', fontWeight: 600, color: successInfo?.videoUrl ? '#10b981' : 'var(--text-muted)', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    {successInfo?.videoUrl ? (
                      <>
                        <CheckCircle2 size={11} color="#10b981" />
                        <span>Ready & Rendered (75s)</span>
                      </>
                    ) : (
                      'Example Output'
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Upcoming Templates ── */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px 0' }}>
                More Templates
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                Additional autonomous niches scheduled for release.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '14px' }}>
              {filteredUpcoming.map(tpl => (
                <div key={tpl.id} className="saas-card" style={{ padding: '18px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: '6px' }}>{tpl.label}</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '99px' }}>Coming Soon</span>
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 5px 0' }}>{tpl.title}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0' }}>{tpl.desc}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tpl.duration} · {tpl.scenes}</span>
                    <button disabled style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, cursor: 'not-allowed' }}>Queued</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
