import React, { useState } from 'react';
import { 
  User, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Key, 
  Copy, 
  Check, 
  ExternalLink, 
  TrendingUp, 
  Eye, 
  Flame, 
  Crown, 
  ShieldCheck,
  Film
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

export default function ProfilePage({ user, onNavigateToDashboard, onNavigateToSettings }) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [apiKey] = useState('sk_live_98a7bc62e0f4192b_shortsai_prod');

  const handleCopyKey = () => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      {/* Profile Header Card */}
      <div className="saas-card" style={{
        padding: '32px',
        borderRadius: '24px',
        border: '1.5px solid var(--border-glow)',
        boxShadow: 'var(--shadow-glow)',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(22px, 4vw, 28px)',
            fontWeight: 800,
            color: '#ffffff',
            boxShadow: '0 0 24px rgba(99, 102, 241, 0.5)'
          }}>
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 className="font-display" style={{ fontSize: 'clamp(20px, 3.6vw, 24px)', fontWeight: 800, color: 'var(--text-primary)' }}>
                {user?.name || 'Alex Rivera'}
              </h1>
              <span className="badge badge-brand" style={{ fontSize: '11px' }}>
                <Crown size={12} color="#f59e0b" fill="#f59e0b" />
                {user?.plan || 'Creator Pro'}
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              {user?.email || 'alex.creator@shortsai.studio'} • Channel: <strong>{user?.channel || 'Viral Mysteries HQ'}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              onNavigateToDashboard();
            }}
            className="btn-glow"
            style={{ padding: '10px 20px', fontSize: '13.5px' }}
          >
            <Sparkles size={16} />
            <span>Launch Studio</span>
          </button>
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              onNavigateToSettings();
            }}
            className="btn-outline"
            style={{ padding: '10px 18px', fontSize: '13.5px' }}
          >
            <span>Edit Settings</span>
          </button>
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
        gap: '18px',
        marginBottom: '32px'
      }}>
        <div className="saas-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Shorts Created</span>
            <Film size={18} color="var(--accent-primary)" />
          </div>
          <div className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: 'var(--text-primary)' }}>
            24 Videos
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
            +6 this week (100% 75s compliant)
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Channel Views</span>
            <Eye size={18} color="#06b6d4" />
          </div>
          <div className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: 'var(--text-primary)' }}>
            1,480,200
          </div>
          <div style={{ fontSize: '11px', color: '#06b6d4', marginTop: '4px' }}>
            Top: Bermuda Triangle Short (890K)
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Audience Retention</span>
            <Flame size={18} color="#ef4444" />
          </div>
          <div className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: 'var(--text-primary)' }}>
            94.8%
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
            Strict 190–200 char pacing score
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Credits</span>
            <Zap size={18} color="#f59e0b" />
          </div>
          <div className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: 'var(--text-primary)' }}>
            100 / 100
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Renews on Sept 16, 2026
          </div>
        </div>
      </div>

      {/* Two Column Layout: Connected YouTube Channel + API Key */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '24px' }}>
        {/* Connected YouTube Channel Card */}
        <div className="saas-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#ef4444">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                YouTube Channel Integration
              </h3>
              <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} />
                OAuth 2.0 Connected & Verified
              </div>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            Shorts are uploaded automatically via YouTube Data API v3 as unlisted drafts or scheduled public premieres with auto-pinned comments.
          </p>

          <div style={{
            background: 'var(--bg-input)',
            padding: '12px 14px',
            borderRadius: '12px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div><strong>Channel ID:</strong> UC_vIr4lSh0rtsAi982736</div>
            <div><strong>Upload Privacy:</strong> Public Premiere (Peak 6:00 PM)</div>
          </div>
        </div>

        {/* API Key snapshot */}
        <div className="saas-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Key size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Studio API Secret Key
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                For n8n workflows & automation scripts
              </div>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            Use this secret key to trigger autonomous video runs from your external tools and workflows.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-input)',
            padding: '10px 14px',
            borderRadius: '12px',
            border: '1px solid var(--border-medium)',
            gap: '10px'
          }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {apiKey}
            </span>
            <button
              onClick={handleCopyKey}
              className="btn-glow"
              style={{ padding: '6px 12px', fontSize: '11px', flexShrink: 0 }}
            >
              {copiedKey ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedKey ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
