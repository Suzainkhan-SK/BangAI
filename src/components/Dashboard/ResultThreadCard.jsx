import React, { useState, useRef, useMemo } from 'react';
import {
  Play, Pause, Volume2, Download, Copy, Check, Sparkles, ExternalLink,
  ChevronDown, ChevronUp, CheckCircle2, Film, Mic2, Share2, ShieldCheck,
  RotateCcw, Award, Eye, EyeOff, Maximize2, Sliders, Music, Type, Clapperboard,
  Loader2, Radio, AlertTriangle, HelpCircle
} from 'lucide-react';
import { VOICES, getVoiceById } from '../../data/voices';
import { MUSIC_TRACKS, getMusicTrackById } from '../../data/musicTracks';
import { SUBTITLE_STYLES } from '../../data/subtitleStyles';
import { audioEngine } from '../../audio/audioEngine';
import { useBreakpoint } from '../../hooks/useMediaQuery';

// Greatest common divisor — used to print a real aspect ratio from measured pixels.
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

// Human quality tier from the measured short edge of the frame.
function qualityTier(w, h) {
  const shortEdge = Math.min(w, h);
  if (shortEdge >= 2160) return '4K';
  if (shortEdge >= 1440) return '1440p';
  if (shortEdge >= 1080) return '1080p';
  if (shortEdge >= 720) return '720p';
  return `${shortEdge}p`;
}

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [videoVolume, setVideoVolume] = useState(1.0);
  // Measured straight off the decoded file — never hardcoded.
  const [videoMeta, setVideoMeta] = useState(null);
  const videoRef = useRef(null);
  const { isMobile } = useBreakpoint();

  const handleVideoVolumeChange = (newVol) => {
    const v = Math.max(0, Math.min(1, parseFloat(newVol) || 0));
    setVideoVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
    }
  };

  // Read real width/height/duration once the browser has the file header.
  const handleLoadedMetadata = (e) => {
    const el = e.currentTarget;
    if (!el) return;
    setVideoMeta({
      width: el.videoWidth || 0,
      height: el.videoHeight || 0,
      duration: Number.isFinite(el.duration) ? el.duration : 0
    });
  };

  const scenes = shortData.scenes || [];
  const currentScene = scenes[activeSceneIdx] || scenes[0];

  // Resolve active metadata
  const chosenVoice = getVoiceById(shortData.voiceId || shortData.elevenLabsVoiceId || 'adam') || VOICES[0];
  const chosenMusic = getMusicTrackById(shortData.musicId || 'none') || MUSIC_TRACKS[0];
  const chosenSubtitle = (shortData.subtitleSettings && typeof shortData.subtitleSettings === 'object')
    ? shortData.subtitleSettings
    : {};
  const chosenSubtitlePreset = SUBTITLE_STYLES.find(s => s.id === chosenSubtitle.presetId || s.id === chosenSubtitle.style) || SUBTITLE_STYLES[0];

  // ── Real, derived production numbers ────────────────────────────────────
  // Everything below is either measured from the decoded video or computed
  // from the actual script/settings on this thread. Nothing is hardcoded.
  const stats = useMemo(() => {
    const charCounts = scenes.map(s => (s.voiceoverText || '').length);
    const scriptedDuration = scenes.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    // Some containers (notably MediaRecorder webm) report a bogus sub-second
    // duration in their header — only trust a measurement that is plausible.
    const measuredDuration = videoMeta && videoMeta.duration >= 1 ? videoMeta.duration : 0;
    const duration = measuredDuration || scriptedDuration;
    const w = videoMeta?.width || 0;
    const h = videoMeta?.height || 0;
    const divisor = w && h ? gcd(w, h) : 0;

    const rawScore = Number(shortData.criticScore);
    const hasScore = Number.isFinite(rawScore) && rawScore > 0;

    const musicOn = !!(chosenMusic && chosenMusic.id !== 'none' && (shortData.musicTrackUrl || chosenMusic.audioUrl));
    const duckRaw = Number(shortData.duckingLevel);
    const duckDb = Number.isFinite(duckRaw) ? Math.abs(duckRaw) : (Number.isFinite(Number(chosenMusic?.duckingDefault)) ? Math.abs(Number(chosenMusic.duckingDefault)) : 18);

    const container = (() => {
      const url = String(shortData.videoUrl || '');
      const m = url.split('?')[0].match(/\.([a-z0-9]{2,5})$/i);
      return m ? m[1].toUpperCase() : null;
    })();

    return {
      sceneCount: scenes.length,
      charCounts,
      totalChars: charCounts.reduce((a, b) => a + b, 0),
      inRange: charCounts.filter(c => c >= 170 && c <= 220).length,
      scriptedDuration,
      measuredDuration,
      duration,
      durationLabel: duration > 0 ? `${duration.toFixed(1)}s` : null,
      avgSceneDuration: scenes.length ? duration / scenes.length : 0,
      width: w,
      height: h,
      resolutionLabel: w && h ? `${w}×${h}` : null,
      aspectLabel: divisor ? `${w / divisor}:${h / divisor}` : null,
      tier: w && h ? qualityTier(w, h) : null,
      container,
      rawScore,
      hasScore,
      musicOn,
      duckDb,
      elevenId: shortData.elevenLabsVoiceId || chosenVoice?.elevenLabsId || null
    };
  }, [scenes, videoMeta, shortData, chosenMusic, chosenVoice]);

  // Pending → the render has not been measured yet; keep the copy honest.
  const PENDING = shortData.videoUrl ? 'Reading file…' : 'Pending render';
  const voiceEngineLabel = stats.elevenId ? 'ElevenLabs (via JSON2Video)' : 'JSON2Video TTS';  const downloadTier = stats.tier ? `${stats.tier} MP4` : 'Master MP4';

  // ── Quality audit: every row is evaluated against this thread's real data.
  // 'unknown' is used where the browser genuinely cannot verify the claim.
  const auditChecks = useMemo(() => {
    const rows = [];
    const { charCounts, sceneCount, inRange } = stats;

    rows.push({
      label: 'Speech timing per scene (170–220 chars ≈ 15s)',
      detail: sceneCount
        ? `${inRange}/${sceneCount} scenes in range · ${charCounts.length ? `${Math.min(...charCounts)}–${Math.max(...charCounts)}` : '0'} chars`
        : 'No scenes in this thread',
      state: sceneCount === 0 ? 'unknown' : inRange === sceneCount ? 'pass' : 'warn'
    });

    const acts = scenes.map(s => (s.act || '').trim()).filter(Boolean);
    const uniqueActs = new Set(acts.map(a => a.toLowerCase()));
    rows.push({
      label: 'Multi-act narrative progression',
      detail: acts.length ? `${uniqueActs.size} distinct acts: ${acts.join(' → ')}` : 'Scenes carry no act labels',
      state: acts.length === 0 ? 'unknown' : uniqueActs.size >= Math.min(3, sceneCount) ? 'pass' : 'warn'
    });

    const hookChars = charCounts[0] || 0;
    rows.push({
      label: 'Opening hook present in scene 1',
      detail: hookChars ? `${hookChars} chars of narration in the first scene` : 'Scene 1 has no narration text',
      state: hookChars >= 40 ? 'pass' : hookChars > 0 ? 'warn' : 'unknown'
    });

    rows.push({
      label: 'Vertical 9:16 frame for Shorts',
      detail: stats.resolutionLabel
        ? `Measured ${stats.resolutionLabel} (${stats.aspectLabel}) · ${stats.tier}`
        : PENDING,
      state: !stats.width ? 'unknown' : stats.height > stats.width ? 'pass' : 'warn'
    });

    const shortsLimit = 180; // YouTube Shorts hard cap, in seconds
    rows.push({
      label: `Runtime within the ${shortsLimit}s Shorts limit`,
      detail: stats.measuredDuration
        ? `Measured ${stats.measuredDuration.toFixed(1)}s from the rendered file`
        : stats.scriptedDuration
          ? `Scripted ${stats.scriptedDuration.toFixed(1)}s — file not measured yet`
          : PENDING,
      state: !stats.duration ? 'unknown' : stats.duration > 0 && stats.duration <= shortsLimit ? 'pass' : 'warn'
    });

    rows.push({
      label: 'Royalty-free / Content ID safe soundtrack',
      detail: stats.musicOn
        ? `${chosenMusic.name} — ${chosenMusic.artist || 'unknown source'}${chosenMusic.isCopyrightFree ? ' (marked CC0 / Content ID safe)' : ''}`
        : 'Voiceover only — no third-party music in the mix',
      state: !stats.musicOn ? 'pass' : chosenMusic.isCopyrightFree ? 'pass' : 'warn'
    });

    rows.push({
      label: 'Virality score ≥ 85/100',
      detail: stats.hasScore ? `Critic returned ${stats.rawScore}/100` : 'The workflow returned no critic score for this thread',
      state: !stats.hasScore ? 'unknown' : stats.rawScore >= 85 ? 'pass' : 'warn'
    });

    rows.push({
      label: 'Content safety & YouTube policy review',
      detail: 'Verified by the generation workflow, not by this browser',
      state: 'unknown'
    });

    return rows;
  }, [stats, scenes, chosenMusic, PENDING]);

  const auditSummary = useMemo(() => {
    const checkable = auditChecks.filter(c => c.state !== 'unknown').length;
    return {
      passed: auditChecks.filter(c => c.state === 'pass').length,
      checkable,
      unknown: auditChecks.length - checkable
    };
  }, [auditChecks]);

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

  // Real working master MP4 download — streams the rendered file to disk
  const handleDownloadVideo = async () => {
    if (!shortData.videoUrl) return;
    audioEngine.playSfx('click');
    setIsDownloading(true);

    try {
      const res = await fetch(shortData.videoUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const safeTitle = (shortData.title || 'viral_short').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
      a.download = `${safeTitle}_${stats.tier || 'master'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.warn('Direct blob download failed, opening direct stream URL in new tab:', err);
      const a = document.createElement('a');
      a.href = shortData.videoUrl;
      a.target = '_blank';
      a.download = `viral_short_${stats.tier || 'master'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsDownloading(false);
    }
  };

  const ACT_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'];
  const ACT_LABELS = ['Hook', 'Setup', 'Build', 'Climax', 'Resolution'];

  const tabs = [
    { id: 'storyboard', label: 'Storyboard & Video', icon: <Film size={14} /> },
    { id: 'production', label: 'Production Master', icon: <Sliders size={14} /> },
    { id: 'seo', label: 'YouTube SEO', icon: <Share2 size={14} /> },
    { id: 'critic', label: 'Quality Audit', icon: <ShieldCheck size={14} /> },
  ];

  return (
    <div className="result-card-wrapper">
      {/* ── Header: Title + Badges + Action Buttons ── */}
      <div className="result-header">
        <div className="result-header-left">
          <div className="result-badges">
            <span className="badge badge-brand">
              ✨ {stats.durationLabel ? `${stats.durationLabel} Master` : 'Production Master'}
            </span>
            {stats.hasScore ? (
              <span className={`badge ${stats.rawScore >= 85 ? 'badge-emerald' : 'badge-amber'}`}>
                <CheckCircle2 size={11} />
                Score: {stats.rawScore}/100 {stats.rawScore >= 85 ? 'Approved' : 'Review'}
              </span>
            ) : (
              <span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                <HelpCircle size={11} /> Not scored
              </span>
            )}
            <span className="badge-pill badge-cyan">
              📱 {stats.aspectLabel ? `${stats.aspectLabel} · ${stats.tier}` : '9:16 Shorts'}
            </span>
            {shortData.genre && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{shortData.genre}</span>
            )}
          </div>
          <h2 className="result-title">{shortData.title}</h2>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          width: isMobile ? '100%' : 'auto'
        }}>
          {/* Working master MP4 download — label reflects the measured frame size */}
          {shortData.videoUrl && (
            <button
              onClick={handleDownloadVideo}
              disabled={isDownloading}
              className="btn-outline"
              style={{
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 800,
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-medium)',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                flex: isMobile ? '1 1 100%' : '0 0 auto'
              }}
            >
              {isDownloading ? <Loader2 size={15} className="animate-spin" color="#6366f1" /> : <Download size={15} color="#6366f1" />}
              <span>{isDownloading ? 'Downloading…' : `Download ${downloadTier}`}</span>
            </button>
          )}

          {/* 1-Click Upload to YouTube */}
          <button
            onClick={() => { audioEngine.playSfx('boom'); onUploadYouTube(); }}
            className="btn-youtube"
            style={{
              padding: '10px 20px',
              fontSize: '13.5px',
              fontWeight: 900,
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              flex: isMobile ? '1 1 100%' : '0 0 auto'
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>1-Click Upload to YouTube</span>
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs (swipeable rail on phones) ── */}
      <div className={`result-tabs${isMobile ? ' rail' : ''}`} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => { audioEngine.playSfx('click'); setActiveTab(tab.id); }}
            className={`result-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB 1: STORYBOARD & 9:16 PHONE MOCKUP VIDEO ═══════════════ */}
      {activeTab === 'storyboard' && (
        <div className="storyboard-layout">

          {/* YouTube Shorts Smartphone Mockup Enclosure */}
          {shortData.videoUrl ? (
            <div className="shorts-mockup-wrapper">
              <div className={`shorts-smartphone-frame ${videoExpanded ? 'expanded' : ''}`}>
                {/* Top Notch / Dynamic Island */}
                <div className="shorts-phone-notch">
                  <div className="shorts-camera-lens"></div>
                  <div className="shorts-speaker"></div>
                </div>

                {/* Live resolution tag — read from the decoded file, not assumed */}
                <div className="shorts-resolution-tag">
                  <span>{stats.tier || '…'}</span> • <span>{stats.aspectLabel || '9:16'}</span>
                  {stats.durationLabel && <> • <span>{stats.durationLabel}</span></>}
                </div>

                <video
                  ref={videoRef}
                  src={shortData.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={handleLoadedMetadata}
                  className="shorts-video-element"
                />

                <button
                  className="video-expand-btn"
                  onClick={() => setVideoExpanded(v => !v)}
                  title={videoExpanded ? 'Shrink' : 'Expand'}
                >
                  <Maximize2 size={14} />
                </button>
              </div>

              {/* Video Quick Actions & Live Specs Box */}
              <div className="shorts-specs-sidebar">
                <div className="shorts-specs-card">
                  <div className="specs-card-title">
                    <Clapperboard size={15} color="var(--accent-primary)" />
                    <span>Master Render Specs</span>
                  </div>

                  <div className="specs-grid">
                    <div className="spec-item">
                      <span className="spec-label">Format & Ratio</span>
                      <span className="spec-value">
                        {stats.resolutionLabel ? `${stats.resolutionLabel} (${stats.aspectLabel})` : PENDING}
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Duration</span>
                      <span className="spec-value">
                        {stats.durationLabel
                          ? `${stats.durationLabel} (${stats.sceneCount} scene${stats.sceneCount === 1 ? '' : 's'})`
                          : PENDING}
                        {stats.measuredDuration ? '' : stats.scriptedDuration ? ' · scripted' : ''}
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Voiceover</span>
                      <span className="spec-value">🎙️ {shortData.voiceName || chosenVoice?.name || 'AI Voice'} ({shortData.voiceSpeed || 1.0}x)</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Soundtrack</span>
                      <span className="spec-value">🎵 {stats.musicOn ? chosenMusic.name : 'Voiceover Only'}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Subtitles</span>
                      <span className="spec-value">✨ {chosenSubtitlePreset?.name || 'Viral Subs'} ({chosenSubtitle?.fontFamily || 'Montserrat'})</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Quality Score</span>
                      <span className="spec-value" style={{ color: stats.hasScore ? (stats.rawScore >= 85 ? '#10b981' : '#f59e0b') : 'var(--text-muted)' }}>
                        {stats.hasScore ? `${stats.rawScore}/100` : 'Not scored'}
                      </span>
                    </div>
                  </div>

                  {/* Master Video Volume Control */}
                  <div style={{
                    marginTop: '12px',
                    background: 'var(--bg-input)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Volume2 size={14} color="var(--accent-primary)" />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Video Volume:</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-primary)', background: 'rgba(99,102,241,0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                        {Math.round(videoVolume * 100)}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={videoVolume}
                        onChange={e => handleVideoVolumeChange(e.target.value)}
                        style={{ width: '80px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleVideoVolumeChange(videoVolume > 0 ? 0 : 1.0)}
                        style={{
                          background: videoVolume === 0 ? 'rgba(239,68,68,0.2)' : 'var(--bg-card)',
                          border: `1px solid ${videoVolume === 0 ? '#ef4444' : 'var(--border-subtle)'}`,
                          color: videoVolume === 0 ? '#ef4444' : 'var(--text-muted)',
                          borderRadius: '6px', padding: '2px 6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {videoVolume === 0 ? 'Unmute' : 'Mute'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                    <button
                      onClick={handleDownloadVideo}
                      disabled={isDownloading}
                      className="btn-glow"
                      style={{ padding: '10px', fontSize: '12.5px', justifyContent: 'center' }}
                    >
                      {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      <span>{isDownloading ? 'Downloading…' : `Download ${downloadTier}`}</span>
                    </button>

                    <button
                      onClick={handleCopyScript}
                      className="btn-outline"
                      style={{ padding: '8px', fontSize: '12px', justifyContent: 'center' }}
                    >
                      {copiedScript ? <Check size={13} color="#10b981" /> : <Film size={13} />}
                      <span>{copiedScript ? 'Script Copied!' : `Copy ${stats.sceneCount}-Scene Script`}</span>
                    </button>
                  </div>
                </div>
              </div>
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
                    style={{ '--pill-color': ACT_COLORS[idx % ACT_COLORS.length] }}
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

          {/* ── 5-Scene Screenplay Cards ── */}
          <div className="scenes-section">
            <div className="scenes-header">
              <span className="scenes-label">{stats.sceneCount}-Scene Screenplay Narrative</span>
              <span className="scenes-meta">
                {stats.durationLabel ? `${stats.durationLabel} total` : 'Duration pending'}
                {stats.sceneCount > 0 && ` · ~${stats.avgSceneDuration.toFixed(1)}s per scene`}
                {` · ${stats.totalChars.toLocaleString()} chars`}
              </span>
            </div>

            <div className="scenes-list">
              {scenes.map((scene, idx) => {
                const isSelected = activeSceneIdx === idx;
                const isExpanded = expandedScenes[idx];
                const charCount = scene.voiceoverText?.length || 0;
                const isPerfect = charCount >= 170 && charCount <= 220;
                const color = ACT_COLORS[idx % ACT_COLORS.length];

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
                          <div className="scene-act-name">{scene.act || ACT_LABELS[idx % ACT_LABELS.length]}</div>
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
        </div>
      )}

      {/* ═══════════════ TAB 2: PRODUCTION MASTER SPECS (GENUINE AUDIOMEDIA REPORT) ═══════════════ */}
      {activeTab === 'production' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'var(--bg-input)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                🎬 Audiovisual Production Master Specifications
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Detailed technical breakdown of the narrator model, audio ducking, typography, and rendering engine.
              </p>
            </div>
            <span className="badge-pill badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> {stats.tier ? `${stats.tier} master verified` : 'Awaiting render'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '14px' }}>
            {/* 1. Voiceover Spec */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  <Mic2 size={16} />
                  <span>Narrator Voiceover Model</span>
                </div>
                <span className="badge badge-brand">{shortData.voiceSpeed || 1.0}x Speed</span>
              </div>

              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {shortData.voiceName || chosenVoice?.name} ({chosenVoice?.flag || chosenVoice?.language || 'Universal'})
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {chosenVoice?.tone || 'Deep, commanding gravitas with ultra-low latency synthesis'}
              </div>

              <div style={{
                background: 'var(--bg-input)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Engine: <strong>{voiceEngineLabel}</strong></span>
                <span>Language: <strong>{shortData.language || chosenVoice?.flag || 'Not specified'}</strong></span>
              </div>
            </div>

            {/* 2. Soundtrack Spec */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#06b6d4' }}>
                  <Music size={16} />
                  <span>Background Soundtrack</span>
                </div>
                {chosenMusic?.isCopyrightFree ? (
                  <span className="badge-pill badge-emerald" style={{ fontSize: '10px' }}>
                    <ShieldCheck size={10} /> Content ID Safe
                  </span>
                ) : (
                  <span className="badge-pill badge-amber" style={{ fontSize: '10px' }}>
                    <AlertTriangle size={10} /> License unverified
                  </span>
                )}
              </div>

              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats.musicOn ? chosenMusic.name : 'No Background Music (Voiceover Only)'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {stats.musicOn
                  ? `${chosenMusic.genre} • ${chosenMusic.tempo}${chosenMusic.artist ? ` • ${chosenMusic.artist}` : ''}`
                  : 'Clean narration — add a trending track in the YouTube Shorts editor'}
              </div>

              <div style={{
                background: 'var(--bg-input)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                <span>Volume Level: <strong>{stats.musicOn ? `${Math.round((shortData.musicVolume ?? 0.15) * 100)}%` : '—'}</strong></span>
                <span>Ducking: <strong>{stats.musicOn ? `-${stats.duckDb}dB under voice` : 'n/a'}</strong></span>
              </div>
            </div>

            {/* 3. Subtitles & Typography Spec */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>
                  <Type size={16} />
                  <span>Subtitles & Typography</span>
                </div>
                <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }} title="The render pipeline transcribes the voiceover with Whisper to time each word">Whisper Sync</span>
              </div>

              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {chosenSubtitlePreset?.name || 'Viral Subs Highlight'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Font: <strong>{chosenSubtitle?.fontFamily || 'Montserrat'}</strong> · Position: <strong>{chosenSubtitle?.position || 'center-bottom'}</strong>
              </div>

              <div style={{
                background: 'var(--bg-input)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Highlight: <strong style={{ color: chosenSubtitle?.wordColor || '#FFE600' }}>● Word Active</strong></span>
                <span>All Caps: <strong>{chosenSubtitle?.allCaps !== false ? 'YES' : 'NO'}</strong></span>
              </div>
            </div>

            {/* 4. Visual Aesthetics Spec */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#ec4899' }}>
                  <Clapperboard size={16} />
                  <span>Visual Aesthetics & Engine</span>
                </div>
                <span className="badge" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899' }}>
                  {stats.aspectLabel || '9:16'}
                </span>
              </div>

              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {shortData.visualStyle || visualStyleName || 'Cinematic Realistic'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {stats.sceneCount} scene{stats.sceneCount === 1 ? '' : 's'}
                {stats.sceneCount > 0 && ` · ~${stats.avgSceneDuration.toFixed(1)}s per scene`}
                {stats.durationLabel && ` · ${stats.durationLabel} sequence`}
              </div>

              <div style={{
                background: 'var(--bg-input)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                <span>Resolution: <strong>{stats.resolutionLabel || PENDING}</strong></span>
                <span>Container: <strong>{stats.container || '—'}</strong></span>
              </div>
            </div>
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

      {/* ═══════════════ TAB 4: CRITIC AUDIT (computed, not asserted) ═══════════════ */}
      {activeTab === 'critic' && (
        <div className="critic-panel">
          <div className="critic-score-banner">
            <div>
              <div className="critic-score-label">Virality & Production Scorecard</div>
              <div className="critic-score-value">
                {stats.hasScore ? `${stats.rawScore} / 100` : 'Not scored'}
                {stats.hasScore && (
                  <span
                    className="critic-approved"
                    style={stats.rawScore >= 85 ? undefined : { background: 'rgba(245,158,11,0.18)', color: '#f59e0b' }}
                  >
                    {stats.rawScore >= 85 ? 'APPROVED' : 'NEEDS REVIEW'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {auditSummary.passed}/{auditSummary.checkable} automated checks passed
                {auditSummary.unknown > 0 && ` · ${auditSummary.unknown} not verifiable in the browser`}
              </div>
            </div>
            <Award size={40} color={stats.hasScore && stats.rawScore < 85 ? '#f59e0b' : '#34d399'} />
          </div>

          <div className="critic-checks">
            {auditChecks.map((check, i) => (
              <div key={i} className="critic-check-row">
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0 }}>
                  {check.state === 'pass' && <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />}
                  {check.state === 'warn' && <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />}
                  {check.state === 'unknown' && <HelpCircle size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />}
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block' }}>{check.label}</span>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>{check.detail}</span>
                  </span>
                </span>
                <span
                  className="critic-passed"
                  style={
                    check.state === 'pass'
                      ? undefined
                      : check.state === 'warn'
                        ? { background: 'rgba(245,158,11,0.18)', color: '#f59e0b' }
                        : { background: 'var(--bg-input)', color: 'var(--text-muted)' }
                  }
                >
                  {check.state === 'pass' ? 'Passed' : check.state === 'warn' ? 'Check' : 'Unknown'}
                </span>
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
        {shortData.videoUrl && (
          <button
            onClick={handleDownloadVideo}
            disabled={isDownloading}
            className="btn-outline"
            style={{ padding: '7px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            <span>{isDownloading ? 'Downloading…' : `Download ${downloadTier}`}</span>
          </button>
        )}
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
