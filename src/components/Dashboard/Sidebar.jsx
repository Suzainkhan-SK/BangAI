import React, { useState } from 'react';
import { 
  Plus, 
  History, 
  Sparkles, 
  CheckCircle, 
  Settings, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Activity,
  LogOut,
  MoreVertical,
  Search,
  Zap,
  Crown,
  Trash2
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function Sidebar({
  pastShorts = [],
  activeShortId,
  onSelectShort,
  onNewShort,
  collapsed = false,
  onToggleCollapse,
  user,
  onOpenSettings,
  onLogout
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShorts = pastShorts.filter((s) => 
    (s.name || s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (collapsed) {
    return (
      <aside style={{
        width: '68px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 8px',
        height: 'calc(100vh - 66px)',
        transition: 'all 0.25s ease',
        flexShrink: 0,
        zIndex: 20
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              onNewShort();
            }}
            className="btn-glow"
            style={{ width: '44px', height: '44px', padding: 0, borderRadius: '14px', justifyContent: 'center' }}
            title="New 75s Short"
          >
            <Plus size={22} />
          </button>

          {pastShorts.slice(0, 5).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                audioEngine.playSfx('click');
                onSelectShort(s.id);
              }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: activeShortId === s.id ? 'var(--bg-card-hover)' : 'transparent',
                border: `1px solid ${activeShortId === s.id ? 'var(--accent-primary)' : 'transparent'}`,
                color: activeShortId === s.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={s.name || s.title}
            >
              <MessageSquare size={16} />
            </button>
          ))}
        </div>

        {/* Bottom Expand Toggle + Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onToggleCollapse()}
            className="btn-ghost"
            style={{ width: '36px', height: '36px', padding: 0, justifyContent: 'center' }}
            title="Expand Sidebar"
          >
            <ChevronRight size={18} />
          </button>

          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '13px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
            title={user?.name || 'Alex Rivera'}
          >
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside style={{
      width: '280px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '16px 12px',
      height: 'calc(100vh - 66px)',
      overflowY: 'auto',
      transition: 'all 0.25s ease',
      flexShrink: 0,
      position: 'relative',
      zIndex: 20
    }}>
      {/* Top Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Gemini + New Short Pill Button */}
        <button
          onClick={() => {
            audioEngine.playSfx('click');
            onNewShort();
          }}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: '99px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--text-primary)',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--grad-gemini)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Plus size={14} color="#ffffff" strokeWidth={3} />
          </div>
          <span>New 75s Short</span>
        </button>

        {/* Quick Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
          <input
            type="text"
            placeholder="Search creations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 10px 6px 30px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Recent Generations List */}
        <div>
          <div style={{
            fontSize: '10.5px',
            color: 'var(--text-muted)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Recent Generations</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{filteredShorts.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
            {filteredShorts.map((short) => {
              const isActive = activeShortId === short.id;
              return (
                <div
                  key={short.id}
                  onClick={() => {
                    audioEngine.playSfx('click');
                    onSelectShort(short.id);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isActive ? 'var(--bg-card-hover)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--accent-primary)' : 'transparent'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--border-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <MessageSquare size={13} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                    <span style={{
                      fontSize: '12.5px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {short.name || short.title}
                    </span>
                  </div>

                  {isActive && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Connected Channel + Credits + Profile Card */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '12px'
      }}>
        {/* Connected YouTube Channel indicator */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#ef4444">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                YouTube Channel
              </div>
              <div style={{ fontSize: '9.5px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <CheckCircle size={9} />
                Auto-Publish Ready
              </div>
            </div>
          </div>
        </div>

        {/* Gemini Real Profile Card */}
        <div
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '12px',
              color: '#ffffff',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)'
            }}>
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{user?.name || 'Alex Rivera'}</span>
                <Crown size={11} color="#f59e0b" fill="#f59e0b" />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                ShortsAI Pro Plan
              </div>
            </div>
          </div>
          <MoreVertical size={15} color="var(--text-muted)" />
        </div>

        {/* Profile Popover Menu */}
        {showProfileMenu && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            <button
              onClick={() => {
                setShowProfileMenu(false);
                onOpenSettings();
              }}
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 8px', fontSize: '12px' }}
            >
              <Settings size={14} />
              <span>Studio Settings</span>
            </button>
            <button
              onClick={() => {
                setShowProfileMenu(false);
                onLogout();
              }}
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 8px', fontSize: '12px', color: '#ef4444' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
