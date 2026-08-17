import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Brain, 
  Film, 
  Mic2, 
  CheckCircle2, 
  Loader2, 
  Zap, 
  Clock, 
  Radio, 
  Flame, 
  Check, 
  Activity,
  Layers
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function GenerationThinkingAnimation({ prompt = '', stage = '' }) {
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(12);
  const [activeActIndex, setActiveActIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const sceneActs = [
    { num: 1, title: 'Viral Hook', time: '0-15s', icon: '⚡', color: '#f59e0b', desc: 'Crafting 3-second pattern interrupt' },
    { num: 2, title: 'Suspense & Setup', time: '15-30s', icon: '🔍', color: '#38bdf8', desc: 'Building curiosity & context' },
    { num: 3, title: 'The Shocking Twist', time: '30-45s', icon: '💥', color: '#ec4899', desc: 'Delivering unpredictable pivot' },
    { num: 4, title: 'Climax Peak', time: '45-60s', icon: '🔥', color: '#8b5cf6', desc: 'High-intensity resolution beat' },
    { num: 5, title: 'Wisdom & CTA', time: '60-75s', icon: '🎬', color: '#10b981', desc: 'Memorable takeaway & subscribe' }
  ];

  const pipelineSteps = [
    { title: 'Deconstructing Topic & Audience Resonance', icon: Brain },
    { title: 'Writing 5-Scene Screenplay & Camera Angles', icon: Film },
    { title: 'Harmonizing Voiceover & Dynamic Soundscape', icon: Mic2 },
    { title: 'Packaging for Creator 1-Tap Review', icon: Sparkles }
  ];

  const liveLogs = [
    'Ingesting topic brief & analyzing retention curves...',
    'Generating 3-second hook: "What they found was never meant to be heard..."',
    'Drafting Scene 1 to 5 with visual prompts & camera framing...',
    'Modulating ElevenLabs voice actor tone for cinematic pacing...',
    'Synchronizing n8n execution token • Awaiting creator approval...'
  ];

  useEffect(() => {
    const startTime = Date.now();

    // High precision timer
    const timer = setInterval(() => {
      const sec = (Date.now() - startTime) / 1000;
      setElapsed(+sec.toFixed(1));
      setProgress((prev) => (prev < 95 ? +(prev + 0.85).toFixed(1) : prev));
    }, 100);

    // Scene Act progression
    const actInterval = setInterval(() => {
      setActiveActIndex((prev) => (prev < sceneActs.length - 1 ? prev + 1 : prev));
      setActiveStepIndex((prev) => (prev < pipelineSteps.length - 1 ? prev + 1 : prev));
    }, 1600);

    return () => {
      clearInterval(timer);
      clearInterval(actInterval);
    };
  }, []);

  const currentLog = liveLogs[Math.min(activeActIndex, liveLogs.length - 1)] || liveLogs[0];

  return (
    <div style={{
      maxWidth: '820px',
      margin: '0 auto 28px auto',
      position: 'relative'
    }}>
      {/* Outer Glowing Hologram Card */}
      <div className="saas-card" style={{
        padding: '28px',
        borderRadius: '24px',
        border: '1.5px solid var(--border-glow)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-prompt)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Neon Sweep Top Beam */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #6366f1, #38bdf8, #ec4899, #10b981, #6366f1)',
          backgroundSize: '200% 100%',
          animation: 'spin 4s linear infinite'
        }} />

        {/* Header: AI Core Status + Live Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Animated Pulsing AI Sphere */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--grad-gemini)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.6)',
              flexShrink: 0
            }}>
              <Sparkles size={20} color="#ffffff" className="spin-animation" />
            </div>

            <div>
              <div className="font-display" style={{
                fontSize: '17px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>Autonomous AI Engine Generating</span>
                <span className="badge badge-brand" style={{ fontSize: '10px', padding: '2px 8px' }}>
                  <Radio size={10} className="spin-animation" /> LIVE
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                75-Second (5 Scenes) Video Screenplay Pipeline
              </div>
            </div>
          </div>

          {/* Live Timer Counter Pill */}
          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '99px',
            padding: '5px 14px',
            fontSize: '12.5px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Clock size={13} />
            <span>{elapsed.toFixed(1)}s</span>
          </div>
        </div>

        {/* Prompt Brief Box */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '12px 16px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', flexShrink: 0 }}>
              Prompt:
            </span>
            <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              "{prompt || 'Generating viral story screenplay...'}"
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
            5 Scenes • 75s
          </span>
        </div>

        {/* Progress Bar with Percentage */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginBottom: '8px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={13} color="var(--accent-primary)" />
              Synthesizing Story Beats & Audio Alignment
            </span>
            <span style={{ color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
              {Math.min(100, Math.floor(progress))}%
            </span>
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
              background: 'linear-gradient(90deg, #6366f1 0%, #38bdf8 50%, #ec4899 100%)',
              borderRadius: '99px',
              transition: 'width 0.25s ease',
              boxShadow: '0 0 14px rgba(99, 102, 241, 0.8)'
            }} />
          </div>
        </div>

        {/* 5-Act Scene Blueprint Cards */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '10px'
          }}>
            5-Act Story Architecture:
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px'
          }}>
            {sceneActs.map((act, idx) => {
              const isDone = idx < activeActIndex;
              const isCurrent = idx === activeActIndex;
              const isPending = idx > activeActIndex;

              return (
                <div
                  key={act.num}
                  style={{
                    background: isCurrent ? 'var(--bg-input)' : isDone ? 'var(--bg-input)' : 'transparent',
                    border: `1.5px solid ${isCurrent ? act.color : isDone ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                    borderRadius: '12px',
                    padding: '10px 8px',
                    textAlign: 'center',
                    position: 'relative',
                    boxShadow: isCurrent ? `0 4px 18px ${act.color}35` : 'none',
                    opacity: isPending ? 0.35 : 1,
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{
                    fontSize: '18px',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <span>{act.icon}</span>
                    {isDone && <Check size={13} color="#10b981" strokeWidth={3} />}
                  </div>

                  <div style={{
                    fontSize: '11.5px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: '2px'
                  }}>
                    Scene {act.num}
                  </div>

                  <div style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isCurrent ? act.color : isDone ? '#10b981' : 'var(--text-muted)'
                  }}>
                    {act.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Thought Stream Ticker */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent-primary)',
            boxShadow: '0 0 10px var(--accent-primary)',
            flexShrink: 0
          }} className="spin-animation" />

          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginRight: '6px' }}>
              AI Thought:
            </span>
            {currentLog}
          </div>
        </div>
      </div>
    </div>
  );
}
