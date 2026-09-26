import React, { useState, useEffect, useRef } from 'react';
import {
  Film, Sparkles, Play, RefreshCw, ExternalLink, CheckCircle2,
  AlertTriangle, Terminal, Cpu, Zap, Settings, Globe, Shield,
  ArrowRight, Video, Layers, Volume2, HelpCircle
} from 'lucide-react';
import AppShell from '../components/Layout/AppShell';

export default function BasicTemplatesPage({
  user,
  currentRoutePath = 'basic-templates',
  collapsed = false,
  onToggleCollapse,
  onNavigate
}) {
  const [activeEngine, setActiveEngine] = useState('mpt'); // 'mpt' | 'agenttube'
  const [topicInput, setTopicInput] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [voiceLang, setVoiceLang] = useState('en');
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [mptStatus, setMptStatus] = useState('unknown'); // 'online' | 'offline' | 'unknown'
  const [agentTubeStatus, setAgentTubeStatus] = useState('unknown');
  const [activeIframeUrl, setActiveIframeUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Default local ports
  const MPT_URL = 'http://localhost:8501';
  const AGENTTUBE_URL = 'http://localhost:3456';

  // Check connectivity to microservices
  const checkHealth = async () => {
    setIsCheckingConnection(true);
    try {
      // Probe Bang AI Studio (port 8501)
      const controller1 = new AbortController();
      const timeoutId1 = setTimeout(() => controller1.abort(), 2000);
      try {
        await fetch(`${MPT_URL}/_stcore/health`, { method: 'GET', mode: 'no-cors', signal: controller1.signal });
        setMptStatus('online');
      } catch (err) {
        setMptStatus('offline');
      } finally {
        clearTimeout(timeoutId1);
      }

      // Probe AgentTube (port 3456)
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 2000);
      try {
        await fetch(`${AGENTTUBE_URL}/health`, { method: 'GET', mode: 'no-cors', signal: controller2.signal });
        setAgentTubeStatus('online');
      } catch (err) {
        setAgentTubeStatus('offline');
      } finally {
        clearTimeout(timeoutId2);
      }
    } catch (e) {
      console.warn('[BasicTemplates] Health check probe failed:', e);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const currentOnline = activeEngine === 'mpt' ? mptStatus === 'online' : agentTubeStatus === 'online';
  const targetUrl = activeEngine === 'mpt' ? MPT_URL : AGENTTUBE_URL;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('cd BangAI\\MoneyPrinterTurbo && start.bat');
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

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
        flex: 1, width: '100%', minHeight: '100%',
        backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)',
        padding: '32px 28px 80px 28px', overflowY: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* ── Top Header ── */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '3px 10px', borderRadius: '99px',
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                  fontSize: '11px', fontWeight: 700, color: '#10b981'
                }}>
                  <Film size={12} />
                  Stock Footage & Open-Source Engine
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  color: currentOnline ? '#10b981' : '#f59e0b',
                  display: 'inline-flex', alignItems: 'center', gap: '5px'
                }}>
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: currentOnline ? '#10b981' : '#f59e0b',
                    boxShadow: currentOnline ? '0 0 8px #10b981' : 'none'
                  }} />
                  {currentOnline ? 'Engine Connected' : 'Engine Standby'}
                </span>
              </div>

              {/* Refresh / Check Connection Button */}
              <button
                type="button"
                onClick={checkHealth}
                disabled={isCheckingConnection}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                <RefreshCw size={13} className={isCheckingConnection ? 'spin-anim' : ''} />
                <span>{isCheckingConnection ? 'Testing...' : 'Check Connection'}</span>
              </button>
            </div>

            <h1 className="font-display" style={{
              fontSize: 'clamp(24px, 3.2vw, 32px)', fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '0 0 6px 0'
            }}>
              Generic / Basic Templates
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55, maxWidth: '780px' }}>
              Enter any custom topic to generate complete faceless short videos. The engine writes the script, pulls curated stock clips from Pexels/Pixabay, speaks via free neural Edge-TTS, and burns synchronized subtitles.
            </p>
          </div>

          {/* ── Engine Switcher Tabs ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '24px', background: 'var(--bg-card)',
            padding: '6px', borderRadius: '12px', border: '1px solid var(--border-subtle)',
            maxWidth: '540px'
          }}>
            <button
              type="button"
              onClick={() => setActiveEngine('mpt')}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: activeEngine === 'mpt' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'transparent',
                color: activeEngine === 'mpt' ? '#fff' : 'var(--text-secondary)',
                fontWeight: activeEngine === 'mpt' ? 700 : 500, fontSize: '12.5px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                transition: 'all 0.15s ease'
              }}
            >
              <Film size={14} />
              <span>Stock Video Generator</span>
              <span style={{
                fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px',
                background: activeEngine === 'mpt' ? 'rgba(0,0,0,0.25)' : 'rgba(16,185,129,0.15)',
                color: activeEngine === 'mpt' ? '#fff' : '#10b981'
              }}>BANG AI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveEngine('agenttube')}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: activeEngine === 'agenttube' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                color: activeEngine === 'agenttube' ? '#fff' : 'var(--text-secondary)',
                fontWeight: activeEngine === 'agenttube' ? 700 : 500, fontSize: '12.5px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                transition: 'all 0.15s ease'
              }}
            >
              <Zap size={14} />
              <span>Channel Operator</span>
              <span style={{
                fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px',
                background: activeEngine === 'agenttube' ? 'rgba(0,0,0,0.25)' : 'rgba(99,102,241,0.15)',
                color: activeEngine === 'agenttube' ? '#fff' : '#818cf8'
              }}>AGENT</span>
            </button>
          </div>

          {/* ── Main Engine Portal Container ── */}
          {currentOnline ? (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}>
              {/* Toolbar */}
              <div style={{
                padding: '12px 18px', background: 'rgba(0,0,0,0.25)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Globe size={15} color="#10b981" />
                  <span>Connected to <strong>{targetUrl}</strong></span>
                  <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    ACTIVE SESSION
                  </span>
                </div>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '12px', fontWeight: 600, color: '#818cf8',
                    textDecoration: 'none'
                  }}
                >
                  <span>Open Full Window</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Embedded Frame */}
              <iframe
                src={targetUrl}
                title={activeEngine === 'mpt' ? 'Bang AI Video Studio' : 'AgentTube'}
                style={{
                  width: '100%',
                  height: '840px',
                  border: 'none',
                  display: 'block',
                  background: '#0e1117'
                }}
              />
            </div>
          ) : (
            /* ── Engine Standby Card ── */
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              padding: '32px 28px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Terminal size={22} color="#10b981" />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                    {activeEngine === 'mpt' ? 'Start Bang AI Engine' : 'Start AgentTube Service'}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    The repository is installed in your filesystem at <code>BangAI/{activeEngine === 'mpt' ? 'MoneyPrinterTurbo' : 'youtube-automation-agent'}</code>. Launch the process to load the live creation studio right here.
                  </p>
                </div>
              </div>

              {/* Quick Launch Steps */}
              <div style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px', padding: '18px 20px', marginBottom: '24px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  EASY START INSTRUCTIONS (WINDOWS)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      1
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      Double-click the 1-click startup file in your workspace: <br />
                      <strong style={{ color: 'var(--text-primary)' }}>d:\n8n-automation-builder-main\BangAI\start_basic_templates.bat</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      2
                    </span>
                    <div style={{ width: '100%' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        Or run from PowerShell / Terminal:
                      </span>
                      <div style={{
                        marginTop: '6px', background: '#0a0a0f', border: '1px solid var(--border-subtle)',
                        borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '12px', color: '#10b981'
                      }}>
                        <span>cd BangAI\MoneyPrinterTurbo ; .\start.bat</span>
                        <button
                          type="button"
                          onClick={handleCopyCmd}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: copySuccess ? '#10b981' : 'var(--text-muted)', fontSize: '11px', fontWeight: 700
                          }}
                        >
                          {copySuccess ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      3
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      Once the console shows <code>Network URL: http://localhost:8501</code>, click the button below to connect!
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={checkHealth}
                  disabled={isCheckingConnection}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                    color: '#fff', fontWeight: 700, fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                  }}
                >
                  <RefreshCw size={15} className={isCheckingConnection ? 'spin-anim' : ''} />
                  <span>{isCheckingConnection ? 'Detecting Engine...' : 'Check Connection & Connect'}</span>
                </button>

                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '10px 16px', borderRadius: '10px',
                    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none'
                  }}
                >
                  <span>Open {targetUrl} directly</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {/* ── Strategic Architectural Roadmap Notice ── */}
          <div style={{
            marginTop: '32px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(16,185,129,0.06))',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '14px', padding: '20px 24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap size={16} color="#818cf8" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Cloud Deployment Notice
              </h3>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
              The stock video generation studio is fully integrated into Bang AI. All video creation, voice synthesis, Hindi language models, and subtitle burns run through the unified studio engine.
            </p>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
