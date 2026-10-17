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
  saveLlmModel: async (provider, model, defaultProvider) => adminFetch('save-llm-model', 'POST', { provider, model, defaultProvider }),
  probeKeyBalance: async (provider, apiKey = null, all = false) => adminFetch('probe-key-balance', 'POST', { provider, apiKey, all }),
  syncKeysNetlify: async () => adminFetch('sync-keys-netlify', 'POST'),
  syncKeysToModal: async () => adminFetch('sync-keys-to-modal', 'POST'),

  // 5. Workflow Node Manager
  getWorkflows: async (syncStatus = false) => adminFetch(`get-workflows${syncStatus ? '&syncStatus=true' : ''}`, 'GET'),
  saveWorkflowNodes: async (workflowId, nodeConfigs) =>
    adminFetch('save-workflow-nodes', 'POST', { workflowId, nodeConfigs }),
  appendVideoKeys: async (workflowId, newKeys, provider = 'primary') =>
    adminFetch('append-video-keys', 'POST', { workflowId, newKeys, provider }),
  removeVideoKeys: async (workflowId, keysToRemove, provider = 'primary') =>
    adminFetch('remove-video-keys', 'POST', { workflowId, keysToRemove, provider }),
  appendKieKeys: async (workflowId, newKeys) =>
    adminFetch('append-kie-keys', 'POST', { workflowId, newKeys, provider: 'primary' }),
  removeKieKeys: async (workflowId, keysToRemove) =>
    adminFetch('remove-kie-keys', 'POST', { workflowId, keysToRemove, provider: 'primary' }),
  appendBackupKeys: async (workflowId, newKeys) =>
    adminFetch('append-backup-keys', 'POST', { workflowId, newKeys, provider: 'backup' }),
  removeBackupKeys: async (workflowId, keysToRemove) =>
    adminFetch('remove-backup-keys', 'POST', { workflowId, keysToRemove, provider: 'backup' }),
  toggleWorkflowPublish: async (workflowId, publish) =>
    adminFetch('toggle-workflow-publish', 'POST', { workflowId, publish }),
  autoDetectWorkflowIds: async () =>
    adminFetch('auto-detect-workflow-ids', 'POST'),
  getCloudWorkflowStatus: async () =>
    adminFetch('get-cloud-workflow-status', 'GET'),

  // 6. Modal.com Dual-Cluster Hub
  getModalStatus: async () => adminFetch('get-modal-status', 'GET'),
  switchModalCluster: async (targetCluster) => adminFetch('switch-modal-cluster', 'POST', { targetCluster }),

  // 7. Platform Page Settings
  getPlatformSettings: async () => adminFetch('get-platform-settings', 'GET'),
  savePlatformSettings: async (settings) => adminFetch('save-platform-settings', 'POST', { settings }),

  // 8. AI Templates Hub & Daily Limits Governance
  getTemplates: async () => adminFetch('get-templates', 'GET'),
  saveTemplate: async (template, blocklist) =>
    adminFetch('save-template', 'POST', { template, blocklist }),
  saveTemplateGovernance: async (settings) =>
    adminFetch('save-template-governance', 'POST', settings),
  resetUserTemplateLimit: async (userEmail, userId) =>
    adminFetch('reset-user-template-limit', 'POST', { userEmail, userId }),
  resetAllTemplateLimits: async () =>
    adminFetch('reset-all-template-limits', 'POST'),
  setUserTemplateOverride: async (userEmail, customLimit) =>
    adminFetch('set-user-template-override', 'POST', { userEmail, customLimit }),
  getTemplateGenerationLogs: async (limit = 100, userEmail = null, templateId = null) =>
    adminFetch('get-template-generation-logs', 'GET', null, { limit, userEmail, templateId }),
  deleteTemplate: async (templateId) =>
    adminFetch('delete-template', 'POST', { templateId }),

  // 8B. Autonomous 24-Hour Template Automations Governance
  getAllTemplateAutomations: async () =>
    adminFetch('get-all-template-automations', 'GET'),
  adminToggleAutomation: async (automationId, status) =>
    adminFetch('admin-toggle-automation', 'POST', { automationId, status }),
  adminRunAutomation: async (automationId) =>
    adminFetch('admin-run-automation', 'POST', { automationId }),
  adminUpdateAutomation: async (automationId, updates) =>
    adminFetch('admin-update-automation', 'POST', { automationId, updates }),
  adminDeleteAutomation: async (automationId) =>
    adminFetch('admin-delete-automation', 'POST', { automationId }),

  // 9. Users & Quotas
  getUsers: async (limit = 100) => adminFetch('get-users', 'GET', null, { limit }),
  updateUserQuota: async (email, tier, credits, isBanned) =>
    adminFetch('update-user-quota', 'POST', { email, tier, credits, isBanned }),
  updateUser: async (userData) =>
    adminFetch('update-user', 'POST', userData),
  disconnectUserChannel: async (email, channelId) =>
    adminFetch('disconnect-user-channel', 'POST', { email, channelId }),
  setPrimaryUserChannel: async (email, channelId) =>
    adminFetch('set-primary-user-channel', 'POST', { email, channelId }),
  disconnectUserSheets: async (email) =>
    adminFetch('disconnect-user-sheets', 'POST', { email }),
  resetUserPassword: async (email, newPassword) =>
    adminFetch('reset-user-password', 'POST', { email, newPassword }),
  deleteUser: async (email) =>
    adminFetch('delete-user', 'POST', { email }),

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
