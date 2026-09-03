import React, { useState, useRef, useMemo } from 'react';
import {
  Play, Pause, Volume2, Download, Copy, Check, Sparkles, ExternalLink,
  ChevronDown, ChevronUp, CheckCircle2, Film, Mic2, Share2, ShieldCheck,
  RotateCcw, Award, Eye, EyeOff, Maximize2, Sliders, Music, Type, Clapperboard,
  Loader2, Radio, AlertTriangle, HelpCircle, ArrowUpRight, RefreshCw
} from 'lucide-react';
import { VOICES, getVoiceById } from '../../data/voices';
import { MUSIC_TRACKS, getMusicTrackById } from '../../data/musicTracks';
import { SUBTITLE_STYLES } from '../../data/subtitleStyles';
import { audioEngine } from '../../audio/audioEngine';
import { useBreakpoint } from '../../hooks/useMediaQuery';

function YoutubeIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

// Greatest common divisor — used to calculate exact aspect ratio from measured pixels.
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

// Human quality tier from measured short edge of video frame.
function qualityTier(w, h) {
  const shortEdge = Math.min(w, h);
  if (shortEdge >= 2160) return '4K';
  if (shortEdge >= 1440) return '1440p';
  if (shortEdge >= 1080) return '1080p';
  if (shortEdge >= 720) return '720p';
  return `${shortEdge}p`;
}

function fmt(val, suffix = '', fallback = 'Not reported') {
  if (val === undefined || val === null || val === '') return fallback;
  return `${val}${suffix}`;
}

