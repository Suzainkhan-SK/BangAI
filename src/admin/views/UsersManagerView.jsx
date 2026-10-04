import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function UsersManagerView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await adminService.getUsers(100);
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setErrorMsg(res.error || 'Failed to load users from MongoDB Atlas');
      }
    } catch (e) {
      setErrorMsg(e.message);
      console.warn('Error fetching real users:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await adminService.updateUserQuota(
        editingUser.email,
        editingUser.tier,
        editingUser.creditsRemaining,
        editingUser.isBanned
      );
      setUsers(prev => prev.map(u => u.email === editingUser.email ? editingUser : u));
      setToastMsg(`User ${editingUser.email} quota & permissions updated in MongoDB Atlas!`);
      setEditingUser(null);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      setToastMsg(`Error: ${err.message}`);
    }
  };

  const uniqueTiers = ['ALL', ...Array.from(new Set(users.map(u => u.tier).filter(Boolean)))];

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
                          (u.name && u.name.toLowerCase().includes(search.toLowerCase()));
    const matchesTier = tierFilter === 'ALL' || u.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="admin-view-container">
      {/* View Header */}
      <div className="admin-view-header">
        <div>
          <h1 className="admin-view-title">User & Quota Center</h1>
          <p className="admin-view-desc">
            Direct real-time moderation of registered creators, YouTube OAuth channel tokens, Google Sheets integrations, and quota allocation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={fetchUsers} disabled={loading} className="admin-btn admin-btn-secondary">
            🔄 {loading ? 'Loading...' : 'Refresh Directory'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {toastMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-card">
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creator by name or email..."
              className="admin-input"
            />
          </div>
          <div style={{ width: '220px' }}>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="admin-select"
            >
              <option value="ALL">All Tiers ({users.length})</option>
              {uniqueTiers.filter(t => t !== 'ALL').map(t => (
                <option key={t} value={t}>{t} ({users.filter(u => u.tier === t).length})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
            Registered Users ({filteredUsers.length} Found in Atlas)
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
            Database: <code>viral-shorts-ai-studio.users</code>
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-sub)' }}>
            Querying MongoDB Atlas users collection...
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Creator / Account</th>
                  <th>Subscription Tier</th>
                  <th>Credits Balance</th>
                  <th>YouTube Channels</th>
                  <th>Google Sheets</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const channels = u.youtubeChannels || [];
                  const defaultChannel = channels.find(c => c.isDefault) || channels[0];

                  return (
                    <tr key={u.id || u.email}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--admin-border-glass)' }}
                            />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '14px' }}>
                              {(u.name || u.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '14px' }}>{u.name || 'Creator'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="admin-badge admin-badge-purple">
                          {u.tier || 'Creator Pro'}
                        </span>
                      </td>

                      <td style={{ fontWeight: 800, fontSize: '14px' }}>
                        {u.creditsRemaining} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--admin-text-sub)' }}>credits</span>
                      </td>

                      <td>
                        {defaultChannel ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--admin-accent-cyan)', fontSize: '12.5px' }}>
                              {defaultChannel.channelTitle} ({defaultChannel.customUrl || '@channel'})
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--admin-accent-green)' }}>
                              ● {defaultChannel.subscriberCount || 0} subs • OAuth Valid
                            </div>
                          </div>
                        ) : (
                          <span className="admin-badge admin-badge-secondary">None Connected</span>
                        )}
                      </td>

                      <td>
                        {u.googleSheetsConnected ? (
                          <span className="admin-badge admin-badge-success">● Connected</span>
                        ) : (
                          <span className="admin-badge admin-badge-secondary">Disconnected</span>
                        )}
                      </td>

                      <td>
                        <span className={`admin-badge ${u.isBanned ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                          {u.isBanned ? 'BANNED' : 'ACTIVE'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => setEditingUser({ ...u })}
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Modify Quota
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Quota Modal */}
      {editingUser && (
        <div className="admin-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                  Modify Creator Quota: {editingUser.name}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', marginTop: '2px' }}>
                  {editingUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-sub)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                  Subscription Tier Override
                </label>
                <select
                  value={editingUser.tier}
                  onChange={(e) => setEditingUser({ ...editingUser, tier: e.target.value })}
                  className="admin-select"
                >
                  <option value="Creator Pro Plan">Creator Pro Plan</option>
                  <option value="Free">Free Trial</option>
                  <option value="Enterprise">Enterprise Unlimited</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                  Credits Remaining Balance
                </label>
                <input
                  type="number"
                  value={editingUser.creditsRemaining}
                  onChange={(e) => setEditingUser({ ...editingUser, creditsRemaining: Number(e.target.value) })}
                  className="admin-input"
                  min={0}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--admin-bg-elevated)', borderRadius: '10px', border: '1px solid var(--admin-border-glass)' }}>
                <input
                  type="checkbox"
                  checked={editingUser.isBanned}
                  onChange={(e) => setEditingUser({ ...editingUser, isBanned: e.target.checked })}
                  id="ban_checkbox"
                  style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
                />
                <label htmlFor="ban_checkbox" style={{ fontSize: '13px', fontWeight: 600, color: editingUser.isBanned ? '#ef4444' : 'var(--admin-text-main)', cursor: 'pointer' }}>
                  Ban Creator Account (Blocks generation & API access)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="admin-btn admin-btn-primary" style={{ flex: 1, padding: '12px' }}>
                  Save & Push to Atlas
                </button>
                <button type="button" onClick={() => setEditingUser(null)} className="admin-btn admin-btn-secondary" style={{ padding: '12px' }}>
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
