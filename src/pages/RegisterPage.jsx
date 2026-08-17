import React, { useState } from 'react';
import { Sparkles, User, Mail, Lock, Video, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

export default function RegisterPage({ onRegisterSuccess, onNavigateToLogin, onNavigateToLanding }) {
  const [name, setName] = useState('Alex Rivera');
  const [email, setEmail] = useState('alex.creator@shortsai.studio');
  const [password, setPassword] = useState('••••••••••••');
  const [niche, setNiche] = useState('mystery');
  const [plan, setPlan] = useState('pro');

  const handleSubmit = (e) => {
    e.preventDefault();
    audioEngine.playSfx('boom');
    onRegisterSuccess({
      name: name,
      email: email,
      channel: `${name}'s Viral Shorts Studio`,
      niche: niche,
      plan: plan === 'pro' ? 'Creator Pro Plan' : 'Free Starter Plan',
      credits: plan === 'pro' ? 100 : 10
    });
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
        width: '650px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.12) 40%, transparent 70%)',
        filter: 'blur(70px)',
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
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'var(--grad-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Sparkles size={24} color="#ffffff" />
          </div>
          <h1 className="font-display" style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Start Creating Viral Shorts
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Join 100,000+ creators scaling faceless YouTube channels with AI.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Full Name */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
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

          {/* Email */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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

          {/* Password */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          {/* Channel Niche */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Primary Channel Niche
            </label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="mystery">🔍 Unsolved Mysteries & True Crime</option>
              <option value="facts">⚡ Shocking Science & Historical Facts</option>
              <option value="cgi">🐉 Mythological & CGI Battles</option>
              <option value="comedy">🍍 3D Animation & Comedy</option>
              <option value="bio">💔 Inspirational Biographies & Stories</option>
            </select>
          </div>

          {/* Plan Selector Radio */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Select Launch Tier
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div
                onClick={() => setPlan('free')}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: `1.5px solid ${plan === 'free' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: plan === 'free' ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Free Starter</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>10 Free 75s Shorts</div>
              </div>

              <div
                onClick={() => setPlan('pro')}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: `1.5px solid ${plan === 'pro' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: plan === 'pro' ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Creator Pro</span>
                  <span style={{ fontSize: '9px', background: 'var(--grad-primary)', color: '#fff', padding: '1px 4px', borderRadius: '4px' }}>POPULAR</span>
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>100 Shorts + 4K Export</div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-glow"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '6px' }}
          >
            <span>Create Studio Account</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <button
            onClick={() => {
              audioEngine.playSfx('click');
              onNavigateToLogin();
            }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
