// Netlify Helper: n8n-checker.js
// BangAI - Direct n8n Execution Status Checking & Health Engine
// Dynamically authenticates to the active n8n instance and queries execution state

import https from 'https';
import { getDb } from './db.js';

let cachedCookie = null;
let cookieExpiry = 0;
let cachedHost = null;

/**
 * Retrieves a valid session cookie for the active n8n instance using credentials stored in MongoDB Atlas.
 */
async function getN8nSession() {
  const now = Date.now();
  if (cachedCookie && now < cookieExpiry && cachedHost) {
    return { cookie: cachedCookie, host: cachedHost };
  }

  try {
    const db = await getDb();
    if (!db) return { cookie: '', host: '' };

    const cfg = await db.collection('system_config').findOne({ _id: 'n8n_configuration' });
    const instanceUrl = cfg?.activeInstance || 'https://cmpunktg33.app.n8n.cloud';
    const host = instanceUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const email = cfg?.adminCredentials?.email || 'cmpunktg33@gmail.com';
    const password = cfg?.adminCredentials?.password || '@Suzainkhan6361';

    const loginBody = JSON.stringify({ emailOrLdapLoginId: email, password });

    const cookie = await new Promise((resolve) => {
      const req = https.request({
        hostname: host,
        port: 443,
        path: '/rest/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginBody)
        },
        timeout: 4000
      }, res => {
        const c = res.headers['set-cookie'];
        const parsed = c ? c.map(x => x.split(';')[0]).join('; ') : '';
        resolve(parsed);
      });

      req.on('error', (e) => {
        console.warn('[n8n-checker] Login connection error:', e.message);
        resolve('');
      });
      req.on('timeout', () => {
        req.destroy();
        resolve('');
      });
      req.write(loginBody);
      req.end();
    });

    if (cookie) {
      cachedCookie = cookie;
      cachedHost = host;
      cookieExpiry = now + 25 * 60 * 1000; // Cache cookie for 25 minutes
    }

    return { cookie: cachedCookie || '', host: cachedHost || host };
  } catch (err) {
    console.warn('[n8n-checker] Session error:', err.message);
    return { cookie: '', host: '' };
  }
}

/**
 * Queries the direct execution state for a specific execution ID.
 * Returns { status: 'running'|'error'|'crashed'|'canceled'|'success', stoppedAt, workflowId, error } or null.
 */
export async function getDirectExecutionStatus(executionId) {
  if (!executionId) return null;
  const { cookie, host } = await getN8nSession();
  if (!cookie || !host) return null;

  return new Promise((resolve) => {
    const req = https.request({
      hostname: host,
      port: 443,
      path: `/rest/executions/${executionId}`,
      method: 'GET',
      headers: { 'Cookie': cookie },
      timeout: 4000
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          const data = json.data || json;
          const resultData = data?.data?.resultData || data?.resultData;
          resolve({
            id: data.id || executionId,
            status: data.status,
            finished: data.finished,
            stoppedAt: data.stoppedAt,
            workflowId: data.workflowId,
            error: resultData?.error || null,
            lastNodeExecuted: resultData?.lastNodeExecuted || null
          });
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.warn(`[n8n-checker] Error checking execution ${executionId}:`, e.message);
      resolve(null);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

/**
 * Queries the latest executions for a specific workflow ID.
 * Useful to detect if a recently dispatched workflow execution has failed when executionId is not yet saved.
 */
export async function getLatestWorkflowExecutions(workflowId, limit = 3) {
  if (!workflowId) return [];
  const { cookie, host } = await getN8nSession();
  if (!cookie || !host) return [];

  return new Promise((resolve) => {
    const req = https.request({
      hostname: host,
      port: 443,
      path: `/rest/executions?workflowId=${encodeURIComponent(workflowId)}&limit=${limit}`,
      method: 'GET',
      headers: { 'Cookie': cookie },
      timeout: 4000
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          const results = json?.data?.results || json?.results || [];
          resolve(results.map(r => ({
            id: r.id,
            status: r.status,
            startedAt: r.startedAt,
            stoppedAt: r.stoppedAt,
            workflowId: r.workflowId
          })));
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', (e) => {
      console.warn(`[n8n-checker] Error listing executions for workflow ${workflowId}:`, e.message);
      resolve([]);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
    req.end();
  });
}
