import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

// Real BangAI Templates extracted directly from BangAI/src/pages/TemplatesPage.jsx
export const OFFICIAL_TEMPLATES = [
  {
    id: 'world-mysteries',
    emoji: '🛸',
    title: 'World Mysteries & Paranormal',
    category: 'World Mysteries',
    desc: 'Self-researches unrepeated paranormal mysteries, scripts 5 cinematic scenes, renders photorealistic AI video, and uploads directly to YouTube — zero manual review.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    videoTitle: "The Bermuda Triangle's Darkest Secret",
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    n8nWorkflowId: 'NXZyaUNBciJ9gzCT',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-world-mysteries',
    color: '#6366f1',
    status: 'ACTIVE'
  },
  {
    id: 'last-24-hours',
    emoji: '⏳',
    title: 'Last 24 Hours [True Stories]',
    category: 'True Stories',
    desc: 'Counts down the poignant and dramatic final 24 hours of legendary figures, heroic sacrifices, and historic events with empathetic narration and emotional hooks.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    videoTitle: 'Princess Diana: The Final 24 Hours',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    n8nWorkflowId: 'SpEEzOq1LHWbGbti',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-last-24-hours',
    color: '#f59e0b',
    status: 'ACTIVE'
  },
  {
    id: '3am-horror',
    emoji: '👻',
    title: '3-AM Horror & Paranormal',
    category: 'Horror & Paranormal',
    desc: 'Bone-chilling psychological terror and terrifying 3 AM encounters. Maximum camera movement, eerie suspense, and dark sound design crafted for viral retention.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    videoTitle: 'The Dyatlov Incident: 3 AM Anomaly',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    n8nWorkflowId: 'sY13UPWrlpUWyNJR',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-3am-horror',
    color: '#ef4444',
    status: 'ACTIVE'
  },
  // Upcoming Templates
  {
    id: 'ancient-history',
    emoji: '🏛️',
    title: 'Ancient History & Lost Civilizations',
    category: 'True Stories',
    desc: 'Deep-dives into forgotten dynasties, ancient monoliths, and lost technological wonders.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-ancient-history',
    color: '#8b5cf6',
    status: 'UPCOMING'
  },
  {
    id: 'dark-psychology',
    emoji: '🧠',
    title: 'Dark Psychology & Human Behavior',
    category: 'Horror & Paranormal',
    desc: 'Reveals behavioral quirks, subconscious micro-signals, and persuasion breakdowns.',
    tagline: '60s · 4 Scenes · 1080p',
    duration: '60s',
    scenes: '4 Scenes',
    resolution: '1080p',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-dark-psychology',
    color: '#06b6d4',
    status: 'UPCOMING'
  },
  {
    id: 'cosmic-space',
    emoji: '🌌',
    title: 'Deep Space & Cosmic Wonders',
    category: 'Space & Tech',
    desc: 'Explores black hole anomalies, quantum paradoxes, and deep cosmos discoveries.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-cosmic-space',
    color: '#3b82f6',
    status: 'UPCOMING'
  },
  {
    id: 'mythical-heists',
    emoji: '💎',
    title: 'Legendary Heists & Unsolved Enigmas',
    category: 'World Mysteries',
    desc: 'Fast-paced breakdowns of impossible vaults, art heists, and unexplained escapes.',
    tagline: '75s · 5 Scenes · 1080p',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    aiBrain: 'Claude Haiku 4.5 & Gemini',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-mythical-heists',
    color: '#10b981',
    status: 'UPCOMING'
  }
];

