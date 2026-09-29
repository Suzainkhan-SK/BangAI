import React from 'react';
import Hero from '../components/Landing/Hero';
import PlatformShowcase from '../components/Landing/PlatformShowcase';
import Showcase from '../components/Landing/Showcase';
import Features from '../components/Landing/Features';
import ComparisonSection from '../components/Landing/ComparisonSection';
import Pricing from '../components/Landing/Pricing';
import FAQ from '../components/Landing/FAQ';
import CallToAction from '../components/Landing/CallToAction';
import Footer from '../components/Landing/Footer';

export default function LandingPage({
  onStartCreation,
  onSelectPreset,
  onOpenAuth,
  onNavigate,
  onNavigateToDashboard,
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToPricing,
  onLoginSuccess
}) {
  const handleAuth = (type = 'signup') => {
    if (onOpenAuth) {
      onOpenAuth(type);
    } else if (type === 'login' && onNavigateToLogin) {
      onNavigateToLogin();
    } else if (onNavigateToRegister) {
      onNavigateToRegister();
    } else if (onNavigate) {
      onNavigate(type === 'login' ? 'login' : 'register');
    }
  };

  const handleNav = (target) => {
    if (onNavigate) {
      onNavigate(target);
    } else if (target === 'dashboard' && onNavigateToDashboard) {
      onNavigateToDashboard();
    } else if (target === 'login' && onNavigateToLogin) {
      onNavigateToLogin();
    } else if (target === 'register' && onNavigateToRegister) {
      onNavigateToRegister();
    } else if (target === 'pricing' && onNavigateToPricing) {
      onNavigateToPricing();
    }
  };

  return (
    <main style={{ flex: 1, width: '100%', overflowX: 'hidden' }}>
      <Hero
        onStartCreation={onStartCreation}
        onOpenDemoPreset={onSelectPreset}
      />
      <PlatformShowcase onSelectPreset={onSelectPreset} />
      <Showcase onSelectPreset={onSelectPreset} />
      <Features />
      <ComparisonSection />
      <Pricing onSelectPlan={() => handleAuth('signup')} />
      <FAQ />
      <CallToAction onStartCreation={onStartCreation} />
      <Footer onNavigate={handleNav} />
    </main>
  );
}
