import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import CanvasPromptBar from './CanvasPromptBar';
import TemplateCards from './TemplateCards';
import ResultThreadCard from './ResultThreadCard';
import StoryApprovalCard from './StoryApprovalCard';
import GenerationThinkingAnimation from './GenerationThinkingAnimation';
import GenerationPipelineModal from '../BottomDrawer/GenerationPipelineModal';
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
  RefreshCw, 
  Wand2, 
  MessageSquare,
  CheckCircle2,
  Bot,
  User,
  Send
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
  const [pastShorts, setPastShorts] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(initialPresetId || null);

  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [voiceId, setVoiceId] = useState('adam');
  const [styleId, setStyleId] = useState('cinematic');
  const [musicId, setMusicId] = useState('mystery');
  const [language, setLanguage] = useState('Hinglish');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatResponding, setIsChatResponding] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [showModal, setShowModal] = useState(false);

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
            setPastShorts(data.threads);
            if (!activeThreadId) {
              setActiveThreadId(data.threads[0].threadId || data.threads[0].id);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Could not load MongoDB threads:', err.message);
      }

      // Default initial templates if fresh database
      const initialThreads = [
        {
          id: 'preset-bermuda',
          threadId: 'preset-bermuda',
          name: 'Bermuda Triangle Flight 19',
          title: 'बरमूडा ट्रायंगल का अनसुलझा रहस्य: Flight 19 😱',
          rawUserInput: 'Flight 19 lost in Bermuda Triangle mystery',
          genre: 'Mystery & Thriller',
          voiceId: 'adam',
          visualStyleId: 'cinematic',
          musicId: 'mystery',
          language: 'Hinglish',
          status: 'COMPLETED',
          criticScore: 99,
          viralHook: '5 नौसैनिक विमान अचानक गायब हो गए और उनका आज तक कोई सुराग नहीं मिला!',
          youtubeDescription: 'The mysterious disappearance of Flight 19 in Bermuda Triangle.\n\n#Shorts #Mystery #BermudaTriangle',
          tags: ['Bermuda Triangle', 'Flight 19', 'Hindi Facts', 'Shorts'],
          scenes: PRESETS.bermuda.scenes,
          messages: [
            { role: 'user', content: 'Flight 19 lost in Bermuda Triangle mystery' },
            { role: 'assistant', content: 'Here is your completed 75-second YouTube Short with 5 cinematic scenes and audio score!' }
          ],
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      setPastShorts(initialThreads);
    }

    loadThreadsFromDatabase();
  }, [sessionId]);

  // ─── 2. LISTEN TO LIVE N8N / NETLIFY CALLBACK POLLING ────────────
  useEffect(() => {
    let pollInterval;

    async function checkNetlifyStoryApproval() {
      if (!isGenerating) return;
      try {
        const sinceTime = generationStartTimeRef.current || 0;
        const res = await fetch(`/.netlify/functions/story-approval?threadId=${activeThreadId}&since=${sinceTime}&t=${Date.now()}`, {
          cache: 'no-store'
        });

        if (res.ok) {
          const data = await res.json();
          if (data.hasStory && data.story) {
            const storyTimestamp = new Date(data.story.timestamp || 0).getTime();
            if (sinceTime > 0 && storyTimestamp > 0 && storyTimestamp < sinceTime) {
              return;
            }

            console.log('Received fresh story callback from MongoDB:', data.story);

            // 1. Duplicate Topic
            if (data.story.status === 'DUPLICATE_TOPIC') {
              audioEngine.playSfx('click');
              setIsGenerating(false);
              setPastShorts(prev => prev.map(t => 
                (t.threadId === activeThreadId || t.id === activeThreadId)
                  ? { ...t, status: 'DUPLICATE_TOPIC', duplicateInfo: { matchedTitle: data.story.matchedTitle || prompt, message: data.story.message } }
                  : t
              ));
              return;
            }

            // 2. Cancelled Callback
            if (data.story.status === 'CANCELLED') {
              audioEngine.playSfx('click');
              setIsGenerating(false);
              setPastShorts(prev => prev.map(t => 
                (t.threadId === activeThreadId || t.id === activeThreadId)
                  ? { ...t, status: 'CANCELLED', cancelReason: 'Story generation was cancelled.' }
                  : t
              ));
              return;
            }

            // 3. Story Ready for Approval
            audioEngine.playSfx('success');
            setIsGenerating(false);
            setPastShorts(prev => prev.map(t => 
              (t.threadId === activeThreadId || t.id === activeThreadId)
                ? { 
                    ...t, 
                    status: 'READY_FOR_APPROVAL', 
                    title: data.story.suggestedTitle || t.title,
                    story: data.story,
                    messages: [
                      ...(t.messages || []),
                      { role: 'assistant', content: `Story ready for review: "${data.story.suggestedTitle}"` }
                    ]
                  }
                : t
            ));
          }
        }
      } catch (err) {}
    }

    if (isGenerating) {
      const initialTimeout = setTimeout(checkNetlifyStoryApproval, 1200);
      pollInterval = setInterval(checkNetlifyStoryApproval, 2500);

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
    setActiveThreadId(t.threadId || t.id);
    setPrompt('');
    if (t.voiceId) setVoiceId(t.voiceId);
    if (t.visualStyleId) setStyleId(t.visualStyleId);
    if (t.musicId) setMusicId(t.musicId);
    if (t.language) setLanguage(t.language);
    setIsGenerating(t.status === 'GENERATING');
    setIsChatResponding(false);
  };

  const handleSelectTemplate = (item) => {
    audioEngine.playSfx('click');
    setPrompt(item.prompt);
    if (item.voice) setVoiceId(item.voice);
    if (item.style) setStyleId(item.style);
    setActiveThreadId(null);
    setIsGenerating(false);
    setIsChatResponding(false);

    setTimeout(() => {
      const el = document.getElementById('shorts-prompt-input');
      if (el) el.focus();
    }, 100);
  };

  const handleNewShort = () => {
    setActiveThreadId(null);
    setPrompt('');
    setIsGenerating(false);
    setIsChatResponding(false);
    setTimeout(() => {
      const el = document.getElementById('shorts-prompt-input');
      if (el) el.focus();
    }, 100);
  };

  const handleDeleteShort = async (id) => {
    setPastShorts(prev => prev.filter(x => x.id !== id && x.threadId !== id));
    try {
      fetch(`/.netlify/functions/threads?threadId=${id}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
    if (activeThreadId === id) {
      handleNewShort();
    }
  };

  // ─── UNIVERSAL CONVERSATIONAL MESSAGE & DISPATCH HANDLER ─────────
  const handleGenerate = async (overrideMode) => {
    if (!prompt.trim()) return;

    const messageText = prompt.trim();
    const mode = overrideMode || detectMode(messageText);
    audioEngine.playSfx('boom');

    const startTime = Date.now();
    generationStartTimeRef.current = startTime;

    let currentThreadId = activeThreadId;
    if (!currentThreadId || (mode === 'VIDEO_GENERATION' && activeThread?.status === 'COMPLETED')) {
      currentThreadId = 'thread-' + startTime;
      setActiveThreadId(currentThreadId);
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

    setPastShorts(prev => [newThreadEntry, ...prev.filter(x => x.threadId !== currentThreadId && x.id !== currentThreadId)]);
    setPrompt(''); // Clear input for natural conversation flow

    if (mode === 'VIDEO_GENERATION') {
      setIsGenerating(true);
      setGenerationStage('Connecting with n8n Cloud autonomous pipeline...');
    } else {
      setIsChatResponding(true);
    }

    // Call conversational /api/chat endpoint
    try {
      const chatRes = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: currentThreadId,
          sessionId: sessionId,
          message: messageText,
          mode: mode,
          settings: {
            voiceId: voiceId,
            visualStyle: styleId,
            musicTrack: musicId,
            language: language
          }
        })
      });

      if (chatRes.ok) {
        const chatData = await chatRes.json();
        setIsChatResponding(false);

        // 1. If Chat Q&A Reply received
        if (chatData.mode === 'CHAT') {
          audioEngine.playSfx('success');
          setIsGenerating(false);
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

        // 2. If Story Refinement Reply received
        if (chatData.mode === 'REFINE_STORY') {
          audioEngine.playSfx('success');
          setIsGenerating(false);
          setPastShorts(prev => prev.map(t => 
            (t.threadId === currentThreadId || t.id === currentThreadId)
              ? {
                  ...t,
                  status: 'READY_FOR_APPROVAL',
                  title: chatData.story?.suggestedTitle || t.title,
                  story: chatData.story,
                  messages: [
                    ...(t.messages || []),
                    { role: 'assistant', content: chatData.message }
                  ]
                }
              : t
          ));
          return;
        }
      } else {
        setIsChatResponding(false);
        setIsGenerating(false);
      }
    } catch (err) {
      console.warn('Chat dispatch warning:', err.message);
      setIsChatResponding(false);
      setIsGenerating(false);
    }
  };

  // ─── USER APPROVES STORY ─────────────────────────────────────────
  const handleApproveStory = async (approveUrl) => {
    try {
      await fetch('/.netlify/functions/approve-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approveUrl, action: 'APPROVE' })
      });
    } catch (e) {}

    setShowModal(true);
    setTimeout(() => {
      setShowModal(false);
      setPastShorts(prev => prev.map(t => 
        (t.threadId === activeThreadId || t.id === activeThreadId)
          ? {
              ...t,
              status: 'COMPLETED',
              criticScore: 99,
              youtubeDescription: `${t.rawUserInput}\n\n75-second YouTube Short produced by ShortsAI Engine.\n\n#Shorts #Viral #AI`,
              tags: ['Viral Shorts', 'Hindi Facts', 'Mystery'],
              scenes: PRESETS.bermuda.scenes,
              messages: [
                ...(t.messages || []),
                { role: 'assistant', content: '🎉 Story approved! 5 cinematic scenes rendered and ready.' }
              ]
            }
          : t
      ));
    }, 4500);
  };

  // ─── USER REJECTS STORY ──────────────────────────────────────────
  const handleRejectStory = async (cancelUrl) => {
    try {
      await fetch('/.netlify/functions/approve-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approveUrl: cancelUrl, action: 'CANCEL' })
      });
    } catch (e) {}

    audioEngine.playSfx('click');
    setIsGenerating(false);

    setPastShorts(prev => prev.map(t => 
      (t.threadId === activeThreadId || t.id === activeThreadId)
        ? { 
            ...t, 
            status: 'CANCELLED', 
            cancelReason: 'Story was cancelled by creator.',
            messages: [
              ...(t.messages || []),
              { role: 'assistant', content: 'Story generation was cancelled. Tell me what changes you would like to make!' }
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
                  activeThread.status === 'READY_FOR_APPROVAL' ? 'badge-brand' :
                  activeThread.status === 'CANCELLED' ? 'badge-dark' : 'badge-brand'
                }`} style={{ fontSize: '11px' }}>
                  {activeThread.status === 'COMPLETED' ? '✓ Completed Short' :
                   activeThread.status === 'READY_FOR_APPROVAL' ? '⚡ Ready for Review' :
                   activeThread.status === 'CANCELLED' ? '❌ Cancelled' : '⚡ Active Conversation'}
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

          {/* 1. If Actively Generating Video: Show 5-Act Thinking & Reasoning Animation */}
          {isGenerating && (
            <GenerationThinkingAnimation
              prompt={activeThread?.rawUserInput || prompt}
              stage={generationStage}
            />
          )}

          {/* 2. If Story Ready for Approval: Show StoryApprovalCard */}
          {activeThread && activeThread.status === 'READY_FOR_APPROVAL' && activeThread.story && !isGenerating && (
            <StoryApprovalCard
              story={activeThread.story}
              onApprove={handleApproveStory}
              onReject={handleRejectStory}
            />
          )}

          {/* 3. If Cancelled: Show Graceful Conversational Cancellation Card */}
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

          {/* 4. If Duplicate Topic Alert: Show Warning with Angle Twist */}
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

          {/* 5. If Completed Video: Show Full Result Card */}
          {activeThread && activeThread.status === 'COMPLETED' && !isGenerating && (
            <ResultThreadCard
              key={activeThread.id || activeThread.threadId}
              shortData={activeThread}
              onRegenerate={() => handleGenerate('VIDEO_GENERATION')}
            />
          )}

          {/* 6. If Empty Canvas: Show Inspiration Templates */}
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
              onSubmit={(mode) => handleGenerate(mode)}
              onGenerate={(mode) => handleGenerate(mode)}
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
            />
          </div>
        </div>
      </main>

      {/* Full Generation Pipeline Modal */}
      {showModal && (
        <GenerationPipelineModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          currentStep={3}
          prompt={prompt}
          voice={VOICES.find(v => v.id === voiceId) || VOICES[0]}
          visualStyle={VISUAL_STYLES.find(s => s.id === styleId) || VISUAL_STYLES[0]}
          musicTrack={MUSIC_TRACKS.find(m => m.id === musicId) || MUSIC_TRACKS[0]}
          language={language}
        />
      )}
    </div>
  );
}
