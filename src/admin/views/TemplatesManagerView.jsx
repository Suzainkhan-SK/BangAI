import React, { useState } from 'react';

const INITIAL_TEMPLATES = [
  { id: 't_wm', name: 'World Mysteries', category: 'Documentary', icon: '🏛️', webhook: '/webhook/template-world-mysteries', active: true, tier: 'Free' },
  { id: 't_24h', name: 'Last 24 Hours News', category: 'News', icon: '⏱️', webhook: '/webhook/template-last-24-hours', active: true, tier: 'Pro' },
  { id: 't_horror', name: '3 AM Horror Stories', category: 'Entertainment', icon: '👻', webhook: '/webhook/template-3am-horror', active: true, tier: 'Free' },
  { id: 't_scitech', name: 'Future Sci-Tech', category: 'Science', icon: '🚀', webhook: '/webhook/template-sci-tech', active: true, tier: 'Pro' },
  { id: 't_myth', name: 'Ancient Mythology', category: 'History', icon: '⚡', webhook: '/webhook/template-mythology', active: false, tier: 'Pro' }
];

export default function TemplatesManagerView() {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [blocklist, setBlocklist] = useState('nsfw, hate, violence, illegal, deepfake_celebrity');
  const [showWizard, setShowWizard] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'Documentary',
    icon: '✨',
    webhook: '/webhook/template-',
    tier: 'Free',
    promptFormula: 'Create an engaging 10-scene viral short about {TOPIC} with maximum suspense.'
  });
  const [toastMsg, setToastMsg] = useState('');

  const handleToggleActive = (id) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
    setToastMsg('Template status updated!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!newTemplate.name) return;

    const item = {
      id: `t_${Date.now()}`,
      ...newTemplate,
      active: true
    };

    setTemplates([item, ...templates]);
    setShowWizard(false);
    setNewTemplate({
      name: '',
      category: 'Documentary',
      icon: '✨',
      webhook: '/webhook/template-',
      tier: 'Free',
      promptFormula: ''
    });
    setToastMsg(`Template "${item.name}" registered and deployed!`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">AI Templates Hub & Wizard</h1>
          <p className="admin-view-desc">
            Manage public video generation templates, add new automated niches with 1-click, and configure keyword blocklists.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowWizard(!showWizard)}
            className="admin-btn admin-btn-primary"
          >
            {showWizard ? '✕ Close Wizard' : '+ 1-Click New Template Wizard'}
          </button>
        </div>
      </div>

      {toastMsg && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          {toastMsg}
        </div>
      )}

      {/* 1-Click New Template Wizard Modal / Card */}
      {showWizard && (
        <div className="admin-card" style={{ marginBottom: '24px', border: '2px solid var(--admin-accent-cyan)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--admin-accent-cyan)' }}>
            🧙‍♂️ 1-Click New Template Creation Wizard
          </h3>
          <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="admin-grid admin-grid-3">
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({
                    ...prev,
                    name: e.target.value,
                    webhook: `/webhook/template-${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
                  }))}
                  placeholder="e.g. Crime Scene Dossier"
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Category & Icon
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newTemplate.icon}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, icon: e.target.value }))}
                    style={{ width: '50px', textAlign: 'center' }}
                    className="admin-input"
                  />
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="admin-select"
                  >
                    <option value="Documentary">Documentary</option>
                    <option value="News">News</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  User Tier Requirement
                </label>
                <select
                  value={newTemplate.tier}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, tier: e.target.value }))}
                  className="admin-select"
                >
                  <option value="Free">Free (All Users)</option>
                  <option value="Pro">Pro Subscription Only</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Assigned Automation Webhook Endpoint
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
                Prompt Engineering Formula
              </label>
              <textarea
                rows={3}
                value={newTemplate.promptFormula}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, promptFormula: e.target.value }))}
                className="admin-textarea"
                placeholder="Structure instructions with {TOPIC} token..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                🚀 Deploy Template to Public Hub
              </button>
              <button type="button" onClick={() => setShowWizard(false)} className="admin-btn admin-btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates Catalog Table */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
          Active Video Templates Catalog ({templates.length})
        </h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Category</th>
                <th>Webhook Endpoint</th>
                <th>Access Tier</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <tr key={tpl.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <span style={{ fontSize: '18px' }}>{tpl.icon}</span>
                      <span>{tpl.name}</span>
                    </div>
                  </td>
                  <td><span className="admin-badge admin-badge-cyan">{tpl.category}</span></td>
                  <td><code>{tpl.webhook}</code></td>
                  <td>
                    <span className={`admin-badge ${tpl.tier === 'Pro' ? 'admin-badge-purple' : 'admin-badge-secondary'}`}>
                      {tpl.tier}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${tpl.active ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                      {tpl.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(tpl.id)}
                      className={`admin-btn ${tpl.active ? 'admin-btn-secondary' : 'admin-btn-success'}`}
                      style={{ padding: '4px 10px', fontSize: '11.5px' }}
                    >
                      {tpl.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global SafeSearch Keyword Blocklist */}
      <div className="admin-card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 8px 0' }}>
          Global SafeSearch Keyword Blocklist
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '0 0 12px 0' }}>
          Comma-separated terms that will immediately reject video creation requests before LLM invocation.
        </p>
        <textarea
          rows={3}
          value={blocklist}
          onChange={(e) => setBlocklist(e.target.value)}
          className="admin-textarea"
        />
        <button
          type="button"
          onClick={() => {
            setToastMsg('Safety keyword blocklist updated!');
            setTimeout(() => setToastMsg(''), 3000);
          }}
          className="admin-btn admin-btn-secondary"
          style={{ marginTop: '10px' }}
        >
          Save Blocklist
        </button>
      </div>
    </div>
  );
}
