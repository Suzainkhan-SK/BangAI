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
  EyeOff,
  Flame, 
  Crown, 
  ShieldCheck,
  Film,
  Plus,
  Trash2,
  Table,
  Radio,
  RefreshCw,
  AlertCircle,
  Star,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Share2,
  Calendar,
  Lock,
  Cpu,
  Download,
  Code2
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { getAuthToken } from '../utils/authClient';
import { useBreakpoint } from '../hooks/useMediaQuery';

export default function ProfilePage({ user, onNavigateToDashboard, onNavigateToSettings }) {
  const { isMobile, isTablet } = useBreakpoint();
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState('sk_live_98a7bc62e0f4192b_bang_ai_prod');
  const [channels, setChannels] = useState([]);
  const [sheetsList, setSheetsList] = useState([]);
  const [sheetsStatus, setSheetsStatus] = useState({ connected: false });
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [oauthNotice, setOauthNotice] = useState(null);

  // Modal State for Linking Custom Google Sheet
  const [showAddSheetModal, setShowAddSheetModal] = useState(false);
  const [sheetInputUrl, setSheetInputUrl] = useState('');
  const [sheetInputTitle, setSheetInputTitle] = useState('');
  const [isSubmittingSheet, setIsSubmittingSheet] = useState(false);

  // Fetch connected channels & sheets from Netlify serverless token vault
  const fetchPublishingData = async () => {
    setLoadingChannels(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/.netlify/functions/google-oauth?action=channels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data) {
        if (Array.isArray(data.channels)) setChannels(data.channels);
        if (Array.isArray(data.sheets)) setSheetsList(data.sheets);
        if (data.sheetsStatus) setSheetsStatus(data.sheetsStatus);
      }
    } catch (err) {
      console.error('Error loading publishing data:', err);
    } finally {
      setLoadingChannels(false);
    }
  };

  // Check URL params for OAuth callback return & Listen for Popup postMessage
  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.data?.type === 'BANG_OAUTH_SUCCESS') {
        const chName = event.data.channel || 'Account';
        setOauthNotice({ type: 'success', message: `🎉 Successfully connected: ${chName}!` });
        audioEngine.playSfx('boom');
        fetchPublishingData();
        setTimeout(fetchPublishingData, 700);
      } else if (event.data?.type === 'BANG_OAUTH_ERROR') {
        setOauthNotice({ type: 'error', message: `⚠️ Google authorization failed: ${event.data.error || 'Access denied'}` });
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    window.addEventListener('focus', fetchPublishingData);

    const hash = window.location.hash || '';
    const search = window.location.search || (hash.includes('?') ? hash.substring(hash.indexOf('?')) : '');
    const params = new URLSearchParams(search);

    if (params.get('oauth') === 'success') {
      const chName = params.get('channel') || 'Account';
      setOauthNotice({ type: 'success', message: `🎉 Successfully connected: ${chName}!` });
      audioEngine.playSfx('boom');
      fetchPublishingData();
      setTimeout(fetchPublishingData, 700);
      window.history.replaceState({}, document.title, window.location.pathname + '#/profile');
    } else if (params.get('error')) {
      setOauthNotice({ type: 'error', message: `⚠️ Google authorization failed: ${params.get('error')}` });
    }

    return () => {
      window.removeEventListener('message', handleOAuthMessage);
      window.removeEventListener('focus', fetchPublishingData);
    };
  }, []);

  useEffect(() => {
    fetchPublishingData();
  }, []);

  const handleCopyKey = () => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRollKey = () => {
    if (!window.confirm('Are you sure you want to regenerate this API key? Any existing backend automation scripts using the old key will need to be updated.')) return;
    audioEngine.playSfx('click');
    const newKey = 'sk_live_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10) + '_bang_ai_prod';
    setApiKey(newKey);
    setOauthNotice({ type: 'success', message: 'New Production API key generated successfully.' });
    audioEngine.playSfx('success');
  };

  // Connect Google Account (YouTube & Sheets)
  const handleConnectGoogle = () => {
    audioEngine.playSfx('shimmer');
    const token = getAuthToken();
    const userId = user?.id || user?._id || 'creator';
    const email = user?.email || '';
    const origin = window.location.origin;
    const connectUrl = `/.netlify/functions/google-oauth?action=connect&userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}&returnUrl=${encodeURIComponent(origin + '/#/profile')}&token=${encodeURIComponent(token || '')}`;

    const popupWidth = 560;
    const popupHeight = 680;
    const left = window.screenLeft + (window.outerWidth - popupWidth) / 2;
    const top = window.screenTop + (window.outerHeight - popupHeight) / 2;

    try {
      const popup = window.open(
        connectUrl,
        'BangGoogleOAuth',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},status=no,toolbar=no,menubar=no`
      );
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = connectUrl;
      }
    } catch (e) {
      window.location.href = connectUrl;
    }
  };

  // Set Default Channel
  const handleSetDefaultChannel = async (channelId) => {
    audioEngine.playSfx('click');
    try {
      const token = getAuthToken();
      await fetch('/.netlify/functions/google-oauth?action=set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ channelId })
      });
      setChannels(prev => prev.map(c => ({ ...c, isDefault: c.channelId === channelId })));
      setOauthNotice({ type: 'success', message: 'Default channel updated.' });
    } catch (err) {
      console.warn(err);
    }
  };

  // Disconnect Channel
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

  // 1-Click Auto Create Formatted Production Log Sheet
  const handleAutoCreateSheet = async () => {
    audioEngine.playSfx('shimmer');
    setIsSubmittingSheet(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/.netlify/functions/google-oauth?action=add-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok && data.sheet) {
        setSheetsList(prev => [data.sheet, ...prev]);
        setOauthNotice({ type: 'success', message: '🎉 Created new "Bang AI Production Log" sheet in your Google Drive!' });
        audioEngine.playSfx('boom');
      } else {
        throw new Error(data.error || 'Failed to auto-create sheet');
      }
    } catch (err) {
      if (err.message.includes('token') || err.message.includes('Unauthorized') || !sheetsStatus.connected) {
        handleConnectGoogle();
      } else {
        alert(err.message);
      }
    } finally {
      setIsSubmittingSheet(false);
    }
  };

  // Link Custom Google Sheet by ID or URL
  const handleLinkCustomSheet = async (e) => {
    e.preventDefault();
    if (!sheetInputUrl.trim()) return;
    audioEngine.playSfx('click');
    setIsSubmittingSheet(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/.netlify/functions/google-oauth?action=add-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          url: sheetInputUrl.trim(),
          title: sheetInputTitle.trim() || 'Custom Production Log'
        })
      });
      const data = await res.json();
      if (res.ok && data.sheet) {
        setSheetsList(prev => [data.sheet, ...prev]);
        setShowAddSheetModal(false);
        setSheetInputUrl('');
        setSheetInputTitle('');
        setOauthNotice({ type: 'success', message: '🎉 Google Sheet linked successfully!' });
        audioEngine.playSfx('success');
      } else {
        throw new Error(data.error || 'Failed to link spreadsheet');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmittingSheet(false);
    }
  };

  // Set Default Sheet
  const handleSetDefaultSheet = async (sheetId) => {
    audioEngine.playSfx('click');
    try {
      const token = getAuthToken();
      await fetch('/.netlify/functions/google-oauth?action=set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sheetId })
      });
      setSheetsList(prev => prev.map(s => ({ ...s, isDefault: (s.sheetId === sheetId || s.spreadsheetId === sheetId) })));
      setOauthNotice({ type: 'success', message: 'Default Google Sheet updated.' });
    } catch (err) {
      console.warn(err);
    }
  };

  // Disconnect Sheet
  const handleDisconnectSheet = async (sheetId, title) => {
    if (!window.confirm(`Are you sure you want to disconnect spreadsheet "${title}"?`)) return;
    audioEngine.playSfx('click');
    try {
      const token = getAuthToken();
      const res = await fetch('/.netlify/functions/google-oauth?action=disconnect-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sheetId })
      });
      if (res.ok) {
        setSheetsList(prev => prev.filter(s => s.sheetId !== sheetId && s.spreadsheetId !== sheetId));
        setOauthNotice({ type: 'success', message: `Spreadsheet "${title}" disconnected.` });
      }
    } catch (err) {
      alert('Failed to disconnect: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '20px 12px 60px 12px' : '40px 24px 80px 24px' }}>
      {/* ── NOTIFICATION TOAST ─────────────────────────────────────── */}
      {oauthNotice && (
        <div style={{
          background: oauthNotice.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1.5px solid ${oauthNotice.type === 'success' ? '#10b981' : '#ef4444'}`,
          padding: '14px 20px',
          borderRadius: '16px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: oauthNotice.type === 'success' ? '#10b981' : '#ef4444',
          fontSize: '14px',
          fontWeight: 600,
          boxShadow: 'var(--shadow-card)'
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

      {/* ── HEADER HERO ACCOUNT CARD ───────────────────────────────── */}
      <div className="saas-card" style={{
        padding: isMobile ? '20px 16px' : '36px',
        borderRadius: isMobile ? '18px' : '24px',
        marginBottom: isMobile ? '20px' : '28px',
        position: 'relative',
        overflow: 'hidden',
        border: '1.5px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)'
      }}>
        {/* Cosmic Ambient Highlight */}
        <div style={{
          position: 'absolute',
          top: '-120px',
          right: '-100px',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(255, 79, 0, 0.12), transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: isMobile ? '16px' : '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '14px' : '22px' }}>
            <div style={{
              width: isMobile ? '56px' : '80px',
              height: isMobile ? '56px' : '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary), #ff7733)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '22px' : '32px',
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 0 28px rgba(255, 79, 0, 0.35)',
              border: '3px solid var(--bg-card)',
              flexShrink: 0
            }}>
              {user?.name ? user.name[0].toUpperCase() : 'B'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 className="font-display" style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {user?.name || 'Bang AI Studio Creator'}
                </h1>
                <span style={{
                  background: 'rgba(255, 79, 0, 0.12)',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(255, 79, 0, 0.3)',
                  borderRadius: '99px',
                  padding: '2px 8px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  letterSpacing: '0.04em'
                }}>
                  <Crown size={11} /> {(user?.plan || 'PRO').toUpperCase()} TIER
                </span>
              </div>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '6px' }}>
                {user?.email || 'creator@bangai.studio'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <span>Status: <strong style={{ color: '#10b981' }}>Active</strong></span>
                <span>•</span>
                <span>Renewal: <strong>Monthly</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
            <button
              onClick={onNavigateToDashboard}
              className="btn-glow"
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                flex: isMobile ? '1' : 'none'
              }}
            >
              <Film size={15} />
              <span>Launch Studio</span>
            </button>
            <button
              onClick={fetchPublishingData}
              className="btn-outline"
              title="Refresh Account Data"
              style={{ padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loadingChannels ? 'spin-animation' : ''} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* ── RESOURCE USAGE GAUGES ───────────────────────────────── */}
        <div style={{
          marginTop: isMobile ? '18px' : '28px',
          paddingTop: isMobile ? '16px' : '24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: isMobile ? '10px' : '16px'
        }}>
          <div style={{
            background: 'var(--bg-input)',
            borderRadius: '14px',
            padding: '14px 16px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Monthly Video Generations</span>
              <strong style={{ color: 'var(--text-primary)' }}>24 / 50 Used</strong>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '48%', height: '100%', background: 'var(--accent-primary)' }} />
            </div>
          </div>

          <div style={{
            background: 'var(--bg-input)',
            borderRadius: '14px',
            padding: '14px 16px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Studio Voice Minutes</span>
              <strong style={{ color: 'var(--text-primary)' }}>42 / 120 mins</strong>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '35%', height: '100%', background: '#10b981' }} />
            </div>
          </div>

          <div style={{
            background: 'var(--bg-input)',
            borderRadius: '14px',
            padding: '14px 16px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Cloud Render Storage</span>
              <strong style={{ color: 'var(--text-primary)' }}>3.4 / 25 GB</strong>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '14%', height: '100%', background: '#38bdf8' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── PROFILE SUB-NAVIGATION TABS ────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '8px',
        marginBottom: isMobile ? '20px' : '28px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {[
          { id: 'overview', label: 'YouTube Channels', count: channels.length, icon: <Film size={15} /> },
          { id: 'sheets', label: 'Google Sheets Sync', count: sheetsList.length, icon: <Table size={15} /> },
          { id: 'api', label: 'API Keys & Developers', icon: <Key size={15} /> },
          { id: 'security', label: 'Security & Access', icon: <ShieldCheck size={15} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                audioEngine.playSfx('click');
                setActiveTab(tab.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '8px 12px' : '9px 16px',
                borderRadius: '10px',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                fontSize: isMobile ? '12px' : '13px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-pill)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: YOUTUBE & PLATFORMS ─────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '18px' : '28px' }}>
          <div className="saas-card" style={{ padding: isMobile ? '20px 14px' : '32px', borderRadius: isMobile ? '18px' : '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
                  <h2 className="font-display" style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Connected YouTube Channels
                  </h2>
                  <span style={{ fontSize: '12px', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '99px', color: 'var(--text-muted)' }}>
                    {channels.length} Linked
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Select which YouTube channel your generated videos automatically upload to directly from the Studio.
                </p>
              </div>

              <button
                onClick={handleConnectGoogle}
                className="btn-glow"
                style={{
                  padding: '9px 18px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: isMobile ? '100%' : 'auto',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
                }}
              >
                <Plus size={16} />
                <span>+ Connect YouTube Channel</span>
              </button>
            </div>

            {/* Expired Token Notice Banner */}
            {channels.some(c => c.needsReconnect || c.isTokenExpired) && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '16px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ef4444' }}>
                      Action Required: YouTube Token Expired
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Google requires periodic re-authorization. Click Reconnect to resume automated publishing.
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleConnectGoogle}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={13} />
                  <span>⚡ Reconnect Channel</span>
                </button>
              </div>
            )}

            {channels.length === 0 ? (
              <div style={{
                background: 'var(--bg-input)',
                borderRadius: '16px',
                padding: '36px 20px',
                textAlign: 'center',
                border: '1px dashed var(--border-medium)'
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
                  <Film size={24} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  No YouTube Channels Connected
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 16px auto' }}>
                  Connect your YouTube channel to enable 1-click autonomous uploading of AI-generated videos and Shorts directly from Bang AI.
                </p>
                <button
                  onClick={handleConnectGoogle}
                  className="btn-glow"
                  style={{ padding: '8px 18px', fontSize: '13px', margin: '0 auto', background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                >
                  + Connect YouTube Channel
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '16px' }}>
                {channels.map((ch) => {
                  const isExpired = !!(ch.needsReconnect || ch.isTokenExpired);
                  return (
                    <div 
                      key={ch.channelId}
                      style={{
                        background: 'var(--bg-input)',
                        border: isExpired ? '1.5px solid #ef4444' : (ch.isDefault ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)'),
                        borderRadius: '16px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {ch.avatarUrl ? (
                            <img 
                              src={ch.avatarUrl} 
                              alt={ch.channelTitle} 
                              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: isExpired ? '2px solid #ef4444' : '2px solid var(--border-subtle)' }}
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {ch.isDefault && (
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: '#fbbf24',
                              background: 'rgba(251, 191, 36, 0.15)',
                              padding: '2px 7px',
                              borderRadius: '99px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <Star size={10} /> Default
                            </span>
                          )}
                          {isExpired ? (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#ef4444',
                              background: 'rgba(239, 68, 68, 0.18)',
                              padding: '3px 8px',
                              borderRadius: '99px'
                            }}>
                              Expired
                            </span>
                          ) : (
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
                          )}
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        background: 'var(--bg-elevated)',
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
                          <span style={{ color: 'var(--text-muted)' }}>Default Privacy:</span>{' '}
                          <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                            {ch.defaultPrivacy || 'Public'}
                          </strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                        {!ch.isDefault ? (
                          <button
                            onClick={() => handleSetDefaultChannel(ch.channelId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Star size={12} /> Set as Default
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#10b981' }}>⚡ Active in Prompt Bar</span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={12} />
                            <span>Disconnect</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: GOOGLE SHEETS CLOUD SYNC ────────────────────────── */}
      {activeTab === 'sheets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '18px' : '28px' }}>
          <div className="saas-card" style={{ padding: isMobile ? '20px 14px' : '32px', borderRadius: isMobile ? '18px' : '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                  <h2 className="font-display" style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Google Sheets Multi-Sheet Sync
                  </h2>
                  <span style={{ fontSize: '12px', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '99px', color: 'var(--text-muted)' }}>
                    {sheetsList.length} Connected
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Automatically append video prompts, generated scripts, voiceover URLs, and live video links into Google Sheets.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                <button
                  onClick={handleAutoCreateSheet}
                  disabled={isSubmittingSheet}
                  className="btn-glow"
                  style={{
                    padding: '9px 16px',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: isMobile ? '100%' : 'auto',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Plus size={15} />
                  <span>{isSubmittingSheet ? 'Creating...' : '+ 1-Click Auto-Create Log Sheet'}</span>
                </button>
                <button
                  onClick={() => setShowAddSheetModal(true)}
                  className="btn-outline"
                  style={{
                    padding: '9px 16px',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  <FileSpreadsheet size={15} />
                  <span>Link Existing Sheet</span>
                </button>
              </div>
            </div>

            {sheetsList.length === 0 ? (
              <div style={{
                background: 'var(--bg-input)',
                borderRadius: '16px',
                padding: '36px 20px',
                textAlign: 'center',
                border: '1px dashed var(--border-medium)'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}>
                  <Table size={24} color="#10b981" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  No Google Sheets Connected
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 16px auto' }}>
                  Click <strong>"+ 1-Click Auto-Create Log Sheet"</strong> to automatically generate a formatted spreadsheet in your Google Drive.
                </p>
                <button
                  onClick={handleAutoCreateSheet}
                  className="btn-glow"
                  style={{ padding: '8px 18px', fontSize: '13px', margin: '0 auto', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  + 1-Click Auto-Create Log Sheet
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '16px' }}>
                {sheetsList.map((sheet) => (
                  <div 
                    key={sheet.sheetId || sheet.spreadsheetId}
                    style={{
                      background: 'var(--bg-input)',
                      border: sheet.isDefault ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {sheet.title || 'Production Log'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Tab: <strong>{sheet.sheetName || 'Sheet1'}</strong>
                          </div>
                        </div>
                      </div>

                      {sheet.isDefault && (
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: '#fbbf24',
                          background: 'rgba(251, 191, 36, 0.15)',
                          padding: '2px 7px',
                          borderRadius: '99px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Star size={10} /> Default
                        </span>
                      )}
                    </div>

                    {sheet.spreadsheetId && (
                      <div style={{
                        background: 'var(--bg-elevated)',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                          ID: {sheet.spreadsheetId}
                        </span>
                        <a
                          href={sheet.url || `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}/edit`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}
                        >
                          <span>Open in Drive</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                      {!sheet.isDefault ? (
                        <button
                          onClick={() => handleSetDefaultSheet(sheet.sheetId || sheet.spreadsheetId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Star size={12} /> Set as Default
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#10b981' }}>⚡ Active in Prompt Bar</span>
                      )}
                      <button
                        onClick={() => handleDisconnectSheet(sheet.sheetId || sheet.spreadsheetId, sheet.title)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
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
        </div>
      )}

      {/* ── TAB 3: API KEYS & DEVELOPER ACCESS ─────────────────────── */}
      {activeTab === 'api' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '18px' : '24px' }}>
          <div className="saas-card" style={{ padding: isMobile ? '20px 14px' : '32px', borderRadius: isMobile ? '18px' : '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 79, 0, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Key size={22} color="var(--accent-primary)" />
                </div>
                <div>
                  <h3 className="font-display" style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Bang AI Developer API Keys
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    For automated pipelines and scripts
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
                <button
                  onClick={handleRollKey}
                  className="btn-outline"
                  style={{
                    padding: '8px 14px',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Roll Key</span>
                </button>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Use your secret API key to authenticate requests against the Bang AI REST API. Keep this key confidential and never commit it to client-side code repositories.
            </p>

            <div style={{
              background: 'var(--bg-input)',
              padding: isMobile ? '14px 12px' : '16px',
              borderRadius: '14px',
              border: '1.5px solid var(--border-medium)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Secret Production Key:
                </span>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                  Active • Read / Write
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: isMobile ? '12px' : '13px',
                  color: 'var(--text-primary)',
                  flex: isMobile ? '1 1 100%' : 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-all',
                  marginBottom: isMobile ? '6px' : '0'
                }}>
                  {showKey ? apiKey : 'sk_live_98a7bc••••••••••••••••prod'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>

                  <button
                    onClick={handleCopyKey}
                    className="btn-glow"
                    style={{ padding: '7px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {copiedKey ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Scope Permissions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              fontSize: '12px',
              color: 'var(--text-muted)'
            }}>
              <span>Scopes:</span>
              <span className="badge badge-brand" style={{ fontSize: '11px', padding: '2px 8px' }}>videos:create</span>
              <span className="badge badge-brand" style={{ fontSize: '11px', padding: '2px 8px' }}>status:read</span>
              <span className="badge badge-brand" style={{ fontSize: '11px', padding: '2px 8px' }}>webhooks:subscribe</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: SECURITY & ACCESS ───────────────────────────────── */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '18px' : '24px' }}>
          <div className="saas-card" style={{ padding: isMobile ? '20px 14px' : '32px', borderRadius: isMobile ? '18px' : '24px' }}>
            <h3 className="font-display" style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#10b981" />
              <span>Account Security & Login Sessions</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '8px' : '0',
                padding: '14px 0',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Google OAuth Single Sign-On
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Protected by Google Account identity token vault and refresh rotation.
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> Connected & Active
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '8px' : '0',
                padding: '14px 0',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Active Browser Session
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Current active workspace session token authenticated via JWT.
                  </div>
                </div>
                <span style={{ fontSize: '11.5px', background: 'var(--bg-input)', padding: '4px 10px', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                  Current Device (Verified)
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '10px' : '0',
                padding: '14px 0'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Export Personal Workspace Data
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Download a JSON copy of your channel configurations and generation records.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const exportData = {
                      user: user?.name,
                      email: user?.email,
                      channelsCount: channels.length,
                      sheetsCount: sheetsList.length,
                      exportedAt: new Date().toISOString()
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `bangai-account-${Date.now()}.json`;
                    a.click();
                  }}
                  className="btn-outline"
                  style={{
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  <Download size={13} />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: LINK EXISTING GOOGLE SHEET ─────────────────────── */}
      {showAddSheetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="saas-card" style={{
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-medium)',
            borderRadius: isMobile ? '18px' : '20px',
            padding: isMobile ? '20px 16px' : '28px',
            maxWidth: '480px',
            width: '100%',
            position: 'relative'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              📊 Link Existing Google Spreadsheet
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              Paste your Google Sheet link or Spreadsheet ID below. Generated video production data will be appended as new rows.
            </p>

            <form onSubmit={handleLinkCustomSheet}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Spreadsheet Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Video Production Matrix"
                  value={sheetInputTitle}
                  onChange={(e) => setSheetInputTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Google Sheet URL or Spreadsheet ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit"
                  value={sheetInputUrl}
                  onChange={(e) => setSheetInputUrl(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSheetModal(false)}
                  className="btn-outline"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSheet}
                  className="btn-glow"
                  style={{ padding: '8px 20px', fontSize: '13px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  {isSubmittingSheet ? 'Connecting...' : 'Connect Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
