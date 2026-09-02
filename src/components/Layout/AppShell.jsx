import React from 'react';
import Sidebar from '../Dashboard/Sidebar';
import { useThreadList } from '../../hooks/useThreadList';

export default function AppShell({ user, currentRoutePath, onNavigate, collapsed, onToggleCollapse, children }) {
  const { threads } = useThreadList();

  return (
    <div style={{ flex: 1, display: 'flex', width: '100%', minHeight: 'calc(100vh - 64px)' }}>
      <Sidebar
        user={user}
        pastShorts={threads}
        activeShortId={null}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        currentRoutePath={currentRoutePath}
        onNavigate={onNavigate}
        onSelectShort={(id) => onNavigate('dashboard/t/' + id)}
        onNewShort={() => onNavigate('dashboard')}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}
