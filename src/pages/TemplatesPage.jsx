import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, CheckCircle2, AlertCircle, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, ChevronRight, Mic, Type, Play,
  Square, XCircle, ExternalLink, Cpu, Brain,
  Clapperboard, Mic2, Video, RefreshCw, Film, ArrowRight,
  Sliders, Search, X, Sparkles, Eye, ShieldCheck, Clock, Lock, ShieldAlert,
  Pause, Plus, Trash2, Calendar, ListOrdered, Share2, Check, Download
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
const SPEED_MIN = 1.10;
const SPEED_MAX = 1.50;
const SPEED_DEF = 1.10;
const SPEED_STEP = 0.05;

export const ACTIVE_TEMPLATES = [
  {
    id: 'world-mysteries',
    emoji: '🛸',
    title: 'World Mysteries & Paranormal',
    category: 'mysteries',
    label: 'World Mysteries',
    desc: 'Self-researches unrepeated paranormal mysteries, scripts 5 cinematic scenes, renders photorealistic AI video, and uploads directly to YouTube — zero manual review.',
    tagline: '75s+ · 5 Scenes · 1080p',
    duration: '75s+',
    scenes: '5 Scenes',
    resolution: '1080p',
    demoImage: '/template-world-mysteries.jpg',
    videoTitle: "The Bermuda Triangle's Darkest Secret",
    specs: '1080p Ultra HD · 9:16 Vertical · 5 Scenes',
    color: '#6366f1',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    youtubeUrl: 'https://youtube.com/shorts/r3LTM0G7BTc?si=a5xHNd5fSDyfAny9',
    youtubeId: 'r3LTM0G7BTc'
  },
  {
    id: 'last-24-hours',
    emoji: '⏳',
    title: 'Last 24 Hours [True Stories]',
    category: 'history',
    label: 'True Stories',
    desc: 'Counts down the poignant and dramatic final 24 hours of legendary figures, heroic sacrifices, and historic events with empathetic narration and emotional hooks.',
    tagline: '75s+ · 5 Scenes · 1080p',
    duration: '75s+',
    scenes: '5 Scenes',
    resolution: '1080p',
    demoImage: '/template-last-24-hours.jpg',
    videoTitle: 'Princess Diana: The Final 24 Hours',
    specs: '1080p Ultra HD · 9:16 Vertical · 5 Scenes',
    color: '#f59e0b',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    youtubeUrl: 'https://youtube.com/shorts/1ySvtrgDTnE?si=pMbTnIisLg7ftrg-',
    youtubeId: '1ySvtrgDTnE'
  },
  {
    id: '3am-horror',
    emoji: '👻',
    title: '3-AM Horror & Paranormal',
    category: 'psychology',
    label: 'Horror & Paranormal',
    desc: 'Bone-chilling psychological terror and terrifying 3 AM encounters. Maximum camera movement, eerie suspense, and dark sound design crafted for viral retention.',
    tagline: '75s+ · 5 Scenes · 1080p',
    duration: '75s+',
    scenes: '5 Scenes',
    resolution: '1080p',
    demoImage: '/template-3am-horror.jpg',
    videoTitle: 'The Dyatlov Incident: 3 AM Anomaly',
    specs: '1080p Ultra HD · 9:16 Vertical · 5 Scenes',
    color: '#ef4444',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    youtubeUrl: 'https://youtube.com/shorts/vOb4jIQkAOY?si=bPQqp7MGmRkW00uF',
    youtubeId: 'vOb4jIQkAOY'
  },
  {
    id: 'time-travel-influencer',
    emoji: '⏳',
    title: 'Time Travel Influencer [Native Voice]',
    category: 'history',
    label: 'POV Vlogger',
    desc: 'High-energy Indian influencer traveling across historical eras, mythic ancient times, and future ages. Pure native in-video character speech with lip-sync and character retention.',
    tagline: '75s · 5 Scenes · 480p · Native Voice',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '480p',
    demoImage: '/template-time-travel.jpg',
    videoTitle: 'Influencer Lands in Harappa 2500 BC',
    specs: '480p 15s Direct Video · 9:16 Vertical · Native Hindi Dialogue · Character Retention',
    color: '#10b981',
    aiBrain: 'Claude Haiku 4.5 & Grok Video',
    badge: '⚡ NATIVE HINDI VOICE',
    isNativeVoice: true,
    youtubeUrl: 'https://www.youtube.com/shorts/Xt0hPq-z7Dk',
    youtubeId: 'Xt0hPq-z7Dk'
  },
  {
    id: 'family-micro-drama',
    emoji: '🎭',
    title: 'Ghar Ki Kahani [Family Drama]',
    category: 'history',
    label: 'Serial Drama',
    desc: 'A serial family micro-drama set in Pune. Five characters, a locked steel tin box, and an elderly grandmother who was once a celebrated stage singer. Realistic live-action with native Hindi dialogue.',
    tagline: '75s · 5 Scenes · 480p · Serial Drama',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '480p',
    demoImage: '/template-ghar-ki-kahani.jpg',
    videoTitle: 'Ghar Ki Kahani: Ek Pune ka parivaar. Ek steel ki dibbi. Ek purani gayika.',
    specs: '480p 15s Direct Video · 9:16 Vertical · Native Hindi Dialogue · Character Retention',
    color: '#e11d48',
    aiBrain: 'Claude Haiku 4.5 & Grok Video',
    badge: '🎭 SERIAL FAMILY DRAMA',
    isNativeVoice: true,
    isFamilyDrama: true,
    badges: ['Serial', 'Hinglish title', 'Devanagari dialogue', 'Native voice', '9:16', '480p'],
    sampleLine: 'Ek Pune ka parivaar. Ek steel ki dibbi. Ek purani gayika.',
    youtubeUrl: 'https://www.youtube.com/shorts/Xt0hPq-z7Dk',
    youtubeId: 'Xt0hPq-z7Dk'
  }
];

export const GHAR_KI_KAHANI_CHARACTERS = [
  { id: 'DADI', name: 'Dadi', role: 'Grandmother (Ex-stage singer)', required: true, avatar: '👵' },
  { id: 'PAPA', name: 'Papa', role: 'Father', required: true, avatar: '👨' },
  { id: 'MUMMY', name: 'Mummy', role: 'Mother', required: true, avatar: '👩' },
  { id: 'DIDI', name: 'Didi', role: 'Elder Daughter', required: true, avatar: '👧' },
  { id: 'CHHOTA', name: 'Chhota', role: 'Younger Son', required: true, avatar: '👦' },
  { id: 'NEIGHBOUR', name: 'Neighbour', role: 'Nosy Neighbour', required: false, avatar: '👀' },
  { id: 'GUEST', name: 'Guest', role: 'Unexpected Visitor', required: false, avatar: '👤' }
];

export const UPCOMING_TEMPLATES = [
  { id: 'ancient-history', emoji: '🏛️', category: 'history', label: 'History & Lore', title: 'Ancient History & Lost Civilizations', desc: 'Deep-dives into forgotten dynasties, ancient monoliths, and lost technological wonders.', duration: '75s+', scenes: '5 Scenes' },
  { id: 'dark-psychology', emoji: '🧠', category: 'psychology', label: 'Dark Psychology', title: 'Dark Psychology & Human Behavior', desc: 'Reveals behavioral quirks, subconscious micro-signals, and persuasion breakdowns.', duration: '60s+', scenes: '4 Scenes' },
  { id: 'cosmic-space', emoji: '🌌', category: 'scifi', label: 'Space & Tech', title: 'Deep Space & Cosmic Wonders', desc: 'Explores black hole anomalies, quantum paradoxes, and deep cosmos discoveries.', duration: '75s+', scenes: '5 Scenes' },
  { id: 'mythical-heists', emoji: '💎', category: 'mysteries', label: 'World Mysteries', title: 'Legendary Heists & Unsolved Enigmas', desc: 'Fast-paced breakdowns of impossible vaults, art heists, and unexplained escapes.', duration: '75s+', scenes: '5 Scenes' }
];

export const CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'mysteries', label: 'World Mysteries' },
  { id: 'history', label: 'True Stories' },
  { id: 'psychology', label: 'Horror & Paranormal' },
  { id: 'scifi', label: 'Space & Tech' }
];

// Helper to normalize YouTube channel schema from API
const normalizeChannel = (c) => {
  if (!c) return null;
  const name = c.channelTitle || c.title || 'YouTube Channel';
  const avatar = c.avatarUrl || c.thumbnailUrl || '';
  return {
    ...c,
    title: name,
    channelTitle: name,
    avatarUrl: avatar,
    thumbnailUrl: avatar
  };
};

