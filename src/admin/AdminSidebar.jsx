import React from 'react';

export const ADMIN_PAGES = [
  // Category 1: Core Automation & Cloud
  { id: 'command-center', name: 'Command Center', icon: '📊', category: 'Core Automation & Cloud' },
  { id: 'n8n-migrator', name: '1-Click n8n Migrator', icon: '🔄', category: 'Core Automation & Cloud' },
  { id: 'workflow-manager', name: 'Workflow Node Manager', icon: '🔌', category: 'Core Automation & Cloud' },
  { id: 'key-vault', name: 'Dynamic Key Vault', icon: '🔑', category: 'Core Automation & Cloud' },
  { id: 'modal-clusters', name: 'Modal Render Clusters', icon: '🖥️', category: 'Core Automation & Cloud' },

  // Category 2: Platform Pages & Feature Control
  { id: 'dashboard-manager', name: 'Dashboard Manager', icon: '🏠', category: 'Pages & Feature Control' },
  { id: 'stock-studio', name: 'Stock Studio Manager', icon: '🎥', category: 'Pages & Feature Control' },
  { id: 'chat-manager', name: 'BangAI Chat Manager', icon: '💬', category: 'Pages & Feature Control' },
  { id: 'templates-hub', name: 'AI Templates Hub', icon: '⚡', category: 'Pages & Feature Control' },
  { id: 'thumbnail-studio', name: 'Thumbnail Studio', icon: '🖼️', category: 'Pages & Feature Control' },
  { id: 'design-studio', name: 'Design Studio (Styles)', icon: '✏️', category: 'Pages & Feature Control' },

  // Category 3: Users, Media Asset Pipeline & Operations
  { id: 'asset-vault', name: 'Master Asset Vault', icon: '🎬', category: 'Users, Media & Operations' },
  { id: 'users-manager', name: 'User & Quota Center', icon: '👤', category: 'Users, Media & Operations' },
  { id: 'infrastructure', name: 'Cloud Infrastructure', icon: '🗄️', category: 'Users, Media & Operations' },
  { id: 'telemetry', name: 'Telemetry & Alerts', icon: '📡', category: 'Users, Media & Operations' },
  { id: 'security-logs', name: 'Security & Audit Logs', icon: '🛡️', category: 'Users, Media & Operations' }
];

export default function AdminSidebar({
  activePage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  onExitToApp,
  onLogout
}) {
  const categories = ['Core Automation & Cloud', 'Pages & Feature Control', 'Users, Media & Operations'];

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="admin-brand" onClick={() => onSelectPage('command-center')}>
        <div className="admin-brand-icon">👑</div>
        {!collapsed && (
          <div>
            <div className="admin-brand-text">BangAI Admin</div>
            <div style={{ fontSize: '11px', color: 'var(--admin-accent-cyan, #06b6d4)', fontWeight: 600 }}>
              Master Control v2.0
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {categories.map((cat) => {
          const items = ADMIN_PAGES.filter(p => p.category === cat);
          return (
            <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {!collapsed && <div className="admin-nav-category">{cat}</div>}
              {items.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <div
                    key={item.id}
                    className={`admin-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectPage(item.id)}
                    title={collapsed ? item.name : undefined}
                  >
                    <span className="admin-nav-icon">{item.icon}</span>
                    {!collapsed && <span>{item.name}</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--admin-border-glass, rgba(255,255,255,0.08))' }}>
        <button
          type="button"
          className="admin-nav-item"
          style={{ width: '100%', background: 'none' }}
          onClick={onExitToApp}
          title={collapsed ? 'Exit to BangAI App' : undefined}
        >
          <span className="admin-nav-icon">🚪</span>
          {!collapsed && <span>Exit to BangAI App</span>}
        </button>

        <button
          type="button"
          className="admin-nav-item"
          style={{ width: '100%', background: 'none', color: 'var(--admin-accent-red, #ef4444)' }}
          onClick={onLogout}
          title={collapsed ? 'Lock Admin Session' : undefined}
        >
          <span className="admin-nav-icon">🔒</span>
          {!collapsed && <span>Lock Session</span>}
        </button>
      </div>
    </aside>
  );
}
