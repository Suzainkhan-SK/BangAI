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

// Helper to get initial user from localStorage
function getInitialUser() {
  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('shortsai_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {}
  }
  return null;
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
  const [user, setUser] = useState(getInitialUser);
  const [currentView, setCurrentView] = useState(getInitialView);
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [selectedPresetForDashboard, setSelectedPresetForDashboard] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // Navigation handler
  const handleNavigate = (view) => {
    audioEngine.playSfx('click');
    const privateRoutes = ['dashboard', 'profile', 'settings'];
    if (privateRoutes.includes(view) && !user) {
      // Auto-create a demo session if navigating directly or redirect to login
      const defaultUser = {
        name: 'Alex Rivera',
        email: 'alex.creator@shortsai.studio',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        plan: 'Pro Creator',
        credits: 850
      };
      setUser(defaultUser);
      try {
        localStorage.setItem('shortsai_user', JSON.stringify(defaultUser));
      } catch (e) {}
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('shortsai_user', JSON.stringify(userData));
    } catch (e) {}
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    audioEngine.playSfx('click');
    setUser(null);
    try {
      localStorage.removeItem('shortsai_user');
    } catch (e) {}
    setCurrentView('landing');
  };

  const handleStartCreationFromHero = (prompt) => {
    setPendingPrompt(prompt);
    setSelectedPresetForDashboard(null);
    if (!user) {
      const defaultUser = {
        name: 'Alex Rivera',
        email: 'alex.creator@shortsai.studio',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        plan: 'Pro Creator',
        credits: 850
      };
      setUser(defaultUser);
      try {
        localStorage.setItem('shortsai_user', JSON.stringify(defaultUser));
      } catch (e) {}
    }
    setCurrentView('dashboard');
  };

  const handleSelectPresetFromShowcase = (presetId) => {
    setSelectedPresetForDashboard(presetId);
    if (!user) {
      const defaultUser = {
        name: 'Alex Rivera',
        email: 'alex.creator@shortsai.studio',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        plan: 'Pro Creator',
        credits: 850
      };
      setUser(defaultUser);
      try {
        localStorage.setItem('shortsai_user', JSON.stringify(defaultUser));
      } catch (e) {}
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
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Page Router */}
      {currentView === 'landing' && (
        <LandingPage
          onStartCreation={handleStartCreationFromHero}
          onSelectPreset={handleSelectPresetFromShowcase}
          onOpenAuth={(tab) => handleNavigate(tab === 'signup' ? 'register' : 'login')}
          onNavigate={handleNavigate}
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
          initialPresetId={selectedPresetForDashboard}
          initialPrompt={pendingPrompt}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          user={user}
          onNavigateToSettings={() => handleNavigate('settings')}
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
          onNavigateToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentView === 'api' && (
        <ApiDocsPage onNavigate={handleNavigate} />
      )}

      {currentView === 'pricing' && (
        <PricingPage
          onSelectPlan={(planId) => {
            if (!user) {
              handleNavigate('register');
            } else {
              handleNavigate('dashboard');
            }
          }}
        />
      )}
    </div>
  );
}
