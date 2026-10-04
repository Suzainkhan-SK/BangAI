import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function TemplatesManagerView() {
  const [templates, setTemplates] = useState([]);
  const [blocklist, setBlocklist] = useState('nsfw, hate, violence, illegal, deepfake_celebrity');
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'Documentary',
    icon: '✨',
    webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-',
    tier: 'Free',
    promptFormula: 'Create an engaging 5-scene viral short about {TOPIC} with maximum suspense and high-retention pacing.'
  });
  const [toastMsg, setToastMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await adminService.getTemplates();
      if (res.success && res.data) {
        setTemplates(res.data.templates || []);
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
    const updated = { ...template, active: !template.active };
    setTemplates(prev => prev.map(t => t.id === template.id ? updated : t));
    try {
      await adminService.saveTemplate(updated);
      setToastMsg(`Template "${template.name}" ${!template.active ? 'Activated' : 'Deactivated'} in Atlas!`);
    } catch (e) {
      setToastMsg(`Error updating template: ${e.message}`);
    } finally {
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const handleDeleteTemplate = async (templateId, name) => {
    const confirmed = window.confirm(`Are you sure you want to permanently delete template "${name}" from MongoDB Atlas?`);
    if (!confirmed) return;

    setTemplates(prev => prev.filter(t => t.id !== templateId));
    try {
      await adminService.deleteTemplate(templateId);
      setToastMsg(`Template "${name}" deleted from MongoDB Atlas.`);
    } catch (e) {
      setToastMsg(`Error deleting: ${e.message}`);
    } finally {
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const handleSaveBlocklist = async () => {
    setSaving(true);
    try {
      await adminService.saveTemplate(null, blocklist);
      setToastMsg('Keyword blocklist saved to MongoDB Atlas successfully!');
    } catch (e) {
      setToastMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.name) return;

    setSaving(true);
    const item = {
      id: newTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      ...newTemplate,
      active: true,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await adminService.saveTemplate(item);
      if (res.success) {
        setTemplates([item, ...templates]);
        setShowWizard(false);
        setNewTemplate({
          name: '',
          category: 'Documentary',
          icon: '✨',
          webhook: 'https://cmpunktg29.app.n8n.cloud/webhook/template-',
          tier: 'Free',
          promptFormula: ''
        });
        setToastMsg(`Autonomous Template "${item.name}" registered and deployed to MongoDB Atlas!`);
      } else {
        setToastMsg(`Error: ${res.error}`);
      }
    } catch (err) {
      setToastMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(''), 4500);
    }
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">AI Templates Hub & Zero-Code Creator</h1>
          <p className="admin-view-desc">
            Autonomous video generation niches, 1-click template creation wizard, keyword moderation blocklists, and live n8n webhooks.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowWizard(!showWizard)}
            className="admin-btn admin-btn-primary"
          >
            {showWizard ? '✕ Close Wizard' : '🪄 1-Click New Template Wizard'}
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
          fontWeight: 600
        }}>
          {toastMsg}
        </div>
      )}

      {/* 1-Click New Template Wizard */}
      {showWizard && (
        <div className="admin-card" style={{ border: '2px solid var(--admin-accent-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--admin-accent-cyan)' }}>
              🧙‍♂️ 1-Click Autonomous Template Creation Wizard (Zero Code)
            </h3>
            <span className="admin-badge admin-badge-cyan">Atlas Connected</span>
          </div>

          <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="admin-grid-3">
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Template Title *
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    setNewTemplate(prev => ({
                      ...prev,
                      name: val,
                      webhook: `https://cmpunktg29.app.n8n.cloud/webhook/template-${slug}`
                    }));
                  }}
                  placeholder="e.g. Crime Scene Dossier"
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Category & Emoji Icon
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newTemplate.icon}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, icon: e.target.value }))}
                    style={{ width: '45px', textAlign: 'center', fontSize: '18px' }}
                    className="admin-input"
                  />
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="admin-select"
                    style={{ flex: 1 }}
                  >
                    <option value="Documentary">Documentary</option>
                    <option value="History">History & Lore</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Science">Space & Science</option>
                    <option value="Finance">Finance & Wealth</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  User Access Tier
                </label>
                <select
                  value={newTemplate.tier}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, tier: e.target.value }))}
                  className="admin-select"
                >
                  <option value="Free">Free (All Users)</option>
                  <option value="Pro">Pro Creators Only</option>
                  <option value="Agency">Agency Exclusive</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Auto-Generated n8n Webhook Endpoint
              </label>
              <input
                type="text"
                value={newTemplate.webhook}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, webhook: e.target.value }))}
                className="admin-input"
                style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                AI Screenplay Prompt Formula
              </label>
              <textarea
                value={newTemplate.promptFormula}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, promptFormula: e.target.value }))}
                rows={3}
                placeholder="Formula with placeholders like {TOPIC}..."
                className="admin-textarea"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowWizard(false)}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="admin-btn admin-btn-primary"
              >
                {saving ? 'Registering in Atlas...' : '🚀 Deploy Template to BangAI'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Live Templates Grid */}
      <div className="admin-grid-3">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--admin-text-sub)' }}>
            Loading templates from MongoDB Atlas...
          </div>
        ) : (
          templates.map((tpl) => (
            <div
              key={tpl.id}
              className="admin-card"
              style={{
                borderColor: tpl.active ? 'var(--admin-border-glass)' : 'rgba(239, 68, 68, 0.3)',
                opacity: tpl.active ? 1 : 0.75
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'var(--admin-bg-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    {tpl.icon || '🎬'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                      {tpl.name}
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>
                      {tpl.category} • <span style={{ color: 'var(--admin-accent-cyan)' }}>{tpl.tier}</span>
                    </div>
                  </div>
                </div>
                <span className={`admin-badge ${tpl.active ? 'admin-badge-success' : 'admin-badge-amber'}`}>
                  {tpl.active ? '● LIVE' : '○ PAUSED'}
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', marginBottom: '12px', lineHeight: 1.4 }}>
                {tpl.promptFormula || 'Autonomous 5-scene viral video generation pipeline.'}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', borderTop: '1px solid var(--admin-border-glass)', paddingTop: '8px', marginBottom: '12px' }}>
                <code>{tpl.webhook ? tpl.webhook.split('/webhook')[1] || tpl.webhook : `/webhook/template-${tpl.id}`}</code>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => handleToggleActive(tpl)}
                  className={`admin-btn ${tpl.active ? 'admin-btn-secondary' : 'admin-btn-success'}`}
                  style={{ flex: 1, padding: '7px 10px', fontSize: '12px' }}
                >
                  {tpl.active ? 'Pause Template' : 'Activate Template'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                  className="admin-btn admin-btn-danger"
                  style={{ padding: '7px 12px', fontSize: '12px' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Keyword Moderation & Banned Topics Card */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Autonomous Generation Banned Keywords & Moderation Blocklist
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '2px 0 0 0' }}>
              Topics matching these keywords will be rejected prior to dispatching render jobs to n8n and Json2Video.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveBlocklist}
            disabled={saving}
            className="admin-btn admin-btn-primary"
          >
            {saving ? 'Saving...' : '💾 Save Blocklist'}
          </button>
        </div>

        <textarea
          value={blocklist}
          onChange={(e) => setBlocklist(e.target.value)}
          rows={3}
          className="admin-textarea"
          style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12.5px' }}
        />
      </div>
    </div>
  );
}
