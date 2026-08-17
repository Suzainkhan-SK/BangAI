import React, { useState } from 'react';
import { 
  Plus, 
  Sparkles, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  Search,
  Zap,
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShorts = pastShorts.filter((s) => 
    (s.name || s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (collapsed) {
    return (
      <aside style={{
        width: '52px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 6px',
        height: 'calc(100vh - 66px)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        flexShrink: 0,
        zIndex: 20
      }}>
        {/* Top Action Icons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              onNewShort();
            }}
            className="btn-glow"
            style={{ width: '38px', height: '38px', padding: 0, borderRadius: '12px', justifyContent: 'center' }}
            title="New Video (+)"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>

          <div style={{ width: '100%', height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

          {pastShorts.slice(0, 6).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                audioEngine.playSfx('click');
                onSelectShort(s.id);
              }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
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
              <MessageSquare size={15} />
            </button>
          ))}
        </div>

        {/* Bottom Expand Toggle & Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onToggleCollapse()}
            className="btn-ghost"
            style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center' }}
            title="Expand Sidebar"
          >
            <ChevronRight size={16} />
          </button>

          <div
            onClick={onOpenSettings}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '11px',
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
      width: '200px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '12px 10px',
      height: 'calc(100vh - 66px)',
      overflowY: 'auto',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      flexShrink: 0,
      position: 'relative',
      zIndex: 20
    }}>
      {/* Top Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Compact New Short Button */}
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
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-primary)',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
        >
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'var(--grad-gemini)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Plus size={12} color="#ffffff" strokeWidth={3} />
          </div>
          <span style={{ whiteSpace: 'nowrap' }}>New Short</span>
        </button>

        {/* Compact Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={11} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '8px' }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '4px 8px 4px 24px',
              fontSize: '11px',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Section Label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px',
          fontSize: '10.5px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          <span>Creations</span>
          <span style={{ fontSize: '10px', background: 'var(--bg-card)', padding: '1px 5px', borderRadius: '4px' }}>
            {pastShorts.length}
          </span>
        </div>

        {/* Scrollable Creation Items List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          maxHeight: 'calc(100vh - 240px)',
          overflowY: 'auto',
          paddingRight: '2px'
        }}>
          {filteredShorts.map((s) => {
            const isSelected = activeShortId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => {
                  audioEngine.playSfx('click');
                  onSelectShort(s.id);
                }}
                style={{
                  padding: '7px 8px',
                  borderRadius: '8px',
                  background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                  border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'}`,
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  fontSize: '11.5px',
                  fontWeight: isSelected ? 700 : 500,
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--border-subtle)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <MessageSquare size={13} style={{ flexShrink: 0, color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1
                }}>
                  {s.name || s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        {/* Collapse Button & User Card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            onClick={onOpenSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '10px',
              color: '#ffffff',
              flexShrink: 0
            }}>
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.name || 'Alex'}
            </span>
          </div>

          <button
            onClick={() => onToggleCollapse()}
            className="btn-ghost"
            style={{ width: '26px', height: '26px', padding: 0, justifyContent: 'center' }}
            title="Collapse Sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
