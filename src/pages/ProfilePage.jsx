import React, { useState, useEffect } from 'react';
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
  Film,
  Plus,
  Trash2,
  Table,
  Radio,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { getAuthToken } from '../utils/authClient';

export default function ProfilePage({ user, onNavigateToDashboard, onNavigateToSettings }) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [apiKey] = useState('sk_live_98a7bc62e0f4192b_bang_ai_prod');
  const [channels, setChannels] = useState([]);
  const [sheets, setSheets] = useState({ connected: false });
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [oauthNotice, setOauthNotice] = useState(null);

  // Fetch connected channels & sheets from Netlify serverless token vault
  const fetchChannels = async () => {
    setLoadingChannels(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/.netlify/functions/google-oauth?action=channels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.channels) {
        setChannels(data.channels);
        setSheets(data.sheets || { connected: false });
      }
    } catch (err) {
      console.error('Error loading channels:', err);
    } finally {
      setLoadingChannels(false);
    }
  };

  // Check URL params for OAuth callback return
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || (hash.includes('?') ? hash.substring(hash.indexOf('?')) : '');
    const params = new URLSearchParams(search);

    if (params.get('oauth') === 'success') {
      const chName = params.get('channel') || 'YouTube Channel';
      setOauthNotice({ type: 'success', message: `🎉 Successfully connected: ${chName}!` });
      audioEngine.playSfx('boom');
      fetchChannels();
      // Clean up URL without reload
      window.history.replaceState({}, document.title, window.location.pathname + '#/profile');
    } else if (params.get('error')) {
      setOauthNotice({ type: 'error', message: `⚠️ Google authorization failed: ${params.get('error')}` });
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleCopyKey = () => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleConnectChannel = () => {
    audioEngine.playSfx('click');
    const token = getAuthToken();
    const returnUrl = encodeURIComponent(window.location.origin + '/#/profile');
    window.location.href = `/.netlify/functions/google-oauth?action=connect&token=${token}&returnUrl=${returnUrl}`;
  };

  const handleDisconnectChannel = async (channelId, title) => {
    if (!window.confirm(`Are you sure you want to disconnect channel "${title}"?`)) return;
    audioEngine.playSfx('click');
    try {
      const token = getAuthToken();
      const res = await fetch('/.netlify/functions/google-oauth?action=disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ channelId })
      });
      if (res.ok) {
        setChannels(prev => prev.filter(c => c.channelId !== channelId));
        setOauthNotice({ type: 'success', message: `Channel "${title}" disconnected.` });
      }
    } catch (err) {
      alert('Failed to disconnect: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      {/* OAuth Banner Notification */}
      {oauthNotice && (
        <div style={{
          background: oauthNotice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${oauthNotice.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          padding: '14px 20px',
          borderRadius: '14px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: oauthNotice.type === 'success' ? '#10b981' : '#ef4444',
          fontSize: '14px',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {oauthNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{oauthNotice.message}</span>
          </div>
          <button 
            onClick={() => setOauthNotice(null)} 
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '13px' }}
          >
            ✕
          </button>
        </div>
      )}

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
            {user?.name ? user.name[0].toUpperCase() : 'B'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 className="font-display" style={{ fontSize: 'clamp(20px, 3.6vw, 24px)', fontWeight: 800, color: 'var(--text-primary)' }}>
                {user?.name || 'Bang Creator'}
              </h1>
              <span className="badge badge-brand" style={{ fontSize: '11px' }}>
                <Crown size={12} color="#f59e0b" fill="#f59e0b" />
                {user?.plan || 'Creator Pro'}
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              {user?.email || 'creator@bangai.studio'} • Connected Channels: <strong>{channels.length} YouTube {channels.length === 1 ? 'Channel' : 'Channels'}</strong>
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
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Grid: 4 Metric Cards (Real User Data) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
        gap: '18px',
        marginBottom: '32px'
      }}>
        <div className="saas-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Studio Credits</span>
            <Zap size={18} color="#f59e0b" />
          </div>
          <div className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: 'var(--text-primary)' }}>
            {typeof user?.credits === 'number' ? user.credits : 100}
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
            Available for 5-Scene Render
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Connected YouTube Channels</span>
            <Film size={18} color="#ef4444" />
          </div>
          <div className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: 'var(--text-primary)' }}>
            {channels.length} {channels.length === 1 ? 'Channel' : 'Channels'}
          </div>
          <div style={{ fontSize: '11px', color: channels.length > 0 ? '#10b981' : 'var(--text-muted)', marginTop: '4px' }}>
            {channels.length > 0 ? 'Ready for 1-Click Publishing' : 'Click below to connect'}
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Channel Subscribers</span>
            <Eye size={18} color="#06b6d4" />
          </div>
          <div className="font-display" style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, color: 'var(--text-primary)' }}>
            {channels.reduce((sum, c) => sum + Number(c.subscriberCount || 0), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#06b6d4', marginTop: '4px' }}>
            Live count across connected channels
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Studio Membership</span>
            <Crown size={18} color="var(--accent-primary)" />
          </div>
          <div className="font-display" style={{ fontSize: 'clamp(20px, 3.6vw, 24px)', fontWeight: 800, color: 'var(--text-primary)' }}>
            {user?.plan || 'Creator Pro'}
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
            Wan 2.1 + ElevenLabs Pro
          </div>
        </div>
      </div>

      {/* ── SECTION: MULTI-CHANNEL YOUTUBE INTEGRATION ──────────────── */}
      <div className="saas-card" style={{ padding: '28px', borderRadius: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Connected YouTube Channels
                <span className="badge-pill badge-indigo" style={{ fontSize: '11px' }}>
                  {channels.length} {channels.length === 1 ? 'Channel' : 'Channels'}
                </span>
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Publish generated Shorts directly to your channels via official Google OAuth 2.0 with automatic token refresh.
              </p>
            </div>
          </div>

          <button
            onClick={handleConnectChannel}
            className="btn-glow"
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              gap: '6px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
            }}
          >
            <Plus size={16} />
            <span>Connect YouTube Channel</span>
          </button>
        </div>

        {/* Channel Cards Grid */}
        {loadingChannels ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
            <div>Loading your connected channels...</div>
          </div>
        ) : channels.length === 0 ? (
          <div style={{
            background: 'var(--bg-input)',
            border: '1.5px dashed var(--border-medium)',
            borderRadius: '16px',
            padding: '36px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No YouTube Channels Connected Yet
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
              Connect your YouTube channel in 3 seconds to auto-upload 1080p Shorts with animated subtitles, hashtags, and pinned comments.
            </p>
            <button
              onClick={handleConnectChannel}
              className="btn-glow"
              style={{
                padding: '9px 20px',
                fontSize: '13px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              }}
            >
              <Plus size={15} />
              <span>Connect Now with Google</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '16px' }}>
            {channels.map((ch) => (
              <div
                key={ch.channelId}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {ch.avatarUrl ? (
                      <img 
                        src={ch.avatarUrl} 
                        alt={ch.channelTitle} 
                        style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(239, 68, 68, 0.4)' }}
                      />
                    ) : (
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ef4444',
                        fontWeight: 800
                      }}>
                        {ch.channelTitle ? ch.channelTitle[0].toUpperCase() : 'Y'}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {ch.channelTitle}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {ch.customUrl || `@${ch.channelId.substring(0, 10)}`}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '3px 8px',
                    borderRadius: '99px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <CheckCircle2 size={11} /> Verified
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Subscribers:</span>{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {Number(ch.subscriberCount || 0).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Privacy:</span>{' '}
                    <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {ch.defaultPrivacy || 'Public'}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Auto-refresh active ⚡
                  </span>
                  <button
                    onClick={() => handleDisconnectChannel(ch.channelId, ch.channelTitle)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={12} />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION: GOOGLE SHEETS AUTO-SYNC + API SECRET KEY ──────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '24px' }}>
        {/* Google Sheets Integration Card */}
        <div className="saas-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Table size={20} color="#10b981" />
            </div>
            <div>
              <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Google Sheets Auto-Sync
              </h3>
              <div style={{ fontSize: '12px', color: sheets.connected ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} />
                {sheets.connected ? 'Auto-Logging Active' : 'Ready to Connect'}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            Automatically append video metadata, screenplay drafts, MP4 URLs, and live YouTube links to your personal Google Sheet.
          </p>

          <div style={{
            background: 'var(--bg-input)',
            padding: '12px 14px',
            borderRadius: '12px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            marginBottom: '14px'
          }}>
            <div><strong>Status:</strong> {sheets.connected ? 'Connected to Google Drive' : 'Sync Enabled'}</div>
            <div><strong>Spreadsheet:</strong> Bang AI Production Matrix</div>
          </div>

          {!sheets.connected && (
            <button
              onClick={handleConnectChannel}
              className="btn-outline"
              style={{ width: '100%', justifyContent: 'center', padding: '9px 14px', fontSize: '12.5px', gap: '6px' }}
            >
              <Table size={14} />
              <span>Link Google Sheets</span>
            </button>
          )}
        </div>

        {/* API Key Card */}
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
                Bang AI Studio Secret Key
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
