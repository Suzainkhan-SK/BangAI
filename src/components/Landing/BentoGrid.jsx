import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  Mic2, 
  Music, 
  CheckCircle2, 
  Smartphone, 
  Monitor, 
  Square, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Type,
  Cpu,
  Film,
  Image as ImageIcon,
  Key,
  Flame,
  Clock,
  ExternalLink,
  Clapperboard,
  Video
} from 'lucide-react';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { audioEngine } from '../../audio/audioEngine';

export default function BentoGrid() {
  const { isMobile, isTablet } = useBreakpoint();
  const [activeAct, setActiveAct] = useState(1);
  const [activeTemplate, setActiveTemplate] = useState('mysteries');
  const [activeAspect, setActiveAspect] = useState('9:16');
  const [activeLang, setActiveLang] = useState('hi');

  const actDetails = {
    1: {
      name: 'Act 1: Curiosity Hook (0.0s – 15.0s)',
      pacing: '18 Words • High Hook Velocity',
      dialogue: 'पाँच दिसंबर उन्नीस सौ पैंतालीस, पाँच अमेरिकी बॉम्बर विमान समुद्र के ऊपर उड़ते हैं और अचानक कम्पास पागल हो जाते हैं...',
      videoPrompt: 'Cinematic wide aerial drone orbit: Five vintage 1940s TBM Avenger warplanes flying over dark turbulent ocean. Mysterious emerald bioluminescent fog rising from water, dramatic cinematic lighting, 4K photorealistic, 9:16 vertical.',
      camera: 'Aerial Drone Orbit through Storm Clouds',
      sfx: 'Radio Static & Alarm Sound'
    },
    2: {
      name: 'Act 2: The Anomaly Setup (15.0s – 30.0s)',
      pacing: 'Tense Dialogue • Atmospheric Build',
      dialogue: 'फ्लोरिडा के तट से कुछ ही दूर, समुद्र का रंग एकदम बदल गया और रडार पर पूरा फ्लोरिडा अचानक गायब होकर सिर्फ सन्नाटा छोड़ गया...',
      videoPrompt: 'Interior cockpit macro shot: Tense WWII naval aviator in flight helmet staring in shock at spinning gyro compass. Gauges trembling uncontrollably, golden instrument lights reflecting in pilot eyes, 4K realism.',
      camera: 'Cockpit Interior Macro Push-In',
      sfx: 'Ticking Compass Whir'
    },
    3: {
      name: 'Act 3: The Climax Reveal (45.0s – 60.0s)',
      pacing: 'Peak Emotional Tension • Dramatic Peak',
      dialogue: 'चौबीस मिनट के अंदर वो विशाल रेस्क्यू प्लेन भी आसमान में बिना कोई मलबा छोड़े रहस्यमयी तरीके से हमेशा के लिए खो गया...',
      videoPrompt: 'Epic cinematic visual: Massive Martin Mariner rescue seaplane engulfed in a blinding electrical atmospheric vortex over dark ocean. Lightning arcs across airplane wings, water whirlpool below, 4K cinematic.',
      camera: 'Dynamic Spiral Dive towards Abyss',
      sfx: 'Cinematic Impact Boom'
    }
  };

  const templatesList = [
    {
      id: 'mysteries',
      icon: '🛸',
      name: 'World Mysteries & Paranormal',
      badge: 'PRO TEMPLATE',
      desc: 'Self-researches unexplained historical mysteries, scripts 5 cinematic scenes, and renders photorealistic AI video.',
      specs: '75s+ · 5 Scenes · 1080p Ultra HD'
    },
    {
      id: 'history',
      icon: '⏳',
      name: 'Last 24 Hours [True Stories]',
      badge: 'PRO TEMPLATE',
      desc: 'Counts down the poignant and dramatic final 24 hours of legendary figures with empathetic narration.',
      specs: '75s+ · 5 Scenes · 1080p Ultra HD'
    },
    {
      id: 'horror',
      icon: '👻',
      name: '3-AM Horror & Paranormal',
      badge: 'PRO TEMPLATE',
      desc: 'Psychological tension, terrifying encounters, and dark ambient soundscapes engineered for viral retention.',
      specs: '75s+ · 5 Scenes · 1080p Ultra HD'
    },
    {
      id: 'ancient',
      icon: '🏛️',
      name: 'Ancient Civilizations & Lore',
      badge: 'UPCOMING',
      desc: 'Explores forgotten dynasties, ancient monoliths, and lost technological wonders with epic CGI.',
      specs: '75s+ · 5 Scenes · 1080p Ultra HD'
    }
  ];

  const languages = [
    { code: 'hi', label: 'Hindi (Native)' },
    { code: 'en', label: 'English (Global)' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'ja', label: 'Japanese' }
  ];

  const currentAct = actDetails[activeAct] || actDetails[1];

  return (
    <section id="features" style={{
      paddingTop: isMobile ? '56px' : '90px',
      paddingBottom: isMobile ? '56px' : '90px',
      background: 'var(--bg-app)',
      position: 'relative'
    }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: isMobile ? '0 auto 36px auto' : '0 auto 52px auto' }}>
          <div className="glow-pill" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(255, 79, 0, 0.08)',
            border: '1px solid rgba(255, 79, 0, 0.25)',
            marginBottom: '16px'
          }}>
            <Sparkles size={14} color="var(--accent-primary)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Generative AI Video & Autonomous Templates
            </span>
          </div>

          <h2 className="font-display" style={{
            fontSize: 'clamp(28px, 5.5vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
            color: 'var(--text-primary)'
          }}>
            Engineered for <span className="grad-text">Generative AI Video Excellence</span>
          </h2>

          <p style={{
            fontSize: isMobile ? '15px' : '17px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Combine autonomous 5-act AI screenwriting and photorealistic video generation with 
            cloud stock automation, neural voiceovers, and 1-click YouTube publishing.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          
          {/* Card 1: Autonomous Generative AI Video Engine (8 cols) */}
          <div className="bento-card bento-col-8">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 79, 0, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Clapperboard size={22} color="var(--accent-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Generative AI Video Engine & 5-Act Screenwriter
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Multi-LLM Narrative Brain • Photorealistic Diffusion Video Prompts
                  </div>
                </div>
              </div>
              <span className="badge badge-brand" style={{ fontSize: '11px', padding: '3px 8px' }}>
                AI Generated
              </span>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Orchestrated via Claude Haiku 4.5 and Gemini, BangAI autonomously writes original 5-act screenplays and 
              generates precise cinematic diffusion prompts with dynamic camera motions, lighting setups, and visual atmosphere.
            </p>

            {/* Interactive Act Switcher Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {[1, 2, 3].map((actNum) => (
                <button
                  key={actNum}
                  type="button"
                  onClick={() => {
                    audioEngine.playSfx('click');
                    setActiveAct(actNum);
                  }}
                  style={{
                    background: activeAct === actNum ? 'var(--accent-primary)' : 'var(--bg-input)',
                    color: activeAct === actNum ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '11.5px',
                    fontWeight: activeAct === actNum ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Act {actNum}: {actNum === 1 ? 'Curiosity Hook' : actNum === 2 ? 'Anomaly Setup' : 'Climax Reveal'}
                </button>
              ))}
            </div>

            {/* Act Visual Simulation Card */}
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {currentAct.name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {currentAct.pacing}
                </span>
              </div>

              {/* Spoken Narration Script */}
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                  Voiceover Dialogue:
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{currentAct.dialogue}"
                </div>
              </div>

              {/* Generative AI Video Prompt */}
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                  Generated AI Video Scene Prompt:
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {currentAct.videoPrompt}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span style={{ fontSize: '11px', background: 'var(--bg-pill)', padding: '3px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                  🎥 Camera: {currentAct.camera}
                </span>
                <span style={{ fontSize: '11px', background: 'var(--bg-pill)', padding: '3px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                  🔊 SFX: {currentAct.sfx}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: 4 Flagship Autonomous AI Templates (4 cols) */}
          <div className="bento-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Film size={22} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Autonomous AI Templates
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  24h Scheduled Autopilot • YouTube Publishing
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              Pre-trained end-to-end viral video channels. Each template autonomously researches topics, generates 5 AI video scenes, and publishes to YouTube.
            </p>

            {/* Template Selector Rail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {templatesList.map((tpl) => {
                const isSelected = activeTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      audioEngine.playSfx('click');
                      setActiveTemplate(tpl.id);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-input)',
                      border: `1px solid ${isSelected ? '#38bdf8' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px' }}>{tpl.icon}</span>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: isSelected ? '#38bdf8' : 'var(--text-primary)' }}>
                          {tpl.name}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: tpl.badge === 'PRO TEMPLATE' ? 'rgba(255, 79, 0, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        color: tpl.badge === 'PRO TEMPLATE' ? 'var(--accent-primary)' : 'var(--text-muted)'
                      }}>
                        {tpl.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                      {tpl.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: 20-Worker GPU Cloud Cluster (4 cols) */}
          <div className="bento-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Cpu size={22} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  20-Worker Cloud GPU Cluster
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Modal.com Serverless Compute
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              High-concurrency rendering across 20 parallel serverless containers. Zero thread locks, intelligent FIFO queues, and native HTTP 206 range-streaming.
            </p>

            {/* 20 GPU visual grid */}
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 700, color: '#10b981', marginBottom: '6px' }}>
                <span>● 20 GPU Workers Active</span>
                <span>Sub-60s Turnaround</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: '18px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#10b981'
                    }}
                  >
                    W{i + 1}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ✓ HTTP 206 Streaming • Automatic Cluster Failover
            </div>
          </div>

          {/* Card 4: BangAI Stock Studio & Autopilot (4 cols) */}
          <div className="bento-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={22} color="#f59e0b" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Stock Studio 24h Autopilot
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Licensed Commercial B-Roll Footage
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              Queue your upcoming daily topics. BangAI matches commercial clips from Pexels & Pixabay APIs, burns subtitles, ducks audio, and auto-uploads to YouTube.
            </p>

            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={13} color="#f59e0b" />
                <span>Pexels & Pixabay Commercial API Licenses</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={13} color="#f59e0b" />
                <span>100% Monetization Rights & Copyright Safe</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={13} color="#f59e0b" />
                <span>Upcoming Daily Topics Queue Automation</span>
              </div>
            </div>
          </div>

          {/* Card 5: AI Thumbnail Studio & Face-Swap (4 cols) */}
          <div className="bento-card bento-col-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(236, 72, 153, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ImageIcon size={22} color="#ec4899" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  AI Thumbnail Studio
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  1-Click High-CTR & Face-Swap
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              Generate thumbnails that boost click-through rates. Blend creator face references to maintain uniform personal branding across your channel.
            </p>

            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={13} color="#ec4899" />
                <span>3D Viral Headline Typography</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={13} color="#ec4899" />
                <span>Creator Face-Swap Consistency</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <CheckCircle2 size={13} color="#ec4899" />
                <span>Instant 16:9 & 9:16 Aspect Conversion</span>
              </div>
            </div>
          </div>

          {/* Card 6: Neural Voice Matrix & Official Google OAuth Auto-Publish (12 cols) */}
          <div className="bento-card bento-col-12">
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Mic2 size={18} color="#8b5cf6" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Neural Voice Matrix, Kinetic Subtitles & Google OAuth Auto-Publish
                  </h3>
                  <span className="badge badge-brand" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    31+ Languages
                  </span>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
                  ElevenLabs speech with authentic Hindi <code style={{ color: 'var(--accent-primary)' }}>hi-IN</code> cadence, automatic -18dB BGM ducking, and direct publishing via official Google OAuth 2.0.
                </p>
              </div>

              {/* Language Pills */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-input)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                flexWrap: 'wrap'
              }}>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      audioEngine.playSfx('click');
                      setActiveLang(l.code);
                    }}
                    style={{
                      background: activeLang === l.code ? '#8b5cf6' : 'transparent',
                      color: activeLang === l.code ? '#ffffff' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '11.5px',
                      fontWeight: activeLang === l.code ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Aspect Format Previews */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '14px'
            }}>
              <div style={{
                background: activeAspect === '9:16' ? 'rgba(255, 79, 0, 0.08)' : 'var(--bg-input)',
                border: `1.5px solid ${activeAspect === '9:16' ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                borderRadius: '14px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => { audioEngine.playSfx('click'); setActiveAspect('9:16'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Smartphone size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>9:16 Vertical Shorts</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  Safe-zone margin calibrated for YouTube Shorts, Reels, and TikTok UI overlays.
                </p>
              </div>

              <div style={{
                background: activeAspect === '16:9' ? 'rgba(255, 79, 0, 0.08)' : 'var(--bg-input)',
                border: `1.5px solid ${activeAspect === '16:9' ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                borderRadius: '14px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => { audioEngine.playSfx('click'); setActiveAspect('16:9'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Monitor size={16} color="#38bdf8" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>16:9 Cinematic Widescreen</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  High-resolution landscape framing for YouTube standard videos and desktop streaming.
                </p>
              </div>

              <div style={{
                background: activeAspect === '1:1' ? 'rgba(255, 79, 0, 0.08)' : 'var(--bg-input)',
                border: `1.5px solid ${activeAspect === '1:1' ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                borderRadius: '14px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => { audioEngine.playSfx('click'); setActiveAspect('1:1'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Square size={16} color="#10b981" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>1:1 Square Feed</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  Square framing optimized for feed scrolls, carousels, and high-CTR social ads.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
