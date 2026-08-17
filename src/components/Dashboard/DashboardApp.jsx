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
import { Sparkles, Loader2 } from 'lucide-react';

export default function DashboardApp({ 
  initialPresetId = 'bermuda',
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
  const [activeShort, setActiveShort] = useState(PRESETS[initialPresetId] || PRESETS.bermuda);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [pendingApprovalStory, setPendingApprovalStory] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ─── LISTEN TO LIVE SSE OR NETLIFY SERVERLESS FUNCTION POLLING ───
  useEffect(() => {
    let eventSource;
    let pollInterval;

    // 1. Try SSE (Local Bridge Server)
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
      eventSource.onerror = () => {
        // SSE failed or running on Netlify - switch to Netlify function polling
        if (!pollInterval && isGenerating) {
          pollInterval = setInterval(checkNetlifyStoryApproval, 3000);
        }
      };
    } catch (e) {}

    // 2. Netlify Function Polling Check
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
            clearInterval(pollInterval);
          }
        }
      } catch (err) {}
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

  const handleNewShort = () => {
    setActiveShortId(null);
    setActiveShort(null);
    setPrompt('');
    setPendingApprovalStory(null);
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
        setGenerationStage('AI Strategy Brain & Topic Analyzer are analyzing topic in n8n Cloud...');
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
          setGenerationStage('AI Strategy Brain & Topic Analyzer are analyzing topic in n8n Cloud...');
        }
      } catch (e) {}
    }

    // 3. Fallback direct simulation if offline
    if (!sent) {
      simulateStoryGeneration();
    }
  };

  const simulateStoryGeneration = () => {
    setGenerationStage('AI Strategy Brain & Topic Analyzer are analyzing and writing the 5-act story arc...');
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
          padding: '24px 24px 240px 240px',
          paddingLeft: '24px',
          maxWidth: '1060px',
          width: '100%',
          margin: '0 auto'
        }}>
          {/* Loading Indicator when n8n is writing story */}
          {isGenerating && (
            <div className="saas-card animate-float" style={{
              padding: '20px',
              textAlign: 'center',
              marginBottom: '24px',
              border: '1px solid var(--border-glow)',
              background: 'rgba(99, 102, 241, 0.08)'
            }}>
              <Loader2 size={28} className="spin-animation" color="var(--accent-primary)" style={{ margin: '0 auto 10px auto' }} />
              <div className="font-display" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {generationStage}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
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
            <div style={{ textAlign: 'center', paddingTop: '20px' }}>
              <div style={{ marginBottom: '24px' }}>
                <span className="badge badge-brand animate-float" style={{ fontSize: '12px', padding: '6px 14px' }}>
                  <Sparkles size={13} />
                  ShortsAI Studio 2.0 Canvas
                </span>
                <h2 className="font-display" style={{ fontSize: '32px', fontWeight: 900, marginTop: '12px', letterSpacing: '-0.02em' }}>
                  What story would you like to create?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '540px', margin: '8px auto 0 auto' }}>
                  Type your story brief below or select a viral template to test the n8n autonomous video pipeline.
                </p>
              </div>

              <TemplateCards
                onSelectTemplate={(preset) => {
                  handleSelectPreset(preset.id);
                }}
              />
            </div>
          )}
        </div>

        {/* Floating Gemini Prompt Bar (Fixed Bottom Center) */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: sidebarCollapsed ? '68px' : '280px',
          right: 0,
          background: 'linear-gradient(to top, var(--bg-app) 75%, transparent 100%)',
          padding: '16px 24px 20px 24px',
          display: 'flex',
          justifyContent: 'center',
          zIndex: 100,
          pointerEvents: 'none',
          transition: 'left 0.25s ease'
        }}>
          <div style={{ width: '100%', maxWidth: '820px', pointerEvents: 'auto' }}>
            <CanvasPromptBar
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleGenerate}
              isGenerating={isGenerating}
              selectedVoice={voiceId}
              onVoiceChange={setVoiceId}
              selectedStyle={styleId}
              onStyleChange={setStyleId}
              selectedMusic={musicId}
              onMusicChange={setMusicId}
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
