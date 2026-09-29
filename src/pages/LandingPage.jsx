import React from 'react';
import Hero from '../components/Landing/Hero';
import MarqueeTicker from '../components/Landing/MarqueeTicker';
import PlatformShowcase from '../components/Landing/PlatformShowcase';
import BentoGrid from '../components/Landing/BentoGrid';
import Showcase from '../components/Landing/Showcase';
import ComparisonSection from '../components/Landing/ComparisonSection';
import Testimonials from '../components/Landing/Testimonials';
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
      {/* 1. Hero Command Center with Live Preset & Adaptive Player */}
      <Hero
        onStartCreation={onStartCreation}
        onOpenDemoPreset={onSelectPreset}
      />

      {/* 2. Infinite Span Marquee Ticker (Requested viral effect) */}
      <MarqueeTicker />

      {/* 3. Omnichannel Multi-Platform Studio (YouTube, Reels, TikTok, LinkedIn) */}
      <PlatformShowcase onSelectPreset={onSelectPreset} />

      {/* 4. 2026 Bento Grid: Core Engine Capabilities & Micro-Interactions */}
      <BentoGrid />

      {/* 5. Interactive Video & Voice Showcase Gallery */}
      <Showcase onSelectPreset={onSelectPreset} />

      {/* 6. Traditional vs Bang AI Workflow Comparison & Time-Saved Calculator */}
      <ComparisonSection />

      {/* 7. Creator Community Wall of Love / Social Proof */}
      <Testimonials />

      {/* 8. Transparent Creator Pricing */}
      <Pricing onSelectPlan={() => handleAuth('signup')} />

      {/* 9. Frequently Asked Questions */}
      <FAQ />

      {/* 10. Bottom Launch Pad Call to Action */}
      <CallToAction onStartCreation={onStartCreation} />

      {/* 11. Production-Grade Enterprise Footer */}
      <Footer onNavigate={handleNav} />
    </main>
  );
}
