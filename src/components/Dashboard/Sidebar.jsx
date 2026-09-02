import React, { useState } from 'react';
import {
  Plus, Sparkles, MessageSquare, ChevronLeft, ChevronRight,
  Settings, LogOut, Search, Trash2, Video, Film, Clock,
  CheckCircle2, AlertCircle, XCircle, Loader2, Zap,
  Mic2, Music, Type, X, ChevronDown
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

const STATUS_CONFIG = {
  COMPLETED:                { color: '#10b981', icon: CheckCircle2, label: '✓' },
  SCENES_READY_FOR_APPROVAL:{ color: '#06b6d4', icon: Film,        label: '🎬' },
  READY_FOR_APPROVAL:       { color: '#6366f1', icon: Zap,         label: '⚡' },
  GENERATING_SCENES:        { color: '#f59e0b', icon: Loader2,     label: '⏳' },
  GENERATING:               { color: '#f59e0b', icon: Loader2,     label: '⏳' },
  RENDERING_VIDEO:          { color: '#f59e0b', icon: Loader2,     label: '🎥' },
  CANCELLED:                { color: '#64748b', icon: XCircle,     label: '✕' },
  WORKFLOW_INACTIVE:        { color: '#ef4444', icon: AlertCircle, label: '!' },
  CHAT:                     { color: '#94a3b8', icon: MessageSquare, label: '💬' },
};

function ThreadStatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: '#475569' };
  return (
    <div style={{
      width: '7px', height: '7px', borderRadius: '50%',
      background: cfg.color, flexShrink: 0,
      boxShadow: `0 0 6px ${cfg.color}88`
    }} />
  );
}

