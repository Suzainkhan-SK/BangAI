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
  Sliders,
  Volume2,
  Share2,
  Film,
  Smartphone,
  Monitor,
  Square,
  Key,
  Webhook,
  Send,
  RefreshCw,
  Trash2,
  Download,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { VOICES } from '../data/voices';
import { VISUAL_STYLES } from '../data/visualStyles';
import { audioEngine } from '../audio/audioEngine';

export default function SettingsPage({ user, onNavigateToDashboard }) {
  const [activeTab, setActiveTab] = useState('ai');
  
  // AI Defaults
  const [defaultVoice, setDefaultVoice] = useState('adam');
  const [defaultStyle, setDefaultStyle] = useState('cinematic');
  const [defaultLang, setDefaultLang] = useState('English');
  const [defaultAspect, setDefaultAspect] = useState('9:16');
  const [pacingMode, setPacingMode] = useState('viral');

  // Video & Audio Settings
  const [auto4K, setAuto4K] = useState(true);
  const [frameRate, setFrameRate] = useState('60');
  const [autoSubtitles, setAutoSubtitles] = useState(true);
  const [subtitlePreset, setSubtitlePreset] = useState('punchy');
  const [audioDuckingDepth, setAudioDuckingDepth] = useState('-18');
  const [enableSfx, setEnableSfx] = useState(true);

  // Social & Syndication
  const [defaultPrivacy, setDefaultPrivacy] = useState('public');
  const [autoPinComment, setAutoPinComment] = useState(true);
  const [autoSeoTags, setAutoSeoTags] = useState(true);

  // Cloud Event Webhook
  const [webhookUrl, setWebhookUrl] = useState('https://api.yourdomain.com/webhooks/bangai-events');
  const [webhookSecret, setWebhookSecret] = useState('whsec_8923bc41029e71ab48f');
  const [subscribedEvents, setSubscribedEvents] = useState({
    renderComplete: true,
    renderFailed: true,
    socialPublished: true
  });
  const [isPingingWebhook, setIsPingingWebhook] = useState(false);
  const [webhookPingResult, setWebhookPingResult] = useState(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Save State
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    if (e) e.preventDefault();
    audioEngine.playSfx('boom');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCopySecret = () => {
    audioEngine.playSfx('click');
    navigator.clipboard.writeText(webhookSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleSendWebhookTest = () => {
    audioEngine.playSfx('click');
    setIsPingingWebhook(true);
    setWebhookPingResult(null);

    setTimeout(() => {
      setIsPingingWebhook(false);
      setWebhookPingResult({
        success: true,
        statusCode: 200,
        latencyMs: 142,
        message: 'Endpoint acknowledged payload with 200 OK'
      });
      audioEngine.playSfx('success');
    }, 800);
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Reset all studio preferences to recommended factory defaults?')) return;
    audioEngine.playSfx('click');
    setDefaultVoice('adam');
    setDefaultStyle('cinematic');
    setDefaultLang('English');
    setDefaultAspect('9:16');
    setPacingMode('viral');
    setAuto4K(true);
    setFrameRate('60');
    setAutoSubtitles(true);
    setSubtitlePreset('punchy');
    setAudioDuckingDepth('-18');
    setEnableSfx(true);
    setDefaultPrivacy('public');
    setAutoPinComment(true);
    setAutoSeoTags(true);
    handleSave();
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px 80px 24px' }}>
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div>
          <div className="glow-pill" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'rgba(255, 79, 0, 0.08)',
            border: '1px solid rgba(255, 79, 0, 0.25)',
            marginBottom: '10px'
          }}>
            <Settings size={13} color="var(--accent-primary)" />
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Studio Configuration
            </span>
          </div>

          <h1 className="font-display" style={{ fontSize: 'clamp(24px, 4.5vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Studio Settings & Preferences
          </h1>
          <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)' }}>
            Configure default AI generation models, video render options, audio ducking, and cloud event webhooks.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-glow"
          style={{ padding: '10px 22px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          <span>{saved ? 'Settings Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* ── SEGMENTED NAVIGATION TABS ─────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '28px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {[
          { id: 'ai', label: 'AI & Generation', icon: <Mic2 size={15} /> },
          { id: 'video', label: 'Video & Audio Engine', icon: <Sliders size={15} /> },
          { id: 'syndication', label: 'Social & Syndication', icon: <Share2 size={15} /> },
          { id: 'webhooks', label: 'Cloud Event Webhooks', icon: <Webhook size={15} /> },
          { id: 'data', label: 'System & Defaults', icon: <ShieldCheck size={15} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                audioEngine.playSfx('click');
                setActiveTab(tab.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: AI & GENERATION DEFAULTS ───────────────────────── */}
      {activeTab === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="saas-card" style={{ padding: '28px', borderRadius: '20px' }}>
            <h3 className="font-display" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mic2 size={18} color="var(--accent-primary)" />
              <span>Default AI Engine Preferences</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '18px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
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
                    padding: '11px 12px',
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
                <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
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
                    padding: '11px 12px',
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
                <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
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
                    padding: '11px 12px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="English">🇺🇸 English (Global)</option>
                  <option value="Hinglish">🇮🇳 Hinglish (Devanagari + English)</option>
                  <option value="Hindi">🇮🇳 Pure Hindi</option>
                  <option value="Spanish">🇪🇸 Spanish</option>
                  <option value="French">🇫🇷 French</option>
                  <option value="German">🇩🇪 German</option>
                  <option value="Japanese">🇯🇵 Japanese</option>
                  <option value="Portuguese">🇧🇷 Portuguese</option>
                  <option value="Arabic">🇸🇦 Arabic</option>
                </select>
              </div>
            </div>

            {/* Target Aspect Ratio Preset */}
            <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700, display: 'block', marginBottom: '12px' }}>
                Default Target Aspect Ratio:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  { id: '9:16', title: '9:16 Vertical', desc: 'Shorts, Reels & TikTok', icon: <Smartphone size={16} /> },
                  { id: '16:9', title: '16:9 Cinema', desc: 'YouTube & Widescreen', icon: <Monitor size={16} /> },
                  { id: '1:1', title: '1:1 Square', desc: 'Instagram Feed & Paid Ads', icon: <Square size={16} /> }
                ].map((fmt) => {
                  const isSelected = defaultAspect === fmt.id;
                  return (
                    <div
                      key={fmt.id}
                      onClick={() => {
                        audioEngine.playSfx('click');
                        setDefaultAspect(fmt.id);
                      }}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: isSelected ? 'rgba(255, 79, 0, 0.08)' : 'var(--bg-input)',
                        border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                        {fmt.icon}
                        <span>{fmt.title}</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {fmt.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: VIDEO & AUDIO ENGINE QUALITY ───────────────────── */}
      {activeTab === 'video' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="saas-card" style={{ padding: '28px', borderRadius: '20px' }}>
            <h3 className="font-display" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#06b6d4" />
              <span>Video Rendering & Visual Precision</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Enable Full HD 1080p Master Output
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Outputs high-bitrate broadcast-ready video file for flawless mobile display.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={auto4K}
                  onChange={(e) => setAuto4K(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Dynamic Word-by-Word Kinetic Subtitle Burn
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Automatically synchronizes animated subtitle typography for high-retention sound-off viewing.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoSubtitles}
                  onChange={(e) => setAutoSubtitles(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Cinematic Sound FX & Audio Accents
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Subtle whooshes, atmospheric risers, and impact cues placed automatically at scene transitions.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableSfx}
                  onChange={(e) => setEnableSfx(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Audio Ducking Calibrator */}
          <div className="saas-card" style={{ padding: '28px', borderRadius: '20px' }}>
            <h3 className="font-display" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={18} color="#f59e0b" />
              <span>Smart Acoustic Speech Ducking</span>
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Controls how deeply background music automatically lowers when the narrator speaks.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                { id: '-12', label: '-12 dB Mild', desc: 'Music stays punchy and energetic' },
                { id: '-18', label: '-18 dB Standard (Recommended)', desc: 'Optimal studio balance between voice & score' },
                { id: '-24', label: '-24 dB Deep', desc: 'Voice is isolated with faint atmospheric music' }
              ].map((duck) => (
                <div
                  key={duck.id}
                  onClick={() => {
                    audioEngine.playSfx('click');
                    setAudioDuckingDepth(duck.id);
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: audioDuckingDepth === duck.id ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-input)',
                    border: `1.5px solid ${audioDuckingDepth === duck.id ? '#f59e0b' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: audioDuckingDepth === duck.id ? '#f59e0b' : 'var(--text-primary)', marginBottom: '4px' }}>
                    {duck.label}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {duck.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SOCIAL & SYNDICATION DEFAULTS ───────────────────── */}
      {activeTab === 'syndication' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="saas-card" style={{ padding: '28px', borderRadius: '20px' }}>
            <h3 className="font-display" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={18} color="#ec4899" />
              <span>Automated Social Syndication & Metadata</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Auto-Generate High-CTR SEO Discovery Tags
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Generates 10 algorithm-optimized tags for YouTube, TikTok & Instagram.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoSeoTags}
                  onChange={(e) => setAutoSeoTags(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Auto-Pin Curiosity Question Comment
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Automatically drafts and pins an engagement-boosting question upon YouTube upload.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoPinComment}
                  onChange={(e) => setAutoPinComment(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Default YouTube Privacy
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Privacy status applied when automatically publishing to your linked channel.
                  </div>
                </div>
                <select
                  value={defaultPrivacy}
                  onChange={(e) => setDefaultPrivacy(e.target.value)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="public">Public (Immediate Live)</option>
                  <option value="unlisted">Unlisted (Review Before Share)</option>
                  <option value="private">Private (Only You)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: CLOUD EVENT WEBHOOKS ───────────────────────────── */}
      {activeTab === 'webhooks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="saas-card" style={{ padding: '28px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Webhook size={18} color="#38bdf8" />
                </div>
                <div>
                  <h3 className="font-display" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Asynchronous Event Webhooks
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Receive real-time HTTP POST notifications when videos complete rendering.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendWebhookTest}
                disabled={isPingingWebhook}
                className="btn-outline"
                style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isPingingWebhook ? <RefreshCw size={13} className="spin-animation" /> : <Send size={13} />}
                <span>{isPingingWebhook ? 'Pinging...' : 'Send Test Ping'}</span>
              </button>
            </div>

            {/* Test Result Banner */}
            {webhookPingResult && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid #10b981',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                color: '#10b981'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>{webhookPingResult.message} ({webhookPingResult.latencyMs}ms)</span>
                </div>
                <button
                  onClick={() => setWebhookPingResult(null)}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Webhook Callback Endpoint URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/webhooks/bangai"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  fontSize: '13px',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            {/* Signing Secret */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Webhook HMAC Signing Secret
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  readOnly
                  value={webhookSecret}
                  style={{
                    flex: 1,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '12.5px',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'var(--text-secondary)'
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="btn-outline"
                  style={{ padding: '9px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedSecret ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Subscribed Event Triggers */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Subscribed Event Triggers:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'renderComplete', title: 'video.render_completed', desc: 'Fires when video rendering finishes and 1080p MP4 is ready for download.' },
                  { key: 'socialPublished', title: 'video.social_published', desc: 'Fires when video is automatically published to connected channels.' },
                  { key: 'renderFailed', title: 'video.render_failed', desc: 'Fires if video generation encounters a content policy block or render error.' }
                ].map((ev) => (
                  <label key={ev.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={subscribedEvents[ev.key]}
                      onChange={(e) => setSubscribedEvents({ ...subscribedEvents, [ev.key]: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {ev.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: SYSTEM & DATA MANAGEMENT ───────────────────────── */}
      {activeTab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="saas-card" style={{ padding: '28px', borderRadius: '20px' }}>
            <h3 className="font-display" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--accent-primary)" />
              <span>Studio Maintenance & Diagnostics</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Reset Studio Preferences
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Restore voice, style, and aspect ratio defaults to initial recommended values.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="btn-outline"
                  style={{ padding: '8px 16px', fontSize: '12.5px', color: '#ef4444' }}
                >
                  Reset Defaults
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    Clear Local Session Drafts
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Clears cached prompt history and audio buffer stored in this browser session.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('bangai_pending_prompt');
                    audioEngine.playSfx('click');
                    alert('Local session cache cleared.');
                  }}
                  className="btn-outline"
                  style={{ padding: '8px 16px', fontSize: '12.5px' }}
                >
                  Clear Session Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
