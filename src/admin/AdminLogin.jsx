import React, { useState } from 'react';
import { adminService } from './adminService';

export default function AdminLogin({ onLoginSuccess, onExitToApp, theme = 'dark', onToggleTheme }) {
  const [username, setUsername] = useState('@SuzainkhanSK');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminService.login(username, password);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Authentication failed. Please verify master credentials.');
      }
    } catch (err) {
      setError(err.message || 'Network error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--admin-bg-base, #07080d)',
      color: 'var(--admin-text-main, #f8fafc)',
      position: 'relative',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Top Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--admin-border-glass, rgba(255,255,255,0.08))',
        background: 'var(--admin-bg-surface, rgba(15, 18, 26, 0.75))',
        backdropFilter: 'blur(20px)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={onExitToApp}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--admin-accent-cyan, #06b6d4), var(--admin-accent-purple, #8b5cf6))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            👑
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              BangAI <span style={{ color: 'var(--admin-accent-cyan, #06b6d4)' }}>Admin</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--admin-text-sub, #94a3b8)', fontWeight: 600 }}>
              Master Security Gateway
            </div>
          </div>
        </div>

        {/* Right: Theme Toggle & Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              style={{
                background: 'var(--admin-bg-elevated, #151923)',
                border: '1px solid var(--admin-border-glass, rgba(255,255,255,0.08))',
                borderRadius: '9999px',
                padding: '6px 14px',
                color: 'var(--admin-text-main, #f8fafc)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
              <span style={{ textTransform: 'capitalize' }}>{theme}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExitToApp}
            className="admin-btn admin-btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            ← Back to App
          </button>
        </div>
      </header>

      {/* Main Login Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--admin-bg-surface, rgba(15, 18, 26, 0.85))',
          border: '1px solid var(--admin-border-glass, rgba(255,255,255,0.08))',
          borderRadius: '20px',
          padding: '36px 32px',
          backdropFilter: 'blur(30px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 32px rgba(6, 182, 212, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px'
        }}>
          {/* Header Card */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 16px auto',
              boxShadow: '0 0 24px rgba(6, 182, 212, 0.4)'
            }}>
              👑
            </div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 6px 0',
              color: 'var(--admin-text-main, #f8fafc)'
            }}>
              Master Administrator Login
            </h1>
            <p style={{
              fontSize: '13px',
              color: 'var(--admin-text-sub, #94a3b8)',
              margin: 0
            }}>
              Authenticate with master credentials to access the BangAI Command Center.
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: 500,
              textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub, #94a3b8)', marginBottom: '6px' }}>
                Master Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="admin-input"
                  placeholder="@SuzainkhanSK"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub, #94a3b8)', marginBottom: '6px' }}>
                Master Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="admin-input"
                  placeholder="Enter master password..."
                  autoFocus
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--admin-text-sub, #94a3b8)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '4px'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary"
              style={{ padding: '13px', width: '100%', marginTop: '6px', fontSize: '14px', fontWeight: 700 }}
            >
              {loading ? 'Authenticating...' : 'Access Command Center →'}
            </button>
          </form>

          {/* Security Notice */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--admin-border-glass, rgba(255,255,255,0.08))',
            fontSize: '11px',
            color: 'var(--admin-text-sub, #94a3b8)'
          }}>
            <span>🔒</span>
            <span>256-Bit Encrypted Master Session • HMAC-SHA256 Token</span>
          </div>
        </div>
      </div>
    </div>
  );
}
