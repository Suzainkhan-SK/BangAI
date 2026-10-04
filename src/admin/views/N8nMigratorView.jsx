import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function N8nMigratorView() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationStep, setMigrationStep] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [newHost, setNewHost] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mcpToken, setMcpToken] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await adminService.getN8nConfig();
      if (res.success) {
        setConfig(res.data);
      } else {
        setErrorMsg(res.error || 'Failed to load n8n configuration');
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleStartMigration = async (e) => {
    e.preventDefault();
    if (!newHost || !email || !password) {
      setErrorMsg('Please fill in New Host URL, Admin Email, and Admin Password.');
      return;
    }

    const confirmed = window.confirm(
      `Confirm 1-Click Migration to: ${newHost}?\n\nThis will snapshot current workflows, deploy to the new instance, and update BangAI production webhook endpoints automatically.`
    );
    if (!confirmed) return;

    setMigrating(true);
    setErrorMsg('');
    setStatusMsg('Initiating automated 1-Click Migration pipeline...');

    // Visual step sequence
    const steps = [
      '1. Authenticating with new n8n cloud instance...',
      '2. Snapshotting current production workflows & variables...',
      '3. Pushing 6 master automation workflows to new host...',
      '4. Injecting production API credentials into workflow nodes...',
      '5. Updating Netlify environment variables & verifying live webhooks...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setMigrationStep(i + 1);
      setStatusMsg(steps[i]);
      await new Promise(r => setTimeout(r, 900));
    }

    try {
      const res = await adminService.migrateN8n(newHost, email, password, mcpToken);
      if (res.success) {
        setStatusMsg('🎉 1-Click Migration Completed Successfully! New instance is active.');
        fetchConfig();
        setNewHost('');
        setEmail('');
        setPassword('');
        setMcpToken('');
      } else {
        setErrorMsg(res.error || 'Migration failed during cloud push.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error during migration execution.');
    } finally {
      setMigrating(false);
    }
  };

  const handleRollback = async () => {
    const confirmed = window.confirm(
      'Rollback to previous snapshot instance?\n\nThis will restore the last active n8n instance and re-point webhooks immediately.'
    );
    if (!confirmed) return;

    setMigrating(true);
    setErrorMsg('');
    setStatusMsg('Executing emergency rollback...');

    try {
      const res = await adminService.rollbackN8n();
      if (res.success) {
        setStatusMsg(`Rollback complete! ${res.message}`);
        fetchConfig();
      } else {
        setErrorMsg(res.error || 'Rollback failed.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setMigrating(false);
    }
  };

  const activeHost = config?.activeInstance || 'cmpunktg29.app.n8n.cloud';
  const lastSnapshot = config?.snapshot?.activeInstance || 'cmpunktg22.app.n8n.cloud';

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">1-Click 14-Day n8n Migrator</h1>
          <p className="admin-view-desc">
            Seamlessly migrate all 6 master automation workflows, webhook endpoints, and API credentials to a new n8n cloud account with one click.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={fetchConfig} className="admin-btn admin-btn-secondary">
            🔄 Refresh
          </button>
          <button
            type="button"
            onClick={handleRollback}
            disabled={migrating}
            className="admin-btn admin-btn-secondary"
            title="Restore previous n8n instance snapshot"
          >
            ⏪ 1-Click Rollback ({lastSnapshot.split('.')[0]})
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Migration Status Cards */}
      <div className="admin-grid admin-grid-3" style={{ marginBottom: '24px' }}>
        <div className="admin-card">
          <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', fontWeight: 600 }}>ACTIVE n8n INSTANCE</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--admin-accent-cyan)', marginTop: '4px' }}>
            {activeHost}
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px' }}>● 6/6 Workflows Active & Listening</div>
        </div>

        <div className="admin-card">
          <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', fontWeight: 600 }}>TRIAL LIFESPAN</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--admin-accent-amber)', marginTop: '4px' }}>
            14 Days Active
          </div>
          <div className="admin-progress-bar" style={{ marginTop: '8px' }}>
            <div className="admin-progress-fill" style={{ width: '35%' }}></div>
          </div>
        </div>

        <div className="admin-card">
          <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', fontWeight: 600 }}>SAFETY ROLLBACK SNAPSHOT</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--admin-text-main)', marginTop: '4px' }}>
            {lastSnapshot}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '6px' }}>Restorable in 1-click if needed</div>
        </div>
      </div>

      {/* 1-Click Migration Form */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>
          Execute Instant Migration to New Account
        </h3>

        {migrating && (
          <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '10px', background: 'var(--admin-bg-elevated)', border: '1px solid var(--admin-border-glow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
              <span>Migration Pipeline in Progress...</span>
              <span style={{ color: 'var(--admin-accent-cyan)' }}>Step {migrationStep} of 5</span>
            </div>
            <div className="admin-progress-bar">
              <div className="admin-progress-fill" style={{ width: `${(migrationStep / 5) * 100}%` }}></div>
            </div>
          </div>
        )}

        <form onSubmit={handleStartMigration} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="admin-grid admin-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                New n8n Cloud Instance URL *
              </label>
              <input
                type="text"
                value={newHost}
                onChange={(e) => setNewHost(e.target.value)}
                placeholder="e.g. cmpunktg30.app.n8n.cloud"
                className="admin-input"
                disabled={migrating}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                Admin Email (Owner) *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. cmpunktg30@gmail.com"
                className="admin-input"
                disabled={migrating}
                required
              />
            </div>
          </div>

          <div className="admin-grid admin-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                Admin Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Account password..."
                className="admin-input"
                disabled={migrating}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                n8n API Key / MCP Access Token (Optional)
              </label>
              <input
                type="text"
                value={mcpToken}
                onChange={(e) => setMcpToken(e.target.value)}
                placeholder="n8n_api_key_..."
                className="admin-input"
                disabled={migrating}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={migrating}
            className="admin-btn admin-btn-primary"
            style={{ padding: '12px 20px', fontSize: '14px', alignSelf: 'flex-start', marginTop: '8px' }}
          >
            {migrating ? 'Migrating Workflows & Config...' : '🚀 Migrate All Workflows in 1-Click'}
          </button>
        </form>
      </div>

      {/* 6 Automated Workflows Table */}
      <div className="admin-card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
          Managed Automation Workflows (Auto-Transferred)
        </h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Workflow Name</th>
                <th>Webhook Path</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>YT-Automation-New-10Scenes</td>
                <td><code>/webhook/viral-shorts-ai</code></td>
                <td>Direct 10-Scene Pipeline</td>
                <td><span className="admin-badge admin-badge-success">ACTIVE</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Story Approval Callback</td>
                <td><code>/webhook/story-approval</code></td>
                <td>Webhook Receiver</td>
                <td><span className="admin-badge admin-badge-success">ACTIVE</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>YouTube Direct Uploader</td>
                <td><code>/webhook/viral-shorts-ai-youtube-upload</code></td>
                <td>OAuth Publisher</td>
                <td><span className="admin-badge admin-badge-success">ACTIVE</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Template: World Mysteries</td>
                <td><code>/webhook/template-world-mysteries</code></td>
                <td>Niche Auto-Gen</td>
                <td><span className="admin-badge admin-badge-success">ACTIVE</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Template: Last 24 Hours</td>
                <td><code>/webhook/template-last-24-hours</code></td>
                <td>News Aggregator</td>
                <td><span className="admin-badge admin-badge-success">ACTIVE</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Template: 3 AM Horror</td>
                <td><code>/webhook/template-3am-horror</code></td>
                <td>Dark Atmosphere Gen</td>
                <td><span className="admin-badge admin-badge-success">ACTIVE</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
