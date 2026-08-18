import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Sun, Moon, Zap, User, ArrowRight,
  ChevronDown, Menu, LogOut, Settings as SettingsIcon,
  Video, LayoutDashboard
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

export default function Navbar({
  theme, onToggleTheme, currentView, onNavigate,
  user, onLogout, sidebarCollapsed, onToggleSidebar
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (view, anchor = null) => {
    setProfileOpen(false);
    audioEngine.playSfx('click');
    if (anchor) {
      if (currentView !== 'landing') {
        onNavigate('landing');
        setTimeout(() => {
          document.querySelector(anchor)?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      } else {
        document.querySelector(anchor)?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigate(view);
    }
  };

  const NavPill = ({ label, view, anchor }) => {
    const active = !anchor && currentView === view;
    return (
      <button onClick={() => go(view, anchor)} style={{
        padding: '6px 15px', borderRadius: '99px', border: 'none', cursor: 'pointer',
        background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
        color: active ? '#fff' : 'var(--text-secondary)',
        fontSize: '13px', fontWeight: active ? 700 : 500,
        transition: 'all 0.15s ease', fontFamily: 'Space Grotesk, sans-serif',
        boxShadow: active ? '0 2px 12px rgba(99,102,241,0.4)' : 'none'
      }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}>
        {label}
      </button>
    );
  };

  return (
    <nav style={{
      width: '100%', position: 'sticky', top: 0, zIndex: 200,
      background: 'var(--bg-nav)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'all 0.25s ease'
    }}>
      <div style={{
        width: '100%', height: '58px', padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
      }}>

        {/* ── LEFT: Hamburger + Brand ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {user && currentView === 'dashboard' && (
            <button onClick={() => { audioEngine.playSfx('click'); onToggleSidebar(); }}
              style={{
                width: '34px', height: '34px', borderRadius: '10px', padding: 0,
                background: 'transparent', border: '1px solid var(--border-subtle)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
              <Menu size={17} />
            </button>
          )}

          {/* Logo */}
          <div onClick={() => go(user ? 'dashboard' : 'landing')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#6366f1 0%,#38bdf8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99,102,241,0.45)', flexShrink: 0
            }}>
              <Sparkles size={17} color="#fff" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800,
                fontSize: '18px', letterSpacing: '-0.03em', color: 'var(--text-primary)'
              }}>
                Shorts<span style={{ color: '#6366f1' }}>AI</span>
              </span>
              <span style={{
                fontSize: '9px', fontWeight: 800, letterSpacing: '0.05em',
                background: 'linear-gradient(135deg,#6366f1,#38bdf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase'
              }}>Studio</span>
            </div>
          </div>

          {/* Live model pill — dashboard only */}
          {user && currentView === 'dashboard' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.25)',
              padding: '4px 10px', borderRadius: '99px', marginLeft: '2px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', whiteSpace: 'nowrap' }}>
                Claude 4.6 + n8n Cloud
              </span>
            </div>
          )}
        </div>

        {/* ── CENTER: Navigation ────────────────────────────────────── */}
        {!user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-card)', padding: '4px', borderRadius: '99px', border: '1px solid var(--border-subtle)' }}>
            <NavPill label="Home" view="landing" />
            <NavPill label="Features" view="landing" anchor="#features" />
            <NavPill label="Showcase" view="landing" anchor="#showcase" />
            <NavPill label="Pricing" view="pricing" />
            <NavPill label="API" view="api" />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-card)', padding: '4px', borderRadius: '99px', border: '1px solid var(--border-subtle)' }}>
            <NavPill label="Studio" view="dashboard" />
            <NavPill label="Profile" view="profile" />
            <NavPill label="Settings" view="settings" />
            <NavPill label="API" view="api" />
            <NavPill label="Plans" view="pricing" />
          </div>
        )}

        {/* ── RIGHT: Controls ───────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Credits */}
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              padding: '5px 11px', borderRadius: '99px'
            }}>
              <Zap size={12} fill="#6366f1" color="#6366f1" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8' }}>
                {user.credits ?? 100} Credits
              </span>
            </div>
          )}

          {/* Theme Toggle */}
          <button onClick={() => { audioEngine.playSfx('click'); onToggleTheme(); }}
            style={{
              width: '34px', height: '34px', borderRadius: '10px', padding: 0,
              background: 'transparent', border: '1px solid var(--border-subtle)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            {theme === 'dark'
              ? <Sun size={16} color="#fbbf24" />
              : <Moon size={16} color="#6366f1" />}
          </button>

          {/* Auth Buttons or Profile */}
          {!user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => go('login')} style={{
                padding: '7px 14px', borderRadius: '99px', border: '1px solid var(--border-medium)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease', fontFamily: 'Space Grotesk, sans-serif'
              }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-medium)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                Sign In
              </button>
              <button onClick={() => go('register')} style={{
                padding: '7px 16px', borderRadius: '99px', border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                transition: 'all 0.2s ease', fontFamily: 'Space Grotesk, sans-serif'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.55)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)'; }}>
                <span>Get Started</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <div onClick={() => setProfileOpen(p => !p)} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '4px 10px 4px 4px', borderRadius: '99px',
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                cursor: 'pointer', transition: 'all 0.15s ease'
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366f1,#ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '11px', color: '#fff'
                }}>
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {(user.name || user.email?.split('@')[0] || 'Creator').split(' ')[0]}
                </span>
                <ChevronDown size={13} color="var(--text-muted)"
                  style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
              </div>

              {profileOpen && (
                <div style={{
                  position: 'absolute', top: '46px', right: 0, width: '210px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                  borderRadius: '16px', padding: '6px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)', zIndex: 300,
                  animation: 'fadeSlideUp 0.2s ease'
                }}>
                  {/* User info row */}
                  <div style={{ padding: '10px 12px 10px 10px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#6366f1,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', color: '#fff' }}>
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'Creator'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    </div>
                  </div>

                  {[
                    { icon: User, label: 'My Profile', view: 'profile' },
                    { icon: SettingsIcon, label: 'Settings', view: 'settings' },
                    { icon: LayoutDashboard, label: 'Studio', view: 'dashboard' },
                  ].map(({ icon: Icon, label, view }) => (
                    <button key={view} onClick={() => go(view)} style={{
                      width: '100%', padding: '9px 12px', border: 'none', background: 'transparent',
                      borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px',
                      cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)',
                      fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, transition: 'all 0.12s ease'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                      <Icon size={15} />
                      <span>{label}</span>
                    </button>
                  ))}

                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 0' }} />
                  <button onClick={() => { setProfileOpen(false); onLogout(); }} style={{
                    width: '100%', padding: '9px 12px', border: 'none', background: 'transparent',
                    borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: 'pointer', fontSize: '13px', color: '#f87171',
                    fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, transition: 'all 0.12s ease'
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
