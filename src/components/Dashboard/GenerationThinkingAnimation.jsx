import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Brain, Film, CheckCircle2, Loader2, Zap,
  Clock, Radio, Check, Cpu, ShieldCheck, Video, Volume2,
  Layers, Wand2, Clapperboard, Mic2, Package
} from 'lucide-react';

// ── Inline animated styles injected once ─────────────────────────────
const ANIM_ID = 'gen-anim-styles';
const ANIM_CSS = `
@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes beamScan {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
@keyframes pulseRing {
  0%   { transform: scale(1);   opacity: 0.7; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes orbitDot {
  0%   { transform: rotate(0deg)   translateX(28px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(28px) rotate(-360deg); }
}
@keyframes textTicker {
  0%   { opacity: 0; transform: translateY(6px); }
  15%  { opacity: 1; transform: translateY(0); }
  85%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
}
@keyframes progressFill {
  from { width: 0%; }
  to   { width: 100%; }
}
@keyframes stepIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;
if (typeof document !== 'undefined' && !document.getElementById(ANIM_ID)) {
  const s = document.createElement('style');
  s.id = ANIM_ID;
  s.textContent = ANIM_CSS;
  document.head.appendChild(s);
}

// ── Stage step definitions ────────────────────────────────────────────
const STAGE1 = [
  {
    icon: Cpu,
    color: '#6366f1', glow: 'rgba(99,102,241,0.35)',
    label: 'n8n Webhook Dispatch',
    sub: 'Connecting to autonomous cloud pipeline u8vcVLc00wPp2AAI',
    logLines: ['POST /webhook/u8vcVLc00wPp2AAI → 200 OK', 'Execution ID: exec-' + Math.random().toString(36).slice(2,9)]
  },
  {
    icon: Brain,
    color: '#38bdf8', glow: 'rgba(56,189,248,0.35)',
    label: 'Claude 4.6: Topic & Category Analysis',
    sub: 'Classifying viral potential, audience & retention hooks',
    logLines: ['LLM → claude-sonnet-4-6', 'Tokens: 1,240 in / 680 out', 'Category: Education / Viral']
  },
  {
    icon: Wand2,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.35)',
    label: 'Strategy Engine: 5-Beat Narrative Arc',
    sub: 'Crafting scroll-stopping hook, story brief & viral angle',
    logLines: ['Narrative arc: HOOK → BUILD → REVEAL → TWIST → CTA', 'Viral Hook: Generating...', 'Story Brief: ✓ Ready']
  },
  {
    icon: CheckCircle2,
    color: '#10b981', glow: 'rgba(16,185,129,0.35)',
    label: 'Story Payload Sync to Studio',
    sub: 'Sending for creator 1-tap review on dashboard',
    logLines: ['Payload: story.json → story-approval store', 'Status: READY_FOR_APPROVAL ✓']
  },
];

const STAGE2 = [
  {
    icon: Clapperboard,
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.35)',
    label: 'Screenplay Production Engine',
    sub: 'Writing 5 scenes with 15s pacing, camera angles & VO lines',
    logLines: ['Scene 1/5 → Writing...', 'Camera: Wide + Close-up sequence', 'Pacing: 15s × 5 acts']
  },
  {
    icon: ShieldCheck,
    color: '#ec4899', glow: 'rgba(236,72,153,0.35)',
    label: '7-Checkpoint Quality Critic',
    sub: 'Auditing dialogue, visual consistency & policy compliance',
    logLines: ['Hook quality: 98/100', 'Content policy: PASS ✓', 'Retention score: 94/100']
  },
  {
    icon: Layers,
    color: '#38bdf8', glow: 'rgba(56,189,248,0.35)',
    label: 'Split Scenes Decomposition',
    sub: 'Formatting 5 production prompts with visual & audio specs',
    logLines: ['Scene 1-5 prompts → Formatted', 'Visual style: Cinematic Realistic', 'Duration: 75s total']
  },
  {
    icon: CheckCircle2,
    color: '#10b981', glow: 'rgba(16,185,129,0.35)',
    label: 'Final Scenes Ready for Approval',
    sub: 'Syncing to creator studio for final video rendering approval',
    logLines: ['Payload: scenes.json → ✓', 'Status: SCENES_READY_FOR_APPROVAL']
  },
];

const STAGE3 = [
  {
    icon: Video,
    color: '#6366f1', glow: 'rgba(99,102,241,0.4)',
    label: '4A: Visual Prompt Dispatch — Video Engine',
    sub: 'Decomposing 5 cinematic prompts with motion parameters',
    logLines: ['Engine: Wan 2.1 Video Core', 'Frame: 1080×1920 (9:16)', 'Scenes: 5 × 15s dispatched']
  },
  {
    icon: Film,
    color: '#38bdf8', glow: 'rgba(56,189,248,0.4)',
    label: '4B: Parallel Scene Rendering',
    sub: 'Rendering 5 cinematic clips with studio-grade lighting',
    logLines: ['Scene 1 → Rendering (15s)', 'Scene 2 → Rendering (15s)', 'Progress: 40%...']
  },
  {
    icon: Mic2,
    color: '#ec4899', glow: 'rgba(236,72,153,0.4)',
    label: '4C: ElevenLabs Voice Synthesis',
    sub: 'Studio narration with -18dB dynamic background music',
    logLines: ['Voice: Adam (Male)', 'Bitrate: 192kbps', 'Audio ducking: -18dB ✓']
  },
  {
    icon: Layers,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.4)',
    label: '5A: Final MP4 Assembly',
    sub: 'Concatenating 5 scenes, animated captions & master export',
    logLines: ['FFmpeg: concat 5 clips', 'Motion typography: ✓', 'Master export: 1080×1920 MP4']
  },
  {
    icon: Package,
    color: '#10b981', glow: 'rgba(16,185,129,0.4)',
    label: '5B: Packaging & Studio Delivery',
    sub: 'Finalizing deliverables, thumbnail & YouTube metadata',
    logLines: ['Thumbnail: AI generated ✓', 'YouTube metadata: Ready', 'Delivery: Studio canvas ✓']
  },
];

// ── Animated log ticker ───────────────────────────────────────────────
function LogTicker({ lines, color }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!lines || lines.length === 0) return;
    const t = setInterval(() => setIdx(i => (i + 1) % lines.length), 1800);
    return () => clearInterval(t);
  }, [lines]);
  if (!lines || lines.length === 0) return null;
  return (
    <div style={{ overflow: 'hidden', height: '18px', position: 'relative', marginTop: '4px' }}>
      <div key={idx} style={{
        fontSize: '10.5px', fontFamily: 'monospace', color: color,
        opacity: 0.85, animation: 'textTicker 1.8s ease forwards',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        › {lines[idx]}
      </div>
    </div>
  );
}

// ── Glowing pulsing orb ───────────────────────────────────────────────
function PulseOrb({ color, size = 52 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Pulse ring */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: `2px solid ${color}`, animation: 'pulseRing 1.6s ease-out infinite'
      }} />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: `2px solid ${color}`, animation: 'pulseRing 1.6s ease-out 0.5s infinite'
      }} />
      {/* Core orb */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${color}aa, ${color}44)`,
        boxShadow: `0 0 20px ${color}66, inset 0 0 12px ${color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }} />
    </div>
  );
}

// ── Step progress bar ─────────────────────────────────────────────────
function StepProgressBar({ color, duration }) {
  return (
    <div style={{ height: '2px', background: 'var(--border-subtle)', borderRadius: '99px', overflow: 'hidden', marginTop: '8px' }}>
      <div style={{
        height: '100%', borderRadius: '99px',
        background: `linear-gradient(90deg, ${color}, ${color}aa)`,
        animation: `progressFill ${duration}ms linear forwards`
      }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function GenerationThinkingAnimation({
  prompt = '', stage = '', isSceneStage = false, isRenderingVideo = false
}) {
  const [elapsed, setElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const startRef = useRef(Date.now());

  const steps = isRenderingVideo ? STAGE3 : isSceneStage ? STAGE2 : STAGE1;
  const stepDuration = isRenderingVideo ? 22000 : 4000;

  const title = isRenderingVideo
    ? 'Video Rendering Pipeline'
    : isSceneStage
    ? 'Screenplay Engine — 5 Scene Generation'
    : 'Autonomous AI Video Pipeline';

  const subtitle = isRenderingVideo
    ? '5 parallel scene renders + ElevenLabs voice + final MP4 assembly'
    : isSceneStage
    ? 'Writing production-grade scene prompts, VO & quality audit'
    : 'Claude 4.6 + n8n Cloud generating your viral short';

  const accentColor = isRenderingVideo ? '#ec4899' : isSceneStage ? '#8b5cf6' : '#6366f1';
  const gradColors = isRenderingVideo
    ? '#ec4899, #8b5cf6, #38bdf8, #10b981'
    : isSceneStage
    ? '#8b5cf6, #6366f1, #38bdf8, #ec4899'
    : '#6366f1, #38bdf8, #10b981, #8b5cf6';

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    setActiveStep(0);
    const timer = setInterval(() => setElapsed(+((Date.now() - startRef.current) / 1000).toFixed(1)), 100);
    const stepper = setInterval(() => setActiveStep(p => p < steps.length - 1 ? p + 1 : p), stepDuration);
    return () => { clearInterval(timer); clearInterval(stepper); };
  }, [isSceneStage, isRenderingVideo, steps.length, stepDuration]);

  const fmt = (s) => s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, '0')}s`;

  const currentStep = steps[activeStep] || steps[0];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto 28px auto' }}>

      {/* ── MAIN CARD ─────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: '24px', overflow: 'hidden', position: 'relative',
        background: 'var(--bg-card)',
        border: `1.5px solid ${accentColor}44`,
        boxShadow: `0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}22, inset 0 1px 0 rgba(255,255,255,0.06)`
      }}>

        {/* Animated rainbow top beam */}
        <div style={{
          height: '3px', width: '100%',
          background: `linear-gradient(90deg, ${gradColors}, ${gradColors.split(',')[0]})`,
          backgroundSize: '300% 100%',
          animation: 'gradientShift 4s ease infinite'
        }} />

        {/* Scanning beam overlay */}
        <div style={{ position: 'absolute', top: '3px', left: 0, right: 0, height: '120px', overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: 0, width: '120px', height: '100%',
            background: `linear-gradient(90deg, transparent, ${accentColor}15, transparent)`,
            animation: 'beamScan 3s ease-in-out infinite'
          }} />
        </div>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{ padding: '28px 28px 20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>

              {/* Animated orb icon */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <PulseOrb color={accentColor} size={52} />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  {isRenderingVideo
                    ? <Video size={22} color={accentColor} />
                    : isSceneStage
                    ? <Film size={22} color={accentColor} />
                    : <Sparkles size={22} color={accentColor} />}
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '17px',
                    color: 'var(--text-primary)', letterSpacing: '-0.02em'
                  }}>{title}</span>
                  {/* Live badge */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: `${accentColor}20`, border: `1px solid ${accentColor}55`,
                    color: accentColor, fontSize: '10px', fontWeight: 800,
                    padding: '3px 9px', borderRadius: '99px', letterSpacing: '0.06em',
                    textTransform: 'uppercase', flexShrink: 0
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: accentColor, boxShadow: `0 0 6px ${accentColor}`, animation: 'pulseRing 1.2s ease-out infinite' }} />
                    {isRenderingVideo ? 'Rendering' : 'Live n8n'}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {subtitle}
                </div>
              </div>
            </div>

            {/* Timer */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
              background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
              borderRadius: '99px', padding: '6px 14px'
            }}>
              <Clock size={13} color="var(--text-muted)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                {fmt(elapsed)}
              </span>
            </div>
          </div>

          {/* Active project pill */}
          <div style={{
            marginTop: '18px', padding: '10px 16px',
            background: 'var(--bg-input)', borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                ▸ PROJECT
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                "{prompt || 'Generating viral story...'}"
              </span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
              background: `${accentColor}18`, border: `1px solid ${accentColor}44`,
              borderRadius: '99px', padding: '3px 10px'
            }}>
              <Zap size={10} color={accentColor} />
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: accentColor }}>
                {isRenderingVideo ? '75s • 1080p Render' : '75s • 5 Acts'}
              </span>
            </div>
          </div>
        </div>

        {/* ── STEP PIPELINE ──────────────────────────────────────────── */}
        <div style={{ padding: '0 28px 28px 28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {steps.map((step, idx) => {
            const isDone    = idx < activeStep;
            const isCurrent = idx === activeStep;
            const isPending = idx > activeStep;
            const Icon = step.icon;

            return (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: isCurrent ? '14px 16px' : '12px 16px',
                borderRadius: '16px', position: 'relative', overflow: 'hidden',
                background: isCurrent
                  ? `linear-gradient(135deg, ${step.color}14, ${step.color}08)`
                  : isDone
                  ? 'rgba(16,185,129,0.04)'
                  : 'transparent',
                border: `1.5px solid ${
                  isCurrent ? `${step.color}55`
                  : isDone ? 'rgba(16,185,129,0.2)'
                  : 'var(--border-subtle)'}`,
                boxShadow: isCurrent ? `0 4px 24px ${step.glow}` : 'none',
                opacity: isPending ? 0.35 : 1,
                transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                animation: isCurrent ? 'stepIn 0.4s ease' : 'none'
              }}>

                {/* Active step inner scan */}
                {isCurrent && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '16px', overflow: 'hidden', pointerEvents: 'none'
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, width: '60%', height: '100%',
                      background: `linear-gradient(90deg, transparent, ${step.color}0a, transparent)`,
                      animation: 'beamScan 2.5s ease-in-out infinite'
                    }} />
                  </div>
                )}

                {/* Step icon */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDone
                    ? 'rgba(16,185,129,0.15)'
                    : isCurrent
                    ? `${step.color}22`
                    : 'var(--bg-input)',
                  border: `1px solid ${isDone ? 'rgba(16,185,129,0.4)' : isCurrent ? `${step.color}55` : 'var(--border-subtle)'}`,
                  boxShadow: isCurrent ? `0 0 12px ${step.glow}` : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {isDone
                    ? <Check size={17} color="#10b981" strokeWidth={2.5} />
                    : <Icon size={17} color={isCurrent ? step.color : 'var(--text-muted)'} />}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px', fontWeight: isCurrent ? 700 : isDone ? 600 : 500,
                    color: isCurrent ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {step.label}
                  </div>
                  {isCurrent ? (
                    <LogTicker lines={step.logLines} color={step.color} />
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {step.sub}
                    </div>
                  )}
                  {isCurrent && <StepProgressBar color={step.color} duration={stepDuration} />}
                </div>

                {/* Status badge */}
                <div style={{ flexShrink: 0, textAlign: 'right', minWidth: '80px' }}>
                  {isDone && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '11px', fontWeight: 700, color: '#10b981',
                      background: 'rgba(16,185,129,0.12)',
                      padding: '3px 9px', borderRadius: '99px',
                      border: '1px solid rgba(16,185,129,0.3)'
                    }}>
                      <Check size={11} strokeWidth={3} /> Done
                    </span>
                  )}
                  {isCurrent && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      fontSize: '11px', fontWeight: 700, color: step.color,
                      background: `${step.color}15`,
                      padding: '3px 9px', borderRadius: '99px',
                      border: `1px solid ${step.color}44`
                    }}>
                      <Loader2 size={11} className="spin-animation" /> Running
                    </span>
                  )}
                  {isPending && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                      Queued
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── FOOTER STATS BAR ─────────────────────────────────────── */}
        <div style={{
          padding: '14px 28px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.15)', gap: '12px', flexWrap: 'wrap'
        }}>
          {[
            { label: 'Pipeline', value: 'n8n Cloud' },
            { label: 'Model', value: 'Claude 4.6' },
            { label: 'Step', value: `${Math.min(activeStep + 1, steps.length)} / ${steps.length}` },
            { label: 'Status', value: 'Executing', live: true },
          ].map(({ label, value, live }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '70px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </span>
              <span style={{
                fontSize: '12px', fontWeight: 700,
                color: live ? '#10b981' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                {live && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', display: 'inline-block' }} />}
                {value}
              </span>
            </div>
          ))}

          {/* Overall progress bar */}
          <div style={{ flex: 1, minWidth: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progress</span>
              <span style={{ fontSize: '10px', color: accentColor, fontWeight: 700 }}>
                {Math.round(((activeStep + 0.5) / steps.length) * 100)}%
              </span>
            </div>
            <div style={{ height: '4px', background: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '99px', transition: 'width 0.5s ease',
                width: `${Math.round(((activeStep + 0.5) / steps.length) * 100)}%`,
                background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