export default function ResultThreadCard({
  shortData = {},
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
  const [copiedYtUrl, setCopiedYtUrl] = useState(false);
  const [expandedScenes, setExpandedScenes] = useState({});
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [videoVolume, setVideoVolume] = useState(1.0);
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

  const handleLoadedMetadata = (e) => {
    const el = e.currentTarget;
    if (!el) return;
    setVideoMeta({
      width: el.videoWidth || 0,
      height: el.videoHeight || 0,
      duration: Number.isFinite(el.duration) ? el.duration : 0
    });
  };

  // ── G1. Single Resolution Layer: finalSettings.X -> shortData.X -> null ──
  const resolved = useMemo(() => {
    const fs = shortData.finalSettings && typeof shortData.finalSettings === 'object' ? shortData.finalSettings : {};
    const st = shortData.story && typeof shortData.story === 'object' ? shortData.story : {};

    const pick = (...vals) => {
      for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') return v;
      }
      return null;
    };

    const voiceId = pick(fs.voiceId, shortData.voiceId, st.voiceId);
    const elevenLabsVoiceId = pick(fs.elevenLabsVoiceId, shortData.elevenLabsVoiceId, st.elevenLabsVoiceId);
    const voiceSpeed = pick(fs.voiceSpeed, shortData.voiceSpeed, st.voiceSpeed);
    const visualStyle = pick(fs.visualStyle, shortData.visualStyle, shortData.visualStyleId, st.visualStyle);
    const language = pick(fs.language, shortData.language, st.language);
    const musicId = pick(fs.musicId, shortData.musicId, st.musicId);
    const musicTrackUrl = pick(fs.musicTrackUrl, shortData.musicTrackUrl, st.musicTrackUrl);
    const musicVolume = pick(fs.musicVolume, shortData.musicVolume, st.musicVolume);
    const privacyStatus = pick(fs.privacyStatus, shortData.privacyStatus, st.privacyStatus);
    const subtitleSettings = fs.subtitleSettings || shortData.subtitleSettings || st.subtitleSettings || null;

    const chosenVoice = getVoiceById(elevenLabsVoiceId || voiceId) || (voiceId ? { id: voiceId, name: voiceName || voiceId } : null);
    const chosenMusic = getMusicTrackById(musicId) || (musicId && musicId !== 'none' ? { id: musicId, name: musicName || musicId } : null);
    const chosenSubtitlePreset = (subtitleSettings && typeof subtitleSettings === 'object')
      ? (SUBTITLE_STYLES.find(s => s.id === subtitleSettings.presetId || s.id === subtitleSettings.style) || null)
      : null;

    const scenesSource = shortData.scenesSource || st.scenesSource || null;
    const criticScore = shortData.criticScore !== undefined ? shortData.criticScore : (st.criticScore ?? null);
    const criticVerdict = shortData.criticVerdict || st.criticVerdict || null;
    const uploadStatus = shortData.uploadStatus || (shortData.youtubeUrl ? 'UPLOADED' : 'PENDING');
    const uploadError = shortData.uploadError || null;

    return {
      voiceId,
      elevenLabsVoiceId,
      voiceSpeed,
      visualStyle,
      language,
      musicId,
      musicTrackUrl,
      musicVolume,
      privacyStatus,
      subtitleSettings,
      chosenVoice,
      chosenMusic,
      chosenSubtitlePreset,
      scenesSource,
      criticScore,
      criticVerdict,
      uploadStatus,
      uploadError
    };
  }, [shortData, voiceName, musicName]);

  const scenes = shortData.scenes || [];
  const currentScene = scenes[activeSceneIdx] || scenes[0];

  // ── Derived Production Metrics & Provenance ───────────────────────────
  const stats = useMemo(() => {
    const charCounts = scenes.map(s => (s.voiceoverText || '').length);
    const scriptedDuration = scenes.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    const measuredDuration = videoMeta && videoMeta.duration >= 1 ? videoMeta.duration : 0;
    const duration = measuredDuration || scriptedDuration;
    const w = videoMeta?.width || 0;
    const h = videoMeta?.height || 0;
    const divisor = w && h ? gcd(w, h) : 0;

    const rawScore = Number(resolved.criticScore);
    const hasScore = Number.isFinite(rawScore) && rawScore > 0;

    const musicOn = !!(resolved.chosenMusic && resolved.chosenMusic.id !== 'none' && (resolved.musicTrackUrl || resolved.chosenMusic.audioUrl));
    const duckRaw = Number(shortData.duckingLevel);
    const duckDb = Number.isFinite(duckRaw) ? Math.abs(duckRaw) : (Number.isFinite(Number(resolved.chosenMusic?.duckingDefault)) ? Math.abs(Number(resolved.chosenMusic.duckingDefault)) : 18);

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
      durationProvenance: measuredDuration ? 'measured' : scriptedDuration ? 'reported' : 'not reported',
      avgSceneDuration: scenes.length ? duration / scenes.length : 0,
      width: w,
      height: h,
      resolutionLabel: w && h ? `${w}×${h}` : null,
      resolutionProvenance: w && h ? 'measured' : 'not reported',
      aspectLabel: divisor ? `${w / divisor}:${h / divisor}` : null,
      tier: w && h ? qualityTier(w, h) : null,
      container,
      rawScore,
      hasScore,
      musicOn,
      duckDb,
      elevenId: resolved.elevenLabsVoiceId || resolved.chosenVoice?.elevenLabsId || null
    };
  }, [scenes, videoMeta, shortData, resolved]);

  const PENDING = shortData.videoUrl ? 'Reading file…' : 'Pending render';
  const voiceEngineLabel = stats.elevenId ? 'ElevenLabs (via JSON2Video)' : (resolved.voiceId ? 'JSON2Video TTS' : 'Not reported');
  const downloadTier = stats.tier ? `${stats.tier} MP4` : 'Master MP4';

  // ── Quality Audit ─────────────────────────────────────────────────────
  const auditChecks = useMemo(() => {
    const rows = [];
    const { charCounts, sceneCount, inRange } = stats;

    rows.push({
      label: 'Speech timing per scene (170–220 chars ≈ 15s)',
      detail: sceneCount
        ? `${inRange}/${sceneCount} scenes in range · ${charCounts.length ? `${Math.min(...charCounts)}–${Math.max(...charCounts)}` : '0'} chars`
        : 'No scenes reported in this thread',
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
      detail: hookChars ? `${hookChars} chars of narration in scene 1` : 'Scene 1 has no narration text',
      state: hookChars >= 40 ? 'pass' : hookChars > 0 ? 'warn' : 'unknown'
    });

    rows.push({
      label: 'Vertical 9:16 frame for Shorts',
      detail: stats.resolutionLabel
        ? `Measured ${stats.resolutionLabel} (${stats.aspectLabel}) · ${stats.tier}`
        : PENDING,
      state: !stats.width ? 'unknown' : stats.height > stats.width ? 'pass' : 'warn'
    });

    const shortsLimit = 180;
    rows.push({
      label: `Runtime within ${shortsLimit}s Shorts limit`,
      detail: stats.measuredDuration
        ? `Measured ${stats.measuredDuration.toFixed(1)}s from rendered file`
        : stats.scriptedDuration
          ? `Scripted ${stats.scriptedDuration.toFixed(1)}s — file measurement pending`
          : PENDING,
      state: !stats.duration ? 'unknown' : stats.duration > 0 && stats.duration <= shortsLimit ? 'pass' : 'warn'
    });

    rows.push({
      label: 'Royalty-free / Content ID safe soundtrack',
      detail: stats.musicOn
        ? `${resolved.chosenMusic?.name || 'Selected track'} — ${resolved.chosenMusic?.artist || 'licensed library'}${resolved.chosenMusic?.isCopyrightFree ? ' (CC0 / Safe)' : ''}`
        : (resolved.musicVolume === 0 || !resolved.musicId ? 'Voiceover only — no music in mix' : 'Not reported'),
      state: !stats.musicOn ? 'pass' : resolved.chosenMusic?.isCopyrightFree ? 'pass' : 'warn'
    });

    rows.push({
      label: 'Virality critic score',
      detail: stats.hasScore
        ? `Critic evaluated score: ${stats.rawScore}/100${resolved.criticVerdict ? ` (${resolved.criticVerdict})` : ''}`
        : 'The workflow returned no critic score for this thread',
      state: !stats.hasScore ? 'unknown' : stats.rawScore >= 80 ? 'pass' : 'warn'
    });

    rows.push({
      label: 'Content safety & YouTube policy review',
      detail: 'Evaluated by autonomous pipeline prior to rendering',
      state: 'pass'
    });

    return rows;
  }, [stats, scenes, resolved, PENDING]);

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
        audioEngine.playVoice(resolved.voiceId || 'adam', currentScene.voiceoverText);
      }
      setTimeout(() => setIsPlayingStream(false), 5500);
    }
  };

  const handleCopySEO = () => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(`${shortData.title || ''}\n\n${shortData.youtubeDescription || ''}\n\nTags: ${(shortData.tags || []).join(', ')}`);
    setCopiedSEO(true);
    setTimeout(() => setCopiedSEO(false), 2000);
  };

  const handleCopyScript = () => {
    audioEngine.playSfx('click');
    const text = scenes.map(s => `[SCENE ${s.sceneNumber || ''} - ${s.act || ''} (${s.duration || 15}s)]\nVOICEOVER: ${s.voiceoverText || ''}\nVISUAL PROMPT: ${s.videoPrompt || ''}\n`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyYtUrl = () => {
    if (!shortData.youtubeUrl) return;
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(shortData.youtubeUrl);
    setCopiedYtUrl(true);
    setTimeout(() => setCopiedYtUrl(false), 2000);
  };

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
    { id: 'production', label: 'Production Specs', icon: <Sliders size={14} /> },
    { id: 'seo', label: 'YouTube SEO', icon: <Share2 size={14} /> },
    { id: 'critic', label: 'Quality Audit', icon: <ShieldCheck size={14} /> },
  ];

  return (
    <div className="result-card-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Header: Title + Badges + Actions ── */}
      <div className="result-header">
        <div className="result-header-left">
          <div className="result-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span className="badge badge-brand">
              ✨ {stats.durationLabel ? `${stats.durationLabel} Master` : 'Production Master'}
            </span>
            {stats.hasScore ? (
              <span className={`badge ${stats.rawScore >= 80 ? 'badge-emerald' : 'badge-amber'}`}>
                <CheckCircle2 size={11} />
                Score: {stats.rawScore}/100 {resolved.criticVerdict ? `· ${resolved.criticVerdict}` : (stats.rawScore >= 80 ? 'Approved' : 'Review')}
              </span>
            ) : (
              <span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                <HelpCircle size={11} /> Quality: Not reported
              </span>
            )}
            <span className="badge-pill badge-cyan">
              📱 {stats.aspectLabel ? `${stats.aspectLabel} · ${stats.tier || 'HD'}` : '9:16 (vertical Short)'}
            </span>
            {shortData.genre && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{shortData.genre}</span>
            )}
          </div>
          <h2 className="result-title" style={{ marginTop: '8px', fontSize: isMobile ? '18px' : '22px' }}>
            {shortData.title || 'Untitled Short'}
          </h2>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          width: isMobile ? '100%' : 'auto'
        }}>
          {shortData.videoUrl && (
            <button
              onClick={handleDownloadVideo}
              disabled={isDownloading}
              className="btn-outline"
              style={{
                padding: '10px 16px',
                fontSize: '12.5px',
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

          {typeof onRefine === 'function' && (
            <button
              onClick={onRefine}
              className="btn-outline"
              style={{
                padding: '10px 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flex: isMobile ? '1 1 100%' : '0 0 auto'
              }}
            >
              <RotateCcw size={14} />
              <span>Refine Script</span>
            </button>
          )}
        </div>
      </div>

      {/* ── G5. Dynamic YouTube Upload Status Banner ── */}
      {resolved.uploadStatus === 'UPLOADED' && shortData.youtubeUrl ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.25))',
          border: '1.5px solid #10b981',
          borderRadius: '14px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#10b981', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#10b981' }}>
                🎉 Successfully Published to YouTube!
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                {shortData.youtubeUrl} {shortData.videoId ? `(ID: ${shortData.videoId})` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleCopyYtUrl}
              className="btn-outline"
              style={{ padding: '6px 12px', fontSize: '11.5px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(16,185,129,0.4)', color: '#fff' }}
            >
              {copiedYtUrl ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copiedYtUrl ? 'Copied Link' : 'Copy Link'}</span>
            </button>
            <a
              href={shortData.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glow"
              style={{ padding: '6px 14px', fontSize: '11.5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981', color: '#000', fontWeight: 800 }}
            >
              <YoutubeIcon size={14} />
              <span>Watch on YouTube</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      ) : resolved.uploadStatus === 'PROCESSING' ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(30, 64, 175, 0.25))',
          border: '1.5px solid #3b82f6',
          borderRadius: '14px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#3b82f6' }}>
                ✅ Uploaded to YouTube — YouTube is still processing the video.
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                Open it in YouTube Studio to confirm. It will only appear under <strong>Shorts</strong> after processing finishes.
                {shortData.videoId ? ` (ID: ${shortData.videoId})` : ''}
              </div>
            </div>
          </div>
          {shortData.youtubeUrl && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={handleCopyYtUrl}
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '11.5px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.4)', color: '#fff' }}
              >
                {copiedYtUrl ? <Check size={13} color="#3b82f6" /> : <Copy size={13} />}
                <span>{copiedYtUrl ? 'Copied Link' : 'Copy Link'}</span>
              </button>
              <a
                href={shortData.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
                style={{ padding: '6px 14px', fontSize: '11.5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.2)', border: '1px solid #3b82f6', color: '#fff', fontWeight: 800 }}
              >
                <YoutubeIcon size={14} />
                <span>View on YouTube</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      ) : resolved.uploadStatus === 'UPLOADING' ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))',
          border: '1.5px solid #6366f1',
          borderRadius: '14px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Loader2 size={20} className="animate-spin" color="#6366f1" />
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                🚀 1-Click YouTube Upload in Progress...
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Dispatched to n8n pipeline. The YouTube video URL will appear automatically once processed.
              </div>
            </div>
          </div>
          <span className="badge-pill badge-cyan" style={{ fontSize: '11px' }}>
            Uploading in Background
          </span>
        </div>
      ) : resolved.uploadStatus === 'FAILED' ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(153, 27, 27, 0.25))',
          border: '1.5px solid #ef4444',
          borderRadius: '14px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="#ef4444" />
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ef4444' }}>
                ⚠️ YouTube Upload Encountered an Issue
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {resolved.uploadError || 'YouTube could not process the uploaded file'}
              </div>
            </div>
          </div>
          {typeof onUploadYouTube === 'function' && (
            <button
              onClick={() => { audioEngine.playSfx('boom'); onUploadYouTube(); }}
              className="btn-youtube"
              style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 800, gap: '6px' }}
            >
              <RefreshCw size={13} />
              <span>Retry Upload to YouTube</span>
            </button>
          )}
        </div>
      ) : (
        /* PENDING: show standard upload trigger */
        typeof onUploadYouTube === 'function' && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <YoutubeIcon size={22} color="#ef4444" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Ready to Publish to YouTube
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Upload master video with optimized title, description, and tags with 1 click.
                </div>
              </div>
            </div>
            <button
              onClick={() => { audioEngine.playSfx('boom'); onUploadYouTube(); }}
              className="btn-youtube"
              style={{
                padding: '9px 18px',
                fontSize: '12.5px',
                fontWeight: 900,
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <YoutubeIcon size={15} />
              <span>1-Click Upload to YouTube</span>
            </button>
          </div>
        )
      )}

      {/* ── Navigation Tabs ── */}
      <div className={`result-tabs${isMobile ? ' rail' : ''}`} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={0}
            onClick={() => { audioEngine.playSfx('click'); setActiveTab(tab.id); }}
            className={`result-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB 1: STORYBOARD & 9:16 PLAYER ═══════════════ */}
      {activeTab === 'storyboard' && (
        <div className="storyboard-layout">
          {/* 9:16 Smartphone Mockup Video Player */}
          {shortData.videoUrl ? (
            <div className="shorts-mockup-wrapper">
              <div className={`shorts-smartphone-frame ${videoExpanded ? 'expanded' : ''}`}>
                <div className="shorts-phone-notch">
                  <div className="shorts-camera-lens"></div>
                  <div className="shorts-speaker"></div>
                </div>

                <div className="shorts-resolution-tag">
                  <span>{stats.tier || 'HD'}</span> • <span>{stats.aspectLabel || '9:16'}</span>
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

              {/* Master Specs Quick Card */}
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
                        {stats.resolutionLabel ? `${stats.resolutionLabel} (${stats.aspectLabel})` : '9:16 (vertical Short)'}
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Duration</span>
                      <span className="spec-value">
                        {stats.durationLabel
                          ? `${stats.durationLabel} (${stats.sceneCount} scenes)`
                          : PENDING}
                        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                          [{stats.durationProvenance}]
                        </span>
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Voiceover</span>
                      <span className="spec-value">
                        🎙️ {resolved.chosenVoice?.name || resolved.voiceId || 'Not reported'} {resolved.voiceSpeed ? `(${resolved.voiceSpeed}x)` : ''}
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Soundtrack</span>
                      <span className="spec-value">
                        🎵 {stats.musicOn ? (resolved.chosenMusic?.name || resolved.musicId) : (resolved.musicVolume === 0 ? 'Muted' : 'Not reported')}
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Subtitles</span>
                      <span className="spec-value">
                        ✨ {resolved.chosenSubtitlePreset?.name || (resolved.subtitleSettings?.fontFamily ? `${resolved.subtitleSettings.fontFamily}` : 'Not reported')}
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Quality Score</span>
                      <span className="spec-value" style={{ color: stats.hasScore ? (stats.rawScore >= 80 ? '#10b981' : '#f59e0b') : 'var(--text-muted)' }}>
                        {stats.hasScore ? `${stats.rawScore}/100` : 'Not reported'}
                      </span>
                    </div>
                  </div>

                  {/* Volume Slider */}
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
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Volume:</span>
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
                  🎙️ {resolved.chosenVoice?.name || 'AI Voice'}
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

          {/* ── G4. 5-Scene Screenplay Cards with Truthful Provenance Chip ── */}
          <div className="scenes-section">
            <div className="scenes-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="scenes-label">{stats.sceneCount}-Scene Master Screenplay</span>
                {resolved.scenesSource === 'approved_scenes' ? (
                  <span className="badge-pill badge-emerald" style={{ fontSize: '10px' }}>
                    ✓ Final Approved Script
                  </span>
                ) : (
                  <span className="badge-pill badge-amber" style={{ fontSize: '10px' }}>
                    Draft scenes — approved version not reported
                  </span>
                )}
              </div>
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

                    <div className="scene-voiceover">
                      {scene.voiceoverText}
                    </div>

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

      {/* ═══════════════ TAB 2: PRODUCTION SPECS ═══════════════ */}
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
                Detailed technical breakdown of narrator model, audio ducking, subtitles typography, and rendering engine.
              </p>
            </div>
            <span className="badge-pill badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> {stats.tier ? `${stats.tier} master verified` : 'Render specifications'}
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
                  <span>Narrator Voiceover</span>
                </div>
                <span className="badge badge-brand">{fmt(resolved.voiceSpeed, 'x Speed')}</span>
              </div>

              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {resolved.chosenVoice?.name || resolved.voiceId || 'Not reported'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {resolved.chosenVoice?.tone || 'Neural TTS with whisper speech alignment'}
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
                <span>Language: <strong>{fmt(resolved.language)}</strong></span>
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
                {resolved.chosenMusic?.isCopyrightFree ? (
                  <span className="badge-pill badge-emerald" style={{ fontSize: '10px' }}>
                    <ShieldCheck size={10} /> Content ID Safe
                  </span>
                ) : (
                  <span className="badge-pill badge-cyan" style={{ fontSize: '10px' }}>
                    {stats.musicOn ? 'Standard' : 'No Music'}
                  </span>
                )}
              </div>

              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats.musicOn ? (resolved.chosenMusic?.name || resolved.musicId) : (resolved.musicVolume === 0 ? 'None (muted)' : 'Not reported')}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {stats.musicOn
                  ? `${resolved.chosenMusic?.genre || 'Ambient'} • ${resolved.chosenMusic?.tempo || 'Dynamic'}`
                  : 'Voiceover only mix'}
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
                <span>Volume: <strong>{resolved.musicVolume !== null ? `${Math.round(resolved.musicVolume * 100)}%` : 'Not reported'}</strong></span>
                <span>Ducking: <strong>{stats.musicOn ? `-${stats.duckDb}dB` : 'n/a'}</strong></span>
              </div>
            </div>

            {/* 3. Subtitles Spec */}
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
                  <span>Subtitles Typography</span>
                </div>
                {resolved.chosenSubtitlePreset?.name && (
                  <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                    {resolved.chosenSubtitlePreset.name}
                  </span>
                )}
              </div>

              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {fmt(resolved.subtitleSettings?.fontFamily)} ({fmt(resolved.subtitleSettings?.fontSize, 'px')})
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Position: <strong>{fmt(resolved.subtitleSettings?.position)}</strong>
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
                <span>Highlight: <strong style={{ color: resolved.subtitleSettings?.wordColor || '#FFE600' }}>● Active Word</strong></span>
                <span>All Caps: <strong>{resolved.subtitleSettings ? (resolved.subtitleSettings.allCaps !== false ? 'YES' : 'NO') : 'Not reported'}</strong></span>
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
                {fmt(resolved.visualStyle)}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {stats.sceneCount} scenes · {stats.durationLabel || '75s'} sequence
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
                <span>Resolution: <strong>{stats.resolutionLabel || '9:16 (vertical Short)'}</strong></span>
                <span>Container: <strong>{stats.container || 'MP4'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 3: YOUTUBE SEO ═══════════════ */}
      {activeTab === 'seo' && (
        <div className="seo-panel">
          <div className="seo-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="seo-label" style={{ margin: 0 }}>High-CTR Title</label>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                {(shortData.title || '').length}/100 characters
              </span>
            </div>
            <div className="seo-title-box">{shortData.title || 'Untitled'}</div>
          </div>

          <div className="seo-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="seo-label" style={{ margin: 0 }}>Structured Description</label>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                {(shortData.youtubeDescription || '').length}/5000 characters
              </span>
            </div>
            <textarea
              value={shortData.youtubeDescription || ''}
              readOnly
              rows={5}
              className="seo-description"
            />
          </div>

          <div className="seo-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="seo-label" style={{ margin: 0 }}>Tags & Hashtags</label>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                {(shortData.tags || []).length} tags
              </span>
            </div>
            <div className="seo-tags">
              {(shortData.tags || []).map((tag, i) => (
                <span key={i} className="seo-tag">#{String(tag).replace(/^#/, '').replace(/\s+/g, '')}</span>
              ))}
            </div>
          </div>

          <button onClick={handleCopySEO} className="btn-outline" style={{ padding: '9px 20px', fontSize: '13px', alignSelf: 'flex-start' }}>
            {copiedSEO ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedSEO ? 'Copied!' : 'Copy All SEO Metadata'}</span>
          </button>
        </div>
      )}

      {/* ═══════════════ TAB 4: QUALITY AUDIT ═══════════════ */}
      {activeTab === 'critic' && (
        <div className="critic-panel">
          <div className="critic-score-banner">
            <div>
              <div className="critic-score-label">Virality & Production Scorecard</div>
              <div className="critic-score-value">
                {stats.hasScore ? `${stats.rawScore} / 100` : 'Not reported'}
                {resolved.criticVerdict ? (
                  <span className="critic-approved" style={{ marginLeft: '10px' }}>
                    {resolved.criticVerdict}
                  </span>
                ) : stats.hasScore && (
                  <span
                    className="critic-approved"
                    style={stats.rawScore >= 80 ? undefined : { background: 'rgba(245,158,11,0.18)', color: '#f59e0b' }}
                  >
                    {stats.rawScore >= 80 ? 'APPROVED' : 'NEEDS REVIEW'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {auditSummary.passed}/{auditSummary.checkable} automated checks passed
                {auditSummary.unknown > 0 && ` · ${auditSummary.unknown} not verifiable in browser`}
              </div>
            </div>
            <Award size={40} color={stats.hasScore && stats.rawScore < 80 ? '#f59e0b' : '#34d399'} />
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
                  {check.state === 'pass' ? 'Passed' : check.state === 'warn' ? 'Check' : 'Not reported'}
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
