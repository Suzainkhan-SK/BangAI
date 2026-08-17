import React, { useRef } from 'react';
import { 
  Sparkles, 
  ArrowUp, 
  X,
  Zap,
  MessageSquare,
  Wand2,
  Film
} from 'lucide-react';
import { VOICES } from '../../data/voices';
import { VISUAL_STYLES } from '../../data/visualStyles';
import { MUSIC_TRACKS } from '../../data/musicTracks';
import { audioEngine } from '../../audio/audioEngine';
import { detectMode } from '../../utils/detectIntent';

export default function CanvasPromptBar(props) {
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

  const detectedMode = detectMode(promptValue);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!promptValue.trim() || isGenerating) return;
    audioEngine.playSfx('boom');
    if (typeof props.onGenerate === 'function') props.onGenerate(detectedMode);
    else if (typeof props.onSubmit === 'function') props.onSubmit(detectedMode);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '780px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Gemini Floating Prompt Box */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--bg-gemini-input)',
          border: '1.5px solid var(--border-glow)',
          borderRadius: '26px',
          padding: '12px 18px',
          boxShadow: 'var(--shadow-prompt)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        {/* Intent Mode Badge Header (Shows dynamic mode as user types) */}
        {promptValue.trim().length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
            {detectedMode === 'REFINE_STORY' ? (
              <span className="badge badge-brand" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px' }}>
                <Wand2 size={11} /> Refine & Improve Story
              </span>
            ) : detectedMode === 'CHAT' ? (
              <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px' }}>
                <MessageSquare size={11} /> Conversational AI Q&A
              </span>
            ) : (
              <span className="badge badge-brand" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px' }}>
                <Film size={11} /> 75s Video Generation
              </span>
            )}
          </div>
        )}

        {/* Text Input Row */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <textarea
            ref={textareaRef}
            id="shorts-prompt-input"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            placeholder="Ask ShortsAI anything or create a video... (e.g. 'Flight 19 in Bermuda Triangle' or 'improve the story brief')"
            rows={2}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
              lineHeight: 1.45,
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
                background: 'var(--border-subtle)',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
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

        {/* Settings Pills + Send Action Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '4px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {/* Quick Config Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Voice Selector */}
            <select
              value={currentVoiceId}
              onChange={(e) => setVoiceValue(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '99px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  🎙️ {v.name} ({v.gender})
                </option>
              ))}
            </select>

            {/* Visual Style Selector */}
            <select
              value={currentStyleId}
              onChange={(e) => setStyleValue(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '99px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {VISUAL_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  🎨 {s.name}
                </option>
              ))}
            </select>

            {/* Language Selector */}
            <select
              value={currentLanguage}
              onChange={(e) => setLanguageValue(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '99px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="Hinglish">🗣️ Hinglish</option>
              <option value="Hindi">🗣️ Hindi</option>
              <option value="English">🗣️ English</option>
            </select>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!promptValue.trim() || isGenerating}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: promptValue.trim() ? 'var(--grad-gemini)' : 'var(--bg-input)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: promptValue.trim() ? '#ffffff' : 'var(--text-muted)',
              cursor: promptValue.trim() && !isGenerating ? 'pointer' : 'not-allowed',
              boxShadow: promptValue.trim() ? '0 0 16px rgba(56, 189, 248, 0.4)' : 'none',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
