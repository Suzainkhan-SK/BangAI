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
  AlertCircle,
  Star,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { getAuthToken } from '../utils/authClient';

export default function ProfilePage({ user, onNavigateToDashboard, onNavigateToSettings }) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [apiKey] = useState('sk_live_98a7bc62e0f4192b_bang_ai_prod');
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
      // If user hasn't authorized Google yet, trigger OAuth
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

      {/* ── HEADER HERO ────────────────────────────────────────────── */}
      <div className="saas-card" style={{
        padding: '36px',
        borderRadius: '24px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{
          position: 'absolute',
          top: '-120px',
          right: '-100px',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15), transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 0 24px rgba(14, 165, 233, 0.4)'
            }}>
              {user?.name ? user.name[0].toUpperCase() : 'B'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 className="font-display" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {user?.name || 'Bang AI Creator'}
                </h1>
                <span style={{
                  background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(245, 158, 11, 0.2))',
                  color: '#fbbf24',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  borderRadius: '99px',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Crown size={12} /> {(user?.plan || 'PRO').toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {user?.email || 'creator@bangai.studio'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onNavigateToDashboard}
              className="btn-glow"
              style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Film size={15} />
              <span>Launch Studio</span>
            </button>
            <button
              onClick={fetchPublishingData}
              className="btn-outline"
              title="Refresh Account Data"
              style={{ padding: '10px 14px', fontSize: '13px' }}
            >
              <RefreshCw size={15} className={loadingChannels ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: CONNECTED YOUTUBE CHANNELS ────────────────── */}
      <div className="saas-card" style={{ padding: '32px', borderRadius: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
              <h2 className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Connected YouTube Channels
              </h2>
              <span style={{ fontSize: '12px', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '99px', color: 'var(--text-muted)' }}>
                {channels.length} Connected
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Select which YouTube channel your generated videos automatically upload to directly inside the prompt bar.
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
              gap: '6px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
            }}
          >
            <Plus size={16} />
            <span>+ Connect YouTube Channel</span>
          </button>
        </div>

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
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 16px auto' }}>
              Connect your YouTube channel to enable 1-click autonomous uploading of 75-second Shorts directly from Bang AI.
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '16px' }}>
            {channels.map((ch) => (
              <div 
                key={ch.channelId}
                style={{
                  background: 'var(--bg-input)',
                  border: ch.isDefault ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid var(--border-subtle)',
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
                      onMouseEnter={e => e.currentTarget.style.color = '#fbbf24'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Star size={12} /> Set as Default
                    </button>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#10b981' }}>⚡ Active in Prompt Bar</span>
                  )}
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

      {/* ── SECTION 2: MULTI-SHEET GOOGLE SHEETS INTEGRATION ────── */}
      <div className="saas-card" style={{ padding: '32px', borderRadius: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              <h2 className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Google Sheets Multi-Sheet Sync
              </h2>
              <span style={{ fontSize: '12px', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '99px', color: 'var(--text-muted)' }}>
                {sheetsList.length} Connected
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Connect multiple spreadsheets to log video prompts, scripts, scene data, and live YouTube URLs. Select your target sheet directly in the prompt bar.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleAutoCreateSheet}
              disabled={isSubmittingSheet}
              className="btn-glow"
              style={{
                padding: '9px 16px',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
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
              style={{ padding: '9px 16px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
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
              Click <strong>"+ 1-Click Auto-Create Log Sheet"</strong> to create a ready-made tracking spreadsheet in your Google Drive or link an existing sheet.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={handleAutoCreateSheet}
                className="btn-glow"
                style={{ padding: '8px 18px', fontSize: '13px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                + 1-Click Auto-Create Log Sheet
              </button>
              <button
                onClick={() => setShowAddSheetModal(true)}
                className="btn-outline"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                Link Existing Sheet URL
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '16px' }}>
            {sheetsList.map((sheet) => (
              <div 
                key={sheet.sheetId || sheet.spreadsheetId}
                style={{
                  background: 'var(--bg-input)',
                  border: sheet.isDefault ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid var(--border-subtle)',
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      <CheckCircle2 size={11} /> Auto-Sync Active
                    </span>
                  </div>
                </div>

                {sheet.spreadsheetId && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
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
                      onMouseEnter={e => e.currentTarget.style.color = '#fbbf24'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
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
          padding: '20px'
        }}>
          <div className="saas-card" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '480px',
            width: '100%',
            position: 'relative'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              📊 Link Existing Google Spreadsheet
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              Paste your Google Sheet link or Spreadsheet ID below. Generated shorts data will be appended as new rows.
            </p>

            <form onSubmit={handleLinkCustomSheet}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Spreadsheet Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. My YouTube Production Matrix"
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

      {/* ── SECTION 3: API SECRET KEY CARD ───────────────────────── */}
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
  );
}
