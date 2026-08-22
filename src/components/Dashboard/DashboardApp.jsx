import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import CanvasPromptBar from './CanvasPromptBar';
import TemplateCards from './TemplateCards';
import ResultThreadCard from './ResultThreadCard';
import StoryApprovalCard from './StoryApprovalCard';
import GenerationThinkingAnimation from './GenerationThinkingAnimation';
import { PRESETS } from '../../data/presets';
import { VOICES } from '../../data/voices';
import { VISUAL_STYLES } from '../../data/visualStyles';
import { MUSIC_TRACKS } from '../../data/musicTracks';
import { audioEngine } from '../../audio/audioEngine';
import { detectMode } from '../../utils/detectIntent';
import { 
  Sparkles, 
  Loader2, 
  Plus, 
  ArrowLeft, 
  XCircle, 
  AlertTriangle, 
  AlertCircle,
  RefreshCw, 
  Wand2, 
  MessageSquare,
  CheckCircle2,
  Bot,
  User,
  Send,
  ExternalLink
} from 'lucide-react';

const SESSION_ID_KEY = 'shortsai_session_id';

// Statuses that mean n8n is actively running a pipeline
const ACTIVE_STATUSES = ['GENERATING', 'GENERATING_SCENES', 'RENDERING_VIDEO'];

function getOrCreateSessionId() {
  if (typeof window !== 'undefined') {
    let sid = localStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = 'sess-' + Math.random().toString(36).substring(2, 12) + Date.now();
      localStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  }
  return 'sess-default';
}

