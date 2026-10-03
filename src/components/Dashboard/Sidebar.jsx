import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Sparkles, MessageSquare, PanelLeftClose, PanelLeft,
  Settings, LogOut, Search, Trash2, Video, Film, Clock,
  CheckCircle2, AlertCircle, XCircle, Loader2, Zap,
  Mic2, Music, Type, X, LayoutDashboard, User, CreditCard,
  Bot, Palette, Image as ImageIcon
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
        width: '6px',
        height: '6px',
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
    if (path === 'studio') {
      return currentRoutePath === 'studio' || currentRoutePath.startsWith('studio/') || currentRoutePath.startsWith('studio-');
    }
    if (path === 'thumbnails') {
      return currentRoutePath === 'thumbnails' || currentRoutePath === 'thumbnail-studio';
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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try { audioEngine.playSfx('click'); } catch (err) {}
    if (typeof onDeleteShort === 'function') {
      onDeleteShort(id);
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

  // ── COLLAPSED MODE (ChatGPT style compact rail) ───────────────────
  if (collapsed) {
    return (
      <nav
        aria-label="Sidebar navigation"
        style={{
          width: 'var(--sidebar-w-collapsed, 54px)',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 0',
          height: 'calc(100dvh - var(--nav-h, 58px))',
          transition: 'width 0.22s cubic-bezier(0.2, 0, 0, 1)',
          flexShrink: 0,
          zIndex: 110,
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', padding: '0 8px' }}>
          {/* Top ChatGPT-style Expand Button */}
          <button
            type="button"
            onClick={handleToggle}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <PanelLeft size={17} />
          </button>

          {/* New Short Button */}
          <button
            type="button"
            onClick={() => { audioEngine.playSfx('click'); if (typeof onNewShort === 'function') onNewShort(); else navigateTo('dashboard'); }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              padding: 0,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(99,102,241,0.35)',
              marginBottom: '4px'
            }}
            title="New Video"
            aria-label="Create New Video"
          >
            <Plus size={17} color="#fff" strokeWidth={2.5} />
          </button>

          {/* Dashboard */}
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            title="Dashboard Studio"
            aria-label="Dashboard Studio"
            aria-current={isItemActive('dashboard') ? 'page' : undefined}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: isItemActive('dashboard') ? 'rgba(99,102,241,0.18)' : 'transparent',
              border: `1.5px solid ${isItemActive('dashboard') ? '#6366f1' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isItemActive('dashboard') ? '#818cf8' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <LayoutDashboard size={16} />
          </button>

          {/* AI Templates */}
          <button
            type="button"
            onClick={() => navigateTo('templates')}
            title="AI Templates (75s Autonomous)"
            aria-label="AI Templates"
            aria-current={isItemActive('templates') ? 'page' : undefined}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: isItemActive('templates') ? 'rgba(99,102,241,0.18)' : 'transparent',
              border: `1.5px solid ${isItemActive('templates') ? '#6366f1' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isItemActive('templates') ? '#818cf8' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={16} />
          </button>

          {/* Basic Templates (Stock Video) */}
          <button
            type="button"
            onClick={() => navigateTo('basic-templates')}
            title="Stock Video Studio"
            aria-label="Stock Video Studio"
            aria-current={isItemActive('basic-templates') ? 'page' : undefined}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: isItemActive('basic-templates') ? 'rgba(16,185,129,0.18)' : 'transparent',
              border: `1.5px solid ${isItemActive('basic-templates') ? '#10b981' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isItemActive('basic-templates') ? '#34d399' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Film size={16} />
          </button>

          {/* Thumbnail Studio */}
          <button
            type="button"
            onClick={() => navigateTo('thumbnails')}
            title="Thumbnail Studio (Ultra HD)"
            aria-label="Thumbnail Studio"
            aria-current={isItemActive('thumbnails') ? 'page' : undefined}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: isItemActive('thumbnails') ? 'rgba(255, 79, 0, 0.18)' : 'transparent',
              border: `1.5px solid ${isItemActive('thumbnails') ? '#ff4f00' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isItemActive('thumbnails') ? '#ff4f00' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <ImageIcon size={16} />
          </button>

          {/* Bang AI Chat */}
          <button
            type="button"
            onClick={() => navigateTo('chat')}
            title="Bang AI Chat (4.0)"
            aria-label="Bang AI Chat"
            aria-current={isItemActive('chat') ? 'page' : undefined}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: isItemActive('chat') ? 'rgba(99,102,241,0.22)' : 'transparent',
              border: `1.5px solid ${isItemActive('chat') ? '#6366f1' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isItemActive('chat') ? '#a5b4fc' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Bot size={16} />
          </button>

          {/* Design Studio */}
          <button
            type="button"
            onClick={() => navigateTo('studio/voices')}
            title="Design Studio (Voices, Subtitles & Music)"
            aria-label="Design Studio"
            aria-current={isItemActive('studio') ? 'page' : undefined}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: isItemActive('studio') ? 'rgba(168,85,247,0.18)' : 'transparent',
              border: `1.5px solid ${isItemActive('studio') ? '#a855f7' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isItemActive('studio') ? '#c084fc' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            <Palette size={16} />
          </button>

          <div style={{ width: '28px', height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

          {/* Recent threads */}
          {filtered.slice(0, 5).map(s => {
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
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: `1.5px solid ${isActive ? 'rgba(99,102,241,0.6)' : 'transparent'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  color: isActive ? '#6366f1' : 'var(--text-muted)'
                }}
              >
                <MessageSquare size={15} />
              </button>
            );
          })}
        </div>

        {/* Collapsed Bottom Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
          <button
            type="button"
            onClick={() => { if (typeof onOpenSettings === 'function') onOpenSettings(); else navigateTo('settings'); }}
            title={user?.name || 'Profile & Settings'}
            aria-label="User Profile & Settings"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              padding: 0,
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </button>
        </div>
      </nav>
    );
  }

  // ── EXPANDED MODE (ChatGPT style top collapse & minimal width) ───
  return (
    <nav
      aria-label="Sidebar navigation"
      style={{
        width: 'var(--sidebar-w, 215px)',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '0',
        height: 'calc(100dvh - var(--nav-h, 58px))',
        transition: 'width 0.22s cubic-bezier(0.2, 0, 0, 1)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 110,
        overflow: 'hidden'
      }}
    >
      {/* ── Section A: Top Controls (Fixed) ── */}
      <div style={{ padding: '10px 10px 0 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* ChatGPT-Style Top Header Row: Title on Left, Collapse Button on Right */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 4px 0 4px',
          minHeight: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="#818cf8" />
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              WORKSPACE
            </span>
          </div>

          {/* ChatGPT-style Collapse Button at the TOP */}
          {isMobileDrawer && typeof onCloseDrawer === 'function' ? (
            <button
              type="button"
              onClick={onCloseDrawer}
              title="Close menu"
              aria-label="Close menu"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              title="Close sidebar"
              aria-label="Close sidebar"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-card)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {/* Primary Action: New Video Button */}
        <button
          type="button"
          onClick={() => {
            audioEngine.playSfx('click');
            if (typeof onNewShort === 'function') onNewShort();
            else navigateTo('dashboard');
          }}
          aria-label="Create New Video"
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: '9px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            color: '#fff',
            fontWeight: 700,
            fontSize: '12.5px',
            fontFamily: 'Space Grotesk, sans-serif',
            boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
            transition: 'all 0.18s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 16px rgba(99,102,241,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(99,102,241,0.3)'; }}
        >
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '5px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Plus size={13} color="#fff" strokeWidth={2.5} />
          </div>
          <span>New Video</span>
        </button>

        {/* Core Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            aria-label="Dashboard Studio"
            aria-current={isItemActive('dashboard') ? 'page' : undefined}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: isItemActive('dashboard') ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: `1px solid ${isItemActive('dashboard') ? 'rgba(99,102,241,0.35)' : 'transparent'}`,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: isItemActive('dashboard') ? '#818cf8' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: isItemActive('dashboard') ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <LayoutDashboard size={14} color={isItemActive('dashboard') ? '#818cf8' : 'var(--text-muted)'} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('templates')}
            aria-label="AI Templates"
            aria-current={isItemActive('templates') ? 'page' : undefined}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: isItemActive('templates') ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: `1px solid ${isItemActive('templates') ? 'rgba(99,102,241,0.35)' : 'transparent'}`,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: isItemActive('templates') ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: isItemActive('templates') ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} color={isItemActive('templates') ? '#818cf8' : 'var(--text-muted)'} />
              <span>AI Templates</span>
            </div>
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
              75S
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('basic-templates')}
            aria-label="Stock Video Studio"
            aria-current={isItemActive('basic-templates') ? 'page' : undefined}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: isItemActive('basic-templates') ? 'rgba(16,185,129,0.15)' : 'transparent',
              border: `1px solid ${isItemActive('basic-templates') ? 'rgba(16,185,129,0.35)' : 'transparent'}`,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: isItemActive('basic-templates') ? '#34d399' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: isItemActive('basic-templates') ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={14} color={isItemActive('basic-templates') ? '#34d399' : 'var(--text-muted)'} />
              <span>Stock Studio</span>
            </div>
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff' }}>
              MODAL
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('thumbnails')}
            aria-label="Thumbnail Studio"
            aria-current={isItemActive('thumbnails') ? 'page' : undefined}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: isItemActive('thumbnails') ? 'rgba(255, 79, 0, 0.15)' : 'transparent',
              border: `1px solid ${isItemActive('thumbnails') ? 'rgba(255, 79, 0, 0.35)' : 'transparent'}`,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: isItemActive('thumbnails') ? '#ff4f00' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: isItemActive('thumbnails') ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={14} color={isItemActive('thumbnails') ? '#ff4f00' : 'var(--text-muted)'} />
              <span>Thumbnail Studio</span>
            </div>
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'linear-gradient(135deg, #ff4f00, #ff7700)', color: '#fff' }}>
              HD
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('chat')}
            aria-label="Bang AI Chat"
            aria-current={isItemActive('chat') ? 'page' : undefined}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: isItemActive('chat') ? 'rgba(99,102,241,0.2)' : 'transparent',
              border: `1px solid ${isItemActive('chat') ? 'rgba(99,102,241,0.45)' : 'transparent'}`,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: isItemActive('chat') ? '#a5b4fc' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: isItemActive('chat') ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={14} color={isItemActive('chat') ? '#a5b4fc' : '#818cf8'} />
              <span>Bang AI Chat</span>
            </div>
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff' }}>
              4.0
            </span>
          </button>

          {/* Design Studio */}
          <button
            type="button"
            onClick={() => navigateTo('studio/voices')}
            aria-label="Design Studio"
            aria-current={isItemActive('studio') ? 'page' : undefined}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: isItemActive('studio') ? 'rgba(168,85,247,0.18)' : 'transparent',
              border: `1px solid ${isItemActive('studio') ? 'rgba(168,85,247,0.45)' : 'transparent'}`,
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: isItemActive('studio') ? '#c084fc' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: isItemActive('studio') ? 700 : 500,
              transition: 'all 0.12s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={14} color={isItemActive('studio') ? '#c084fc' : 'var(--text-muted)'} />
              <span>Design Studio</span>
            </div>
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'rgba(168,85,247,0.2)', color: '#c084fc' }}>
              LAB
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginTop: '2px' }}>
          <Search size={12} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search history..."
            aria-label="Search video history"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '7px',
              padding: '5px 8px 5px 26px',
              fontSize: '11.5px',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
          />
        </div>

        {/* History Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 4px 0 4px',
          fontSize: '10px',
          fontWeight: 800,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <span>HISTORY</span>
          {pastShorts.length > 0 && (
            <span style={{
              fontSize: '9.5px',
              background: 'rgba(99,102,241,0.15)',
              color: 'var(--accent-primary)',
              padding: '1px 5px',
              borderRadius: '99px',
              fontWeight: 700
            }}>
              {pastShorts.length}
            </span>
          )}
        </div>
      </div>

      {/* ── Section B: Scrollable History List (Middle) ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '2px 8px 6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: '20px 8px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={14} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {searchQuery ? 'No results found' : 'No videos created yet'}
            </div>
          </div>
        ) : (
          groupedThreads.map(group => (
            <div key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{
                fontSize: '9px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                padding: '3px 6px 1px 6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {group.title}
              </div>
              {group.items.map((s, idx) => {
                const id = s.threadId || s.id;
                const isActive = activeShortId === id || currentRoutePath === 'dashboard/t/' + id;
                const isHovered = hoveredId === id;
                const label = s.name || s.title || s.rawUserInput || '—';
                const accessibleLabel = s.name || s.title || s.rawUserInput || 'Untitled thread';
                const timeAgo = formatRelativeTime(getThreadTimestamp(s));

                return (
                  <div
                    key={`${id}-${idx}`}
                    role="button"
                    tabIndex={0}
                    title={accessibleLabel}
                    aria-label={`Open video thread: ${accessibleLabel}`}
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => {
                      audioEngine.playSfx('click');
                      if (typeof onSelectShort === 'function') onSelectShort(id);
                      else navigateTo('dashboard/t/' + id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (typeof onSelectShort === 'function') onSelectShort(id);
                        else navigateTo('dashboard/t/' + id);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '5px 7px',
                      borderRadius: '7px',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))'
                        : isHovered ? 'var(--bg-card-hover, rgba(255,255,255,0.04))' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(99,102,241,0.35)' : 'transparent'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.12s ease',
                      textAlign: 'left',
                      boxSizing: 'border-box'
                    }}
                  >
                    <ThreadStatusDot status={s.status} />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.3
                      }}>
                        {label}
                      </span>
                      {timeAgo && (
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                          {timeAgo}
                        </span>
                      )}
                    </div>
                    {typeof onDeleteShort === 'function' && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, id)}
                        title="Delete thread"
                        aria-label="Delete video thread"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '3px 4px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          flexShrink: 0,
                          color: isHovered || isActive ? 'var(--text-muted)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = isHovered || isActive ? 'var(--text-muted)' : 'transparent';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* ── Section C: Bottom User Profile Card (Fixed) ── */}
      <div style={{
        padding: '8px 10px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-sidebar)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <button
          type="button"
          onClick={() => { if (typeof onOpenSettings === 'function') onOpenSettings(); else navigateTo('settings'); }}
          aria-label="Open Settings and Profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            overflow: 'hidden',
            flex: 1,
            padding: '4px 6px',
            borderRadius: '8px',
            transition: 'background 0.15s ease',
            background: 'transparent',
            border: 'none',
            textAlign: 'left'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '10.5px',
            color: '#fff'
          }}>
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || user?.email?.split('@')[0] || 'Creator'}
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{planLabel}</div>
          </div>
        </button>
      </div>
    </nav>
  );
}
