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
async function adminFetch(actionOrEndpoint, method = 'GET', body = null, params = {}) {
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Construct URL with query parameters properly
  const queryParams = new URLSearchParams();
  
  // Parse clean action and any inline parameters if passed as 'action&key=val'
  let cleanAction = String(actionOrEndpoint || '').trim();
  if (cleanAction.includes('&')) {
    const parts = cleanAction.split('&');
    cleanAction = parts[0].trim();
    for (let i = 1; i < parts.length; i++) {
      const [k, v] = parts[i].split('=');
      if (k) queryParams.set(k, decodeURIComponent(v || ''));
    }
  }

  queryParams.set('action', cleanAction);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      queryParams.set(k, String(v));
    }
  }

  const url = `${API_BASE}?${queryParams.toString()}`;
  const options = { method, headers };

  if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
    options.body = JSON.stringify({ ...body, action: cleanAction });
  }

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`[adminService] Error executing action '${cleanAction}':`, err);
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
  syncKeysNetlify: async () => adminFetch('sync-keys-netlify', 'POST'),

  // 5. Workflow Node Manager
  getWorkflows: async () => adminFetch('get-workflows', 'GET'),
  saveWorkflowNodes: async (workflowId, nodeConfigs) =>
    adminFetch('save-workflow-nodes', 'POST', { workflowId, nodeConfigs }),

  // 6. Modal.com Dual-Cluster Hub
  getModalStatus: async () => adminFetch('get-modal-status', 'GET'),
  switchModalCluster: async (targetCluster) => adminFetch('switch-modal-cluster', 'POST', { targetCluster }),

  // 7. Platform Page Settings
  getPlatformSettings: async () => adminFetch('get-platform-settings', 'GET'),
  savePlatformSettings: async (settings) => adminFetch('save-platform-settings', 'POST', { settings }),

  // 8. AI Templates Hub
  getTemplates: async () => adminFetch('get-templates', 'GET'),
  saveTemplate: async (template, blocklist) =>
    adminFetch('save-template', 'POST', { template, blocklist }),
  deleteTemplate: async (templateId) =>
    adminFetch('delete-template', 'POST', { templateId }),

  // 9. Users & Quotas
  getUsers: async (limit = 100) => adminFetch('get-users', 'GET', null, { limit }),
  updateUserQuota: async (email, tier, credits, isBanned) =>
    adminFetch('update-user-quota', 'POST', { email, tier, credits, isBanned }),

  // 10. Telemetry & 6-Webhook Latency Ping & Telegram
  pingWebhooks: async () => adminFetch('ping-webhooks', 'POST'),
  sendTelegramAlert: async (botToken, chatId, message) =>
    adminFetch('send-telegram-alert', 'POST', { botToken, chatId, message }),

  // 11. Master Asset Vault & Pipeline
  getJobs: async (limit = 50) => adminFetch('get-jobs', 'GET', null, { limit }),

  // 12. Cloud Infrastructure & Database Visual Browser
  getInfraStatus: async () => adminFetch('get-infra-status', 'GET'),
  getCollectionDocs: async (collection) =>
    adminFetch('get-collection-docs', 'GET', null, { collection }),
  saveCollectionDoc: async (collection, document) =>
    adminFetch('save-collection-doc', 'POST', { collection, document }),
  exportDatabaseJson: async () => adminFetch('export-database-json', 'GET'),
  triggerNetlifyDeploy: async () => adminFetch('trigger-netlify-deploy', 'POST'),
  getNetlifyDeploys: async (perPage = 6) => adminFetch('get-netlify-deploys', 'GET', null, { per_page: perPage }),

  // 13. Chat LLM Live Testing
  testChatPrompt: async (model, systemPrompt, userPrompt, temperature) =>
    adminFetch('test-chat-prompt', 'POST', { model, systemPrompt, userPrompt, temperature }),

  // 14. Security Audit Logs & Password
  getAuditLogs: async () => adminFetch('get-audit-logs', 'GET'),
  changePassword: async (currentPassword, newPassword) =>
    adminFetch('change-password', 'POST', { currentPassword, newPassword })
};
