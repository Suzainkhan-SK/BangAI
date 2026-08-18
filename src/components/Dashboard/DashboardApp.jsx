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

  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatResponding, setIsChatResponding] = useState(false);
  const [generationStage, setGenerationStage] = useState('');

  // Active Thread Object
  const activeThread = pastShorts.find(t => t.id === activeThreadId || t.threadId === activeThreadId) || null;

  // Ref to track active request timestamp
  const generationStartTimeRef = useRef(0);
  const messagesEndRef = useRef(null);

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

  // Track when user last approved a story (prevents stale READY_FOR_APPROVAL from snapping back)
  const lastApprovalTimestampRef = React.useRef(0);

  // ─── 2. LISTEN TO LIVE N8N / NETLIFY CALLBACK POLLING ────────────
  useEffect(() => {
    let pollInterval;

    async function checkNetlifyStoryApproval() {
      try {
        const query = activeThreadId 
          ? `threadId=${encodeURIComponent(activeThreadId)}` 
          : '';

        const res = await fetch(`/.netlify/functions/story-approval?${query}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.hasStory && (data.story || data.status === 'READY_FOR_APPROVAL' || data.status === 'SCENES_READY_FOR_APPROVAL' || data.status === 'COMPLETED' || data.status === 'RENDER_FAILED')) {
            console.log('[Website] Received real callback from n8n Cloud:', data.status, data);

            // 1. Duplicate Topic
            if (data.status === 'DUPLICATE_TOPIC' || data.story?.status === 'DUPLICATE_TOPIC') {
              audioEngine.playSfx('click');
              setIsGenerating(false);
              setPastShorts(prev => prev.map(t => 
                (t.threadId === activeThreadId || t.id === activeThreadId)
                  ? { ...t, status: 'DUPLICATE_TOPIC', duplicateInfo: { matchedTitle: data.story?.matchedTitle || prompt, message: data.story?.message } }
                  : t
              ));
              return;
            }

            // 2. Cancelled Callback
            if (data.status === 'CANCELLED' || data.story?.status === 'CANCELLED') {
              audioEngine.playSfx('click');
              setIsGenerating(false);
              setPastShorts(prev => prev.map(t => 
                (t.threadId === activeThreadId || t.id === activeThreadId)
                  ? { ...t, status: 'CANCELLED', cancelReason: 'Story generation was cancelled.' }
                  : t
              ));
              return;
            }

            // 3. Stage 2: Final 5 Scenes from Split Scenes node
            if (data.status === 'SCENES_READY_FOR_APPROVAL' || data.story?.status === 'SCENES_READY_FOR_APPROVAL') {
              audioEngine.playSfx('success');
              setIsGenerating(false);
              setPastShorts(prev => prev.map(t => {
                if (t.threadId !== activeThreadId && t.id !== activeThreadId) return t;
                const existing = t.messages || [];
                const msgText = `🎬 Final 5 scenes generated: "${data.story?.title || t.title}". Review before video rendering.`;
                const hasDuplicate = existing.some(m => m.content === msgText);
                return {
                  ...t,
                  status: 'SCENES_READY_FOR_APPROVAL',
                  title: data.story?.title || data.story?.suggestedTitle || t.title,
                  story: data.story || t.story,
                  scenes: data.scenes || data.story?.scenes,
                  messages: hasDuplicate ? existing : [...existing, { role: 'assistant', content: msgText }]
                };
              }));
              return;
            }

            // 4. Stage 3: Final 4K Video Render Complete Callback from n8n
            if (data.status === 'COMPLETED' || data.status === 'VIDEO_COMPLETED' || data.videoUrl) {
              audioEngine.playSfx('boom');
              setIsGenerating(false);
              setPastShorts(prev => prev.map(t => {
                if (t.threadId !== activeThreadId && t.id !== activeThreadId) return t;
                const existing = t.messages || [];
                const msgText = data.youtubeUrl 
                  ? `🎉 **4K Video Rendered & Uploaded to YouTube!**\n\n📺 **Watch Short:** ${data.youtubeUrl}` 
                  : `🎉 **4K Video Render Complete!** 75-second master video rendered and ready for download or 1-Click YouTube Upload.`;
                const hasDuplicate = existing.some(m => m.content === msgText);
                return {
                  ...t,
                  status: 'COMPLETED',
                  title: data.title || (data.story && data.story.title) || t.title,
                  videoUrl: data.videoUrl || (data.story && data.story.videoUrl) || t.videoUrl,
                  youtubeUrl: data.youtubeUrl || (data.story && data.story.youtubeUrl) || t.youtubeUrl,
                  videoId: data.videoId || (data.story && data.story.videoId) || t.videoId,
                  scenes: data.scenes || (data.story && data.story.scenes) || t.scenes,
                  youtubeDescription: data.youtubeDescription || (data.story && data.story.youtubeDescription) || t.youtubeDescription,
                  tags: data.tags || (data.story && data.story.tags) || t.tags,
                  criticScore: 99,
                  messages: hasDuplicate ? existing : [...existing, { role: 'assistant', content: msgText }]
                };
              }));
              return;
            }

            // 5. Render Failed Callback
            if (data.status === 'RENDER_FAILED' || data.story?.status === 'RENDER_FAILED') {
              audioEngine.playSfx('click');
              setIsGenerating(false);
              setPastShorts(prev => prev.map(t => {
                if (t.threadId !== activeThreadId && t.id !== activeThreadId) return t;
                const existing = t.messages || [];
                const msgText = `❌ Video rendering error: ${data.errorMessage || data.story?.errorMessage || 'Failed'}`;
                const hasDuplicate = existing.some(m => m.content === msgText);
                return {
                  ...t,
                  status: 'RENDER_FAILED',
                  errorMessage: data.errorMessage || data.story?.errorMessage || 'Video rendering failed in media engine',
                  messages: hasDuplicate ? existing : [...existing, { role: 'assistant', content: msgText }]
                };
              }));
              return;
            }

            // 6. Stage 1: Story Ready for Approval from Strategy Engine
            // CRITICAL: Skip if the user just approved (within last 35 seconds) — prevents stale DB record from snapping UI back
            const timeSinceApproval = Date.now() - lastApprovalTimestampRef.current;
            if (timeSinceApproval < 35000) {
              console.log('[Website] Skipping stale READY_FOR_APPROVAL — user approved', Math.round(timeSinceApproval / 1000), 's ago');
              return;
            }

            if (data.status === 'READY_FOR_APPROVAL' || data.story?.status === 'STORY_READY_FOR_APPROVAL' || data.story?.suggestedTitle) {
              audioEngine.playSfx('success');
              setIsGenerating(false);
              setPastShorts(prev => prev.map(t => {
                if (t.threadId !== activeThreadId && t.id !== activeThreadId) return t;
                // Never snap back from a more advanced state
                const advancedStates = ['GENERATING_SCENES', 'SCENES_READY_FOR_APPROVAL', 'RENDERING_VIDEO', 'COMPLETED'];
                if (advancedStates.includes(t.status)) return t;
                const existing = t.messages || [];
                const msgText = `Story ready for review: "${data.story?.suggestedTitle || data.title}"`;
                const hasDuplicate = existing.some(m => m.content === msgText);
                return {
                  ...t,
                  status: 'READY_FOR_APPROVAL',
                  title: data.story?.suggestedTitle || data.title || t.title,
                  story: data.story,
                  messages: hasDuplicate ? existing : [...existing, { role: 'assistant', content: msgText }]
                };
              }));
            }
          }
        }
      } catch (err) {}
    }

    if (isGenerating) {
      const initialTimeout = setTimeout(checkNetlifyStoryApproval, 800);
      pollInterval = setInterval(checkNetlifyStoryApproval, 2000);

      return () => {
        clearTimeout(initialTimeout);
        if (pollInterval) clearInterval(pollInterval);
      };
    }
  }, [isGenerating, activeThreadId, prompt]);

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
    setIsGenerating(t.status === 'GENERATING' || t.status === 'GENERATING_SCENES' || t.status === 'RENDERING_VIDEO');
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

      const chatData = await res.json();

      if (!res.ok) {
        if (chatData.error === 'WORKFLOW_NOT_PUBLISHED') {
          audioEngine.playSfx('click');
          setIsGenerating(false);
          setIsChatResponding(false);
          setPastShorts(prev => prev.map(t =>
            (t.threadId === currentThreadId || t.id === currentThreadId)
              ? {
                  ...t,
                  status: 'WORKFLOW_INACTIVE',
                  errorMessage: chatData.message,
                  n8nStatus: chatData.n8nStatus
                }
              : t
          ));
          return;
        }
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
      console.warn('Chat dispatch warning:', err.message);
      setIsChatResponding(false);
      setIsGenerating(false);
      setPastShorts(prev => prev.map(t =>
        (t.threadId === currentThreadId || t.id === currentThreadId)
          ? {
              ...t,
              status: 'WORKFLOW_INACTIVE',
              errorMessage: `Network error connecting to n8n Cloud: ${err.message}`
            }
          : t
      ));
    }
  };

  // ─── USER APPROVES STORY (2-STAGE APPROVAL WORKFLOW) ───────────────
  const handleApproveStory = async (approveUrl) => {
    audioEngine.playSfx('success');

    // Stamp approval time IMMEDIATELY so polling skips stale READY_FOR_APPROVAL for 35 seconds
    lastApprovalTimestampRef.current = Date.now();

    const isStage1 = activeThread?.status === 'READY_FOR_APPROVAL';
    const isStage2 = activeThread?.status === 'SCENES_READY_FOR_APPROVAL';

    // Show temporary generating feedback while generating scenes or rendering
    setIsGenerating(true);
    if (isStage1) {
      setGenerationStage('Generating 5-scene master screenplay...');
    } else if (isStage2) {
      setGenerationStage('Dispatching 4K autonomous video rendering pipeline...');
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

      // 1. Stage 1 -> Stage 2: 5 scenes generated
      if (data.status === 'SCENES_READY_FOR_APPROVAL' && data.scenes) {
        audioEngine.playSfx('success');
        setIsGenerating(false);
        setPastShorts(prev => prev.map(t => 
          (t.threadId === activeThreadId || t.id === activeThreadId)
            ? { 
                ...t, 
                status: 'SCENES_READY_FOR_APPROVAL',
                title: data.title || t.title,
                scenes: data.scenes,
                messages: [
                  ...(t.messages || []),
                  { role: 'assistant', content: `🎬 5 scenes generated: "${data.title || t.title}". Review before video rendering.` }
                ]
              }
            : t
        ));
        return;
      }

      // 2. Stage 2 -> Stage 3: Rendering video
      if (data.status === 'RENDERING_VIDEO') {
        setIsGenerating(true);
        setPastShorts(prev => prev.map(t => 
          (t.threadId === activeThreadId || t.id === activeThreadId)
            ? { 
                ...t, 
                status: 'RENDERING_VIDEO',
                messages: [
                  ...(t.messages || []),
                  { role: 'assistant', content: '🎬 5 scenes approved! Autonomous 4K video rendering pipeline dispatched...' }
                ]
              }
            : t
        ));
        return;
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
      height: 'calc(100vh - 66px)',
      width: '100vw',
      background: 'var(--bg-app)',
      overflow: 'hidden'
    }}>
      {/* Real Persistent History Sidebar */}
      <Sidebar
        pastShorts={pastShorts}
        activeShortId={activeThreadId}
        onSelectShort={handleSelectShort}
        onNewShort={handleNewShort}
        onDeleteShort={handleDeleteShort}
        collapsed={sidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
        user={user}
        onOpenSettings={onNavigateToSettings}
        onLogout={onLogout}
      />

      {/* Main Center Studio Canvas */}
      <main style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          flex: 1,
          padding: '24px 24px 170px 24px',
          maxWidth: '840px',
          width: '100%',
          margin: '0 auto'
        }}>
          {/* Header Bar if active thread is selected */}
          {activeThread && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button
                onClick={handleNewShort}
                className="btn-outline"
                style={{ fontSize: '12px', padding: '5px 12px', gap: '6px' }}
              >
                <ArrowLeft size={13} />
                <span>New Video Studio</span>
              </button>
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

          {/* Chronological Chat Messages Timeline */}
          {activeThread?.messages && activeThread.messages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {activeThread.messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}
                  >
                    {!isUser && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--grad-gemini)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)'
                      }}>
                        <Sparkles size={16} color="#ffffff" />
                      </div>
                    )}

                    <div
                      className={!isUser ? 'saas-card' : ''}
                      style={{
                        maxWidth: '82%',
                        background: isUser ? 'var(--grad-primary)' : 'var(--bg-card)',
                        color: isUser ? '#ffffff' : 'var(--text-primary)',
                        padding: '12px 18px',
                        borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                        boxShadow: isUser ? '0 4px 16px rgba(99, 102, 241, 0.25)' : 'var(--shadow-card)',
                        fontSize: '13.5px',
                        lineHeight: 1.6,
                        fontWeight: isUser ? 600 : 500,
                        border: !isUser ? '1px solid var(--border-subtle)' : 'none',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Real-time Claude AI Typing Indicator */}
          {isChatResponding && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--grad-gemini)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sparkles size={16} color="#ffffff" className="spin-animation" />
              </div>
              <div className="saas-card" style={{
                padding: '10px 16px',
                borderRadius: '4px 16px 16px 16px',
                fontSize: '13px',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Loader2 size={14} className="spin-animation" />
                <span>ShortsAI Claude is generating reply...</span>
              </div>
            </div>
          )}

          {/* 1. If Actively Generating: Show Clean n8n Live Pipeline Execution Timeline */}
          {isGenerating && (
            <GenerationThinkingAnimation
              prompt={activeThread?.rawUserInput || prompt}
              stage={generationStage}
              isSceneStage={activeThread?.status === 'GENERATING_SCENES'}
              isRenderingVideo={activeThread?.status === 'RENDERING_VIDEO'}
            />
          )}

          {/* 2. If Workflow Inactive / Not Published Alert: Show Real Status Card */}
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
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  flexShrink: 0
                }}>
                  <AlertCircle size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    n8n Workflow is Inactive / Not Published
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {activeThread.errorMessage || 'The video generation webhook was rejected because workflow u8vcVLc00wPp2AAI is not currently active on n8n Cloud.'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    💡 <strong>How to fix:</strong> Open your workflow in n8n Cloud and switch the <strong>Active</strong> toggle in the top-right corner to <strong>Active</strong>.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <a
                  href="https://cmpunktg22.app.n8n.cloud/workflow/u8vcVLc00wPp2AAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glow"
                  style={{
                    fontSize: '12px',
                    padding: '7px 16px',
                    gap: '6px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <ExternalLink size={13} />
                  <span>Open Workflow in n8n Cloud</span>
                </a>

                <button
                  onClick={() => handleGenerate('VIDEO_GENERATION', activeThread.rawUserInput)}
                  className="btn-outline"
                  style={{ fontSize: '12px', padding: '7px 16px', gap: '6px' }}
                >
                  <RefreshCw size={13} />
                  <span>Retry Pipeline</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. If Story or Final 5 Scenes Ready for Approval: Show StoryApprovalCard */}
          {activeThread && (activeThread.status === 'READY_FOR_APPROVAL' || activeThread.status === 'SCENES_READY_FOR_APPROVAL') && (activeThread.story || activeThread.scenes) && !isGenerating && (
            <StoryApprovalCard
              story={activeThread.story || activeThread}
              scenes={activeThread.scenes}
              onApprove={handleApproveStory}
              onReject={handleRejectStory}
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
            <ResultThreadCard
              key={activeThread.id || activeThread.threadId}
              shortData={activeThread}
              onUploadYouTube={handleUploadYouTube}
              onRegenerate={() => handleGenerate('VIDEO_GENERATION')}
            />
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
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: sidebarCollapsed ? '52px' : '200px',
          right: 0,
          background: 'linear-gradient(to top, var(--bg-app) 80%, transparent 100%)',
          padding: '12px 20px 16px 20px',
          display: 'flex',
          justifyContent: 'center',
          zIndex: 100,
          pointerEvents: 'none',
          transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ width: '100%', maxWidth: '780px', pointerEvents: 'auto' }}>
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
            />
          </div>
        </div>
      </main>
    </div>
  );
}
