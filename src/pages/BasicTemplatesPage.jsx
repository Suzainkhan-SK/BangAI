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

  // Read authenticated user's JWT token & theme
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token') || user?.token || '')
    : (user?.token || '');

  const activeTheme = theme || (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'dark') || 'dark';

  const activeCluster = MODAL_CLUSTERS.find(c => c.id === activeClusterId) || MODAL_CLUSTERS[0];
  const baseUrl = useCloudEnv ? activeCluster.uiUrl : LOCAL_MPT_URL;
  const embeddedUrl = `${baseUrl}/?token=${encodeURIComponent(token)}&theme=${encodeURIComponent(activeTheme)}&embedded=1`;
  const fullWindowUrl = `${baseUrl}/?token=${encodeURIComponent(token)}&theme=${encodeURIComponent(activeTheme)}`;

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
        padding: isMobile ? '10px 10px 18px 10px' : '16px 20px 24px 20px',
        overflowY: isMobile ? 'visible' : 'auto',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* ── Top Header Toolbar (Minimalist Design) ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? '10px' : '12px',
            padding: isMobile ? '10px 12px' : '12px 18px',
            marginBottom: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-card)'
          }}>
            {/* Left: Minimalist Brand Title & Live Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: '#ff4f00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fffefb',
                boxShadow: '0 2px 8px rgba(255,79,0,0.35)'
              }}>
                <Zap size={14} fill="#fffefb" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Stock Video Studio
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                color: mptStatus === 'online' ? '#10b981' : '#f59e0b',
                background: mptStatus === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                padding: '2px 8px',
                borderRadius: '999px',
                border: `1px solid ${mptStatus === 'online' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: mptStatus === 'online' ? '#10b981' : '#f59e0b',
                  boxShadow: mptStatus === 'online' ? '0 0 6px #10b981' : 'none'
                }} />
                {mptStatus === 'online' ? 'Ready' : 'Connecting'}
              </span>
            </div>

            {/* Right: Actions (Reload & Full Window CTA) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={checkHealth}
                disabled={isCheckingConnection}
                title="Reload Studio Frame"
                className="btn-zapier-outline"
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  gap: '5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={12} className={isCheckingConnection ? 'spin-anim' : ''} />
                <span>Reload</span>
              </button>

              <a
                href={fullWindowUrl}
                target="_blank"
                rel="noreferrer"
                title="Open Studio in Full Window"
                className="btn-zapier-primary"
                style={{
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  gap: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#ff4f00',
                  color: '#fffefb',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(255, 79, 0, 0.3)'
                }}
              >
                <span>Full Window</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* ── Studio Frame Container (Zapier 12px Card) ── */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            minHeight: isMobile ? 'calc(100dvh - 180px)' : '760px'
          }}>
            <iframe
              key={`studio-frame-${iframeKey}-${activeTheme}`}
              src={embeddedUrl}
              title="Bang AI Stock Video Studio"
              style={{
                width: '100%',
                height: '100%',
                minHeight: isMobile ? 'calc(100dvh - 180px)' : '760px',
                flex: 1,
                border: 'none',
                display: 'block',
                background: activeTheme === 'light' ? '#fffefb' : '#1a1313'
              }}
              allow="camera; microphone; clipboard-write; clipboard-read"
            />
          </div>

        </div>
      </div>
    </AppShell>
  );
}
