import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import CanvasPromptBar from './CanvasPromptBar';
import TemplateCards from './TemplateCards';
import ResultThreadCard from './ResultThreadCard';
import StoryApprovalCard from './StoryApprovalCard';
import GenerationPipelineModal from '../BottomDrawer/GenerationPipelineModal';
import { PRESETS } from '../../data/presets';
import { VOICES } from '../../data/voices';
import { VISUAL_STYLES } from '../../data/visualStyles';
import { MUSIC_TRACKS } from '../../data/musicTracks';
import { audioEngine } from '../../audio/audioEngine';
import { Sparkles, Loader2, Plus, ArrowLeft } from 'lucide-react';

export default function DashboardApp({ 
  initialPresetId = null,
  sidebarCollapsed = false,
  onToggleSidebar,
  user,
  onNavigateToSettings,
  onLogout
}) {
  const [activeShortId, setActiveShortId] = useState(initialPresetId);
  const [prompt, setPrompt] = useState('');
  const [voiceId, setVoiceId] = useState('adam');
  const [styleId, setStyleId] = useState('cinematic');
  const [musicId, setMusicId] = useState('mystery');
  const [language, setLanguage] = useState('Hinglish');

  const [pastShorts, setPastShorts] = useState(Object.values(PRESETS));
  const [activeShort, setActiveShort] = useState(initialPresetId ? (PRESETS[initialPresetId] || null) : null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [pendingApprovalStory, setPendingApprovalStory] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ─── LISTEN TO LIVE SSE OR NETLIFY SERVERLESS FUNCTION POLLING ───
  useEffect(() => {
    let eventSource;
    let pollInterval;

    // 1. Polling Netlify Serverless Function whenever isGenerating is true
    async function checkNetlifyStoryApproval() {
      try {
        const res = await fetch('/.netlify/functions/story-approval');
        if (res.ok) {
          const data = await res.json();
          if (data.hasStory && data.story) {
            console.log('Polled story from Netlify function:', data.story);
            audioEngine.playSfx('success');
            setPendingApprovalStory(data.story);
            setIsGenerating(false);
          }
        }
      } catch (err) {}
    }

    if (isGenerating) {
      checkNetlifyStoryApproval();
      pollInterval = setInterval(checkNetlifyStoryApproval, 2500);
    }

    // 2. Try Local SSE if running locally
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        eventSource = new EventSource('http://localhost:3001/api/events');
        eventSource.addEventListener('story_ready', (e) => {
          try {
            const data = JSON.parse(e.data);
            console.log('Received story approval event:', data);
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
  }, [isGenerating]);

  const handleSelectPreset = (presetId) => {
    const p = PRESETS[presetId];
    if (!p) return;
    setActiveShortId(presetId);
    setActiveShort(p);
    setPrompt(p.rawUserInput);
    setVoiceId(p.voiceId);
    setStyleId(p.visualStyleId);
    setMusicId(p.musicId);
    setLanguage(p.language);
    setPendingApprovalStory(null);
  };

  const handleSelectTemplate = (item) => {
    audioEngine.playSfx('click');
    setPrompt(item.prompt);
    if (item.voice) setVoiceId(item.voice);
    if (item.style) setStyleId(item.style);
    setActiveShort(null);
    setActiveShortId(null);
    setPendingApprovalStory(null);

    // Focus textarea
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
    setTimeout(() => {
      const el = document.getElementById('shorts-prompt-input');
      if (el) el.focus();
    }, 100);
  };

  // ─── TRIGGER N8N WORKFLOW VIA NETLIFY FUNCTION / BRIDGE ──────────
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    audioEngine.playSfx('boom');
    setIsGenerating(true);
    setGenerationStage('Sending prompt to n8n Cloud Webhook...');
    setPendingApprovalStory(null);

    const payload = {
      prompt: prompt.trim(),
      voiceId: voiceId,
      visualStyle: styleId,
      musicTrack: musicId,
      language: language
    };

    let sent = false;

    // 1. Try Netlify Serverless Function
    try {
      const netlifyRes = await fetch('/.netlify/functions/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (netlifyRes.ok) {
        sent = true;
        setGenerationStage('AI Strategy Brain & Topic Analyzer are generating 5-act story arc in n8n Cloud...');
      }
    } catch (e) {}

    // 2. Try Local Bridge if Netlify function not available
    if (!sent) {
      try {
        const localRes = await fetch('http://localhost:3001/api/generate-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (localRes.ok) {
          sent = true;
          setGenerationStage('AI Strategy Brain & Topic Analyzer are generating 5-act story arc in n8n Cloud...');
        }
      } catch (e) {}
    }

    // 3. Fallback direct simulation if offline
    if (!sent) {
      simulateStoryGeneration();
    }
  };

  const simulateStoryGeneration = () => {
    setGenerationStage('AI Strategy Brain & Topic Analyzer are writing the 5-act story arc...');
    setTimeout(() => {
      setIsGenerating(false);
      setPendingApprovalStory({
        executionId: 'exec-' + Date.now(),
        topic: prompt,
        genre: 'Mystery & Investigation',
        visualStyle: styleId === 'cinematic' ? 'Cinematic Realistic' : styleId,
        language: language,
        duration: '75 seconds (5 scenes × 15s)',
        suggestedTitle: prompt.includes('?') ? prompt : `${prompt} का सबसे खौफनाक सच! 😱`,
        viralHook: 'पहले 3 सेकंड में दर्शकों को हिला देने वाला रहस्यमयी हुक!',
        storyBrief: `Scene 1 (0-15s): Dramatic opening hook introducing the mystery.\nScene 2 (15-30s): Tense discovery and evidence exploration.\nScene 3 (30-45s): The shocking turning point.\nScene 4 (45-60s): Climax resolution and impossible facts.\nScene 5 (60-75s): Final wisdom and subscribe call-to-action.`,
        approveUrl: 'https://cmpunktg22.app.n8n.cloud/webhook-waiting/test?approval=yes',
        cancelUrl: 'https://cmpunktg22.app.n8n.cloud/webhook-waiting/test?approval=no'
      });
    }, 2800);
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

      const newShort = {
        id: 'gen-' + Date.now(),
        name: prompt.substring(0, 32) + '...',
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
        scenes: PRESETS.bermuda.scenes
      };

      setPastShorts(prev => [newShort, ...prev]);
      setActiveShort(newShort);
      setActiveShortId(newShort.id);
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
    }, 1500);
  };

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 66px)',
      width: '100vw',
      background: 'var(--bg-app)',
      overflow: 'hidden'
    }}>
      {/* Collapsible Gemini Studio Sidebar */}
      <Sidebar
        pastShorts={pastShorts}
        activeShortId={activeShortId}
        onSelectShort={handleSelectPreset}
        onNewShort={handleNewShort}
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
          padding: '24px 24px 220px 24px',
          maxWidth: '1080px',
          width: '100%',
          margin: '0 auto'
        }}>
          {/* Back to Canvas header if viewing an existing Short */}
          {activeShort && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button
                onClick={handleNewShort}
                className="btn-outline"
                style={{ fontSize: '12.5px', padding: '6px 14px', gap: '6px' }}
              >
                <ArrowLeft size={14} />
                <span>Create New Video</span>
              </button>
              <span className="badge badge-brand">
                Viewing Short: {activeShort.name}
              </span>
            </div>
          )}

          {/* Loading Indicator when n8n is writing story */}
          {isGenerating && (
            <div className="saas-card animate-float" style={{
              padding: '24px',
              textAlign: 'center',
              marginBottom: '28px',
              border: '1.5px solid var(--border-glow)',
              background: 'rgba(99, 102, 241, 0.09)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25)'
            }}>
              <Loader2 size={32} className="spin-animation" color="var(--accent-primary)" style={{ margin: '0 auto 12px auto' }} />
              <div className="font-display" style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                {generationStage}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Executing in n8n Cloud Workflow: <code>u8vcVLc00wPp2AAI</code>
              </div>
            </div>
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
          {activeShort ? (
            <ResultThreadCard
              key={activeShort.id}
              shortData={activeShort}
              onRegenerate={handleGenerate}
            />
          ) : (
            /* Empty State: Inspiration Story Templates */
            <TemplateCards
              onSelectTemplate={handleSelectTemplate}
              onSelectPreset={handleSelectPreset}
            />
          )}
        </div>

        {/* Floating Prompt Bar (Fixed Bottom Center) */}
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
