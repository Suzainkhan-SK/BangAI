import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Brain, 
  Film, 
  CheckCircle2, 
  Loader2, 
  Zap, 
  Clock, 
  Radio, 
  Flame, 
  Check, 
  Activity,
  Layers,
  Cpu,
  ShieldCheck,
  Video,
  Volume2,
  Share2
} from 'lucide-react';

export default function GenerationThinkingAnimation({ 
  prompt = '', 
  stage = '', 
  isSceneStage = false,
  isRenderingVideo = false 
}) {
  const [elapsed, setElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const stage1Steps = [
    { title: 'Connecting with n8n Autonomous Cloud Pipeline', desc: 'Dispatched webhook payload to u8vcVLc00wPp2AAI', icon: Cpu, color: '#818cf8' },
    { title: 'Gemini 2.5 Flash: Topic & Category Analysis', desc: 'Classifying themes and analyzing audience retention potential', icon: Brain, color: '#38bdf8' },
    { title: 'Strategy Engine: 5-Beat Narrative Arc & Viral Hook', desc: 'Crafting 3-second scroll-stopping opening hook and story brief', icon: Sparkles, color: '#f59e0b' },
    { title: 'Awaiting Story Review from Creator', desc: 'Synchronizing story payload for 1-tap review', icon: CheckCircle2, color: '#10b981' }
  ];

  const stage2Steps = [
    { title: 'Screenplay Production Engine', desc: 'Writing 5 scenes with strict 15s pacing and camera angles', icon: Film, color: '#818cf8' },
    { title: '7-Checkpoint Quality Critic Audit', desc: 'Auditing dialogue cadence, visual consistency and policies', icon: ShieldCheck, color: '#ec4899' },
    { title: 'Split Scenes Decomposition', desc: 'Formatting 5 production prompts and voiceovers', icon: Layers, color: '#38bdf8' },
    { title: 'Awaiting Final 5 Scenes Approval', desc: 'Ready for creator final review before video rendering', icon: CheckCircle2, color: '#10b981' }
  ];

  const stage3RenderingSteps = [
    { title: 'Stage 4A: Grok Imagine / Wan 2.1 Video Core Dispatch', desc: 'Decomposing 5 visual prompts with dynamic camera motion parameters', icon: Video, color: '#6366f1' },
    { title: 'Stage 4B: Parallel 4K 9:16 Visual Scene Rendering', desc: 'Generating 5 high-bitrate vertical video clips with cinematic lighting', icon: Film, color: '#38bdf8' },
    { title: 'Stage 4C: ElevenLabs Voice Synthesis & Audio Ducking', desc: 'Generating studio narration with -18dB dynamic background music mixing', icon: Volume2, color: '#ec4899' },
    { title: 'Stage 5A: Final 4K MP4 Assembly & Motion Typography', desc: 'Concatenating 5 scenes, animated captions & master export', icon: Layers, color: '#f59e0b' },
    { title: 'Stage 5B: Packaging Ready for Creator & YouTube Distribution', desc: 'Finalizing production deliverables and syncing with studio canvas', icon: CheckCircle2, color: '#10b981' }
  ];

  const steps = isRenderingVideo 
    ? stage3RenderingSteps 
    : (isSceneStage ? stage2Steps : stage1Steps);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsed(+((Date.now() - startTime) / 1000).toFixed(1));
    }, 100);

    // Realistic time intervals per stage (rendering takes longer)
    const stepDuration = isRenderingVideo ? 18000 : 3500;

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, stepDuration);

    return () => {
      clearInterval(timer);
      clearInterval(stepInterval);
    };
  }, [isSceneStage, isRenderingVideo, steps.length]);

  const formatElapsed = (sec) => {
    if (sec < 60) return `${sec.toFixed(1)}s`;
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(0).padStart(2, '0');
    return `${m}m ${s}s`;
  };

  return (
    <div style={{
      maxWidth: '820px',
      margin: '0 auto 28px auto',
      position: 'relative'
    }}>
      {/* Studio Glassmorphism Card */}
      <div className="saas-card" style={{
        padding: '32px 28px',
        borderRadius: '24px',
        border: '1.5px solid var(--border-glow)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-prompt)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Neon Light Top Gradient Beam */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: isRenderingVideo 
            ? 'linear-gradient(90deg, #ec4899, #8b5cf6, #38bdf8, #10b981, #ec4899)'
            : 'linear-gradient(90deg, #6366f1, #38bdf8, #ec4899, #10b981, #6366f1)',
          backgroundSize: '200% 100%',
          animation: 'spin 6s linear infinite'
        }} />

        {/* Header: Title + Live Status + Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: isRenderingVideo ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'var(--grad-gemini)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isRenderingVideo ? '0 0 24px rgba(236, 72, 153, 0.5)' : '0 0 20px rgba(56, 189, 248, 0.5)',
              flexShrink: 0
            }}>
              {isRenderingVideo ? (
                <Video size={22} color="#ffffff" className="spin-animation" />
              ) : (
                <Sparkles size={22} color="#ffffff" className="spin-animation" />
              )}
            </div>

            <div>
              <div className="font-display" style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>
                  {isRenderingVideo 
                    ? 'n8n 4K Video Rendering Engine Executing' 
                    : isSceneStage 
                    ? 'n8n Screenplay Engine Writing 5 Scenes' 
                    : 'n8n Autonomous Video Pipeline Executing'}
                </span>
                <span className={`badge ${isRenderingVideo ? 'badge-cyan' : 'badge-brand'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                  <Radio size={10} className="spin-animation" /> {isRenderingVideo ? 'RENDERING 4K' : 'LIVE N8N'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                {isRenderingVideo 
                  ? 'Rendering 5 parallel 15s scenes, ElevenLabs voiceover & final MP4 concatenation' 
                  : isSceneStage 
                  ? 'Drafting 5 individual 15s visual prompts & voiceover lines' 
                  : 'Topic Analyzer & Strategy Engine generating 5-act narrative'}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '99px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0
          }}>
            <Clock size={14} />
            <span>{formatElapsed(elapsed)}</span>
          </div>
        </div>

        {/* Prompt Card */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', flexShrink: 0 }}>
              Active Project:
            </span>
            <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              "{prompt || 'Generating viral story screenplay...'}"
            </span>
          </div>
          <span className={`badge ${isRenderingVideo ? 'badge-brand' : 'badge-cyan'}`} style={{ fontSize: '10.5px', flexShrink: 0 }}>
            {isRenderingVideo ? '75s 4K Render' : '75s • 5 Acts'}
          </span>
        </div>

        {/* Sequential Live Pipeline Step Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {steps.map((st, idx) => {
            const isDone = idx < activeStep;
            const isCurrent = idx === activeStep;
            const isPending = idx > activeStep;
            const Icon = st.icon;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: isCurrent ? 'var(--bg-input)' : isDone ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                  border: `1px solid ${isCurrent ? st.color : isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                  opacity: isPending ? 0.4 : 1,
                  boxShadow: isCurrent ? `0 0 16px ${st.color}25` : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDone ? '#10b981' : isCurrent ? st.color : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {isDone ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
                  </div>

                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {st.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {st.desc}
                    </div>
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  {isDone && (
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} strokeWidth={3} /> Complete
                    </span>
                  )}
                  {isCurrent && (
                    <span style={{ fontSize: '11px', fontWeight: 800, color: st.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Loader2 size={12} className="spin-animation" /> Rendering...
                    </span>
                  )}
                  {isPending && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Queued
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
