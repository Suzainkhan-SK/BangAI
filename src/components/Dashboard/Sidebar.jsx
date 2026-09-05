import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Sparkles, MessageSquare, ChevronLeft, ChevronRight,
  Settings, LogOut, Search, Trash2, Video, Film, Clock,
  CheckCircle2, AlertCircle, XCircle, Loader2, Zap,
  Mic2, Music, Type, X, LayoutDashboard, User, CreditCard
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

const STATUS_CONFIG = {
  COMPLETED:                { color: '#10b981', label: 'Completed' },
  SCENES_READY_FOR_APPROVAL:{ color: '#06b6d4', label: 'Scenes Ready' },
  READY_FOR_APPROVAL:       { color: '#6366f1', label: 'Story Review' },
  GENERATING_SCENES:        { color: '#f59e0b', label: 'Generating' },
  GENERATING:               { color: '#f59e0b', label: 'Generating' },
  RENDERING_VIDEO:          { color: '#38bdf8', label: 'Rendering' },
  CANCELLED:                { color: '#64748b', label: 'Cancelled' },
  WORKFLOW_INACTIVE:        { color: '#ef4444', label: 'Failed' },
  EXECUTION_TIMEOUT:        { color: '#f59e0b', label: 'Timed Out' },
  CHAT:                     { color: '#94a3b8', label: 'Chat' },
};

function ThreadStatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: '#475569' };
  const isPulsing = status === 'GENERATING' || status === 'GENERATING_SCENES' || status === 'RENDERING_VIDEO';
  return (
    <div
      style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: cfg.color,
        flexShrink: 0,
        boxShadow: `0 0 6px ${cfg.color}88`,
        animation: isPulsing ? 'pulse 1.5s infinite' : 'none'
      }}
      title={cfg.label || status}
    />
  );
}