export default function TemplatesPage({
  user,
  currentRoutePath = 'templates',
  collapsed = false,
  onToggleCollapse,
  onNavigate
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customizingId, setCustomizingId] = useState(null); // id of template whose settings drawer is open
  const [previewTemplate, setPreviewTemplate] = useState(null); // template currently in preview modal
  const { isMobile, isTablet } = useBreakpoint();

  // Per-template custom topics map
  const [customTopics, setCustomTopics] = useState({
    'world-mysteries': '',
    'last-24-hours': '',
    '3am-horror': '',
    'time-travel-influencer': '',
    'family-micro-drama': ''
  });

  // Time Travel Influencer specific options (gender & character image url)
  const [influencerGender, setInfluencerGender] = useState('auto'); // 'auto' | 'female' | 'male'
  const [characterImageUrl, setCharacterImageUrl] = useState('');

  // Time Travel Influencer Section B: Story Mode, Series Mode, Character Mode
  const [storyMode, setStoryMode] = useState('library'); // 'library' | 'custom'
  const [seriesMode, setSeriesMode] = useState('new'); // 'new' | 'continue'
  const [selectedSeriesId, setSelectedSeriesId] = useState(null);
  const [eligibleSeries, setEligibleSeries] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [characterMode, setCharacterMode] = useState('random'); // 'channel' | 'upload' | 'random'
  const [saveChannelFaceCheckbox, setSaveChannelFaceCheckbox] = useState(false);

  // Ghar Ki Kahani (family-micro-drama) specific states
  const [castPhotos, setCastPhotos] = useState({
    DADI: null,
    PAPA: null,
    MUMMY: null,
    DIDI: null,
    CHHOTA: null,
    NEIGHBOUR: null,
    GUEST: null
  });
  const [castInputUrls, setCastInputUrls] = useState({
    DADI: '',
    PAPA: '',
    MUMMY: '',
    DIDI: '',
    CHHOTA: '',
    NEIGHBOUR: '',
    GUEST: ''
  });
  const [savingCastId, setSavingCastId] = useState(null);
  const [episodeMode, setEpisodeMode] = useState('next'); // 'next' | 'custom'
  const [customEpisodeIdea, setCustomEpisodeIdea] = useState('');

  const [launchingId, setLaunchingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  // Daily Quota & Governance State
  const [quotaStatus, setQuotaStatus] = useState({
    dailyLimit: 1,
    usedToday: 0,
    remaining: 1,
    isLimitReached: false,
    nextResetTime: null,
    resetCountdownMs: 0,
    enforceDailyLimit: true,
    maintenanceMode: false,
    maintenanceNotice: ''
  });
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [countdownText, setCountdownText] = useState('');

  // Generation & Cancel states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingThreadId, setGeneratingThreadId] = useState(null);
  const [generatingTemplateId, setGeneratingTemplateId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelNotice, setCancelNotice] = useState(null);
  const [failedExecutionInfo, setFailedExecutionInfo] = useState(null);
  const [retryCooldownSeconds, setRetryCooldownSeconds] = useState(0);
  const abortControllerRef = useRef(null);

  // 5-minute cooldown ticker for failed executions
  useEffect(() => {
    if (!failedExecutionInfo?.canRetryAt) {
      setRetryCooldownSeconds(0);
      return;
    }
    const updateCountdown = () => {
      const diff = Math.max(0, Math.floor((new Date(failedExecutionInfo.canRetryAt).getTime() - Date.now()) / 1000));
      setRetryCooldownSeconds(diff);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [failedExecutionInfo]);

  // Fetch current user quota from backend
  const fetchQuotaStatus = async () => {
    try {
      const token = getAuthToken() || '';
      const targetUid = user?.id || user?.userId || user?._id || user?.uid || '';
      const url = targetUid
        ? `/.netlify/functions/generate-template?userId=${encodeURIComponent(targetUid)}&_t=${Date.now()}`
        : `/.netlify/functions/generate-template?_t=${Date.now()}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setQuotaStatus(data);
      }
    } catch (err) {
      console.warn('[TemplatesPage] fetchQuotaStatus error:', err);
    } finally {
      setLoadingQuota(false);
    }
  };

  useEffect(() => {
    fetchQuotaStatus();
  }, [user]);

  // Connect to shared video settings so selected voice/speed applies smoothly across Bang AI
  const { settings: videoSettings, updateSettings: updateVideoSettings } = useVideoSettings();
  useVoiceCatalog();

  const voiceId = videoSettings?.voiceId || 'adam';
  const voiceSpeed = typeof videoSettings?.voiceSpeed === 'number'
    ? Math.max(SPEED_MIN, Math.min(SPEED_MAX, videoSettings.voiceSpeed))
    : SPEED_DEF;

  const activeVoiceObj = getVoiceById(voiceId) || VOICES.find(v => v.id === voiceId || v.elevenLabsId === voiceId) || VOICES[0];
  const isCustomVoice = !VOICES.some(v => v.id === voiceId || v.elevenLabsId === voiceId);

  // ── 24-Hour Autonomous Autopilot State & Handlers ──
  const [showAutomateModal, setShowAutomateModal] = useState(false);
  const [automationConfig, setAutomationConfig] = useState({
    status: 'PAUSED',
    templateId: 'world-mysteries',
    totalDays: 7,
    completedDays: 0,
    topic: '',
    upcomingTopics: [],
    voiceId: voiceId,
    elevenLabsVoiceId: videoSettings?.elevenLabsVoiceId || '',
    voiceSpeed: 1.20,
    musicId: 'mystery2',
    musicVolume: 0.08,
    selectedChannelId: '',
    autoUploadToYouTube: true,
    nextRunAt: null,
    lastRunAt: null,
    topicsHistory: []
  });
  const [loadingAutomation, setLoadingAutomation] = useState(false);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [triggeringRunNow, setTriggeringRunNow] = useState(false);
  const [autoStatusMessage, setAutoStatusMessage] = useState('');

  // Fetch user automation config
  const fetchAutomationConfig = async () => {
    if (!user) return;
    setLoadingAutomation(true);
    try {
      const token = getAuthToken() || '';
      const res = await fetch('/.netlify/functions/template-automation', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.automation) {
          // Keep voice synchronized with the user's active studio voice (videoSettings)
          const resolvedVoiceId = videoSettings?.voiceId || data.automation.voiceId || 'adam';
          const resolvedElVoiceId = videoSettings?.elevenLabsVoiceId || data.automation.elevenLabsVoiceId || '';
          setAutomationConfig({
            ...data.automation,
            topic: data.automation.topic || '',
            voiceId: resolvedVoiceId,
            elevenLabsVoiceId: resolvedElVoiceId
          });
          if (Array.isArray(data.channels) && data.channels.length > 0) {
            const norm = data.channels.map(normalizeChannel);
            setChannels(prev => (prev && prev.length > 0 ? prev : norm));
          }
        }
      }
    } catch (e) {
      console.warn('[TemplatesPage] fetchAutomation error:', e);
    } finally {
      setLoadingAutomation(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAutomationConfig();
    }
  }, [user]);

  const handleSaveAutomation = async (overrides = {}) => {
    setSavingAutomation(true);
    setAutoStatusMessage('');
    try {
      const token = getAuthToken() || '';
      const targetChId = automationTargetChannel?.channelId || selectedChannel?.channelId || automationConfig.selectedChannelId || '';
      const chosenVoiceId = overrides.voiceId || voiceId || activeVoiceObj?.id || 'adam';
      const chosenElVoiceId = overrides.elevenLabsVoiceId || videoSettings?.elevenLabsVoiceId || activeVoiceObj?.elevenLabsId || '';
      const payload = {
        action: 'save',
        ...automationConfig,
        ...overrides,
        selectedChannelId: targetChId,
        voiceId: chosenVoiceId,
        elevenLabsVoiceId: chosenElVoiceId
      };
      const res = await fetch('/.netlify/functions/template-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setAutomationConfig(data.automation || { ...automationConfig, ...payload });
        setAutoStatusMessage(data.message || '✅ Automation settings saved!');
        audioEngine.playSfx('success');
      } else {
        setAutoStatusMessage(`❌ Error: ${data.error || 'Failed to save settings'}`);
      }
    } catch (err) {
      setAutoStatusMessage(`❌ Error: ${err.message}`);
    } finally {
      setSavingAutomation(false);
    }
  };

  const handleToggleAutomation = async () => {
    setSavingAutomation(true);
    setAutoStatusMessage('');
    try {
      const token = getAuthToken() || '';
      const res = await fetch('/.netlify/functions/template-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'toggle' })
      });
      const data = await res.json();
      if (data.success) {
        setAutomationConfig(prev => ({ ...prev, status: data.status }));
        setAutoStatusMessage(data.message);
        audioEngine.playSfx('click');
        fetchAutomationConfig();
      } else {
        setAutoStatusMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setAutoStatusMessage(`❌ Error: ${err.message}`);
    } finally {
      setSavingAutomation(false);
    }
  };

  const handleTriggerRunNow = async () => {
    if (triggeringRunNow) return;
    setTriggeringRunNow(true);
    setAutoStatusMessage("⏳ Launching today's autonomous video generation & YouTube auto-upload...");
    audioEngine.playSfx('shimmer');
    try {
      const token = getAuthToken() || '';
      const chosenVoiceId = voiceId || activeVoiceObj?.id || 'adam';
      const chosenElVoiceId = videoSettings?.elevenLabsVoiceId || activeVoiceObj?.elevenLabsId || '';
      const res = await fetch('/.netlify/functions/template-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'run-now',
          topic: automationConfig.topic || '',
          prompt: automationConfig.topic || '',
          voiceId: chosenVoiceId,
          elevenLabsVoiceId: chosenElVoiceId
        })
      });
      const data = await res.json();
      if (data.success) {
        setAutoStatusMessage(`🚀 Video successfully dispatched! Autonomous rendering in progress.`);
        audioEngine.playSfx('success');
        fetchAutomationConfig();
        fetchQuotaStatus();
      } else {
        setAutoStatusMessage(`❌ Run failed: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setAutoStatusMessage(`❌ Run failed: ${err.message}`);
    } finally {
      setTriggeringRunNow(false);
    }
  };

  // Cooldown countdown ticker when daily limit is reached
  useEffect(() => {
    if (!quotaStatus?.nextResetTime || !quotaStatus?.isLimitReached) {
      setCountdownText('');
      return;
    }

    const updateTimer = () => {
      const diff = new Date(quotaStatus.nextResetTime).getTime() - Date.now();
      if (diff <= 0) {
        setCountdownText('Resetting now...');
        fetchQuotaStatus();
      } else {
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdownText(`${hrs}h ${mins}m ${secs}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [quotaStatus?.nextResetTime, quotaStatus?.isLimitReached]);

  const uid = user?.id || user?.userId || user?._id || '';
  const threadCacheKey = uid ? `shortsai_threads_${uid}` : 'shortsai_all_threads';

  // Synchronize applied voice from Design Studio into automationConfig whenever videoSettings changes
  useEffect(() => {
    if (videoSettings?.voiceId) {
      setAutomationConfig(prev => {
        if (prev.voiceId !== videoSettings.voiceId) {
          return {
            ...prev,
            voiceId: videoSettings.voiceId,
            elevenLabsVoiceId: videoSettings.elevenLabsVoiceId || ''
          };
        }
        return prev;
      });
    }
  }, [videoSettings?.voiceId, videoSettings?.elevenLabsVoiceId]);

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

  const handleAutomateVoiceChange = (newVal) => {
    if (newVal === '__open_studio__') {
      audioEngine.playSfx('click');
      setShowAutomateModal(false);
      if (typeof onNavigate === 'function') onNavigate('studio/voices');
      else window.location.hash = '#/studio/voices';
      return;
    }
    audioEngine.playSfx('click');
    const matched = getVoiceById(newVal) || VOICES.find(v => v.id === newVal || v.elevenLabsId === newVal);
    const chosenId = matched?.id || newVal;
    const chosenElId = matched?.elevenLabsId || (matched?.source === 'elevenlabs' ? matched.id : 'pNInz6obpgDQGcFmaJgB');

    setAutomationConfig(prev => ({
      ...prev,
      voiceId: chosenId,
      elevenLabsVoiceId: chosenElId
    }));

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
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState('');

  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) { setLoadingChannels(false); return; }
      try {
        const token = getAuthToken();
        const res = await fetch('/.netlify/functions/google-oauth?action=channels', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data && Array.isArray(data.channels)) {
          const norm = data.channels.map(normalizeChannel);
          setChannels(norm);
          const def = norm.find(c => c.isDefault) || norm[0];
          if (def?.channelId) {
            setSelectedChannelId(prev => (prev && norm.some(c => c.channelId === prev && c.channelId !== def.channelId) ? prev : def.channelId));
          }
        }
      } catch (err) {
        console.error('[TemplatesPage] Error loading channels:', err);
      } finally {
        setLoadingChannels(false);
      }
    };
    fetchChannels();
  }, [user]);

  const selectedChannel = (selectedChannelId && channels.find(c => c.channelId === selectedChannelId))
    || channels.find(c => c.isDefault)
    || channels[0]
    || null;
  const isChannelTokenExpired = !!(selectedChannel && (selectedChannel.needsReconnect || selectedChannel.isTokenExpired));

  const automationTargetChannel = (automationConfig.selectedChannelId && channels.find(c => c.channelId === automationConfig.selectedChannelId))
    || selectedChannel
    || channels.find(c => c.isDefault)
    || channels[0]
    || null;
  const isAutomationChannelExpired = !!(automationTargetChannel && (automationTargetChannel.needsReconnect || automationTargetChannel.isTokenExpired));
  const selectedAutomationTpl = ACTIVE_TEMPLATES.find(t => t.id === automationConfig.templateId) || ACTIVE_TEMPLATES[0];

  // Fetch eligible series for Time Travel Influencer Part 2 continuation from Section C
  useEffect(() => {
    const chId = selectedChannel?.channelId || selectedChannelId;
    if (!chId || !user) {
      setEligibleSeries([]);
      return;
    }
    let isCancelled = false;
    setLoadingSeries(true);
    const fetchSeries = async () => {
      try {
        const token = getAuthToken() || '';
        const res = await fetch(`/.netlify/functions/template-series?channelId=${encodeURIComponent(chId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.series || []);
          if (!isCancelled) {
            setEligibleSeries(list);
            if (list.length > 0) {
              setSelectedSeriesId(prev => (prev && list.some(s => s.seriesId === prev) ? prev : list[0].seriesId));
            } else {
              setSelectedSeriesId(null);
              setSeriesMode('new');
            }
          }
        } else {
          if (!isCancelled) {
            setEligibleSeries([]);
            setSelectedSeriesId(null);
            setSeriesMode('new');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('[TemplatesPage] Failed to fetch eligible series:', err);
          setEligibleSeries([]);
        }
      } finally {
        if (!isCancelled) setLoadingSeries(false);
      }
    };
    fetchSeries();
    return () => { isCancelled = true; };
  }, [selectedChannel?.channelId, selectedChannelId, user]);

  // Synchronize characterMode default when selected channel has/lacks a permanent face
  useEffect(() => {
    if (selectedChannel?.characterImageUrl) {
      setCharacterMode(prev => (prev === 'upload' ? 'upload' : 'channel'));
    } else {
      setCharacterMode(prev => (prev === 'channel' ? 'random' : prev));
    }
  }, [selectedChannel?.channelId, selectedChannel?.characterImageUrl]);

  // Fetch Ghar Ki Kahani (GKK-001) cast photos from show_cast collection
  useEffect(() => {
    if (!user) return;
    let isCancelled = false;
    const fetchCast = async () => {
      try {
        const token = getAuthToken() || '';
        const res = await fetch('/.netlify/functions/show-cast?showId=GKK-001', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.characters) {
            setCastPhotos(prev => ({ ...prev, ...data.characters }));
          }
        }
      } catch (err) {
        console.warn('[TemplatesPage] Failed to fetch show-cast:', err);
      }
    };
    fetchCast();
    return () => { isCancelled = true; };
  }, [user]);

  const handleSaveCastPhoto = async (characterId) => {
    const rawUrl = (castInputUrls[characterId] || '').trim();
    if (!rawUrl) {
      setErrorMsg('Please enter an image URL.');
      return;
    }
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setErrorMsg('Image URL must use http: or https:');
        return;
      }
    } catch (e) {
      setErrorMsg('Please enter a valid, well-formed image URL.');
      return;
    }
    setSavingCastId(characterId);
    try {
      const token = getAuthToken() || '';
      const res = await fetch('/.netlify/functions/show-cast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          showId: 'GKK-001',
          characterId,
          imageUrl: rawUrl
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCastPhotos(prev => ({ ...prev, [characterId]: rawUrl }));
        setCastInputUrls(prev => ({ ...prev, [characterId]: '' }));
        audioEngine.playSfx('success');
      } else {
        setErrorMsg(data.error || 'Failed to save character photo.');
      }
    } catch (e) {
      setErrorMsg(e.message || 'Error saving photo.');
    } finally {
      setSavingCastId(null);
    }
  };

  const handleRemoveCastPhoto = async (characterId) => {
    setSavingCastId(characterId);
    try {
      const token = getAuthToken() || '';
      const res = await fetch('/.netlify/functions/show-cast', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          showId: 'GKK-001',
          characterId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCastPhotos(prev => ({ ...prev, [characterId]: null }));
        audioEngine.playSfx('click');
      } else {
        setErrorMsg(data.error || 'Failed to remove character photo.');
      }
    } catch (e) {
      setErrorMsg(e.message || 'Error removing photo.');
    } finally {
      setSavingCastId(null);
    }
  };

  // Listen for OAuth completion from popup
  useEffect(() => {
    const handleAuthMessage = (event) => {
      if (event.data?.type === 'BANG_OAUTH_SUCCESS') {
        const token = getAuthToken();
        fetch('/.netlify/functions/google-oauth?action=channels', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
          .then(res => res.json())
          .then(data => {
            if (data && Array.isArray(data.channels)) {
              const norm = data.channels.map(normalizeChannel);
              setChannels(norm);
              const def = norm.find(c => c.isDefault) || norm[0];
              if (def?.channelId) {
                setSelectedChannelId(prev => (prev && norm.some(c => c.channelId === prev && c.channelId !== def.channelId) ? prev : def.channelId));
              }
              setErrorMsg(null);
            }
          })
          .catch(() => { });
        fetchAutomationConfig();
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch (e) { }
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
          if (data.status === 'FAILED' || data.status === 'RENDER_FAILED' || data.status === 'EXECUTION_TIMEOUT') {
            setIsGenerating(false);
            setLaunchingId(null);
            audioEngine.playSfx('warning');

            const canRetryAt = data.canRetryAt || new Date(Date.now() + (data.retryCooldownSeconds || 300) * 1000).toISOString();
            setFailedExecutionInfo({
              threadId: generatingThreadId,
              templateId: generatingTemplateId,
              errorMessage: data.errorMessage || 'Our AI rendering engine encountered an unexpected hiccup. Your credit has been preserved.',
              detailedError: data.detailedError || null,
              failedNode: data.failedNode || null,
              canRetryAt,
              retryCooldownSeconds: data.retryCooldownSeconds || 300,
              topic: (customTopics[generatingTemplateId] || '').trim()
            });

            // Immediately re-fetch user quota so refunded credit is reflected in UI
            fetchAutomationConfig();
            fetchQuotaStatus();
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
              message: ytUrl ? '🎉 Video produced and uploaded to YouTube Shorts!' : '🎉 Video produced and rendered successfully!',
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
  const handleLaunchTemplate = async (templateId, options = {}) => {
    audioEngine.playSfx('click');
    if (!user) { if (typeof onNavigate === 'function') onNavigate('login'); return; }

    const isRetry = !!options.isRetry;

    if (quotaStatus?.maintenanceMode) {
      audioEngine.playSfx('warning');
      setErrorMsg(`🛠️ Maintenance Notice: ${quotaStatus.maintenanceNotice || 'AI Template generation is currently paused for maintenance.'}`);
      return;
    }

    if (!isRetry && quotaStatus?.isLimitReached) {
      audioEngine.playSfx('warning');
      setShowLimitModal(true);
      return;
    }

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
    setFailedExecutionInfo(null);
    setRetryCooldownSeconds(0);
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
          rawUserInput: targetTopic || `${targetTpl.title} (Autonomous Video)`,
          status: 'GENERATING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [
            {
              role: 'system',
              content: `1-Click Autonomous Generation started for template: ${targetTpl.title}.`
            }
          ]
        };
        const stored = JSON.parse(localStorage.getItem(threadCacheKey) || '[]');
        localStorage.setItem(threadCacheKey, JSON.stringify([provisional, ...stored.filter(t => (t.threadId || t.id) !== newThreadId)]));
      } catch (e) {
        console.warn('[TemplatesPage] localStorage write error:', e);
      }

      const chosenSubtitlePreset = videoSettings?.subtitleSettings?.presetId || videoSettings?.subtitleStyle || 'hormozi';
      const chosenMusicId = videoSettings?.musicId || 'mystery2';
      const chosenMusic = getMusicTrackById(chosenMusicId);
      const isTargetNativeVoice = targetTpl.id === 'time-travel-influencer' || !!targetTpl.isNativeVoice;
      const targetChannelToUse = selectedChannel?.channelId || selectedChannelId || undefined;

      // Section B: Compute exact payload fields for Time Travel Influencer
      const effectiveStoryMode = (storyMode === 'custom' && targetTopic) ? 'custom' : 'library';
      const effectiveSeriesMode = (seriesMode === 'continue' && selectedSeriesId) ? 'continue' : 'new';
      const effectiveSeriesId = effectiveSeriesMode === 'continue' ? selectedSeriesId : null;
      const effectiveCharacterMode = characterMode; // 'channel' | 'upload' | 'random'
      let resolvedCharUrl = '';
      if (effectiveCharacterMode === 'channel') {
        resolvedCharUrl = selectedChannel?.characterImageUrl || '';
      } else if (effectiveCharacterMode === 'upload') {
        resolvedCharUrl = characterImageUrl.trim();
      } else {
        resolvedCharUrl = '';
      }
      const effectiveSaveChannelFace = Boolean(effectiveCharacterMode === 'upload' && saveChannelFaceCheckbox && resolvedCharUrl);
      const chName = selectedChannel?.characterName || '';
      const chGender = selectedChannel?.characterGender || '';

      const res = await fetch('/.netlify/functions/generate-template', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({
          templateId,
          threadId: newThreadId,
          sessionId,
          selectedChannelId: targetChannelToUse,
          token,
          showId: templateId === 'family-micro-drama' ? 'GKK-001' : undefined,
          episodeMode: templateId === 'family-micro-drama' ? episodeMode : undefined,
          customEpisodeTopic: templateId === 'family-micro-drama' ? (episodeMode === 'custom' ? customEpisodeIdea.trim() : '') : undefined,
          prompt: templateId === 'family-micro-drama'
            ? (episodeMode === 'custom' ? customEpisodeIdea.trim() : '')
            : (isTargetNativeVoice ? (effectiveStoryMode === 'custom' ? targetTopic : '') : targetTopic),
          voiceId: isTargetNativeVoice ? '' : (activeVoiceObj?.id || voiceId),
          elevenLabsVoiceId: isTargetNativeVoice ? '' : elevenLabsVoiceId,
          voiceSpeed: clampedSpeed,
          voiceVolume: videoSettings?.voiceVolume ?? 1.0,
          subtitleSettings: videoSettings?.subtitleSettings || null,
          subtitleStyle: chosenSubtitlePreset,
          musicId: chosenMusicId,
          musicTrackUrl: videoSettings?.musicTrackUrl || chosenMusic?.audioUrl || '',
          musicVolume: videoSettings?.musicVolume ?? 0.08,
          influencerGender: templateId === 'time-travel-influencer' ? influencerGender : undefined,
          characterImageUrl: templateId === 'time-travel-influencer' ? resolvedCharUrl : undefined,
          storyMode: templateId === 'time-travel-influencer' ? effectiveStoryMode : undefined,
          seriesMode: templateId === 'time-travel-influencer' ? effectiveSeriesMode : undefined,
          seriesId: templateId === 'time-travel-influencer' ? effectiveSeriesId : undefined,
          characterMode: templateId === 'time-travel-influencer' ? effectiveCharacterMode : undefined,
          saveChannelFace: templateId === 'time-travel-influencer' ? effectiveSaveChannelFace : undefined,
          channelCharacterName: templateId === 'time-travel-influencer' ? chName : undefined,
          channelCharacterGender: templateId === 'time-travel-influencer' ? chGender : undefined,
          isRetry
        })
      });

      if (controller.signal.aborted) return;

      if (res.status === 429) {
        const errData = await res.json().catch(() => ({}));
        audioEngine.playSfx('warning');
        setQuotaStatus(prev => ({
          ...prev,
          isLimitReached: true,
          remaining: 0,
          nextResetTime: errData.nextResetTime || prev.nextResetTime,
          resetCountdownMs: errData.resetCountdownMs || prev.resetCountdownMs
        }));
        setShowLimitModal(true);
        setIsGenerating(false);
        setLaunchingId(null);
        return;
      }

      if (res.status === 503) {
        const errData = await res.json().catch(() => ({}));
        audioEngine.playSfx('warning');
        setErrorMsg(errData.error || 'AI Template generation is currently in maintenance mode.');
        setIsGenerating(false);
        setLaunchingId(null);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to dispatch template workflow');

      // Optimistically update quota and refresh from backend
      setQuotaStatus(prev => ({
        ...prev,
        usedToday: prev.usedToday + 1,
        remaining: Math.max(0, prev.remaining - 1),
        isLimitReached: (prev.remaining - 1) <= 0
      }));
      fetchQuotaStatus();

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
      try { abortControllerRef.current.abort(); } catch (e) { }
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
        'Channel Target: ' + (selectedChannel?.channelTitle || selectedChannel?.title || 'YouTube Channel')
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
        'Pacing: 5 dynamic cinematic scenes · Full short',
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
        flex: 1,
        width: '100%',
        height: isMobile ? 'auto' : '100%',
        minHeight: 0,
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        padding: isMobile ? '16px 12px 60px 12px' : '36px 32px 80px 32px',
        overflowY: isMobile ? 'visible' : 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

          {/* ── Top Header & Stats ── */}
          {/* ── Top Header & Stats ── */}
          <div style={{
            marginBottom: isMobile ? '20px' : '28px',
            background: isMobile ? 'var(--bg-card)' : 'transparent',
            border: isMobile ? '1px solid var(--border-subtle)' : 'none',
            borderRadius: isMobile ? '16px' : '0',
            padding: isMobile ? '14px 14px 16px 14px' : '0',
            boxShadow: isMobile ? '0 4px 20px rgba(0,0,0,0.12)' : 'none'
          }}>
            {/* Top Toolbar Row */}
            {isMobile ? (
              /* ── Mobile Toolbar Layout: Clean 2-Tier Stack ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                {/* Tier 1: System Status Badges */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '3px 9px', borderRadius: '99px',
                    background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                    fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)'
                  }}>
                    <Sparkles size={11} color="var(--accent-primary, #ff4f00)" />
                    75s+ AI Pipelines
                  </span>
                  <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    Engine Active
                  </span>
                </div>

                {/* Tier 2: User Action Chips (YouTube + Daily Quota side-by-side) */}
                {user && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* YouTube Chip */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 10px', borderRadius: '10px',
                      background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                      fontSize: '11px', color: 'var(--text-secondary)', minWidth: 0
                    }}>
                      <YouTubeIcon size={14} />
                      {loadingChannels ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Loading...</span>
                      ) : channels.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <span style={{
                            fontWeight: 600, color: 'var(--text-primary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontSize: '11px', flex: 1
                          }}>
                            {selectedChannel?.channelTitle || selectedChannel?.title || 'YouTube'}
                          </span>
                          {isChannelTokenExpired ? (
                            <button
                              type="button"
                              onClick={() => { audioEngine.playSfx('shimmer'); openGoogleOAuthPopup('templates'); }}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#ef4444', padding: '1px 5px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, cursor: 'pointer', flexShrink: 0
                              }}
                            >
                              Fix
                            </button>
                          ) : (
                            <span style={{ fontSize: '9.5px', color: '#10b981', fontWeight: 700, flexShrink: 0 }}>✓</span>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { audioEngine.playSfx('click'); if (typeof onNavigate === 'function') onNavigate('profile'); }}
                          style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-primary, #ff4f00)', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          Connect YT
                        </button>
                      )}
                    </div>

                    {/* Daily Quota Chip */}
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playSfx('click');
                        setShowLimitModal(true);
                      }}
                      title="Click to view 24-hour quota details & countdown"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        padding: '6px 10px', borderRadius: '10px',
                        background: quotaStatus.maintenanceMode
                          ? 'rgba(239, 68, 68, 0.12)'
                          : quotaStatus.isLimitReached
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'rgba(16, 185, 129, 0.12)',
                        border: `1px solid ${
                          quotaStatus.maintenanceMode
                            ? 'rgba(239, 68, 68, 0.35)'
                            : quotaStatus.isLimitReached
                              ? 'rgba(245, 158, 11, 0.35)'
                              : 'rgba(16, 185, 129, 0.35)'
                        }`,
                        color: quotaStatus.maintenanceMode
                          ? '#ef4444'
                          : quotaStatus.isLimitReached
                            ? '#f59e0b'
                            : '#10b981',
                        fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}
                    >
                      {quotaStatus.maintenanceMode ? (
                        <>
                          <AlertTriangle size={12} />
                          <span>Maintenance</span>
                        </>
                      ) : quotaStatus.isLimitReached ? (
                        <>
                          <Lock size={12} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {countdownText ? countdownText.split(' ')[0] : 'Locked'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Zap size={12} fill="#10b981" />
                          <span>{quotaStatus.remaining}/{quotaStatus.dailyLimit} Left</span>
                        </>
                      )}
                    </button>
                    {/* Automate Chip on Mobile */}
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playSfx('click');
                        setShowAutomateModal(true);
                      }}
                      style={{
                        gridColumn: '1 / -1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        padding: '7px 12px',
                        borderRadius: '10px',
                        background: automationConfig.status === 'ACTIVE'
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(6, 182, 212, 0.14))'
                          : 'linear-gradient(135deg, rgba(255, 79, 0, 0.14), rgba(139, 92, 246, 0.12))',
                        border: automationConfig.status === 'ACTIVE'
                          ? '1px solid rgba(16, 185, 129, 0.5)'
                          : '1px solid rgba(255, 79, 0, 0.35)',
                        color: automationConfig.status === 'ACTIVE' ? '#10b981' : 'var(--text-primary)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: automationConfig.status === 'ACTIVE' ? '#10b981' : '#ff4f00'
                      }} />
                      <span>⚡ 24h Autopilot: {automationConfig.status === 'ACTIVE' ? `Active (Day ${Number(automationConfig.completedDays || 0) + 1}/${automationConfig.totalDays || '∞'})` : 'Automate Videos'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Desktop Toolbar Layout: Spacious Single Row ── */
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '4px 10px', borderRadius: '99px',
                    background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                    fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)'
                  }}>
                    <Sparkles size={11} color="var(--accent-primary, #ff4f00)" />
                    Autonomous Video Workflows (75s+)
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    Autonomous Engine Connected
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                          {channels.length > 1 ? (
                            <select
                              value={selectedChannel?.channelId || ''}
                              onChange={(e) => setSelectedChannelId(e.target.value)}
                              title="Active YouTube Upload Channel"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 700,
                                outline: 'none',
                                cursor: 'pointer',
                                maxWidth: '190px'
                              }}
                            >
                              {channels.map((c) => (
                                <option key={c.channelId} value={c.channelId} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                                  {c.channelTitle || c.title || 'Channel'}{c.isDefault ? ' (Default)' : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {selectedChannel?.channelTitle || selectedChannel?.title || 'YouTube Connected'}
                            </span>
                          )}
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

                  {/* Daily Quota Badge */}
                  {user && (
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playSfx('click');
                        setShowLimitModal(true);
                      }}
                      title="Click to view 24-hour quota details & countdown"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '5px 12px', borderRadius: '99px',
                        background: quotaStatus.maintenanceMode
                          ? 'rgba(239, 68, 68, 0.12)'
                          : quotaStatus.isLimitReached
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'rgba(16, 185, 129, 0.12)',
                        border: `1px solid ${
                          quotaStatus.maintenanceMode
                            ? 'rgba(239, 68, 68, 0.35)'
                            : quotaStatus.isLimitReached
                              ? 'rgba(245, 158, 11, 0.35)'
                              : 'rgba(16, 185, 129, 0.35)'
                        }`,
                        color: quotaStatus.maintenanceMode
                          ? '#ef4444'
                          : quotaStatus.isLimitReached
                            ? '#f59e0b'
                            : '#10b981',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {quotaStatus.maintenanceMode ? (
                        <>
                          <AlertTriangle size={14} />
                          <span>Maintenance Active</span>
                        </>
                      ) : quotaStatus.isLimitReached ? (
                        <>
                          <Lock size={13} />
                          <span>Daily Limit Reached (0/{quotaStatus.dailyLimit}) {countdownText ? `· Resets in ${countdownText}` : ''}</span>
                        </>
                      ) : (
                        <>
                          <Zap size={13} fill="#10b981" />
                          <span>Daily Quota: {quotaStatus.remaining}/{quotaStatus.dailyLimit} Video{quotaStatus.dailyLimit > 1 ? 's' : ''} Left</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* ⚡ Automate Section in Top Right Corner */}
                  {user && (
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playSfx('click');
                        setShowAutomateModal(true);
                      }}
                      title="Autonomous 24-Hour Video Autopilot Engine"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '5px 14px',
                        borderRadius: '99px',
                        background: automationConfig.status === 'ACTIVE'
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(6, 182, 212, 0.15))'
                          : 'linear-gradient(135deg, rgba(255, 79, 0, 0.15), rgba(139, 92, 246, 0.12))',
                        border: automationConfig.status === 'ACTIVE'
                          ? '1px solid rgba(16, 185, 129, 0.5)'
                          : '1px solid rgba(255, 79, 0, 0.4)',
                        color: automationConfig.status === 'ACTIVE' ? '#10b981' : 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: automationConfig.status === 'ACTIVE' ? '0 0 16px rgba(16, 185, 129, 0.2)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: automationConfig.status === 'ACTIVE' ? '#10b981' : '#ff4f00',
                        boxShadow: automationConfig.status === 'ACTIVE' ? '0 0 8px #10b981' : 'none'
                      }} />
                      <span>⚡ Automate</span>
                      <span style={{
                        padding: '1px 7px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: automationConfig.status === 'ACTIVE' ? 'rgba(16,185,129,0.2)' : 'rgba(255,79,0,0.15)',
                        color: automationConfig.status === 'ACTIVE' ? '#10b981' : '#ff4f00'
                      }}>
                        {automationConfig.status === 'ACTIVE'
                          ? `Day ${Number(automationConfig.completedDays || 0) + 1}/${automationConfig.totalDays || '∞'}`
                          : '24h Autopilot'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <h1 className="font-display" style={{
              fontSize: isMobile ? '22px' : 'clamp(26px, 3.5vw, 34px)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              margin: '0 0 6px 0',
              lineHeight: 1.25
            }}>
              Autonomous AI Templates
            </h1>
            <p style={{
              fontSize: isMobile ? '12.5px' : '14px',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: isMobile ? 1.5 : 1.55,
              maxWidth: '680px'
            }}>
              Instant 1-click video creation. Researches compelling unrepeated stories, crafts high-retention 5-act screenplays, renders 1080p AI video scenes, and publishes directly to YouTube Shorts.
            </p>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px',
              marginTop: '10px', padding: isMobile ? '7px 10px' : '4px 10px', borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#f59e0b', fontSize: isMobile ? '11px' : '11.5px', fontWeight: 600, lineHeight: 1.4
            }}>
              <span style={{ flexShrink: 0 }}>🇮🇳</span>
              <span>Note: These autonomous templates only produce Hindi language videos (Hindi narration & subtitles).</span>
            </div>

            {/* Maintenance Mode Banner */}
            {quotaStatus.maintenanceMode && (
              <div style={{
                marginTop: '12px', padding: isMobile ? '12px' : '12px 16px', borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444', fontSize: isMobile ? '12px' : '13px', display: 'flex', alignItems: 'flex-start', gap: '10px'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Platform Maintenance:</strong> {quotaStatus.maintenanceNotice || 'AI Template generation is temporarily paused by the administrator for scheduled system updates.'}
                </div>
              </div>
            )}

            {/* Daily Limit Cooldown Banner */}
            {quotaStatus.isLimitReached && !quotaStatus.maintenanceMode && (
              <div style={{
                marginTop: '12px', padding: isMobile ? '12px' : '12px 16px', borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#f59e0b', fontSize: isMobile ? '12px' : '13px',
                display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                justifyContent: 'space-between', gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Clock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>24-Hour Cooldown Active:</strong> Limit of {quotaStatus.dailyLimit} video{quotaStatus.dailyLimit > 1 ? 's' : ''} reached today. Next unlocks in <strong>{countdownText || '24 hours'}</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLimitModal(true)}
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: '#f59e0b', padding: isMobile ? '8px 12px' : '4px 10px', borderRadius: '6px',
                    fontSize: isMobile ? '11.5px' : '11px', fontWeight: 700, cursor: 'pointer',
                    textAlign: 'center', width: isMobile ? '100%' : 'auto'
                  }}
                >
                  View Details
                </button>
              </div>
            )}
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
                    download="viral-short.mp4"
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
                prompt={(customTopics[generatingTpl.id] || '').trim() || `${generatingTpl.title} (Autonomous Short)`}
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

          {/* ═══ FRIENDLY ERROR & 5-MINUTE RECOVERY BANNER ═══ */}
          {!isGenerating && failedExecutionInfo && (
            <div style={{
              marginBottom: '36px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.06) 100%)',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '20px',
              padding: '24px 28px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 12px 36px rgba(239, 68, 68, 0.12)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ef4444', flexShrink: 0
                  }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                        Generation Encountered an Issue
                      </h4>
                      <span style={{
                        background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)',
                        color: '#22c55e', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <span>🛡️</span>
                        <span>Credit 100% Preserved</span>
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      {failedExecutionInfo.errorMessage || "Our AI rendering engine encountered an unexpected hiccup while processing your video. Don't worry — your credit has been 100% preserved and restored to your account."}
                    </p>
                    {failedExecutionInfo.topic && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <strong>Topic:</strong> "{failedExecutionInfo.topic}"
                      </div>
                    )}
                    {failedExecutionInfo.failedNode && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', opacity: 0.8 }}>
                        Halted at step: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{failedExecutionInfo.failedNode}</code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action / Countdown Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '180px' }}>
                  {retryCooldownSeconds > 0 ? (
                    <button
                      type="button"
                      disabled
                      style={{
                        padding: '10px 18px', borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700,
                        cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                    >
                      <Clock size={15} />
                      <span>Retry in {Math.floor(retryCooldownSeconds / 60)}:{String(retryCooldownSeconds % 60).padStart(2, '0')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playSfx('shimmer');
                        const tplId = failedExecutionInfo.templateId;
                        handleLaunchTemplate(tplId, { isRetry: true });
                      }}
                      style={{
                        padding: '10px 20px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ff4f00 0%, #ff8700 100%)',
                        border: 'none', color: '#ffffff', fontSize: '13px', fontWeight: 800,
                        cursor: 'pointer', boxShadow: '0 4px 18px rgba(255, 79, 0, 0.4)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
                    >
                      <RefreshCw size={15} />
                      <span>Retry Video Generation</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFailedExecutionInfo(null)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-muted)',
                      fontSize: '11.5px', cursor: 'pointer', padding: '4px 6px',
                      textDecoration: 'underline'
                    }}
                  >
                    Dismiss notice
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ ACTIVE TEMPLATES CARD GALLERY ═══ */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Featured Production Pipelines ({filteredActive.length})
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                1-Click Ready · Full Video Arc (75s+)
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
                  const isTimeTravel = tpl.id === 'time-travel-influencer';
                  const isFamilyDrama = tpl.id === 'family-micro-drama';
                  const isNativeAudio = isTimeTravel || isFamilyDrama || !!tpl.isNativeVoice;
                  const missingCast = GHAR_KI_KAHANI_CHARACTERS.filter(c => c.required && !castPhotos[c.id]);
                  const hasRequiredGkkCast = missingCast.length === 0;
                  const savedRequiredCount = GHAR_KI_KAHANI_CHARACTERS.filter(c => c.required && Boolean(castPhotos[c.id])).length;
                  const isGkkBlocked = isFamilyDrama && !hasRequiredGkkCast;

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
                            Sample: {tpl.sampleLine || tpl.videoTitle}
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
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            marginTop: '6px', fontSize: '11px', color: '#f59e0b', fontWeight: 600
                          }}>
                            <span>🇮🇳</span>
                            <span>Produces Hindi language videos only</span>
                          </div>

                          {/* Specific badges if declared */}
                          {Array.isArray(tpl.badges) && (
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {tpl.badges.map((b, bi) => (
                                <span key={bi} style={{
                                  fontSize: '10px', fontWeight: 700, color: tpl.color || '#e11d48',
                                  background: `${tpl.color || '#e11d48'}15`, border: `1px solid ${tpl.color || '#e11d48'}30`,
                                  padding: '1px 6px', borderRadius: '4px'
                                }}>
                                  {b}
                                </span>
                              ))}
                            </div>
                          )}
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
                          {isNativeAudio ? (
                            <span style={{
                              fontSize: '11px', fontWeight: 700, color: tpl.color || '#10b981',
                              background: `${tpl.color || '#10b981'}15`, border: `1px solid ${tpl.color || '#10b981'}30`,
                              padding: '3px 8px', borderRadius: '6px'
                            }}>
                              🗣️ Native Character Voice
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                              background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                              padding: '3px 8px', borderRadius: '6px'
                            }}>
                              🎙️ {activeVoiceObj?.name || 'Adam'} ({voiceSpeed.toFixed(2)}x)
                            </span>
                          )}
                          <span style={{
                            fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                            padding: '3px 8px', borderRadius: '6px'
                          }}>
                            📱 9:16 Shorts
                          </span>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, color: '#f59e0b',
                            background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)',
                            padding: '3px 8px', borderRadius: '6px'
                          }}>
                            🇮🇳 Hindi Only
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
                              <span>
                                {isCustomizing
                                  ? 'Hide Customization'
                                  : isFamilyDrama
                                  ? 'Customize Cast Photos & Episode'
                                  : isTimeTravel
                                  ? 'Customize Topic, Gender & Photo (Optional)'
                                  : 'Customize Topic, Voice & Speed'}
                              </span>
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
                              {/* Custom Topic Input (For standard narration templates only) */}
                              {!isNativeAudio && (
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
                              )}

                              {isTimeTravel && (
                                <>
                                  {/* 1. STORY MODE */}
                                  <div>
                                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', textTransform: 'uppercase' }}>
                                      <span>📖</span> Story Mode
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          audioEngine.playSfx('click');
                                          setStoryMode('library');
                                        }}
                                        style={{
                                          padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                                          background: storyMode === 'library' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                                          border: storyMode === 'library' ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                                          color: storyMode === 'library' ? '#10b981' : 'var(--text-secondary)',
                                          fontSize: '11.5px', fontWeight: storyMode === 'library' ? 700 : 500,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <span>🎲</span>
                                        <span>Random from library</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          audioEngine.playSfx('click');
                                          setStoryMode('custom');
                                        }}
                                        style={{
                                          padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                                          background: storyMode === 'custom' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                                          border: storyMode === 'custom' ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                                          color: storyMode === 'custom' ? '#10b981' : 'var(--text-secondary)',
                                          fontSize: '11.5px', fontWeight: storyMode === 'custom' ? 700 : 500,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <span>✍️</span>
                                        <span>My own topic</span>
                                      </button>
                                    </div>

                                    {storyMode === 'custom' ? (
                                      <div style={{ marginTop: '8px' }}>
                                        <input
                                          type="text"
                                          value={currentTopic}
                                          onChange={e => setCustomTopics(prev => ({ ...prev, [tpl.id]: e.target.value }))}
                                          placeholder="e.g. Stepping out of a mall elevator into dinosaur era, or saving Emperor Akbar from a tiger"
                                          style={{
                                            width: '100%', padding: '7px 10px', borderRadius: '7px',
                                            border: currentTopic.trim() ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                                            background: 'var(--bg-card)',
                                            color: 'var(--text-primary)', fontSize: '12px', outline: 'none',
                                            boxSizing: 'border-box'
                                          }}
                                        />
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                          {currentTopic.trim() ? '✅ Custom topic will be scripted with native Hindi dialogue.' : '💡 If left empty, mode automatically defaults to library.'}
                                        </span>
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '5px', display: 'block', lineHeight: 1.4 }}>
                                        💡 Auto-travels to a completely fresh, unrepeated viral adventure every time.
                                      </span>
                                    )}
                                  </div>

                                  {/* 2. SERIES MODE */}
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                      <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                                        <span>🎬</span> Series Mode
                                      </label>
                                      {loadingSeries && (
                                        <span style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <Loader2 size={11} className="spin" /> Checking series...
                                        </span>
                                      )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          audioEngine.playSfx('click');
                                          setSeriesMode('new');
                                        }}
                                        style={{
                                          padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                                          background: seriesMode === 'new' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                                          border: seriesMode === 'new' ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                                          color: seriesMode === 'new' ? '#10b981' : 'var(--text-secondary)',
                                          fontSize: '11.5px', fontWeight: seriesMode === 'new' ? 700 : 500,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <span>✨</span>
                                        <span>New story</span>
                                      </button>

                                      <button
                                        type="button"
                                        disabled={eligibleSeries.length === 0}
                                        onClick={() => {
                                          if (eligibleSeries.length > 0) {
                                            audioEngine.playSfx('click');
                                            setSeriesMode('continue');
                                            if (!selectedSeriesId) {
                                              setSelectedSeriesId(eligibleSeries[0].seriesId);
                                            }
                                          }
                                        }}
                                        style={{
                                          padding: '8px 10px', borderRadius: '8px',
                                          cursor: eligibleSeries.length === 0 ? 'not-allowed' : 'pointer',
                                          background: seriesMode === 'continue' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                                          border: seriesMode === 'continue' ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                                          color: seriesMode === 'continue' ? '#10b981' : (eligibleSeries.length === 0 ? 'var(--text-muted)' : 'var(--text-secondary)'),
                                          opacity: eligibleSeries.length === 0 ? 0.6 : 1,
                                          fontSize: '11.5px', fontWeight: seriesMode === 'continue' ? 700 : 500,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <span>⏳</span>
                                        <span>Continue a series</span>
                                        {eligibleSeries.length > 0 && (
                                          <span style={{ background: '#10b981', color: '#ffffff', borderRadius: '99px', fontSize: '10px', padding: '1px 6px', fontWeight: 700 }}>
                                            {eligibleSeries.length}
                                          </span>
                                        )}
                                      </button>
                                    </div>

                                    {eligibleSeries.length === 0 ? (
                                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '5px', display: 'block' }}>
                                        No series ready for Part 2 on this channel
                                      </span>
                                    ) : seriesMode === 'continue' ? (
                                      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                                          Select series to produce Part 2:
                                        </span>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                                          {eligibleSeries.map(s => {
                                            const isSel = selectedSeriesId === s.seriesId;
                                            return (
                                              <div
                                                key={s.seriesId}
                                                onClick={() => {
                                                  audioEngine.playSfx('click');
                                                  setSelectedSeriesId(s.seriesId);
                                                }}
                                                style={{
                                                  padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                                                  background: isSel ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                                                  border: isSel ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                                                  transition: 'all 0.15s ease'
                                                }}
                                              >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                                  {s.characterImageUrl && (
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-subtle)' }}>
                                                      <img
                                                        src={s.characterImageUrl}
                                                        alt="Character"
                                                        onError={e => { e.currentTarget.style.display = 'none'; }}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                      />
                                                    </div>
                                                  )}
                                                  <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontSize: '11.5px', fontWeight: isSel ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                      {s.title}
                                                    </div>
                                                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                                                      ID: {s.seriesId} {s.part1CompletedAt ? `· ${new Date(s.part1CompletedAt).toLocaleDateString()}` : ''}
                                                    </div>
                                                  </div>
                                                </div>
                                                <span style={{
                                                  fontSize: '10px', fontWeight: 700, color: '#10b981',
                                                  background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                                                  padding: '2px 6px', borderRadius: '4px', flexShrink: 0
                                                }}>
                                                  Part 2 ready
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>

                                  {/* 3. CHARACTER MODE */}
                                  <div>
                                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', textTransform: 'uppercase' }}>
                                      <span>👤</span> Character Mode
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                      {/* Option 1: Use channel face */}
                                      <button
                                        type="button"
                                        disabled={!selectedChannel?.characterImageUrl}
                                        onClick={() => {
                                          if (selectedChannel?.characterImageUrl) {
                                            audioEngine.playSfx('click');
                                            setCharacterMode('channel');
                                          }
                                        }}
                                        style={{
                                          padding: '7px 8px', borderRadius: '8px',
                                          cursor: !selectedChannel?.characterImageUrl ? 'not-allowed' : 'pointer',
                                          background: characterMode === 'channel' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                                          border: characterMode === 'channel' ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                                          color: characterMode === 'channel' ? '#10b981' : (!selectedChannel?.characterImageUrl ? 'var(--text-muted)' : 'var(--text-secondary)'),
                                          opacity: !selectedChannel?.characterImageUrl ? 0.5 : 1,
                                          fontSize: '11px', fontWeight: characterMode === 'channel' ? 700 : 500,
                                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <span>⭐</span>
                                        <span>Use channel face</span>
                                      </button>

                                      {/* Option 2: Upload photo */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          audioEngine.playSfx('click');
                                          setCharacterMode('upload');
                                        }}
                                        style={{
                                          padding: '7px 8px', borderRadius: '8px', cursor: 'pointer',
                                          background: characterMode === 'upload' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                                          border: characterMode === 'upload' ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                                          color: characterMode === 'upload' ? '#10b981' : 'var(--text-secondary)',
                                          fontSize: '11px', fontWeight: characterMode === 'upload' ? 700 : 500,
                                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <span>📸</span>
                                        <span>Upload photo</span>
                                      </button>

                                      {/* Option 3: Random new character */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          audioEngine.playSfx('click');
                                          setCharacterMode('random');
                                        }}
                                        style={{
                                          padding: '7px 8px', borderRadius: '8px', cursor: 'pointer',
                                          background: characterMode === 'random' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                                          border: characterMode === 'random' ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                                          color: characterMode === 'random' ? '#10b981' : 'var(--text-secondary)',
                                          fontSize: '11px', fontWeight: characterMode === 'random' ? 700 : 500,
                                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <span>✨</span>
                                        <span>Random new</span>
                                      </button>
                                    </div>

                                    {/* Details based on character mode */}
                                    {characterMode === 'channel' && selectedChannel?.characterImageUrl && (
                                      <div style={{
                                        marginTop: '8px', padding: '8px 10px', borderRadius: '8px',
                                        background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)',
                                        display: 'flex', alignItems: 'center', gap: '10px'
                                      }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #10b981', flexShrink: 0 }}>
                                          <img
                                            src={selectedChannel.characterImageUrl}
                                            alt={selectedChannel.characterName || 'Channel Face'}
                                            onError={e => { e.currentTarget.style.display = 'none'; }}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                          />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {selectedChannel.characterName || 'Saved Channel Face'}
                                          </div>
                                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                            Permanent actor for {selectedChannel.channelTitle || selectedChannel.title}
                                            {selectedChannel.characterGender ? ` · ${selectedChannel.characterGender}` : ''}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {characterMode === 'upload' && (
                                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                                            Character Photo URL:
                                          </span>
                                          {characterImageUrl.trim() && (
                                            <button
                                              type="button"
                                              onClick={() => setCharacterImageUrl('')}
                                              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                            >
                                              ✕ Clear
                                            </button>
                                          )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                          <input
                                            type="url"
                                            value={characterImageUrl}
                                            onChange={e => setCharacterImageUrl(e.target.value)}
                                            placeholder="https://i.ibb.co/...jpg (direct image URL)"
                                            style={{
                                              flex: 1, padding: '7px 10px', borderRadius: '7px',
                                              border: characterImageUrl.trim() ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                                              background: 'var(--bg-card)',
                                              color: 'var(--text-primary)', fontSize: '12px', outline: 'none',
                                              boxSizing: 'border-box'
                                            }}
                                          />
                                          {characterImageUrl.trim() && (
                                            <div style={{ width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #10b981', flexShrink: 0 }}>
                                              <img
                                                src={characterImageUrl.trim()}
                                                alt="Preview"
                                                onError={e => { e.currentTarget.style.display = 'none'; }}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                              />
                                            </div>
                                          )}
                                        </div>

                                        {/* Checkbox: Also save this photo as my channel face */}
                                        <div
                                          onClick={() => setSaveChannelFaceCheckbox(prev => !prev)}
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: '7px', marginTop: '4px', cursor: 'pointer', userSelect: 'none'
                                          }}
                                        >
                                          <div style={{
                                            width: '16px', height: '16px', borderRadius: '4px',
                                            border: saveChannelFaceCheckbox ? '1.5px solid #10b981' : '1.5px solid var(--border-medium)',
                                            background: saveChannelFaceCheckbox ? '#10b981' : 'var(--bg-card)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease'
                                          }}>
                                            {saveChannelFaceCheckbox && <Check size={12} color="#ffffff" strokeWidth={3} />}
                                          </div>
                                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: saveChannelFaceCheckbox ? 600 : 400 }}>
                                            Also save this photo as my channel face
                                          </span>
                                        </div>

                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                          Host your photo for free on <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'underline' }}>ImgBB ↗</a> and paste direct link.
                                        </span>
                                      </div>
                                    )}

                                    {characterMode === 'random' && (
                                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '5px', display: 'block' }}>
                                        🎲 AI will invent and cast a fresh new character for this adventure.
                                      </span>
                                    )}
                                  </div>

                                  {/* 4. GENDER SELECTION (preserved as before) */}
                                  <div>
                                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', textTransform: 'uppercase' }}>
                                      <span>👤</span> Character Gender (Optional)
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                      {[
                                        { id: 'auto', label: 'Auto / Balanced', icon: '✨' },
                                        { id: 'female', label: 'Female (Cute Girl)', icon: '👩' },
                                        { id: 'male', label: 'Male (Handsome Guy)', icon: '👨' }
                                      ].map(g => {
                                        const isSel = influencerGender === g.id;
                                        return (
                                          <button
                                            key={g.id}
                                            type="button"
                                            onClick={() => setInfluencerGender(g.id)}
                                            style={{
                                              padding: '6px 8px', borderRadius: '8px', cursor: 'pointer',
                                              background: isSel ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                                              border: isSel ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                                              color: isSel ? '#10b981' : 'var(--text-secondary)',
                                              fontSize: '11px', fontWeight: isSel ? 700 : 500,
                                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                              transition: 'all 0.15s ease'
                                            }}
                                          >
                                            <span>{g.icon}</span>
                                            <span>{g.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                      Auto balances between high-retention female vloggers and charismatic male creators.
                                    </span>
                                  </div>

                                  <div style={{
                                    padding: '6px 8px', borderRadius: '6px',
                                    background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
                                    fontSize: '10.5px', color: '#10b981'
                                  }}>
                                    ✨ Subtitles and background music are automatically applied from your <strong>Design Studio</strong> settings.
                                  </div>
                                </>
                              )}

                              {isFamilyDrama && (
                                <>
                                  {/* 1. CAST PHOTOS PANEL */}
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                      <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                                        <span>🎭</span> Cast Reference Photos
                                      </label>
                                      <span style={{
                                        fontSize: '10px', fontWeight: 700,
                                        padding: '1px 6px', borderRadius: '4px',
                                        background: hasRequiredGkkCast ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                        color: hasRequiredGkkCast ? '#10b981' : '#f59e0b',
                                        border: hasRequiredGkkCast ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                                      }}>
                                        {hasRequiredGkkCast ? '✓ 5 of 5 Required Saved' : `${savedRequiredCount} of 5 Required`}
                                      </span>
                                    </div>

                                    <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                                      Upload photo URLs for the Pune family members. The 5 required characters must be saved to enable generation.
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {GHAR_KI_KAHANI_CHARACTERS.map(char => {
                                        const savedUrl = castPhotos[char.id];
                                        const isSaving = savingCastId === char.id;
                                        const inputVal = castInputUrls[char.id] || '';

                                        return (
                                          <div
                                            key={char.id}
                                            style={{
                                              padding: '8px 10px',
                                              borderRadius: '8px',
                                              background: savedUrl ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-card)',
                                              border: savedUrl ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: '6px'
                                            }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '14px' }}>{char.avatar}</span>
                                                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                  {char.name}
                                                </span>
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                                  ({char.role})
                                                </span>
                                              </div>
                                              <span style={{
                                                fontSize: '9.5px', fontWeight: 700,
                                                padding: '1px 5px', borderRadius: '3px',
                                                background: char.required
                                                  ? (savedUrl ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)')
                                                  : 'rgba(148, 163, 184, 0.15)',
                                                color: char.required
                                                  ? (savedUrl ? '#10b981' : '#ef4444')
                                                  : 'var(--text-muted)'
                                              }}>
                                                {char.required ? (savedUrl ? '✓ Saved' : 'Required') : (savedUrl ? '✓ Saved' : 'Optional')}
                                              </span>
                                            </div>

                                            {savedUrl ? (
                                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #10b981', flexShrink: 0 }}>
                                                    <img
                                                      src={savedUrl}
                                                      alt={char.name}
                                                      onError={e => { e.currentTarget.style.display = 'none'; }}
                                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                  </div>
                                                  <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {savedUrl}
                                                  </span>
                                                </div>
                                                <button
                                                  type="button"
                                                  disabled={isSaving}
                                                  onClick={() => handleRemoveCastPhoto(char.id)}
                                                  style={{
                                                    background: 'none', border: 'none',
                                                    color: '#ef4444', fontSize: '10px', fontWeight: 700,
                                                    cursor: isSaving ? 'not-allowed' : 'pointer', padding: '3px 6px',
                                                    borderRadius: '4px'
                                                  }}
                                                >
                                                  {isSaving ? '...' : '✕ Remove'}
                                                </button>
                                              </div>
                                            ) : (
                                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <input
                                                  type="url"
                                                  value={inputVal}
                                                  onChange={e => setCastInputUrls(prev => ({ ...prev, [char.id]: e.target.value }))}
                                                  placeholder="https://i.ibb.co/...jpg (direct image link)"
                                                  style={{
                                                    flex: 1, padding: '6px 9px', borderRadius: '6px',
                                                    border: '1px solid var(--border-subtle)', background: 'var(--bg-card)',
                                                    color: 'var(--text-primary)', fontSize: '11px', outline: 'none',
                                                    boxSizing: 'border-box'
                                                  }}
                                                />
                                                <button
                                                  type="button"
                                                  disabled={isSaving || !inputVal.trim()}
                                                  onClick={() => handleSaveCastPhoto(char.id)}
                                                  style={{
                                                    padding: '6px 12px', borderRadius: '6px', border: 'none',
                                                    background: inputVal.trim() ? '#e11d48' : 'var(--bg-input)',
                                                    color: inputVal.trim() ? '#ffffff' : 'var(--text-muted)',
                                                    fontSize: '11px', fontWeight: 700,
                                                    cursor: (isSaving || !inputVal.trim()) ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    flexShrink: 0
                                                  }}
                                                >
                                                  {isSaving ? '...' : 'Save'}
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                                      Host photos free on <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" style={{ color: '#e11d48', fontWeight: 700, textDecoration: 'underline' }}>ImgBB ↗</a> and paste direct link.
                                    </span>
                                  </div>

                                  {/* 2. EPISODE CHOICE PANEL */}
                                  <div style={{ marginTop: '8px' }}>
                                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', textTransform: 'uppercase' }}>
                                      <span>🎬</span> Episode Choice
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          audioEngine.playSfx('click');
                                          setEpisodeMode('next');
                                        }}
                                        style={{
                                          padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                                          background: episodeMode === 'next' ? 'rgba(225, 29, 72, 0.15)' : 'var(--bg-card)',
                                          border: episodeMode === 'next' ? '1.5px solid #e11d48' : '1px solid var(--border-subtle)',
                                          color: episodeMode === 'next' ? '#e11d48' : 'var(--text-secondary)',
                                          fontSize: '11.5px', fontWeight: episodeMode === 'next' ? 700 : 500,
                                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <span>📅 Next in Season</span>
                                        <span style={{ fontSize: '9.5px', opacity: 0.8 }}>Sequential Season 1 arc</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          audioEngine.playSfx('click');
                                          setEpisodeMode('custom');
                                        }}
                                        style={{
                                          padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                                          background: episodeMode === 'custom' ? 'rgba(225, 29, 72, 0.15)' : 'var(--bg-card)',
                                          border: episodeMode === 'custom' ? '1.5px solid #e11d48' : '1px solid var(--border-subtle)',
                                          color: episodeMode === 'custom' ? '#e11d48' : 'var(--text-secondary)',
                                          fontSize: '11.5px', fontWeight: episodeMode === 'custom' ? 700 : 500,
                                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                                          transition: 'all 0.15s ease'
                                        }}
                                      >
                                        <span>✍️ My Own Episode Idea</span>
                                        <span style={{ fontSize: '9.5px', opacity: 0.8 }}>Custom scenario (max 300)</span>
                                      </button>
                                    </div>

                                    {episodeMode === 'custom' ? (
                                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                                            Write your episode scenario:
                                          </span>
                                          <span style={{ fontSize: '10px', color: customEpisodeIdea.length > 280 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                                            {customEpisodeIdea.length}/300
                                          </span>
                                        </div>
                                        <textarea
                                          value={customEpisodeIdea}
                                          onChange={e => setCustomEpisodeIdea(e.target.value.slice(0, 300))}
                                          maxLength={300}
                                          rows={3}
                                          placeholder="e.g. Chhota finds an old brass key hidden inside Dadi's harmonium that matches the lock on the steel tin box..."
                                          style={{
                                            width: '100%', padding: '8px 10px', borderRadius: '8px',
                                            border: customEpisodeIdea.trim() ? '1.5px solid #e11d48' : '1px solid var(--border-subtle)',
                                            background: 'var(--bg-card)', color: 'var(--text-primary)',
                                            fontSize: '12px', outline: 'none', resize: 'vertical',
                                            boxSizing: 'border-box'
                                          }}
                                        />

                                        {/* Content rules notice */}
                                        <div style={{
                                          padding: '7px 10px', borderRadius: '7px',
                                          background: 'rgba(245, 158, 11, 0.08)',
                                          border: '1px solid rgba(245, 158, 11, 0.25)',
                                          fontSize: '10px', color: '#f59e0b', lineHeight: 1.4
                                        }}>
                                          ⚠️ <strong>Content Rules:</strong> The idea must follow the content rules: no real people, brands, or news; no violence against children or women as entertainment; no religious mockery; no sexual content.
                                        </div>
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '5px', display: 'block', lineHeight: 1.4 }}>
                                        💡 Autonomously follows the show bible Season 1 episode progression for the Pune family and the mysterious locked steel tin box.
                                      </span>
                                    )}
                                  </div>

                                  <div style={{
                                    padding: '6px 8px', borderRadius: '6px',
                                    background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.2)',
                                    fontSize: '10.5px', color: '#e11d48'
                                  }}>
                                    ✨ Subtitles and background music are automatically applied from your <strong>Design Studio</strong> settings.
                                  </div>
                                </>
                              )}

                              {!isNativeAudio && (
                                <>
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
                                </>
                              )}
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
                            {(selectedChannel?.channelTitle || selectedChannel?.title) ? (
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {selectedChannel.channelTitle || selectedChannel.title}
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

                        {/* Cast requirement banner for Ghar Ki Kahani */}
                        {isGkkBlocked && (
                          <div style={{
                            padding: '6px 10px', borderRadius: '7px',
                            background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)',
                            fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px'
                          }}>
                            <span>⚠️</span>
                            <span>Missing required cast photos ({missingCast.map(c => c.name).join(', ')}). Expand customization above to save.</span>
                          </div>
                        )}

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
                            {quotaStatus.maintenanceMode ? (
                              <button
                                disabled
                                style={{
                                  flex: 1, padding: '10px 16px', borderRadius: '10px', border: 'none',
                                  cursor: 'not-allowed',
                                  fontSize: '13px', fontWeight: 700, color: '#94a3b8',
                                  background: 'var(--bg-input)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                  opacity: 0.7
                                }}
                              >
                                <AlertTriangle size={14} />
                                <span>Maintenance Active</span>
                              </button>
                            ) : quotaStatus.isLimitReached ? (
                              <button
                                type="button"
                                onClick={() => {
                                  audioEngine.playSfx('warning');
                                  setShowLimitModal(true);
                                }}
                                style={{
                                  flex: 1, padding: '10px 14px', borderRadius: '10px',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                  cursor: 'pointer',
                                  fontSize: '12.5px', fontWeight: 700,
                                  color: '#f59e0b',
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}
                              >
                                <Lock size={14} />
                                <span>Daily Limit Reached ({countdownText || 'Locked'})</span>
                              </button>
                            ) : isGkkBlocked ? (
                              <button
                                type="button"
                                disabled
                                style={{
                                  flex: 1, padding: '10px 14px', borderRadius: '10px',
                                  border: '1px solid rgba(245, 158, 11, 0.4)',
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  color: '#f59e0b', fontSize: '12px', fontWeight: 700,
                                  cursor: 'not-allowed',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}
                                title={`Missing required cast photos: ${missingCast.map(c => c.name).join(', ')}. Expand customization above to save.`}
                              >
                                <Lock size={13} />
                                <span>Save 5 Required Cast First ({missingCast.length} left)</span>
                              </button>
                            ) : (
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
                                  <><Zap size={14} fill="#ffffff" /><span>1-Click Generate (75s+)</span></>
                                )}
                              </button>
                            )}

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
              gridTemplateColumns: isMobile ? '1fr' : '230px minmax(0, 1fr)',
              gap: isMobile ? '16px' : '24px',
              padding: isMobile ? '16px' : '24px',
              alignItems: 'center'
            }}>
              {/* Vertical Phone Screen */}
              <div style={{
                width: isMobile ? '200px' : '230px',
                height: isMobile ? '355px' : '408px',
                borderRadius: '24px',
                border: '3px solid var(--border-medium)', background: '#000',
                overflow: 'hidden', position: 'relative', margin: '0 auto',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column'
              }}>
                {previewTemplate.youtubeId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${previewTemplate.youtubeId}?autoplay=1&modestbranding=1&rel=0&playsinline=1`}
                    title={previewTemplate.videoTitle || previewTemplate.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      display: 'block'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {/* Right column specs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, color: previewTemplate.color,
                    background: `${previewTemplate.color}18`, padding: '2px 8px', borderRadius: '6px',
                    display: 'inline-block', marginBottom: '6px'
                  }}>
                    {previewTemplate.label} · 75s+ Short Arc
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
                    <strong>Screenplay:</strong> 5 acts, cinematic pacing (Hook → Build → Climax)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <strong>AI Engine:</strong> {previewTemplate.aiBrain}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <strong>Format:</strong> 1080×1920 (9:16) with Dynamic Captions
                  </div>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                    <strong>Language:</strong> 🇮🇳 Hindi language videos only
                  </div>
                </div>

                {previewTemplate.youtubeUrl && (
                  <a
                    href={previewTemplate.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      width: '100%'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.5)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.35)';
                    }}
                  >
                    <YouTubeIcon size={18} />
                    <span>Watch Full Sample on YouTube</span>
                    <ExternalLink size={13} style={{ marginLeft: 'auto' }} />
                  </a>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                  {quotaStatus.maintenanceMode ? (
                    <button
                      type="button"
                      disabled
                      style={{
                        flex: 1, padding: '10px 16px', borderRadius: '10px', border: 'none',
                        color: '#94a3b8', background: 'var(--bg-input)', fontSize: '13px', fontWeight: 700, cursor: 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <AlertTriangle size={14} />
                      <span>Maintenance Active</span>
                    </button>
                  ) : quotaStatus.isLimitReached ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewTemplate(null);
                        audioEngine.playSfx('warning');
                        setShowLimitModal(true);
                      }}
                      style={{
                        flex: 1, padding: '10px 16px', borderRadius: '10px',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)',
                        fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <Lock size={14} />
                      <span>Daily Limit Reached ({countdownText || 'Locked'})</span>
                    </button>
                  ) : (
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DAILY LIMIT DETAILS MODAL ═══ */}
      {showLimitModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.82)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%', maxWidth: '480px',
            background: 'var(--bg-card)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '20px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(245, 158, 11, 0.15)',
            padding: '28px',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#f59e0b'
                }}>
                  <Lock size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Daily Generation Quota
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    24-Hour Pipeline Allocation Policy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLimitModal(false)}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)', width: '32px', height: '32px', borderRadius: '50%',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quota details text */}
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Each creator can generate <strong style={{ color: 'var(--text-primary)' }}>{quotaStatus.dailyLimit} AI template video{quotaStatus.dailyLimit > 1 ? 's' : ''}</strong> per 24 hours. This rule preserves GPU rendering clusters, ElevenLabs narration synthesis, and guarantees cinematic 1080p quality for all creators without server congestion.
            </p>

            {/* Countdown Display Box */}
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                {quotaStatus.isLimitReached ? 'Next Available Video Unlocks In' : 'Current 24h Quota Status'}
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '28px',
                fontWeight: 800,
                color: quotaStatus.isLimitReached ? '#f59e0b' : '#10b981',
                letterSpacing: '0.05em',
                textShadow: quotaStatus.isLimitReached ? '0 0 16px rgba(245, 158, 11, 0.4)' : '0 0 16px rgba(16, 185, 129, 0.4)'
              }}>
                {quotaStatus.isLimitReached ? (countdownText || '24h 00m 00s') : `${quotaStatus.remaining} / ${quotaStatus.dailyLimit} Available`}
              </div>
              {quotaStatus.nextResetTime && (
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Exact Reset Time: <strong>{new Date(quotaStatus.nextResetTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(quotaStatus.nextResetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
              )}
            </div>

            {/* Info bullet points */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span>All previously rendered videos remain permanently saved in your studio library.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={14} color="#6366f1" />
                <span>Admin limits can be adjusted or reset anytime by platform administrators.</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowLimitModal(false);
                  if (typeof onNavigate === 'function') onNavigate('dashboard');
                }}
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: '10px',
                  background: 'var(--accent-primary, #ff4f00)', border: 'none',
                  color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <span>Open Studio Dashboard</span>
                <ExternalLink size={13} />
              </button>
              <button
                type="button"
                onClick={() => setShowLimitModal(false)}
                style={{
                  padding: '11px 18px', borderRadius: '10px',
                  background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ⚡ AUTONOMOUS 24-HOUR VIDEO AUTOPILOT MODAL ═══ */}
      {showAutomateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: isMobile ? '12px' : '24px'
        }}>
          <div style={{
            width: '100%', maxWidth: '640px', maxHeight: '90vh',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            padding: isMobile ? '18px 16px' : '24px 24px',
            display: 'flex', flexDirection: 'column', gap: '18px',
            overflowY: 'auto'
          }}>
            {/* Minimal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(255, 79, 0, 0.1)',
                  border: '1px solid rgba(255, 79, 0, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-primary, #ff4f00)',
                  flexShrink: 0
                }}>
                  <Zap size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Template Automation
                    </h2>
                    <span style={{
                      padding: '2px 7px', borderRadius: '99px',
                      background: automationConfig.status === 'ACTIVE' ? 'rgba(16,185,129,0.15)' : 'rgba(156,163,175,0.15)',
                      color: automationConfig.status === 'ACTIVE' ? '#10b981' : 'var(--text-muted)',
                      fontSize: '10.5px', fontWeight: 700
                    }}>
                      ● {automationConfig.status === 'ACTIVE' ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p style={{ margin: '1px 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Auto-generates and publishes every 24 hours to your channel.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAutomateModal(false)}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--text-muted)', width: '28px', height: '28px', borderRadius: '8px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Status Toast Message */}
            {autoStatusMessage && (
              <div style={{
                padding: '8px 12px', borderRadius: '10px',
                background: autoStatusMessage.startsWith('❌') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${autoStatusMessage.startsWith('❌') ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                color: autoStatusMessage.startsWith('❌') ? '#ef4444' : '#10b981',
                fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <span>{autoStatusMessage.startsWith('❌') ? '⚠️' : '⚡'}</span>
                <span>{autoStatusMessage}</span>
              </div>
            )}

            {/* Cycle Status & Quick Controls */}
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '10px'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 700, color: automationConfig.status === 'ACTIVE' ? '#10b981' : 'var(--text-muted)' }}>
                  {automationConfig.status === 'ACTIVE' ? (
                    automationConfig.nextRunAt ? (
                      `Next video in ${Math.max(0, Math.floor((new Date(automationConfig.nextRunAt) - Date.now()) / 3600000))}h ${Math.max(0, Math.floor(((new Date(automationConfig.nextRunAt) - Date.now()) % 3600000) / 60000))}m`
                    ) : 'Scheduled daily'
                  ) : 'Autopilot paused'}
                </span>
                <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>·</span>
                <span>Day {automationConfig.completedDays || 0} {automationConfig.totalDays > 0 ? `of ${automationConfig.totalDays}` : '(Ongoing)'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleToggleAutomation}
                  disabled={savingAutomation}
                  style={{
                    padding: '6px 11px', borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  {automationConfig.status === 'ACTIVE' ? <Pause size={12} /> : <Play size={12} />}
                  <span>{automationConfig.status === 'ACTIVE' ? 'Pause' : 'Resume'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerRunNow}
                  disabled={triggeringRunNow || savingAutomation}
                  style={{
                    padding: '6px 12px', borderRadius: '8px',
                    background: 'var(--accent-primary, #ff4f00)',
                    border: 'none', color: '#ffffff',
                    fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  {triggeringRunNow ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                  <span>{triggeringRunNow ? 'Running...' : 'Run Now'}</span>
                </button>
              </div>
            </div>

            {/* Destination YouTube Channel Selection */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <YouTubeIcon size={14} /> Destination YouTube Channel
                </label>
                <button
                  type="button"
                  onClick={() => { audioEngine.playSfx('click'); openGoogleOAuthPopup('templates'); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--accent-primary, #ff4f00)',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0,
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  + Connect Channel
                </button>
              </div>

              {channels.length === 0 ? (
                <div style={{
                  background: 'var(--bg-elevated)', border: '1px dashed var(--border-medium)',
                  borderRadius: '12px', padding: '14px', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    No YouTube channel connected yet.
                  </div>
                  <button
                    type="button"
                    onClick={() => { audioEngine.playSfx('click'); openGoogleOAuthPopup('templates'); }}
                    style={{
                      padding: '7px 16px', borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <YouTubeIcon size={14} /> Connect YouTube Channel
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '6px',
                  maxHeight: '190px', overflowY: channels.length > 3 ? 'auto' : 'visible'
                }}>
                  {channels.map((ch) => {
                    const isSelected = (automationConfig.selectedChannelId === ch.channelId) || (!automationConfig.selectedChannelId && ch.channelId === automationTargetChannel?.channelId);
                    const isExpired = ch.needsReconnect || ch.isTokenExpired || ch.tokens?.needsReconnect;
                    return (
                      <div
                        key={ch.channelId}
                        onClick={() => {
                          setAutomationConfig(prev => ({ ...prev, selectedChannelId: ch.channelId }));
                          setSelectedChannelId(ch.channelId);
                          audioEngine.playSfx('click');
                        }}
                        style={{
                          padding: '9px 12px', borderRadius: '10px', cursor: 'pointer',
                          background: isSelected ? 'rgba(255, 79, 0, 0.08)' : 'var(--bg-elevated)',
                          border: isSelected ? '1.5px solid var(--accent-primary, #ff4f00)' : '1px solid var(--border-subtle)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          {/* Radio Dot */}
                          <div style={{
                            width: '16px', height: '16px', borderRadius: '50%',
                            border: isSelected ? '5px solid var(--accent-primary, #ff4f00)' : '2px solid var(--border-medium)',
                            background: isSelected ? '#ffffff' : 'transparent',
                            flexShrink: 0, transition: 'all 0.15s ease'
                          }} />

                          {ch.avatarUrl ? (
                            <img
                              src={ch.avatarUrl}
                              alt={ch.channelTitle || ch.title || 'Channel'}
                              style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{
                              width: '30px', height: '30px', borderRadius: '50%',
                              background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <YouTubeIcon size={14} />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                fontSize: '12.5px', fontWeight: isSelected ? 700 : 600,
                                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                              }}>
                                {ch.channelTitle || ch.title || 'YouTube Channel'}
                              </span>
                              {ch.isDefault && (
                                <span style={{
                                  fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px',
                                  background: 'var(--bg-pill)', color: 'var(--text-muted)'
                                }}>
                                  Default
                                </span>
                              )}
                            </div>
                            {ch.customUrl && (
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                {ch.customUrl}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {isExpired ? (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); audioEngine.playSfx('shimmer'); openGoogleOAuthPopup('templates'); }}
                              style={{
                                padding: '3px 8px', borderRadius: '6px',
                                background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer'
                              }}
                            >
                              Reconnect
                            </button>
                          ) : isSelected ? (
                            <span style={{ fontSize: '11px', color: 'var(--accent-primary, #ff4f00)', fontWeight: 800 }}>
                              ✓ Active Target
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                              Select
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Template Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Template
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'world-mysteries', emoji: '🛸', title: 'World Mysteries' },
                  { id: 'last-24-hours', emoji: '⏳', title: 'Last 24 Hours' },
                  { id: '3am-horror', emoji: '👻', title: '3-AM Horror' },
                  { id: 'time-travel-influencer', emoji: '⏳', title: 'Time Travel' },
                  { id: 'family-micro-drama', emoji: '🎭', title: 'Ghar Ki Kahani' }
                ].map(t => {
                  const isSelected = automationConfig.templateId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAutomationConfig(prev => ({ ...prev, templateId: t.id }))}
                      style={{
                        padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                        background: isSelected ? 'rgba(255, 79, 0, 0.08)' : 'var(--bg-elevated)',
                        border: isSelected ? '1.5px solid var(--accent-primary, #ff4f00)' : '1px solid var(--border-subtle)',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{t.emoji}</span>
                      <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 500 }}>{t.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Template Specs & Info Summary */}
              {selectedAutomationTpl && (
                <div style={{
                  marginTop: '8px', padding: '9px 12px', borderRadius: '10px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  display: 'flex', flexDirection: 'column', gap: '6px'
                }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {selectedAutomationTpl.desc}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '2px 7px', borderRadius: '5px' }}>
                      🧠 {selectedAutomationTpl.aiBrain}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '2px 7px', borderRadius: '5px' }}>
                      📱 {selectedAutomationTpl.specs}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '2px 7px', borderRadius: '5px' }}>
                      🇮🇳 Hindi Only
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Specific Topic (Optional - Starts Empty, No Prefilled Topics) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Type size={12} /> Specific Topic <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                {automationConfig.topic ? (
                  <button
                    type="button"
                    onClick={() => setAutomationConfig(prev => ({ ...prev, topic: '' }))}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary, #ff4f00)', fontSize: '10.5px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Clear Topic
                  </button>
                ) : (
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Auto-researched by AI</span>
                )}
              </div>
              <input
                type="text"
                value={automationConfig.topic || ''}
                onChange={(e) => setAutomationConfig(prev => ({ ...prev, topic: e.target.value }))}
                placeholder={`e.g. ${selectedAutomationTpl?.videoTitle || 'Bermuda Triangle'} (or leave blank for autonomous AI research)`}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  background: 'var(--bg-input)', border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)', fontSize: '12px', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {automationConfig.topic
                  ? `AI will generate today's video specifically focused on "${automationConfig.topic}".`
                  : 'Leave blank to let the AI automatically brainstorm trending topics every day.'}
              </div>
            </div>

            {/* Duration (Pills) */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Duration
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { days: 3, label: '3 Days' },
                  { days: 7, label: '7 Days' },
                  { days: 14, label: '14 Days' },
                  { days: 30, label: '30 Days' },
                  { days: 0, label: 'Ongoing (∞)' }
                ].map(d => {
                  const isSelected = Number(automationConfig.totalDays) === d.days;
                  return (
                    <button
                      key={d.days}
                      type="button"
                      onClick={() => setAutomationConfig(prev => ({ ...prev, totalDays: d.days }))}
                      style={{
                        padding: '6px 12px', borderRadius: '8px',
                        background: isSelected ? 'var(--accent-primary, #ff4f00)' : 'var(--bg-elevated)',
                        border: isSelected ? '1px solid var(--accent-primary, #ff4f00)' : '1px solid var(--border-subtle)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '11.5px', fontWeight: isSelected ? 700 : 500, cursor: 'pointer'
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice & Speed in 2 Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mic size={12} /> Voice
                  </label>
                  {isCustomVoice && (
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '1px 5px', borderRadius: '4px' }}>
                      💎 Studio Selected
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <select
                    value={activeVoiceObj?.id || voiceId}
                    aria-label="Narration voice"
                    onChange={(e) => handleAutomateVoiceChange(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 28px 8px 10px', borderRadius: '8px',
                      background: 'var(--bg-input)', border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600,
                      outline: 'none', cursor: 'pointer', appearance: 'none'
                    }}
                  >
                    {isCustomVoice && activeVoiceObj && (
                      <option value={activeVoiceObj.id}>
                        💎 {activeVoiceObj.name} ({activeVoiceObj.flag || activeVoiceObj.language || 'Premium JSON2Video'})
                      </option>
                    )}
                    <optgroup label="⚡ Native ElevenLabs Voices">
                      {VOICES.map((v) => (
                        <option key={v.id} value={v.id}>
                          🎙️ {v.name} ({v.flag || v.gender || 'Universal'})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🌐 Full Voice Library (9,650+ JSON2Video Voices)">
                      <option value="__open_studio__">
                        🌐 Browse & Apply in Studio...
                      </option>
                    </optgroup>
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>

                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  <span>{activeVoiceObj?.name || 'Adam'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAutomateModal(false);
                      if (typeof onNavigate === 'function') onNavigate('studio/voices');
                      else window.location.hash = '#/studio/voices';
                    }}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      color: 'var(--accent-primary, #ff4f00)', fontWeight: 600,
                      cursor: 'pointer', fontSize: '10.5px'
                    }}
                  >
                    Open Studio ↗
                  </button>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Narration Speed
                  </label>
                  <span style={{
                    background: 'rgba(255, 79, 0, 0.12)', padding: '1px 6px', borderRadius: '4px',
                    fontSize: '10px', fontWeight: 700, color: 'var(--accent-primary, #ff4f00)'
                  }}>
                    {(Number(automationConfig.voiceSpeed) || 1.20).toFixed(2)}x
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                  {[1.10, 1.15, 1.20, 1.25, 1.30].map(s => {
                    const isSelected = Math.abs(Number(automationConfig.voiceSpeed || 1.20) - s) < 0.01;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setAutomationConfig(prev => ({ ...prev, voiceSpeed: s }))}
                        style={{
                          flex: 1, padding: '6px 0', borderRadius: '7px',
                          background: isSelected ? 'var(--accent-primary, #ff4f00)' : 'var(--bg-elevated)',
                          border: isSelected ? '1px solid var(--accent-primary, #ff4f00)' : '1px solid var(--border-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                          fontSize: '11px', fontWeight: isSelected ? 700 : 500, cursor: 'pointer'
                        }}
                      >
                        {s.toFixed(2)}x
                      </button>
                    );
                  })}
                </div>
                <input
                  type="range"
                  min={SPEED_MIN} max={SPEED_MAX} step={SPEED_STEP}
                  value={automationConfig.voiceSpeed || 1.20}
                  onChange={e => setAutomationConfig(prev => ({ ...prev, voiceSpeed: parseFloat(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary, #ff4f00)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>{SPEED_MIN.toFixed(2)}x</span>
                  <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>{SPEED_MAX.toFixed(2)}x</span>
                </div>
              </div>
            </div>

            {/* Auto-Upload to YouTube Shorts Toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: '10px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <YouTubeIcon size={16} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Direct YouTube Shorts Auto-Publish
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    Automatically upload rendered videos to {automationTargetChannel?.channelTitle || selectedChannel?.channelTitle || 'your selected channel'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={automationConfig.autoUploadToYouTube !== false}
                onChange={(e) => setAutomationConfig(prev => ({ ...prev, autoUploadToYouTube: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary, #ff4f00)', cursor: 'pointer' }}
              />
            </div>


            {/* Execution History (Only if history exists) */}
            {automationConfig.topicsHistory && automationConfig.topicsHistory.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Recent Uploads
                </label>
                <div style={{
                  maxHeight: '130px', overflowY: 'auto',
                  borderRadius: '10px', border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <tbody>
                      {automationConfig.topicsHistory.slice(-5).reverse().map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 700, color: '#10b981' }}>Day {item.day}</td>
                          <td style={{ padding: '6px 10px', color: 'var(--text-primary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.topic}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                            {item.youtubeUrl ? (
                              <a href={item.youtubeUrl} target="_blank" rel="noreferrer" style={{ color: '#ef4444', fontWeight: 600, textDecoration: 'none' }}>
                                YouTube ↗
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Uploaded</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Minimal Action Footer */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleSaveAutomation({ status: 'ACTIVE' })}
                disabled={savingAutomation}
                style={{
                  flex: 1, minWidth: '160px',
                  padding: '10px 16px', borderRadius: '10px',
                  background: 'var(--accent-primary, #ff4f00)',
                  border: 'none', color: '#ffffff',
                  fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                {savingAutomation ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                <span>Activate Autopilot</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveAutomation({ status: 'PAUSED' })}
                disabled={savingAutomation}
                style={{
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Save as Paused
              </button>

              <button
                type="button"
                onClick={() => setShowAutomateModal(false)}
                style={{
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'transparent', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
