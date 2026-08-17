import React, { useState } from 'react';
import { Sparkles, Sun, Moon, Zap, User, ArrowRight, Home, ChevronDown, Menu, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleNavClick = (view, anchor = null) => {
    setProfileDropdownOpen(false);
    if (anchor) {
      if (currentView !== 'landing') {
        onNavigate('landing');
        setTimeout(() => {
          const el = document.querySelector(anchor);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.querySelector(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigate(view);
    }
  };

  return (
    <nav style={{
      width: '100%',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'var(--bg-nav)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'all 0.25s ease'
    }}>
      {/* Full-width container */}
      <div style={{
        width: '100%',
        height: '66px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left: Hamburger (in Dashboard) + Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {user && currentView === 'dashboard' && (
            <button
              onClick={() => {
                audioEngine.playSfx('click');
                onToggleSidebar();
              }}
              className="btn-ghost"
              style={{ padding: '8px', borderRadius: '10px' }}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <Menu size={20} />
            </button>
          )}

          {/* Brand Logo */}
          <div 
            onClick={() => handleNavClick(user ? 'dashboard' : 'landing')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'var(--grad-gemini)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)'
            }}>
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="font-display" style={{
                fontWeight: 800,
                fontSize: '20px',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)'
              }}>
                Shorts<span style={{ color: 'var(--accent-primary)' }}>AI</span>
              </span>
              <span className="badge badge-brand" style={{ fontSize: '10px', padding: '2px 7px' }}>
                GEMINI 2.0
              </span>
            </div>
          </div>

          {/* Model Selector Pill (when inside dashboard) */}
          {user && currentView === 'dashboard' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              padding: '5px 12px',
              borderRadius: '99px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              fontWeight: 600,
              marginLeft: '4px'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
              <span>Gemini 2.5 Flash + Grok 1.5 Video</span>
            </div>
          )}
        </div>

        {/* Center Navigation */}
        {!user ? (
          /* Public Navigation Links */
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => handleNavClick('landing')}
              className="btn-ghost"
              style={{ color: currentView === 'landing' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('landing', '#features')}
              className="btn-ghost"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick('landing', '#showcase')}
              className="btn-ghost"
            >
              Showcase
            </button>
            <button
              onClick={() => handleNavClick('pricing')}
              className="btn-ghost"
              style={{ color: currentView === 'pricing' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              Pricing
            </button>
            <button
              onClick={() => handleNavClick('api')}
              className="btn-ghost"
              style={{ color: currentView === 'api' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              API Docs
            </button>
          </div>
        ) : (
          /* Creator Studio Navigation Pills */
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-card)', padding: '4px', borderRadius: '99px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => handleNavClick('dashboard')}
              style={{
                padding: '5px 14px',
                borderRadius: '99px',
                border: 'none',
                background: currentView === 'dashboard' ? 'var(--grad-primary)' : 'transparent',
                color: currentView === 'dashboard' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: currentView === 'dashboard' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Studio
            </button>

            <button
              onClick={() => handleNavClick('profile')}
              style={{
                padding: '5px 14px',
                borderRadius: '99px',
                border: 'none',
                background: currentView === 'profile' ? 'var(--grad-primary)' : 'transparent',
                color: currentView === 'profile' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: currentView === 'profile' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Profile
            </button>

            <button
              onClick={() => handleNavClick('settings')}
              style={{
                padding: '5px 14px',
                borderRadius: '99px',
                border: 'none',
                background: currentView === 'settings' ? 'var(--grad-primary)' : 'transparent',
                color: currentView === 'settings' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: currentView === 'settings' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Settings
            </button>

            <button
              onClick={() => handleNavClick('api')}
              style={{
                padding: '5px 14px',
                borderRadius: '99px',
                border: 'none',
                background: currentView === 'api' ? 'var(--grad-primary)' : 'transparent',
                color: currentView === 'api' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: currentView === 'api' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              API Docs
            </button>

            <button
              onClick={() => handleNavClick('pricing')}
              style={{
                padding: '5px 14px',
                borderRadius: '99px',
                border: 'none',
                background: currentView === 'pricing' ? 'var(--grad-primary)' : 'transparent',
                color: currentView === 'pricing' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: currentView === 'pricing' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Plans
            </button>
          </div>
        )}

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          {/* Credits Badge (When Logged in) */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '5px 12px',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: 700
            }}>
              <Zap size={13} fill="#34d399" />
              <span>{user.credits || 100} Credits</span>
            </div>
          )}

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              onToggleTheme();
            }}
            className="btn-outline"
            style={{
              width: '38px',
              height: '38px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#6366f1" />}
          </button>

          {/* User Auth or Profile Dropdown */}
          {!user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => handleNavClick('login')}
                className="btn-ghost"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavClick('register')}
                className="btn-glow"
                style={{ padding: '9px 18px', fontSize: '13px' }}
              >
                <span>Get Started</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 10px 4px 4px',
                  borderRadius: '99px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'var(--grad-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  color: '#ffffff'
                }}>
                  {user.name ? user.name[0].toUpperCase() : 'A'}
                </div>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  {user.name?.split(' ')[0] || 'Alex'}
                </span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </div>

              {/* Profile Dropdown Popover */}
              {profileDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '200px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '14px',
                  padding: '6px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 100
                }}>
                  <button
                    onClick={() => handleNavClick('profile')}
                    className="btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12.5px' }}
                  >
                    <User size={15} />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('settings')}
                    className="btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12.5px' }}
                  >
                    <SettingsIcon size={15} />
                    <span>Studio Settings</span>
                  </button>
                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12.5px', color: '#ef4444' }}
                  >
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
