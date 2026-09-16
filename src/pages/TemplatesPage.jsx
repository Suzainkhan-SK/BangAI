import React, { useState, useEffect } from 'react';
import {
  Sparkles, Zap, Flame, Clock, Film, CheckCircle2,
  AlertCircle, ArrowRight, Loader2, Play, Volume2, ShieldCheck,
  Layers, ChevronRight, Eye, RefreshCw
} from 'lucide-react';
import AppShell from '../components/Layout/AppShell';
import { audioEngine } from '../audio/audioEngine';

const YouTubeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" fill="#ef4444" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#ffffff" />
  </svg>
);

export default function TemplatesPage({
  user,
  currentRoutePath = 'templates',
  collapsed = false,
  onToggleCollapse,
  onNavigate
}) {
  const [launchingId, setLaunchingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // Resolve user's connected YouTube channels
  const youtubeChannels = user?.youtubeChannels || [];
  const defaultChannel = youtubeChannels.find(c => c.isDefault) || youtubeChannels[0] || null;
  const [selectedChannelId, setSelectedChannelId] = useState(defaultChannel?.channelId || '');

  useEffect(() => {
    if (defaultChannel?.channelId && !selectedChannelId) {
      setSelectedChannelId(defaultChannel.channelId);
    }
  }, [defaultChannel, selectedChannelId]);

  const handleLaunchTemplate = async (templateId) => {
    audioEngine.playSfx('click');
    if (!user) {
      if (typeof onNavigate === 'function') {
        onNavigate('login');
      }
      return;
    }
    setLaunchingId(templateId);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      const token = localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token') || localStorage.getItem('token') || localStorage.getItem('user_token') || '';
      const res = await fetch('/.netlify/functions/generate-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          templateId,
          selectedChannelId: selectedChannelId || undefined,
          token
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch template workflow');
      }

      audioEngine.playSfx('success');
      setSuccessInfo({
        message: 'Pipeline started successfully!',
        threadId: data.threadId,
        autoUploadToYouTube: data.autoUploadToYouTube,
        channelTitle: data.channelTitle
      });

      // Redirect to live thread dashboard after 1.2 seconds so user can watch progress
      setTimeout(() => {
        if (data.threadId && typeof onNavigate === 'function') {
          onNavigate(`dashboard/t/${data.threadId}`);
        } else if (typeof onNavigate === 'function') {
          onNavigate('dashboard');
        }
      }, 1200);

    } catch (err) {
      console.error('[TemplatesPage] Launch error:', err);
      audioEngine.playSfx('error');
      setErrorMsg(err.message || 'Something went wrong launching this template.');
    } finally {
      setLaunchingId(null);
    }
  };

  const CATEGORIES = [
    { id: 'all', label: 'All Templates' },
    { id: 'mysteries', label: 'World Mysteries' },
    { id: 'history', label: 'History & Lore' },
    { id: 'psychology', label: 'Dark Psychology' },
    { id: 'scifi', label: 'Space & Tech' }
  ];

  return (
    <AppShell
      user={user}
      currentRoutePath={currentRoutePath}
      onNavigate={onNavigate}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
    >
      <div style={{
        flex: 1,
        width: '100%',
        minHeight: '100%',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%), var(--bg-main, #0b0f19)',
        color: 'var(--text-primary, #f8fafc)',
        padding: '36px 32px 64px 32px',
        overflowY: 'auto',
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Header Title & Subtitle */}
        <div style={{ maxWidth: '1180px', margin: '0 auto 36px auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '99px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
              border: '1px solid rgba(99,102,241,0.35)',
              fontSize: '11px', fontWeight: 800, color: '#a5b4fc',
              letterSpacing: '0.08em', textTransform: 'uppercase'
            }}>
              <Zap size={12} fill="#6366f1" color="#6366f1" />
              1-Click Autonomous Workflows
            </span>
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#10b981',
              display: 'inline-flex', alignItems: 'center', gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Live n8n Cloud Connected
            </span>
          </div>

          <h1 style={{
            fontSize: '34px', fontWeight: 900, fontFamily: 'Space Grotesk, sans-serif',
            letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 10px 0',
            background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Pre-Built Shorts Templates
          </h1>
          <p style={{
            fontSize: '15px', color: 'var(--text-secondary, #94a3b8)', margin: 0,
            maxWidth: '680px', lineHeight: 1.6
          }}>
            Fully automated, production-ready video engines. Tap one button to research, script, narrate, generate 5 cinematic scenes, and upload directly to your YouTube channel with zero manual review needed.
          </p>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { audioEngine.playSfx('click'); setActiveCategory(cat.id); }}
                  style={{
                    padding: '7px 16px', borderRadius: '99px', cursor: 'pointer',
                    background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.04)',
                    color: active ? '#ffffff' : 'var(--text-muted, #64748b)',
                    fontSize: '13px', fontWeight: active ? 700 : 500,
                    border: `1px solid ${active ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 4px 14px rgba(99,102,241,0.35)' : 'none'
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div style={{
            maxWidth: '1180px', margin: '0 auto 24px auto',
            padding: '14px 18px', borderRadius: '14px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <AlertCircle size={18} color="#ef4444" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successInfo && (
          <div style={{
            maxWidth: '1180px', margin: '0 auto 24px auto',
            padding: '14px 18px', borderRadius: '14px',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#34d399', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span>{successInfo.message} Opening live tracker in dashboard...</span>
          </div>
        )}

        {/* Templates Display Grid */}
        <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* ═════════ ACTIVE HERO TEMPLATE: World Mysteries & Paranormal ═════════ */}
          {(activeCategory === 'all' || activeCategory === 'mysteries') && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(26,20,48,0.85) 0%, rgba(15,23,42,0.92) 100%)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '24px',
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.45), 0 0 40px rgba(99,102,241,0.12)',
              backdropFilter: 'blur(20px)'
            }}>
              {/* Decorative Accent Glow */}
              <div style={{
                position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px',
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', flexDirection: 'row', gap: '32px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                
                {/* Left Column: Visual Identity & Badges */}
                <div style={{
                  flex: '1 1 540px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 10px',
                        borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                        letterSpacing: '0.04em', textTransform: 'uppercase'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
                        Ready to Launch
                      </span>
                      <span style={{
                        background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                        color: '#c084fc', fontSize: '11px', fontWeight: 700, padding: '4px 10px',
                        borderRadius: '99px'
                      }}>
                        75s Duration • 5 Cinematic Scenes
                      </span>
                      <span style={{
                        background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)',
                        color: '#38bdf8', fontSize: '11px', fontWeight: 700, padding: '4px 10px',
                        borderRadius: '99px'
                      }}>
                        Autonomous 1-Click
                      </span>
                    </div>

                    <h2 style={{
                      fontSize: '26px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif',
                      color: '#ffffff', margin: '0 0 12px 0', letterSpacing: '-0.02em'
                    }}>
                      World Mysteries & Paranormal
                    </h2>

                    <p style={{
                      fontSize: '14.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 24px 0'
                    }}>
                      Uncover unexplained phenomena, historical enigmas, extraterrestrial sightings, and chilling paranormal lore. Engineered with high-retention hooks, dark ambient music, and photorealistic AI footage tuned for viral YouTube Shorts and Instagram Reels.
                    </p>

                    {/* Features Matrix Grid */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '12px', marginBottom: '24px'
                    }}>
                      <div style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '14px', padding: '12px 14px'
                      }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Topic Brain
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
                          Self-Ideating AI
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Checks de-dup DB
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '14px', padding: '12px 14px'
                      }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Narration Voice
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
                          Deep Suspense
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Adam (ElevenLabs/TTS)
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '14px', padding: '12px 14px'
                      }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Scene Pipeline
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
                          5 Direct Scenes
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Parallel JSON2Video
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '14px', padding: '12px 14px'
                      }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Upload Target
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                          Direct YouTube
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          OOM-Safe Stream
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* YouTube Destination & Channel Selector */}
                  <div style={{
                    padding: '16px', borderRadius: '16px',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <YouTubeIcon size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0' }}>
                          Target YouTube Channel
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                          {youtubeChannels.length > 0 ? (
                            <span>Auto-uploading to: <strong>{youtubeChannels.find(c => c.channelId === selectedChannelId)?.channelTitle || defaultChannel?.channelTitle || 'Connected Channel'}</strong></span>
                          ) : (
                            <span style={{ color: '#f59e0b' }}>No YouTube channel connected — video will be generated for download/stream.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {youtubeChannels.length > 1 && (
                      <select
                        value={selectedChannelId}
                        onChange={(e) => setSelectedChannelId(e.target.value)}
                        style={{
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px', color: '#fff', padding: '6px 10px', fontSize: '12px',
                          outline: 'none', cursor: 'pointer'
                        }}
                      >
                        {youtubeChannels.map(ch => (
                          <option key={ch.channelId} value={ch.channelId} style={{ background: '#0f172a', color: '#fff' }}>
                            {ch.channelTitle}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Right Column: 1-Click Launch Button & Preview Box */}
                <div style={{
                  flex: '1 1 340px', minWidth: '280px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px', padding: '28px', textAlign: 'center'
                }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 18px auto',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(99,102,241,0.4)'
                  }}>
                    <Flame size={32} color="#ffffff" />
                  </div>

                  <h3 style={{
                    fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0',
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}>
                    Ready to Generate?
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                    Zero manual editing required. The AI engine handles the entire 75-second multi-scene production autonomously.
                  </p>

                  <button
                    disabled={launchingId === 'world-mysteries'}
                    onClick={() => handleLaunchTemplate('world-mysteries')}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      border: 'none',
                      cursor: launchingId === 'world-mysteries' ? 'not-allowed' : 'pointer',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 800,
                      fontFamily: 'Space Grotesk, sans-serif',
                      letterSpacing: '0.01em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 8px 28px rgba(99,102,241,0.5), inset 0 1px 1px rgba(255,255,255,0.4)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: launchingId === 'world-mysteries' ? 'scale(0.98)' : 'scale(1)'
                    }}
                    onMouseEnter={e => {
                      if (launchingId !== 'world-mysteries') {
                        e.currentTarget.style.boxShadow = '0 12px 36px rgba(99,102,241,0.7), inset 0 1px 1px rgba(255,255,255,0.6)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (launchingId !== 'world-mysteries') {
                        e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.5), inset 0 1px 1px rgba(255,255,255,0.4)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {launchingId === 'world-mysteries' ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Launching Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={18} fill="#ffffff" />
                        <span>⚡ 1-Click Generate & Auto-Upload</span>
                      </>
                    )}
                  </button>

                  <div style={{
                    marginTop: '16px', fontSize: '11px', color: '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}>
                    <ShieldCheck size={13} color="#10b981" />
                    <span>Cost: 1 Generation Credit • De-Duplicated Content</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ═════════ COMING SOON TEMPLATES SECTION (Scalability) ═════════ */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{
                fontSize: '18px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif',
                color: '#ffffff', margin: 0
              }}>
                More Templates Coming Soon
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                Next workflows being connected to BangAI
              </span>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '18px'
            }}>
              {/* Coming Soon Card 1: Islamic Stories */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '18px', padding: '22px', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  display: 'inline-block', fontSize: '10px', fontWeight: 800,
                  background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
                  padding: '3px 8px', borderRadius: '99px', textTransform: 'uppercase', marginBottom: '12px'
                }}>
                  Coming Soon
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px 0' }}>
                  Islamic Historical & Wisdom [75s]
                </h4>
                <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Inspirational historical moments, golden age science, and prophetic stories formatted with serene, respectful visuals and voiceover.
                </p>
                <div style={{ fontSize: '11px', color: '#a5b4fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>75s • 5 Direct Scenes</span>
                </div>
              </div>

              {/* Coming Soon Card 2: Dark Psychology */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '18px', padding: '22px', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  display: 'inline-block', fontSize: '10px', fontWeight: 800,
                  background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
                  padding: '3px 8px', borderRadius: '99px', textTransform: 'uppercase', marginBottom: '12px'
                }}>
                  Coming Soon
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px 0' }}>
                  Dark Psychology & Secrets [75s]
                </h4>
                <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Behavioral phenomena, subconscious manipulation defenses, and intriguing human nature hooks that guarantee retention.
                </p>
                <div style={{ fontSize: '11px', color: '#a5b4fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>75s • 5 Direct Scenes</span>
                </div>
              </div>

              {/* Coming Soon Card 3: Sci-Fi & Cosmic Horizons */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '18px', padding: '22px', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  display: 'inline-block', fontSize: '10px', fontWeight: 800,
                  background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
                  padding: '3px 8px', borderRadius: '99px', textTransform: 'uppercase', marginBottom: '12px'
                }}>
                  Coming Soon
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px 0' }}>
                  Cosmic Horrors & Space [75s]
                </h4>
                <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Deep space mysteries, rogue black holes, James Webb discoveries, and the terrifying scale of the observable universe.
                </p>
                <div style={{ fontSize: '11px', color: '#a5b4fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>75s • 5 Direct Scenes</span>
                </div>
              </div>

              {/* Coming Soon Card 4: AI & Future Tech */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '18px', padding: '22px', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  display: 'inline-block', fontSize: '10px', fontWeight: 800,
                  background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
                  padding: '3px 8px', borderRadius: '99px', textTransform: 'uppercase', marginBottom: '12px'
                }}>
                  Coming Soon
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px 0' }}>
                  AI Frontiers & Future Tech [75s]
                </h4>
                <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Autonomous robotic evolutions, brain-computer interfaces, quantum leaps, and the future of synthetic intelligence.
                </p>
                <div style={{ fontSize: '11px', color: '#a5b4fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>75s • 5 Direct Scenes</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
