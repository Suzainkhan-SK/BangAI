import React from 'react';
import Hero from '../components/Landing/Hero';
import Showcase from '../components/Landing/Showcase';
import Features from '../components/Landing/Features';
import ComparisonSection from '../components/Landing/ComparisonSection';
import Pricing from '../components/Landing/Pricing';
import FAQ from '../components/Landing/FAQ';
import Footer from '../components/Landing/Footer';

export default function LandingPage({
  onStartCreation,
  onSelectPreset,
  onOpenAuth,
  onNavigate
}) {
  return (
    <main style={{ flex: 1, width: '100%' }}>
      <Hero
        onStartCreation={onStartCreation}
        onOpenDemoPreset={onSelectPreset}
      />
      <Showcase onSelectPreset={onSelectPreset} />
      <Features />
      <ComparisonSection />
      <Pricing onSelectPlan={() => onOpenAuth('signup')} />
      <FAQ />
      <Footer onNavigate={onNavigate} />
    </main>
  );
}