export default function TemplatesManagerView() {
  const [templates, setTemplates] = useState(OFFICIAL_TEMPLATES);
  const [blocklist, setBlocklist] = useState('nsfw, hate, violence, illegal, deepfake_celebrity');
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    category: 'World Mysteries',
    emoji: '✨',
    duration: '75s',
    scenes: '5 Scenes',
    resolution: '1080p',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-',
    desc: 'Autonomous high-retention 5-scene viral template.'
  });
  const [toastMsg, setToastMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await adminService.getTemplates();
      if (res.success && res.data) {
        if (Array.isArray(res.data.templates) && res.data.templates.length > 0) {
          // Merge with OFFICIAL_TEMPLATES to ensure all metadata like aiBrain & n8nWorkflowId exist
          const merged = OFFICIAL_TEMPLATES.map(orig => {
            const remote = res.data.templates.find(r => r.id === orig.id);
            return remote ? { ...orig, ...remote } : orig;
          });
          setTemplates(merged);
        }
        if (res.data.blocklist) setBlocklist(res.data.blocklist);
      }
    } catch (e) {
      console.warn('Failed to fetch templates:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleToggleActive = async (template) => {
    const updated = { ...template, status: template.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' };
    setTemplates(prev => prev.map(t => t.id === template.id ? updated : t));
    try {
      await adminService.saveTemplate(updated);
      setToastMsg(`Template "${template.title}" status changed to ${updated.status}!`);
    } catch (e) {
      setToastMsg(`Error updating template: ${e.message}`);
    } finally {
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const handleSaveBlocklist = async () => {
    setSaving(true);
    try {
      await adminService.saveTemplate(null, blocklist);
      setToastMsg('✅ Keyword blocklist saved to MongoDB Atlas successfully!');
    } catch (e) {
      setToastMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.title) return;

    setSaving(true);
    const item = {
      id: newTemplate.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      ...newTemplate,
      status: 'ACTIVE',
      tagline: `${newTemplate.duration} · ${newTemplate.scenes} · ${newTemplate.resolution}`,
      aiBrain: 'Claude Haiku 4.5 & Gemini'
    };

    try {
      const res = await adminService.saveTemplate(item);
      if (res.success) {
        setTemplates([item, ...templates]);
        setShowWizard(false);
        setNewTemplate({
          title: '',
          category: 'World Mysteries',
          emoji: '✨',
          duration: '75s',
          scenes: '5 Scenes',
          resolution: '1080p',
          webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-',
          desc: 'Autonomous high-retention 5-scene viral template.'
        });
        setToastMsg(`✅ Template "${item.title}" deployed to MongoDB Atlas!`);
      }
    } catch (err) {
      setToastMsg(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const filteredTemplates = activeCategoryFilter === 'All'
    ? templates
    : templates.filter(t => t.category === activeCategoryFilter);

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">AI Video Templates & Autonomous Pipelines</h1>
          <p className="admin-view-desc">
            Direct real-time management of the real <strong>BangAI video templates</strong> from <code>TemplatesPage.jsx</code>, n8n webhook routing, duration targets, and moderation blocklists.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="admin-btn admin-btn-primary"
          >
            + Deploy New AI Template
          </button>
        </div>
      </div>

      {toastMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13.5px',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {['All', 'World Mysteries', 'True Stories', 'Horror & Paranormal', 'Space & Tech'].map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategoryFilter(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: activeCategoryFilter === cat ? 'var(--admin-accent-cyan)' : 'var(--admin-bg-elevated)',
              color: activeCategoryFilter === cat ? '#000' : 'var(--admin-text-main)',
              border: '1px solid var(--admin-border-glass)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="admin-grid admin-grid-3" style={{ marginBottom: '24px' }}>
        {filteredTemplates.map(t => (
          <div key={t.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '28px' }}>{t.emoji}</span>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                      {t.title}
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--admin-accent-cyan)', fontWeight: 600 }}>
                      {t.category}
                    </span>
                  </div>
                </div>
                <span className={`admin-badge ${t.status === 'ACTIVE' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                  ● {t.status}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                {t.desc}
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '8px',
                borderRadius: '8px',
                background: 'var(--admin-bg-elevated)',
                marginBottom: '12px',
                fontSize: '11px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ color: 'var(--admin-text-sub)' }}>DURATION</div>
                  <div style={{ fontWeight: 800, color: 'var(--admin-text-main)' }}>{t.duration || '75s'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--admin-text-sub)' }}>SCENES</div>
                  <div style={{ fontWeight: 800, color: 'var(--admin-text-main)' }}>{t.scenes || '5 Scenes'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--admin-text-sub)' }}>QUALITY</div>
                  <div style={{ fontWeight: 800, color: 'var(--admin-text-main)' }}>{t.resolution || '1080p'}</div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                AI Brain: <strong style={{ color: 'var(--admin-text-main)' }}>{t.aiBrain || 'Claude Haiku 4.5 & Gemini'}</strong>
              </div>

              {t.n8nWorkflowId && (
                <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginBottom: '8px' }}>
                  n8n Workflow: <strong style={{ fontFamily: 'var(--admin-font-mono)', color: 'var(--admin-accent-purple)' }}>{t.n8nWorkflowId}</strong>
                </div>
              )}

              <div style={{
                padding: '6px 8px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.2)',
                fontSize: '10.5px',
                fontFamily: 'var(--admin-font-mono)',
                color: 'var(--admin-text-sub)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                Webhook: {t.webhook}
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--admin-border-glass)', display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => handleToggleActive(t)}
                className={`admin-btn ${t.status === 'ACTIVE' ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
                style={{ padding: '5px 12px', fontSize: '12px' }}
              >
                {t.status === 'ACTIVE' ? 'Pause Pipeline' : 'Activate Pipeline'}
              </button>

              <a
                href={t.webhook}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '11.5px',
                  color: 'var(--admin-accent-cyan)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 600
                }}
              >
                Inspect Webhook ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Blocklist Card */}
      <div className="admin-card">
        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 8px 0' }}>
          Autonomous Prompt & Script Moderation Blocklist
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '0 0 12px 0' }}>
          Comma-separated list of prohibited keywords filtered by the AI brainstorming and scriptwriting engine before execution.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={blocklist}
            onChange={(e) => setBlocklist(e.target.value)}
            className="admin-input"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={handleSaveBlocklist}
            disabled={saving}
            className="admin-btn admin-btn-primary"
          >
            {saving ? 'Saving...' : '💾 Save Blocklist'}
          </button>
        </div>
      </div>

      {/* New Template Wizard Modal */}
      {showWizard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '520px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px 0' }}>
              Deploy New Autonomous Video Template
            </h3>
            <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Template Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Space & Cosmic Wonders"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                  className="admin-input"
                />
              </div>

              <div className="admin-grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                    Emoji Icon
                  </label>
                  <input
                    type="text"
                    value={newTemplate.emoji}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, emoji: e.target.value }))}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                    Niche Category
                  </label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="admin-select"
                  >
                    <option value="World Mysteries">World Mysteries</option>
                    <option value="True Stories">True Stories</option>
                    <option value="Horror & Paranormal">Horror & Paranormal</option>
                    <option value="Space & Tech">Space & Tech</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  n8n Webhook Endpoint
                </label>
                <input
                  type="text"
                  value={newTemplate.webhook}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, webhook: e.target.value }))}
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Description & Story Arc
                </label>
                <textarea
                  rows={3}
                  value={newTemplate.desc}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, desc: e.target.value }))}
                  className="admin-textarea"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" disabled={saving} className="admin-btn admin-btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Saving...' : 'Deploy to MongoDB Atlas'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
