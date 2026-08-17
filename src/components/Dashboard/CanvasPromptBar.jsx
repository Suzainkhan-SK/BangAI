import React, { useState } from 'react';
import { Mic2, Palette, Globe, Music, Sparkles, ArrowUp, Zap, Sliders, ChevronDown } from 'lucide-react';
import { VOICES } from '../../data/voices';
import { VISUAL_STYLES } from '../../data/visualStyles';
import { MUSIC_TRACKS } from '../../data/musicTracks';
import { audioEngine } from '../../audio/audioEngine';

export default function CanvasPromptBar({
  prompt,
  setPrompt,
  voiceId,
  setVoiceId,
  styleId,
  setStyleId,
  musicId,
  setMusicId,
  language,
  setLanguage,
  onGenerate,
  isGenerating
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    audioEngine.playSfx('boom');
    onGenerate();
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '840px',
      margin: '0 auto',
      position: 'relative'
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--bg-gemini-input)',
          border: '1.5px solid var(--border-glow)',
          borderRadius: '24px',
          padding: '10px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Sleek Compact Textarea Input */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask ShortsAI to generate any video... (e.g., 'Unsolved mystery of Flight 19 in Bermuda Triangle with cockpit static in Hinglish')"
          rows={2}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.45,
            resize: 'none',
            padding: '2px 0'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        {/* Compact Selector Pills + Circular Send Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px',
          paddingTop: '6px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {/* Quick Config Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {/* Voice */}
            <select
              value={voiceId}
              onChange={(e) => {
                setVoiceId(e.target.value);
                const v = VOICES.find(x => x.id === e.target.value);
                if (v) audioEngine.playVoice(v.id, v.sampleText);
              }}
              style={{
                background: 'var(--bg-card)',
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
              value={styleId}
              onChange={(e) => setStyleId(e.target.value)}
              style={{
                background: 'var(--bg-card)',
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

            {/* BGM */}
            <select
              value={musicId}
              onChange={(e) => setMusicId(e.target.value)}
              style={{
                background: 'var(--bg-card)',
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
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                background: 'var(--bg-card)',
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

          {/* Circular Glowing Send Button */}
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: prompt.trim() ? 'var(--grad-primary)' : 'var(--bg-card)',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: prompt.trim() ? 'pointer' : 'default',
              boxShadow: prompt.trim() ? '0 0 14px rgba(99, 102, 241, 0.5)' : 'none',
              opacity: prompt.trim() ? 1 : 0.4,
              transition: 'all 0.2s ease',
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

      {/* Subtle Disclaimer */}
      <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
        ShortsAI generates 75-second 5-scene cinematic video screenplays with ElevenLabs audio.
      </div>
    </div>
  );
}
