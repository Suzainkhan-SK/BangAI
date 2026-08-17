import React, { useRef } from 'react';
import { 
  Sparkles, 
  ArrowUp, 
  X,
  Zap
} from 'lucide-react';
import { VOICES } from '../../data/voices';
import { VISUAL_STYLES } from '../../data/visualStyles';
import { MUSIC_TRACKS } from '../../data/musicTracks';
import { audioEngine } from '../../audio/audioEngine';

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

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!promptValue.trim() || isGenerating) return;
    audioEngine.playSfx('boom');
    if (typeof props.onGenerate === 'function') props.onGenerate();
    else if (typeof props.onSubmit === 'function') props.onSubmit();
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
        {/* Text Input Row */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <textarea
            ref={textareaRef}
            id="shorts-prompt-input"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            placeholder="Ask ShortsAI to generate any video... (e.g. 'Flight 19 in Bermuda Triangle with cockpit static')"
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
          gap: '6px',
          paddingTop: '6px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {/* Quick Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {/* Voice */}
            <select
              id="voice-select"
              value={currentVoiceId}
              onChange={(e) => {
                setVoiceValue(e.target.value);
                const v = VOICES.find(x => x.id === e.target.value);
                if (v) audioEngine.playVoice(v.id, v.sampleText);
              }}
              style={{
                background: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '99px',
                padding: '4px 10px',
                fontSize: '11.5px',
                color: 'var(--text-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  🎙️ {v.name}
                </option>
              ))}
            </select>

            {/* Visual Style */}
            <select
              id="style-select"
              value={currentStyleId}
              onChange={(e) => setStyleValue(e.target.value)}
              style={{
                background: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '99px',
                padding: '4px 10px',
                fontSize: '11.5px',
                color: 'var(--text-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {VISUAL_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  🎨 {s.name.split(' ')[0]}
                </option>
              ))}
            </select>

            {/* Music */}
            <select
              id="music-select"
              value={currentMusicId}
              onChange={(e) => setMusicValue(e.target.value)}
              style={{
                background: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '99px',
                padding: '4px 10px',
                fontSize: '11.5px',
                color: 'var(--text-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {MUSIC_TRACKS.map((m) => (
                <option key={m.id} value={m.id}>
                  🎵 {m.name.split(' ')[0]}
                </option>
              ))}
            </select>

            {/* Language */}
            <select
              id="language-select"
              value={currentLanguage}
              onChange={(e) => setLanguageValue(e.target.value)}
              style={{
                background: 'var(--bg-pill)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '99px',
                padding: '4px 10px',
                fontSize: '11.5px',
                color: 'var(--text-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="Hinglish">🇮🇳 Hinglish</option>
              <option value="Hindi">🇮🇳 Hindi</option>
              <option value="English">🇺🇸 English</option>
              <option value="Spanish">🇪🇸 Spanish</option>
            </select>
          </div>

          {/* Send Button */}
          <button
            id="shorts-submit-btn"
            type="submit"
            disabled={isGenerating || !promptValue.trim()}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: promptValue.trim() && !isGenerating 
                ? 'var(--grad-primary)' 
                : 'var(--bg-pill)',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: promptValue.trim() && !isGenerating ? 'pointer' : 'default',
              boxShadow: promptValue.trim() && !isGenerating ? '0 0 14px rgba(99, 102, 241, 0.45)' : 'none',
              opacity: promptValue.trim() && !isGenerating ? 1 : 0.4,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              flexShrink: 0
            }}
          >
            {isGenerating ? (
              <Sparkles size={15} className="spin-animation" />
            ) : (
              <ArrowUp size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </form>

      {/* Subtle Studio Footer Note */}
      <div style={{
        textAlign: 'center',
        marginTop: '6px',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        ShortsAI generates 75s (5 scenes) short-form videos with ElevenLabs audio.
      </div>
    </div>
  );
}
