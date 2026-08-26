import React, { useState } from 'react';
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff, Zap, ShieldCheck } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

export default function LoginPage({ onLoginSuccess, onNavigateToRegister, onNavigateToLanding }) {
  const [email, setEmail] = useState('alex.creator@shortsai.studio');
  const [password, setPassword] = useState('supersecretpassword123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    audioEngine.playSfx('click');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      audioEngine.playSfx('boom');
      onLoginSuccess({
        name: 'Alex Rivera',
        email: email,
        channel: 'Viral Facts & Mysteries HQ',
        plan: 'Creator Pro Plan',
        credits: 100
      });
    }, 600);
  };

  const handleDemoLogin = () => {
    audioEngine.playSfx('click');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      audioEngine.playSfx('boom');
      onLoginSuccess({
        name: 'Alex Rivera (Demo Creator)',
        email: 'demo.creator@shortsai.studio',
        channel: 'Viral Facts & Mysteries HQ',
        plan: 'Creator Pro Plan',
        credits: 100
      });
    }, 400);
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
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.1) 40%, transparent 70%)',
        filter: 'blur(70px)',
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
        zIndex: 10
      }}>
        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'var(--grad-gemini)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
          }}>
            <Sparkles size={24} color="#ffffff" />
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(21px, 3.8vw, 26px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Sign In to ShortsAI
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Enter your credentials to access your autonomous studio.
          </p>
        </div>

        {/* 1-Click Instant Demo Login CTA */}
        <button
          onClick={handleDemoLogin}
          type="button"
          disabled={isLoading}
          className="btn-glow"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '12px',
            fontSize: '14px',
            marginBottom: '18px'
          }}
        >
          <Zap size={16} fill="#ffffff" />
          <span>⚡ Instant 1-Click Demo Access</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '18px 0',
          color: 'var(--text-muted)',
          fontSize: '12px'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>or enter account details</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@creator.com"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  padding: '11px 14px 11px 40px',
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Password
              </label>
              <span style={{ fontSize: '12px', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>
                Forgot password?
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  padding: '11px 40px 11px 40px',
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '11px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            <label htmlFor="remember" style={{ fontSize: '12.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Remember me on this device
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-outline"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px',
              fontSize: '14px',
              background: 'var(--bg-card-hover)',
              borderColor: 'var(--accent-primary)',
              color: 'var(--text-primary)',
              marginTop: '4px'
            }}
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Account'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          New to ShortsAI?{' '}
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              onNavigateToRegister();
            }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
          >
            Create free account
          </button>
        </div>
      </div>
    </div>
  );
}
