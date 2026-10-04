import React, { useState, useEffect } from 'react';
import { adminService, getAdminToken } from './adminService';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import AdminLogin from './AdminLogin';
import './admin.css';

// Import All 16 Modular Views
import CommandCenterView from './views/CommandCenterView';
import N8nMigratorView from './views/N8nMigratorView';
import WorkflowManagerView from './views/WorkflowManagerView';
import KeyVaultView from './views/KeyVaultView';
import ModalClusterView from './views/ModalClusterView';
import DashboardManagerView from './views/DashboardManagerView';
import StockStudioManagerView from './views/StockStudioManagerView';
import ChatManagerView from './views/ChatManagerView';
import TemplatesManagerView from './views/TemplatesManagerView';
import ThumbnailManagerView from './views/ThumbnailManagerView';
import DesignStudioView from './views/DesignStudioView';
import AssetVaultView from './views/AssetVaultView';
import UsersManagerView from './views/UsersManagerView';
import InfrastructureView from './views/InfrastructureView';
import TelemetryView from './views/TelemetryView';
import SecurityLogsView from './views/SecurityLogsView';

export default function AdminApp({ theme = 'dark', onToggleTheme, onExitToApp }) {
  const [adminUser, setAdminUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activePage, setActivePage] = useState('command-center');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Authenticate session on load
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setAdminUser(null);
      setAuthChecking(false);
      return;
    }

    adminService.verify()
      .then((res) => {
        if (res.success && res.user) {
          setAdminUser(res.user);
        } else {
          adminService.logout();
          setAdminUser(null);
        }
      })
      .catch(() => {
        adminService.logout();
        setAdminUser(null);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  const handleLogout = () => {
    adminService.logout();
    setAdminUser(null);
  };

  // Render Loading Spinner
  if (authChecking) {
    return (
      <div className="admin-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: 'var(--admin-text-sub)', fontSize: '14px', fontWeight: 600 }}>
          Verifying Master Administrator Credentials...
        </div>
      </div>
    );
  }

  // Render Dedicated Login Page if not authenticated
  if (!adminUser) {
    return (
      <div className="admin-root">
        <AdminLogin
          onLoginSuccess={(user) => setAdminUser(user)}
          onExitToApp={onExitToApp}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      </div>
    );
  }

  // Render Active View
  const renderView = () => {
    switch (activePage) {
      // Category 1: Core Automation & Cloud
      case 'command-center':
        return <CommandCenterView onNavigatePage={setActivePage} />;
      case 'n8n-migrator':
        return <N8nMigratorView />;
      case 'workflow-manager':
        return <WorkflowManagerView />;
      case 'key-vault':
        return <KeyVaultView />;
      case 'modal-clusters':
        return <ModalClusterView />;

      // Category 2: Platform Pages & Feature Control
      case 'dashboard-manager':
        return <DashboardManagerView />;
      case 'stock-studio':
      case 'stock-studio-manager':
        return <StockStudioManagerView />;
      case 'chat-manager':
        return <ChatManagerView />;
      case 'templates-hub':
      case 'templates-manager':
        return <TemplatesManagerView />;
      case 'thumbnail-studio':
      case 'thumbnail-manager':
        return <ThumbnailManagerView />;
      case 'design-studio':
        return <DesignStudioView />;

      // Category 3: Users, Media Asset Pipeline & Operations
      case 'asset-vault':
        return <AssetVaultView />;
      case 'users-manager':
        return <UsersManagerView />;
      case 'infrastructure':
        return <InfrastructureView />;
      case 'telemetry':
        return <TelemetryView />;
      case 'security-logs':
        return <SecurityLogsView />;

      default:
        return <CommandCenterView onNavigatePage={setActivePage} />;
    }
  };

  return (
    <div className="admin-root">
      <AdminHeader
        theme={theme}
        onToggleTheme={onToggleTheme}
        user={adminUser}
        collapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />

      <div className="admin-layout">
        <AdminSidebar
          activePage={activePage}
          onSelectPage={setActivePage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onExitToApp={onExitToApp}
          onLogout={handleLogout}
        />

        <main className="admin-main-content">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
