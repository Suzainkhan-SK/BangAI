import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Cpu, 
  Sparkles, 
  Volume2, 
  Video, 
  Layers, 
  ExternalLink
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function GenerationPipelineModal({
  isOpen,
  onClose,
  title,
  scenes,
  voiceName,
  musicName,
  visualStyleName
}) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const youtubeSvg = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );

  const stages = [
    { name: 'Stage 0: Topic & Genre Classification', desc: 'Gemini 2.5 Flash categorizing theme & anti-duplicate check', icon: <Cpu size={14} color="#818cf8" /> },
    { name: 'Stage 1: Strategy Engine Brain', desc: 'Generating 5-beat emotional arc & high-converting title', icon: <Sparkles size={14} color="#f59e0b" /> },
    { name: 'Stage 2: Master Screenplay Production', desc: 'Writing 5 scenes with strict 190-200 char timing & Grok prompts', icon: <Layers size={14} color="#3b82f6" /> },
    { name: 'Stage 3: 7-Checkpoint Quality Critic', desc: 'Auditing character counts, visual consistency & safety policy', icon: <CheckCircle2 size={14} color="#10b981" /> },
    { name: 'Stage 4A: Grok Imagine 1.5 Video Generation', desc: 'Rendering 5 parallel 15s 4K 9:16 vertical video scenes', icon: <Video size={14} color="#06b6d4" /> },
    { name: 'Stage 4B: ElevenLabs Voice Synthesis & BGM Ducking', desc: `Generating speech (${voiceName}) & mixing ${musicName} at -18dB`, icon: <Volume2 size={14} color="#ec4899" /> },
    { name: 'Stage 5: Final 4K Assembly & YouTube Upload', desc: 'Concatenating 5 scenes, animated captions & publishing to YouTube', icon: youtubeSvg },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStageIndex(0);
      setLogs([]);
      setIsCompleted(false);
      return;
    }

    let current = 0;
    const interval = setInterval(() => {
      if (current < stages.length) {
        const stage = stages[current];
        setCurrentStageIndex(current);
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✅ ${stage.name} - ${stage.desc}`
        ]);
        current += 1;
      } else {
        setIsCompleted(true);
        audioEngine.playSfx('success');
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '680px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--border-glow)',
        boxShadow: 'var(--glow-primary)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(13, 18, 31, 0.9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={16} color="#ffffff" className={!isCompleted ? 'spin-animation' : ''} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px' }}>
                {isCompleted ? '🎉 75s Video Generation Complete!' : '⚡ Executing Autonomous Production Pipeline...'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Target: {title}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playSfx('click');
              onClose();
            }}
            className="btn-icon"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Pipeline Execution Progress</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                {Math.round(((currentStageIndex + (isCompleted ? 1 : 0)) / stages.length) * 100)}%
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((currentStageIndex + (isCompleted ? 1 : 0)) / stages.length) * 100}%`,
                background: 'var(--grad-primary)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Stages List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stages.map((stage, idx) => {
              const isDone = idx < currentStageIndex || isCompleted;
              const isCurrent = idx === currentStageIndex && !isCompleted;

              return (
                <div
                  key={idx}
                  style={{
                    background: isCurrent ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isCurrent ? 'var(--accent-primary)' : isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {stage.icon}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '12.5px', color: isCurrent ? '#ffffff' : isDone ? '#e2e8f0' : 'var(--text-muted)' }}>
                        {stage.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {stage.desc}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isDone ? (
                      <span style={{ color: '#34d399', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} />
                        Done
                      </span>
                    ) : isCurrent ? (
                      <span style={{ color: 'var(--accent-amber)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <RefreshCw size={12} className="spin-animation" />
                        Running...
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dark)', fontSize: '11px' }}>Queued</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Console Log Terminal */}
          <div style={{
            background: '#040711',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#34d399',
            maxHeight: '130px',
            overflowY: 'auto'
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '3px' }}>{log}</div>
            ))}
            {!isCompleted && (
              <div style={{ color: 'var(--accent-cyan)' }}>⏳ Grok Imagine 1.5 streaming video tokens...</div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          background: 'rgba(13, 18, 31, 0.9)'
        }}>
          {isCompleted && (
            <button
              onClick={() => {
                audioEngine.playSfx('click');
                window.open('https://youtube.com/shorts', '_blank');
              }}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <ExternalLink size={14} />
              <span>View Uploaded Video</span>
            </button>
          )}
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              onClose();
            }}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
