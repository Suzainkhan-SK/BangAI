import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic2, 
  Palette, 
  Globe, 
  Music, 
  Sparkles, 
  ArrowUp, 
  Zap, 
  Sliders, 
  Volume2, 
  X, 
  Wand2, 
  HelpCircle,
  Flame,
  Brain,
  DollarSign
} from 'lucide-react';
import { VOICES } from '../../data/voices';
import { VISUAL_STYLES } from '../../data/visualStyles';
import { MUSIC_TRACKS } from '../../data/musicTracks';
import { audioEngine } from '../../audio/audioEngine';

export default function CanvasPromptBar(props) {
  // Support both direct and standard prop naming conventions
  const promptValue = props.prompt ?? '';
  const setPromptValue = (val) => {
    if (typeof props.setPrompt === 'function') props.setPrompt(val);
    if (typeof props.onPromptChange === 'function') props.onPromptChange(val);
  };

  const currentVoiceId = props.voiceId || props.selectedVoice || 'adam';
  const setVoiceValue = (val) => {
    if (typeof props.setVoiceId === 'function') props.setVoiceId(val);
    if (typeof props.onVoiceChange === 'function') props.onVoiceChange(val);
  };

  const currentStyleId = props.styleId || props.selectedStyle || 'cinematic';
  const setStyleValue = (val) => {
    if (typeof props.setStyleId === 'function') props.setStyleId(val);
    if (typeof props.onStyleChange === 'function') props.onStyleChange(val);
  };

  const currentMusicId = props.musicId || props.selectedMusic || 'mystery';
  const setMusicValue = (val) => {
    if (typeof props.setMusicId === 'function') props.setMusicId(val);
    if (typeof props.onMusicChange === 'function') props.onMusicChange(val);
  };

  const currentLanguage = props.language || props.selectedLanguage || 'Hinglish';
  const setLanguageValue = (val) => {
    if (typeof props.setLanguage === 'function') props.setLanguage(val);
    if (typeof props.onLanguageChange === 'function') props.onLanguageChange(val);
  };

  const isGenerating = !!props.isGenerating;
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!promptValue.trim() || isGenerating) return;
    audioEngine.playSfx('boom');
    if (typeof props.onGenerate === 'function') props.onGenerate();
    else if (typeof props.onSubmit === 'function') props.onSubmit();
  };

  const quickPills = [
    { label: '🌊 Bermuda Triangle Secret', text: 'Unsolved disappearance of Flight 19 in Bermuda Triangle with cockpit radio static and timeline facts.' },
    { label: '🧠 3 Dark Psychology Tricks', text: '3 powerful psychological tricks that make people instantly respect you in under 60 seconds.' },
    { label: '💰 ₹50 to 3 Factories', text: 'Motivational journey of an Indian street vendor who started with ₹50 and built an empire.' },
    { label: '🛸 Secret Under Antarctica', text: 'Shocking scientific expedition findings under 2 miles of Antarctic ice that were classified.' }
  ];

  return (
    <div style={{
      width: '100%',
      maxWidth: '860px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Quick Inspiration Pills Row */}
      {!promptValue.trim() && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          marginBottom: '6px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <Sparkles size={12} color="var(--accent-primary)" />
            VIRAL IDEAS:
          </span>
          {quickPills.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                audioEngine.playSfx('click');
                setPromptValue(pill.text);
                if (textareaRef.current) textareaRef.current.focus();
              }}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '99px',
                padding: '4px 12px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Studio Prompt Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.94) 0%, rgba(15, 23, 42, 0.98) 100%)',
          border: '1.5px solid var(--border-glow)',
          borderRadius: '22px',
          padding: '12px 18px',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.55), 0 0 24px rgba(99, 102, 241, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backdropFilter: 'blur(24px)',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Text Input Area with Clear Button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
          <textarea
            ref={textareaRef}
            id="shorts-prompt-input"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            placeholder="Type any video idea or paste a story topic... (e.g. 'Mystery of Flight 19 in Bermuda Triangle in Hinglish with shocking hook')"
            rows={2}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '14.5px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
              lineHeight: 1.5,
              resize: 'none',
              paddingRight: promptValue ? '28px' : '0'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          {promptValue && (
            <button
              type="button"
              onClick={() => {
                setPromptValue('');
                if (textareaRef.current) textareaRef.current.focus();
              }}
              style={{
                position: 'absolute',
                right: 0,
                top: '2px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Compact Settings Pills Bar + Send Action */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Quick Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Voice Selector */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                id="voice-select"
                value={currentVoiceId}
                onChange={(e) => {
                  setVoiceValue(e.target.value);
                  const v = VOICES.find(x => x.id === e.target.value);
                  if (v) audioEngine.playVoice(v.id, v.sampleText);
                }}
                style={{
                  background: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '99px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id} style={{ background: '#0f172a', color: '#fff' }}>
                    🎙️ {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>

            {/* Visual Style Selector */}
            <select
              id="style-select"
              value={currentStyleId}
              onChange={(e) => setStyleValue(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '99px',
                padding: '5px 12px',
                fontSize: '12px',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {VISUAL_STYLES.map((s) => (
                <option key={s.id} value={s.id} style={{ background: '#0f172a', color: '#fff' }}>
                  🎨 {s.name.split(' ')[0]}
                </option>
              ))}
            </select>

            {/* Background Music Selector */}
            <select
              id="music-select"
              value={currentMusicId}
              onChange={(e) => setMusicValue(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '99px',
                padding: '5px 12px',
                fontSize: '12px',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {MUSIC_TRACKS.map((m) => (
                <option key={m.id} value={m.id} style={{ background: '#0f172a', color: '#fff' }}>
                  🎵 {m.name.split(' ')[0]}
                </option>
              ))}
            </select>

            {/* Language Selector */}
            <select
              id="language-select"
              value={currentLanguage}
              onChange={(e) => setLanguageValue(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '99px',
                padding: '5px 12px',
                fontSize: '12px',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="Hinglish" style={{ background: '#0f172a' }}>🇮🇳 Hinglish</option>
              <option value="Hindi" style={{ background: '#0f172a' }}>🇮🇳 Hindi</option>
              <option value="English" style={{ background: '#0f172a' }}>🇺🇸 English</option>
              <option value="Spanish" style={{ background: '#0f172a' }}>🇪🇸 Spanish</option>
            </select>
          </div>

          {/* Engine Spec + Glowing Send Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              75s • 5 Scenes
            </span>

            <button
              id="shorts-submit-btn"
              type="submit"
              disabled={isGenerating || !promptValue.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: promptValue.trim() && !isGenerating 
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' 
                  : 'rgba(30, 41, 59, 0.8)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: promptValue.trim() && !isGenerating ? 'pointer' : 'default',
                boxShadow: promptValue.trim() && !isGenerating ? '0 0 20px rgba(99, 102, 241, 0.6)' : 'none',
                opacity: promptValue.trim() && !isGenerating ? 1 : 0.45,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                flexShrink: 0
              }}
            >
              {isGenerating ? (
                <Sparkles size={17} className="spin-animation" />
              ) : (
                <ArrowUp size={18} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Subtle Studio Footer Note */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '6px',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
        <span>Connected to n8n Cloud Autonomous Video Pipeline</span>
      </div>
    </div>
  );
}
