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
  Send,
  Sliders
} from 'lucide-react';

const STORAGE_KEY = 'shortsai_chat_history_v2';

function getInitialHistory() {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
  }
  return [
    {
      id: 'preset-bermuda',
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
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'preset-psychology',
      name: '3 Dark Psychology Secrets',
      title: '3 Dark Psychology Secrets You Must Know',
      rawUserInput: '3 Dark Psychology manipulation tricks people use on you daily',
      genre: 'Psychology & Facts',
      voiceId: 'rachel',
      visualStyleId: 'dark_fantasy',
      musicId: 'dark_ambient',
      language: 'English',
      status: 'COMPLETED',
      criticScore: 98,
      viralHook: 'If someone pauses before answering, they are analyzing your reaction...',
      youtubeDescription: '3 Dark Psychology tricks you must know to protect yourself.\n\n#Psychology #DarkPsychology #Shorts',
      tags: ['Psychology', 'Dark Psychology', 'Life Hacks', 'Shorts'],
      scenes: PRESETS.dragons.scenes,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];
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
  const [pastShorts, setPastShorts] = useState(getInitialHistory);
  const [activeThreadId, setActiveThreadId] = useState(initialPresetId || null);

  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [voiceId, setVoiceId] = useState('adam');
  const [styleId, setStyleId] = useState('cinematic');
  const [musicId, setMusicId] = useState('mystery');
  const [language, setLanguage] = useState('Hinglish');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Active Thread Object
  const activeThread = pastShorts.find(t => t.id === activeThreadId) || null;

  // Ref to track active request timestamp
  const generationStartTimeRef = useRef(0);

  // Helper to persist history to state and localStorage
  const updateHistoryAndSave = (updater) => {
    setPastShorts((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // ─── POLLING NETLIFY / N8N SERVERLESS CALLBACK ───
  useEffect(() => {
    let pollInterval;

    async function checkNetlifyStoryApproval() {
      if (!isGenerating) return;
      try {
        const sinceTime = generationStartTimeRef.current || 0;
        const res = await fetch(`/.netlify/functions/story-approval?since=${sinceTime}&t=${Date.now()}`, {
          cache: 'no-store'
        });

        if (res.ok) {
          const data = await res.json();
          if (data.hasStory && data.story) {
            const storyTimestamp = new Date(data.story.timestamp || 0).getTime();
            if (sinceTime > 0 && storyTimestamp > 0 && storyTimestamp < sinceTime) {
              return; // Ignore older stories
            }

            console.log('Received fresh story callback from n8n cloud:', data.story);

            // 1. If Duplicate Topic Alert received
            if (data.story.status === 'DUPLICATE_TOPIC') {
              audioEngine.playSfx('click');
              setIsGenerating(false);
              updateHistoryAndSave((prev) =>
                prev.map((t) =>
                  t.id === activeThreadId
                    ? {
                        ...t,
                        status: 'DUPLICATE_TOPIC',
                        duplicateInfo: {
                          matchedTitle: data.story.matchedTitle || prompt,
                          message: data.story.message || 'This topic was already generated in your library.'
                        }
                      }
                    : t
                )
              );
              return;
            }

            // 2. If Cancelled Callback received from n8n
            if (data.story.status === 'CANCELLED') {
              audioEngine.playSfx('click');
              setIsGenerating(false);
              updateHistoryAndSave((prev) =>
                prev.map((t) =>
                  t.id === activeThreadId
                    ? {
                        ...t,
                        status: 'CANCELLED',
                        cancelReason: 'Generation was cancelled.'
                      }
                    : t
                )
              );
              return;
            }

            // 3. Fresh Story Ready for Approval
            audioEngine.playSfx('success');
            setIsGenerating(false);
            updateHistoryAndSave((prev) =>
              prev.map((t) =>
                t.id === activeThreadId
                  ? {
                      ...t,
                      status: 'READY_FOR_APPROVAL',
                      title: data.story.suggestedTitle || t.title,
                      story: data.story
                    }
                  : t
              )
            );
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

  // ─── THREAD SELECTION & ACTIONS ───
  const handleSelectShort = (threadId) => {
    const t = pastShorts.find(x => x.id === threadId);
    if (!t) return;
    setActiveThreadId(threadId);
    setPrompt(t.rawUserInput || t.title || '');
    if (t.voiceId) setVoiceId(t.voiceId);
    if (t.visualStyleId) setStyleId(t.visualStyleId);
    if (t.musicId) setMusicId(t.musicId);
    if (t.language) setLanguage(t.language);
    setIsGenerating(t.status === 'GENERATING');
  };

  const handleSelectTemplate = (item) => {
    audioEngine.playSfx('click');
    setPrompt(item.prompt);
    if (item.voice) setVoiceId(item.voice);
    if (item.style) setStyleId(item.style);
    setActiveThreadId(null);
    setIsGenerating(false);

    setTimeout(() => {
      const el = document.getElementById('shorts-prompt-input');
      if (el) el.focus();
    }, 100);
  };

  const handleNewShort = () => {
    setActiveThreadId(null);
    setPrompt('');
    setIsGenerating(false);
    setTimeout(() => {
      const el = document.getElementById('shorts-prompt-input');
      if (el) el.focus();
    }, 100);
  };

  const handleDeleteShort = (id) => {
    updateHistoryAndSave((prev) => prev.filter(x => x.id !== id));
    if (activeThreadId === id) {
      handleNewShort();
    }
  };

  // ─── TRIGGER N8N WORKFLOW VIA NETLIFY FUNCTION ───
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    audioEngine.playSfx('boom');
    const startTime = Date.now();
    generationStartTimeRef.current = startTime;

    const threadId = 'thread-' + startTime;
    const newThread = {
      id: threadId,
      name: prompt.substring(0, 32) + (prompt.length > 32 ? '...' : ''),
      title: prompt.trim(),
      rawUserInput: prompt.trim(),
      voiceId: voiceId,
      visualStyleId: styleId,
      musicId: musicId,
      language: language,
      criticScore: 98,
      status: 'GENERATING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save active thread in state and localStorage immediately
    updateHistoryAndSave((prev) => [newThread, ...prev.filter(x => x.id !== threadId)]);
    setActiveThreadId(threadId);
    setIsGenerating(true);
    setGenerationStage('Connecting to n8n Cloud video engine...');

    // Clear serverless cache on Netlify
    try {
      fetch('/.netlify/functions/story-approval?clear=true', { method: 'DELETE' }).catch(() => {});
    } catch (e) {}

    const payload = {
      prompt: prompt.trim(),
      voiceId: voiceId,
      visualStyle: styleId,
      musicTrack: musicId,
      language: language
    };

    let sent = false;

    // 1. Send to Netlify Function
    try {
      const netlifyRes = await fetch('/.netlify/functions/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (netlifyRes.ok) {
        sent = true;
      }
    } catch (e) {}

    // 2. Local Bridge fallback
    if (!sent) {
      try {
        const localRes = await fetch('http://localhost:3001/api/generate-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (localRes.ok) {
          sent = true;
        }
      } catch (e) {}
    }

    // 3. Offline simulation fallback
    if (!sent) {
      simulateStoryGeneration(threadId);
    }
  };

  const simulateStoryGeneration = (threadId) => {
    setTimeout(() => {
      setIsGenerating(false);
      const generated = {
        executionId: 'exec-' + Date.now(),
        topic: prompt,
        genre: 'Universal Viral Story',
        visualStyle: styleId === 'cinematic' ? 'Cinematic Realistic' : styleId,
        language: language,
        duration: '75 seconds (5 scenes × 15s)',
        suggestedTitle: prompt.includes('?') ? prompt : `${prompt} का सबसे खौफनाक सच! 😱`,
        viralHook: 'पहले 3 सेकंड में दर्शकों को हिला देने वाला रहस्यमयी हुक!',
        storyBrief: `Scene 1 (0-15s): Dramatic opening hook introducing the mystery.\nScene 2 (15-30s): Tense discovery and evidence exploration.\nScene 3 (30-45s): The shocking turning point.\nScene 4 (45-60s): Climax resolution and impossible facts.\nScene 5 (60-75s): Final wisdom and subscribe call-to-action.`,
        approveUrl: 'https://cmpunktg22.app.n8n.cloud/webhook-waiting/test?approval=yes',
        cancelUrl: 'https://cmpunktg22.app.n8n.cloud/webhook-waiting/test?approval=no',
        timestamp: new Date().toISOString()
      };

      updateHistoryAndSave((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                status: 'READY_FOR_APPROVAL',
                title: generated.suggestedTitle,
                story: generated
              }
            : t
        )
      );
    }, 4500);
  };

  // ─── USER APPROVES STORY ─────────────────────────────────────────
  const handleApproveStory = async (approveUrl) => {
    try {
      await fetch('/.netlify/functions/approve-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approveUrl, action: 'APPROVE' })
      });
    } catch (e) {
      try {
        await fetch('http://localhost:3001/api/approve-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approveUrl, action: 'APPROVE' })
        });
      } catch (err) {}
    }

    setShowModal(true);
    setTimeout(() => {
      setShowModal(false);
      updateHistoryAndSave((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? {
                ...t,
                status: 'COMPLETED',
                criticScore: 99,
                youtubeDescription: `${t.rawUserInput}\n\n75-second YouTube Short generated by ShortsAI Engine.\n\n#Shorts #Viral #AI`,
                tags: ['Viral Shorts', 'Hindi Facts', 'Mystery'],
                scenes: PRESETS.bermuda.scenes
              }
            : t
        )
      );
    }, 4500);
  };

  // ─── USER CANCELS STORY ──────────────────────────────────────────
  const handleRejectStory = async (cancelUrl) => {
    try {
      await fetch('/.netlify/functions/approve-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approveUrl: cancelUrl, action: 'CANCEL' })
      });
    } catch (e) {
      try {
        await fetch('http://localhost:3001/api/approve-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approveUrl: cancelUrl, action: 'CANCEL' })
        });
      } catch (err) {}
    }

    audioEngine.playSfx('click');
    setIsGenerating(false);

    // Gracefully transition this exact thread to CANCELLED state without resetting!
    updateHistoryAndSave((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              status: 'CANCELLED',
              cancelReason: 'Story was cancelled by creator.'
            }
          : t
      )
    );
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
                   activeThread.status === 'CANCELLED' ? '❌ Cancelled' : '⚡ Generating'}
                </span>
              </div>
            </div>
          )}

          {/* User Prompt Message Bubble (Always shown in thread context) */}
          {activeThread && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '20px'
            }}>
              <div style={{
                maxWidth: '75%',
                background: 'var(--grad-primary)',
                color: '#ffffff',
                padding: '12px 18px',
                borderRadius: '18px 18px 4px 18px',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)',
                fontSize: '13.5px',
                lineHeight: 1.5,
                fontWeight: 600
              }}>
                {activeThread.rawUserInput || activeThread.title}
              </div>
            </div>
          )}

          {/* 1. If Actively Generating: Show 5-Act Thinking & Reasoning Animation */}
          {isGenerating && (
            <GenerationThinkingAnimation
              prompt={prompt}
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
                    onClick={() => {
                      handleGenerate();
                    }}
                    className="btn-glow"
                    style={{ fontSize: '11.5px', padding: '6px 14px', gap: '6px' }}
                  >
                    <RefreshCw size={12} />
                    <span>Retry Same Topic</span>
                  </button>

                  <button
                    onClick={() => {
                      setPrompt(prev => prev + ' - What Scientists Refuse to Tell You');
                      setTimeout(handleGenerate, 150);
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
                    setTimeout(handleGenerate, 150);
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
              key={activeThread.id}
              shortData={activeThread}
              onRegenerate={handleGenerate}
            />
          )}

          {/* 6. If Empty Canvas (No Active Thread): Show Inspiration Templates */}
          {!activeThread && !isGenerating && (
            <TemplateCards
              onSelectTemplate={handleSelectTemplate}
              onSelectPreset={handleSelectShort}
            />
          )}
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
              onSubmit={handleGenerate}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
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
