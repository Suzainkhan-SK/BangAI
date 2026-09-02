import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardApp from './components/Dashboard/DashboardApp';
import StudioPage from './pages/StudioPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ApiDocsPage from './pages/ApiDocsPage';
import PricingPage from './pages/PricingPage';
import { audioEngine } from './audio/audioEngine';
import { getStoredUser, verifySession, logoutUser } from './utils/authClient';
import { ROUTES, matchRoute } from './routes';
import { VideoSettingsProvider } from './state/videoSettings';

export const APP_ROUTES = ROUTES;

// Helper to get initial route from URL hash or localStorage with auth check
function resolveInitialRoute() {
  if (typeof window !== 'undefined') {
    // Check if returning from Google OAuth
    const search = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
    const params = new URLSearchParams(search);
    if (params.get('auth') === 'google_success' && params.get('token')) {
      return matchRoute('dashboard');
    }

    const hash = window.location.hash;
    const matched = matchRoute(hash);
    const hasToken = !!(localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token'));

    if (matched) {
      if (matched.private && !hasToken) {
        return matchRoute('login');
      }
      return matched;
    }

    const savedView = localStorage.getItem('bangai_view') || localStorage.getItem('shortsai_view');
    if (savedView) {
      const savedMatched = matchRoute(savedView);
      if (savedMatched) {
        if (savedMatched.private && !hasToken) {
          return matchRoute('login');
        }
        return savedMatched;
      }
    }
  }
  return matchRoute('');
}

// Helper to get initial theme from localStorage
function getInitialTheme() {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('bangai_theme') || localStorage.getItem('shortsai_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
  }
  return 'dark';
}

function AppContent() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [user, setUser] = useState(getStoredUser);
  const [currentRoute, setCurrentRoute] = useState(resolveInitialRoute);
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [selectedPresetForDashboard, setSelectedPresetForDashboard] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 1. Capture Google OAuth callback tokens from URL if present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
    const params = new URLSearchParams(search);

    if (params.get('auth') === 'google_success' && params.get('token')) {
      const token = params.get('token');
      const rawUser = params.get('user');
      localStorage.setItem('bangai_token', token);
      localStorage.setItem('shortsai_token', token);

      if (rawUser) {
        try {
          const userObj = JSON.parse(decodeURIComponent(rawUser));
          localStorage.setItem('bangai_user', JSON.stringify(userObj));
          localStorage.setItem('shortsai_user', JSON.stringify(userObj));
          setUser(userObj);
        } catch (e) {
          console.error('[App] Failed to parse Google user payload:', e);
        }
      }

      audioEngine.playSfx('boom');
      const dashRoute = matchRoute('dashboard');
      setCurrentRoute(dashRoute);
      // Clean URL hash without params
      window.history.replaceState({}, document.title, window.location.pathname + '#/dashboard');
    }
  }, []);

  // Strict session verification with Atlas backend on startup
  useEffect(() => {
    const hasToken = !!(localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token'));
    if (!hasToken) {
      setUser(null);
      if (currentRoute?.private) {
        setCurrentRoute(matchRoute('login'));
      }
      return;
    }

    verifySession().then((verifiedUser) => {
      if (verifiedUser) {
        setUser(verifiedUser);
      } else {
        setUser(null);
        if (currentRoute?.private) {
          setCurrentRoute(matchRoute('login'));
        }
      }
    });
  }, []);

  // Strict Route Guard: Kick unauthenticated users out of private routes
  useEffect(() => {
    if (currentRoute?.private && !user) {
      const hasToken = !!(localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token'));
      if (!hasToken) {
        setCurrentRoute(matchRoute('login'));
        if (window.location.hash !== '#/login') {
          window.location.hash = '#/login';
        }
      }
    }
  }, [currentRoute, user]);

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
      if (currentRoute?.path !== undefined) {
        localStorage.setItem('shortsai_view', currentRoute.path || 'landing');
        if (!currentRoute.path) {
          if (window.location.hash) history.replaceState(null, '', window.location.pathname);
        } else {
          if (window.location.hash !== `#/${currentRoute.path}`) {
            window.location.hash = `#/${currentRoute.path}`;
          }
        }
      }
    } catch (e) {}
  }, [currentRoute]);

  // Listen to browser Back/Forward (Hash Change)
  useEffect(() => {
    const handleHashChange = () => {
      const matched = matchRoute(window.location.hash);
      const hasToken = !!(localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token'));

      if (matched) {
        if (matched.private && (!user || !hasToken)) {
          setCurrentRoute(matchRoute('login'));
          window.location.hash = '#/login';
          return;
        }
        setCurrentRoute(matched);
      } else {
        const fallback = (user && hasToken) ? matchRoute('dashboard') : matchRoute('');
        setCurrentRoute(fallback);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Protected Navigation handler
  const handleNavigate = (target) => {
    audioEngine.playSfx('click');
    const matched = matchRoute(target) || matchRoute('dashboard');
    const hasToken = !!(localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token'));

    if (matched.private && (!user || !hasToken)) {
      // Direct unauthenticated users to login
      setCurrentRoute(matchRoute('login'));
      window.location.hash = '#/login';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentRoute(matched);
    if (matched.path) {
      window.location.hash = `#/${matched.path}`;
    } else {
      if (window.location.hash) history.replaceState(null, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    audioEngine.playSfx('click');
    logoutUser();
    setUser(null);
    handleNavigate('');
  };

  const handleStartCreationFromHero = (prompt) => {
    setPendingPrompt(prompt);
    setSelectedPresetForDashboard(null);
    const hasToken = !!(localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token'));

    if (!user || !hasToken) {
      handleNavigate('register');
      return;
    }
    handleNavigate('dashboard');
  };

  const handleSelectPresetFromShowcase = (presetId) => {
    setSelectedPresetForDashboard(presetId);
    const hasToken = !!(localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token'));

    if (!user || !hasToken) {
      handleNavigate('register');
      return;
    }
    handleNavigate('dashboard');
  };

  const currentView = currentRoute?.view || 'landing';
  const currentRoutePath = currentRoute?.path || '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
      {/* Universal Full-Width Navbar */}
      <Navbar
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentView={currentRoutePath || currentView}
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
            onNavigateToLanding={() => handleNavigate('')}
          />
        )}

        {currentView === 'register' && (
          <RegisterPage
            onRegisterSuccess={handleLoginSuccess}
            onNavigateToLogin={() => handleNavigate('login')}
            onNavigateToLanding={() => handleNavigate('')}
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
              onNavigate={handleNavigate}
              onOpenStudio={(tab) => handleNavigate('studio/' + (tab || 'voices'))}
              onLogout={handleLogout}
            />
          ) : (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => handleNavigate('register')}
              onNavigateToLanding={() => handleNavigate('')}
            />
          )
        )}

        {(currentView === 'studio' || currentView === 'studio-voices' || currentView === 'studio-subtitles' || currentView === 'studio-music') && (
          user ? (
            <StudioPage
              tab={currentRoute.tab || 'voices'}
              onNavigate={handleNavigate}
            />
          ) : (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => handleNavigate('register')}
              onNavigateToLanding={() => handleNavigate('')}
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
              onNavigateToLanding={() => handleNavigate('')}
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
              onNavigateToLanding={() => handleNavigate('')}
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

export default function App() {
  return (
    <VideoSettingsProvider>
      <AppContent />
    </VideoSettingsProvider>
  );
}
