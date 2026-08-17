import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Film, Mic2, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function GenerationThinkingAnimation({ prompt, stage }) {
  const [elapsed, setElapsed] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    { title: 'Analyzing viral hooks & story angle', detail: 'Evaluating 3s retention hooks & emotional payoff' },
    { title: 'Drafting 5-act cinematic screenplay', detail: 'Structuring Scene 1 to 5 with visual prompts' },
    { title: 'Selecting voiceover & audio soundscape', detail: 'Harmonizing tone, voice modulation & background score' },
    { title: 'Connecting with n8n Cloud video engine', detail: 'Awaiting human review & story approval' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => +(prev + 0.1).toFixed(1));
    }, 100);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          audioEngine.playSfx('click');
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    return () => {
      clearInterval(timer);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className="saas-card" style={{
      maxWidth: '780px',
      margin: '0 auto 24px auto',
      padding: '24px',
      border: '1.5px solid var(--border-glow)',
      background: 'var(--bg-card)',
      boxShadow: 'var(--shadow-prompt)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '18px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--grad-gemini)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)'
          }}>
            <Sparkles size={16} color="#ffffff" className="spin-animation" />
          </div>
          <div>
            <div className="font-display" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
              ShortsAI Thinking...
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Autonomous Video Pipeline • Execution in progress
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-brand" style={{ fontSize: '11px' }}>
            ⏱️ {elapsed.toFixed(1)}s
          </span>
          <span className="badge badge-cyan" style={{ fontSize: '11px' }}>
            ⚡ n8n Cloud
          </span>
        </div>
      </div>

      {/* User Input Recap */}
      <div style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '10px 14px',
        marginBottom: '18px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: 'var(--text-secondary)'
      }}>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>Prompt:</span>
        <span style={{ color: 'var(--text-primary)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          "{prompt}"
        </span>
      </div>

      {/* Sequential Thought Process */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {steps.map((s, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isUpcoming = idx > currentStepIndex;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '10px',
                background: isCurrent ? 'var(--border-subtle)' : 'transparent',
                opacity: isUpcoming ? 0.45 : 1,
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {isDone ? (
                  <CheckCircle2 size={16} color="#10b981" />
                ) : isCurrent ? (
                  <Loader2 size={16} className="spin-animation" color="var(--accent-primary)" />
                ) : (
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1.5px solid var(--text-muted)' }} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: isCurrent ? 700 : 600,
                  color: isCurrent ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)'
                }}>
                  {s.title}
                </div>
                {isCurrent && (
                  <div style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                    {s.detail}...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
