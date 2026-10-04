import React, { useState, useEffect } from 'react';
import { adminService } from '../adminService';

export default function UsersManagerView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [connectionFilter, setConnectionFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected User Inspector Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('quota'); // 'quota' | 'channels' | 'sheets' | 'profile' | 'security'
  const [saving, setSaving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Form states inside Inspector
  const [editFormData, setEditFormData] = useState({
    name: '',
    tier: 'Creator Pro Plan',
    credits: 100,
    unlimitedCredits: false,
    channel: '',
    niche: '',
    isBanned: false,
    banReason: '',
    newPassword: '',
    deleteConfirmText: ''
  });

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

  // When a user is clicked to inspect, populate the form
  const handleOpenInspector = (user, defaultTab = 'quota') => {
    setSelectedUser(user);
    setActiveTab(defaultTab);
    setActionSuccess('');
    setActionError('');
    setEditFormData({
      name: user.name || '',
      tier: user.tier || user.plan || 'Creator Pro Plan',
      credits: user.credits !== undefined ? user.credits : (user.creditsRemaining || 100),
      unlimitedCredits: Boolean(user.unlimitedCredits),
      channel: user.channel || '',
      niche: user.niche || '',
      isBanned: Boolean(user.isBanned),
      banReason: user.banReason || '',
      newPassword: '',
      deleteConfirmText: ''
    });
  };

  const handleCloseInspector = () => {
    setSelectedUser(null);
    setActionSuccess('');
    setActionError('');
  };

  // Helper to show a temporary toast
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // 1. Save Profile / Quota Changes
  const handleSaveProfileAndQuota = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setActionSuccess('');
    setActionError('');

    try {
      const payload = {
        email: selectedUser.email,
        name: editFormData.name,
        tier: editFormData.tier,
        plan: editFormData.tier,
        credits: Number(editFormData.credits),
        creditsRemaining: Number(editFormData.credits),
        unlimitedCredits: editFormData.unlimitedCredits,
        channel: editFormData.channel,
        niche: editFormData.niche,
        isBanned: editFormData.isBanned,
        banReason: editFormData.banReason
      };

      const res = await adminService.updateUser(payload);
      if (res.success) {
        setActionSuccess('Creator profile & quota updated successfully in Atlas!');
        showToast(`Saved modifications for ${selectedUser.email}`);
        // Update local state
        setUsers(prev => prev.map(u => u.email === selectedUser.email ? { ...u, ...payload } : u));
        setSelectedUser(prev => ({ ...prev, ...payload }));
      } else {
        setActionError(res.error || 'Failed to update user');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 2. Disconnect a YouTube Channel
  const handleDisconnectChannel = async (channelId, channelTitle) => {
    if (!window.confirm(`Are you sure you want to disconnect YouTube channel "${channelTitle || channelId}" from ${selectedUser.email}?`)) {
      return;
    }
    setSaving(true);
    setActionSuccess('');
    setActionError('');

    try {
      const res = await adminService.disconnectUserChannel(selectedUser.email, channelId);
      if (res.success) {
        setActionSuccess(`Channel "${channelTitle || channelId}" disconnected successfully.`);
        showToast(`Channel disconnected from ${selectedUser.email}`);
        const updatedChannels = (selectedUser.youtubeChannels || []).filter(c => c.channelId !== channelId);
        setUsers(prev => prev.map(u => u.email === selectedUser.email ? { ...u, youtubeChannels: updatedChannels } : u));
        setSelectedUser(prev => ({ ...prev, youtubeChannels: updatedChannels }));
      } else {
        setActionError(res.error || 'Failed to disconnect channel');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 3. Set Primary Default YouTube Channel
  const handleSetPrimaryChannel = async (channelId, channelTitle) => {
    setSaving(true);
    setActionSuccess('');
    setActionError('');

    try {
      const res = await adminService.setPrimaryUserChannel(selectedUser.email, channelId);
      if (res.success) {
        setActionSuccess(`"${channelTitle || channelId}" is now set as the primary default channel.`);
        showToast(`Primary channel updated for ${selectedUser.email}`);
        const updatedChannels = (selectedUser.youtubeChannels || []).map(c => ({
          ...c,
          isDefault: c.channelId === channelId
        }));
        setUsers(prev => prev.map(u => u.email === selectedUser.email ? { ...u, youtubeChannels: updatedChannels } : u));
        setSelectedUser(prev => ({ ...prev, youtubeChannels: updatedChannels }));
      } else {
        setActionError(res.error || 'Failed to update primary channel');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 4. Disconnect Google Sheets
  const handleDisconnectSheets = async () => {
    if (!window.confirm(`Are you sure you want to disconnect Google Sheets automation for ${selectedUser.email}?`)) {
      return;
    }
    setSaving(true);
    setActionSuccess('');
    setActionError('');

    try {
      const res = await adminService.disconnectUserSheets(selectedUser.email);
      if (res.success) {
        setActionSuccess('Google Sheets disconnected successfully.');
        showToast(`Sheets disconnected for ${selectedUser.email}`);
        const updatedSheets = { ...selectedUser.googleSheets, connected: false };
        setUsers(prev => prev.map(u => u.email === selectedUser.email ? { ...u, googleSheetsConnected: false, googleSheets: updatedSheets } : u));
        setSelectedUser(prev => ({ ...prev, googleSheetsConnected: false, googleSheets: updatedSheets }));
      } else {
        setActionError(res.error || 'Failed to disconnect Google Sheets');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 5. Reset Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!editFormData.newPassword || editFormData.newPassword.length < 6) {
      setActionError('New password must be at least 6 characters long.');
      return;
    }
    setSaving(true);
    setActionSuccess('');
    setActionError('');

    try {
      const res = await adminService.resetUserPassword(selectedUser.email, editFormData.newPassword);
      if (res.success) {
        setActionSuccess(`Password reset successfully! New credentials active immediately in Atlas.`);
        showToast(`Password updated for ${selectedUser.email}`);
      } else {
        setActionError(res.error || 'Failed to reset password');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Generate strong random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pwd = 'BangAI#';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditFormData(prev => ({ ...prev, newPassword: pwd }));
  };

  // 6. Permanently Delete User
  const handleDeleteUser = async () => {
    if (editFormData.deleteConfirmText !== selectedUser.email && editFormData.deleteConfirmText !== 'DELETE') {
      setActionError(`Please type either "${selectedUser.email}" or "DELETE" to confirm permanent deletion.`);
      return;
    }

    if (!window.confirm(`FINAL WARNING: This will permanently delete ${selectedUser.email} from MongoDB Atlas! Are you 100% sure?`)) {
      return;
    }

    setSaving(true);
    setActionSuccess('');
    setActionError('');

    try {
      const res = await adminService.deleteUser(selectedUser.email);
      if (res.success) {
        showToast(`Creator ${selectedUser.email} deleted permanently.`);
        setUsers(prev => prev.filter(u => u.email !== selectedUser.email));
        handleCloseInspector();
      } else {
        setActionError(res.error || 'Failed to delete user');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter computations
  const uniqueTiers = ['ALL', ...Array.from(new Set(users.map(u => u.tier).filter(Boolean)))];

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = (u.email && u.email.toLowerCase().includes(q)) ||
                          (u.name && u.name.toLowerCase().includes(q)) ||
                          (u.channel && u.channel.toLowerCase().includes(q)) ||
                          (u.youtubeChannels && u.youtubeChannels.some(c => (c.channelTitle && c.channelTitle.toLowerCase().includes(q)) || (c.customUrl && c.customUrl.toLowerCase().includes(q))));

    const matchesTier = tierFilter === 'ALL' || u.tier === tierFilter;

    let matchesConnection = true;
    if (connectionFilter === 'YOUTUBE') {
      matchesConnection = u.youtubeChannels && u.youtubeChannels.length > 0;
    } else if (connectionFilter === 'SHEETS') {
      matchesConnection = Boolean(u.googleSheetsConnected);
    } else if (connectionFilter === 'BANNED') {
      matchesConnection = Boolean(u.isBanned);
    } else if (connectionFilter === 'ACTIVE') {
      matchesConnection = !u.isBanned;
    }

    return matchesSearch && matchesTier && matchesConnection;
  });

  // Calculate high-level summary metrics
  const totalChannelsCount = users.reduce((acc, u) => acc + (u.youtubeChannels?.length || 0), 0);
  const totalSheetsConnected = users.filter(u => u.googleSheetsConnected).length;
  const totalCreditsInCirculation = users.reduce((acc, u) => acc + (u.creditsRemaining || u.credits || 0), 0);

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

      {/* Summary KPI Cards */}
      <div className="admin-grid admin-grid-4" style={{ marginBottom: '20px' }}>
        <div className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', textTransform: 'uppercase', fontWeight: 700 }}>
              Registered Creators
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
              {users.length}
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            📺
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', textTransform: 'uppercase', fontWeight: 700 }}>
              Connected YouTube Channels
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444' }}>
              {totalChannelsCount} Linked
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            📊
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', textTransform: 'uppercase', fontWeight: 700 }}>
              Google Sheets Automated
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>
              {totalSheetsConnected} Accounts
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', textTransform: 'uppercase', fontWeight: 700 }}>
              Active Quotas in Circulation
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#8b5cf6' }}>
              {totalCreditsInCirculation.toLocaleString()} Credits
            </div>
          </div>
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
          <div style={{ flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creator by name, email, YouTube handle, or channel..."
              className="admin-input"
            />
          </div>
          <div style={{ width: '200px' }}>
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
          <div style={{ width: '200px' }}>
            <select
              value={connectionFilter}
              onChange={(e) => setConnectionFilter(e.target.value)}
              className="admin-select"
            >
              <option value="ALL">All Accounts ({users.length})</option>
              <option value="YOUTUBE">YouTube Connected ({users.filter(u => u.youtubeChannels?.length > 0).length})</option>
              <option value="SHEETS">Google Sheets Linked ({users.filter(u => u.googleSheetsConnected).length})</option>
              <option value="ACTIVE">Active Only ({users.filter(u => !u.isBanned).length})</option>
              <option value="BANNED">Suspended / Banned ({users.filter(u => u.isBanned).length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
              Registered Creators ({filteredUsers.length} Found in Atlas)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
              Click any user row to open the complete Creator Inspector & Full Moderation Hub.
            </span>
          </div>
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
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--admin-text-sub)' }}>
                      No creators match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const channels = u.youtubeChannels || [];
                    const defaultChannel = channels.find(c => c.isDefault) || channels[0];

                    return (
                      <tr
                        key={u.id || u.email}
                        onClick={() => handleOpenInspector(u)}
                        style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        title="Click to view full creator details & moderation tools"
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--admin-border-glass)' }}
                              />
                            ) : (
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '14px' }}>
                                {(u.name || u.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--admin-text-main)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {u.name || 'Creator'}
                                {u.authProvider === 'google' ? (
                                  <span style={{ fontSize: '11px', color: 'var(--admin-accent-cyan)' }} title="Signed up with Google OAuth">🌐</span>
                                ) : (
                                  <span style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }} title="Email & Password auth">🔑</span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="admin-badge admin-badge-purple">
                            {u.tier || u.plan || 'Creator Pro'}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontWeight: 800, fontSize: '14px' }}>
                            {u.unlimitedCredits ? (
                              <span style={{ color: 'var(--admin-accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                ∞ <span style={{ fontSize: '11.5px', fontWeight: 600 }}>Unlimited</span>
                              </span>
                            ) : (
                              <>
                                {u.creditsRemaining !== undefined ? u.creditsRemaining : (u.credits || 0)}{' '}
                                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--admin-text-sub)' }}>credits</span>
                              </>
                            )}
                          </div>
                        </td>

                        <td>
                          {channels.length > 0 ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <span className="admin-badge admin-badge-danger" style={{ padding: '2px 7px', fontSize: '10.5px' }}>
                                  📺 {channels.length} {channels.length === 1 ? 'Channel' : 'Channels'}
                                </span>
                                {defaultChannel && (
                                  <span style={{ fontWeight: 600, color: 'var(--admin-accent-cyan)', fontSize: '12px' }}>
                                    {defaultChannel.channelTitle}
                                  </span>
                                )}
                              </div>
                              {defaultChannel && (
                                <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{defaultChannel.customUrl || '@channel'}</span>
                                  <span>•</span>
                                  <span style={{ color: 'var(--admin-accent-green)', fontWeight: 600 }}>
                                    {Number(defaultChannel.subscriberCount || 0).toLocaleString()} subs
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="admin-badge admin-badge-secondary">None Connected</span>
                          )}
                        </td>

                        <td>
                          {u.googleSheetsConnected ? (
                            <div>
                              <span className="admin-badge admin-badge-success">● Connected</span>
                              {u.googleSheets?.autoLog && (
                                <div style={{ fontSize: '10.5px', color: 'var(--admin-accent-green)', marginTop: '2px', fontWeight: 600 }}>
                                  ⚡ Auto-Log Active
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="admin-badge admin-badge-secondary">Disconnected</span>
                          )}
                        </td>

                        <td>
                          <span className={`admin-badge ${u.isBanned ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                            {u.isBanned ? 'BANNED' : 'ACTIVE'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenInspector(u);
                            }}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            🔍 Inspect & Moderate
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==========================================================================
          CREATOR INSPECTOR & FULL MODERATION MODAL
          ========================================================================== */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={handleCloseInspector}>
          <div className="admin-modal-content admin-modal-content-lg" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--admin-border-glass)', paddingBottom: '18px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--admin-accent-cyan)' }}
                  />
                ) : (
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '20px' }}>
                    {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '19px', fontWeight: 800, margin: 0, color: 'var(--admin-text-main)' }}>
                      {selectedUser.name || 'Creator'}
                    </h2>
                    <span className={`admin-badge ${selectedUser.isBanned ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                      {selectedUser.isBanned ? 'BANNED' : 'ACTIVE'}
                    </span>
                    <span className="admin-badge admin-badge-cyan">
                      {selectedUser.authProvider === 'google' ? 'Google OAuth' : 'Email/Password'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--admin-text-sub)', marginTop: '2px' }}>
                    {selectedUser.email} • ID: <code style={{ fontSize: '11px', background: 'var(--admin-bg-elevated)', padding: '2px 5px', borderRadius: '4px' }}>{selectedUser.id}</code>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
                    📅 Registered: {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                    {selectedUser.lastLoginAt && (
                      <span style={{ marginLeft: '12px' }}>
                        🕒 Last Login: {new Date(selectedUser.lastLoginAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseInspector}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-sub)', fontSize: '24px', cursor: 'pointer', padding: '4px' }}
                title="Close Inspector"
              >
                ✕
              </button>
            </div>

            {/* Notification Banners inside Modal */}
            {actionSuccess && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
                ✓ {actionSuccess}
              </div>
            )}
            {actionError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
                ⚠️ {actionError}
              </div>
            )}

            {/* Modal Tabs Navigation */}
            <div className="admin-tabs-nav">
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'quota' ? 'active' : ''}`}
                onClick={() => setActiveTab('quota')}
              >
                ⚡ Quota & Credits
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
                onClick={() => setActiveTab('channels')}
              >
                📺 YouTube Channels ({selectedUser.youtubeChannels?.length || 0})
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'sheets' ? 'active' : ''}`}
                onClick={() => setActiveTab('sheets')}
              >
                📊 Google Sheets {selectedUser.googleSheetsConnected ? '●' : ''}
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                ⚙️ Channel Defaults
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                🛡️ Security & Account Actions
              </button>
            </div>

            {/* TAB 1: QUOTA & CREDITS */}
            {activeTab === 'quota' && (
              <form onSubmit={handleSaveProfileAndQuota} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                      Subscription Tier Override
                    </label>
                    <select
                      value={editFormData.tier}
                      onChange={(e) => setEditFormData({ ...editFormData, tier: e.target.value })}
                      className="admin-select"
                    >
                      <option value="Creator Pro Plan">Creator Pro Plan</option>
                      <option value="Free Trial">Free Trial</option>
                      <option value="Enterprise Unlimited">Enterprise Unlimited</option>
                      <option value="Agency Custom">Agency Custom</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                      Credits Remaining Balance
                    </label>
                    <input
                      type="number"
                      value={editFormData.credits}
                      onChange={(e) => setEditFormData({ ...editFormData, credits: Number(e.target.value) })}
                      className="admin-input"
                      min={0}
                    />
                  </div>
                </div>

                {/* Quick Credit Modifiers */}
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '8px' }}>
                    ⚡ Quick Balance Boosters:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, credits: Number(prev.credits) + 50 }))}
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      +50 Credits
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, credits: Number(prev.credits) + 100 }))}
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      +100 Credits
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, credits: Number(prev.credits) + 500 }))}
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      +500 Credits
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, credits: Number(prev.credits) + 1000 }))}
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      +1,000 Credits
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData(prev => ({ ...prev, credits: 0 }))}
                      className="admin-btn admin-btn-danger"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Reset to 0
                    </button>
                  </div>
                </div>

                {/* Unlimited Credits Toggle */}
                <div style={{ padding: '14px', background: 'var(--admin-bg-elevated)', borderRadius: '12px', border: '1px solid var(--admin-border-glass)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    checked={editFormData.unlimitedCredits}
                    onChange={(e) => setEditFormData({ ...editFormData, unlimitedCredits: e.target.checked })}
                    id="unlimited_credits_check"
                    style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <label htmlFor="unlimited_credits_check" style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--admin-text-main)' }}>
                      Grant Unlimited Credits (Bypass Quota Limit)
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)' }}>
                      When enabled, story generation, thumbnail creations, and AI renders will not deduct from the credit balance.
                    </div>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" disabled={saving} className="admin-btn admin-btn-primary" style={{ padding: '10px 20px' }}>
                    {saving ? 'Saving...' : '💾 Save Quota Changes to Atlas'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: YOUTUBE CHANNELS */}
            {activeTab === 'channels' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                      Connected YouTube Channels ({selectedUser.youtubeChannels?.length || 0})
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '2px 0 0 0' }}>
                      OAuth tokens allow direct video uploading from BangAI pipeline to these YouTube channels.
                    </p>
                  </div>
                </div>

                {(!selectedUser.youtubeChannels || selectedUser.youtubeChannels.length === 0) ? (
                  <div className="admin-info-box" style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📺</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--admin-text-main)' }}>
                      No YouTube Channels Connected
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
                      The creator has not yet connected a YouTube account via Google OAuth. Once linked in their BangAI studio dashboard, it will appear here.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedUser.youtubeChannels.map((ch, idx) => (
                      <div key={ch.channelId || idx} className="admin-channel-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {ch.avatarUrl || ch.thumbnailUrl ? (
                              <img
                                src={ch.avatarUrl || ch.thumbnailUrl}
                                alt={ch.channelTitle}
                                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--admin-border-glass)' }}
                              />
                            ) : (
                              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px' }}>
                                📺
                              </div>
                            )}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--admin-text-main)' }}>
                                  {ch.channelTitle || 'Untitled Channel'}
                                </div>
                                {ch.isDefault ? (
                                  <span className="admin-badge admin-badge-cyan" style={{ fontSize: '10.5px' }}>
                                    ★ PRIMARY DEFAULT
                                  </span>
                                ) : (
                                  <span className="admin-badge admin-badge-secondary" style={{ fontSize: '10.5px' }}>
                                    Secondary Channel
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--admin-accent-cyan)', marginTop: '2px' }}>
                                {ch.customUrl || '@channel'} • <code style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>{ch.channelId}</code>
                              </div>
                            </div>
                          </div>

                          {/* Channel-level Moderation Actions */}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {!ch.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryChannel(ch.channelId, ch.channelTitle)}
                                disabled={saving}
                                className="admin-btn admin-btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                ★ Set as Primary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDisconnectChannel(ch.channelId, ch.channelTitle)}
                              disabled={saving}
                              className="admin-btn admin-btn-danger"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              Disconnect Channel
                            </button>
                          </div>
                        </div>

                        {/* Channel Statistics Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '4px' }}>
                          <div style={{ background: 'var(--admin-bg-surface)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--admin-border-glass)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Subscribers</div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--admin-accent-green)' }}>
                              {Number(ch.subscriberCount || 0).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ background: 'var(--admin-bg-surface)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--admin-border-glass)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Uploaded Videos</div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                              {Number(ch.videoCount || 0).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ background: 'var(--admin-bg-surface)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--admin-border-glass)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Total Views</div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                              {Number(ch.viewCount || 0).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ background: 'var(--admin-bg-surface)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--admin-border-glass)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>OAuth Token Status</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: ch.tokenValid !== false ? '#10b981' : '#ef4444' }}>
                              {ch.tokenValid !== false ? '● Valid & Active' : '⚠️ Needs Reconnect'}
                            </div>
                          </div>
                        </div>

                        {/* Token Details Bar */}
                        <div style={{ fontSize: '11.5px', color: 'var(--admin-text-sub)', display: 'flex', flexWrap: 'wrap', gap: '14px', borderTop: '1px solid var(--admin-border-glass)', paddingTop: '10px' }}>
                          <span>Connected Since: <strong>{ch.connectedAt ? new Date(ch.connectedAt).toLocaleDateString() : 'N/A'}</strong></span>
                          {ch.googleAccountEmail && <span>Google Account: <strong>{ch.googleAccountEmail}</strong></span>}
                          {ch.expiresAt && (
                            <span>Token Expiry: <strong>{new Date(ch.expiresAt).toLocaleTimeString()}</strong></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: GOOGLE SHEETS */}
            {activeTab === 'sheets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="admin-info-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                          Google Sheets Automated Logging
                        </h3>
                        <span className={`admin-badge ${selectedUser.googleSheetsConnected ? 'admin-badge-success' : 'admin-badge-secondary'}`}>
                          {selectedUser.googleSheetsConnected ? '● Connected' : 'Disconnected'}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--admin-text-sub)', marginTop: '4px' }}>
                        When enabled, generated shorts, titles, captions, and YouTube upload links are logged in real-time to the creator's Google Sheet.
                      </p>
                    </div>

                    {selectedUser.googleSheetsConnected && (
                      <button
                        type="button"
                        onClick={handleDisconnectSheets}
                        disabled={saving}
                        className="admin-btn admin-btn-danger"
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                      >
                        Disconnect Google Sheets
                      </button>
                    )}
                  </div>

                  {selectedUser.googleSheetsConnected && selectedUser.googleSheets && (
                    <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div style={{ background: 'var(--admin-bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-border-glass)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Linked Google Email</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                          {selectedUser.googleSheets.email || selectedUser.email}
                        </div>
                      </div>
                      <div style={{ background: 'var(--admin-bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-border-glass)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Auto-Log Automation</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: selectedUser.googleSheets.autoLog ? '#10b981' : '#f59e0b' }}>
                          {selectedUser.googleSheets.autoLog ? 'Active & Logging' : 'Paused'}
                        </div>
                      </div>
                      <div style={{ background: 'var(--admin-bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-border-glass)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-sub)' }}>Integration Date</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--admin-text-main)' }}>
                          {selectedUser.googleSheets.connectedAt ? new Date(selectedUser.googleSheets.connectedAt).toLocaleDateString() : 'Active'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: IDENTITY & CHANNEL DEFAULTS */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfileAndQuota} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                    Creator Display Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="admin-input"
                    placeholder="e.g. Suzain Khan"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                      Default Studio Channel Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.channel}
                      onChange={(e) => setEditFormData({ ...editFormData, channel: e.target.value })}
                      className="admin-input"
                      placeholder="e.g. ChronoRaaz"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                      Default Story / Content Niche
                    </label>
                    <input
                      type="text"
                      value={editFormData.niche}
                      onChange={(e) => setEditFormData({ ...editFormData, niche: e.target.value })}
                      className="admin-input"
                      placeholder="e.g. Dark Psychology, History, AI Tech"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" disabled={saving} className="admin-btn admin-btn-primary" style={{ padding: '10px 20px' }}>
                    {saving ? 'Saving...' : '💾 Save Identity Defaults to Atlas'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 5: SECURITY & ACCOUNT ACTIONS */}
            {activeTab === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                
                {/* 1. Account Suspension / Ban Section */}
                <div className="admin-info-box" style={{ borderColor: editFormData.isBanned ? 'rgba(239, 68, 68, 0.4)' : undefined }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 10px 0', color: editFormData.isBanned ? '#ef4444' : 'var(--admin-text-main)' }}>
                    🚫 Account Suspension & Banning
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <input
                      type="checkbox"
                      checked={editFormData.isBanned}
                      onChange={(e) => setEditFormData({ ...editFormData, isBanned: e.target.checked })}
                      id="account_ban_checkbox"
                      style={{ width: '18px', height: '18px', accentColor: '#ef4444', cursor: 'pointer' }}
                    />
                    <label htmlFor="account_ban_checkbox" style={{ fontSize: '13.5px', fontWeight: 700, color: editFormData.isBanned ? '#ef4444' : 'var(--admin-text-main)', cursor: 'pointer' }}>
                      Suspend this creator account (Blocks API generation & portal login)
                    </label>
                  </div>

                  {editFormData.isBanned && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-sub)', marginBottom: '6px' }}>
                        Reason for Suspension (Visible in audit logs)
                      </label>
                      <input
                        type="text"
                        value={editFormData.banReason}
                        onChange={(e) => setEditFormData({ ...editFormData, banReason: e.target.value })}
                        className="admin-input"
                        placeholder="e.g. Terms of service violation, automated render abuse"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveProfileAndQuota}
                    disabled={saving}
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    Apply Ban Status
                  </button>
                </div>

                {/* 2. Direct Password Reset Section */}
                <div className="admin-info-box">
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 10px 0', color: 'var(--admin-text-main)' }}>
                    🔑 Reset Creator Password (PBKDF2 SHA512 Salt & Hash)
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '0 0 12px 0' }}>
                    Directly overrides the user's password in MongoDB Atlas. The creator will be able to immediately log into BangAI with this new password.
                  </p>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={editFormData.newPassword}
                        onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                        placeholder="Enter new password (min 6 characters)"
                        className="admin-input"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontSize: '12px' }}
                    >
                      🎲 Generate Strong
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={saving || !editFormData.newPassword || editFormData.newPassword.length < 6}
                      className="admin-btn admin-btn-primary"
                      style={{ padding: '10px 16px', whiteSpace: 'nowrap', fontSize: '12px' }}
                    >
                      Apply Password
                    </button>
                  </div>
                </div>

                {/* 3. Danger Zone: Permanently Delete User */}
                <div style={{ padding: '18px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 6px 0', color: '#ef4444' }}>
                    ⚠️ Danger Zone: Permanent Account Deletion
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--admin-text-sub)', margin: '0 0 12px 0' }}>
                    Irreversibly deletes this user record from MongoDB Atlas. This will delete all connected OAuth tokens, profile data, and balances.
                  </p>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={editFormData.deleteConfirmText}
                      onChange={(e) => setEditFormData({ ...editFormData, deleteConfirmText: e.target.value })}
                      placeholder={`Type "${selectedUser.email}" or "DELETE" to confirm`}
                      className="admin-input"
                      style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    />
                    <button
                      type="button"
                      onClick={handleDeleteUser}
                      disabled={saving || (editFormData.deleteConfirmText !== selectedUser.email && editFormData.deleteConfirmText !== 'DELETE')}
                      className="admin-btn admin-btn-danger"
                      style={{ padding: '10px 18px', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: 700 }}
                    >
                      Permanently Delete
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--admin-border-glass)' }}>
              <button
                type="button"
                onClick={handleCloseInspector}
                className="admin-btn admin-btn-secondary"
                style={{ padding: '8px 20px' }}
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
