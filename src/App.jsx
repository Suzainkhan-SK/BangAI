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

export default function App() {
  const [theme, setTheme] = useState('dark');
  // Starts strictly at 'landing' with user = null (requiring login for private studio pages)
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [selectedPresetForDashboard, setSelectedPresetForDashboard] = useState('bermuda');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Apply theme to html data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Safe navigation handler protecting private studio routes
  const handleNavigate = (view) => {
    audioEngine.playSfx('click');
    const privateRoutes = ['dashboard', 'profile', 'settings'];
    if (privateRoutes.includes(view) && !user) {
      // Redirect to login if unauthenticated
      setCurrentView('login');
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
    setUser(null);
    setCurrentView('landing');
  };

  const handleStartCreationFromHero = (prompt) => {
    setPendingPrompt(prompt);
    setSelectedPresetForDashboard('bermuda');
    if (!user) {
      setCurrentView('login');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleSelectPresetFromShowcase = (presetId) => {
    setSelectedPresetForDashboard(presetId);
    if (!user) {
      setCurrentView('login');
    } else {
      setCurrentView('dashboard');
    }
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
