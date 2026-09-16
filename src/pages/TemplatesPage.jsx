import React, { useState, useEffect } from 'react';
import {
  Zap, CheckCircle2, AlertCircle, Loader2,
  ChevronRight, Play, Mic, Type
} from 'lucide-react';
import AppShell from '../components/Layout/AppShell';
import { audioEngine } from '../audio/audioEngine';
import { getAuthToken } from '../utils/authClient';

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

  // Optional customization fields
  const [customTopic, setCustomTopic] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [voiceSpeed, setVoiceSpeed] = useState(1.20);

  const VOICE_OPTIONS = [
    { id: 'default', label: 'Default (Adam)', elevenLabsId: 'pNInz6obpgDQGcFmaJgB' },
    { id: 'rachel', label: 'Rachel — Calm, Narrative', elevenLabsId: '21m00Tcm4TlvDq8ikWAM' },
    { id: 'domi', label: 'Domi — Bold, Confident', elevenLabsId: 'AZnzlk1XvdvUeBnXmlld' },
    { id: 'bella', label: 'Bella — Soft, Warm', elevenLabsId: 'EXAVITQu4vr4xnSDxMaL' },
    { id: 'antoni', label: 'Antoni — Friendly, Storyteller', elevenLabsId: 'ErXwobaYiN019PkySvjV' },
    { id: 'elli', label: 'Elli — Young, Feminine', elevenLabsId: 'MF3mGyEYCl7XYWbV9V6O' },
    { id: 'josh', label: 'Josh — Deep, Authoritative', elevenLabsId: 'TxGEqnHWrfWFTfGW9XjX' },
    { id: 'arnold', label: 'Arnold — Crisp, Dramatic', elevenLabsId: 'VR6AewLTigWG4xSOukaG' },
    { id: 'sam', label: 'Sam — Raspy, Engaging', elevenLabsId: 'yoZ06aMxZJJ28mfd3POQ' },
    { id: 'clyde', label: 'Clyde — Dark, Mysterious', elevenLabsId: '2EiwWnXFnvU5JabPnv8n' },
  ];

  // Fetch YouTube channels from the same API as ProfilePage
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState('');

  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) { setLoadingChannels(false); return; }
      try {
        const token = getAuthToken();
        const res = await fetch('/.netlify/functions/google-oauth?action=channels', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data && Array.isArray(data.channels)) {
          setChannels(data.channels);
          const def = data.channels.find(c => c.isDefault) || data.channels[0];
          if (def?.channelId) setSelectedChannelId(def.channelId);
        }
      } catch (err) {
        console.error('[TemplatesPage] Error loading channels:', err);
      } finally {
        setLoadingChannels(false);
      }
    };
    fetchChannels();
  }, [user]);

  const selectedChannel = channels.find(c => c.channelId === selectedChannelId) || channels[0] || null;

  const handleLaunchTemplate = async (templateId) => {
    audioEngine.playSfx('click');
    if (!user) { if (typeof onNavigate === 'function') onNavigate('login'); return; }
    setLaunchingId(templateId);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      const token = getAuthToken() || '';
      const voiceOption = VOICE_OPTIONS.find(v => v.id === selectedVoice) || VOICE_OPTIONS[0];
      const res = await fetch('/.netlify/functions/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({
          templateId,
          selectedChannelId: selectedChannelId || undefined,
          token,
          // Optional customization
          prompt: customTopic.trim() || undefined,
          voiceId: selectedVoice !== 'default' ? selectedVoice : undefined,
          elevenLabsVoiceId: selectedVoice !== 'default' ? voiceOption.elevenLabsId : undefined,
          voiceSpeed: voiceSpeed !== 1.20 ? voiceSpeed : undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to dispatch template workflow');

      audioEngine.playSfx('success');
      setSuccessInfo({
        message: 'Generation pipeline dispatched!',
        threadId: data.threadId,
        autoUploadToYouTube: data.autoUploadToYouTube,
        channelTitle: data.channelTitle
      });

      setTimeout(() => {
        if (data.threadId && typeof onNavigate === 'function') onNavigate(`dashboard/t/${data.threadId}`);
        else if (typeof onNavigate === 'function') onNavigate('dashboard');
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

  const UPCOMING = [
    { id: 'ancient-history', category: 'history', label: 'History & Lore', title: 'Ancient History & Lost Civilizations', desc: 'Deep-dives into forgotten dynasties and lost wonders.', duration: '75s', scenes: '5 Scenes' },
    { id: 'dark-psychology', category: 'psychology', label: 'Dark Psychology', title: 'Dark Psychology & Human Behavior', desc: 'Behavioral insights and persuasion breakdowns.', duration: '60s', scenes: '4 Scenes' },
    { id: 'cosmic-space', category: 'scifi', label: 'Space & Tech', title: 'Deep Space & Cosmic Wonders', desc: 'Astrophysics anomalies and planetary mysteries.', duration: '75s', scenes: '5 Scenes' },
    { id: 'mythical-heists', category: 'mysteries', label: 'World Mysteries', title: 'Legendary Heists & Unsolved Enigmas', desc: 'Thriller breakdowns of impossible robberies.', duration: '75s', scenes: '5 Scenes' }
  ];

  const filteredUpcoming = activeCategory === 'all' ? UPCOMING : UPCOMING.filter(t => t.category === activeCategory);

  return (
    <AppShell user={user} currentRoutePath={currentRoutePath} onNavigate={onNavigate} collapsed={collapsed} onToggleCollapse={onToggleCollapse}>
      <div style={{
        flex: 1, width: '100%', minHeight: '100%',
        backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)',
        padding: '36px 32px 80px 32px', overflowY: 'auto'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* ── Header ── */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '3px 10px', borderRadius: '99px',
                background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)'
              }}>
                <Zap size={11} color="var(--accent-primary, #6366f1)" />
                Autonomous Workflows
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 600, color: '#10b981',
                display: 'inline-flex', alignItems: 'center', gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                n8n Cloud Connected
              </span>
            </div>

            <h1 className="font-display" style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '0 0 6px 0'
            }}>
              Pre-Built Video Templates
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55, maxWidth: '620px' }}>
              Tap once to autonomously research, script, narrate, render 5 cinematic scenes, and upload directly to your YouTube channel.
            </p>

            {/* Category Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '20px', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => {
                const active = activeCategory === cat.id;
                return (
                  <button key={cat.id} onClick={() => { audioEngine.playSfx('click'); setActiveCategory(cat.id); }}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
                      background: active ? 'var(--text-primary)' : 'var(--bg-card)',
                      color: active ? 'var(--bg-app)' : 'var(--text-secondary)',
                      fontSize: '12.5px', fontWeight: active ? 700 : 500, transition: 'all 0.15s ease'
                    }}
                  >{cat.label}</button>
                );
              })}
            </div>
          </div>

          {/* ── Alerts ── */}
          {errorMsg && (
            <div style={{
              marginBottom: '20px', padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <AlertCircle size={16} /><span>{errorMsg}</span>
            </div>
          )}
          {successInfo && (
            <div style={{
              marginBottom: '20px', padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
              color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <CheckCircle2 size={16} /><span>{successInfo.message} Opening dashboard...</span>
            </div>
          )}

          {/* ═══════ FEATURED TEMPLATE: Hero Layout with Phone Canvas ═══════ */}
          {(activeCategory === 'all' || activeCategory === 'mysteries') && (
            <div className="saas-card" style={{
              padding: '0', borderRadius: '20px', marginBottom: '36px', overflow: 'hidden'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 280px',
                minHeight: '420px'
              }}>
                {/* Left: Content */}
                <div style={{ padding: '32px 32px 28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Status Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                        color: '#10b981', fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                        borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '5px'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                        Ready to Launch
                      </span>
                      <span style={{
                        background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '99px'
                      }}>
                        75s • 5 Scenes • Autonomous
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="font-display" style={{
                      fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)',
                      margin: '0 0 10px 0', letterSpacing: '-0.02em'
                    }}>
                      World Mysteries & Paranormal
                    </h2>

                    {/* Description */}
                    <p style={{
                      fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6,
                      margin: '0 0 20px 0', maxWidth: '520px'
                    }}>
                      Autonomous viral Shorts engine. Self-researches unrepeated paranormal mysteries, scripts 5 cinematic scenes with deep narration, renders photorealistic AI video, and uploads directly to YouTube — zero manual review.
                    </p>

                    {/* Specs Row */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                      {[
                        { label: 'AI Brain', value: 'Gemini 2.5 Flash' },
                        { label: 'Voice', value: (VOICE_OPTIONS.find(v => v.id === selectedVoice) || VOICE_OPTIONS[0]).label.split('—')[0].trim() },
                        { label: 'Pipeline', value: '5 Parallel Scenes' }
                      ].map((spec, i) => (
                        <div key={i} style={{
                          background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                          borderRadius: '10px', padding: '8px 14px', flex: '1 1 140px'
                        }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                            {spec.label}
                          </div>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {spec.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── Optional Customization ── */}
                    <div style={{
                      background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                      borderRadius: '12px', padding: '14px 16px', marginBottom: '20px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Customize (Optional)
                        </span>
                        <span style={{
                          fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)',
                          background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                          padding: '1px 6px', borderRadius: '4px'
                        }}>Leave blank for auto</span>
                      </div>

                      {/* Topic Input */}
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                          <Type size={11} /> Topic
                        </label>
                        <input
                          type="text"
                          value={customTopic}
                          onChange={e => setCustomTopic(e.target.value)}
                          placeholder="e.g. The Bermuda Triangle, Area 51 secrets..."
                          style={{
                            width: '100%', padding: '8px 12px', borderRadius: '8px',
                            border: '1px solid var(--border-medium)', background: 'var(--bg-card)',
                            color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none',
                            boxSizing: 'border-box', transition: 'border-color 0.15s'
                          }}
                          onFocus={e => e.target.style.borderColor = 'var(--accent-primary, #6366f1)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-medium)'}
                        />
                      </div>

                      {/* Voice & Speed Row */}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '2 1 180px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                            <Mic size={11} /> Voice
                          </label>
                          <select
                            value={selectedVoice}
                            onChange={e => { audioEngine.playSfx('click'); setSelectedVoice(e.target.value); }}
                            style={{
                              width: '100%', padding: '8px 10px', borderRadius: '8px',
                              border: '1px solid var(--border-medium)', background: 'var(--bg-card)',
                              color: 'var(--text-primary)', fontSize: '12px', outline: 'none',
                              cursor: 'pointer', boxSizing: 'border-box'
                            }}
                          >
                            {VOICE_OPTIONS.map(v => (
                              <option key={v.id} value={v.id}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: '1 1 100px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px', display: 'block' }}>
                            Speed: {voiceSpeed.toFixed(2)}x
                          </label>
                          <input
                            type="range" min="0.7" max="1.8" step="0.05"
                            value={voiceSpeed}
                            onChange={e => setVoiceSpeed(parseFloat(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--accent-primary, #6366f1)', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* YouTube Destination + Launch */}
                  <div style={{
                    borderTop: '1px solid var(--border-subtle)', paddingTop: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '14px'
                  }}>
                    {/* YouTube Channel Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <YouTubeIcon size={18} />
                      {loadingChannels ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading channels...</span>
                      ) : channels.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {selectedChannel?.thumbnail && (
                            <img src={selectedChannel.thumbnail} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
                          )}
                          {channels.length > 1 ? (
                            <select
                              value={selectedChannelId}
                              onChange={(e) => setSelectedChannelId(e.target.value)}
                              style={{
                                background: 'var(--bg-input)', border: '1px solid var(--border-medium)',
                                borderRadius: '8px', padding: '5px 10px', fontSize: '12px',
                                color: 'var(--text-primary)', cursor: 'pointer', outline: 'none'
                              }}
                            >
                              {channels.map(c => (
                                <option key={c.channelId} value={c.channelId}>
                                  {c.title || c.channelTitle || 'YouTube Channel'} {c.isDefault ? '(Default)' : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div>
                              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {selectedChannel?.title || selectedChannel?.channelTitle || 'YouTube Channel'}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                                Auto-upload enabled
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button type="button" onClick={() => { audioEngine.playSfx('click'); if (typeof onNavigate === 'function') onNavigate('profile'); }}
                          style={{
                            background: 'none', border: 'none', padding: 0, fontSize: '12px',
                            color: 'var(--accent-primary, #6366f1)', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          Connect YouTube in Profile <ChevronRight size={13} />
                        </button>
                      )}
                    </div>

                    {/* Launch Button */}
                    <button
                      disabled={launchingId === 'world-mysteries'}
                      onClick={() => handleLaunchTemplate('world-mysteries')}
                      className="btn-glow"
                      style={{
                        padding: '10px 22px', borderRadius: '10px', border: 'none',
                        cursor: launchingId === 'world-mysteries' ? 'not-allowed' : 'pointer',
                        fontSize: '13px', fontWeight: 700, color: '#ffffff',
                        display: 'flex', alignItems: 'center', gap: '7px'
                      }}
                    >
                      {launchingId === 'world-mysteries' ? (
                        <><Loader2 size={15} className="animate-spin" /><span>Dispatching...</span></>
                      ) : (
                        <><Zap size={14} fill="#ffffff" /><span>1-Click Generate & Upload</span></>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right: Phone Canvas Demo */}
                <div style={{
                  background: 'linear-gradient(180deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)',
                  borderLeft: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '24px 20px', position: 'relative', overflow: 'hidden'
                }}>
                  {/* Subtle gradient orb behind phone */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '200px', height: '200px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                    pointerEvents: 'none', filter: 'blur(30px)'
                  }} />

                  {/* Phone Frame */}
                  <div style={{
                    width: '170px', height: '340px', borderRadius: '28px',
                    border: '3px solid var(--border-medium)',
                    background: '#000', overflow: 'hidden', position: 'relative',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)',
                    transform: 'perspective(800px) rotateY(-4deg)',
                    transition: 'transform 0.3s ease'
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'perspective(800px) rotateY(0deg) scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'perspective(800px) rotateY(-4deg)'}
                  >
                    {/* Notch */}
                    <div style={{
                      position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)',
                      width: '60px', height: '18px', borderRadius: '10px',
                      background: '#111', zIndex: 3
                    }} />

                    {/* Demo Image */}
                    <img
                      src="/template-demo-phone.jpg"
                      alt="World Mysteries demo — YouTube Shorts"
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        borderRadius: '25px'
                      }}
                    />

                    {/* Play overlay */}
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0.8, transition: 'opacity 0.2s'
                    }}>
                      <Play size={16} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
                    </div>

                    {/* Bottom bar mock */}
                    <div style={{
                      position: 'absolute', bottom: '0', left: '0', right: '0',
                      padding: '10px 10px 14px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))'
                    }}>
                      <div style={{ fontSize: '8px', fontWeight: 700, color: '#fff', marginBottom: '3px', lineHeight: 1.3 }}>
                        The Bermuda Triangle's Darkest Secret
                      </div>
                      <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.6)' }}>
                        128K likes • 1.2M views
                      </div>
                    </div>
                  </div>

                  {/* Label under phone */}
                  <div style={{
                    position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
                    fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)',
                    textAlign: 'center', whiteSpace: 'nowrap'
                  }}>
                    Example Output
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Upcoming Templates ── */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px 0' }}>
                More Templates
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                Additional autonomous niches scheduled for release.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '14px' }}>
              {filteredUpcoming.map(tpl => (
                <div key={tpl.id} className="saas-card" style={{
                  padding: '18px', borderRadius: '14px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                        background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                        padding: '2px 8px', borderRadius: '6px'
                      }}>{tpl.label}</span>
                      <span style={{
                        fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)',
                        background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '99px'
                      }}>Coming Soon</span>
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 5px 0' }}>{tpl.title}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0' }}>{tpl.desc}</p>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: '10px', borderTop: '1px solid var(--border-subtle)'
                  }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tpl.duration} • {tpl.scenes}</span>
                    <button disabled style={{
                      padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)', color: 'var(--text-muted)',
                      fontSize: '11px', fontWeight: 600, cursor: 'not-allowed'
                    }}>Queued</button>
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
