import React, { useState } from 'react';
import { X, Sparkles, User, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';

export default function AuthModal({ isOpen, onClose, initialTab = 'signin', onLoginSuccess }) {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    audioEngine.playSfx('success');
    onLoginSuccess({
      name: name || (email ? email.split('@')[0] : 'Viral Creator'),
      email: email || 'creator@shortsai.studio'
    });
    onClose();
  };

  const handleQuickDemoLogin = () => {
    audioEngine.playSfx('boom');
    onLoginSuccess({
      name: 'Alex Rivera (Pro Creator)',
      email: 'alex.creator@shortsai.studio'
    });
    onClose();
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
      zIndex: 100,
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
          gap: '4px',
          background: 'var(--bg-input)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              setTab('signin');
            }}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: tab === 'signin' ? 'var(--bg-card)' : 'transparent',
              color: tab === 'signin' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === 'signin' ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              setTab('signup');
            }}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: tab === 'signup' ? 'var(--bg-card)' : 'transparent',
              color: tab === 'signup' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === 'signup' ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Create Account
          </button>
        </div>

        {/* 1-Click Instant Demo Login CTA */}
        <button
          onClick={handleQuickDemoLogin}
          className="btn-glow"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '13.5px'
          }}
        >
          <Sparkles size={16} />
          <span>Instant 1-Click Creator Access</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          margin: '16px 0',
          color: 'var(--text-muted)',
          fontSize: '11.5px'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>or continue with email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tab === 'signup' && (
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@youtube.com"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn-outline"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: '6px' }}
          >
            <span>{tab === 'signin' ? 'Sign In with Email' : 'Create Account'}</span>
            <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
