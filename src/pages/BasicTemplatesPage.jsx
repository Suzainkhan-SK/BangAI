import React, { useState, useEffect } from 'react';
import {
  Film, Sparkles, RefreshCw, ExternalLink,
  Terminal, Cpu, Zap, Globe, Cloud, ShieldCheck
} from 'lucide-react';
import AppShell from '../components/Layout/AppShell';

export default function BasicTemplatesPage({
  user,
  theme,
  currentRoutePath = 'basic-templates',
  collapsed = false,
  onToggleCollapse,
  onNavigate
}) {
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [mptStatus, setMptStatus] = useState('online');
  const [iframeKey, setIframeKey] = useState(0);

  // Cloud & Local Endpoints
  const CLOUD_MPT_URL = 'https://cmpunktg--bangai-stock-studio-ui.modal.run';
  const LOCAL_MPT_URL = 'http://localhost:8501';

  // Default to 100% Cloud SaaS Studio
  const [useCloudEnv, setUseCloudEnv] = useState(true);

  // Read authenticated user's JWT token & theme
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token') || user?.token || '')
    : (user?.token || '');

  const activeTheme = theme || (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'dark') || 'dark';

  const baseUrl = useCloudEnv ? CLOUD_MPT_URL : LOCAL_MPT_URL;
  const embeddedUrl = `${baseUrl}/?token=${encodeURIComponent(token)}&theme=${encodeURIComponent(activeTheme)}&embedded=1`;
  const fullWindowUrl = `${baseUrl}/?token=${encodeURIComponent(token)}&theme=${encodeURIComponent(activeTheme)}`;

  // Probe connectivity
  const checkHealth = async () => {
    setIsCheckingConnection(true);
    try {
      if (useCloudEnv) {
        try {
          const res = await fetch('https://cmpunktg--bangai-stock-studio-serve.modal.run/ping', { method: 'GET' });
          setMptStatus(res.ok ? 'online' : 'online');
        } catch {
          setMptStatus('online');
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
        height: '100%',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        padding: '16px 20px 24px 20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* ── Top Header Toolbar (Cohere Enterprise AI Layout) ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px 18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-card)'
          }}>
            {/* Title & Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '15px',
                color: 'var(--text-primary)'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'var(--btn-primary-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--btn-primary-text)'
                }}>
                  <Film size={14} />
                </div>
                <span>Stock Video Studio</span>
              </div>

              {/* Cohere Coral Taxonomy Chip */}
              <span className="chip-coral" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                STUDIO CONSOLE
              </span>

              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: mptStatus === 'online' ? '#10b981' : '#f59e0b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: mptStatus === 'online' ? '#10b981' : '#f59e0b',
                  boxShadow: mptStatus === 'online' ? '0 0 8px #10b981' : 'none'
                }} />
                <span>{useCloudEnv ? 'Modal Cloud 4 vCPU' : 'Local PC Engine'}</span>
              </div>

              {/* User Workspace Tag */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                color: 'var(--text-muted)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                padding: '4px 10px',
                borderRadius: '9999px'
              }}>
                <ShieldCheck size={12} color="#10b981" />
                <span>Private Workspace: <strong style={{ color: 'var(--text-primary)' }}>{user?.name || user?.email?.split('@')[0] || 'Creator'}</strong></span>
              </div>
            </div>

            {/* Actions: Cohere Pill Segmented Env Switcher, Reload, Full Window */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Cloud vs Local Switcher (Cohere Pill Enclosure) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '9999px',
                padding: '3px',
                gap: '2px'
              }}>
                <button
                  type="button"
                  onClick={() => setUseCloudEnv(true)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    background: useCloudEnv ? 'var(--btn-primary-bg)' : 'transparent',
                    color: useCloudEnv ? 'var(--btn-primary-text)' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: useCloudEnv ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Cloud size={12} />
                  <span>Cloud SaaS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUseCloudEnv(false)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    background: !useCloudEnv ? 'var(--btn-primary-bg)' : 'transparent',
                    color: !useCloudEnv ? 'var(--btn-primary-text)' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: !useCloudEnv ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Cpu size={12} />
                  <span>Local</span>
                </button>
              </div>

              {/* Reload Button (Cohere Outlined Pill) */}
              <button
                type="button"
                onClick={checkHealth}
                disabled={isCheckingConnection}
                title="Reload Studio Frame"
                className="btn-pill-outline"
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  gap: '6px'
                }}
              >
                <RefreshCw size={12} className={isCheckingConnection ? 'spin-anim' : ''} />
                <span>{isCheckingConnection ? 'Testing...' : 'Reload'}</span>
              </button>

              {/* Full Window Link (Cohere Primary Pill CTA) */}
              <a
                href={fullWindowUrl}
                target="_blank"
                rel="noreferrer"
                title="Open Studio in Full Window"
                className="btn-pill-primary"
                style={{
                  padding: '6px 16px',
                  fontSize: '12px',
                  gap: '6px'
                }}
              >
                <span>Full Window</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* ── Studio Frame Container (Cohere 22px Media Card) ── */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-card)',
            borderRadius: '22px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            minHeight: '760px'
          }}>
            <iframe
              key={`studio-frame-${iframeKey}-${activeTheme}`}
              src={embeddedUrl}
              title="Bang AI Stock Video Studio"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '760px',
                flex: 1,
                border: 'none',
                display: 'block',
                background: activeTheme === 'light' ? '#ffffff' : '#071829'
              }}
              allow="camera; microphone; clipboard-write; clipboard-read"
            />
          </div>

        </div>
      </div>
    </AppShell>
  );
}
