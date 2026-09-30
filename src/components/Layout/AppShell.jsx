import React, { useState } from 'react';
import Sidebar from '../Dashboard/Sidebar';
import { useThreadList } from '../../hooks/useThreadList';
import { useBreakpoint } from '../../hooks/useMediaQuery';

export default function AppShell({ user, currentRoutePath, onNavigate, collapsed, onToggleCollapse, children }) {
  const { threads } = useThreadList(user);
  const { isMobile } = useBreakpoint();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      width: '100%',
      height: 'calc(100dvh - var(--nav-h, 58px))',
      minHeight: 'calc(100dvh - var(--nav-h, 58px))',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <div
          className={`sidebar-mobile-overlay ${mobileSidebarOpen ? 'visible' : ''}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: In-flow on desktop, slide-out drawer on mobile */}
      <div className={`sidebar-wrapper-mobile ${mobileSidebarOpen ? 'open' : ''}`}>
        <Sidebar
          user={user}
          pastShorts={threads}
          activeShortId={null}
          collapsed={isMobile ? false : collapsed}
          onToggleCollapse={onToggleCollapse}
          currentRoutePath={currentRoutePath}
          onNavigate={onNavigate}
          onSelectShort={(id) => {
            onNavigate('dashboard/t/' + id);
            if (isMobile) setMobileSidebarOpen(false);
          }}
          onNewShort={() => {
            onNavigate('dashboard');
            if (isMobile) setMobileSidebarOpen(false);
          }}
          isMobileDrawer={isMobile}
          onCloseDrawer={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
