import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-app)',
      paddingTop: 'clamp(40px, 6vw, 60px)', paddingBottom: '30px',
      color: 'var(--text-muted)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
          gap: '36px',
          marginBottom: '48px'
        }}>
          {/* Col 1: Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'var(--grad-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={16} color="#ffffff" />
              </div>
              <span className="font-display" style={{ fontWeight: 900, fontSize: '20px', color: 'var(--text-primary)' }}>
                Bang <span style={{ color: '#6366f1' }}>AI</span>
              </span>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              The universal autonomous video engine for creators, storytellers, and media studios.
            </p>
          </div>

          {/* Col 2: Product */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Product
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>AI Storyboard Engine</a>
              <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Viral Story Blueprints</a>
              <a href="#showcase" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Cinematic AI Visuals</a>
              <a 
                href="#/pricing" 
                onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('pricing'); else window.location.hash = '#/pricing'; }}
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', textAlign: 'left', cursor: 'pointer', transition: 'color 0.15s ease' }}
              >
                Creator Pricing
              </a>
            </div>
          </div>

          {/* Col 3: Resources */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Resources
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <a 
                href="#/about" 
                onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('about'); else window.location.hash = '#/about'; }}
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', textAlign: 'left', cursor: 'pointer', transition: 'color 0.15s ease' }}
              >
                About BangAI
              </a>
              <a 
                href="#/api" 
                onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('api'); else window.location.hash = '#/api'; }}
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', textAlign: 'left', cursor: 'pointer', transition: 'color 0.15s ease' }}
              >
                API Documentation
              </a>
              <span style={{ color: 'var(--text-muted)' }}>Status: 99.98% Operational</span>
              <a href="mailto:support@bangai.netlify.app" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Support & Contact</a>
            </div>
          </div>

          {/* Col 4: Legal & Compliance */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Legal & Compliance
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <a 
                href="#/privacy" 
                onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('privacy'); else window.location.hash = '#/privacy'; }}
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', textAlign: 'left', cursor: 'pointer', transition: 'color 0.15s ease' }}
              >
                Privacy Policy
              </a>
              <a 
                href="#/terms" 
                onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('terms'); else window.location.hash = '#/terms'; }}
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', textAlign: 'left', cursor: 'pointer', transition: 'color 0.15s ease' }}
              >
                Terms of Service
              </a>
              <a 
                href="#/compliance" 
                onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('compliance'); else window.location.hash = '#/compliance'; }}
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', textAlign: 'left', cursor: 'pointer', transition: 'color 0.15s ease' }}
              >
                Commercial Rights Compliance
              </a>
              <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '12px' }}>YouTube Terms of Service ↗</a>
            </div>
          </div>
        </div>

        {/* Mandatory YouTube API Services & Google Privacy Notice */}
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '24px',
          fontSize: '12px',
          lineHeight: 1.6,
          color: 'var(--text-muted)'
        }}>
          BangAI utilizes YouTube API Services to power automated video publishing and channel analytics. By connecting a YouTube account, you agree to be bound by the{' '}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
            YouTube Terms of Service
          </a>{' '}
          and acknowledge that your data is handled in accordance with the{' '}
          <a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
            Google Privacy Policy
          </a>. Users may revoke access at any time via{' '}
          <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
            Google Security Settings
          </a>.
        </div>

        {/* Bottom copyright */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px'
        }}>
          <div>
            © {new Date().getFullYear()} Bang AI. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Empowering viral video creators across all platforms with <Heart size={13} color="#f43f5e" fill="#f43f5e" />
          </div>
        </div>
      </div>
    </footer>
  );
}
