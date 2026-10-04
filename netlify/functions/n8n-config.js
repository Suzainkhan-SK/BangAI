// BangAI - Dynamic n8n Configuration Module
// Reads active n8n instance and webhooks dynamically from MongoDB Atlas
// Supports instant 14-day n8n account migration with zero rebuilds and zero downtime.

import { getDb } from './db.js';

let cachedConfig = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // Refresh from DB every 60 seconds

const DEFAULT_CONFIG = {
  activeInstance: 'https://cmpunktg29.app.n8n.cloud',
  apiKey: process.env.N8N_API_KEY || 'n8n_api_d07ac84c49c0e4b37d0025c7d8cb5c6d773a14f0',
  workflowId: 'YKl6hhWT4kEs9Ytc',
  webhooks: {
    viral_shorts: process.env.N8N_WEBHOOK_URL || 'https://cmpunktg29.app.n8n.cloud/webhook/viral-shorts-ai',
    story_approval: 'https://cmpunktg29.app.n8n.cloud/webhook/story-approval',
    youtube_upload: process.env.N8N_YOUTUBE_WEBHOOK_URL || 'https://cmpunktg29.app.n8n.cloud/webhook/viral-shorts-ai-youtube-upload',
    template_world_mysteries: 'https://cmpunktg29.app.n8n.cloud/webhook/template-world-mysteries',
    template_last_24_hours: 'https://cmpunktg29.app.n8n.cloud/webhook/template-last-24-hours',
    template_3am_horror: 'https://cmpunktg29.app.n8n.cloud/webhook/template-3am-horror'
  }
};

export async function getN8nConfig() {
  const now = Date.now();
  if (cachedConfig && (now - lastFetchTime < CACHE_TTL_MS)) {
    return cachedConfig;
  }

  try {
    const db = await getDb();
    if (db) {
      const doc = await db.collection('system_config').findOne({ _id: 'n8n_configuration' });
      if (doc && doc.activeInstance) {
        cachedConfig = {
          activeInstance: doc.activeInstance,
          apiKey: doc.apiKey || DEFAULT_CONFIG.apiKey,
          workflowId: doc.workflowId || DEFAULT_CONFIG.workflowId,
          webhooks: {
            ...DEFAULT_CONFIG.webhooks,
            ...(doc.webhooks || {})
          }
        };
        lastFetchTime = now;
        return cachedConfig;
      }
    }
  } catch (err) {
    console.warn('[n8n-config] Failed to fetch config from MongoDB, falling back to defaults:', err.message);
  }

  cachedConfig = DEFAULT_CONFIG;
  lastFetchTime = now;
  return cachedConfig;
}
