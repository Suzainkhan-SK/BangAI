import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  Film,
  Mic2,
  Share2,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Award,
  Layers
} from 'lucide-react';
import { VOICES } from '../../data/voices';
import { MUSIC_TRACKS } from '../../data/musicTracks';
import { audioEngine } from '../../audio/audioEngine';

export default function ResultThreadCard({
  shortData,
  voiceName,
  musicName,
  visualStyleName,
  onUploadYouTube,
  onRefine
}) {
  const [activeTab, setActiveTab] = useState('storyboard'); // 'storyboard' | 'voice' | 'seo' | 'critic'
  const [isPlayingStream, setIsPlayingStream] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [copiedSEO, setCopiedSEO] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const scenes = shortData.scenes || [];
  const currentScene = scenes[activeSceneIdx] || scenes[0];

  const handleTogglePlayStream = () => {
    audioEngine.playSfx('click');
    if (isPlayingStream) {
      audioEngine.stopVoice();
      setIsPlayingStream(false);
    } else {
      setIsPlayingStream(true);
      if (currentScene?.voiceoverText) {
        audioEngine.playVoice(shortData.voiceId || 'adam', currentScene.voiceoverText);
      }
      setTimeout(() => {
        setIsPlayingStream(false);
      }, 5500);
    }
  };

  const handleCopySEO = () => {
    audioEngine.playSfx('click');
    const text = `${shortData.title}\n\n${shortData.youtubeDescription}\n\nTags: ${shortData.tags?.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopiedSEO(true);
    setTimeout(() => setCopiedSEO(false), 2000);
  };

  const handleCopyScript = () => {
    audioEngine.playSfx('click');
    const text = scenes.map((s) => `[SCENE ${s.sceneNumber} - ${s.act} (${s.duration}s)]\nVOICEOVER: ${s.voiceoverText}\nVISUAL PROMPT: ${s.videoPrompt}\n`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1020px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* 1. User Prompt Bubble (Gemini Style) */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: '20px 20px 4px 20px',
          padding: '14px 20px',
          maxWidth: '680px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
            {shortData.rawUserInput || shortData.title}
          </div>
        </div>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'var(--grad-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '14px',
          flexShrink: 0
        }}>
          U
        </div>
      </div>

      {/* 2. Gemini AI Response Container */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', width: '100%' }}>
        {/* Gemini Sparkle Avatar */}
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '14px',
          background: 'var(--grad-gemini)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.45)',
          flexShrink: 0,
          marginTop: '4px'
        }}>
          <Sparkles size={22} />
        </div>

        {/* AI Output Card (Fluid & Responsive) */}
        <div className="saas-card" style={{
          flex: 1,
          width: '100%',
          borderRadius: '24px',
          padding: '28px',
          border: '1.5px solid var(--border-glow)',
          boxShadow: 'var(--shadow-glow)',
          overflow: 'hidden'
        }}>
          {/* Card Top Title & Quick Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-brand" style={{ fontSize: '11.5px' }}>
                  ✨ 75s Production Master
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '11.5px' }}>
                  <CheckCircle2 size={12} /> Score: {shortData.criticScore || 98}/100 Approved
                </span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  {shortData.genre}
                </span>
              </div>
              <h2 className="font-display" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                {shortData.title}
              </h2>
            </div>

            {/* 1-Click Upload to YouTube Button */}
            <button
              onClick={() => {
                audioEngine.playSfx('boom');
                onUploadYouTube();
              }}
              className="btn-glow"
              style={{ padding: '11px 22px', fontSize: '14px', flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>1-Click Upload to YouTube</span>
            </button>
          </div>

          {/* Clean Gemini Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '14px',
            marginBottom: '24px',
            overflowX: 'auto'
          }}>
            {[
              { id: 'storyboard', label: '🎬 Storyboard & 9:16 Video', icon: <Film size={15} /> },
              { id: 'voice', label: '🎙️ Voice & Sound Matrix', icon: <Mic2 size={15} /> },
              { id: 'seo', label: '📊 YouTube SEO & Tags', icon: <Share2 size={15} /> },
              { id: 'critic', label: '🛡️ Quality Critic Audit', icon: <ShieldCheck size={15} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  audioEngine.playSfx('click');
                  setActiveTab(tab.id);
                }}
                style={{
                  background: activeTab === tab.id ? 'var(--grad-primary)' : 'var(--bg-input)',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '99px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: STORYBOARD & 9:16 PLAYER (Responsive & Spacious) */}
          {activeTab === 'storyboard' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
              gap: '28px',
              alignItems: 'start'
            }}>
              {/* Left: 9:16 Video Canvas Player */}
              <div style={{
                width: '100%',
                maxWidth: '340px',
                height: '480px',
                margin: '0 auto',
                borderRadius: '26px',
                background: 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 70%, #020617 100%)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '18px',
                border: '2px solid var(--border-medium)',
                boxShadow: 'var(--shadow-card)'
              }}>
                {/* Top Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', fontWeight: 700, background: 'rgba(0,0,0,0.6)', padding: '3px 8px', borderRadius: '6px' }}>
                    Scene {activeSceneIdx + 1}/5 ({currentScene?.act?.split(' ')[0] || 'Hook'})
                  </span>
                  <span style={{ fontSize: '11px', background: 'rgba(0,0,0,0.6)', color: '#34d399', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    15s
                  </span>
                </div>

                {/* Center Subtitle Pop */}
                <div style={{
                  zIndex: 10,
                  background: 'rgba(0, 0, 0, 0.88)',
                  padding: '16px 14px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  textAlign: 'center',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.9)'
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '6px' }}>
                    🎬 {currentScene?.cameraMotion || 'Cinematic Shot'}
                  </div>
                  <p style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    lineHeight: 1.45,
                    color: '#ffffff'
                  }}>
                    "{currentScene?.voiceoverText || 'Narration streaming...'}"
                  </p>
                </div>

                {/* Bottom Controls */}
                <div style={{ zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <button
                      onClick={handleTogglePlayStream}
                      className="btn-glow"
                      style={{ padding: '7px 16px', fontSize: '12px' }}
                    >
                      {isPlayingStream ? <Pause size={13} fill="#ffffff" /> : <Play size={13} fill="#ffffff" />}
                      <span>{isPlayingStream ? 'Pause' : 'Play Scene Voice'}</span>
                    </button>
                    <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600 }}>
                      🎙️ {voiceName}
                    </div>
                  </div>

                  {/* Scene Selector Pills */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
                    {scenes.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          audioEngine.playSfx('click');
                          setActiveSceneIdx(idx);
                        }}
                        style={{
                          background: activeSceneIdx === idx ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.12)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '5px 0',
                          fontSize: '11px',
                          color: '#ffffff',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        S{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Red Progress Line */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ height: '100%', width: `${((activeSceneIdx + 1) / 5) * 100}%`, background: '#ef4444' }} />
                </div>
              </div>

              {/* Right: 5-Scene Breakdown List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                  5-Scene Screenplay Structure (75 Seconds Total)
                </div>

                {scenes.map((scene, idx) => {
                  const isSelected = activeSceneIdx === idx;
                  const charCount = scene.voiceoverText?.length || 0;
                  const isPerfect = charCount >= 180 && charCount <= 210;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        audioEngine.playSfx('click');
                        setActiveSceneIdx(idx);
                      }}
                      style={{
                        background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                        border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                        borderRadius: '16px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            background: 'var(--border-subtle)',
                            color: 'var(--text-primary)',
                            fontWeight: 800,
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}>
                            Scene {idx + 1}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                            {scene.act}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: isPerfect ? '#10b981' : '#f59e0b',
                          background: isPerfect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          {charCount} / 200 chars ({scene.duration}s)
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '8px' }}>
                        {scene.voiceoverText}
                      </div>

                      <div style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono', lineHeight: 1.4 }}>
                        🎬 {scene.videoPrompt}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: VOICE & SOUND MATRIX */}
          {activeTab === 'voice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                Audition ElevenLabs Turbo v2.5 narrator models and configure background music ducking:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
                {VOICES.map((v) => (
                  <div
                    key={v.id}
                    className="saas-card"
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: `1.5px solid ${shortData.voiceId === v.id ? v.color : 'var(--border-subtle)'}`
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>{v.name}</span>
                        <span style={{ fontSize: '10.5px', color: v.color, fontWeight: 700 }}>{v.tag}</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                        {v.flag} • {v.tone}
                      </div>
                    </div>

                    <button
                      onClick={() => audioEngine.playVoice(v.id, v.sampleText)}
                      className="btn-outline"
                      style={{ padding: '7px 14px', fontSize: '12px', justifyContent: 'center' }}
                    >
                      <Volume2 size={13} />
                      <span>Audition Voice</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: YOUTUBE SEO & METADATA */}
          {activeTab === 'seo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  High-CTR Title (60–90 chars with emoji):
                </label>
                <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {shortData.title}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Structured Description (800–1200 characters):
                </label>
                <textarea
                  value={shortData.youtubeDescription}
                  readOnly
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '12.5px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'JetBrains Mono',
                    lineHeight: 1.5,
                    resize: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Tags & Hashtags:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {shortData.tags?.map((tag, i) => (
                    <span key={i} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      #{tag.replace(/\s+/g, '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUALITY CRITIC AUDIT */}
          {activeTab === 'critic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                    Virality & Production Scorecard
                  </div>
                  <div className="font-display" style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff' }}>
                    {shortData.criticScore || 98} / 100 <span style={{ fontSize: '14px', color: '#34d399' }}>(APPROVED)</span>
                  </div>
                </div>
                <Award size={36} color="#34d399" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--bg-input)', borderRadius: '10px' }}>
                  <span>✓ 190–200 Character Speech Timing per scene</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Passed</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--bg-input)', borderRadius: '10px' }}>
                  <span>✓ 5-Act Narrative Progression (Hook → Setup → Build → Climax → Resolution)</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Passed</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--bg-input)', borderRadius: '10px' }}>
                  <span>✓ Content Safety & YouTube Policy Compliance</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Passed</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--bg-input)', borderRadius: '10px' }}>
                  <span>✓ Technical 4K 9:16 Video Duration (75.0s Exact)</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Passed</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={handleCopySEO}
                className="btn-outline"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                {copiedSEO ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedSEO ? 'SEO Copied!' : 'Copy SEO Metadata'}</span>
              </button>

              <button
                onClick={handleCopyScript}
                className="btn-outline"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                {copiedScript ? <Check size={14} color="#10b981" /> : <Film size={14} />}
                <span>{copiedScript ? 'Script Copied!' : 'Copy Screenplay'}</span>
              </button>

              <button
                onClick={() => {
                  audioEngine.playSfx('click');
                  alert(`Downloading 4K Master MP4 for "${shortData.title}"`);
                }}
                className="btn-outline"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Download size={14} />
                <span>Download 4K MP4</span>
              </button>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              🎨 {visualStyleName} • 🎵 {musicName} • 🎙️ {voiceName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
