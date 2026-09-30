import React, { useState, useEffect } from 'react';
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { loginUser, initiateGoogleAuth } from '../utils/authClient';
import GoogleAuthButton from '../components/Auth/GoogleAuthButton';

export default function LoginPage({ onLoginSuccess, onNavigateToRegister, onNavigateToLanding }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleConflict, setIsGoogleConflict] = useState(false);

  // Check URL params for error messages
  useEffect(() => {
    const search = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
    const params = new URLSearchParams(search);
    const err = params.get('error');
    if (err) {
      const decoded = decodeURIComponent(err);
      setErrorMessage(decoded);
      if (decoded.toLowerCase().includes('google')) {
        setIsGoogleConflict(true);
      }
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.getModifierState && typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsGoogleConflict(false);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    audioEngine.playSfx('click');
    setIsLoading(true);

    try {
      const data = await loginUser(email.trim().toLowerCase(), password);
      audioEngine.playSfx('boom');
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      console.error('[LoginPage] Login error:', err);
      audioEngine.playSfx('click');
      const msg = err.message || 'Invalid email or password.';
      setErrorMessage(msg);
      if (msg.toLowerCase().includes('google sign-in') || msg.toLowerCase().includes('continue with google')) {
        setIsGoogleConflict(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRedirect = () => {
    audioEngine.playSfx('click');
    initiateGoogleAuth('dashboard');
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 66px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative'
    }}>
      {/* Background Radiant Glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '640px',
        height: '380px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(6, 182, 212, 0.12) 45%, transparent 70%)',
        filter: 'blur(75px)',
        pointerEvents: 'none'
      }} />

      <div className="saas-card" style={{
        width: '100%',
        maxWidth: '460px',
        borderRadius: '24px',
        padding: '36px 32px',
        border: '1.5px solid var(--border-glow)',
        boxShadow: 'var(--shadow-glow)',
        position: 'relative',
        zIndex: 10,
        backdropFilter: 'blur(20px)',
        background: 'var(--bg-card)'
      }}>
        {/* Top Back Link */}
        {typeof onNavigateToLanding === 'function' && (
          <button
            type="button"
            onClick={() => {
              audioEngine.playSfx('click');
              onNavigateToLanding();
            }}
            style={{
              position: 'absolute',
              top: '20px',
              left: '22px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 6px',
              borderRadius: '6px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ArrowLeft size={13} />
            <span>Home</span>
          </button>
        )}

        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '4px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'var(--grad-gemini)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            boxShadow: '0 0 24px rgba(56, 189, 248, 0.45)'
          }}>
            <Sparkles size={24} color="#ffffff" />
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(21px, 3.8vw, 26px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Sign In to Bang AI
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Access your autonomous video generation studio.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            background: isGoogleConflict ? 'rgba(99, 102, 241, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${isGoogleConflict ? 'rgba(99, 102, 241, 0.4)' : 'rgba(239, 68, 68, 0.35)'}`,
            borderRadius: '14px',
            padding: '12px 14px',
            marginBottom: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color: isGoogleConflict ? 'var(--text-primary)' : '#ef4444',
            fontSize: '13px',
            lineHeight: 1.4
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={17} style={{ flexShrink: 0, color: isGoogleConflict ? 'var(--accent-primary)' : '#ef4444' }} />
              <span>{errorMessage}</span>
            </div>
            {isGoogleConflict && (
              <button
                type="button"
                onClick={handleGoogleRedirect}
                className="btn-glow"
                style={{
                  alignSelf: 'flex-start',
                  marginTop: '4px',
                  padding: '6px 14px',
                  fontSize: '12px'
                }}
              >
                Sign In with Google Now →
              </button>
            )}
          </div>
        )}

        {/* Unified Single Google 1-Click Sign-In Button */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <GoogleAuthButton
            text="continue_with"
            theme="filled_blue"
            width={396}
            onSuccess={(user) => {
              audioEngine.playSfx('boom');
              if (typeof onLoginSuccess === 'function') {
                onLoginSuccess(user);
              }
            }}
            onError={(err) => {
              console.error('[LoginPage] Google auth error:', err);
              setErrorMessage(err.message || 'Google authentication failed.');
            }}
          />
        </div>

        {/* OR Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '20px 0',
          gap: '12px',
          color: 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.05em'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>OR SIGN IN WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  padding: '10px 12px 10px 38px',
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Password
              </label>
              {capsLockOn && (
                <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                  ⚠️ Caps Lock is ON
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyDown}
                required
                disabled={isLoading}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  padding: '10px 38px 10px 38px',
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-glow"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Studio</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Security Assurance Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '18px',
          color: 'var(--text-muted)',
          fontSize: '11px'
        }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>PBKDF2 Encrypted • 256-Bit SSL Protection</span>
        </div>

        {/* Footer switcher */}
        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => {
              audioEngine.playSfx('click');
              if (typeof onNavigateToRegister === 'function') onNavigateToRegister();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
