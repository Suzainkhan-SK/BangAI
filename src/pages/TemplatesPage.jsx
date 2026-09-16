import React, { useState, useEffect } from 'react';
import {
  Zap, Clock, Film, CheckCircle2,
  AlertCircle, ArrowRight, Loader2, Sparkles,
  Layers, ChevronRight, Globe
} from 'lucide-react';
import AppShell from '../components/Layout/AppShell';
import { audioEngine } from '../audio/audioEngine';

const YouTubeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
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
        message: 'Generation pipeline dispatched successfully!',
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
    { id: 'all', label: 'All' },
    { id: 'mysteries', label: 'World Mysteries' },
    { id: 'history', label: 'History & Lore' },
    { id: 'psychology', label: 'Dark Psychology' },
    { id: 'scifi', label: 'Space & Tech' }
  ];

  const UPCOMING_TEMPLATES = [
    {
      id: 'ancient-history',
      category: 'history',
      categoryLabel: 'History & Lore',
      title: 'Ancient History & Lost Civilizations',
      desc: 'Deep-dives into forgotten dynasties, ancient archeology, and lost wonders scripted with historical authenticity.',
      duration: '75s',
      scenes: '5 Scenes',
      voice: 'Narrator Marcus'
    },
    {
      id: 'dark-psychology',
      category: 'psychology',
      categoryLabel: 'Dark Psychology',
      title: 'Dark Psychology & Human Behavior',
      desc: 'High-hook behavioral insights, persuasion breakdowns, and body language analysis engineered for viral retention.',
      duration: '60s',
      scenes: '4 Scenes',
      voice: 'Narrator Josh'
    },
    {
      id: 'cosmic-space',
      category: 'scifi',
      categoryLabel: 'Space & Tech',
      title: 'Deep Space & Cosmic Wonders',
      desc: 'Astrophysics anomalies, black holes, and planetary mysteries backed by photorealistic sci-fi AI generation.',
      duration: '75s',
      scenes: '5 Scenes',
      voice: 'Narrator Rachel'
    },
    {
      id: 'mythical-heists',
      category: 'mysteries',
      categoryLabel: 'World Mysteries',
      title: 'Legendary Heists & Unsolved Enigmas',
      desc: 'Step-by-step thriller breakdowns of impossible robberies and historical treasure enigmas.',
      duration: '75s',
      scenes: '5 Scenes',
      voice: 'Narrator Adam'
    }
  ];

  const filteredUpcoming = activeCategory === 'all'
    ? UPCOMING_TEMPLATES
    : UPCOMING_TEMPLATES.filter(t => t.category === activeCategory);

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
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        padding: '36px 32px 80px 32px',
        overflowY: 'auto'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* ── Header ── */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '3px 9px', borderRadius: '99px',
                background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)'
              }}>
                <Zap size={12} color="var(--accent-primary)" />
                Autonomous Workflows
              </span>
              <span style={{
                fontSize: '11.5px', fontWeight: 600, color: '#10b981',
                display: 'inline-flex', alignItems: 'center', gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                n8n Cloud Connected
              </span>
            </div>

            <h1 className="font-display" style={{
              fontSize: 'clamp(24px, 3.5vw, 30px)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              margin: '0 0 6px 0'
            }}>
              Pre-Built Video Templates
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.5,
              maxWidth: '640px'
            }}>
              Production-ready video templates. Tap once to research, script, narrate, generate 5 cinematic scenes, and upload directly to your YouTube channel.
            </p>

            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '20px', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { audioEngine.playSfx('click'); setActiveCategory(cat.id); }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
                      background: active ? 'var(--text-primary)' : 'var(--bg-card)',
                      color: active ? 'var(--bg-app)' : 'var(--text-secondary)',
                      fontSize: '12.5px',
                      fontWeight: active ? 700 : 500,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Alerts ── */}
          {errorMsg && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successInfo && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#10b981',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>{successInfo.message} Loading generation tracker in dashboard...</span>
            </div>
          )}

          {/* ── YouTube Destination Channel Bar ── */}
          <div className="saas-card" style={{
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <YouTubeIcon size={18} />
              <div>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Upload Target
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  {youtubeChannels.length > 0 ? 'Videos auto-publish here' : 'No channel linked (saves to dashboard)'}
                </span>
              </div>
            </div>

            {youtubeChannels.length > 0 ? (
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {youtubeChannels.map(c => (
                  <option key={c.channelId} value={c.channelId}>
                    {c.channelTitle || c.title || 'Connected YouTube Channel'} {c.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => { audioEngine.playSfx('click'); if (typeof onNavigate === 'function') onNavigate('profile'); }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Connect YouTube in Profile</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>

          {/* ── Active Template Card ── */}
          {(activeCategory === 'all' || activeCategory === 'mysteries') && (
            <div className="saas-card" style={{
              padding: '24px',
              borderRadius: '16px',
              marginBottom: '32px'
            }}>
              {/* Card Meta Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#10b981',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                  Ready to Launch
                </span>
                <span style={{
                  background: 'var(--bg-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '99px'
                }}>
                  75s Duration • 5 Scenes
                </span>
                <span style={{
                  background: 'var(--bg-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '99px'
                }}>
                  Autonomous 1-Click
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="font-display" style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 6px 0'
              }}>
                World Mysteries & Paranormal
              </h2>

              <p style={{
                fontSize: '13.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                margin: '0 0 20px 0',
                maxWidth: '820px'
              }}>
                Autonomous viral Shorts engine. Researches unrepeated paranormal mysteries, scripts 5 cinematic scenes, synthesizes deep narration, renders multi-scene video, and uploads directly to YouTube without asking for manual reviews.
              </p>

              {/* Minimalist Specs Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '22px'
              }}>
                <div style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 14px'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                    TOPIC BRAIN
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Gemini 2.5 Flash + Deduplication
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 14px'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                    NARRATION VOICE
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Adam (Deep Suspense · ElevenLabs)
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 14px'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                    RENDER PIPELINE
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    5 Direct Scenes (Parallel JSON2Video)
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Cost: 1 Generation Credit • Zero manual edits required
                </div>

                <button
                  disabled={launchingId === 'world-mysteries'}
                  onClick={() => handleLaunchTemplate('world-mysteries')}
                  className="btn-glow"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: launchingId === 'world-mysteries' ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px'
                  }}
                >
                  {launchingId === 'world-mysteries' ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Dispatching Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={14} fill="#ffffff" />
                      <span>1-Click Generate & Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Upcoming Templates Section ── */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 className="font-display" style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 2px 0'
              }}>
                More Templates
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                Additional pre-built autonomous niches scheduled for release.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
              gap: '16px'
            }}>
              {filteredUpcoming.map(tpl => (
                <div
                  key={tpl.id}
                  className="saas-card"
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        background: 'var(--bg-pill)',
                        border: '1px solid var(--border-subtle)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {tpl.categoryLabel}
                      </span>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        background: 'var(--bg-input)',
                        padding: '2px 8px',
                        borderRadius: '99px'
                      }}>
                        Coming Soon
                      </span>
                    </div>

                    <h4 style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: '0 0 6px 0'
                    }}>
                      {tpl.title}
                    </h4>

                    <p style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      margin: '0 0 16px 0'
                    }}>
                      {tpl.desc}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {tpl.duration} • {tpl.scenes}
                    </span>
                    <button
                      disabled
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'not-allowed'
                      }}
                    >
                      Queued
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
