import React, { useState, useEffect } from 'react';
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
import { Sparkles, Loader2, Plus, ArrowLeft, XCircle, AlertTriangle, RefreshCw, Wand2 } from 'lucide-react';

function getInitialHistory() {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('shortsai_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
  }
  return [
    PRESETS.bermuda,
    PRESETS.dragons,
    PRESETS.fruits
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
  const [activeShortId, setActiveShortId] = useState(initialPresetId);
  const [activeShort, setActiveShort] = useState(() => {
    if (initialPresetId) {
      const all = getInitialHistory();
      return all.find(s => s.id === initialPresetId) || PRESETS[initialPresetId] || null;
    }
    return null;
  });

  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [voiceId, setVoiceId] = useState('adam');
  const [styleId, setStyleId] = useState('cinematic');
  const [musicId, setMusicId] = useState('mystery');
  const [language, setLanguage] = useState('Hinglish');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [pendingApprovalStory, setPendingApprovalStory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cancelNotice, setCancelNotice] = useState(null);
  const [duplicateNotice, setDuplicateNotice] = useState(null);

  // Sync real history to localStorage
  const saveHistory = (items) => {
    setPastShorts(items);
    try {
      localStorage.setItem('shortsai_chat_history', JSON.stringify(items));
    } catch (e) {}
  };

  // ─── LISTEN TO LIVE SSE OR NETLIFY SERVERLESS FUNCTION POLLING ───
  useEffect(() => {
    let eventSource;
    let pollInterval;

    async function checkNetlifyStoryApproval() {
      try {
        const res = await fetch('/.netlify/functions/story-approval');
        if (res.ok) {
          const data = await res.json();
          if (data.hasStory && data.story) {
            console.log('Polled story callback from Netlify function:', data.story);

            // 1. If Duplicate Topic Alert received
            if (data.story.status === 'DUPLICATE_TOPIC') {
              audioEngine.playSfx('click');
              setIsGenerating(false);
              setPendingApprovalStory(null);
              setDuplicateNotice({
                matchedTitle: data.story.matchedTitle || prompt,
                message: data.story.message || 'This topic was already covered in your channel memory.'
              });
              return;
            }

            // 2. If Cancelled Callback received
            if (data.story.status === 'CANCELLED') {
              audioEngine.playSfx('click');
              setIsGenerating(false);
              setPendingApprovalStory(null);
              setCancelNotice('Video generation was cancelled.');
              setTimeout(() => setCancelNotice(null), 5000);
              return;
            }

            // 3. Story ready for approval
            audioEngine.playSfx('success');
            setPendingApprovalStory(data.story);
            setIsGenerating(false);
            setDuplicateNotice(null);
            setCancelNotice(null);

            // Update real history item
            setPastShorts((prev) => {
              const updated = prev.map((item) => {
                if (item.rawUserInput === prompt || item.id === activeShortId) {
                  return {
                    ...item,
                    suggestedTitle: data.story.suggestedTitle,
                    viralHook: data.story.viralHook,
                    storyBrief: data.story.storyBrief,
                    approveUrl: data.story.approveUrl,
                    cancelUrl: data.story.cancelUrl,
                    status: 'READY_FOR_APPROVAL'
                  };
                }
                return item;
              });
              try {
                localStorage.setItem('shortsai_chat_history', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }
        }
      } catch (err) {}
    }

    if (isGenerating) {
      checkNetlifyStoryApproval();
      pollInterval = setInterval(checkNetlifyStoryApproval, 2500);
    }

    // Local SSE fallback for localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        eventSource = new EventSource('http://localhost:3001/api/events');
        eventSource.addEventListener('story_ready', (e) => {
          try {
            const data = JSON.parse(e.data);
            audioEngine.playSfx('success');
            setPendingApprovalStory(data);
            setIsGenerating(false);
          } catch (err) {}
        });
      } catch (e) {}
    }

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isGenerating, prompt, activeShortId]);

  const handleSelectShort = (shortId) => {
    const s = pastShorts.find(x => x.id === shortId) || PRESETS[shortId];
    if (!s) return;
    setActiveShortId(shortId);
    setActiveShort(s);
    setPrompt(s.rawUserInput || s.title || '');
    if (s.voiceId) setVoiceId(s.voiceId);
    if (s.visualStyleId) setStyleId(s.visualStyleId);
    if (s.musicId) setMusicId(s.musicId);
    if (s.language) setLanguage(s.language);
    setPendingApprovalStory(null);
    setCancelNotice(null);
    setDuplicateNotice(null);
  };

  const handleSelectTemplate = (item) => {
    audioEngine.playSfx('click');
    setPrompt(item.prompt);
    if (item.voice) setVoiceId(item.voice);
    if (item.style) setStyleId(item.style);
    setActiveShort(null);
    setActiveShortId(null);
    setPendingApprovalStory(null);
    setCancelNotice(null);
    setDuplicateNotice(null);

    setTimeout(() => {
      const el = document.getElementById('shorts-prompt-input');
      if (el) el.focus();
    }, 100);
  };

  const handleNewShort = () => {
    setActiveShortId(null);
    setActiveShort(null);
    setPrompt('');
    setPendingApprovalStory(null);
    setCancelNotice(null);
    setDuplicateNotice(null);
    setTimeout(() => {
      const el = document.getElementById('shorts-prompt-input');
      if (el) el.focus();
    }, 100);
  };

  const handleDeleteShort = (id) => {
    const updated = pastShorts.filter(x => x.id !== id);
    saveHistory(updated);
    if (activeShortId === id) {
      handleNewShort();
    }
  };

  // ─── TRIGGER N8N WORKFLOW VIA NETLIFY FUNCTION / BRIDGE ──────────
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    audioEngine.playSfx('boom');
    setIsGenerating(true);
    setGenerationStage('Dispatching prompt to n8n Cloud Webhook...');
    setPendingApprovalStory(null);
    setCancelNotice(null);
    setDuplicateNotice(null);

    const newId = 'gen-' + Date.now();
    const newEntry = {
      id: newId,
      name: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
      title: prompt,
      rawUserInput: prompt.trim(),
      voiceId: voiceId,
      visualStyleId: styleId,
      musicId: musicId,
      language: language,
      criticScore: 98,
      status: 'GENERATING',
      createdAt: new Date().toISOString(),
      scenes: PRESETS.bermuda.scenes
    };

    // Prepend to real history
    const updatedHistory = [newEntry, ...pastShorts.filter(x => x.id !== newId)];
    saveHistory(updatedHistory);
    setActiveShortId(newId);

    const payload = {
      prompt: prompt.trim(),
      voiceId: voiceId,
      visualStyle: styleId,
      musicTrack: musicId,
      language: language
    };

    let sent = false;

    // 1. Netlify Function
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

    // 2. Local Bridge
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

    // 3. Fallback simulation if completely offline
    if (!sent) {
      simulateStoryGeneration();
    }
  };

  const simulateStoryGeneration = () => {
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
        cancelUrl: 'https://cmpunktg22.app.n8n.cloud/webhook-waiting/test?approval=no'
      };
      setPendingApprovalStory(generated);

      // Update real history item
      setPastShorts(prev => {
        const updated = prev.map(item => {
          if (item.rawUserInput === prompt) {
            return {
              ...item,
              suggestedTitle: generated.suggestedTitle,
              viralHook: generated.viralHook,
              storyBrief: generated.storyBrief,
              status: 'READY_FOR_APPROVAL'
            };
          }
          return item;
        });
        saveHistory(updated);
        return updated;
      });
    }, 3500);
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
      setPendingApprovalStory(null);

      const completed = {
        id: activeShortId || ('gen-' + Date.now()),
        name: prompt.substring(0, 30) + '...',
        title: pendingApprovalStory?.suggestedTitle || prompt,
        rawUserInput: prompt,
        genre: pendingApprovalStory?.genre || 'Universal Viral Short',
        voiceId: voiceId,
        musicId: musicId,
        visualStyleId: styleId,
        language: language,
        criticScore: 99,
        viralHook: pendingApprovalStory?.viralHook || 'Shocking 3s hook',
        youtubeDescription: `${prompt}\n\n75-second YouTube Short produced by ShortsAI Engine.\n\n#Shorts #Viral #AI`,
        tags: ['Viral Shorts', 'Hindi Shorts', 'Facts', 'Mystery'],
        status: 'COMPLETED',
        scenes: PRESETS.bermuda.scenes
      };

      const updated = [completed, ...pastShorts.filter(x => x.id !== completed.id)];
      saveHistory(updated);
      setActiveShort(completed);
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
    } catch (e) {
      try {
        await fetch('http://localhost:3001/api/approve-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approveUrl: cancelUrl, action: 'CANCEL' })
        });
      } catch (err) {}
    }

    setTimeout(() => {
      setPendingApprovalStory(null);
      setCancelNotice('Story generation cancelled.');
      setTimeout(() => setCancelNotice(null), 4000);
    }, 1200);
  };

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 66px)',
      width: '100vw',
      background: 'var(--bg-app)',
      overflow: 'hidden'
    }}>
      {/* Sleek Compact Sidebar with Real History */}
      <Sidebar
        pastShorts={pastShorts}
        activeShortId={activeShortId}
        onSelectShort={handleSelectShort}
        onNewShort={handleNewShort}
        onDeleteShort={handleDeleteShort}
        collapsed={sidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
        user={user}
        onOpenSettings={onNavigateToSettings}
        onLogout={onLogout}
      />

      {/* Main Studio Center Canvas */}
      <main style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Canvas Body with generous clearance */}
        <div style={{
          flex: 1,
          padding: '20px 20px 170px 20px',
          maxWidth: '840px',
          width: '100%',
          margin: '0 auto'
        }}>
          {/* Back to Canvas header if viewing an existing Short */}
          {activeShort && !isGenerating && !pendingApprovalStory && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <button
                onClick={handleNewShort}
                className="btn-outline"
                style={{ fontSize: '12px', padding: '5px 12px', gap: '6px' }}
              >
                <ArrowLeft size={13} />
                <span>Create New Video</span>
              </button>
              <span className="badge badge-brand" style={{ fontSize: '11px' }}>
                Viewing: {activeShort.name || activeShort.title}
              </span>
            </div>
          )}

          {/* Cancellation Alert Banner */}
          {cancelNotice && (
            <div className="saas-card animate-float" style={{
              padding: '16px 20px',
              borderRadius: '16px',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.08)',
              boxShadow: '0 8px 30px rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444'
                }}>
                  <XCircle size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ef4444' }}>
                    Story Generation Cancelled
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Your session was reset. You can refine your prompt or start a new video.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    setCancelNotice(null);
                    handleGenerate();
                  }}
                  className="btn-outline"
                  style={{ fontSize: '11.5px', padding: '5px 12px', gap: '5px' }}
                >
                  <RefreshCw size={12} />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={handleNewShort}
                  className="btn-glow"
                  style={{ fontSize: '11.5px', padding: '5px 14px' }}
                >
                  New Short
                </button>
              </div>
            </div>
          )}

          {/* Duplicate Topic Warning Banner */}
          {duplicateNotice && (
            <div className="saas-card animate-float" style={{
              padding: '18px 20px',
              borderRadius: '16px',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.08)',
              boxShadow: '0 8px 30px rgba(245, 158, 11, 0.15)',
              marginBottom: '22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                    flexShrink: 0
                  }}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b', marginBottom: '2px' }}>
                      Similar Topic Already Generated!
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {duplicateNotice.message} (Matched: <i>"{duplicateNotice.matchedTitle}"</i>)
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      💡 <b>Pro-Tip:</b> Twist the topic with a secret angle, like <i>"The 2026 Classified Truth"</i> or <i>"What Scientists Refuse to Tell You"</i>.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => {
                      setPrompt(prev => prev + ' - The Shocking 2026 Truth');
                      setDuplicateNotice(null);
                      setTimeout(handleGenerate, 200);
                    }}
                    className="btn-glow"
                    style={{ fontSize: '11.5px', padding: '6px 14px', gap: '5px' }}
                  >
                    <Wand2 size={12} />
                    <span>Add Viral Twist</span>
                  </button>
                  <button
                    onClick={handleNewShort}
                    className="btn-outline"
                    style={{ fontSize: '11.5px', padding: '5px 12px', textAlign: 'center' }}
                  >
                    Change Topic
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live Thinking & Reasoning Animation */}
          {isGenerating && (
            <GenerationThinkingAnimation
              prompt={prompt}
              stage={generationStage}
            />
          )}

          {/* AI Story Approval Card (When n8n responds with generated story) */}
          {pendingApprovalStory && (
            <StoryApprovalCard
              story={pendingApprovalStory}
              onApprove={handleApproveStory}
              onReject={handleRejectStory}
            />
          )}

          {/* Completed Short Video Studio Result Card */}
          {activeShort && !isGenerating && !pendingApprovalStory && !duplicateNotice ? (
            <ResultThreadCard
              key={activeShort.id}
              shortData={activeShort}
              onRegenerate={handleGenerate}
            />
          ) : !isGenerating && !pendingApprovalStory && !duplicateNotice ? (
            /* Empty State: Inspiration Story Templates */
            <TemplateCards
              onSelectTemplate={handleSelectTemplate}
              onSelectPreset={handleSelectShort}
            />
          ) : null}
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
