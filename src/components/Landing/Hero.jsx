import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  Pause,
  Star, 
  Volume2, 
  VolumeX,
  Flame, 
  Zap, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck,
  Radio,
  Layers,
  Cpu,
  Monitor,
  Smartphone,
  Square,
  Globe2,
  Share2,
  Eye,
  Sliders,
  Check
} from 'lucide-react';
import { PRESETS } from '../../data/presets';
import { audioEngine } from '../../audio/audioEngine';
import { useBreakpoint } from '../../hooks/useMediaQuery';

export default function Hero({ onStartCreation, onOpenDemoPreset }) {
  const { isMobile, isTablet } = useBreakpoint();
  const [activePreset, setActivePreset] = useState('bermuda');
  const [aspectRatio, setAspectRatio] = useState('9:16'); // '9:16' | '16:9' | '1:1'
  const [heroPrompt, setHeroPrompt] = useState(PRESETS.bermuda.rawUserInput);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  const currentPreset = PRESETS[activePreset] || PRESETS.bermuda;
  const scenes = currentPreset.scenes || [];
  const currentScene = scenes[activeSceneIdx] || scenes[0];

  const presetsList = [
    { id: 'bermuda', icon: '🌊', label: 'Bermuda Mystery', category: 'Mystery & Thriller' },
    { id: 'dragons', icon: '🐉', label: 'Dragons CGI', category: 'Mythological VFX' },
    { id: 'fruits', icon: '🍍', label: 'Talking Fruit', category: '3D Pixar Animation' },
    { id: 'tatasteve', icon: '💔', label: 'Ratan Tata', category: 'Cinematic Biography' }
  ];

  const handlePresetSelect = (id) => {
    audioEngine.playSfx('click');
    setActivePreset(id);
    setHeroPrompt(PRESETS[id]?.rawUserInput || '');
    setActiveSceneIdx(0);
    if (isPlayingAudio) {
      audioEngine.stopVoice();
      setIsPlayingAudio(false);
    }
  };

  const handleToggleVoicePreview = () => {
    audioEngine.playSfx('click');
    if (isPlayingAudio) {
      audioEngine.stopVoice();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      const textToPlay = currentScene?.voiceoverText || currentPreset.scenes[0].voiceoverText;
      audioEngine.playVoice(currentPreset.voiceId, textToPlay);
      setTimeout(() => setIsPlayingAudio(false), 5500);
    }
  };

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    audioEngine.playSfx('boom');
    onStartCreation(heroPrompt);
  };

  // Auto-cycle through scene highlights for dynamic life
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSceneIdx(prev => (prev + 1) % (scenes.length || 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [scenes.length, activePreset]);

  return (
    <section style={{
      position: 'relative',
      paddingTop: isMobile ? '36px' : '64px',
      paddingBottom: isMobile ? '50px' : '80px',
      overflow: 'hidden'
    }}>
      {/* Dynamic Cosmic Gradient Mesh */}
      <div style={{
        position: 'absolute',
        top: '-160px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1200px',
        height: '650px',
        background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.22) 0%, rgba(6, 182, 212, 0.14) 35%, rgba(244, 63, 94, 0.08) 60%, transparent 75%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Subtle Grid Accent */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(var(--text-muted) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        opacity: 0.12,
        maskImage: 'radial-gradient(ellipse 60% 50% at 50% 20%, #000 60%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 20%, #000 60%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Top Intelligence Badge */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div className="glow-pill animate-float" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 10px #38bdf8',
              display: 'inline-block'
            }} />
            <span style={{
              fontSize: isMobile ? '11px' : '13px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: 'var(--text-primary)'
            }}>
              Bang AI 3.0 • Autonomous Multi-Platform Video Engine
            </span>
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '6px',
              textTransform: 'uppercase'
            }}>New</span>
          </div>
        </div>

        {/* Hero Headline */}
        <div style={{ textAlign: 'center', maxWidth: '920px', margin: isMobile ? '0 auto 28px auto' : '0 auto 40px auto' }}>
          <h1 className="font-display" style={{
            fontSize: 'clamp(32px, 7vw, 60px)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
            marginBottom: '18px',
            color: 'var(--text-primary)'
          }}>
            Turn Any Story Idea into a Viral {isMobile ? ' ' : <br />}
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>Cinematic AI Video</span> for Every Platform.
          </h1>

          <p style={{
            fontSize: isMobile ? '15px' : '18px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '720px',
            margin: '0 auto',
            fontWeight: 400
          }}>
            Autonomous multi-act screenwriting, hyper-realistic voiceovers in 31+ languages, 
            adaptive cinematic scoring, and 1-click publishing across YouTube, Reels, TikTok & LinkedIn.
          </p>
        </div>

        {/* Dual Command-Center Canvas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isTablet || isMobile ? '1fr' : '1.15fr 0.95fr',
          gap: isMobile ? '24px' : '36px',
          alignItems: 'center',
          maxWidth: '1180px',
          margin: isMobile ? '0 auto 36px auto' : '0 auto 52px auto'
        }}>
          {/* Left Panel: Intelligent Prompt & Studio Control Deck */}
          <div className="saas-card" style={{
            padding: isMobile ? '20px 16px' : '32px 30px',
            border: '1.5px solid var(--border-glow)',
            boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.12)',
            position: 'relative'
          }}>
            {/* Aspect Ratio & Format Switcher Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={15} color="#818cf8" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Format:
                </span>
              </div>

              {/* Aspect Ratio Toggle Pills */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-input)',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)'
              }}>
                {[
                  { id: '9:16', label: isMobile ? '9:16' : '9:16 Vertical', icon: <Smartphone size={13} />, note: 'Reels / Shorts / TikTok' },
                  { id: '16:9', label: isMobile ? '16:9' : '16:9 Cinema', icon: <Monitor size={13} />, note: 'YouTube / TV / Web' },
                  { id: '1:1', label: isMobile ? '1:1' : '1:1 Square', icon: <Square size={13} />, note: 'Feed & Ads' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      audioEngine.playSfx('click');
                      setAspectRatio(fmt.id);
                    }}
                    style={{
                      background: aspectRatio === fmt.id ? 'var(--grad-primary)' : 'transparent',
                      color: aspectRatio === fmt.id ? '#ffffff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '7px',
                      padding: '5px 10px',
                      fontSize: '11.5px',
                      fontWeight: aspectRatio === fmt.id ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                    title={fmt.note}
                  >
                    {fmt.icon}
                    <span>{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Preset Selector Rail */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Select a Proven Template or Write Your Own:
                </label>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                  Instant 1-Click
                </span>
              </div>

              <div className="rail" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {presetsList.map((preset) => {
                  const isSelected = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset.id)}
                      style={{
                        background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-input)',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        border: `1px solid ${isSelected ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                        borderRadius: '10px',
                        padding: '7px 12px',
                        fontSize: '12px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        flexShrink: 0
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{preset.icon}</span>
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Form Input Area */}
            <form onSubmit={handleHeroSubmit}>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <textarea
                  value={heroPrompt}
                  onChange={(e) => setHeroPrompt(e.target.value)}
                  rows={3}
                  placeholder="Describe your story idea, topic, or video concept..."
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1.5px solid var(--border-medium)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    resize: 'none',
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#818cf8';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-medium)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Dynamic Engine Pipeline Blueprint HUD */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Voice Actor</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    🎙️ {currentPreset.voiceId.toUpperCase()}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Visual Style</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    🎨 {currentPreset.visualStyleId}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Soundtrack</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    🎵 -18dB Ducking
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Quality Check</div>
                  <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <CheckCircle2 size={13} /> 7 Checks Pass
                  </div>
                </div>
              </div>

              {/* Primary Call to Action Button */}
              <button
                type="submit"
                className="btn-glow"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '14px 24px',
                  fontSize: '15.5px',
                  fontWeight: 700,
                  borderRadius: '12px'
                }}
              >
                <Zap size={18} fill="#ffffff" />
                <span>Create Video with AI Engine</span>
                <ArrowRight size={18} />
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                marginTop: '12px',
                fontSize: '12px',
                color: 'var(--text-muted)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} color="#10b981" /> No Credit Card Required
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} color="#10b981" /> Free Instant Generation
                </span>
              </div>
            </form>
          </div>

          {/* Right Panel: Interactive Adaptive Video Player Canvas */}
          <div style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Floating Live Metric: Engine Architecture */}
            <div className="saas-card animate-float" style={{
              position: 'absolute',
              top: '-12px',
              left: isMobile ? '8px' : '-20px',
              zIndex: 30,
              padding: '8px 14px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: 'var(--shadow-glow)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)'
            }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255, 79, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} color="var(--accent-primary)" />
              </div>
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)' }}>Multi-Act Screenplay</div>
                <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>Ultra HD 1080p Engine</div>
              </div>
            </div>

            {/* Floating Live Metric: Multi-Platform Sync */}
            <div className="saas-card" style={{
              position: 'absolute',
              bottom: isMobile ? '-14px' : '-18px',
              right: isMobile ? '8px' : '-16px',
              zIndex: 30,
              padding: '8px 14px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)'
            }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Share2 size={18} color="#06b6d4" />
              </div>
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)' }}>Omnichannel Syndication</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Shorts • Reels • TikTok • LinkedIn</div>
              </div>
            </div>

            {/* Dynamic Aspect Ratio Responsive Player Frame */}
            <div style={{
              width: aspectRatio === '9:16' 
                ? (isMobile ? 'min(280px, 80vw)' : '300px')
                : aspectRatio === '16:9'
                  ? (isMobile ? '100%' : '440px')
                  : (isMobile ? 'min(280px, 80vw)' : '320px'),
              height: aspectRatio === '9:16'
                ? (isMobile ? 'min(470px, 134vw)' : '490px')
                : aspectRatio === '16:9'
                  ? (isMobile ? '240px' : '260px')
                  : (isMobile ? 'min(280px, 80vw)' : '320px'),
              borderRadius: '26px',
              padding: '16px',
              background: currentPreset.gradient || 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 70%, #020617 100%)',
              border: '2px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 45px rgba(99, 102, 241, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              {/* Scene Backdrop Ambient Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.6) 100%)',
                pointerEvents: 'none',
                zIndex: 1
              }} />

              {/* Player Top HUD */}
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    background: 'rgba(239, 68, 68, 0.85)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '5px',
                    letterSpacing: '0.04em'
                  }}>
                    LIVE
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
                    Scene {activeSceneIdx + 1} of {scenes.length || 5}
                  </span>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  color: '#38bdf8',
                  fontWeight: 700,
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  {aspectRatio} • 1080p
                </div>
              </div>

              {/* Player Center: Animated Visual Scene Cue & Dynamic Voiceover */}
              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '10px 4px' }}>
                <div style={{
                  fontSize: '32px',
                  marginBottom: '10px',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))'
                }}>
                  {currentPreset.scenes?.[activeSceneIdx]?.visualIcon || '🎬'}
                </div>

                {/* Kinetic Subtitles Simulation */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(10px)',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
                }}>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.45,
                    margin: 0
                  }}>
                    "{currentScene?.voiceoverText || currentPreset.scenes[0].voiceoverText}"
                  </p>
                </div>

                {/* Interactive Voice Audition Button */}
                <button
                  type="button"
                  onClick={handleToggleVoicePreview}
                  style={{
                    marginTop: '12px',
                    background: isPlayingAudio ? '#ef4444' : 'rgba(255, 255, 255, 0.18)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isPlayingAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isPlayingAudio ? 'Stop Audio Preview' : 'Listen to Voice Narration'}</span>
                  {isPlayingAudio && (
                    <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
                      <span className="animate-pulse" style={{ width: '3px', height: '10px', background: '#fff', borderRadius: '1px' }} />
                      <span className="animate-pulse" style={{ width: '3px', height: '14px', background: '#fff', borderRadius: '1px', animationDelay: '0.15s' }} />
                      <span className="animate-pulse" style={{ width: '3px', height: '8px', background: '#fff', borderRadius: '1px', animationDelay: '0.3s' }} />
                    </span>
                  )}
                </button>
              </div>

              {/* Player Bottom HUD: Progress Bar & Platform Badges */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                {/* Scene Progress Dots */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                  {scenes.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveSceneIdx(i)}
                      style={{
                        flex: 1,
                        height: '3px',
                        borderRadius: '2px',
                        background: i === activeSceneIdx ? '#38bdf8' : 'rgba(255, 255, 255, 0.25)',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                      {currentPreset.title}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.15)',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    Ready to Export
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Social Proof & Brand Ecosystem Bar */}
        <div style={{
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 700,
            color: 'var(--text-muted)',
            marginBottom: '16px'
          }}>
            Cross-Platform Export & Publishing Built for Modern Creators
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: isMobile ? '14px 20px' : '28px 36px',
            opacity: 0.85
          }}>
            {[
              { name: 'YouTube', type: 'Shorts & Longform', color: '#ef4444' },
              { name: 'Instagram', type: 'Reels & Stories', color: '#ec4899' },
              { name: 'TikTok', type: 'Viral Sounds & Trends', color: '#06b6d4' },
              { name: 'LinkedIn', type: 'Thought Leadership', color: '#3b82f6' },
              { name: 'X / Twitter', type: 'Video Threads', color: '#a855f7' },
              { name: 'Ad Networks', type: 'Performance Creatives', color: '#f59e0b' }
            ].map((platform, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: isMobile ? '12px' : '13px',
                fontWeight: 700,
                color: 'var(--text-secondary)'
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: platform.color,
                  boxShadow: `0 0 8px ${platform.color}`
                }} />
                <span>{platform.name}</span>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  ({platform.type})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