function formatRelativeTime(ts) {
  if (!ts) return '';
  const date = typeof ts === 'number' ? new Date(ts) : new Date(String(ts));
  if (isNaN(date.getTime())) return '';
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getThreadTimestamp(thread) {
  if (!thread) return 0;
  if (thread.createdAt) {
    const t = new Date(thread.createdAt).getTime();
    if (!isNaN(t)) return t;
  }
  if (thread.updatedAt) {
    const t = new Date(thread.updatedAt).getTime();
    if (!isNaN(t)) return t;
  }
  const id = String(thread.threadId || thread.id || '');
  const match = id.match(/thread-(\d+)/);
  if (match && match[1]) {
    const t = parseInt(match[1], 10);
    if (!isNaN(t)) return t;
  }
  return 0;
}

export default function Sidebar({
  pastShorts = [],
  activeShortId,
  onSelectShort,
  onNewShort,
  onDeleteShort,
  collapsed = false,
  onToggleCollapse,
  user,
  onOpenSettings,
  onLogout,
  currentRoutePath = 'dashboard',
  onNavigate,
  isMobileDrawer = false,
  onCloseDrawer
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState(null);

  // Close drawer on Escape
  useEffect(() => {
    if (!isMobileDrawer || typeof onCloseDrawer !== 'function') return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCloseDrawer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawer, onCloseDrawer]);

  const planLabel = (() => {
    const raw = String(user?.plan || user?.tier || user?.subscription || '').trim();
    if (!raw) return user ? 'Free Plan' : 'Not signed in';
    return /plan/i.test(raw) ? raw : `${raw.charAt(0).toUpperCase()}${raw.slice(1)} Plan`;
  })();

  const navigateTo = (path) => {
    audioEngine.playSfx('click');
    if (typeof onNavigate === 'function') {
      onNavigate(path);
    } else {
      window.location.hash = `#/${path}`;
    }
  };

  const isItemActive = (path) => {
    if (!path) return currentRoutePath === '';
    if (path === 'dashboard') {
      return currentRoutePath === 'dashboard' || currentRoutePath.startsWith('dashboard/');
    }
    return currentRoutePath === path || currentRoutePath.startsWith(path + '/');
  };

  const handleToggle = () => {
    if (typeof onToggleCollapse === 'function') {
      const next = !collapsed;
      try { localStorage.setItem('bangai_sidebar_collapsed', String(next)); } catch (e) {}
      onToggleCollapse();
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    audioEngine.playSfx('click');
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this video thread? This cannot be undone.')) {
      if (typeof onDeleteShort === 'function') {
        onDeleteShort(id);
      }
    }
  };

  const filtered = useMemo(() => {
    return (Array.isArray(pastShorts) ? pastShorts : []).filter(s =>
      s && typeof s === 'object' &&
      String(s.name || s.title || s.rawUserInput || '').toLowerCase()
        .includes(String(searchQuery || '').toLowerCase())
    );
  }, [pastShorts, searchQuery]);

  // Group threads by time buckets: Today, Yesterday, Previous 7 Days, Older
  const groupedThreads = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const startOfYesterday = startOfToday - oneDay;
    const startOf7Days = startOfToday - (6 * oneDay);

    const groups = {
      today: [],
      yesterday: [],
      last7Days: [],
      older: []
    };

    filtered.forEach(thread => {
      const ts = getThreadTimestamp(thread);
      if (ts >= startOfToday) {
        groups.today.push(thread);
      } else if (ts >= startOfYesterday) {
        groups.yesterday.push(thread);
      } else if (ts >= startOf7Days) {
        groups.last7Days.push(thread);
      } else {
        groups.older.push(thread);
      }
    });

    return [
      { key: 'today', title: 'Today', items: groups.today },
      { key: 'yesterday', title: 'Yesterday', items: groups.yesterday },
      { key: 'last7Days', title: 'Previous 7 Days', items: groups.last7Days },
      { key: 'older', title: 'Older', items: groups.older }
    ].filter(g => g.items.length > 0);
  }, [filtered]);

  // ── COLLAPSED MODE ────────────────────────────────────────────────
  if (collapsed) {
    return (
      <nav
        aria-label="Main"
        style={{
          width: 'var(--sidebar-w-collapsed, 60px)',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0 14px 0',
          height: 'calc(100dvh - var(--nav-h, 58px))',
          transition: 'width var(--dur-slow, 0.25s) var(--ease, cubic-bezier(0.16,1,0.3,1))',
          flexShrink: 0, zIndex: 110, overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%', padding: '0 10px' }}>
          {/* New Short */}
          <button
            type="button"
            onClick={() => { audioEngine.playSfx('click'); if (typeof onNewShort === 'function') onNewShort(); else navigateTo('dashboard'); }}
            style={{
              width: '40px', height: '40px', borderRadius: '12px', padding: 0,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.4)', marginBottom: '4px'
            }}
            title="New Video"
            aria-label="Create New Video"
          >
            <Plus size={18} color="#fff" strokeWidth={2.5} />
          </button>

          {/* Dashboard */}
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            title="Dashboard"
            aria-label="Dashboard"
            aria-current={isItemActive('dashboard') ? 'page' : undefined}
            style={{
              width: '38px', height: '38px', borderRadius: '10px', padding: 0,
              background: isItemActive('dashboard') ? 'rgba(99,102,241,0.18)' : 'transparent',
              border: `1.5px solid ${isItemActive('dashboard') ? '#6366f1' : 'transparent'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isItemActive('dashboard') ? '#818cf8' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <LayoutDashboard size={16} />
          </button>

          <div style={{ width: '32px', height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

          {/* Design Studio Quick Links — Collapsed */}
          <button
            type="button"
            onClick={() => navigateTo('studio/voices')}
            title="Voice Matrix Studio"
            aria-label="Voice Matrix Studio"
            aria-current={isItemActive('studio/voices') ? 'page' : undefined}
            style={{
              width: '38px', height: '38px', borderRadius: '10px', padding: 0,
              background: isItemActive('studio/voices') ? 'rgba(16,185,129,0.18)' : 'transparent',
              border: `1.5px solid ${isItemActive('studio/voices') ? '#10b981' : 'transparent'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isItemActive('studio/voices') ? '#10b981' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Mic2 size={16} />
          </button>

          <button
            type="button"
            onClick={() => navigateTo('studio/subtitles')}
            title="Subtitle Studio"
            aria-label="Subtitle Studio"
            aria-current={isItemActive('studio/subtitles') ? 'page' : undefined}
            style={{
              width: '38px', height: '38px', borderRadius: '10px', padding: 0,
              background: isItemActive('studio/subtitles') ? 'rgba(245,158,11,0.18)' : 'transparent',
              border: `1.5px solid ${isItemActive('studio/subtitles') ? '#f59e0b' : 'transparent'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isItemActive('studio/subtitles') ? '#f59e0b' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Type size={16} />
          </button>

          <button
            type="button"
            onClick={() => navigateTo('studio/music')}
            title="Music Library"
            aria-label="Music Library"
            aria-current={isItemActive('studio/music') ? 'page' : undefined}
            style={{
              width: '38px', height: '38px', borderRadius: '10px', padding: 0,
              background: isItemActive('studio/music') ? 'rgba(6,182,212,0.18)' : 'transparent',
              border: `1.5px solid ${isItemActive('studio/music') ? '#06b6d4' : 'transparent'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isItemActive('studio/music') ? '#06b6d4' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Music size={16} />
          </button>

          <div style={{ width: '32px', height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

          {filtered.slice(0, 6).map(s => {
            const id = s.threadId || s.id;
            const isActive = activeShortId === id || currentRoutePath === 'dashboard/t/' + id;
            const accessibleLabel = s.name || s.title || s.rawUserInput || 'Untitled thread';
            return (
              <button
                key={id}
                type="button"
                title={accessibleLabel}
                aria-label={accessibleLabel}
                onClick={() => {
                  audioEngine.playSfx('click');
                  if (typeof onSelectShort === 'function') onSelectShort(id);
                  else navigateTo('dashboard/t/' + id);
                }}
                style={{
                  width: '38px', height: '38px', borderRadius: '10px', padding: 0,
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: `1.5px solid ${isActive ? 'rgba(99,102,241,0.6)' : 'transparent'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease', color: isActive ? '#6366f1' : 'var(--text-muted)'
                }}
              >
                <MessageSquare size={16} />
              </button>
            );
          })}
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '0 10px' }}>
          <button
            type="button"
            onClick={handleToggle}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            style={{
              width: '36px', height: '36px', borderRadius: '10px', padding: 0, background: 'transparent',
              border: '1px solid var(--border-subtle)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', transition: 'all 0.15s ease'
            }}
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => { if (typeof onOpenSettings === 'function') onOpenSettings(); else navigateTo('settings'); }}
            title={user?.name || 'Profile & Settings'}
            aria-label="User Profile & Settings"
            style={{
              width: '32px', height: '32px', borderRadius: '50%', padding: 0, border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 800, color: '#fff', cursor: 'pointer'
            }}
          >
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </button>
        </div>
      </nav>
    );
  }

  // ── EXPANDED MODE ─────────────────────────────────────────────────
  return (
    <nav
      aria-label="Main"
      style={{
        width: 'var(--sidebar-w, 240px)',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '0',
        height: 'calc(100dvh - var(--nav-h, 58px))',
        transition: 'width var(--dur-slow, 0.25s) var(--ease, cubic-bezier(0.16,1,0.3,1))',
        flexShrink: 0, position: 'relative', zIndex: 110
      }}
    >
      {/* Top Controls */}
      <div style={{ padding: '14px 12px 0 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Primary Action on Top: New Video */}
        <button
          type="button"
          onClick={() => {
            audioEngine.playSfx('click');
            if (typeof onNewShort === 'function') onNewShort();
            else navigateTo('dashboard');
          }}
          aria-label="Create New Video"
          style={{
            width: '100%', padding: '10px 14px',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: 'none', borderRadius: '12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            color: '#fff', fontWeight: 700, fontSize: '13px',
            fontFamily: 'Space Grotesk, sans-serif',
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.35)'; }}
        >
          <div style={{
            width: '22px', height: '22px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Plus size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <span>New Video</span>
        </button>

        {/* ─── GROUP 1: CREATE ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{
            padding: '2px 6px', fontSize: '10px', fontWeight: 800,
            color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>
            CREATE
          </div>
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            aria-label="Dashboard Studio"
            aria-current={isItemActive('dashboard') ? 'page' : undefined}
            style={{
              width: '100%', padding: '7px 10px',
              background: isItemActive('dashboard') ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: `1px solid ${isItemActive('dashboard') ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
              borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              color: isItemActive('dashboard') ? '#818cf8' : 'var(--text-secondary)',
              fontSize: '12.5px', fontWeight: isItemActive('dashboard') ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <LayoutDashboard size={14} color={isItemActive('dashboard') ? '#818cf8' : 'var(--text-muted)'} />
            <span>Dashboard</span>
          </button>
        </div>

        {/* ─── GROUP 2: DESIGN STUDIO ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(0,0,0,0.15)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '2px 6px', fontSize: '10px', fontWeight: 800,
            color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={12} color="#10b981" />
              <span>DESIGN STUDIO</span>
            </div>
            <span style={{ fontSize: '8.5px', background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '1px 5px', borderRadius: '4px' }}>LIVE</span>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('studio/voices')}
            aria-label="Voice Matrix"
            aria-current={isItemActive('studio/voices') ? 'page' : undefined}
            style={{
              width: '100%', padding: '7px 10px',
              background: isItemActive('studio/voices') ? 'rgba(16,185,129,0.15)' : 'transparent',
              border: `1px solid ${isItemActive('studio/voices') ? 'rgba(16,185,129,0.4)' : 'transparent'}`,
              borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              color: isItemActive('studio/voices') ? '#34d399' : 'var(--text-secondary)',
              fontSize: '12.5px', fontWeight: isItemActive('studio/voices') ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <Mic2 size={14} color={isItemActive('studio/voices') ? '#34d399' : '#10b981'} />
            <span>Voice Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('studio/subtitles')}
            aria-label="Subtitle Studio"
            aria-current={isItemActive('studio/subtitles') ? 'page' : undefined}
            style={{
              width: '100%', padding: '7px 10px',
              background: isItemActive('studio/subtitles') ? 'rgba(245,158,11,0.15)' : 'transparent',
              border: `1px solid ${isItemActive('studio/subtitles') ? 'rgba(245,158,11,0.4)' : 'transparent'}`,
              borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              color: isItemActive('studio/subtitles') ? '#fbbf24' : 'var(--text-secondary)',
              fontSize: '12.5px', fontWeight: isItemActive('studio/subtitles') ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <Type size={14} color={isItemActive('studio/subtitles') ? '#fbbf24' : '#f59e0b'} />
            <span>Subtitles</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('studio/music')}
            aria-label="Music Library"
            aria-current={isItemActive('studio/music') ? 'page' : undefined}
            style={{
              width: '100%', padding: '7px 10px',
              background: isItemActive('studio/music') ? 'rgba(6,182,212,0.15)' : 'transparent',
              border: `1px solid ${isItemActive('studio/music') ? 'rgba(6,182,212,0.4)' : 'transparent'}`,
              borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              color: isItemActive('studio/music') ? '#38bdf8' : 'var(--text-secondary)',
              fontSize: '12.5px', fontWeight: isItemActive('studio/music') ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <Music size={14} color={isItemActive('studio/music') ? '#38bdf8' : '#06b6d4'} />
            <span>Music Library</span>
          </button>
        </div>

        {/* ─── GROUP 3: HISTORY ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search history..."
              aria-label="Search video history"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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

          {/* History Header & Status Legend */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 4px', fontSize: '10px', fontWeight: 800,
            color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>
            <span>HISTORY</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} title="Completed" />
              <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#38bdf8' }} title="Rendering" />
              <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b' }} title="Generating" />
              {pastShorts.length > 0 && (
                <span style={{
                  fontSize: '9.5px', background: 'rgba(99,102,241,0.15)',
                  color: 'var(--accent-primary)', padding: '1px 6px',
                  borderRadius: '99px', fontWeight: 700, marginLeft: '4px'
                }}>{pastShorts.length}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Grouped Thread List */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '4px 12px 8px 12px',
        display: 'flex', flexDirection: 'column', gap: '8px'
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
              {searchQuery ? 'No results found' : 'No videos yet — start your first one.'}
            </div>
          </div>
        ) : (
          groupedThreads.map(group => (
            <div key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{
                fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)',
                padding: '4px 6px 2px 6px', textTransform: 'uppercase', letterSpacing: '0.04em'
              }}>
                {group.title}
              </div>
              {group.items.map(s => {
                const id = s.threadId || s.id;
                const isActive = activeShortId === id || currentRoutePath === 'dashboard/t/' + id;
                const isHovered = hoveredId === id;
                const label = s.name || s.title || s.rawUserInput || '—';
                const accessibleLabel = s.name || s.title || s.rawUserInput || 'Untitled thread';
                const timeAgo = formatRelativeTime(getThreadTimestamp(s));

                return (
                  <button
                    key={id}
                    type="button"
                    title={accessibleLabel}
                    aria-label={`Open video thread: ${accessibleLabel}`}
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => {
                      audioEngine.playSfx('click');
                      if (typeof onSelectShort === 'function') onSelectShort(id);
                      else navigateTo('dashboard/t/' + id);
                    }}
                    style={{
                      width: '100%',
                      padding: '7px 8px',
                      borderRadius: '8px',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))'
                        : isHovered ? 'var(--bg-card-hover)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      gap: '7px', transition: 'all 0.12s ease', textAlign: 'left'
                    }}
                  >
                    <ThreadStatusDot status={s.status} />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: isActive ? 700 : 400,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        lineHeight: 1.3
                      }}>
                        {label}
                      </span>
                      {timeAgo && (
                        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                          {timeAgo}
                        </span>
                      )}
                    </div>
                    {(isHovered || isActive) && typeof onDeleteShort === 'function' && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, id)}
                        aria-label="Delete video thread"
                        style={{
                          background: 'transparent', border: 'none', padding: '2px',
                          cursor: 'pointer', borderRadius: '4px', flexShrink: 0,
                          color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                          transition: 'color 0.15s ease'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* ─── GROUP 4: ACCOUNT / USER CARD ─── */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-sidebar)',
        display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between'
      }}>
        <button
          type="button"
          onClick={() => { if (typeof onOpenSettings === 'function') onOpenSettings(); else navigateTo('settings'); }}
          aria-label="Open Settings and Profile"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', overflow: 'hidden', flex: 1,
            padding: '5px 6px', borderRadius: '10px', transition: 'background 0.15s ease',
            background: 'transparent', border: 'none', textAlign: 'left'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
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
          <button
            type="button"
            onClick={onCloseDrawer}
            title="Close menu"
            aria-label="Close menu"
            className="icon-btn"
            style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'transparent', border: '1px solid var(--border-subtle)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggle}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'transparent', border: '1px solid var(--border-subtle)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', flexShrink: 0, transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>
    </nav>
  );
}
