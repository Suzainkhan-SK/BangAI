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
      flexDirection: isMobile ? 'column' : 'row',
      width: '100%',
      height: isMobile ? 'auto' : 'calc(100dvh - var(--nav-h, 58px))',
      minHeight: isMobile ? 'calc(100vh - var(--nav-h, 58px))' : 'calc(100dvh - var(--nav-h, 58px))',
      overflow: isMobile ? 'visible' : 'hidden',
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

      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'auto' : '100%',
        minHeight: 0,
        overflow: isMobile ? 'visible' : 'hidden',
        WebkitOverflowScrolling: 'touch'
      }}>
        {children}
      </div>
    </div>
  );
}
