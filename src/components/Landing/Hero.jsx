import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  Pause,
  Star, 
  Volume2, 
  Flame, 
  Zap, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck,
  Radio,
  Layers,
  Cpu
} from 'lucide-react';
import { PRESETS } from '../../data/presets';
import { audioEngine } from '../../audio/audioEngine';
import { useBreakpoint } from '../../hooks/useMediaQuery';

export default function Hero({ onStartCreation, onOpenDemoPreset }) {
  const { isMobile, isTablet } = useBreakpoint();
  const [activeTab, setActiveTab] = useState('bermuda');
  const [heroPrompt, setHeroPrompt] = useState(PRESETS.bermuda.rawUserInput);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentPreset = PRESETS[activeTab] || PRESETS.bermuda;

  const handleTabChange = (presetId) => {
    audioEngine.playSfx('click');
    setActiveTab(presetId);
    setHeroPrompt(PRESETS[presetId].rawUserInput);
    setIsPlayingAudio(false);
  };

  const handleToggleVoicePreview = () => {
    audioEngine.playSfx('click');
    if (isPlayingAudio) {
      audioEngine.stopVoice();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      audioEngine.playVoice(currentPreset.voiceId, currentPreset.scenes[0].voiceoverText);
      setTimeout(() => setIsPlayingAudio(false), 5500);
    }
  };

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    audioEngine.playSfx('boom');
    onStartCreation(heroPrompt);
  };

  return (
    <section style={{
      position: 'relative',
      paddingTop: isMobile ? '32px' : '60px',
      paddingBottom: isMobile ? '44px' : '70px',
      overflow: 'hidden'
    }}>
      {/* Ambient Neural Glow Mesh */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1000px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.12) 40%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Top Grok AI Badge */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="glow-pill animate-float" style={{ border: '1px solid var(--border-grok)' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 10px #38bdf8',
              display: 'inline-block'
            }} />
            <span className="font-grok" style={{ fontSize: isMobile ? '11px' : '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Bang AI Engine • Wan 2.1 Video + ElevenLabs Turbo v2.5
            </span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ textAlign: 'center', maxWidth: '880px', margin: isMobile ? '0 auto 26px auto' : '0 auto 36px auto' }}>
          <h1 className="font-display" style={{
            fontSize: 'clamp(30px, 7.2vw, 54px)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.035em',
            marginBottom: '16px',
            color: 'var(--text-primary)'
          }}>
            Turn Any Story Idea into a Viral {isMobile ? ' ' : <br />}
            <span style={{
              background: 'var(--grad-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>75-Second YouTube Short</span> with AI.
          </h1>

          <p style={{
            fontSize: isMobile ? '14.5px' : '17px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto'
          }}>
            Autonomous 5-act cinematic screenwriting, ElevenLabs voice narration,
            adaptive background score, and 1-click YouTube publishing in under 75 seconds.
          </p>
        </div>

        {/* Interactive Dual-Panel Hero Canvas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(min(${isMobile ? 260 : 320}px, 100%), 1fr))`,
          gap: isMobile ? '20px' : '32px',
          alignItems: 'center',
          maxWidth: '1100px',
          margin: isMobile ? '0 auto 32px auto' : '0 auto 48px auto'
        }}>
          {/* Left Side: Interactive Prompt Studio Sandbox */}
          <div className="saas-card" style={{
            paddingTop: isMobile ? '18px' : '28px',
            paddingBottom: isMobile ? '18px' : '28px',
            paddingLeft: isMobile ? '16px' : '28px',
            paddingRight: isMobile ? '16px' : '28px',
            border: '1.5px solid var(--border-glow)'
          }}>
            {/* Genre Category Pills */}
            <div className="rail" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Preset:
              </span>
              {[
                { id: 'bermuda', icon: '🌊', label: 'Bermuda Mystery' },
                { id: 'dragons', icon: '🐉', label: 'Dragons CGI' },
                { id: 'fruits', icon: '🍍', label: 'Talking Pineapple' },
                { id: 'tatasteve', icon: '💔', label: 'Ratan Tata' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    background: activeTab === tab.id ? 'var(--grad-primary)' : 'var(--bg-input)',
                    color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                    border: `1px solid ${activeTab === tab.id ? 'transparent' : 'var(--border-subtle)'}`,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Prompt Form */}
            <form onSubmit={handleHeroSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Enter your topic, mystery, or story idea:
                </label>
                <textarea
                  value={heroPrompt}
                  onChange={(e) => setHeroPrompt(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '13.5px',
                    color: 'var(--text-primary)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    lineHeight: 1.5,
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Engine Specs Badges */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '20px',
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ background: 'var(--bg-input)', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  🎙️ <strong>Voice:</strong> {currentPreset.voiceId.toUpperCase()}
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  🎨 <strong>Style:</strong> {currentPreset.visualStyleId}
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  🎵 <strong>BGM:</strong> {currentPreset.musicId}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="btn-glow"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px' }}
              >
                <Zap size={18} fill="#ffffff" />
                <span>⚡ Generate Full 75s Short (1-Click)</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>

          {/* Right Side: Interactive 3D 9:16 Video Player Mockup */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {/* Floating Metric Badge 1 */}
            <div className="saas-card" style={{
              position: 'absolute',
              top: '16px',
              left: isMobile ? '0px' : '-16px',
              zIndex: 30,
              padding: '8px 12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-glow)',
              background: 'var(--bg-card)'
            }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={16} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }}>1.4M+ Views</div>
                <div style={{ fontSize: '9.5px', color: '#10b981' }}>98% Audience Retention</div>
              </div>
            </div>

            {/* Floating Metric Badge 2 */}
            <div className="saas-card" style={{
              position: 'absolute',
              bottom: '36px',
              right: isMobile ? '0px' : '-16px',
              zIndex: 30,
              padding: '8px 12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-grok)',
              background: 'var(--bg-card)'
            }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} color="#06b6d4" />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }}>Critic Score: 98/100</div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>7 Checkpoints Verified</div>
              </div>
            </div>

            {/* 9:16 Vertical Video Frame */}
            <div className="saas-card" style={{
              width: isMobile ? 'min(290px, 82vw)' : '290px',
              height: isMobile ? 'min(460px, 130vw)' : '460px',
              borderRadius: '32px',
              padding: '14px',
              background: '#040711',
              border: '3px solid #1e293b',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(99, 102, 241, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              {/* Top Bar inside Video */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <span className="badge badge-emerald" style={{ fontSize: '9.5px', padding: '2px 7px' }}>
                  ● 75s (5 Scenes)
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                  Grok Imagine 1.5
                </span>
              </div>

              {/* Dynamic Subtitle Animated Pop Box */}
              <div style={{
                zIndex: 10,
                background: 'rgba(0, 0, 0, 0.88)',
                padding: '14px 12px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center',
                boxShadow: '0 8px 30px rgba(0,0,0,0.9)',
                backdropFilter: 'blur(10px)',
                margin: 'auto 4px'
              }}>
                <div style={{ fontSize: '9.5px', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '4px' }}>
                  🎬 Scene 1: {currentPreset.scenes[0].act}
                </div>
                <p style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 800,
                  fontSize: '13px',
                  lineHeight: 1.4,
                  color: '#ffffff'
                }}>
                  "{currentPreset.scenes[0].voiceoverText.substring(0, 100)}..."
                </p>

                {/* Animated Waveforms when playing */}
                {isPlayingAudio && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px', marginTop: '8px' }}>
                    <div style={{ width: '3px', height: '14px', background: '#38bdf8', borderRadius: '2px', animation: 'float 0.8s ease-in-out infinite' }} />
                    <div style={{ width: '3px', height: '22px', background: '#818cf8', borderRadius: '2px', animation: 'float 0.5s ease-in-out infinite' }} />
                    <div style={{ width: '3px', height: '16px', background: '#c084fc', borderRadius: '2px', animation: 'float 0.9s ease-in-out infinite' }} />
                    <div style={{ width: '3px', height: '10px', background: '#38bdf8', borderRadius: '2px', animation: 'float 0.6s ease-in-out infinite' }} />
                  </div>
                )}
              </div>

              {/* Bottom Video Controls */}
              <div style={{ zIndex: 10 }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff', marginBottom: '6px', lineHeight: 1.3 }}>
                  {currentPreset.title}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleToggleVoicePreview}
                    className="btn-glow"
                    style={{ flex: 1, padding: '7px', fontSize: '11px', justifyContent: 'center' }}
                  >
                    {isPlayingAudio ? <Pause size={12} fill="#ffffff" /> : <Play size={12} fill="#ffffff" />}
                    <span>{isPlayingAudio ? 'Pause Narration' : 'Play Voice Preview'}</span>
                  </button>

                  <button
                    onClick={() => onOpenDemoPreset(activeTab)}
                    className="btn-outline"
                    style={{ padding: '7px 10px', fontSize: '11px' }}
                    title="Open Full Studio"
                  >
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* Bottom Red Progress Line */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ height: '100%', width: '45%', background: '#ef4444' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics Ticker Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(min(${isMobile ? 140 : 200}px, 100%), 1fr))`,
          gap: '16px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: isMobile ? '22px' : '28px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="font-display" style={{ fontSize: 'clamp(20px, 3.6vw, 24px)', fontWeight: 900, color: 'var(--text-primary)' }}>100,000+</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Shorts Autonomously Rendered</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="font-display" style={{ fontSize: 'clamp(20px, 3.6vw, 24px)', fontWeight: 900, color: '#10b981' }}>94.8%</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average Audience Retention</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="font-display" style={{ fontSize: 'clamp(20px, 3.6vw, 24px)', fontWeight: 900, color: 'var(--accent-cyan)' }}>75.0s Strict</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>5-Scene Pacing Engine</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="font-display" style={{ fontSize: 'clamp(20px, 3.6vw, 24px)', fontWeight: 900, color: '#f59e0b' }}>1-Click Publish</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>YouTube Data API v3 Verified</div>
          </div>
        </div>
      </div>
    </section>
  );
}
