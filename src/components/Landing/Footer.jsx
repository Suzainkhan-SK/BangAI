import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-app)',
      padding: '60px 0 30px 0',
      color: 'var(--text-muted)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
              <span className="font-display" style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)' }}>
                ShortsAI
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>AI Storyboard Engine</a>
              <a href="#templates" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Viral Templates</a>
              <a href="#showcase" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Grok Imagine 1.5 Video</a>
              <a href="#pricing" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>ElevenLabs Voices</a>
            </div>
          </div>

          {/* Col 3: Resources */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Resources
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Documentation & Guides</span>
              <span style={{ color: 'var(--text-secondary)' }}>n8n Pipeline Architecture</span>
              <span style={{ color: 'var(--text-secondary)' }}>API Status: Operational</span>
              <span style={{ color: 'var(--text-secondary)' }}>Creator Community</span>
            </div>
          </div>

          {/* Col 4: Legal */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Platform
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Privacy Policy</span>
              <span style={{ color: 'var(--text-secondary)' }}>Terms of Service</span>
              <span style={{ color: 'var(--text-secondary)' }}>YouTube Safety Compliance</span>
            </div>
          </div>
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
            © {new Date().getFullYear()} ShortsAI Studio. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Built for viral YouTube Shorts creation with <Heart size={13} color="#f43f5e" fill="#f43f5e" />
          </div>
        </div>
      </div>
    </footer>
  );
}
