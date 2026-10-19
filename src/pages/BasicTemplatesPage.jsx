import React, { useState, useEffect } from 'react';
import {
  Film, Sparkles, RefreshCw, ExternalLink,
  Terminal, Cpu, Zap, Globe, Cloud, ShieldCheck,
  Play, CheckCircle, AlertCircle, X, ChevronDown, Video,
  Clock, Layers, Key, Check
} from 'lucide-react';
import AppShell from '../components/Layout/AppShell';
import { useBreakpoint } from '../hooks/useMediaQuery';

const MODAL_CLUSTERS = [
  {
    id: 'cmpunktg',
    uiUrl: 'https://cmpunktg--bangai-stock-studio-ui.modal.run',
    serveUrl: 'https://cmpunktg--bangai-stock-studio-serve.modal.run',
    priority: 1
  },
  {
    id: 'cmpunktg1',
    uiUrl: 'https://cmpunktg1--bangai-stock-studio-ui.modal.run',
    serveUrl: 'https://cmpunktg1--bangai-stock-studio-serve.modal.run',
    priority: 2
  }
];

export default function BasicTemplatesPage({
  user,
  theme,
  currentRoutePath = 'basic-templates',
  collapsed = false,
  onToggleCollapse,
  onNavigate
}) {
  const { isMobile } = useBreakpoint();
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [mptStatus, setMptStatus] = useState('online');
  const [iframeKey, setIframeKey] = useState(0);

  // Silent Backend Failover: Primary (cmpunktg) -> Backup (cmpunktg1)
  const [activeClusterId, setActiveClusterId] = useState('cmpunktg');

  // Local vs Cloud
  const LOCAL_MPT_URL = 'http://localhost:8501';
  const [useCloudEnv, setUseCloudEnv] = useState(true);

  // Read authenticated user's JWT token, user profile & theme
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token') || user?.token || '')
    : (user?.token || '');

  const storedUserRaw = typeof window !== 'undefined'
    ? (localStorage.getItem('bangai_user') || localStorage.getItem('shortsai_user'))
    : null;
  let parsedUser = null;
  try {
    parsedUser = storedUserRaw ? JSON.parse(storedUserRaw) : (user || null);
  } catch {
    parsedUser = user || null;
  }
  const userId = parsedUser?.id || parsedUser?._id || parsedUser?.userId || '';
  const userEmail = parsedUser?.email || '';

  let effectiveUserId = userId;
  if (!effectiveUserId && typeof window !== 'undefined') {
    let anonId = localStorage.getItem('bangai_mpt_uid');
    if (!anonId) {
      anonId = 'guest_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('bangai_mpt_uid', anonId);
    }
    effectiveUserId = anonId;
  }

  const activeTheme = theme || (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'dark') || 'dark';

  const activeCluster = MODAL_CLUSTERS.find(c => c.id === activeClusterId) || MODAL_CLUSTERS[0];
  const baseUrl = useCloudEnv ? activeCluster.uiUrl : LOCAL_MPT_URL;
  const embeddedUrl = `${baseUrl}/?token=${encodeURIComponent(token)}&user_id=${encodeURIComponent(effectiveUserId)}&email=${encodeURIComponent(userEmail)}&theme=${encodeURIComponent(activeTheme)}&embedded=1`;
  const fullWindowUrl = `${baseUrl}/?token=${encodeURIComponent(token)}&user_id=${encodeURIComponent(effectiveUserId)}&email=${encodeURIComponent(userEmail)}&theme=${encodeURIComponent(activeTheme)}`;

  // ── 24-Hour Stock Studio Autonomous Video Engine State ──
  const [isAutomationOpen, setIsAutomationOpen] = useState(false);
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [savingAuto, setSavingAuto] = useState(false);
  const [triggeringRun, setTriggeringRun] = useState(false);
  const [autoStatusMsg, setAutoStatusMsg] = useState('');
  const [channels, setChannels] = useState([]);
  const [automationConfig, setAutomationConfig] = useState({
    status: 'PAUSED',
    creditMode: 'bang_credits',
    upcomingTopics: [],
    settings: {
      video_aspect: '9:16',
      video_source: 'pexels',
      script_engine: 'gemini',
      script_model: 'gemini-2.5-flash',
      voice_name: 'json2video:jU6FDipvScsl0aEFyDoh:Aravinda - Mysteriou - 🇮🇳 Hindi (Male)',
      voice_speed: 1.1,
      paragraph_number: 2,
      subtitle_preset: 'mrbeast-viral',
      font_size: 50,
      bgm_volume: 0.15,
      duration: 60
    },
    autoUploadToYouTube: true,
    youtubePrivacy: 'public',
    selectedChannelId: '',
    nextRunAt: null,
    totalRuns: 0
  });
  const [topicsInput, setTopicsInput] = useState('');

  // Fetch user automation config
  const fetchAutomationConfig = async () => {
    setLoadingAuto(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/.netlify/functions/stock-studio-automation?email=${encodeURIComponent(userEmail)}&userId=${encodeURIComponent(effectiveUserId)}`, {
        headers
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.automation) {
          setAutomationConfig(data.automation);
          setTopicsInput((data.automation.upcomingTopics || []).join('\n'));
          if (Array.isArray(data.channels)) {
            setChannels(data.channels);
          }
        }
      }
    } catch (e) {
      console.warn('[BasicTemplates] fetchAutomation error:', e);
    } finally {
      setLoadingAuto(false);
    }
  };

  useEffect(() => {
    fetchAutomationConfig();
  }, [userEmail]);

  const handleSaveAutomation = async (overrides = {}) => {
    setSavingAuto(true);
    setAutoStatusMsg('');
    try {
      const parsedTopics = topicsInput.split('\n').map(t => t.trim()).filter(Boolean);
      const payload = {
        action: 'save',
        email: userEmail,
        userId: effectiveUserId,
        upcomingTopics: parsedTopics,
        settings: automationConfig.settings,
        creditMode: automationConfig.creditMode,
        selectedChannelId: automationConfig.selectedChannelId,
        autoUploadToYouTube: automationConfig.autoUploadToYouTube,
        youtubePrivacy: automationConfig.youtubePrivacy,
        ...overrides
      };
      const res = await fetch('/.netlify/functions/stock-studio-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setAutomationConfig(data.automation);
        setAutoStatusMsg('✅ Stock Studio Automation settings saved successfully!');
      } else {
        setAutoStatusMsg(`❌ Error: ${data.error || 'Failed to save settings'}`);
      }
    } catch (err) {
      setAutoStatusMsg(`❌ Error: ${err.message}`);
    } finally {
      setSavingAuto(false);
      setTimeout(() => setAutoStatusMsg(''), 5000);
    }
  };

  const handleToggleAutomation = async () => {
    setSavingAuto(true);
    setAutoStatusMsg('');
    try {
      const res = await fetch('/.netlify/functions/stock-studio-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'toggle',
          email: userEmail,
          userId: effectiveUserId
        })
      });
      const data = await res.json();
      if (data.success) {
        setAutomationConfig(prev => ({ ...prev, status: data.status }));
        setAutoStatusMsg(data.message);
        fetchAutomationConfig();
      } else {
        setAutoStatusMsg(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setAutoStatusMsg(`❌ Error: ${err.message}`);
    } finally {
      setSavingAuto(false);
      setTimeout(() => setAutoStatusMsg(''), 5000);
    }
  };

  const handleTriggerRunNow = async () => {
    if (triggeringRun) return;
    setTriggeringRun(true);
    setAutoStatusMsg("⏳ Launching today's autonomous video generation on Modal GPU...");
    try {
      const res = await fetch('/.netlify/functions/stock-studio-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'run-now',
          email: userEmail,
          userId: effectiveUserId
        })
      });
      const data = await res.json();
      if (data.success) {
        setAutoStatusMsg(`🚀 Video for "${data.topic}" dispatched! YouTube Auto-Upload: ${data.autoUploadToYouTube ? 'Active' : 'Disabled'}.`);
        fetchAutomationConfig();
      } else {
        setAutoStatusMsg(`❌ Dispatch failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setAutoStatusMsg(`❌ Error: ${err.message}`);
    } finally {
      setTriggeringRun(false);
    }
  };

  const handleAddSampleTopics = (category) => {
    const samples = {
      mysteries: [
        'Top 5 Unexplained Mysteries of Area 51',
        'Secrets of the Bermuda Triangle Flight 19',
        'Ancient Underwater Pyramids Found Near Japan',
        'The Mysterious Disappearance of the Roanoke Colony'
      ],
      tech: [
        'How Artificial Intelligence Will Change Life by 2030',
        'Top 3 Mind-Blowing Quantum Computing Breakthroughs',
        'The Future of Humanoid Robots in Daily Life',
        'Neuralink Brain Chips: What Happens Next?'
      ],
      facts: [
        '3 Shocking Space Facts That Will Keep You Up at Night',
        'Deep Ocean Creatures Stranger Than Sci-Fi Aliens',
        'Why the Earth Spins Faster in Summer Than Winter',
        'The Most Dangerous Road on Earth: Death Road of Bolivia'
      ]
    };
    const toAdd = samples[category] || [];
    const current = topicsInput.split('\n').map(t => t.trim()).filter(Boolean);
    const combined = Array.from(new Set([...current, ...toAdd]));
    setTopicsInput(combined.join('\n'));
  };

  // Probe connectivity with silent automatic backend failover
  const checkHealth = async () => {
    setIsCheckingConnection(true);
    try {
      if (useCloudEnv) {
        const primary = MODAL_CLUSTERS[0];
        let primaryOk = false;
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(`${primary.serveUrl}/ping`, { method: 'GET', signal: controller.signal });
          clearTimeout(tid);
          if (res.ok && res.status !== 402 && res.status !== 503) {
            primaryOk = true;
          }
        } catch {
          primaryOk = false;
        }

        if (primaryOk) {
          setActiveClusterId(primary.id);
          setMptStatus('online');
        } else {
          const backup = MODAL_CLUSTERS[1];
          try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(`${backup.serveUrl}/ping`, { method: 'GET', signal: controller.signal });
            clearTimeout(tid);
            if (res.ok) {
              setActiveClusterId(backup.id);
              setMptStatus('online');
            } else {
              setActiveClusterId(primary.id);
              setMptStatus('online');
            }
          } catch {
            setActiveClusterId(primary.id);
            setMptStatus('online');
          }
        }
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        try {
          await fetch(`${LOCAL_MPT_URL}/_stcore/health`, { method: 'GET', mode: 'no-cors', signal: controller.signal });
          setMptStatus('online');
        } catch {
          setMptStatus('offline');
        } finally {
          clearTimeout(timeoutId);
        }
      }
    } catch (e) {
      console.warn('[BasicTemplates] Health check probe failed:', e);
    } finally {
      setIsCheckingConnection(false);
      setIframeKey(k => k + 1);
    }
  };

  useEffect(() => {
    checkHealth();
  }, [useCloudEnv]);

  const targetChannel = (automationConfig.selectedChannelId && channels.find(c => c.channelId === automationConfig.selectedChannelId)) || channels[0] || null;

  return (
    <AppShell
      currentView="basic-templates"
      currentRoutePath={currentRoutePath}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onNavigate={onNavigate}
      user={user}
    >
      <div style={{
        flex: 1,
        width: '100%',
        height: isMobile ? 'auto' : '100%',
        minHeight: 0,
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        padding: isMobile ? '8px 8px 12px 8px' : '12px 16px 20px 16px',
        overflowY: isMobile ? 'visible' : 'auto',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* ── Top Header Toolbar ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? '8px' : '12px',
            padding: isMobile ? '8px 12px' : '10px 16px',
            marginBottom: isMobile ? '8px' : '12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-card)'
          }}>
            {/* Left: Brand Title & Live Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '7px' : '10px', minWidth: 0 }}>
              <div style={{
                width: isMobile ? '28px' : '30px',
                height: isMobile ? '28px' : '30px',
                borderRadius: '8px',
                background: '#ff4f00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fffefb',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(255,79,0,0.35)'
              }}>
                <Zap size={isMobile ? 14 : 15} fill="#fffefb" />
              </div>
              <span style={{
                fontWeight: 700,
                fontSize: isMobile ? '13.5px' : '15px',
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {isMobile ? 'Stock Studio' : 'Stock Video Studio'}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: isMobile ? '10px' : '11px',
                fontWeight: 600,
                color: mptStatus === 'online' ? '#10b981' : '#f59e0b',
                background: mptStatus === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                padding: isMobile ? '1px 6px' : '2px 8px',
                borderRadius: '999px',
                border: `1px solid ${mptStatus === 'online' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                flexShrink: 0
              }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: mptStatus === 'online' ? '#10b981' : '#f59e0b',
                  boxShadow: mptStatus === 'online' ? '0 0 6px #10b981' : 'none'
                }} />
                {mptStatus === 'online' ? 'Ready' : 'Connecting'}
              </span>
            </div>

            {/* Right: Automate Button + Frame Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', flexShrink: 0 }}>
              {/* ⚡ AUTOMATE BUTTON ── The centerpiece requested feature */}
              <button
                type="button"
                onClick={() => {
                  setIsAutomationOpen(true);
                  setAutoStatusMsg('');
                }}
                className="btn-zapier-primary"
                style={{
                  padding: isMobile ? '6px 10px' : '6px 14px',
                  fontSize: isMobile ? '11.5px' : '12.5px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  gap: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: automationConfig?.status === 'ACTIVE'
                    ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                    : 'linear-gradient(135deg, #a855f7 0%, #ff4f00 100%)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: automationConfig?.status === 'ACTIVE'
                    ? '0 0 12px rgba(16, 185, 129, 0.45)'
                    : '0 2px 10px rgba(168, 85, 247, 0.35)',
                  cursor: 'pointer',
                  minHeight: isMobile ? '36px' : 'auto',
                  touchAction: 'manipulation'
                }}
              >
                <Sparkles size={13} fill="#fff" />
                <span>{automationConfig?.status === 'ACTIVE' ? '⚡ Autopilot: Active' : '⚡ Automate'}</span>
                {automationConfig?.upcomingTopics?.length > 0 && (
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    fontWeight: 800
                  }}>
                    {automationConfig.upcomingTopics.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={checkHealth}
                disabled={isCheckingConnection}
                title="Reload Studio Frame"
                className="btn-zapier-outline"
                style={{
                  padding: isMobile ? '6px 8px' : '6px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  gap: '5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  minHeight: isMobile ? '36px' : 'auto',
                  touchAction: 'manipulation'
                }}
              >
                <RefreshCw size={13} className={isCheckingConnection ? 'spin-anim' : ''} />
                {!isMobile && <span>Reload</span>}
              </button>

              <a
                href={fullWindowUrl}
                target="_blank"
                rel="noreferrer"
                title="Open Studio in Full Window"
                className="btn-zapier-outline"
                style={{
                  padding: isMobile ? '6px 10px' : '6px 12px',
                  fontSize: isMobile ? '11.5px' : '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  gap: '5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  textDecoration: 'none',
                  minHeight: isMobile ? '36px' : 'auto',
                  touchAction: 'manipulation'
                }}
              >
                <span>{isMobile ? 'App' : 'Full Window'}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* ── Studio Frame Container ── */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            minHeight: isMobile ? 'calc(100dvh - 140px)' : '760px',
            height: isMobile ? 'calc(100dvh - 140px)' : 'auto',
            touchAction: 'pan-y',
            position: 'relative'
          }}>
            <iframe
              key={`studio-frame-${iframeKey}-${activeTheme}`}
              src={embeddedUrl}
              title="Bang AI Stock Video Studio"
              style={{
                width: '100%',
                height: '100%',
                minHeight: isMobile ? 'calc(100dvh - 140px)' : '760px',
                flex: 1,
                border: 'none',
                display: 'block',
                background: activeTheme === 'light' ? '#fffefb' : '#1a1313',
                touchAction: 'pan-y'
              }}
              allow="camera; microphone; clipboard-write; clipboard-read"
            />
          </div>

        </div>
      </div>

      {/* ── 24-HOUR AUTONOMOUS VIDEO ENGINE MODAL ── */}
      {isAutomationOpen && (
        <div
          onClick={() => setIsAutomationOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              position: 'sticky',
              top: 0,
              background: 'var(--bg-card)',
              zIndex: 3
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚡ Stock Studio 24-Hour Autonomous Autopilot</span>
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Automatically generates videos on your upcoming topics every 24 hours & publishes to your YouTube Channel.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAutomationOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Feedback toast message */}
              {autoStatusMsg && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: autoStatusMsg.startsWith('❌') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  border: autoStatusMsg.startsWith('❌') ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  color: autoStatusMsg.startsWith('❌') ? '#ef4444' : '#10b981',
                  fontSize: '12.5px',
                  fontWeight: 600
                }}>
                  {autoStatusMsg}
                </div>
              )}

              {/* Master Autopilot Switch Banner */}
              <div style={{
                padding: '14px 18px',
                borderRadius: '12px',
                background: automationConfig?.status === 'ACTIVE'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: automationConfig?.status === 'ACTIVE'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: automationConfig?.status === 'ACTIVE' ? '#10b981' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: automationConfig?.status === 'ACTIVE' ? '#10b981' : '#64748b', boxShadow: automationConfig?.status === 'ACTIVE' ? '0 0 8px #10b981' : 'none' }} />
                    <span>Autopilot Status: {automationConfig?.status === 'ACTIVE' ? 'ACTIVE (Running Every 24h)' : 'PAUSED'}</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {automationConfig?.status === 'ACTIVE'
                      ? 'The engine is armed. Every 24 hours, the next topic from your queue will render and auto-upload to your YouTube channel.'
                      : 'Automation is paused. Enable it to begin autonomous 24-hour video generation.'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleAutomation}
                  disabled={savingAuto}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    background: automationConfig?.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                    color: automationConfig?.status === 'ACTIVE' ? '#ef4444' : '#fff'
                  }}
                >
                  {automationConfig?.status === 'ACTIVE' ? '⏸️ Pause Autopilot' : '▶️ Enable Autopilot'}
                </button>
              </div>

              {/* Credit Mode Switcher */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡ Video Rendering Credit Mode</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setAutomationConfig(prev => ({ ...prev, creditMode: 'bang_credits' }))}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: automationConfig.creditMode === 'bang_credits' ? '1px solid #06b6d4' : '1px solid var(--border-subtle)',
                      background: automationConfig.creditMode === 'bang_credits' ? 'rgba(6, 182, 212, 0.12)' : 'transparent'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#06b6d4' }}>⚡ Bang API Credits</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Uses platform system rotated keys for Gemini, ElevenLabs, and Pexels stock footage.
                    </div>
                  </div>

                  <div
                    onClick={() => setAutomationConfig(prev => ({ ...prev, creditMode: 'byok' }))}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: automationConfig.creditMode === 'byok' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                      background: automationConfig.creditMode === 'byok' ? 'rgba(245, 158, 11, 0.12)' : 'transparent'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>🔑 BYOK Keys</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Uses your personal API keys configured in Stock Studio settings.
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Topics Queue */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📋 Upcoming Topics Queue (1 Topic Per Line)</span>
                    <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '10px', background: '#06b6d4', color: '#000', fontWeight: 800 }}>
                      {topicsInput.split('\n').filter(t => t.trim()).length} topics
                    </span>
                  </div>

                  {/* Sample Topic Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleAddSampleTopics('mysteries')}
                      style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      + Mysteries
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSampleTopics('tech')}
                      style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      + Tech
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSampleTopics('facts')}
                      style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      + Facts
                    </button>
                  </div>
                </div>

                <textarea
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  placeholder="Enter video topics for the upcoming days (one per line)...&#10;Example:&#10;Top 5 Unexplained Mysteries of Area 51&#10;Secrets of the Bermuda Triangle Flight 19&#10;Deep Ocean Creatures Stranger Than Aliens"
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    lineHeight: '1.5'
                  }}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  💡 Each day at your scheduled time, the top topic is picked, rendered into high-definition stock footage video, and published to your YouTube channel.
                </div>
              </div>

              {/* YouTube Channel Auto-Upload Settings */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📺 YouTube Auto-Upload Integration</span>
                </div>

                {channels && channels.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {targetChannel?.avatarUrl ? (
                          <img src={targetChannel.avatarUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 800 }}>YT</div>
                        )}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800 }}>{targetChannel?.channelTitle || 'YouTube Channel'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ID: {targetChannel?.channelId || 'Default'}</div>
                        </div>
                      </div>

                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                        Connected
                      </span>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={automationConfig.autoUploadToYouTube !== false}
                        onChange={(e) => setAutomationConfig(prev => ({ ...prev, autoUploadToYouTube: e.target.checked }))}
                        style={{ accentColor: '#ff4f00' }}
                      />
                      <span>Automatically publish rendered video to my YouTube channel without manual confirmation</span>
                    </label>
                  </div>
                ) : (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#ef4444' }}>
                      No connected YouTube channel found. Connect your channel to enable automatic video publishing.
                    </div>
                    {typeof onNavigate === 'function' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAutomationOpen(false);
                          onNavigate('profile');
                        }}
                        style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '6px', background: '#ff0000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Connect Channel →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Applied Video Creation Settings Summary */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎬 Applied Video Configuration</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  <div>Aspect: <strong style={{ color: 'var(--text-primary)' }}>{automationConfig.settings?.video_aspect || '9:16 (Shorts)'}</strong></div>
                  <div>Footage: <strong style={{ color: 'var(--text-primary)' }}>{automationConfig.settings?.video_source || 'pexels'} (Failover Active)</strong></div>
                  <div>LLM: <strong style={{ color: 'var(--text-primary)' }}>{automationConfig.settings?.script_engine || 'gemini'} ({automationConfig.settings?.script_model || 'gemini-2.5-flash'})</strong></div>
                  <div>Voice: <strong style={{ color: 'var(--text-primary)' }}>Aravinda (ElevenLabs)</strong></div>
                  <div>Subtitles: <strong style={{ color: 'var(--text-primary)' }}>{automationConfig.settings?.subtitle_preset || 'mrbeast-viral'}</strong></div>
                  <div>Duration: <strong style={{ color: 'var(--text-primary)' }}>{automationConfig.settings?.duration || 60}s</strong></div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              position: 'sticky',
              bottom: 0,
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              {/* Left: Run Now Button */}
              <button
                type="button"
                onClick={handleTriggerRunNow}
                disabled={triggeringRun || savingAuto}
                className="btn-zapier-outline"
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#06b6d4',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  cursor: 'pointer'
                }}
              >
                <span>{triggeringRun ? '⏳ Dispatching...' : "⚡ Run Today's Topic Now"}</span>
              </button>

              {/* Right: Save & Close */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAutomationOpen(false)}
                  className="btn-zapier-outline"
                  style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAutomation()}
                  disabled={savingAuto}
                  className="btn-zapier-primary"
                  style={{
                    padding: '7px 18px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    background: '#ff4f00',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {savingAuto ? 'Saving...' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
