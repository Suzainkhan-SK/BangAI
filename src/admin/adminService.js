// adminService.js — Client-Side API Service for BangAI Admin Panel
// Communicates with /.netlify/functions/admin with signed master JWT authentication

const API_BASE = '/.netlify/functions/admin';

// Helper to get stored admin token
export function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bangai_admin_token') || null;
}

// Helper to set stored admin token
export function setAdminToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('bangai_admin_token', token);
  } else {
    localStorage.removeItem('bangai_admin_token');
  }
}

// Helper to make authenticated admin request
async function adminFetch(action, method = 'GET', body = null) {
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}?action=${encodeURIComponent(action)}`;
  const options = { method, headers };

  if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
    options.body = JSON.stringify({ ...body, action });
  }

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`[adminService] Error executing action '${action}':`, err);
    return { success: false, error: err.message };
  }
}

export const adminService = {
  // 1. Auth & Verification
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });
    const data = await res.json();
    if (data.success && data.token) {
      setAdminToken(data.token);
    }
    return data;
  },

  verify: async () => adminFetch('verify', 'GET'),
  logout: () => setAdminToken(null),

  // 2. Command Center Overview
  getDashboard: async () => adminFetch('get-dashboard', 'GET'),

  // 3. 1-Click 14-Day n8n Migration Hub
  getN8nConfig: async () => adminFetch('get-n8n-config', 'GET'),
  migrateN8n: async (newHost, email, password, mcpToken) =>
    adminFetch('migrate-n8n', 'POST', { newHost, email, password, mcpToken }),
  rollbackN8n: async () => adminFetch('rollback-n8n', 'POST'),

  // 4. Dynamic API Key Vault
  getKeys: async () => adminFetch('get-keys', 'GET'),
  saveKeys: async (provider, keys) => adminFetch('save-keys', 'POST', { provider, keys }),
  probeKeyBalance: async (provider, apiKey) => adminFetch('probe-key-balance', 'POST', { provider, apiKey }),

  // 5. Modal.com Dual-Cluster Hub
  getModalStatus: async () => adminFetch('get-modal-status', 'GET'),
  switchModalCluster: async (targetCluster) => adminFetch('switch-modal-cluster', 'POST', { targetCluster }),

  // 6. Platform Page Settings
  getPlatformSettings: async () => adminFetch('get-platform-settings', 'GET'),
  savePlatformSettings: async (settings) => adminFetch('save-platform-settings', 'POST', { settings }),

  // 7. Users & Quotas
  getUsers: async (limit = 50) => adminFetch(`get-users&limit=${limit}`, 'GET'),
  updateUserQuota: async (email, tier, credits, isBanned) =>
    adminFetch('update-user-quota', 'POST', { email, tier, credits, isBanned }),

  // 8. Telemetry & 6-Webhook Latency Ping
  pingWebhooks: async () => adminFetch('ping-webhooks', 'POST'),

  // 9. Master Asset Vault & Pipeline
  getJobs: async (limit = 50) => adminFetch(`get-jobs&limit=${limit}`, 'GET'),

  // 10. Cloud Infrastructure Status
  getInfraStatus: async () => adminFetch('get-infra-status', 'GET'),

  // 11. Security Audit Logs & Password
  getAuditLogs: async () => adminFetch('get-audit-logs', 'GET'),
  changePassword: async (currentPassword, newPassword) =>
    adminFetch('change-password', 'POST', { currentPassword, newPassword })
};
