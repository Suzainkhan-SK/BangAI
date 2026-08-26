import React, { useState } from 'react';
import { X, Sparkles, User, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { loginUser, registerUser } from '../../utils/authClient';

export default function AuthModal({ isOpen, onClose, initialTab = 'signin', onLoginSuccess }) {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

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
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
            {tab === 'signin' ? 'Welcome Back' : 'Create Your Studio Account'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {tab === 'signin' ? 'Sign in to access your viral shorts pipeline' : 'Join thousands of top YouTube creators'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-input)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => {
              audioEngine.playSfx('click');
              setTab('signin');
              setErrorMessage('');
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
            Register
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#ef4444',
            fontSize: '12.5px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tab === 'signup' && (
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={tab === 'signup'}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '10px',
                    padding: '10px 12px 10px 36px',
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
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '10px 12px 10px 36px',
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
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '10px 12px 10px 36px',
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
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '6px', cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>{tab === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : (
              <>
                <span>{tab === 'signin' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
