import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  Mic2, 
  Palette, 
  Globe, 
  ShieldCheck, 
  Bell, 
  Layers, 
  Sliders 
} from 'lucide-react';
import { VOICES } from '../data/voices';
import { VISUAL_STYLES } from '../data/visualStyles';
import { audioEngine } from '../audio/audioEngine';

export default function SettingsPage({ onNavigateToDashboard }) {
  const [defaultVoice, setDefaultVoice] = useState('adam');
  const [defaultStyle, setDefaultStyle] = useState('cinematic');
  const [defaultLang, setDefaultLang] = useState('Hinglish');
  const [auto4K, setAuto4K] = useState(true);
  const [autoSubtitles, setAutoSubtitles] = useState(true);
  const [autoPinComment, setAutoPinComment] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://cmpunktg23.app.n8n.cloud/webhook/viral-shorts-ai');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    audioEngine.playSfx('boom');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Studio Settings & Preferences
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Configure default AI generation models, video render options, and n8n webhook pipelines.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-glow"
          style={{ padding: '10px 20px', fontSize: '13.5px' }}
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          <span>{saved ? 'Settings Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Default AI Models */}
        <div className="saas-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mic2 size={18} color="var(--accent-primary)" />
            <span>Default AI Engine Preferences</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Default Narrator Voice
              </label>
              <select
                value={defaultVoice}
                onChange={(e) => setDefaultVoice(e.target.value)}
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
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.tag} - {v.flag})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Default Visual Style
              </label>
              <select
                value={defaultStyle}
                onChange={(e) => setDefaultStyle(e.target.value)}
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
                {VISUAL_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Default Script Language
              </label>
              <select
                value={defaultLang}
                onChange={(e) => setDefaultLang(e.target.value)}
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
                <option value="Hinglish">🇮🇳 Hinglish (Devanagari + English)</option>
                <option value="Hindi">🇮🇳 Pure Hindi</option>
                <option value="English">🇺🇸 English</option>
                <option value="Spanish">🇪🇸 Spanish</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Video Render Settings */}
        <div className="saas-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="#06b6d4" />
            <span>Video Rendering & Subtitle Burn</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                  Enable 4K 60FPS Master Export
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Renders at 2160x3840 ultra-sharp 9:16 vertical resolution
                </div>
              </div>
              <input
                type="checkbox"
                checked={auto4K}
                onChange={(e) => setAuto4K(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                  Dynamic Word-by-Word Subtitle Burn
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Burns viral animated captions with yellow/cyan keyword highlights
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoSubtitles}
                onChange={(e) => setAutoSubtitles(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                  Auto-Pin Curiosity Question Comment
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Automatically writes and pins high-engagement questions on YouTube upload
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoPinComment}
                onChange={(e) => setAutoPinComment(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Webhook & n8n Integration */}
        <div className="saas-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#f59e0b" />
            <span>n8n Pipeline Webhook URL</span>
          </h3>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Live Production n8n Webhook Endpoint
            </label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                fontFamily: 'JetBrains Mono',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
