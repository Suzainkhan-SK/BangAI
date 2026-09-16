import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap, CheckCircle2, AlertCircle, Loader2,
  ChevronRight, Play, Mic, Type, Search, X
} from 'lucide-react';
import AppShell from '../components/Layout/AppShell';
import { audioEngine } from '../audio/audioEngine';
import { getAuthToken } from '../utils/authClient';
import { VOICES, loadJson2VideoVoices, getAllVoices } from '../data/voices';

const YouTubeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" fill="#ef4444" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#ffffff" />
  </svg>
);

// Exact speed range from StudioLab
const SPEED_MIN  = 1.10;
const SPEED_MAX  = 1.50;
const SPEED_DEF  = 1.10;
const SPEED_STEP = 0.05;

const DEFAULT_VOICE = VOICES[0]; // Adam

// ─── Compact Searchable Voice Picker ─────────────────────────────────────────
function VoicePicker({ selectedVoice, onSelect, allVoices, loadingVoices }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(60);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = query.trim()
    ? allVoices.filter(v => {
        const q = query.toLowerCase();
        return (
          (v.name && v.name.toLowerCase().includes(q)) ||
          (v.tag && v.tag.toLowerCase().includes(q)) ||
          (v.accent && v.accent.toLowerCase().includes(q)) ||
          (v.language && v.language.toLowerCase().includes(q)) ||
          (v.id && v.id.toLowerCase().includes(q))
        );
      }).slice(0, 80)
    : allVoices.slice(0, visible);

  const handleOpen = () => {
    setOpen(true);
    setQuery('');
    setVisible(60);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handlePick = (v) => {
    onSelect(v);
    setOpen(false);
    setQuery('');
    audioEngine.playSfx('click');
  };

  // Infinite scroll in dropdown
  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setVisible(prev => prev + 40);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!e.target.closest('[data-voice-picker]')) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div data-voice-picker style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: '8px',
          border: '1px solid var(--border-medium)', background: 'var(--bg-card)',
          color: 'var(--text-primary)', fontSize: '12.5px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '8px', outline: 'none', textAlign: 'left',
          transition: 'border-color 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary, #6366f1)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-medium)'}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden' }}>
          <span style={{ fontSize: '13px' }}>{selectedVoice.flag?.split(' ')[0] || '🎙️'}</span>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedVoice.name}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {selectedVoice.tag || ''}
          </span>
        </span>
        <ChevronRight size={13} color="var(--text-muted)" style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: '0.15s' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
          borderRadius: '12px', zIndex: 200,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          maxHeight: '340px'
        }}>
          {/* Search */}
          <div style={{
            padding: '8px', borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setVisible(60); }}
              placeholder={`Search ${allVoices.length.toLocaleString()} voices…`}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: '12.5px', color: 'var(--text-primary)'
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                <X size={12} color="var(--text-muted)" />
              </button>
            )}
            {loadingVoices && <Loader2 size={12} className="animate-spin" color="var(--text-muted)" />}
          </div>

          {/* Count */}
          <div style={{ padding: '4px 10px', fontSize: '10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
            {query ? `${filtered.length} results` : `${allVoices.length.toLocaleString()} voices total`}
          </div>

          {/* Voice list */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            style={{ overflowY: 'auto', flex: 1 }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                No voices match "{query}"
              </div>
            ) : filtered.map(v => {
              const isSelected = v.id === selectedVoice.id && v.elevenLabsId === selectedVoice.elevenLabsId;
              return (
                <button
                  key={`${v.id}-${v.elevenLabsId}`}
                  type="button"
                  onClick={() => handlePick(v)}
                  style={{
                    width: '100%', padding: '7px 10px',
                    background: isSelected ? 'var(--bg-input)' : 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.1s'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-pill)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'none'; }}
                >
                  <span style={{ fontSize: '13px', flexShrink: 0 }}>
                    {v.flag?.split(' ')[0] || '🎙️'}
                  </span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {v.name}
                      {v.badge && <span style={{ fontSize: '10px' }}>{v.badge.split(' ')[0]}</span>}
                      {isSelected && <CheckCircle2 size={11} color="#10b981" />}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.tag || v.description || ''}{v.language && v.language !== 'English' ? ` · ${v.language}` : ''}
                    </div>
                  </div>
                  {v.source === 'json2video' && (
                    <span style={{
                      fontSize: '9px', fontWeight: 700, color: 'var(--accent-primary, #6366f1)',
                      background: 'rgba(99,102,241,0.1)', padding: '1px 5px', borderRadius: '4px', flexShrink: 0
                    }}>PRO</span>
                  )}
                </button>
              );
            })}
            {!query && visible < allVoices.length && (
              <div style={{ padding: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                Scroll for more · {allVoices.length - visible} remaining
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TemplatesPage({
  user,
  currentRoutePath = 'templates',
  collapsed = false,
  onToggleCollapse,
  onNavigate
}) {
  const [launchingId, setLaunchingId] = useState(null);
  const [errorMsg, setErrorMsg]       = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // ── Optional customization ──
  const [customTopic, setCustomTopic]     = useState('');
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE);
  const [voiceSpeed, setVoiceSpeed]       = useState(SPEED_DEF);

  // All voices: 23 native + 9,650 JSON2Video (lazy loaded)
  const [allVoices, setAllVoices]       = useState(() => getAllVoices());
  const [loadingVoices, setLoadingVoices] = useState(false);

  useEffect(() => {
    // Lazy-load JSON2Video voices in background
    setLoadingVoices(true);
    loadJson2VideoVoices().then(() => {
      setAllVoices(getAllVoices());
      setLoadingVoices(false);
    }).catch(() => setLoadingVoices(false));
  }, []);

  // ── YouTube channels (same as ProfilePage) ──
  const [channels, setChannels]             = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState('');

  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) { setLoadingChannels(false); return; }
      try {
        const token = getAuthToken();
        const res  = await fetch('/.netlify/functions/google-oauth?action=channels', {
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

  // ── Launch handler ──
  const handleLaunchTemplate = async (templateId) => {
    audioEngine.playSfx('click');
    if (!user) { if (typeof onNavigate === 'function') onNavigate('login'); return; }
    setLaunchingId(templateId);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      const token = getAuthToken() || '';
      // Always resolve the ElevenLabs ID — workflow uses this directly in Submit Job
      const elevenLabsVoiceId = selectedVoice.elevenLabsId || 'pNInz6obpgDQGcFmaJgB';
      // Clamp to exact StudioLab range
      const clampedSpeed = Math.max(SPEED_MIN, Math.min(SPEED_MAX, voiceSpeed));

      const res = await fetch('/.netlify/functions/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({
          templateId,
          selectedChannelId: selectedChannelId || undefined,
          token,
          prompt:           customTopic.trim() || '',
          voiceId:          selectedVoice.id,
          elevenLabsVoiceId,
          voiceSpeed:       clampedSpeed
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to dispatch template workflow');

      audioEngine.playSfx('success');
      setSuccessInfo({ message: 'Pipeline dispatched!', threadId: data.threadId });

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
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
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

          {/* ═══ FEATURED TEMPLATE ═══ */}
          {(activeCategory === 'all' || activeCategory === 'mysteries') && (
            <div className="saas-card" style={{ padding: '0', borderRadius: '20px', marginBottom: '36px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 265px', minHeight: '540px' }}>

                {/* Left: Content */}
                <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                    }}>75s · 5 Scenes · Autonomous</span>
                  </div>

                  {/* Title & desc */}
                  <div>
                    <h2 className="font-display" style={{
                      fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em'
                    }}>
                      World Mysteries & Paranormal
                    </h2>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, maxWidth: '480px' }}>
                      Self-researches unrepeated paranormal mysteries, scripts 5 cinematic scenes, renders photorealistic AI video, and uploads directly to YouTube — zero manual review.
                    </p>
                  </div>

                  {/* Spec pills */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'AI Brain', value: 'Gemini 2.5 Flash' },
                      { label: 'Voice',   value: `${selectedVoice.name}${selectedVoice.flag ? ' ' + selectedVoice.flag.split(' ')[0] : ''}` },
                      { label: 'Speed',   value: `${voiceSpeed.toFixed(2)}x` }
                    ].map((s, i) => (
                      <div key={i} style={{
                        background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                        borderRadius: '10px', padding: '7px 12px', flex: '1 1 110px'
                      }}>
                        <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── Customization box ── */}
                  <div style={{
                    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                    borderRadius: '12px', padding: '14px 16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Customize
                      </span>
                      <span style={{
                        fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)',
                        background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)',
                        padding: '1px 7px', borderRadius: '4px'
                      }}>Optional · leave blank for auto</span>
                    </div>

                    {/* Topic */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{
                        fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px'
                      }}>
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

                    {/* Voice + Speed */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      {/* Searchable voice picker — all 9,673 voices */}
                      <div style={{ flex: '2 1 200px' }}>
                        <label style={{
                          fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                          display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px'
                        }}>
                          <Mic size={11} />
                          Voice
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>
                            ({allVoices.length.toLocaleString()} available)
                          </span>
                          {loadingVoices && <Loader2 size={10} className="animate-spin" color="var(--text-muted)" />}
                        </label>
                        <VoicePicker
                          selectedVoice={selectedVoice}
                          onSelect={setSelectedVoice}
                          allVoices={allVoices}
                          loadingVoices={loadingVoices}
                        />
                      </div>

                      {/* Speed slider — exact StudioLab range 1.10–1.50 */}
                      <div style={{ flex: '1 1 130px' }}>
                        <label style={{
                          fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'
                        }}>
                          <span>Speed</span>
                          <span style={{
                            background: 'rgba(99,102,241,0.12)', padding: '1px 7px', borderRadius: '5px',
                            fontSize: '10px', fontWeight: 700, color: 'var(--accent-primary, #6366f1)',
                            fontVariantNumeric: 'tabular-nums'
                          }}>{voiceSpeed.toFixed(2)}x</span>
                        </label>
                        <input
                          type="range"
                          min={SPEED_MIN} max={SPEED_MAX} step={SPEED_STEP}
                          value={voiceSpeed}
                          onChange={e => setVoiceSpeed(parseFloat(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--accent-primary, #6366f1)', cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{SPEED_MIN}x</span>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{SPEED_MAX}x</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── YouTube + Launch ── */}
                  <div style={{
                    borderTop: '1px solid var(--border-subtle)', paddingTop: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '12px', marginTop: 'auto'
                  }}>
                    {/* Channel selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <YouTubeIcon size={16} />
                      {loadingChannels ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading...</span>
                      ) : channels.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          {selectedChannel?.thumbnail && (
                            <img src={selectedChannel.thumbnail} alt="" style={{
                              width: '20px', height: '20px', borderRadius: '50%',
                              objectFit: 'cover', border: '1px solid var(--border-subtle)'
                            }} />
                          )}
                          {channels.length > 1 ? (
                            <select
                              value={selectedChannelId}
                              onChange={e => setSelectedChannelId(e.target.value)}
                              style={{
                                background: 'var(--bg-input)', border: '1px solid var(--border-medium)',
                                borderRadius: '7px', padding: '4px 8px', fontSize: '12px',
                                color: 'var(--text-primary)', cursor: 'pointer', outline: 'none'
                              }}
                            >
                              {channels.map(c => (
                                <option key={c.channelId} value={c.channelId}>
                                  {c.title || c.channelTitle || 'YouTube Channel'}{c.isDefault ? ' (Default)' : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {selectedChannel?.title || selectedChannel?.channelTitle || 'YouTube Channel'}
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '5px' }}>· Auto-upload</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <button type="button"
                          onClick={() => { audioEngine.playSfx('click'); if (typeof onNavigate === 'function') onNavigate('profile'); }}
                          style={{
                            background: 'none', border: 'none', padding: 0, fontSize: '12px',
                            color: 'var(--accent-primary, #6366f1)', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          Connect YouTube in Profile <ChevronRight size={12} />
                        </button>
                      )}
                    </div>

                    {/* Launch */}
                    <button
                      disabled={launchingId === 'world-mysteries'}
                      onClick={() => handleLaunchTemplate('world-mysteries')}
                      className="btn-glow"
                      style={{
                        padding: '10px 22px', borderRadius: '10px', border: 'none',
                        cursor: launchingId === 'world-mysteries' ? 'not-allowed' : 'pointer',
                        fontSize: '13px', fontWeight: 700, color: '#ffffff',
                        display: 'flex', alignItems: 'center', gap: '7px',
                        opacity: launchingId === 'world-mysteries' ? 0.7 : 1
                      }}
                    >
                      {launchingId === 'world-mysteries' ? (
                        <><Loader2 size={14} className="animate-spin" /><span>Dispatching...</span></>
                      ) : (
                        <><Zap size={14} fill="#ffffff" /><span>1-Click Generate & Upload</span></>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right: Phone Canvas */}
                <div style={{
                  background: 'linear-gradient(180deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)',
                  borderLeft: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '24px 20px', position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                    width: '200px', height: '200px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                    pointerEvents: 'none', filter: 'blur(30px)'
                  }} />
                  <div
                    style={{
                      width: '160px', height: '330px', borderRadius: '28px',
                      border: '3px solid var(--border-medium)', background: '#000',
                      overflow: 'hidden', position: 'relative',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)',
                      transform: 'perspective(800px) rotateY(-4deg)', transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'perspective(800px) rotateY(0deg) scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'perspective(800px) rotateY(-4deg)'}
                  >
                    <div style={{
                      position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)',
                      width: '55px', height: '16px', borderRadius: '8px', background: '#111', zIndex: 3
                    }} />
                    <img
                      src="/template-demo-phone.jpg"
                      alt="World Mysteries demo"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '25px' }}
                    />
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8
                    }}>
                      <Play size={14} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
                    </div>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '8px 8px 12px',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.88))'
                    }}>
                      <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#fff', marginBottom: '2px', lineHeight: 1.3 }}>
                        The Bermuda Triangle's Darkest Secret
                      </div>
                      <div style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.6)' }}>128K likes · 1.2M views</div>
                    </div>
                  </div>
                  <div style={{
                    position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
                    fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap'
                  }}>Example Output</div>
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
                <div key={tpl.id} className="saas-card" style={{ padding: '18px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-pill)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: '6px' }}>{tpl.label}</span>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '99px' }}>Coming Soon</span>
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 5px 0' }}>{tpl.title}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0' }}>{tpl.desc}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tpl.duration} · {tpl.scenes}</span>
                    <button disabled style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, cursor: 'not-allowed' }}>Queued</button>
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
