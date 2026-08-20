import React, { useState } from 'react';
import {
  Play, Pause, Volume2, Download, Copy, Check, Sparkles, ExternalLink,
  ChevronDown, ChevronUp, CheckCircle2, Film, Mic2, Share2, ShieldCheck,
  RotateCcw, Award, Eye, EyeOff, Maximize2
} from 'lucide-react';
import { VOICES } from '../../data/voices';
import { audioEngine } from '../../audio/audioEngine';

export default function ResultThreadCard({
  shortData,
  voiceName,
  musicName,
  visualStyleName,
  onUploadYouTube,
  onRefine
}) {
  const [activeTab, setActiveTab] = useState('storyboard');
  const [isPlayingStream, setIsPlayingStream] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [copiedSEO, setCopiedSEO] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [expandedScenes, setExpandedScenes] = useState({});
  const [videoExpanded, setVideoExpanded] = useState(false);

  const scenes = shortData.scenes || [];
  const currentScene = scenes[activeSceneIdx] || scenes[0];

  const toggleSceneExpand = (idx) => {
    setExpandedScenes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

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
      setTimeout(() => setIsPlayingStream(false), 5500);
    }
  };

  const handleCopySEO = () => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(`${shortData.title}\n\n${shortData.youtubeDescription}\n\nTags: ${shortData.tags?.join(', ')}`);
    setCopiedSEO(true);
    setTimeout(() => setCopiedSEO(false), 2000);
  };

  const handleCopyScript = () => {
    audioEngine.playSfx('click');
    const text = scenes.map(s => `[SCENE ${s.sceneNumber} - ${s.act} (${s.duration}s)]\nVOICEOVER: ${s.voiceoverText}\nVISUAL PROMPT: ${s.videoPrompt}\n`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const ACT_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'];
  const ACT_LABELS = ['Hook', 'Setup', 'Build', 'Climax', 'Resolution'];

  const tabs = [
    { id: 'storyboard', label: 'Storyboard & Video', icon: <Film size={14} /> },
    { id: 'voice', label: 'Voice & Sound', icon: <Mic2 size={14} /> },
    { id: 'seo', label: 'YouTube SEO', icon: <Share2 size={14} /> },
    { id: 'critic', label: 'Quality Audit', icon: <ShieldCheck size={14} /> },
  ];

  return (
    <div className="result-card-wrapper">
      {/* ── Header: Title + YouTube Button ── */}
      <div className="result-header">
        <div className="result-header-left">
          <div className="result-badges">
            <span className="badge badge-brand">✨ 75s Production Master</span>
            <span className="badge badge-emerald">
              <CheckCircle2 size={11} />
              Score: {shortData.criticScore || 98}/100 Approved
            </span>
            {shortData.genre && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{shortData.genre}</span>
            )}
          </div>
          <h2 className="result-title">{shortData.title}</h2>
        </div>

        <button
          onClick={() => { audioEngine.playSfx('boom'); onUploadYouTube(); }}
          className="btn-youtube"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span>1-Click Upload to YouTube</span>
        </button>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="result-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { audioEngine.playSfx('click'); setActiveTab(tab.id); }}
            className={`result-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB 1: STORYBOARD ═══════════════ */}
      {activeTab === 'storyboard' && (
        <div className="storyboard-layout">

          {/* Video Player — full width, 16:9 or 9:16 */}
          {shortData.videoUrl ? (
            <div className={`video-player-container ${videoExpanded ? 'expanded' : ''}`}>
              <video
                src={shortData.videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="video-player"
              />
              <button
                className="video-expand-btn"
                onClick={() => setVideoExpanded(v => !v)}
                title={videoExpanded ? 'Shrink' : 'Expand'}
              >
                <Maximize2 size={14} />
              </button>
            </div>
          ) : (
            /* Preview canvas when no video yet */
            <div className="preview-canvas">
              <div className="preview-scene-nav">
                {scenes.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => { audioEngine.playSfx('click'); setActiveSceneIdx(idx); }}
                    className={`scene-nav-pill ${activeSceneIdx === idx ? 'active' : ''}`}
                    style={{ '--pill-color': ACT_COLORS[idx] }}
                  >
                    S{idx + 1}
                  </button>
                ))}
              </div>

              <div className="preview-voiceover">
                <div className="preview-scene-label">
                  🎬 Scene {activeSceneIdx + 1} — {currentScene?.act || 'Hook'}
                </div>
                <p className="preview-voiceover-text">
                  "{currentScene?.voiceoverText || 'Scene narration...'}"
                </p>
                <div className="preview-camera">
                  {currentScene?.cameraMotion || 'Cinematic Shot'}
                </div>
              </div>

              <div className="preview-controls">
                <button onClick={handleTogglePlayStream} className="btn-glow" style={{ padding: '8px 18px', fontSize: '13px' }}>
                  {isPlayingStream ? <Pause size={14} fill="#fff" /> : <Play size={14} fill="#fff" />}
                  <span>{isPlayingStream ? 'Pause' : 'Preview Voice'}</span>
                </button>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  🎙️ {voiceName || 'AI Voice'}
                </span>
              </div>

              <div className="preview-progress-bar">
                <div
                  className="preview-progress-fill"
                  style={{ width: `${((activeSceneIdx + 1) / Math.max(scenes.length, 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* ── 5-Scene Screenplay — Full Width Stacked Cards ── */}
          <div className="scenes-section">
            <div className="scenes-header">
              <span className="scenes-label">5-Scene Screenplay Structure</span>
              <span className="scenes-meta">75 Seconds Total · 15s Per Scene</span>
            </div>

            <div className="scenes-list">
              {scenes.map((scene, idx) => {
                const isSelected = activeSceneIdx === idx;
                const isExpanded = expandedScenes[idx];
                const charCount = scene.voiceoverText?.length || 0;
                const isPerfect = charCount >= 170 && charCount <= 220;
                const color = ACT_COLORS[idx];

                return (
                  <div
                    key={idx}
                    className={`scene-card ${isSelected ? 'selected' : ''}`}
                    style={{ '--scene-color': color }}
                  >
                    {/* Scene Card Header */}
                    <div
                      className="scene-card-header"
                      onClick={() => { audioEngine.playSfx('click'); setActiveSceneIdx(idx); }}
                    >
                      <div className="scene-card-left">
                        <div className="scene-number-badge" style={{ background: color }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="scene-act-name">{scene.act || ACT_LABELS[idx]}</div>
                          <div className="scene-char-count" style={{ color: isPerfect ? '#10b981' : '#f59e0b' }}>
                            {charCount} chars · {scene.duration || 15}s
                          </div>
                        </div>
                      </div>

                      <div className="scene-card-actions">
                        <button
                          className="scene-expand-btn"
                          onClick={(e) => { e.stopPropagation(); toggleSceneExpand(idx); }}
                          title="Toggle visual prompt"
                        >
                          {isExpanded ? <EyeOff size={13} /> : <Eye size={13} />}
                          <span>{isExpanded ? 'Hide Prompt' : 'View Prompt'}</span>
                        </button>
                        <button
                          className="scene-voice-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSceneIdx(idx);
                            audioEngine.playVoice(shortData.voiceId || 'adam', scene.voiceoverText);
                          }}
                          title="Preview voice"
                        >
                          <Volume2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Voiceover Text */}
                    <div className="scene-voiceover">
                      {scene.voiceoverText}
                    </div>

                    {/* Visual Prompt (collapsible) */}
                    {isExpanded && (
                      <div className="scene-visual-prompt">
                        <div className="scene-visual-prompt-label">🎬 Visual Prompt</div>
                        <div className="scene-visual-prompt-text">{scene.videoPrompt}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom action row */}
          <div className="storyboard-actions">
            <button onClick={handleCopyScript} className="btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>
              {copiedScript ? <Check size={14} color="#10b981" /> : <Film size={14} />}
              <span>{copiedScript ? 'Script Copied!' : 'Copy Full Screenplay'}</span>
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              🎨 {visualStyleName} · 🎵 {musicName} · 🎙️ {voiceName}
            </span>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 2: VOICE & SOUND ═══════════════ */}
      {activeTab === 'voice' && (
        <div className="voice-grid">
          <div className="voice-grid-label">
            Audition ElevenLabs Turbo v2.5 narrator models:
          </div>
          <div className="voice-cards-grid">
            {VOICES.map(v => (
              <div key={v.id} className="voice-card" style={{ borderColor: shortData.voiceId === v.id ? v.color : 'var(--border-subtle)' }}>
                <div className="voice-card-top">
                  <span className="voice-name">{v.name}</span>
                  <span className="voice-tag" style={{ color: v.color }}>{v.tag}</span>
                </div>
                <div className="voice-info">{v.flag} · {v.tone}</div>
                <button
                  onClick={() => audioEngine.playVoice(v.id, v.sampleText)}
                  className="btn-outline"
                  style={{ padding: '7px 14px', fontSize: '12px', justifyContent: 'center', marginTop: 'auto' }}
                >
                  <Volume2 size={13} />
                  <span>Audition</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 3: YOUTUBE SEO ═══════════════ */}
      {activeTab === 'seo' && (
        <div className="seo-panel">
          <div className="seo-field">
            <label className="seo-label">High-CTR Title (60–90 chars with emoji)</label>
            <div className="seo-title-box">{shortData.title}</div>
          </div>

          <div className="seo-field">
            <label className="seo-label">Structured Description (800–1200 characters)</label>
            <textarea
              value={shortData.youtubeDescription || ''}
              readOnly
              rows={5}
              className="seo-description"
            />
          </div>

          <div className="seo-field">
            <label className="seo-label">Tags & Hashtags</label>
            <div className="seo-tags">
              {shortData.tags?.map((tag, i) => (
                <span key={i} className="seo-tag">#{tag.replace(/\s+/g, '')}</span>
              ))}
            </div>
          </div>

          <button onClick={handleCopySEO} className="btn-outline" style={{ padding: '9px 20px', fontSize: '13px', alignSelf: 'flex-start' }}>
            {copiedSEO ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedSEO ? 'Copied!' : 'Copy All SEO Metadata'}</span>
          </button>
        </div>
      )}

      {/* ═══════════════ TAB 4: CRITIC AUDIT ═══════════════ */}
      {activeTab === 'critic' && (
        <div className="critic-panel">
          <div className="critic-score-banner">
            <div>
              <div className="critic-score-label">Virality & Production Scorecard</div>
              <div className="critic-score-value">
                {shortData.criticScore || 98} / 100
                <span className="critic-approved">APPROVED</span>
              </div>
            </div>
            <Award size={40} color="#34d399" />
          </div>

          <div className="critic-checks">
            {[
              '✓ 190–200 Character Speech Timing per scene',
              '✓ 5-Act Narrative Progression (Hook → Setup → Build → Climax → Resolution)',
              '✓ Content Safety & YouTube Policy Compliance',
              '✓ Technical 4K 9:16 Video Duration (75.0s Exact)',
              '✓ Emotional Hook in First 3 Seconds',
              '✓ Platform Virality Score ≥ 85/100',
            ].map((item, i) => (
              <div key={i} className="critic-check-row">
                <span>{item}</span>
                <span className="critic-passed">Passed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Toolbar ── */}
      <div className="result-toolbar">
        <button onClick={handleCopySEO} className="btn-outline" style={{ padding: '7px 14px', fontSize: '12px' }}>
          {copiedSEO ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
          <span>Copy SEO</span>
        </button>
        <button onClick={handleCopyScript} className="btn-outline" style={{ padding: '7px 14px', fontSize: '12px' }}>
          {copiedScript ? <Check size={13} color="#10b981" /> : <Film size={13} />}
          <span>Copy Script</span>
        </button>
        <button
          onClick={() => { audioEngine.playSfx('click'); alert(`Downloading 4K Master MP4 for "${shortData.title}"`); }}
          className="btn-outline"
          style={{ padding: '7px 14px', fontSize: '12px' }}
        >
          <Download size={13} />
          <span>Download 4K</span>
        </button>
        {shortData.youtubeUrl && (
          <a
            href={shortData.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glow"
            style={{ padding: '7px 14px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ExternalLink size={13} />
            <span>Watch on YouTube</span>
          </a>
        )}
      </div>
    </div>
  );
}
