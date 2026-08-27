import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Sun, Moon, Zap, User, ArrowRight,
  ChevronDown, Menu, LogOut, Settings as SettingsIcon,
  Video, LayoutDashboard, X, PanelLeft
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { useBreakpoint, useBodyScrollLock } from '../hooks/useMediaQuery';

export default function Navbar({
  theme, onToggleTheme, currentView, onNavigate,
  user, onLogout, sidebarCollapsed, onToggleSidebar
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isMobile, isTablet } = useBreakpoint();
  useBodyScrollLock(mobileNavOpen);

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

  // Never leave the mobile sheet open after growing to desktop
  useEffect(() => {
    if (!isMobile && mobileNavOpen) setMobileNavOpen(false);
  }, [isMobile, mobileNavOpen]);

  // Escape closes the mobile sheet
  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMobileNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  const go = (view, anchor = null) => {
    setProfileOpen(false);
    setMobileNavOpen(false);
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

  const NAV_LINKS = user
    ? [
        { label: 'Studio', view: 'dashboard' },
        { label: 'Profile', view: 'profile' },
        { label: 'Settings', view: 'settings' },
        { label: 'API', view: 'api' },
        { label: 'Plans', view: 'pricing' },
      ]
    : [
        { label: 'Home', view: 'landing' },
        { label: 'Features', view: 'landing', anchor: '#features' },
        { label: 'Showcase', view: 'landing', anchor: '#showcase' },
        { label: 'Pricing', view: 'pricing' },
        { label: 'API', view: 'api' },
      ];

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
    <>
    {/* Scrim lives OUTSIDE <nav>: the navbar's backdrop-filter makes it a
        containing block, which would clamp a position:fixed child to 58px. */}
    {isMobile && mobileNavOpen && (
      <div
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 'var(--nav-h, 58px)',
          left: 0, right: 0, bottom: 0,
          background: 'var(--scrim, rgba(0,0,0,0.6))',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          zIndex: 190,
          animation: 'ds-overlay-in 0.18s ease'
        }}
      />
    )}
    <nav style={{
      width: '100%', position: 'sticky', top: 0, zIndex: 200,
      background: 'var(--bg-nav)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'all 0.25s ease'
    }}>
      <div style={{
        width: '100%', height: 'var(--nav-h, 58px)',
        padding: isMobile ? '0 12px' : '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? '8px' : '12px'
      }}>

        {/* ── LEFT: Hamburger + Brand ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, minWidth: 0 }}>
          {user && currentView === 'dashboard' && !isMobile && (
            <button onClick={() => { audioEngine.playSfx('click'); onToggleSidebar(); }}
              style={{
                width: '34px', height: '34px', borderRadius: '10px', padding: 0,
                background: 'transparent', border: '1px solid var(--border-subtle)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <PanelLeft size={17} />
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
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900,
                fontSize: '20px', letterSpacing: '-0.03em', color: 'var(--text-primary)'
              }}>
                Bang
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em',
                background: 'linear-gradient(135deg,#6366f1,#38bdf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase'
              }}>AI</span>
            </div>
          </div>

          {/* Live model pill — dashboard only, desktop only */}
          {user && currentView === 'dashboard' && !isTablet && (
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

        {/* ── CENTER: Navigation (collapses into the mobile sheet) ──── */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '2px',
            background: 'var(--bg-card)', padding: '4px', borderRadius: '99px',
            border: '1px solid var(--border-subtle)',
            maxWidth: '100%', overflowX: 'auto', scrollbarWidth: 'none'
          }}>
            {NAV_LINKS.map(link => (
              <NavPill key={`${link.view}-${link.label}`} label={link.label} view={link.view} anchor={link.anchor} />
            ))}
          </div>
        )}

        {/* ── RIGHT: Controls ───────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Credits */}
          {user && !isTablet && (
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
              {!isMobile && (
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
              )}
              <button onClick={() => go('register')} style={{
                padding: isMobile ? '7px 13px' : '7px 16px', borderRadius: '99px', border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                transition: 'all 0.2s ease', fontFamily: 'Space Grotesk, sans-serif'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.55)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)'; }}>
                <span>{isMobile ? 'Start' : 'Get Started'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <div onClick={() => setProfileOpen(p => !p)}
                role="button"
                tabIndex={0}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Account menu"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileOpen(p => !p); } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: isMobile ? '4px' : '4px 10px 4px 4px', borderRadius: '99px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366f1,#ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '11px', color: '#fff', flexShrink: 0
                }}>
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
                {!isMobile && (
                  <>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {(user.name || user.email?.split('@')[0] || 'Creator').split(' ')[0]}
                    </span>
                    <ChevronDown size={13} color="var(--text-muted)"
                      style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
                  </>
                )}
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

          {/* Mobile menu trigger — replaces the center pill rail on phones */}
          {isMobile && (
            <button
              onClick={() => { audioEngine.playSfx('click'); setMobileNavOpen(o => !o); }}
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileNavOpen}
              style={{
                width: '36px', height: '36px', borderRadius: '11px', padding: 0,
                background: mobileNavOpen ? 'var(--bg-card)' : 'transparent',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-primary)', flexShrink: 0
              }}
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE NAV SHEET ─────────────────────────────────────────── */}
      {isMobile && mobileNavOpen && (
        <div
          role="menu"
          aria-label="Site navigation"
          style={{
              position: 'absolute', top: 'var(--nav-h, 58px)', left: 0, right: 0,
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-xl, 0 24px 60px rgba(0,0,0,0.45))',
              padding: '10px 12px calc(14px + var(--safe-b, 0px))',
              display: 'flex', flexDirection: 'column', gap: '4px',
              maxHeight: 'calc(100dvh - var(--nav-h, 58px))', overflowY: 'auto',
              zIndex: 210, animation: 'fadeSlideUp 0.18s ease'
            }}
          >
            {user && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '10px', padding: '10px 12px', marginBottom: '4px',
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg,#6366f1,#ec4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '13px', color: '#fff'
                  }}>
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {user.name || user.email?.split('@')[0] || 'Creator'}
                    </div>
                    <div className="truncate" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                  background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.28)',
                  padding: '4px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, color: '#818cf8'
                }}>
                  <Zap size={11} fill="#6366f1" color="#6366f1" />
                  {user.credits ?? 100}
                </span>
              </div>
            )}

            {NAV_LINKS.map(link => {
              const active = !link.anchor && currentView === link.view;
              return (
                <button
                  key={`m-${link.view}-${link.label}`}
                  role="menuitem"
                  onClick={() => go(link.view, link.anchor)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 14px',
                    borderRadius: '12px', cursor: 'pointer',
                    background: active ? 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))' : 'transparent',
                    border: `1px solid ${active ? 'rgba(99,102,241,0.35)' : 'transparent'}`,
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '14.5px', fontWeight: active ? 700 : 500,
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}
                >
                  {link.label}
                </button>
              );
            })}

            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 2px' }} />

            {!user ? (
              <button onClick={() => go('login')} style={{
                width: '100%', padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700,
                fontFamily: 'Space Grotesk, sans-serif'
              }}>
                Sign In
              </button>
            ) : (
              <button onClick={() => { setMobileNavOpen(false); onLogout(); }} style={{
                width: '100%', padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171', fontSize: '14px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: 'Space Grotesk, sans-serif'
              }}>
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
      )}
    </nav>
    </>
  );
}
