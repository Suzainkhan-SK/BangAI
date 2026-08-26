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

// Helper to get initial view from URL hash or localStorage
function getInitialView() {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const validViews = ['landing', 'login', 'register', 'dashboard', 'profile', 'settings', 'api', 'pricing'];
    if (hash && validViews.includes(hash)) {
      return hash;
    }
    const savedView = localStorage.getItem('shortsai_view');
    if (savedView && validViews.includes(savedView)) {
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

  // Verify real session with Atlas backend on app startup
  useEffect(() => {
    verifySession().then((verifiedUser) => {
      if (verifiedUser) {
        setUser(verifiedUser);
      } else {
        // If token was invalid or missing, clear user state
        setUser(null);
      }
    });
  }, []);

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
      if (hash && validViews.includes(hash)) {
        setCurrentView(hash);
      } else if (!hash) {
        setCurrentView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Protected Navigation handler
  const handleNavigate = (view) => {
    audioEngine.playSfx('click');
    const privateRoutes = ['dashboard', 'profile', 'settings'];
    if (privateRoutes.includes(view) && !user) {
      // Prompt user to sign in to access protected studio canvas
      setCurrentView('login');
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
    if (!user) {
      // Direct unauthenticated creator to create a free account
      setCurrentView('register');
      return;
    }
    setCurrentView('dashboard');
  };

  const handleSelectPresetFromShowcase = (presetId) => {
    setSelectedPresetForDashboard(presetId);
    if (!user) {
      // Direct unauthenticated creator to create a free account
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

      {/* Main View Router */}
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
        )}

        {currentView === 'profile' && (
          <ProfilePage
            user={user}
            onNavigateToDashboard={() => handleNavigate('dashboard')}
            onNavigateToSettings={() => handleNavigate('settings')}
          />
        )}

        {currentView === 'settings' && (
          <SettingsPage
            user={user}
            onNavigateToDashboard={() => handleNavigate('dashboard')}
          />
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
