import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Brain, 
  Film, 
  Mic2, 
  CheckCircle2, 
  Loader2, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  Flame, 
  Clock, 
  Radio 
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function GenerationThinkingAnimation({ prompt, stage }) {
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(8);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showLogs, setShowLogs] = useState(true);
  const [streamLogs, setStreamLogs] = useState([]);

  const sceneActs = [
    { num: 1, label: '3s Hook', icon: '⚡', time: '0-15s', color: '#f59e0b' },
    { num: 2, label: 'Tension', icon: '🔍', time: '15-30s', color: '#38bdf8' },
    { num: 3, label: 'Twist', icon: '💥', time: '30-45s', color: '#ec4899' },
    { num: 4, label: 'Climax', icon: '🔥', time: '45-60s', color: '#8b5cf6' },
    { num: 5, label: 'Payoff', icon: '🎬', time: '60-75s', color: '#10b981' }
  ];

  const steps = [
    { title: 'Deconstructing Topic & Viral Angle', detail: 'Extracting key curiosity gaps & 3-second hook vectors' },
    { title: 'Screenplay Architect (5-Act Structure)', detail: 'Writing visual scene beats, lighting cues & teleprompter script' },
    { title: 'ElevenLabs Voice & Dynamic Soundscape', detail: 'Modulating cadence, pacing, and ambient sound effects' },
    { title: 'n8n Cloud Webhook Bridge', detail: 'Preparing 5-act story package for creator review' }
  ];

  const logLines = [
    `[INFO] Ingesting prompt token stream: "${prompt.substring(0, 40)}..."`,
    `[ANALYZER] Topic resonance score: 98.4/100 • Target audience: Short-form Reels/Shorts`,
    `[WRITER] Structuring 5 scenes (75s total duration @ 15s per scene)`,
    `[SCENE 1] Hook generated: "What happened in the sky above Flight 19 was never meant to be heard..."`,
    `[SCENE 2-4] Building suspense curve and plot climax...`,
    `[AUDIO] Assigning ElevenLabs voice actor profile with background mystery score`,
    `[N8N CLOUD] Execution webhook synchronized • Awaiting approval callback`
  ];

  useEffect(() => {
    const startTime = Date.now();

    // High precision elapsed timer
    const timer = setInterval(() => {
      const sec = (Date.now() - startTime) / 1000;
      setElapsed(+sec.toFixed(1));
      setProgress((prev) => (prev < 94 ? +(prev + 0.9).toFixed(1) : prev));
    }, 100);

    // Step pipeline progression
    const stepTimer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          audioEngine.playSfx('click');
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    // Streaming logs simulation
    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < logLines.length) {
        setStreamLogs((prev) => [...prev, logLines[logIdx]]);
        logIdx++;
      }
    }, 700);

    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
      clearInterval(logInterval);
    };
  }, []);

  return (
    <div className="saas-card animate-float" style={{
      maxWidth: '780px',
      margin: '0 auto 24px auto',
      padding: '24px',
      border: '1.5px solid var(--border-glow)',
      background: 'var(--bg-card)',
      boxShadow: 'var(--shadow-prompt)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Glowing Top Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #6366f1, #38bdf8, #ec4899, #10b981, #6366f1)',
        backgroundSize: '200% 100%',
        animation: 'spin 3s linear infinite'
      }} />

      {/* Top Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '18px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--grad-gemini)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 18px rgba(56, 189, 248, 0.5)',
            flexShrink: 0
          }}>
            <Sparkles size={18} color="#ffffff" className="spin-animation" />
          </div>
          <div>
            <div className="font-display" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Autonomous AI Engine Generating</span>
              <span className="badge badge-brand" style={{ fontSize: '10.5px' }}>
                <Radio size={10} className="spin-animation" /> LIVE
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              n8n Cloud Workflow: <code>u8vcVLc00wPp2AAI</code> • 75s (5 Scenes)
            </div>
          </div>
        </div>

        {/* Live Timer Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '99px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <Clock size={12} />
            <span>{elapsed.toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* Real-time Progress Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          <span>Generation Pipeline Progress</span>
          <span style={{ color: 'var(--accent-primary)' }}>{Math.min(100, Math.floor(progress))}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          background: 'var(--bg-input)',
          borderRadius: '99px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #38bdf8, #ec4899)',
            borderRadius: '99px',
            transition: 'width 0.2s ease',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.8)'
          }} />
        </div>
      </div>

      {/* 5-Act Scene Storyboard Preview Strip */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          5-Act Scene Architecture:
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px'
        }}>
          {sceneActs.map((act, i) => {
            const isUnlocked = currentStepIndex >= i || elapsed > (i * 1.5 + 0.5);
            return (
              <div
                key={act.num}
                style={{
                  background: isUnlocked ? 'var(--bg-input)' : 'transparent',
                  border: `1px solid ${isUnlocked ? act.color : 'var(--border-subtle)'}`,
                  borderRadius: '10px',
                  padding: '8px 6px',
                  textAlign: 'center',
                  opacity: isUnlocked ? 1 : 0.4,
                  boxShadow: isUnlocked ? `0 4px 14px ${act.color}20` : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ fontSize: '14px', marginBottom: '2px' }}>{act.icon}</div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Scene {act.num}
                </div>
                <div style={{ fontSize: '9.5px', color: act.color, fontWeight: 700 }}>
                  {act.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sequential Thought Step Highlights */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
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
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: isCurrent ? 'var(--bg-input)' : 'transparent',
                border: isCurrent ? '1px solid var(--border-medium)' : '1px solid transparent',
                opacity: isUpcoming ? 0.35 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {isDone ? (
                  <CheckCircle2 size={15} color="#10b981" />
                ) : isCurrent ? (
                  <Loader2 size={15} className="spin-animation" color="var(--accent-primary)" />
                ) : (
                  <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '1.5px solid var(--text-muted)' }} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '12.5px',
                  fontWeight: isCurrent ? 700 : 600,
                  color: isCurrent ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)'
                }}>
                  {s.title}
                </div>
                {isCurrent && (
                  <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                    {s.detail}...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable Live AI Thought Terminal Log */}
      <div style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div
          onClick={() => setShowLogs(!showLogs)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            cursor: 'pointer',
            background: 'var(--border-subtle)',
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={13} color="var(--accent-primary)" />
            <span>AI Reasoning Stream ({streamLogs.length} events)</span>
          </div>
          {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>

        {showLogs && (
          <div style={{
            padding: '10px 12px',
            maxHeight: '110px',
            overflowY: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10.5px',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}>
            {streamLogs.map((log, index) => (
              <div key={index} style={{
                color: log.includes('[INFO]') ? 'var(--accent-cyan)' : log.includes('[SCENE') ? '#10b981' : log.includes('[WRITER') ? '#ec4899' : 'var(--text-secondary)'
              }}>
                {log}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)' }}>
              <span className="spin-animation" style={{ display: 'inline-block' }}>▰</span>
              <span>Streaming execution tokens...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
