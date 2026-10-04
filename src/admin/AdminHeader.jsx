import React from 'react';

export default function AdminHeader({
  theme,
  onToggleTheme,
  user,
  collapsed,
  onToggleSidebar,
  onLogout
}) {
  return (
    <header className="admin-header">
      {/* Left: Sidebar Toggle + Status Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          type="button"
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--admin-text-sub, #94a3b8)',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Toggle Sidebar"
        >
          ☰
        </button>

        <div className="admin-status-chip">
          <span className="admin-status-dot"></span>
          <span>ALL SYSTEMS OPERATIONAL (100%)</span>
        </div>
      </div>

      {/* Right: Actions, Theme Switcher & Admin Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Theme Switcher Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          style={{
            background: 'var(--admin-bg-elevated, #151923)',
            border: '1px solid var(--admin-border-glass, rgba(255,255,255,0.08))',
            borderRadius: '9999px',
            padding: '6px 12px',
            color: 'var(--admin-text-main, #f8fafc)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
          <span style={{ textTransform: 'capitalize', fontSize: '12px' }}>{theme}</span>
        </button>

        {/* Master Profile Chip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 10px 4px 6px',
          borderRadius: '9999px',
          background: 'var(--admin-bg-elevated, #151923)',
          border: '1px solid var(--admin-border-glass, rgba(255,255,255,0.08))'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            color: '#fff',
            fontWeight: 700
          }}>
            SK
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-main, #f8fafc)' }}>
              @SuzainkhanSK
            </span>
            <span style={{ fontSize: '10px', color: 'var(--admin-accent-cyan, #06b6d4)', fontWeight: 500 }}>
              Master Admin
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="admin-btn admin-btn-danger"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          Lock
        </button>
      </div>
    </header>
  );
}
