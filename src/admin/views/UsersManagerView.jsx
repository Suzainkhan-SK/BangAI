import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

const MOCK_USERS = [
  { id: 'u_1', email: 'creator_pro@gmail.com', name: 'Alex Rivera', tier: 'Pro', creditsRemaining: 450, youtubeConnected: true, isBanned: false, createdAt: '2026-09-12' },
  { id: 'u_2', email: 'test_creator@yahoo.com', name: 'Sarah Chen', tier: 'Free', creditsRemaining: 3, youtubeConnected: false, isBanned: false, createdAt: '2026-09-28' },
  { id: 'u_3', email: 'spammer_bot@tempmail.com', name: 'Spam Bot', tier: 'Free', creditsRemaining: 0, youtubeConnected: false, isBanned: true, createdAt: '2026-10-01' },
  { id: 'u_4', email: 'enterprise_agency@studio.ai', name: 'Studio Media Global', tier: 'Enterprise', creditsRemaining: 2500, youtubeConnected: true, isBanned: false, createdAt: '2026-08-15' }
];

export default function UsersManagerView() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await adminService.getUsers(50);
      if (res.success && res.data?.length > 0) {
        setUsers(res.data);
      }
    } catch (e) {}
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
      setToastMsg(`User ${editingUser.email} quota & permissions updated!`);
      setEditingUser(null);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      setToastMsg(`Error: ${err.message}`);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
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
            User directory, YouTube OAuth channel tokens, subscription tier overrides, and manual credit balance modifications.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={fetchUsers} className="admin-btn admin-btn-secondary">
            🔄 Refresh Directory
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

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user by name or email..."
              className="admin-input"
            />
          </div>
          <div style={{ width: '160px' }}>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="admin-select"
            >
              <option value="ALL">All Tiers</option>
              <option value="Free">Free</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User / Email</th>
                <th>Tier</th>
                <th>Credits Remaining</th>
                <th>YouTube Connected</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id || u.email}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>{u.name || 'Unnamed Creator'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>{u.email}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${u.tier === 'Pro' ? 'admin-badge-purple' : u.tier === 'Enterprise' ? 'admin-badge-cyan' : 'admin-badge-secondary'}`}>
                      {u.tier}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {u.creditsRemaining} credits
                  </td>
                  <td>
                    <span className={`admin-badge ${u.youtubeConnected ? 'admin-badge-success' : 'admin-badge-secondary'}`}>
                      {u.youtubeConnected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
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
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      Edit Quota
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Quota Modal */}
      {editingUser && (
        <div className="admin-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                Edit Quota: {editingUser.email}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-sub)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
                  Subscription Tier Override
                </label>
                <select
                  value={editingUser.tier}
                  onChange={(e) => setEditingUser({ ...editingUser, tier: e.target.value })}
                  className="admin-select"
                >
                  <option value="Free">Free Tier</option>
                  <option value="Pro">Pro Subscription Tier</option>
                  <option value="Enterprise">Enterprise Unlimited</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '4px' }}>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  checked={editingUser.isBanned}
                  onChange={(e) => setEditingUser({ ...editingUser, isBanned: e.target.checked })}
                  id="ban_checkbox"
                  style={{ accentColor: '#ef4444' }}
                />
                <label htmlFor="ban_checkbox" style={{ fontSize: '13px', fontWeight: 600, color: editingUser.isBanned ? '#ef4444' : 'var(--admin-text-main)', cursor: 'pointer' }}>
                  Ban User (Prevent API access and generation)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="submit" className="admin-btn admin-btn-primary" style={{ flex: 1 }}>
                  Save User Quota
                </button>
                <button type="button" onClick={() => setEditingUser(null)} className="admin-btn admin-btn-secondary">
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
