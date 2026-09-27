import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Sun, Moon, Zap, User, ArrowRight,
  ChevronDown, Menu, LogOut, Settings as SettingsIcon,
  Video, LayoutDashboard, X, PanelLeft, Film, Bot,
  Mic2, Type, Music, Code2, CreditCard
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { useBreakpoint, useBodyScrollLock } from '../hooks/useMediaQuery';

export default function Navbar({
  theme,
  onToggleTheme,
  currentView,
  onNavigate,
  user,
  onLogout,
  sidebarCollapsed,
  onToggleSidebar
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

  // Close mobile nav when switching to desktop
  useEffect(() => {
    if (!isMobile && mobileNavOpen) setMobileNavOpen(false);
  }, [isMobile, mobileNavOpen]);

  // Escape closes sheets
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMobileNavOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  // Streamlined 4 core primary items for clean minimal navbar
  const PRIMARY_LINKS = user
    ? [
        { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
        { label: 'AI Templates', view: 'templates', icon: Zap, badge: '75S' },
        { label: 'Stock Studio', view: 'basic-templates', icon: Film, badge: 'STOCK' },
        { label: 'Chat', view: 'chat', icon: Bot, badge: '4.0' },
      ]
    : [
        { label: 'Home', view: 'landing' },
        { label: 'Features', view: 'landing', anchor: '#features' },
        { label: 'Showcase', view: 'landing', anchor: '#showcase' },
        { label: 'Pricing', view: 'pricing' },
      ];

  const isLight = theme === 'light';

  return (
    <>
      {/* Mobile Scrim */}
      {isMobile && mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 'var(--nav-h, 58px)',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 190,
            animation: 'ds-overlay-in 0.18s ease'
          }}
        />
      )}

      <nav style={{
        width: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.07)',
        transition: 'background 0.2s ease, border-color 0.2s ease'
      }}>
        <div style={{
          width: '100%',
          height: 'var(--nav-h, 58px)',
          padding: isMobile ? '0 12px' : '0 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isMobile ? '8px' : '12px'
        }}>

          {/* ── LEFT: Sidebar Toggle + Brand Logo ─────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, minWidth: 0 }}>
            {user && !isMobile && typeof onToggleSidebar === 'function' && (
              <button
                type="button"
                onClick={() => { audioEngine.playSfx('click'); onToggleSidebar(); }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  padding: 0,
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                title={sidebarCollapsed ? 'Open Sidebar (Ctrl+B)' : 'Close Sidebar (Ctrl+B)'}
                aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
              >
                <PanelLeft size={16} />
              </button>
            )}

            {/* Logo */}
            <div
              onClick={() => go(user ? 'dashboard' : 'landing')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px rgba(99,102,241,0.4)',
                flexShrink: 0
              }}>
                <Sparkles size={16} color="#fff" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 900,
                  fontSize: '19px',
                  letterSpacing: '-0.03em',
                  color: 'var(--text-primary)'
                }}>
                  Bang
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textTransform: 'uppercase'
                }}>
                  AI
                </span>
              </div>
            </div>

            {/* Subtle Live Model Dot (Dashboard only) */}
            {user && (currentView === 'dashboard' || currentView.startsWith('dashboard/')) && !isTablet && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: isLight ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
                padding: '3px 8px',
                borderRadius: '99px',
                marginLeft: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', whiteSpace: 'nowrap' }}>
                  Claude 4.6 + n8n
                </span>
              </div>
            )}
          </div>

          {/* ── CENTER: Minimal 4-Pill Navigation ─────────────────── */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
              padding: '3px 4px',
              borderRadius: '99px',
              border: '1px solid var(--border-subtle)'
            }}>
              {PRIMARY_LINKS.map(link => {
                const isPathMatch = link.view && (currentView === link.view || currentView.startsWith(link.view.split('/')[0] + '/'));
                const active = !link.anchor && (currentView === link.view || isPathMatch);
                const Icon = link.icon;

                return (
                  <button
                    key={`${link.view}-${link.label}`}
                    type="button"
                    onClick={() => go(link.view, link.anchor)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '99px',
                      border: 'none',
                      cursor: 'pointer',
                      background: active
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'transparent',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      fontSize: '12.5px',
                      fontWeight: active ? 700 : 500,
                      transition: 'all 0.15s ease',
                      fontFamily: 'Space Grotesk, sans-serif',
                      boxShadow: active ? '0 2px 10px rgba(99,102,241,0.35)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {Icon && <Icon size={13} color={active ? '#fff' : 'currentColor'} />}
                    <span>{link.label}</span>
                    {link.badge && (
                      <span style={{
                        fontSize: '8.5px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '99px',
                        background: active ? 'rgba(255,255,255,0.22)' : 'rgba(99,102,241,0.18)',
                        color: active ? '#fff' : '#818cf8',
                        letterSpacing: '0.04em'
                      }}>
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── RIGHT: Credits + Theme + Profile ──────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Credits badge */}
            {user && !isTablet && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)',
                padding: '4px 9px',
                borderRadius: '99px'
              }}>
                <Zap size={11} fill="#6366f1" color="#6366f1" />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#818cf8' }}>
                  {user.credits ?? 100}
                </span>
              </div>
            )}

            {/* Theme Toggle (Sun/Moon) */}
            <button
              type="button"
              onClick={() => { audioEngine.playSfx('click'); onToggleTheme(); }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                padding: 0,
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun size={15} color="#fbbf24" />
              ) : (
                <Moon size={15} color="#6366f1" />
              )}
            </button>

            {/* Unauthenticated: Sign In / Register */}
            {!user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!isMobile && (
                  <button
                    type="button"
                    onClick={() => go('login')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '99px',
                      border: '1px solid var(--border-medium)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontFamily: 'Space Grotesk, sans-serif'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    Sign In
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => go('register')}
                  style={{
                    padding: isMobile ? '6px 12px' : '6px 14px',
                    borderRadius: '99px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 3px 12px rgba(99,102,241,0.35)',
                    transition: 'all 0.18s ease',
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span>{isMobile ? 'Start' : 'Get Started'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              /* Authenticated: Minimal Profile Avatar & Dropdown */
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => setProfileOpen(p => !p)}
                  role="button"
                  tabIndex={0}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  aria-label="Account menu"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileOpen(p => !p); } }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: isMobile ? '3px' : '3px 8px 3px 3px',
                    borderRadius: '99px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '11px',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  {!isMobile && (
                    <>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(user.name || user.email?.split('@')[0] || 'Creator').split(' ')[0]}
                      </span>
                      <ChevronDown
                        size={12}
                        color="var(--text-muted)"
                        style={{
                          transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)',
                          transition: 'transform 0.18s ease'
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Profile Floating Card with Secondary Tools */}
                {profileOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '42px',
                    right: 0,
                    width: '220px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '14px',
                    padding: '6px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
                    zIndex: 300,
                    animation: 'fadeSlideUp 0.18s ease'
                  }}>
                    {/* User info */}
                    <div style={{
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      borderBottom: '1px solid var(--border-subtle)',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '12px',
                        color: '#fff'
                      }}>
                        {(user.name || user.email || 'U')[0].toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden', minWidth: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.name || 'Creator'}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>

                    {/* Secondary Navigation Group (Design Studios) */}
                    <div style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--text-muted)', padding: '4px 8px 2px 8px', letterSpacing: '0.04em' }}>
                      DESIGN STUDIOS
                    </div>
                    {[
                      { icon: Mic2, label: 'Voice Matrix', view: 'studio/voices' },
                      { icon: Type, label: 'Subtitle Studio', view: 'studio/subtitles' },
                      { icon: Music, label: 'Music Library', view: 'studio/music' },
                    ].map(({ icon: Icon, label, view }) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => go(view)}
                        style={{
                          width: '100%',
                          padding: '7px 9px',
                          border: 'none',
                          background: 'transparent',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          fontFamily: 'Space Grotesk, sans-serif',
                          fontWeight: 500,
                          transition: 'all 0.12s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        <Icon size={14} color="#818cf8" />
                        <span>{label}</span>
                      </button>
                    ))}

                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

                    {/* Account Links */}
                    {[
                      { icon: User, label: 'Profile', view: 'profile' },
                      { icon: SettingsIcon, label: 'Settings', view: 'settings' },
                      { icon: Code2, label: 'API Keys & Docs', view: 'api' },
                      { icon: CreditCard, label: 'Plans & Pricing', view: 'pricing' },
                    ].map(({ icon: Icon, label, view }) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => go(view)}
                        style={{
                          width: '100%',
                          padding: '7px 9px',
                          border: 'none',
                          background: 'transparent',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          fontFamily: 'Space Grotesk, sans-serif',
                          fontWeight: 500,
                          transition: 'all 0.12s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        <Icon size={14} />
                        <span>{label}</span>
                      </button>
                    ))}

                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

                    {/* Sign out */}
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); onLogout(); }}
                      style={{
                        width: '100%',
                        padding: '7px 9px',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: '#f87171',
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontWeight: 600,
                        transition: 'all 0.12s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Button */}
            {isMobile && (
              <button
                type="button"
                onClick={() => { audioEngine.playSfx('click'); setMobileNavOpen(o => !o); }}
                aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileNavOpen}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  padding: 0,
                  background: mobileNavOpen ? 'var(--bg-card)' : 'transparent',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                  flexShrink: 0
                }}
              >
                {mobileNavOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
            )}
          </div>
        </div>

        {/* ── MOBILE NAV DRAWER ────────────────────────────────────── */}
        {isMobile && mobileNavOpen && (
          <div
            role="menu"
            aria-label="Site navigation"
            style={{
              position: 'absolute',
              top: 'var(--nav-h, 58px)',
              left: 0,
              right: 0,
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-medium)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              padding: '10px 12px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: 'calc(100dvh - var(--nav-h, 58px))',
              overflowY: 'auto',
              zIndex: 210,
              animation: 'fadeSlideUp 0.18s ease'
            }}
          >
            {user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                marginBottom: '4px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '12px',
                    color: '#fff'
                  }}>
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name || user.email?.split('@')[0] || 'Creator'}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  </div>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.28)',
                  padding: '3px 8px',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#818cf8'
                }}>
                  <Zap size={11} fill="#6366f1" color="#6366f1" />
                  {user.credits ?? 100}
                </span>
              </div>
            )}

            {PRIMARY_LINKS.map(link => {
              const isPathMatch = link.view && (currentView === link.view || currentView.startsWith(link.view.split('/')[0] + '/'));
              const active = !link.anchor && (currentView === link.view || isPathMatch);
              return (
                <button
                  key={`m-${link.view}-${link.label}`}
                  type="button"
                  role="menuitem"
                  onClick={() => go(link.view, link.anchor)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: active ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))' : 'transparent',
                    border: `1px solid ${active ? 'rgba(99,102,241,0.35)' : 'transparent'}`,
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '13.5px',
                    fontWeight: active ? 700 : 500,
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}
                >
                  {link.label}
                </button>
              );
            })}

            {user && (
              <>
                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 2px' }} />
                {[
                  { label: 'Voice Matrix', view: 'studio/voices' },
                  { label: 'Subtitle Studio', view: 'studio/subtitles' },
                  { label: 'Music Library', view: 'studio/music' },
                  { label: 'Profile', view: 'profile' },
                  { label: 'Settings', view: 'settings' },
                  { label: 'API Keys', view: 'api' },
                ].map(item => (
                  <button
                    key={`m-sub-${item.view}`}
                    type="button"
                    onClick={() => go(item.view)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '12.5px',
                      fontFamily: 'Space Grotesk, sans-serif',
                      cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </>
            )}

            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 2px' }} />

            {!user ? (
              <button
                type="button"
                onClick={() => go('login')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  fontFamily: 'Space Grotesk, sans-serif'
                }}
              >
                Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setMobileNavOpen(false); onLogout(); }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'Space Grotesk, sans-serif'
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
