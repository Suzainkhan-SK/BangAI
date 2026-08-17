import React, { useState, useEffect } from 'react';
import { Mic2, Volume2, Square, Sliders, Check } from 'lucide-react';
import { VOICES } from '../../data/voices';
import { audioEngine } from '../../audio/audioEngine';

export default function VoiceMatrix({ selectedVoiceId, onSelectVoice }) {
  const [audioState, setAudioState] = useState({ isPlayingVoice: false, currentVoiceId: null });
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [stability, setStability] = useState(75);

  useEffect(() => {
    return audioEngine.subscribe((state) => setAudioState(state));
  }, []);

  const handlePlaySample = (e, voice) => {
    e.stopPropagation();
    if (audioState.isPlayingVoice && audioState.currentVoiceId === voice.id) {
      audioEngine.stopVoice();
    } else {
      audioEngine.playVoice(voice.id, voice.sampleText);
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

      {/* Voice Selection Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
        {VOICES.map((voice) => {
          const isSelected = selectedVoiceId === voice.id;
          const isPlayingThis = audioState.isPlayingVoice && audioState.currentVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => {
                audioEngine.playSfx('click');
                onSelectVoice(voice.id);
              }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={(e) => handlePlaySample(e, voice)}
                  style={{
                    background: isPlayingThis ? voice.color : 'rgba(255, 255, 255, 0.08)',
                    color: isPlayingThis ? '#000000' : '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 9px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isPlayingThis ? (
                    <>
                      <Square size={10} fill="#000000" />
                      <span>Playing</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={12} />
                      <span>Sample</span>
                    </>
                  )}
                </button>
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
            <span style={{ color: '#ffffff', fontWeight: 600 }}>{voiceSpeed}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.3"
            step="0.05"
            value={voiceSpeed}
            onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
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
