import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardApp from './components/Dashboard/DashboardApp';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ApiDocsPage from './pages/ApiDocsPage';
import PricingPage from './pages/PricingPage';
import { audioEngine } from './audio/audioEngine';
import { getStoredUser, verifySession, logoutUser } from './utils/authClient';

const PRIVATE_ROUTES = ['dashboard', 'profile', 'settings'];

// Helper to get initial view from URL hash or localStorage with strict auth check
function getInitialView() {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const validViews = ['landing', 'login', 'register', 'dashboard', 'profile', 'settings', 'api', 'pricing'];
    const hasToken = !!localStorage.getItem('shortsai_token');

    if (hash && validViews.includes(hash)) {
      if (PRIVATE_ROUTES.includes(hash) && !hasToken) {
        return 'login';
      }
      return hash;
    }
    const savedView = localStorage.getItem('shortsai_view');
    if (savedView && validViews.includes(savedView)) {
      if (PRIVATE_ROUTES.includes(savedView) && !hasToken) {
        return 'login';
      }
      return savedView;
    }
  }
  return 'landing';
}

// Helper to get initial theme from localStorage
function getInitialTheme() {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('shortsai_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
  }
  return 'dark';
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [user, setUser] = useState(getStoredUser);
  const [currentView, setCurrentView] = useState(getInitialView);
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [selectedPresetForDashboard, setSelectedPresetForDashboard] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Strict session verification with Atlas backend on startup
  useEffect(() => {
    const hasToken = !!localStorage.getItem('shortsai_token');
    if (!hasToken) {
      setUser(null);
      if (PRIVATE_ROUTES.includes(currentView)) {
        setCurrentView('login');
      }
      return;
    }

    verifySession().then((verifiedUser) => {
      if (verifiedUser) {
        setUser(verifiedUser);
      } else {
        setUser(null);
        if (PRIVATE_ROUTES.includes(currentView)) {
          setCurrentView('login');
        }
      }
    });
  }, []);

  // Strict Route Guard: Kick unauthenticated users out of private routes
  useEffect(() => {
    if (PRIVATE_ROUTES.includes(currentView) && !user) {
      setCurrentView('login');
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login';
      }
    }
  }, [currentView, user]);

  // Apply & Persist Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('shortsai_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Persist Current View to localStorage and URL Hash
  useEffect(() => {
    try {
      localStorage.setItem('shortsai_view', currentView);
      if (currentView === 'landing') {
        if (window.location.hash) history.replaceState(null, '', window.location.pathname);
      } else {
        if (window.location.hash !== `#/${currentView}`) {
          window.location.hash = `#/${currentView}`;
        }
      }
    } catch (e) {}
  }, [currentView]);

  // Listen to browser Back/Forward (Hash Change)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const validViews = ['landing', 'login', 'register', 'dashboard', 'profile', 'settings', 'api', 'pricing'];
      const hasToken = !!localStorage.getItem('shortsai_token');

      if (hash && validViews.includes(hash)) {
        if (PRIVATE_ROUTES.includes(hash) && (!user || !hasToken)) {
          setCurrentView('login');
          window.location.hash = '#/login';
          return;
        }
        setCurrentView(hash);
      } else if (!hash) {
        setCurrentView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Protected Navigation handler
  const handleNavigate = (view) => {
    audioEngine.playSfx('click');
    const hasToken = !!localStorage.getItem('shortsai_token');

    if (PRIVATE_ROUTES.includes(view) && (!user || !hasToken)) {
      // Direct unauthenticated users to login
      setCurrentView('login');
      window.location.hash = '#/login';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    audioEngine.playSfx('click');
    logoutUser();
    setUser(null);
    setCurrentView('landing');
  };

  const handleStartCreationFromHero = (prompt) => {
    setPendingPrompt(prompt);
    setSelectedPresetForDashboard(null);
    const hasToken = !!localStorage.getItem('shortsai_token');

    if (!user || !hasToken) {
      setCurrentView('register');
      return;
    }
    setCurrentView('dashboard');
  };

  const handleSelectPresetFromShowcase = (presetId) => {
    setSelectedPresetForDashboard(presetId);
    const hasToken = !!localStorage.getItem('shortsai_token');

    if (!user || !hasToken) {
      setCurrentView('register');
      return;
    }
    setCurrentView('dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
      {/* Universal Full-Width Navbar */}
      <Navbar
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main View Router with Strict Auth Enforcement */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        {currentView === 'landing' && (
          <LandingPage
            onNavigateToDashboard={() => handleNavigate('dashboard')}
            onNavigateToLogin={() => handleNavigate('login')}
            onNavigateToRegister={() => handleNavigate('register')}
            onNavigateToPricing={() => handleNavigate('pricing')}
            onStartCreation={handleStartCreationFromHero}
            onSelectPreset={handleSelectPresetFromShowcase}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {currentView === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => handleNavigate('register')}
            onNavigateToLanding={() => handleNavigate('landing')}
          />
        )}

        {currentView === 'register' && (
          <RegisterPage
            onRegisterSuccess={handleLoginSuccess}
            onNavigateToLogin={() => handleNavigate('login')}
            onNavigateToLanding={() => handleNavigate('landing')}
          />
        )}

        {currentView === 'dashboard' && (
          user ? (
            <DashboardApp
              user={user}
              initialPrompt={pendingPrompt}
              initialPresetId={selectedPresetForDashboard}
              onClearPendingPrompt={() => {
                setPendingPrompt('');
                setSelectedPresetForDashboard(null);
              }}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              onNavigateToSettings={() => handleNavigate('settings')}
              onNavigateToProfile={() => handleNavigate('profile')}
              onLogout={handleLogout}
            />
          ) : (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => handleNavigate('register')}
              onNavigateToLanding={() => handleNavigate('landing')}
            />
          )
        )}

        {currentView === 'profile' && (
          user ? (
            <ProfilePage
              user={user}
              onNavigateToDashboard={() => handleNavigate('dashboard')}
              onNavigateToSettings={() => handleNavigate('settings')}
            />
          ) : (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => handleNavigate('register')}
              onNavigateToLanding={() => handleNavigate('landing')}
            />
          )
        )}

        {currentView === 'settings' && (
          user ? (
            <SettingsPage
              user={user}
              onNavigateToDashboard={() => handleNavigate('dashboard')}
            />
          ) : (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => handleNavigate('register')}
              onNavigateToLanding={() => handleNavigate('landing')}
            />
          )
        )}

        {currentView === 'api' && (
          <ApiDocsPage
            onNavigateToDashboard={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'pricing' && (
          <PricingPage
            user={user}
            onNavigateToRegister={() => handleNavigate('register')}
            onNavigateToDashboard={() => handleNavigate('dashboard')}
          />
        )}
      </main>
    </div>
  );
}
