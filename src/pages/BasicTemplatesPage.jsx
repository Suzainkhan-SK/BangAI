import React, { useState, useEffect } from 'react';
import {
  Film, Sparkles, RefreshCw, ExternalLink,
  Terminal, Cpu, Zap, Globe, Cloud, ShieldCheck
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

  const activeTheme = theme || (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'dark') || 'dark';

  const activeCluster = MODAL_CLUSTERS.find(c => c.id === activeClusterId) || MODAL_CLUSTERS[0];
  const baseUrl = useCloudEnv ? activeCluster.uiUrl : LOCAL_MPT_URL;
  const embeddedUrl = `${baseUrl}/?token=${encodeURIComponent(token)}&user_id=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}&theme=${encodeURIComponent(activeTheme)}&embedded=1`;
  const fullWindowUrl = `${baseUrl}/?token=${encodeURIComponent(token)}&user_id=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}&theme=${encodeURIComponent(activeTheme)}`;

  // Probe connectivity with silent automatic backend failover
  const checkHealth = async () => {
    setIsCheckingConnection(true);
    try {
      if (useCloudEnv) {
        // 1. First probe primary cluster (cmpunktg)
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
          // Primary unreachable or out of credits -> silent failover to Backup cluster (cmpunktg1)
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
        minHeight: '100%',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        padding: isMobile ? '8px 8px 12px 8px' : '12px 16px 20px 16px',
        overflowY: isMobile ? 'visible' : 'auto',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* ── Top Header Toolbar: Desktop intact, Mobile sleek & minimalist ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: isMobile ? 'nowrap' : 'nowrap',
            gap: isMobile ? '8px' : '12px',
            padding: isMobile ? '7px 12px' : '10px 16px',
            marginBottom: isMobile ? '6px' : '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-card)'
          }}>
            {/* Left: Brand Title & Live Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '7px' : '10px', minWidth: 0 }}>
              <div style={{
                width: isMobile ? '26px' : '28px',
                height: isMobile ? '26px' : '28px',
                borderRadius: '8px',
                background: '#ff4f00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fffefb',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(255,79,0,0.35)'
              }}>
                <Zap size={isMobile ? 13 : 14} fill="#fffefb" />
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

            {/* Right: Actions (Reload & Full Window CTA) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', flexShrink: 0 }}>
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
                className="btn-zapier-primary"
                style={{
                  padding: isMobile ? '6px 10px' : '6px 14px',
                  fontSize: isMobile ? '11.5px' : '12.5px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  gap: '5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#ff4f00',
                  color: '#fffefb',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(255, 79, 0, 0.3)',
                  minHeight: isMobile ? '36px' : 'auto',
                  touchAction: 'manipulation'
                }}
              >
                <span>{isMobile ? 'App Mode' : 'Full Window'}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* ── Studio Frame Container: Touch-safe on mobile, desktop intact ── */}
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
    </AppShell>
  );
}
