import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, User, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { loginUser, registerUser, initiateGoogleAuth } from '../../utils/authClient';
import { renderGoogleSignInButton } from '../../utils/googleAuthHelper';

export default function AuthModal({ isOpen, onClose, initialTab = 'signin', onLoginSuccess }) {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleConflict, setIsGoogleConflict] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen && googleBtnRef.current) {
      const cleanup = renderGoogleSignInButton(googleBtnRef.current, {
        text: tab === 'signin' ? 'continue_with' : 'signup_with',
        theme: 'filled_blue',
        width: 376,
        onSuccess: (user) => {
          audioEngine.playSfx('boom');
          if (typeof onLoginSuccess === 'function') {
            onLoginSuccess(user);
          }
          onClose();
        },
        onError: (err) => {
          console.error('[AuthModal] Google auth error:', err);
          setErrorMessage(err.message || 'Google authentication failed.');
        }
      });
      return cleanup;
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsGoogleConflict(false);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (tab === 'signup' && !name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    audioEngine.playSfx('click');
    setIsLoading(true);

    try {
      let data;
      if (tab === 'signin') {
        data = await loginUser(email.trim().toLowerCase(), password);
      } else {
        data = await registerUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          plan: 'pro'
        });
      }

      audioEngine.playSfx('boom');
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(data.user);
      }
      onClose();
    } catch (err) {
      console.error('[AuthModal] Auth error:', err);
      audioEngine.playSfx('click');
      const msg = err.message || 'Authentication failed. Please check your credentials.';
      setErrorMessage(msg);
      if (msg.toLowerCase().includes('google sign-in') || msg.toLowerCase().includes('google')) {
        setIsGoogleConflict(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    audioEngine.playSfx('click');
    initiateGoogleAuth('dashboard');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(3, 7, 18, 0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 250,
      padding: '20px'
    }}>
      <div className="saas-card" style={{
        width: '100%',
        maxWidth: '440px',
        borderRadius: '24px',
        padding: '32px',
        position: 'relative',
        boxShadow: 'var(--shadow-glow)',
        border: '1.5px solid var(--border-glow)'
      }}>
        {/* Close Button */}
        <button
          onClick={() => {
            audioEngine.playSfx('click');
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--grad-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <h3 className="font-display" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {tab === 'signin' ? 'Sign In to Bang AI' : 'Create Your Bang AI Account'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {tab === 'signin' ? 'Sign in to access your autonomous studio' : 'Join top creators scaling faceless YouTube channels'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-input)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '18px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => {
              audioEngine.playSfx('click');
              setTab('signin');
              setErrorMessage('');
              setIsGoogleConflict(false);
            }}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: tab === 'signin' ? 'var(--bg-card)' : 'transparent',
              color: tab === 'signin' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: tab === 'signin' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              audioEngine.playSfx('click');
              setTab('signup');
              setErrorMessage('');
              setIsGoogleConflict(false);
            }}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: tab === 'signup' ? 'var(--bg-card)' : 'transparent',
              color: tab === 'signup' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: tab === 'signup' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            background: isGoogleConflict ? 'rgba(99, 102, 241, 0.15)' : 'rgba(239, 68, 68, 0.12)',
            border: `1.5px solid ${isGoogleConflict ? 'rgba(99, 102, 241, 0.5)' : 'rgba(239, 68, 68, 0.35)'}`,
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color: isGoogleConflict ? 'var(--text-primary)' : '#ef4444',
            fontSize: '13px',
            lineHeight: 1.4
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color={isGoogleConflict ? '#818cf8' : '#ef4444'} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
            {isGoogleConflict && (
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="btn-glow"
                style={{
                  alignSelf: 'flex-start',
                  marginTop: '4px',
                  padding: '6px 14px',
                  fontSize: '12px'
                }}
              >
                Continue with Google Now →
              </button>
            )}
          </div>
        )}

        {/* Google 1-Click Container */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div id="google-modal-btn-container" ref={googleBtnRef} style={{ width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'center' }} />

          <button
            type="button"
            onClick={handleGoogleAuth}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-medium)',
              borderRadius: '12px',
              padding: '10px 16px',
              color: 'var(--text-primary)',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--border-medium)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{tab === 'signin' ? 'Continue with Google' : 'Sign up with Google'}</span>
          </button>
        </div>

        {/* OR Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '16px 0',
          gap: '12px',
          color: 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.05em'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>{tab === 'signin' ? 'OR SIGN IN WITH EMAIL' : 'OR SIGN UP WITH EMAIL'}</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tab === 'signup' && (
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '12px',
                    padding: '10px 12px 10px 38px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  padding: '10px 12px 10px 38px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  padding: '10px 12px 10px 38px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-glow"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '6px' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{tab === 'signin' ? 'Sign In to Studio' : 'Create Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
