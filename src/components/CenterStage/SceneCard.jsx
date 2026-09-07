import React, { useState } from 'react';
import { 
  Volume2, 
  Camera, 
  Clock, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Square,
  Wand2
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { useVideoSettings } from '../../state/videoSettings.jsx';

export default function SceneCard({
  scene,
  index,
  voiceId,
  visualStyle,
  language,
  onUpdateScene,
  isActiveScene,
  onSelectActive
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoSettingsCtx = typeof useVideoSettings === 'function' ? useVideoSettings() : null;
  const currentLanguage = language || videoSettingsCtx?.settings?.language || 'English';

  const getLanguageBudget = (lang) => {
    const l = String(lang || '').toLowerCase();
    if (l.includes('hindi') && !l.includes('hinglish'))
      return { target: 220, optMin: 207, optMax: 233, wMin: 32, wMax: 36 };
    if (l.includes('hinglish'))
      return { target: 228, optMin: 214, optMax: 242, wMin: 35, wMax: 39 };
    return { target: 235, optMin: 221, optMax: 249, wMin: 37, wMax: 42 };
  };

  const budget = getLanguageBudget(currentLanguage);
  const charCount = scene.voiceoverText?.length || 0;
  const wordCount = (scene.voiceoverText || '').trim().split(/\s+/).filter(Boolean).length;
  const isCharPerfect = charCount >= budget.optMin && charCount <= budget.optMax;
  const isWordPerfect = wordCount >= budget.wMin && wordCount <= budget.wMax;
  const isBothPerfect = isCharPerfect && isWordPerfect;
  const isOnePerfect = (isCharPerfect && !isWordPerfect) || (!isCharPerfect && isWordPerfect);

  const handlePlayVoiceover = (e) => {
    e.stopPropagation();
    if (isPlaying) {
      audioEngine.stopVoice();
      setIsPlaying(false);
    } else {
      audioEngine.playVoice(voiceId, scene.voiceoverText);
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 5500);
    }
  };

  const getActColor = (actName = '') => {
    if (actName.includes('HOOK')) return '#f59e0b';
    if (actName.includes('SETUP')) return '#3b82f6';
    if (actName.includes('BUILD')) return '#8b5cf6';
    if (actName.includes('CLIMAX')) return '#ef4444';
    return '#10b981';
  };

  const actColor = getActColor(scene.act);

  return (
    <div
      onClick={() => {
        onSelectActive(index);
      }}
      className={`glass-card ${isActiveScene ? 'glass-card-active' : ''}`}
      style={{
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Scene Number Badge */}
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: `${actColor}25`,
            border: `1px solid ${actColor}50`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '13px',
            color: actColor
          }}>
            {scene.sceneNumber}
          </div>

          {/* Act Badge */}
          <span style={{
            background: `${actColor}15`,
            color: actColor,
            border: `1px solid ${actColor}30`,
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700
          }}>
            {scene.act}
          </span>

          {/* Camera Direction Pill */}
          <span style={{
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-secondary)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Camera size={11} color="var(--accent-cyan)" />
            {scene.cameraMotion || 'Cinematic Track'}
          </span>
        </div>

        {/* Right side indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Character and Word Count Validation Badge */}
          <span style={{
            background: isBothPerfect ? 'rgba(16, 185, 129, 0.15)' : (isOnePerfect ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
            color: isBothPerfect ? '#34d399' : (isOnePerfect ? '#fbbf24' : '#f87171'),
            border: `1px solid ${isBothPerfect ? 'rgba(16, 185, 129, 0.3)' : (isOnePerfect ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)')}`,
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isBothPerfect ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
            {charCount} / {budget.target} chars · {wordCount} / {budget.wMin}–{budget.wMax} words
          </span>

          {/* Play Voiceover button */}
          <button
            onClick={handlePlayVoiceover}
            style={{
              background: isPlaying ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isPlaying ? <Square size={10} fill="#ffffff" /> : <Volume2 size={12} />}
            {isPlaying ? 'Playing...' : 'Voice'}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
          {/* Voiceover Text Input */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px', display: 'flex', justifyContent: 'space-between' }}>
              <span>🎙️ Narration / Voiceover ({budget.optMin}–{budget.optMax} chars · {budget.wMin}–{budget.wMax} words recommended for {scene.duration || 15}s at 1.10x):</span>
              <span style={{ color: isBothPerfect ? '#34d399' : (isOnePerfect ? '#fbbf24' : '#f87171') }}>
                {budget.target - charCount >= 0 ? `${budget.target - charCount} chars remaining` : `${charCount - budget.target} chars over`}
              </span>
            </div>
            <textarea
              value={scene.voiceoverText}
              onChange={(e) => onUpdateScene(index, 'voiceoverText', e.target.value)}
              rows={2}
              style={{
                width: '100%',
                background: 'rgba(10, 15, 26, 0.75)',
                border: `1px solid ${isBothPerfect ? 'rgba(255, 255, 255, 0.12)' : (isOnePerfect ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)')}`,
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#ffffff',
                fontSize: '12.5px',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.4,
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>

          {/* Grok Video Prompt Input */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={11} />
              <span>Grok Imagine Video Prompt (English 4K 9:16 specs):</span>
            </div>
            <textarea
              value={scene.videoPrompt}
              onChange={(e) => onUpdateScene(index, 'videoPrompt', e.target.value)}
              rows={2}
              style={{
                width: '100%',
                background: 'rgba(6, 182, 212, 0.04)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#e2e8f0',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.4,
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
