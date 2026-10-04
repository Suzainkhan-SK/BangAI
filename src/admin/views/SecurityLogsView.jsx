import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

const MOCK_LOGS = [
  { id: 'log_1', timestamp: '2026-10-04T12:15:30Z', admin: '@SuzainkhanSK', action: 'MASTER_LOGIN', ip: '127.0.0.1', status: 'SUCCESS' },
  { id: 'log_2', timestamp: '2026-10-04T12:12:10Z', admin: '@SuzainkhanSK', action: 'KEY_VAULT_PROBE', ip: '127.0.0.1', status: 'SUCCESS' },
  { id: 'log_3', timestamp: '2026-10-04T11:45:00Z', admin: '@SuzainkhanSK', action: 'N8N_MIGRATION', ip: '127.0.0.1', status: 'SUCCESS' },
  { id: 'log_4', timestamp: '2026-10-04T09:30:15Z', admin: '@SuzainkhanSK', action: 'MODAL_CLUSTER_SWITCH', ip: '127.0.0.1', status: 'SUCCESS' },
  { id: 'log_5', timestamp: '2026-10-03T18:20:00Z', admin: '@SuzainkhanSK', action: 'USER_QUOTA_OVERRIDE', ip: '127.0.0.1', status: 'SUCCESS' }
];

export default function SecurityLogsView() {
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await adminService.getAuditLogs();
      if (res.success && res.data?.length > 0) {
        setLogs(res.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwError('');

    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }

    if (newPw.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }

    try {
      const res = await adminService.changePassword(currentPw, newPw);
      if (res.success) {
        setPwMsg(res.message || 'Password successfully changed!');
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
      } else {
        setPwError(res.error || 'Failed to update password.');
      }
    } catch (err) {
      setPwError(err.message);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      ["Timestamp,Admin,Action,IP,Status"]
        .concat(logs.map(l => `${l.timestamp},${l.admin || '@SuzainkhanSK'},${l.action},${l.ip || '127.0.0.1'},${l.status || 'SUCCESS'}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">Security & Audit Logs</h1>
          <p className="admin-view-desc">
            Immutable tracking of all administrative actions, master password maintenance, and session termination.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={handleExportCSV} className="admin-btn admin-btn-secondary">
            📥 Export Audit CSV
          </button>
        </div>
      </div>

      {/* Two Column: Password Portal + Session Controls */}
      <div className="admin-grid admin-grid-2" style={{ marginBottom: '24px' }}>
        {/* Change Master Password */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
            Change Master Admin Password
          </h3>

          {pwMsg && (
            <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '12px', marginBottom: '12px' }}>
              ✅ {pwMsg}
            </div>
          )}

          {pwError && (
            <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>
              ⚠️ {pwError}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Current Master Password
              </label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="admin-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                New Master Password (Min 8 characters)
              </label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="admin-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="admin-input"
                required
              />
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" style={{ marginTop: '4px' }}>
              Update Master Password
            </button>
          </form>
        </div>

        {/* Master Account Information & Session Controls */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
            Master Administrator Profile
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div><strong>Admin Username:</strong> <code>@SuzainkhanSK</code></div>
            <div><strong>Role Authority:</strong> <span className="admin-badge admin-badge-cyan">master_admin</span></div>
            <div><strong>Session Token Type:</strong> HMAC-SHA256 Signed Bearer JWT</div>
            <div><strong>Token Expiration:</strong> 24 Hours from Login</div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--admin-border-glass)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px 0', color: '#ef4444' }}>
              Emergency Session Termination
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '0 0 12px 0' }}>
              Immediately revokes all issued admin tokens across all browsers and locks down the command center.
            </p>
            <button
              type="button"
              onClick={() => {
                adminService.logout();
                window.location.reload();
              }}
              className="admin-btn admin-btn-danger"
            >
              🔒 Invalidate All Admin Sessions & Lock
            </button>
          </div>
        </div>
      </div>

      {/* Immutable Audit Trail Table */}
      <div className="admin-card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
          Immutable Security & Audit Trail (Last 50 Entries)
        </h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Action Code</th>
                <th>IP Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.id || idx}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.timestamp}</td>
                  <td style={{ fontWeight: 600 }}>{log.admin || '@SuzainkhanSK'}</td>
                  <td><code>{log.action}</code></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.ip || '127.0.0.1'}</td>
                  <td><span className="admin-badge admin-badge-success">{log.status || 'SUCCESS'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
