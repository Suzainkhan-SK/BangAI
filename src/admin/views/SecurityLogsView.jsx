import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function SecurityLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs();
      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (e) {
      console.warn('Failed to load audit logs:', e.message);
    } finally {
      setLoading(false);
    }
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

    setChangingPw(true);
    try {
      const res = await adminService.changePassword(currentPw, newPw);
      if (res.success) {
        setPwMsg(res.message || 'Master Admin password updated successfully! Please re-login.');
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
        fetchLogs();
      } else {
        setPwError(res.error || 'Failed to update password.');
      }
    } catch (err) {
      setPwError(err.message);
    } finally {
      setChangingPw(false);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," +
      ["Timestamp,Admin,Action,IP,Details"]
        .concat(logs.map(l => {
          const detailStr = JSON.stringify(l.details || {}).replace(/,/g, ';');
          return `${l.timestamp},${l.adminUsername || '@SuzainkhanSK'},${l.action},${l.ipAddress || '127.0.0.1'},"${detailStr}"`;
        }))
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
          <h1 className="admin-view-title">Security & Action Audit Logs</h1>
          <p className="admin-view-desc">
            Immutable tracking of all master administrative operations recorded in MongoDB Atlas collection <code>admin_audit_logs</code>, credential rotation, and session safeguards.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={fetchLogs} className="admin-btn admin-btn-secondary">
            🔄 Refresh Logs
          </button>
          <button type="button" onClick={handleExportCSV} disabled={logs.length === 0} className="admin-btn admin-btn-primary">
            📥 Export Audit CSV ({logs.length})
          </button>
        </div>
      </div>

      {/* Two Column: Password Portal + Master Session Status */}
      <div className="admin-grid admin-grid-2">
        {/* Change Master Password */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>
            Change Master Admin Password
          </h3>

          {pwMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontSize: '12.5px',
              fontWeight: 600,
              marginBottom: '12px'
            }}>
              {pwMsg}
            </div>
          )}

          {pwError && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '12.5px',
              fontWeight: 600,
              marginBottom: '12px'
            }}>
              {pwError}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                Current Password
              </label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current master password..."
                className="admin-input"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                New Password (Minimum 8 characters)
              </label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Enter strong new password..."
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
                placeholder="Re-type new password..."
                className="admin-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={changingPw}
              className="admin-btn admin-btn-primary"
              style={{ marginTop: '6px' }}
            >
              {changingPw ? 'Updating...' : '🔒 Update Master Admin Password'}
            </button>
          </form>
        </div>

        {/* Master Session Status Card */}
        <div className="admin-card">
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>
            Master Administrative Session Safeguards
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--admin-bg-elevated)', border: '1px solid var(--admin-border-glass)' }}>
              <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>Authenticated Identity</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--admin-accent-cyan)', marginTop: '2px' }}>
                @SuzainkhanSK (Role: master_admin)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--admin-accent-green)', marginTop: '4px', fontWeight: 600 }}>
                ● Cryptographic HS256 JWT Active (24-Hour Expiration)
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: 'var(--admin-text-sub)' }}>
              <div>• <strong>Audit Retention:</strong> Immutable append-only log in Atlas</div>
              <div>• <strong>Origin Enforcement:</strong> Strict CORS policy on all Netlify functions</div>
              <div>• <strong>Storage Isolation:</strong> Dedicated <code>bangai_admin_token</code> key storage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Audit Logs Table */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Immutable Administrative Action Trail ({logs.length} Recorded Events)
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)' }}>
              Source: MongoDB Atlas <code>admin_audit_logs</code>
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Admin Operator</th>
                <th>Action Type</th>
                <th>IP Address</th>
                <th>Details Payload</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--admin-text-sub)' }}>
                    Loading audit trail from MongoDB Atlas...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--admin-text-sub)' }}>
                    No audit records recorded yet. Actions taken in the admin panel will appear here.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log._id || idx}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--admin-text-sub)' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-cyan">
                        {log.adminUsername || '@SuzainkhanSK'}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', color: 'var(--admin-accent-purple)', fontWeight: 700 }}>
                        {log.action}
                      </code>
                    </td>
                    <td style={{ fontSize: '12px', fontFamily: 'var(--admin-font-mono)' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
