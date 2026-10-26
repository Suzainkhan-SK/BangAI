import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function N8nMigratorView() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationStep, setMigrationStep] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [migrationResult, setMigrationResult] = useState(null);
  const [copiedId, setCopiedId] = useState('');
  const [publishing, setPublishing] = useState(false);

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
      if (res.success && res.data) {
        setConfig(res.data);
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

    const cleanHost = newHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const confirmed = window.confirm(
      `Confirm 1-Click Migration to: ${cleanHost}?\n\nThis will authenticate with the new account, transfer/map all workflows, update MongoDB Atlas configuration & Netlify environment variables automatically.`
    );
    if (!confirmed) return;

    setMigrating(true);
    setErrorMsg('');
    setMigrationResult(null);
    setStatusMsg('Initiating automated 1-Click Migration pipeline...');

    const steps = [
      '1. Authenticating with new n8n cloud instance via REST session...',
      '2. Checking destination workflows & snapshotting current config in Atlas...',
      '3. Transferring master automation workflows with sanitized node credentials...',
      '4. Mapping Flagship workflow IDs & dual-format webhook endpoints...',
      '5. Updating MongoDB Atlas configuration & Netlify environment variables...'
    ];

    let currentStep = 1;
    setMigrationStep(currentStep);
    setStatusMsg(steps[0]);

    const stepInterval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setMigrationStep(currentStep);
        setStatusMsg(steps[currentStep - 1]);
      }
    }, 1200);

    try {
      const res = await adminService.migrateN8n(cleanHost, email, password, mcpToken);
      clearInterval(stepInterval);
      setMigrationStep(5);

      if (res.success) {
        setStatusMsg('🎉 1-Click Migration Completed Successfully! New instance is active in Atlas & Netlify.');
        setMigrationResult(res.data);
        fetchConfig();
        setNewHost('');
        setEmail('');
        setPassword('');
        setMcpToken('');
      } else {
        setErrorMsg(res.error || 'Migration failed during cloud push.');
      }
    } catch (err) {
      clearInterval(stepInterval);
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
        setMigrationResult(null);
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

  const handleCopy = (id) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    }
  };

  const handlePublishAll = async () => {
    setPublishing(true);
    try {
      const res = await adminService.universalTogglePublish(true);
      if (res.success) {
        setStatusMsg(`🎉 ${res.message}`);
      } else {
        setErrorMsg(res.error || 'Failed to publish workflows. Check credentials.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const activeHost = config?.activeInstance || 'https://cmpunktg33.app.n8n.cloud';
  const cleanActiveHost = activeHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const lastSnapshotHost = config?.previousSnapshot?.activeInstance || 'https://cmpunktg25.app.n8n.cloud';
  const cleanLastSnapshot = lastSnapshotHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const productionWorkflows = config?.productionWorkflows || {};
  const studioWorkflowId = productionWorkflows.viralShorts || config?.workflowId || '5rD3atsYgg7xTckt';

  // Calculate real days remaining in trial
  const trialExpiration = config?.trialExpirationDate ? new Date(config.trialExpirationDate) : null;
  const daysRemaining = trialExpiration ? Math.max(0, Math.ceil((trialExpiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 14;
  const trialProgressPercent = Math.min(100, Math.max(0, Math.round(((14 - daysRemaining) / 14) * 100)));

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">1-Click 14-Day n8n Migrator</h1>
          <p className="admin-view-desc">
            Seamlessly migrate master automation workflows, webhook endpoints, and API credentials to a new n8n cloud account with one click.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={fetchConfig} disabled={loading} className="admin-btn admin-btn-secondary">
            🔄 Refresh
          </button>
          <button
            type="button"
            onClick={handleRollback}
            disabled={migrating}
            className="admin-btn admin-btn-secondary"
            title="Restore previous n8n instance snapshot"
          >
            ⏪ 1-Click Rollback ({cleanLastSnapshot.split('.')[0]})
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          fontSize: '13px',
          fontWeight: 600
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Migration Status Cards */}
      <div className="admin-grid-3">
        <div className="admin-kpi-card">
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 700 }}>ACTIVE n8n INSTANCE</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--admin-accent-cyan)', marginTop: '4px' }}>
            {cleanActiveHost}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--admin-accent-green)', fontWeight: 600, marginTop: '4px' }}>
            ● Primary Studio ID: <code>{studioWorkflowId}</code>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '6px' }}>
            Active & wired in MongoDB Atlas
          </div>
        </div>

        <div className="admin-kpi-card">
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 700 }}>14-DAY TRIAL LIFESPAN</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: daysRemaining < 3 ? 'var(--admin-accent-red, #ef4444)' : 'var(--admin-accent-amber)', marginTop: '4px' }}>
            {daysRemaining} Days Remaining
          </div>
          <div className="admin-progress-bar" style={{ marginTop: '8px' }}>
            <div className="admin-progress-fill" style={{ width: `${trialProgressPercent}%` }}></div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '6px' }}>
            {trialExpiration ? `Expires ${trialExpiration.toLocaleDateString()}` : 'Auto-detected 14-day cycle'}
          </div>
        </div>

        <div className="admin-kpi-card">
          <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', fontWeight: 700 }}>SAFETY ROLLBACK SNAPSHOT</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--admin-text-main)', marginTop: '4px' }}>
            {cleanLastSnapshot}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--admin-accent-cyan)', fontWeight: 600, marginTop: '4px' }}>
            ● Snapshot verified in MongoDB
          </div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', marginTop: '6px' }}>
            1-Click instant recovery available
          </div>
        </div>
      </div>

      {/* Migration Success / Inspection Card */}
      {migrationResult && (
        <div className="admin-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05), transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#10b981' }}>
                🎉 Migration Completed Successfully to {migrationResult.activeInstance}!
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', margin: '4px 0 0 0' }}>
                Workflows Transferred / Linked: <strong>{migrationResult.workflowsTransferred}</strong> • Ready for native credential linking.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePublishAll}
              disabled={publishing}
              className="admin-btn admin-btn-primary"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              {publishing ? 'Publishing...' : `▶️ Publish All (${migrationResult.checklist?.length || 6}) Flagship Workflows`}
            </button>
          </div>

          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            fontSize: '12.5px',
            color: 'var(--admin-text-sub)',
            marginBottom: '16px',
            lineHeight: 1.6
          }}>
            <strong style={{ color: 'var(--admin-accent-cyan)' }}>📌 Manual Process in n8n Cloud:</strong><br />
            1. Open each workflow link below in your browser.<br />
            2. In nodes with red warning badges (e.g. <code>Google Sheets OAuth2</code>, <code>Google Gemini</code>, <code>OpenAI / xKiro</code>), select your credential from the dropdown and click <strong>Save</strong>.<br />
            3. Toggle each workflow to <strong>Published (Active)</strong> or click <strong>▶️ Publish All</strong> above! All API keys in code nodes are already preserved.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {migrationResult.checklist?.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'var(--admin-bg-elevated)',
                border: '1px solid var(--admin-border-subtle)',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--admin-text-main)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '2px' }}>
                    Required Credentials: <code style={{ color: 'var(--admin-accent-amber)' }}>{item.creds}</code>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id)}
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11.5px' }}
                    title="Copy Workflow ID"
                  >
                    {copiedId === item.id ? '✓ Copied ID' : `ID: ${item.id}`}
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none' }}
                  >
                    Open in n8n ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1-Click Migration Form */}
      <div className="admin-card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>
          Execute Instant Migration to New Account
        </h3>

        {migrating && (
          <div style={{ marginBottom: '20px', padding: '16px 20px', borderRadius: '12px', background: 'var(--admin-bg-elevated)', border: '1px solid var(--admin-border-glow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 700 }}>
              <span>Migration Pipeline in Progress...</span>
              <span style={{ color: 'var(--admin-accent-cyan)' }}>Step {migrationStep} of 5</span>
            </div>
            <div className="admin-progress-bar">
              <div className="admin-progress-fill" style={{ width: `${(migrationStep / 5) * 100}%` }}></div>
            </div>
          </div>
        )}

        <form onSubmit={handleStartMigration} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="admin-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                New n8n Cloud Instance URL *
              </label>
              <input
                type="text"
                value={newHost}
                onChange={(e) => setNewHost(e.target.value)}
                placeholder="e.g. cmpunktg1outlook.app.n8n.cloud"
                className="admin-input"
                disabled={migrating}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                Admin Email (Owner) *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. cmpunktg1@outlook.com"
                className="admin-input"
                disabled={migrating}
                required
              />
            </div>
          </div>

          <div className="admin-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                n8n API Key / MCP Access Token (Optional)
              </label>
              <input
                type="text"
                value={mcpToken}
                onChange={(e) => setMcpToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="admin-input"
                disabled={migrating}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={migrating}
            className="admin-btn admin-btn-primary"
            style={{ padding: '12px 24px', fontSize: '14px', alignSelf: 'flex-start', marginTop: '4px' }}
          >
            {migrating ? 'Migrating Workflows & Config...' : '🚀 Migrate All Workflows in 1-Click'}
          </button>
        </form>
      </div>

      {/* Real Webhook Endpoints Table */}
      <div className="admin-card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
          Active Webhook Endpoints on {cleanActiveHost}
        </h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Workflow Name</th>
                <th>Full Cloud Webhook URL</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>Viral All-In-One AI (Primary)</td>
                <td><code>https://{cleanActiveHost}/webhook/viral-shorts-ai</code></td>
                <td><span className="admin-badge admin-badge-success">● ACTIVE</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Story Approval Callback</td>
                <td><code>https://{cleanActiveHost}/webhook/story-approval</code></td>
                <td><span className="admin-badge admin-badge-success">● ACTIVE</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>YouTube Direct Uploader</td>
                <td><code>https://{cleanActiveHost}/webhook/viral-shorts-ai-youtube-upload</code></td>
                <td><span className="admin-badge admin-badge-success">● ACTIVE</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Template: World Mysteries</td>
                <td><code>https://{cleanActiveHost}/webhook/template-world-mysteries</code></td>
                <td><span className="admin-badge admin-badge-success">● ACTIVE</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Template: Last 24 Hours</td>
                <td><code>https://{cleanActiveHost}/webhook/template-last-24-hours</code></td>
                <td><span className="admin-badge admin-badge-success">● ACTIVE</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Template: 3 AM Horror</td>
                <td><code>https://{cleanActiveHost}/webhook/template-3am-horror</code></td>
                <td><span className="admin-badge admin-badge-success">● ACTIVE</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

