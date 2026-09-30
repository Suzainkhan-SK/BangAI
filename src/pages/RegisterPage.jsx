import React, { useState, useEffect } from 'react';
import { Sparkles, User, Mail, Lock, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, Loader2, Video, ArrowLeft } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { registerUser, initiateGoogleAuth } from '../utils/authClient';
import GoogleAuthButton from '../components/Auth/GoogleAuthButton';

function calculatePasswordStrength(pass) {
  if (!pass) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (score <= 3) return { score: 2, label: 'Fair', color: '#f59e0b' };
  return { score: 3, label: 'Strong', color: '#10b981' };
}

export default function RegisterPage({ onRegisterSuccess, onNavigateToLogin, onNavigateToLanding }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [channel, setChannel] = useState('');
  const [niche, setNiche] = useState('mystery');
  const [plan, setPlan] = useState('pro');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleConflict, setIsGoogleConflict] = useState(false);

  const passwordStrength = calculatePasswordStrength(password);

  // Check URL params for error messages from Google OAuth
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

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    audioEngine.playSfx('click');
    setIsLoading(true);

    try {
      const data = await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        channel: channel.trim(),
        niche,
        plan
      });

      audioEngine.playSfx('boom');
      if (typeof onRegisterSuccess === 'function') {
        onRegisterSuccess(data.user);
      }
    } catch (err) {
      console.error('[RegisterPage] Registration failed:', err);
      audioEngine.playSfx('click');
      const msg = err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      if (msg.toLowerCase().includes('google sign-in') || msg.toLowerCase().includes('google')) {
        setIsGoogleConflict(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
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
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '680px',
        height: '420px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(6, 182, 212, 0.12) 42%, transparent 70%)',
        filter: 'blur(75px)',
        pointerEvents: 'none'
      }} />

      <div className="saas-card" style={{
        width: '100%',
        maxWidth: '520px',
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

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '4px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'var(--grad-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 0 24px rgba(99, 102, 241, 0.45)'
          }}>
            <Sparkles size={24} color="#ffffff" />
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(21px, 3.8vw, 26px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Create Your Bang AI Account
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Join creators scaling faceless YouTube channels with autonomous AI.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            background: isGoogleConflict ? 'rgba(99, 102, 241, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1.5px solid ${isGoogleConflict ? 'rgba(99, 102, 241, 0.4)' : 'rgba(239, 68, 68, 0.35)'}`,
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color: isGoogleConflict ? 'var(--text-primary)' : '#ef4444',
            fontSize: '13px',
            lineHeight: 1.4
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} color={isGoogleConflict ? '#818cf8' : '#ef4444'} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
            {isGoogleConflict && (
              <button
                type="button"
                onClick={handleGoogleSignUp}
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

        {/* Unified Single Google 1-Click Sign-Up Button */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <GoogleAuthButton
            text="signup_with"
            theme="filled_blue"
            width={456}
            onSuccess={(user) => {
              audioEngine.playSfx('boom');
              if (typeof onRegisterSuccess === 'function') {
                onRegisterSuccess(user);
              }
            }}
            onError={(err) => {
              console.error('[RegisterPage] Google signup error:', err);
              setErrorMessage(err.message || 'Google sign-up failed.');
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
          <span>OR REGISTER WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Full Name */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Full Name *
            </label>
            <div style={{ position: 'relative' }}>
              <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="name"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '9px 12px 9px 36px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Email Address *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                placeholder="alex.creator@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '9px 12px 9px 36px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
              />
            </div>
          </div>

          {/* Passwords in 2 Columns */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="6+ chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyDown}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '10px',
                      padding: '9px 32px 9px 34px',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '8px', top: '9px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Confirm Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyDown}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '10px',
                      padding: '9px 32px 9px 34px',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '8px', top: '9px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* CapsLock Warning */}
            {capsLockOn && (
              <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, marginTop: '4px' }}>
                ⚠️ Caps Lock is ON
              </div>
            )}

            {/* Password Strength Indicator */}
            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Strength:</span>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', height: '4px', borderRadius: '2px', overflow: 'hidden', background: 'var(--border-subtle)' }}>
                  <div style={{ flex: 1, background: passwordStrength.score >= 1 ? passwordStrength.color : 'transparent', transition: 'background 0.3s ease' }} />
                  <div style={{ flex: 1, background: passwordStrength.score >= 2 ? passwordStrength.color : 'transparent', transition: 'background 0.3s ease' }} />
                  <div style={{ flex: 1, background: passwordStrength.score >= 3 ? passwordStrength.color : 'transparent', transition: 'background 0.3s ease' }} />
                </div>
              </div>
            )}
          </div>

          {/* YouTube Channel & Niche */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                YouTube Channel (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <Video size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="Viral Mysteries HQ"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '10px',
                    padding: '9px 12px 9px 36px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Primary Niche
              </label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '9px 10px',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="mystery">Mysteries & True Crime</option>
                <option value="scifi">Sci-Fi & Space</option>
                <option value="facts">Mind-Blowing Facts</option>
                <option value="history">Historical Secrets</option>
                <option value="mythology">Mythology & Lore</option>
                <option value="motivation">Motivation & Success</option>
              </select>
            </div>
          </div>

          {/* Plan Choice Cards */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Select Starting Plan
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div
                onClick={() => !isLoading && setPlan('free')}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  border: `1.5px solid ${plan === 'free' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: plan === 'free' ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Free Starter</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>10 Free 75s Shorts</div>
              </div>

              <div
                onClick={() => !isLoading && setPlan('pro')}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  border: `1.5px solid ${plan === 'pro' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: plan === 'pro' ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Creator Pro</span>
                  <span style={{ fontSize: '9px', background: 'var(--grad-primary)', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>POPULAR</span>
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>100 Shorts + HD Export</div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-glow"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '6px', cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Creating Account in Atlas...</span>
              </>
            ) : (
              <>
                <span>Create Studio Account</span>
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
          marginTop: '16px',
          color: 'var(--text-muted)',
          fontSize: '11px'
        }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>PBKDF2 Salted Hashing • Bank-Grade Security</span>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              onNavigateToLogin();
            }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