export default function Sidebar({
  pastShorts = [], activeShortId, onSelectShort, onNewShort,
  onDeleteShort, collapsed = false, onToggleCollapse,
  user, onOpenSettings, onLogout,
  currentRoutePath = 'dashboard',
  onNavigate,
  isMobileDrawer = false, onCloseDrawer
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const [studioOpen, setStudioOpen] = useState(true);

  // Real plan label instead of a hardcoded "Pro Plan" string.
  const planLabel = (() => {
    const raw = String(user?.plan || user?.tier || user?.subscription || '').trim();
    if (!raw) return user ? 'Free Plan' : 'Not signed in';
    return /plan/i.test(raw) ? raw : `${raw.charAt(0).toUpperCase()}${raw.slice(1)} Plan`;
  })();

  const filtered = (Array.isArray(pastShorts) ? pastShorts : []).filter(s =>
    s && typeof s === 'object' &&
    String(s.name || s.title || s.rawUserInput || '').toLowerCase()
      .includes(String(searchQuery || '').toLowerCase())
  );

  const navigateTo = (path) => {
    audioEngine.playSfx('click');
    if (typeof onNavigate === 'function') {
      onNavigate(path);
    } else {
      window.location.hash = `#/${path}`;
    }
  };

  const isCurrent = (path) => currentRoutePath === path || currentRoutePath.startsWith(path + '/');

  // ── COLLAPSED MODE ────────────────────────────────────────────────
  if (collapsed) {
    return (
      <aside style={{
        width: 'var(--sidebar-w-collapsed, 60px)',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 0 14px 0',
        height: 'calc(100dvh - var(--nav-h, 58px))',
        transition: 'width var(--dur-slow, 0.25s) var(--ease, cubic-bezier(0.16,1,0.3,1))',
        flexShrink: 0, zIndex: 110, overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%', padding: '0 10px' }}>
          {/* New Short */}
          <button onClick={() => { audioEngine.playSfx('click'); onNewShort(); }}
            style={{
              width: '40px', height: '40px', borderRadius: '12px', padding: 0,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.4)', marginBottom: '2px'
            }} title="New Video" aria-label="Create New Video">
            <Plus size={18} color="#fff" strokeWidth={2.5} />
          </button>

          {/* Design Studio Quick Links — Collapsed */}
          <button
            onClick={() => navigateTo('studio/voices')}
            title="Voices Studio"
            aria-label="Voices Studio"
            aria-current={currentRoutePath === 'studio/voices' ? 'page' : undefined}
            style={{
              width: '38px', height: '38px', borderRadius: '10px', padding: 0,
              background: currentRoutePath === 'studio/voices' ? 'rgba(16,185,129,0.18)' : 'transparent',
              border: `1.5px solid ${currentRoutePath === 'studio/voices' ? '#10b981' : 'var(--border-subtle)'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: currentRoutePath === 'studio/voices' ? '#10b981' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Mic2 size={16} />
          </button>

          <button
            onClick={() => navigateTo('studio/subtitles')}
            title="Subtitles Studio"
            aria-label="Subtitles Studio"
            aria-current={currentRoutePath === 'studio/subtitles' ? 'page' : undefined}
            style={{
              width: '38px', height: '38px', borderRadius: '10px', padding: 0,
              background: currentRoutePath === 'studio/subtitles' ? 'rgba(245,158,11,0.18)' : 'transparent',
              border: `1.5px solid ${currentRoutePath === 'studio/subtitles' ? '#f59e0b' : 'var(--border-subtle)'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: currentRoutePath === 'studio/subtitles' ? '#f59e0b' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Type size={16} />
          </button>

          <button
            onClick={() => navigateTo('studio/music')}
            title="Music Library"
            aria-label="Music Library"
            aria-current={currentRoutePath === 'studio/music' ? 'page' : undefined}
            style={{
              width: '38px', height: '38px', borderRadius: '10px', padding: 0,
              background: currentRoutePath === 'studio/music' ? 'rgba(6,182,212,0.18)' : 'transparent',
              border: `1.5px solid ${currentRoutePath === 'studio/music' ? '#06b6d4' : 'var(--border-subtle)'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: currentRoutePath === 'studio/music' ? '#06b6d4' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Music size={16} />
          </button>

          <div style={{ width: '32px', height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

          {filtered.slice(0, 6).map(s => {
            const isActive = activeShortId === s.id || activeShortId === s.threadId;
            return (
              <button key={s.id || s.threadId} title={s.name || s.title || s.rawUserInput}
                aria-label={s.name || s.title || s.rawUserInput || 'History Thread'}
                onClick={() => { audioEngine.playSfx('click'); onSelectShort(s.id || s.threadId); }}
                style={{
                  width: '38px', height: '38px', borderRadius: '10px', padding: 0,
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: `1.5px solid ${isActive ? 'rgba(99,102,241,0.6)' : 'transparent'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease', color: isActive ? '#6366f1' : 'var(--text-muted)'
                }}>
                <MessageSquare size={16} />
              </button>
            );
          })}
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '0 10px' }}>
          <button onClick={onToggleCollapse} title="Expand sidebar" aria-label="Expand sidebar"
            style={{
              width: '36px', height: '36px', borderRadius: '10px', padding: 0, background: 'transparent',
              border: '1px solid var(--border-subtle)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', transition: 'all 0.15s ease'
            }}>
            <ChevronRight size={16} />
          </button>
          <button onClick={onOpenSettings} title={user?.name || 'Profile'} aria-label="User Profile & Settings"
            style={{
              width: '32px', height: '32px', borderRadius: '50%', padding: 0, border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 800, color: '#fff', cursor: 'pointer'
            }}>
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </button>
        </div>
      </aside>
    );
  }

  // ── EXPANDED MODE ─────────────────────────────────────────────────
  return (
    <aside style={{
      width: 'var(--sidebar-w, 240px)',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '0',
      height: 'calc(100dvh - var(--nav-h, 58px))',
      transition: 'width var(--dur-slow, 0.25s) var(--ease, cubic-bezier(0.16,1,0.3,1))',
      flexShrink: 0, position: 'relative', zIndex: 110
    }}>

      {/* Top Controls */}
      <div style={{ padding: '14px 12px 0 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* New Short Button */}
        <button onClick={() => { audioEngine.playSfx('click'); onNewShort(); }}
          aria-label="Create New Video"
          style={{
            width: '100%', padding: '9px 14px',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: 'none', borderRadius: '12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            color: '#fff', fontWeight: 700, fontSize: '13px',
            fontFamily: 'Space Grotesk, sans-serif',
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.35)'; }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Plus size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <span>New Video</span>
        </button>

        {/* ─── DESIGN STUDIO NAVIGATION GROUP ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(0,0,0,0.15)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '2px 6px', fontSize: '10.5px', fontWeight: 800,
            color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={12} color="#10b981" />
              <span>Design Studio</span>
            </div>
            <span style={{ fontSize: '9px', background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '1px 5px', borderRadius: '4px' }}>SANDBOX</span>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('studio/voices')}
            aria-label="Voices Studio"
            aria-current={currentRoutePath === 'studio/voices' ? 'page' : undefined}
            style={{
              width: '100%', padding: '7px 10px',
              background: currentRoutePath === 'studio/voices' ? 'rgba(16,185,129,0.15)' : 'transparent',
              border: `1px solid ${currentRoutePath === 'studio/voices' ? 'rgba(16,185,129,0.4)' : 'transparent'}`,
              borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              color: currentRoutePath === 'studio/voices' ? '#34d399' : 'var(--text-secondary)',
              fontSize: '12.5px', fontWeight: currentRoutePath === 'studio/voices' ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <Mic2 size={14} color={currentRoutePath === 'studio/voices' ? '#34d399' : '#10b981'} />
            <span>Voice Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('studio/subtitles')}
            aria-label="Subtitle Studio"
            aria-current={currentRoutePath === 'studio/subtitles' ? 'page' : undefined}
            style={{
              width: '100%', padding: '7px 10px',
              background: currentRoutePath === 'studio/subtitles' ? 'rgba(245,158,11,0.15)' : 'transparent',
              border: `1px solid ${currentRoutePath === 'studio/subtitles' ? 'rgba(245,158,11,0.4)' : 'transparent'}`,
              borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              color: currentRoutePath === 'studio/subtitles' ? '#fbbf24' : 'var(--text-secondary)',
              fontSize: '12.5px', fontWeight: currentRoutePath === 'studio/subtitles' ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <Type size={14} color={currentRoutePath === 'studio/subtitles' ? '#fbbf24' : '#f59e0b'} />
            <span>Subtitles</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('studio/music')}
            aria-label="Music Library"
            aria-current={currentRoutePath === 'studio/music' ? 'page' : undefined}
            style={{
              width: '100%', padding: '7px 10px',
              background: currentRoutePath === 'studio/music' ? 'rgba(6,182,212,0.15)' : 'transparent',
              border: `1px solid ${currentRoutePath === 'studio/music' ? 'rgba(6,182,212,0.4)' : 'transparent'}`,
              borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              color: currentRoutePath === 'studio/music' ? '#38bdf8' : 'var(--text-secondary)',
              fontSize: '12.5px', fontWeight: currentRoutePath === 'studio/music' ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <Music size={14} color={currentRoutePath === 'studio/music' ? '#38bdf8' : '#06b6d4'} />
            <span>Music Library</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input type="text" placeholder="Search history..."
            aria-label="Search video history"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)', borderRadius: '10px',
              padding: '7px 10px 7px 30px', fontSize: '12px',
              color: 'var(--text-primary)', outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
          />
        </div>

        {/* History Label */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 4px', fontSize: '10.5px', fontWeight: 700,
          color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em'
        }}>
          <span>History</span>
          {pastShorts.length > 0 && (
            <span style={{
              fontSize: '10px', background: 'rgba(99,102,241,0.15)',
              color: 'var(--accent-primary)', padding: '1px 6px',
              borderRadius: '99px', fontWeight: 700
            }}>{pastShorts.length}</span>
          )}
        </div>
      </div>

      {/* Scrollable Thread List */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '4px 12px 8px 12px',
        display: 'flex', flexDirection: 'column', gap: '2px'
      }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: '24px 12px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={16} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {searchQuery ? 'No results found' : 'No videos yet.\nStart creating!'}
            </div>
          </div>
        ) : (
          filtered.map(s => {
            const id = s.threadId || s.id;
            const isActive = activeShortId === id;
            const isHovered = hoveredId === id;
            const label = s.name || s.title || s.rawUserInput || 'Untitled Video';
            return (
              <button key={id}
                type="button"
                aria-label={`Open history: ${label}`}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => { audioEngine.playSfx('click'); onSelectShort(id); }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))'
                    : isHovered ? 'var(--bg-card-hover)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(99,102,241,0.35)' : 'transparent'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: '8px', transition: 'all 0.15s ease', textAlign: 'left'
                }}>
                <ThreadStatusDot status={s.status} />
                <span style={{
                  flex: 1, fontSize: '12.5px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  lineHeight: 1.4
                }}>
                  {label}
                </span>
                {(isHovered || isActive) && typeof onDeleteShort === 'function' && (
                  <button onClick={e => { e.stopPropagation(); audioEngine.playSfx('click'); onDeleteShort(id); }}
                    aria-label="Delete video thread"
                    style={{
                      background: 'transparent', border: 'none', padding: '2px',
                      cursor: 'pointer', borderRadius: '4px', flexShrink: 0,
                      color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                    <Trash2 size={12} />
                  </button>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Bottom User Card */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-sidebar)',
        display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between'
      }}>
        <button onClick={onOpenSettings} aria-label="Open Settings and Profile" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          cursor: 'pointer', overflow: 'hidden', flex: 1,
          padding: '5px 6px', borderRadius: '10px', transition: 'background 0.15s ease',
          background: 'transparent', border: 'none', textAlign: 'left'
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '11px', color: '#fff'
          }}>
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || user?.email?.split('@')[0] || 'Creator'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{planLabel}</div>
          </div>
        </button>

        {isMobileDrawer && typeof onCloseDrawer === 'function' ? (
          <button onClick={onCloseDrawer} title="Close menu" aria-label="Close menu"
            className="icon-btn"
            style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'transparent', border: '1px solid var(--border-subtle)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', flexShrink: 0
            }}>
            <X size={16} />
          </button>
        ) : (
          <button onClick={onToggleCollapse} title="Collapse sidebar" aria-label="Collapse sidebar"
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'transparent', border: '1px solid var(--border-subtle)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', flexShrink: 0, transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            <ChevronLeft size={15} />
          </button>
        )}
      </div>
    </aside>
  );
}
