import React, { useState, useEffect, useRef } from 'react';
import { Mic2, Volume2, Square, Sliders, Check, Loader2, Sparkles, Play, RefreshCw } from 'lucide-react';
import { VOICES } from '../../data/voices';

export default function VoiceMatrix({ selectedVoiceId, onSelectVoice, voiceSpeed = 1.0, onVoiceSpeedChange }) {
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [generatingVoiceId, setGeneratingVoiceId] = useState(null);
  const [speed, setSpeed] = useState(Number(voiceSpeed) || 1.0);
  const [stability, setStability] = useState(75);
  const [customText, setCustomText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const audioRef = useRef(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play pre-recorded ElevenLabs preview sample
  const handlePlaySample = (e, voice) => {
    e.stopPropagation();

    // If already playing this voice, stop
    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (voice.previewUrl) {
      const audio = new Audio(voice.previewUrl);
      audioRef.current = audio;
      setPlayingVoiceId(voice.id);

      audio.play().catch(err => {
        console.warn('Audio play failed:', err);
        setPlayingVoiceId(null);
      });

      audio.onended = () => {
        setPlayingVoiceId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingVoiceId(null);
        audioRef.current = null;
      };
    }
  };

  // Generate real TTS preview via ElevenLabs API
  const handleGeneratePreview = async (e, voice) => {
    e.stopPropagation();

    if (generatingVoiceId) return; // Already generating

    const textToSpeak = customText.trim() || voice.sampleText;
    setGeneratingVoiceId(voice.id);

    try {
      const res = await fetch('/.netlify/functions/preview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voice.elevenLabsId,
          text: textToSpeak
        })
      });

      const data = await res.json();

      if (data.success && data.audio) {
        // Stop any current audio
        if (audioRef.current) {
          audioRef.current.pause();
        }

        // Play the base64 audio
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
        audioRef.current = audio;
        setPlayingVoiceId(voice.id);

        audio.play().catch(err => {
          console.warn('TTS audio play failed:', err);
          setPlayingVoiceId(null);
        });

        audio.onended = () => {
          setPlayingVoiceId(null);
          audioRef.current = null;
        };
      } else {
        console.error('TTS generation failed:', data.error);
      }
    } catch (err) {
      console.error('TTS preview error:', err);
    } finally {
      setGeneratingVoiceId(null);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Mic2 size={16} color="#34d399" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>
            ElevenLabs Voice Matrix
          </span>
        </div>
        <span className="badge-pill badge-emerald">
          Turbo v2.5
        </span>
      </div>

      {/* Custom Text Input Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          style={{
            background: showCustomInput ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${showCustomInput ? '#34d399' : 'var(--border-subtle)'}`,
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '10px',
            fontWeight: 600,
            color: showCustomInput ? '#34d399' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease'
          }}
        >
          <Sparkles size={10} />
          Custom Preview Text
        </button>
        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
          Uses real ElevenLabs TTS
        </span>
      </div>

      {showCustomInput && (
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Type custom text to preview with any voice... (max 500 chars)"
          maxLength={500}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '11px',
            color: '#ffffff',
            resize: 'vertical',
            minHeight: '48px',
            maxHeight: '80px',
            fontFamily: 'inherit',
            outline: 'none'
          }}
        />
      )}

      {/* Voice Selection Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
        {VOICES.map((voice) => {
          const isSelected = selectedVoiceId === voice.id;
          const isPlayingThis = playingVoiceId === voice.id;
          const isGeneratingThis = generatingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              style={{
                background: isSelected ? 'rgba(30, 41, 69, 0.9)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isSelected ? voice.color : 'var(--border-subtle)'}`,
                borderRadius: '10px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 0 12px ${voice.color}35` : 'none'
              }}
            >
              {/* Voice info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `${voice.color}25`,
                  border: `1px solid ${voice.color}50`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: voice.color
                }}>
                  {voice.name[0]}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff' }}>
                      {voice.name}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {voice.flag}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: voice.color }}>
                    {voice.tag}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* Quick Preview (pre-recorded sample) */}
                <button
                  onClick={(e) => handlePlaySample(e, voice)}
                  title="Play pre-recorded sample"
                  style={{
                    background: isPlayingThis && !isGeneratingThis ? voice.color : 'rgba(255, 255, 255, 0.08)',
                    color: isPlayingThis && !isGeneratingThis ? '#000000' : '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 7px',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isPlayingThis ? (
                    <>
                      <Square size={9} fill="#000000" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={10} />
                      <span>Sample</span>
                    </>
                  )}
                </button>

                {/* Generate TTS Preview */}
                <button
                  onClick={(e) => handleGeneratePreview(e, voice)}
                  title="Generate real AI voice preview"
                  disabled={!!generatingVoiceId}
                  style={{
                    background: isGeneratingThis ? `${voice.color}30` : 'rgba(16, 185, 129, 0.1)',
                    color: isGeneratingThis ? voice.color : '#34d399',
                    border: `1px solid ${isGeneratingThis ? voice.color : '#34d39940'}`,
                    borderRadius: '6px',
                    padding: '4px 7px',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: generatingVoiceId ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    transition: 'all 0.15s ease',
                    opacity: generatingVoiceId && !isGeneratingThis ? 0.5 : 1
                  }}
                >
                  {isGeneratingThis ? (
                    <>
                      <Loader2 size={10} className="spin-animation" />
                      <span>AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={9} />
                      <span>AI</span>
                    </>
                  )}
                </button>

                {/* Selected checkmark */}
                {isSelected && (
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: voice.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={11} color="#000000" strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Speed & Stability Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
            <span>Speech Speed</span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>{speed}x</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.25"
            step="0.05"
            value={speed}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSpeed(val);
              if (typeof onVoiceSpeedChange === 'function') onVoiceSpeedChange(val);
            }}
            style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
            <span>Clarity & Stability</span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>{stability}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={stability}
            onChange={(e) => setStability(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
}