export default function DashboardApp({ 
  initialPresetId = null,
  initialPrompt = '',
  sidebarCollapsed = false,
  onToggleSidebar,
  user,
  onNavigateToSettings,
  onLogout
}) {
  const [sessionId] = useState(getOrCreateSessionId);
  const [pastShorts, setPastShorts] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('shortsai_all_threads');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  const [activeThreadId, setActiveThreadId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shortsai_active_thread_id') || initialPresetId || null;
    }
    return initialPresetId || null;
  });

  // Sync all thread changes to localStorage immediately on every change
  useEffect(() => {
    if (typeof window !== 'undefined' && Array.isArray(pastShorts)) {
      localStorage.setItem('shortsai_all_threads', JSON.stringify(pastShorts));
    }
  }, [pastShorts]);

  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [voiceId, setVoiceId] = useState('adam');
  const [styleId, setStyleId] = useState('cinematic');
  const [musicId, setMusicId] = useState('mystery');
  const [language, setLanguage] = useState('Hinglish');
  const [autoUploadToYouTube, setAutoUploadToYouTube] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatResponding, setIsChatResponding] = useState(false);
  const [generationStage, setGenerationStage] = useState('');

  // Active Thread Object
  const activeThread = pastShorts.find(t => t.id === activeThreadId || t.threadId === activeThreadId) || null;

  // Ref to track active request timestamp
  const generationStartTimeRef = useRef(0);
  const messagesEndRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;

  // ── TRUTH-BASED: Derive isGenerating + stage from persisted thread status ──
  // This survives page reloads, component remounts, and navigations.
  useEffect(() => {
    if (!activeThread) return;
    const s = activeThread.status;
    if (ACTIVE_STATUSES.includes(s)) {
      setIsGenerating(true);
      if (s === 'RENDERING_VIDEO') {
        setGenerationStage('Autonomous 4K video rendering dispatched on n8n Cloud...');
      } else if (s === 'GENERATING_SCENES') {
        setGenerationStage('Generating 5-scene master screenplay in n8n Cloud...');
      } else {
        setGenerationStage('Connecting to n8n Cloud Pipeline...');
      }
    } else {
      // Only clear if we're NOT in a user-initiated pre-response phase
      // (handled by the generate/approve handlers themselves)
    }
  }, [activeThread?.status]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages, isChatResponding, isGenerating]);

  // ─── 1. FETCH THREADS FROM MONGODB ON LOAD ────────────────────────
  useEffect(() => {
    async function loadThreadsFromDatabase() {
      try {
        const res = await fetch(`/.netlify/functions/threads?sessionId=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.threads) && data.threads.length > 0) {
            setPastShorts(prev => {
              const remoteMap = new Map(data.threads.map(t => [t.threadId || t.id, t]));
              // Merge remote with local to preserve newest messages
              const merged = data.threads.map(rt => {
                const lt = prev.find(p => (p.threadId || p.id) === (rt.threadId || rt.id));
                if (lt && lt.messages && lt.messages.length > (rt.messages || []).length) {
                  return { ...rt, messages: lt.messages };
                }
                return rt;
              });

              // Add local-only threads that haven't synced yet
              prev.forEach(lt => {
                const id = lt.threadId || lt.id;
                if (id && !remoteMap.has(id)) {
                  merged.push(lt);
                }
              });

              return merged;
            });

            const savedId = typeof window !== 'undefined' ? localStorage.getItem('shortsai_active_thread_id') : null;
            const match = data.threads.find(t => t.threadId === savedId || t.id === savedId);
            if (match) {
              setActiveThreadId(match.threadId || match.id);
            } else if (!activeThreadId && data.threads.length > 0) {
              const defaultId = data.threads[0].threadId || data.threads[0].id;
              setActiveThreadId(defaultId);
              if (typeof window !== 'undefined') localStorage.setItem('shortsai_active_thread_id', defaultId);
            }
          }
        }
      } catch (err) {
        console.warn('Could not load MongoDB threads:', err.message);
      }
    }

    loadThreadsFromDatabase();
  }, [sessionId]);

  // Track distinct approval timestamps to prevent stale responses from interrupting active generation
  const lastStoryApprovalTimeRef = React.useRef(0);
  const lastScenesApprovalTimeRef = React.useRef(0);
  // Track when user initiated refinement (keeps animation alive until new refined story arrives)
  const refiningStartTimeRef = React.useRef(0);
  // Track previous brief and title to detect changes upon refinement
  const previousBriefRef = React.useRef('');
  const previousTitleRef = React.useRef('');
  // Track last known status per thread to prevent repetitive sound beeping on continuous polling
  const prevPollStatusRef = React.useRef({});

  // ─── 2. LIVE POLLING — adaptive interval, truth-based status sync ───
  useEffect(() => {
    let pollInterval;
    let stopped = false;

    async function pollStatus() {
      if (!activeThreadId || stopped) return;

      try {
        const res = await fetch(
          `/.netlify/functions/story-approval?threadId=${encodeURIComponent(activeThreadId)}&_t=${Date.now()}`,
          { headers: { 'Cache-Control': 'no-cache, no-store' } }
        );
        if (!res.ok || stopped) return;
        const data = await res.json();

        // Ignore if it's for a different thread
        if (data.threadId && data.threadId !== activeThreadId) return;

        const status = data.status;
        const prevStatus = prevPollStatusRef.current[activeThreadId];
        const isStatusTransition = prevStatus !== status;
        prevPollStatusRef.current[activeThreadId] = status;

        console.log('[Website] Poll received status from n8n Cloud:', status, '| isTransition:', isStatusTransition, '| videoUrl:', data.videoUrl || data.story?.videoUrl || 'none');

        // ── ACTIVE SERVER GENERATION / RENDERING STATES ──────────────
        if (status === 'GENERATING_SCENES' || status === 'RENDERING_VIDEO' || status === 'GENERATING') {
          setIsGenerating(true);
          const stageMsg = status === 'RENDERING_VIDEO'
            ? 'Autonomous 4K video rendering dispatched on n8n Cloud...'
            : (status === 'GENERATING_SCENES' ? 'Generating 5-scene master screenplay in n8n Cloud...' : 'Connecting to n8n Cloud Pipeline...');
          setGenerationStage(stageMsg);
          setPastShorts(prev => prev.map(t => {
            if (t.threadId !== activeThreadId && t.id !== activeThreadId) return t;
            return { ...t, status, generationStage: stageMsg };
          }));
          return;
        }

        if (!data.hasStory && !['COMPLETED', 'RENDER_FAILED', 'CANCELLED', 'DUPLICATE_TOPIC', 'WORKFLOW_INACTIVE', 'EXECUTION_TIMEOUT'].includes(status)) return;

        // ── DUPLICATE TOPIC ─────────────────────────────────────────
        if (status === 'DUPLICATE_TOPIC') {
          if (isStatusTransition) audioEngine.playSfx('click');
          setIsGenerating(false);
          setPastShorts(prev => prev.map(t => {
            if (t.threadId !== activeThreadId && t.id !== activeThreadId) return t;
            const existing = t.messages || [];
            const msgText = `⚠️ Topic already covered: "${data.matchedTitle || data.story?.matchedTitle || 'Duplicate topic'}".`;
            return {
              ...t, status: 'DUPLICATE_TOPIC',
              errorMessage: data.message || 'Duplicate topic detected',
              messages: existing.some(m => m.content === msgText) ? existing : [...existing, { role: 'assistant', content: msgText }]
            };
          }));
          return;
        }

        // ── CANCELLED ───────────────────────────────────────────────
        if (status === 'CANCELLED') {
          if (isStatusTransition) audioEngine.playSfx('click');
          setIsGenerating(false);
          setPastShorts(prev => prev.map(t => {
            if (t.threadId !== activeThreadId && t.id !== activeThreadId) return t;
            const existing = t.messages || [];
            const msgText = `⏹️ Generation was cancelled by creator.`;
            return {
              ...t, status: 'CANCELLED',
              messages: existing.some(m => m.content === msgText) ? existing : [...existing, { role: 'assistant', content: msgText }]
            };
          }));
          return;
        }

        // ── WORKFLOW INACTIVE / EXECUTION TIMEOUT ───────────────────
        if (status === 'WORKFLOW_INACTIVE' || status === 'EXECUTION_TIMEOUT') {
          if (isStatusTransition) audioEngine.playSfx('click');
          setIsGenerating(false);
          setPastShorts(prev => prev.map(t => {
            if (t.threadId !== activeThreadId && t.id !== activeThreadId) return t;
            const existing = t.messages || [];
            const msgText = `⏱️ Workflow execution was cancelled or timed out. ${data.errorMessage || 'You can retry the pipeline.'}`;
            return {
              ...t,
              status: 'WORKFLOW_INACTIVE',
              errorMessage: data.errorMessage || 'n8n workflow execution was cancelled or timed out. Please check your n8n Cloud settings and retry.',
              messages: existing.some(m => m.content === msgText) ? existing : [...existing, { role: 'assistant', content: msgText }]
            };
          }));
          return;
        }

        // ── RENDER FAILED ───────────────────────────────────────────
        if (status === 'RENDER_FAILED') {
          if (isStatusTransition) audioEngine.playSfx('click');
          setIsGenerating(false);
          setPastShorts(prev => prev.map(t => {
            if (t.threadId !== activeThreadId && t.id !== activeThreadId) return t;
            const existing = t.messages || [];
            const msgText = `❌ Video rendering error: ${data.errorMessage || 'Render failed'}` ;
            return {
              ...t, status: 'RENDER_FAILED',
              errorMessage: data.errorMessage,
              messages: existing.some(m => m.content === msgText) ? existing : [...existing, { role: 'assistant', content: msgText }]
            };
          }));
          return;
        }

        // ── COMPLETED ───────────────────────────────────────────────
        if (status === 'COMPLETED' || status === 'VIDEO_COMPLETED') {
          lastScenesApprovalTimeRef.current = 0;
          lastStoryApprovalTimeRef.current = 0;
          if (isStatusTransition) audioEngine.playSfx('boom');
          setIsGenerating(false);
          setGenerationStage('');
          setPastShorts(prev => prev.map(t => {
            if (t.threadId !== activeThreadId && t.id !== activeThreadId) return t;
            const existing = t.messages || [];
            const msgText = data.youtubeUrl
              ? `🎉 **4K Video Uploaded to YouTube!**\n📺 ${data.youtubeUrl}`
              : `🎉 **4K Video Render Complete!**`;
            return {
              ...t, status: 'COMPLETED', criticScore: 99,
              title: data.title || data.story?.title || t.title,
              videoUrl: data.videoUrl || data.story?.videoUrl || t.videoUrl,
              youtubeUrl: data.youtubeUrl || data.story?.youtubeUrl || t.youtubeUrl,
              videoId: data.videoId || data.story?.videoId || t.videoId,
              scenes: data.scenes || data.story?.scenes || t.scenes,
              youtubeDescription: data.youtubeDescription || t.youtubeDescription,
              tags: data.tags || t.tags,
              messages: existing.some(m => m.content === msgText) ? existing : [...existing, { role: 'assistant', content: msgText }]
            };
          }));
          return;
        }

        // ── SCENES READY (Stage 2) ───────────────────────────────────
        // Guard against stale SCENES_READY_FOR_APPROVAL when user already approved Stage 2 for video rendering
        const timeSinceScenesApproval = Date.now() - lastScenesApprovalTimeRef.current;
        if (lastScenesApprovalTimeRef.current > 0 && timeSinceScenesApproval < 3600000) {
          console.log('[Website] Skipping stale SCENES_READY_FOR_APPROVAL — video rendering in progress');
          setIsGenerating(true);
          setGenerationStage('Autonomous 4K video rendering dispatched on n8n Cloud...');
          return;
        }

        // If user actively requested scene refinement, check if this is the new refined response
        if (refiningStartTimeRef.current > 0 && status === 'SCENES_READY_FOR_APPROVAL') {
          const hasRefinedTimestamp = data.refineTimestamp && (new Date(data.refineTimestamp).getTime() >= refiningStartTimeRef.current - 1000);
          const isSceneRefinedFlag = data.refined === true || data.story?.refined === true || (Array.isArray(data.scenes) && data.scenes.some(s => s.refined === true));
          const isNewRefined = hasRefinedTimestamp || (isSceneRefinedFlag && (Date.now() - refiningStartTimeRef.current > 1500));

          if (!isNewRefined) {
            console.log('[Website] Screenplay Doctor is refining scenes in n8n... keeping animation active');
            setIsGenerating(true);
            setGenerationStage('AI Agent Screenplay Doctor is refining 5 scenes with full memory...');
            return;
          } else {
            console.log('[Website] Newly refined scenes received from Screenplay Doctor!');
            refiningStartTimeRef.current = 0;
            audioEngine.playSfx('success');
          }
        }

        if (status === 'SCENES_READY_FOR_APPROVAL') {
          // Scenes have successfully arrived! Unset stage 1 approval lock
          lastStoryApprovalTimeRef.current = 0;

          if (isStatusTransition && refiningStartTimeRef.current === 0) audioEngine.playSfx('success');
          setIsGenerating(false);
          setGenerationStage('');
          setPastShorts(prev => prev.map(t => {
            if (t.threadId !== activeThreadId && t.id !== activeThreadId) return t;
            // Never snap back from more advanced states
            if (['RENDERING_VIDEO', 'COMPLETED'].includes(t.status)) return t;
            const existing = t.messages || [];
            const titleStr = data.story?.suggestedTitle || data.story?.title || data.title || t.title;
            const msgText = `🎬 Final 5 scenes generated: "${titleStr}". Review before video rendering.`;
            return {
              ...t, status: 'SCENES_READY_FOR_APPROVAL',
              title: titleStr,
              story: data.story || t.story,
              scenes: data.scenes || data.story?.scenes || t.scenes,
              approveUrl: data.approveUrl || data.story?.approveUrl || t.approveUrl,
              cancelUrl: data.cancelUrl || data.story?.cancelUrl || t.cancelUrl,
              messages: existing.some(m => m.content === msgText) ? existing : [...existing, { role: 'assistant', content: msgText }]
            };
          }));
          return;
        }

        // ── STORY READY (Stage 1) ────────────────────────────────────
        // Guard against stale READY_FOR_APPROVAL when user already approved Stage 1 for scene generation
        const timeSinceStoryApproval = Date.now() - lastStoryApprovalTimeRef.current;
        if (lastStoryApprovalTimeRef.current > 0 && timeSinceStoryApproval < 180000) {
          console.log('[Website] Skipping stale READY_FOR_APPROVAL — scene generation in progress');
          setIsGenerating(true);
          setGenerationStage('Generating 5-scene master screenplay in n8n Cloud...');
          return;
        }

        // If user actively requested refinement, check if this is the newly refined story
        if (refiningStartTimeRef.current > 0 && status === 'READY_FOR_APPROVAL') {
          const currentBrief = (data.story?.storyBrief || data.storyBrief || '').trim();
          const currentTitle = (data.story?.suggestedTitle || data.title || '').trim();
          const storyChanged = (currentBrief && previousBriefRef.current && currentBrief !== previousBriefRef.current) || (currentTitle && previousTitleRef.current && currentTitle !== previousTitleRef.current);
          const hasRefinedTimestamp = data.refineTimestamp && (new Date(data.refineTimestamp).getTime() >= refiningStartTimeRef.current - 1000);
          const isMarkedRefined = (data.refined === true || data.story?.refined === true);
          const isNewRefined = storyChanged || hasRefinedTimestamp || (isMarkedRefined && (Date.now() - refiningStartTimeRef.current > 1500));

          if (!isNewRefined) {
            console.log('[Website] Story Doctor is refining story in n8n... keeping animation active');
            setIsGenerating(true);
            setGenerationStage('AI Agent Story Doctor is refining story brief with full memory...');
            return;
          } else {
            console.log('[Website] Newly refined story received from Story Doctor!');
            refiningStartTimeRef.current = 0;
            audioEngine.playSfx('success');
          }
        }

        if (status === 'READY_FOR_APPROVAL') {
          if (isStatusTransition && refiningStartTimeRef.current === 0) audioEngine.playSfx('success');
          setIsGenerating(false);
          setGenerationStage('');
          setPastShorts(prev => prev.map(t => {
            if (t.threadId !== activeThreadId && t.id !== activeThreadId) return t;
            // Never snap back from a more advanced state
            if (['GENERATING_SCENES', 'SCENES_READY_FOR_APPROVAL', 'RENDERING_VIDEO', 'COMPLETED'].includes(t.status)) return t;
            const existing = t.messages || [];
            const titleStr = data.story?.suggestedTitle || data.title || t.title;
            const msgText = (data.refined || data.story?.refined) 
              ? `✍️ Refined story ready for review: "${titleStr}"`
              : `Story ready for review: "${titleStr}"`;
            return {
              ...t, status: 'READY_FOR_APPROVAL',
              title: titleStr,
              story: data.story || data,
              scenes: null,
              approveUrl: data.approveUrl || data.story?.approveUrl || t.approveUrl,
              cancelUrl: data.cancelUrl || data.story?.cancelUrl || t.cancelUrl,
              messages: existing.some(m => m.content === msgText) ? existing : [...existing, { role: 'assistant', content: msgText }]
            };
          }));
        }
      } catch (pollErr) {
        console.warn('[Website] Poll error (non-fatal):', pollErr.message);
      }
    }

    // Adaptive polling: 2s when actively generating, 4s otherwise
    if (activeThreadId) {
      const currentStatus = pastShorts.find(t => t.id === activeThreadId || t.threadId === activeThreadId)?.status;
      const isActive = ACTIVE_STATUSES.includes(currentStatus);
      const interval = isActive ? 2000 : 4000;

      const t0 = setTimeout(pollStatus, 500);
      pollInterval = setInterval(pollStatus, interval);
      return () => {
        stopped = true;
        clearTimeout(t0);
        clearInterval(pollInterval);
      };
    }
  }, [activeThreadId, pastShorts.find(t => t.id === activeThreadId || t.threadId === activeThreadId)?.status]);

  // ─── THREAD SELECTION & ACTIONS ──────────────────────────────────
  const handleSelectShort = (threadId) => {
    const t = pastShorts.find(x => x.id === threadId || x.threadId === threadId);
    if (!t) return;
    const tid = t.threadId || t.id;
    setActiveThreadId(tid);
    if (typeof window !== 'undefined' && tid) {
      localStorage.setItem('shortsai_active_thread_id', tid);
    }
    setPrompt('');
    if (t.voiceId) setVoiceId(t.voiceId);
    if (t.visualStyleId) setStyleId(t.visualStyleId);
    if (t.musicId) setMusicId(t.musicId);
    if (t.language) setLanguage(t.language);
    const active = ACTIVE_STATUSES.includes(t.status);
    setIsGenerating(active);
    if (active) {
      if (t.status === 'RENDERING_VIDEO') {
        setGenerationStage('Autonomous 4K video rendering dispatched on n8n Cloud...');
      } else if (t.status === 'GENERATING_SCENES') {
        setGenerationStage('Generating 5-scene master screenplay in n8n Cloud...');
      } else {
        setGenerationStage('Connecting to n8n Cloud Pipeline...');
      }
    }
    setIsChatResponding(false);
  };

  const handleSelectTemplate = (item) => {
    audioEngine.playSfx('click');
    setPrompt(item.prompt);
    if (item.voice) setVoiceId(item.voice);
    if (item.style) setStyleId(item.style);
    setActiveThreadId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shortsai_active_thread_id');
    }
    setIsGenerating(false);
    setIsChatResponding(false);

    setTimeout(() => {
      const el = document.getElementById('shorts-prompt-input');
      if (el) el.focus();
    }, 100);
  };

  const handleNewShort = () => {
    setActiveThreadId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shortsai_active_thread_id');
    }
    setPrompt('');
    setIsGenerating(false);
    setIsChatResponding(false);
    setTimeout(() => {
      const el = document.getElementById('shorts-prompt-input');
      if (el) el.focus();
    }, 100);
  };

  const handleDeleteShort = async (id) => {
    audioEngine.playSfx('click');
    setPastShorts(prev => {
      const updated = prev.filter(x => x.id !== id && x.threadId !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('shortsai_all_threads', JSON.stringify(updated));
      }
      return updated;
    });

    try {
      fetch(`/.netlify/functions/threads?threadId=${id}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}

    if (activeThreadId === id) {
      handleNewShort();
    }
  };

  // ─── UNIVERSAL CONVERSATIONAL MESSAGE & DISPATCH HANDLER ─────────
  const handleGenerate = async (overrideMode, overridePrompt) => {
    const rawText = (overridePrompt !== undefined ? overridePrompt : prompt) || '';
    if (!rawText.trim()) return;

    const messageText = rawText.trim();
    const mode = overrideMode || detectMode(messageText);

    const startTime = Date.now();
    generationStartTimeRef.current = startTime;

    let currentThreadId = activeThreadId;
    if (!currentThreadId || (mode === 'VIDEO_GENERATION' && activeThread?.status === 'COMPLETED')) {
      currentThreadId = 'thread-' + startTime;
      setActiveThreadId(currentThreadId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('shortsai_active_thread_id', currentThreadId);
      }
    }

    const newThreadEntry = {
      id: currentThreadId,
      threadId: currentThreadId,
      sessionId: sessionId,
      name: messageText.substring(0, 32) + (messageText.length > 32 ? '...' : ''),
      title: messageText,
      rawUserInput: messageText,
      voiceId: voiceId,
      visualStyleId: styleId,
      musicId: musicId,
      language: language,
      criticScore: 98,
      status: mode === 'VIDEO_GENERATION' ? 'GENERATING' : (activeThread?.status || 'CHAT'),
      story: activeThread?.story || null,
      scenes: activeThread?.scenes || null,
      messages: [
        ...(activeThread?.messages || []),
        { role: 'user', content: messageText }
      ],
      createdAt: activeThread?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPastShorts(prev => {
      const idx = prev.findIndex(t => t.id === currentThreadId || t.threadId === currentThreadId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newThreadEntry;
        return updated;
      }
      return [newThreadEntry, ...prev];
    });

    setPrompt('');

    if (mode === 'VIDEO_GENERATION') {
      audioEngine.playSfx('shimmer');
      setIsGenerating(true);
      setIsChatResponding(false);
      setGenerationStage('Connecting to n8n Cloud Pipeline...');
    } else {
      audioEngine.playSfx('click');
      setIsChatResponding(true);
      setIsGenerating(false);
    }

    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: currentThreadId,
          sessionId: sessionId,
          message: messageText,
          mode: mode,
          settings: {
            voiceId,
            visualStyle: styleId,
            musicId,
            language,
            autoUploadToYouTube
          }
        })
      });

      let chatData = {};
      try {
        chatData = await res.json();
      } catch (parseErr) {
        chatData = { error: 'INVALID_RESPONSE', message: 'Failed to parse response from server.' };
      }

      // If server returned an error (e.g. 502 Workflow Inactive / Unreachable)
      if (!res.ok || chatData.success === false || chatData.error) {
        audioEngine.playSfx('click');
        setIsGenerating(false);
        setIsChatResponding(false);
        const errMsg = chatData.message || chatData.error || `Server responded with HTTP ${res.status}. Please ensure n8n workflow is published.`;
        setPastShorts(prev => prev.map(t =>
          (t.threadId === currentThreadId || t.id === currentThreadId)
            ? {
                ...t,
                status: 'WORKFLOW_INACTIVE',
                errorMessage: errMsg,
                n8nStatus: chatData.n8nStatus
              }
            : t
        ));
        return;
      }

      if (mode === 'CHAT') {
        audioEngine.playSfx('success');
        setIsChatResponding(false);
        setPastShorts(prev => prev.map(t =>
          (t.threadId === currentThreadId || t.id === currentThreadId)
            ? {
                ...t,
                status: 'CHAT',
                messages: [
                  ...(t.messages || []),
                  { role: 'assistant', content: chatData.message }
                ]
              }
            : t
        ));
        return;
      }

      if (mode === 'REFINE_STORY') {
        audioEngine.playSfx('success');
        setIsChatResponding(false);
        setIsGenerating(false);
        setPastShorts(prev => prev.map(t =>
          (t.threadId === currentThreadId || t.id === currentThreadId)
            ? {
                ...t,
                status: 'READY_FOR_APPROVAL',
                title: chatData.story?.suggestedTitle || messageText,
                story: chatData.story,
                messages: [
                  ...(t.messages || []),
                  { role: 'assistant', content: `✍️ **Script Doctor Refinement:**\n${chatData.message || 'Story adjusted.'}` }
                ]
              }
            : t
        ));
        return;
      }

      if (mode === 'VIDEO_GENERATION' && chatData.status === 'READY_FOR_APPROVAL' && chatData.story) {
        audioEngine.playSfx('success');
        setIsGenerating(false);
        setIsChatResponding(false);
        setPastShorts(prev => prev.map(t =>
          (t.threadId === currentThreadId || t.id === currentThreadId)
            ? {
                ...t,
                status: 'READY_FOR_APPROVAL',
                title: chatData.story.suggestedTitle || messageText,
                story: chatData.story,
                messages: [
                  ...(t.messages || []),
                  { role: 'assistant', content: `Story ready for review: "${chatData.story.suggestedTitle}"` }
                ]
              }
            : t
        ));
        return;
      }
    } catch (err) {
      console.warn('Chat dispatch error:', err.message);
      setIsChatResponding(false);
      setIsGenerating(false);
      setPastShorts(prev => prev.map(t =>
        (t.threadId === currentThreadId || t.id === currentThreadId)
          ? {
              ...t,
              status: 'WORKFLOW_INACTIVE',
              errorMessage: `Could not connect to n8n Cloud: ${err.message}. Please verify the workflow is published.`
            }
          : t
      ));
    }
  };

  // ─── STOP / TERMINATE EXECUTION (Instant Cancel) ───────────────────
  const handleTerminateExecution = async () => {
    audioEngine.playSfx('click');
    setIsGenerating(false);
    setIsChatResponding(false);

    const targetThreadId = activeThreadId;
    if (!targetThreadId) return;

    setPastShorts(prev => prev.map(t =>
      (t.threadId === targetThreadId || t.id === targetThreadId)
        ? {
            ...t,
            status: 'CANCELLED',
            messages: [
              ...(t.messages || []),
              { role: 'assistant', content: '⏹️ Generation cancelled by creator.' }
            ]
          }
        : t
    ));

    try {
      await fetch('/.netlify/functions/terminate-execution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: targetThreadId,
          sessionId,
          approveUrl: activeThread?.approveUrl || activeThread?.story?.approveUrl,
          reason: 'Creator clicked Stop / Terminate'
        })
      });
    } catch (err) {
      console.warn('Terminate execution error:', err.message);
    }
  };

  // ─── AI AGENT REFINEMENT HANDLER (Stage 1 & Stage 2) ───────────────
  const handleRefineStory = async (refinePrompt, actionType = 'REFINE_STORY', customApproveUrl = null) => {
    if (!activeThread || !refinePrompt.trim()) return;
    audioEngine.playSfx('shimmer');

    // Reset approval guard timestamp and start refinement tracking
    lastApprovalTimestampRef.current = 0;
    refiningStartTimeRef.current = Date.now();
    previousBriefRef.current = (activeThread.story?.storyBrief || activeThread.storyBrief || '').trim();
    previousTitleRef.current = (activeThread.story?.suggestedTitle || activeThread.title || '').trim();

    const effectiveApproveUrl = customApproveUrl || activeThread.approveUrl || activeThread.story?.approveUrl || activeThread.story?.resumeUrl;

    const stageMsg = actionType === 'REFINE_SCENES'
      ? 'AI Agent Screenplay Doctor is refining 5 scenes with full memory...'
      : 'AI Agent Story Doctor is refining story brief with full memory...';

    setIsGenerating(true);
    setGenerationStage(stageMsg);

    // Update local state immediately so thinking animation replaces review card
    setPastShorts(prev => prev.map(t =>
      (t.threadId === activeThreadId || t.id === activeThreadId)
        ? {
            ...t,
            status: 'GENERATING',
            generationStage: stageMsg
          }
        : t
    ));

    try {
      const res = await fetch('/.netlify/functions/approve-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approveUrl: effectiveApproveUrl,
          threadId: activeThreadId,
          sessionId,
          action: actionType,
          refinePrompt: refinePrompt.trim(),
          story: activeThread.story || null,
          scenes: activeThread.scenes || null,
          language: activeThread.story?.language || language || 'English',
          voiceId: activeThread.voiceId || voiceId || 'adam',
          visualStyle: activeThread.visualStyleId || styleId || 'cinematic'
        })
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        setIsGenerating(false);
        setPastShorts(prev => prev.map(t =>
          (t.threadId === activeThreadId || t.id === activeThreadId)
            ? {
                ...t,
                status: 'WORKFLOW_INACTIVE',
                errorMessage: data.message || 'Failed to dispatch refinement to AI Agent. Please retry.'
              }
            : t
        ));
      }
    } catch (err) {
      console.warn('Refine story dispatch error:', err.message);
      setIsGenerating(false);
    }
  };

  // ─── USER APPROVES STORY (2-STAGE APPROVAL WORKFLOW) ───────────────
  const handleApproveStory = async (approveUrl) => {
    audioEngine.playSfx('success');

    const isStage1 = activeThread?.status === 'READY_FOR_APPROVAL';
    const isStage2 = activeThread?.status === 'SCENES_READY_FOR_APPROVAL';

    if (isStage1) {
      lastStoryApprovalTimeRef.current = Date.now();
      lastScenesApprovalTimeRef.current = 0;
      setIsGenerating(true);
      setGenerationStage('Generating 5-scene master screenplay in n8n Cloud...');
    } else if (isStage2) {
      lastScenesApprovalTimeRef.current = Date.now();
      lastStoryApprovalTimeRef.current = 0;
      setIsGenerating(true);
      setGenerationStage('Autonomous 4K video rendering dispatched on n8n Cloud...');
    }

    try {
      // 1. Resume / Launch n8n execution with refined story payload
      const res = await fetch('/.netlify/functions/approve-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approveUrl,
          threadId: activeThreadId,
          sessionId,
          action: isStage2 ? 'APPROVE_SCENES' : 'APPROVE',
          story: activeThread?.story || null,
          refinedStory: activeThread?.story || null,
          language: activeThread?.story?.language || language || 'English',
          voiceId: activeThread?.voiceId || voiceId || 'adam',
          visualStyle: activeThread?.visualStyleId || styleId || 'cinematic',
          autoUploadToYouTube: !!autoUploadToYouTube
        })
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        // Workflow was inactive or offline -> DO NOT SHOW FAKE GENERATION
        setIsGenerating(false);
        setPastShorts(prev => prev.map(t => 
          (t.threadId === activeThreadId || t.id === activeThreadId)
            ? { 
                ...t, 
                status: 'WORKFLOW_INACTIVE', 
                errorMessage: data.message || 'Workflow error. Please retry.' 
              }
            : t
        ));
        return;
      }

      if (isStage1) {
        generationStartTimeRef.current = Date.now();
        setIsGenerating(true);
        setGenerationStage('Generating 5-scene master screenplay in n8n Cloud...');
        setPastShorts(prev => prev.map(t => 
          (t.threadId === activeThreadId || t.id === activeThreadId)
            ? { ...t, status: 'GENERATING_SCENES' }
            : t
        ));
      } else if (isStage2) {
        generationStartTimeRef.current = Date.now();
        setIsGenerating(true);
        setGenerationStage('Autonomous 4K video rendering dispatched on n8n Cloud...');
        setPastShorts(prev => prev.map(t => 
          (t.threadId === activeThreadId || t.id === activeThreadId)
            ? { 
                ...t, 
                status: 'RENDERING_VIDEO',
                messages: [
                  ...(t.messages || []),
                  { role: 'assistant', content: '🎬 5 scenes approved! Autonomous 4K video rendering pipeline dispatched on n8n Cloud...' }
                ]
              }
            : t
        ));
      }
    } catch (e) {
      console.warn('Approve story error:', e.message);
      setIsGenerating(false);
      setPastShorts(prev => prev.map(t => 
        (t.threadId === activeThreadId || t.id === activeThreadId)
          ? { ...t, status: 'WORKFLOW_INACTIVE', errorMessage: `Failed to dispatch to n8n: ${e.message}` }
          : t
      ));
    }
  };

  // ─── 1-CLICK MANUAL YOUTUBE UPLOAD HANDLER ────────────────────────
  const handleUploadYouTube = async () => {
    if (!activeThread) return;
    audioEngine.playSfx('boom');

    try {
      const res = await fetch('/.netlify/functions/upload-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: activeThread.threadId || activeThread.id,
          title: activeThread.title,
          description: activeThread.youtubeDescription,
          tags: activeThread.tags,
          videoUrl: activeThread.videoUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPastShorts(prev => prev.map(t => 
          (t.threadId === activeThreadId || t.id === activeThreadId)
            ? {
                ...t,
                youtubeUrl: data.youtubeUrl,
                videoId: data.uploadId,
                messages: [
                  ...(t.messages || []),
                  { role: 'assistant', content: `🚀 **1-Click Upload to YouTube Success!**\n\n📺 **Watch Short:** ${data.youtubeUrl}` }
                ]
              }
            : t
        ));
      }
    } catch (e) {
      console.warn('Manual YouTube upload error:', e.message);
    }
  };

  // ─── USER REJECTS STORY ──────────────────────────────────────────
  const handleRejectStory = async (cancelUrl) => {
    try {
      fetch('/.netlify/functions/approve-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approveUrl: cancelUrl, action: 'CANCEL', threadId: activeThreadId })
      }).catch(() => {});
    } catch (e) {}

    audioEngine.playSfx('click');
    setIsGenerating(false);

    setPastShorts(prev => prev.map(t => 
      (t.threadId === activeThreadId || t.id === activeThreadId)
        ? { 
            ...t, 
            status: 'CANCELLED', 
            cancelReason: 'Story was cancelled by creator.',
            story: t.story ? { ...t.story, approveUrl: null } : null,
            messages: [
              ...(t.messages || []),
              { role: 'assistant', content: 'Story generation was cancelled. Type `/refine` with instructions to twist the angle or `/video` for a fresh topic!' }
            ]
          }
        : t
    ));
  };

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 58px)',
      width: '100vw',
      background: 'var(--bg-app)',
      overflow: 'hidden'
    }}>
      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-mobile-overlay ${isMobileSidebarOpen ? 'visible' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* Real Persistent History Sidebar */}
      <div className={`sidebar-wrapper-mobile ${isMobileSidebarOpen ? 'open' : ''}`}>
        <Sidebar
          pastShorts={pastShorts}
          activeShortId={activeThreadId}
          onSelectShort={(id) => { handleSelectShort(id); setIsMobileSidebarOpen(false); }}
          onNewShort={() => { handleNewShort(); setIsMobileSidebarOpen(false); }}
          onDeleteShort={handleDeleteShort}
          collapsed={sidebarCollapsed}
          onToggleCollapse={onToggleSidebar}
          user={user}
          onOpenSettings={onNavigateToSettings}
          onLogout={onLogout}
        />
      </div>

      {/* Main Center Studio Canvas */}
      <main style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}>
        <div className="studio-main-content">
          {/* Header Bar if active thread is selected */}
          {activeThread && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Mobile hamburger */}
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="btn-outline"
                  style={{ fontSize: '12px', padding: '5px 10px', display: 'none' }}
                  id="mobile-menu-btn"
                >
                  ☰
                </button>
                <button
                  onClick={handleNewShort}
                  className="btn-outline"
                  style={{ fontSize: '12px', padding: '5px 12px', gap: '6px' }}
                >
                  <ArrowLeft size={13} />
                  <span>New Video</span>
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${
                  activeThread.status === 'COMPLETED' ? 'badge-cyan' :
                  activeThread.status === 'SCENES_READY_FOR_APPROVAL' ? 'badge-cyan' :
                  activeThread.status === 'READY_FOR_APPROVAL' ? 'badge-brand' :
                  activeThread.status === 'WORKFLOW_INACTIVE' ? 'badge-dark' :
                  activeThread.status === 'CANCELLED' ? 'badge-dark' : 'badge-brand'
                }`} style={{ fontSize: '11px' }}>
                  {activeThread.status === 'COMPLETED' ? '✓ Completed Short' :
                   activeThread.status === 'SCENES_READY_FOR_APPROVAL' ? '🎬 Final 5 Scenes Review' :
                   activeThread.status === 'READY_FOR_APPROVAL' ? '⚡ Stage 1 Story Review' :
                   activeThread.status === 'WORKFLOW_INACTIVE' ? '⚠️ Workflow Inactive' :
                   activeThread.status === 'CANCELLED' ? '❌ Cancelled' : '⚡ Active n8n Pipeline'}
                </span>
              </div>
            </div>
          )}

          {/* Chronological Chat Messages Timeline — ChatGPT/Claude style
               Only shows messages BEFORE completion. YouTube upload success
               messages are shown BELOW the ResultThreadCard. */}
          {activeThread?.messages && activeThread.messages.length > 0 && (() => {
            // Separate pre-completion messages from post-completion (YouTube upload etc.)
            const isCompleted = activeThread.status === 'COMPLETED';
            const youtubeKeywords = ['1-Click Upload to YouTube', 'YouTube Success', 'Uploaded to YouTube', 'Watch Short:', '🚀', '📺'];
            const isYouTubeMsg = (msg) => youtubeKeywords.some(kw => (msg.content || '').includes(kw));
            
            // When completed: show only non-YouTube messages in the timeline above the card
            const timelineMessages = isCompleted
              ? activeThread.messages.filter(m => !isYouTubeMsg(m))
              : activeThread.messages;

            if (timelineMessages.length === 0) return null;

            return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              {timelineMessages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                // Render markdown-style bold, bullets, and line breaks
                const renderContent = (text) => {
                  if (!text || typeof text !== 'string') return null;
                  return text.split('\n').map((line, li) => {
                    // Bold **text**
                    const parts = line.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <span key={li}>
                        {parts.map((part, pi) =>
                          /^\*\*[^*]+\*\*$/.test(part)
                            ? <strong key={pi}>{part.slice(2, -2)}</strong>
                            : part
                        )}
                        {li < text.split('\n').length - 1 && <br />}
                      </span>
                    );
                  });
                };
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-end',
                      gap: '10px',
                      animation: 'fadeSlideUp 0.3s ease'
                    }}
                  >
                    {!isUser && (
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, boxShadow: '0 2px 12px rgba(99,102,241,0.4)',
                        marginBottom: '2px'
                      }}>
                        <Sparkles size={15} color="#fff" />
                      </div>
                    )}

                    <div style={{
                      maxWidth: isUser ? '72%' : '80%',
                      background: isUser
                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                        : 'var(--bg-card)',
                      color: isUser ? '#fff' : 'var(--text-primary)',
                      padding: isUser ? '11px 18px' : '14px 20px',
                      borderRadius: isUser ? '20px 20px 6px 20px' : '6px 20px 20px 20px',
                      boxShadow: isUser
                        ? '0 4px 20px rgba(99,102,241,0.35)'
                        : '0 2px 12px rgba(0,0,0,0.12)',
                      fontSize: '14px',
                      lineHeight: 1.65,
                      fontWeight: isUser ? 500 : 400,
                      border: !isUser ? '1px solid var(--border-subtle)' : 'none',
                      letterSpacing: '0.01em'
                    }}>
                      {renderContent(msg.content)}
                    </div>

                    {isUser && (
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'var(--bg-input)', border: '2px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: '13px', fontWeight: 700,
                        color: 'var(--text-secondary)', marginBottom: '2px'
                      }}>
                        {(user?.name || user?.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            );
          })()}


          {/* Real-time Claude AI Typing Indicator — bouncing dots like ChatGPT */}
          {isChatResponding && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '20px', animation: 'fadeSlideUp 0.3s ease' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 2px 12px rgba(99,102,241,0.4)'
              }}>
                <Sparkles size={15} color="#fff" />
              </div>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px 20px 20px 20px',
                padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: '5px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)'
              }}>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}

          {/* 1. n8n Live Pipeline Execution Animation
               Truth-based: shows when isGenerating OR when thread status is an active state.
               This means it survives page reloads and remounts correctly. */}
          {(isGenerating || ACTIVE_STATUSES.includes(activeThread?.status)) && (
            <GenerationThinkingAnimation
              prompt={activeThread?.rawUserInput || prompt}
              stage={generationStage}
              isSceneStage={activeThread?.status === 'GENERATING_SCENES'}
              isRenderingVideo={activeThread?.status === 'RENDERING_VIDEO'}
            />
          )}

          {/* 2. Workflow Inactive Alert */}
          {activeThread && activeThread.status === 'WORKFLOW_INACTIVE' && !isGenerating && (
            <div className="saas-card animate-float" style={{
              padding: '24px',
              borderRadius: '20px',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.05)',
              boxShadow: 'var(--shadow-card)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                  <AlertCircle size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>n8n Workflow is Inactive / Not Published</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{activeThread.errorMessage || 'The video generation webhook was rejected.'}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>💡 <strong>How to fix:</strong> Open your workflow in n8n Cloud and activate it.</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <a href="https://cmpunktg23.app.n8n.cloud/workflow/fX5hdD9TwchvfdSD" target="_blank" rel="noopener noreferrer" className="btn-glow" style={{ fontSize: '12px', padding: '7px 16px', gap: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  <ExternalLink size={13} /><span>Open n8n Workflow</span>
                </a>
                <button onClick={() => handleGenerate('VIDEO_GENERATION', activeThread.rawUserInput)} className="btn-outline" style={{ fontSize: '12px', padding: '7px 16px', gap: '6px' }}>
                  <RefreshCw size={13} /><span>Retry Pipeline</span>
                </button>
              </div>
            </div>
          )}

          {/* 2B. Video Render Failed Alert */}
          {activeThread && activeThread.status === 'RENDER_FAILED' && !isGenerating && (
            <div className="saas-card animate-float" style={{
              padding: '24px',
              borderRadius: '20px',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.05)',
              boxShadow: 'var(--shadow-card)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                  <XCircle size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Video Generation / Media Error</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{activeThread.errorMessage || 'An error occurred during video rendering in n8n Cloud.'}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>You can retry the video generation pipeline or edit your prompt.</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button onClick={() => handleGenerate('VIDEO_GENERATION', activeThread.rawUserInput)} className="btn-glow" style={{ fontSize: '12px', padding: '7px 16px', gap: '6px' }}>
                  <RefreshCw size={13} /><span>Retry Video Generation</span>
                </button>
                <button onClick={handleNewShort} className="btn-ghost" style={{ fontSize: '12px', padding: '7px 14px' }}>
                  Start New Video
                </button>
              </div>
            </div>
          )}

          {/* 3. Story / Scenes Approval Card */}
          {activeThread && !isGenerating && (
            activeThread.status === 'READY_FOR_APPROVAL' ||
            activeThread.status === 'SCENES_READY_FOR_APPROVAL'
          ) && (activeThread.story || activeThread.scenes) && (
            <StoryApprovalCard
              story={activeThread.story || activeThread}
              scenes={activeThread.scenes}
              threadLanguage={activeThread.language || language}
              onApprove={handleApproveStory}
              onReject={handleRejectStory}
              onRefine={handleRefineStory}
            />
          )}

          {/* 4. If Cancelled: Show Graceful Conversational Cancellation Card */}
          {activeThread && activeThread.status === 'CANCELLED' && !isGenerating && (
            <div className="saas-card animate-float" style={{
              padding: '24px',
              borderRadius: '20px',
              border: '1.5px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-card)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  flexShrink: 0
                }}>
                  <XCircle size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Story Generation Cancelled
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    You cancelled this story review. The autonomous pipeline has halted for this video. You can refine your prompt, adjust the angle, or try a different theme below.
                  </div>
                </div>
              </div>

              {/* Quick Conversational Continuation Buttons */}
              <div style={{
                background: 'var(--bg-input)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Quick Actions to Continue:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={() => handleGenerate('VIDEO_GENERATION')}
                    className="btn-glow"
                    style={{ fontSize: '11.5px', padding: '6px 14px', gap: '6px' }}
                  >
                    <RefreshCw size={12} />
                    <span>Retry Same Topic</span>
                  </button>

                  <button
                    onClick={() => {
                      setPrompt(prev => prev + ' - What Scientists Refuse to Tell You');
                      setTimeout(() => handleGenerate('REFINE_STORY'), 150);
                    }}
                    className="btn-outline"
                    style={{ fontSize: '11.5px', padding: '6px 14px', gap: '6px' }}
                  >
                    <Wand2 size={12} />
                    <span>Add Mystery Twist</span>
                  </button>

                  <button
                    onClick={handleNewShort}
                    className="btn-ghost"
                    style={{ fontSize: '11.5px', padding: '6px 12px' }}
                  >
                    Start Fresh Short
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. If Duplicate Topic Alert: Show Warning with Angle Twist */}
          {activeThread && activeThread.status === 'DUPLICATE_TOPIC' && !isGenerating && (
            <div className="saas-card animate-float" style={{
              padding: '24px',
              borderRadius: '20px',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.06)',
              boxShadow: 'var(--shadow-card)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#f59e0b', marginBottom: '4px' }}>
                    Similar Topic Already Generated!
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {activeThread.duplicateInfo?.message || 'This topic already exists in your database.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setPrompt(prev => prev + ' - The 2026 Secret Revealed');
                    setTimeout(() => handleGenerate('REFINE_STORY'), 150);
                  }}
                  className="btn-glow"
                  style={{ fontSize: '11.5px', padding: '6px 14px', gap: '6px' }}
                >
                  <Wand2 size={12} />
                  <span>Twist Angle & Generate</span>
                </button>
                <button onClick={handleNewShort} className="btn-outline" style={{ fontSize: '11.5px', padding: '6px 12px' }}>
                  Choose Another Topic
                </button>
              </div>
            </div>
          )}

          {/* 6. If Completed Video: Show Full Result Card with Real n8n Scenes & Video Stream */}
          {activeThread && activeThread.status === 'COMPLETED' && !isGenerating && (
            <>
              <ResultThreadCard
                key={activeThread.id || activeThread.threadId}
                shortData={activeThread}
                onUploadYouTube={handleUploadYouTube}
                onRegenerate={() => handleGenerate('VIDEO_GENERATION')}
              />

              {/* YouTube Upload Success Messages — rendered BELOW the card, not above */}
              {activeThread.messages?.filter(m => {
                const youtubeKeywords = ['1-Click Upload to YouTube', 'YouTube Success', 'Uploaded to YouTube', 'Watch Short:', '🚀', '📺'];
                return youtubeKeywords.some(kw => (m.content || '').includes(kw));
              }).map((msg, idx) => {
                const urlMatch = (msg.content || '').match(/(https?:\/\/[^\s]+)/);
                const ytUrl = urlMatch?.[1];
                return (
                  <div key={`yt-${idx}`} className="youtube-success-msg">
                    <div className="youtube-success-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    <div className="youtube-success-text">
                      <strong>🚀 Upload Successful!</strong>
                      {ytUrl && (
                        <div style={{ marginTop: '4px' }}>
                          📺 <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="youtube-success-link">{ytUrl}</a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* 7. If Empty Canvas: Show Inspiration Templates */}
          {!activeThread && !isGenerating && (
            <TemplateCards
              onSelectTemplate={handleSelectTemplate}
              onSelectPreset={handleSelectShort}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Gemini Prompt Bar (Fixed Bottom Center) */}
        <div
          className="prompt-bar-wrapper"
          style={{
            position: 'fixed',
            bottom: 0,
            left: sidebarCollapsed ? '52px' : '200px',
            right: 0,
            background: 'linear-gradient(to top, var(--bg-app) 80%, transparent 100%)',
            padding: '12px 24px 16px',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 100,
            pointerEvents: 'none',
            transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="prompt-bar-inner" style={{ width: '100%', maxWidth: '900px', pointerEvents: 'auto' }}>
            <CanvasPromptBar
              prompt={prompt}
              setPrompt={setPrompt}
              onPromptChange={setPrompt}
              onSubmit={(mode, customPrompt) => handleGenerate(mode, customPrompt)}
              onGenerate={(mode, customPrompt) => handleGenerate(mode, customPrompt)}
              isGenerating={isGenerating || isChatResponding}
              voiceId={voiceId}
              setVoiceId={setVoiceId}
              selectedVoice={voiceId}
              onVoiceChange={setVoiceId}
              styleId={styleId}
              setStyleId={setStyleId}
              selectedStyle={styleId}
              onStyleChange={setStyleId}
              musicId={musicId}
              setMusicId={setMusicId}
              selectedMusic={musicId}
              onMusicChange={setMusicId}
              language={language}
              setLanguage={setLanguage}
              selectedLanguage={language}
              onLanguageChange={setLanguage}
              autoUploadToYouTube={autoUploadToYouTube}
              setAutoUploadToYouTube={setAutoUploadToYouTube}
              onStop={handleTerminateExecution}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
