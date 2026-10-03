import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Sun, Moon, Zap, User, ArrowRight,
  ChevronDown, Menu, LogOut, Settings as SettingsIcon,
  Video, LayoutDashboard, X, PanelLeft, Film, Bot,
  Mic2, Type, Music, Code2, CreditCard, Image as ImageIcon
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

  // Streamlined primary items with Thumbnail Studio
  const PRIMARY_LINKS = user
    ? [
        { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
        { label: 'AI Templates', view: 'templates', icon: Zap, badge: 'PRO' },
        { label: 'Stock Studio', view: 'basic-templates', icon: Film, badge: 'STOCK' },
        { label: 'Thumbnail Studio', view: 'thumbnails', icon: ImageIcon, badge: 'HOT' },
        { label: 'Chat', view: 'chat', icon: Bot, badge: '4.5' },
      ]
    : [
        { label: 'Home', view: 'landing' },
        { label: 'AI Chat', view: 'chat', icon: Bot, badge: '4.5' },
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
        background: isLight ? 'rgba(255, 254, 251, 0.96)' : 'rgba(26, 19, 19, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: isLight ? '1px solid #c5c0b1' : '1px solid rgba(255, 255, 255, 0.12)',
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

          {/* ── LEFT: Brand Logo ─────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, minWidth: 0 }}>
            {/* Logo (Zapier Clean Warm Brand) */}
            <div
              onClick={() => go(user ? 'dashboard' : 'landing')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: '#ff4f00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(255,79,0,0.35)',
                flexShrink: 0
              }}>
                <Zap size={15} color="#fffefb" fill="#fffefb" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: '18px',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)'
                }}>
                  Bang AI
                </span>
              </div>
            </div>

            {/* Zapier Eyebrow Tag */}
            {user && (currentView === 'dashboard' || currentView.startsWith('dashboard/')) && !isTablet && (
              <span className="zapier-badge-eyebrow" style={{ fontSize: '10px' }}>
                AUTOMATION
              </span>
            )}
          </div>

          {/* ── CENTER: Zapier Segmented Navigation Tabs ─────────────────── */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              background: isLight ? '#f8f4f0' : '#201717',
              padding: '3px 4px',
              borderRadius: '10px',
              border: isLight ? '1px solid #c5c0b1' : '1px solid rgba(255, 255, 255, 0.12)'
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
                      padding: '5px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      background: active
                        ? (isLight ? '#201515' : '#ff4f00')
                        : 'transparent',
                      color: active
                        ? '#fffefb'
                        : (isLight ? '#605d52' : '#c5c0b1'),
                      fontSize: '13px',
                      fontWeight: active ? 600 : 500,
                      transition: 'all 0.15s ease',
                      fontFamily: "'Inter', sans-serif",
                      boxShadow: active ? '0 1px 4px rgba(0, 0, 0, 0.15)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = isLight ? '#201515' : '#fffefb'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = isLight ? '#605d52' : '#c5c0b1'; }}
                  >
                    {Icon && <Icon size={13} color={active ? '#fffefb' : 'currentColor'} />}
                    <span>{link.label}</span>
                    {link.badge && (
                      <span style={{
                        fontSize: '9.5px',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '6px',
                        background: active
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(255, 79, 0, 0.15)',
                        color: active
                          ? '#fffefb'
                          : '#ff4f00',
                        letterSpacing: '0.02em'
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
            {/* Credits badge (Zapier 8px pill) */}
            {user && !isTablet && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: isLight ? '#f8f4f0' : '#251c1c',
                border: isLight ? '1px solid #c5c0b1' : '1px solid rgba(255,255,255,0.12)',
                padding: '4px 10px',
                borderRadius: '8px'
              }}>
                <Zap size={11} fill="#ff4f00" color="#ff4f00" />
                <span style={{ fontSize: '12px', fontFamily: "'Inter', sans-serif", fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.credits ?? 100}
                </span>
              </div>
            )}

            {/* Theme Toggle (Zapier 8px Button) */}
            <button
              type="button"
              onClick={() => { audioEngine.playSfx('click'); onToggleTheme(); }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                padding: 0,
                background: isLight ? '#f8f4f0' : '#251c1c',
                border: isLight ? '1px solid #c5c0b1' : '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isLight ? '#c5c0b1' : 'rgba(255,255,255,0.12)'; }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun size={15} color="#fbbf24" />
              ) : (
                <Moon size={15} color="#201515" />
              )}
            </button>

            {/* Unauthenticated: Sign In / Register (Zapier 10px Rounded Buttons) */}
            {!user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!isMobile && (
                  <button
                    type="button"
                    onClick={() => go('login')}
                    className="btn-zapier-outline"
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      borderRadius: '10px'
                    }}
                  >
                    Sign In
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => go('register')}
                  className="btn-zapier-primary"
                  style={{
                    padding: isMobile ? '6px 14px' : '7px 18px',
                    fontSize: '13px',
                    borderRadius: '10px'
                  }}
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
                      { icon: ImageIcon, label: 'Thumbnail Studio', view: 'thumbnails' },
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
                  { label: 'Thumbnail Studio', view: 'thumbnails' },
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
