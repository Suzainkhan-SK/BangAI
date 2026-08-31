// Netlify Function: refresh-upload-token.js
// POST /.netlify/functions/refresh-upload-token
// Invoked by n8n workflow immediately before YouTube upload or Google Sheets append
// Authenticated via x-webhook-secret

import { getDb } from './db.js';
import { getFreshGoogleToken } from './google-oauth.js';

const WEBHOOK_SECRET = process.env.SHORTSAI_WEBHOOK_SECRET || 's-vshorts-sec-9a8b7c6d5e4f3a2b1c0';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-webhook-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // 1. Verify webhook secret
  const incomingSecret = event.headers['x-webhook-secret'] || event.headers['X-Webhook-Secret'] || '';
  if (!incomingSecret || incomingSecret !== WEBHOOK_SECRET) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: Invalid or missing webhook secret' })
    };
  }

  try {
    const { threadId, channelId, scope = 'youtube' } = JSON.parse(event.body || '{}');

    if (!threadId) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ accessToken: null, message: 'Missing threadId' })
      };
    }

    const db = await getDb();
    if (!db) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ accessToken: null, message: 'Database unavailable' })
      };
    }

    // 2. Resolve owning user from thread
    const thread = await db.collection('threads').findOne({ threadId });
    if (!thread) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ accessToken: null, message: 'Thread not found' })
      };
    }

    const userQuery = [];
    if (thread.userId) userQuery.push({ _id: thread.userId }, { id: thread.userId }, { userId: thread.userId });
    if (thread.email) userQuery.push({ email: thread.email });
    if (thread.userEmail) userQuery.push({ email: thread.userEmail });

    const user = userQuery.length > 0
      ? await db.collection('users').findOne({ $or: userQuery })
      : null;

    if (!user) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ accessToken: null, message: 'User not found for thread' })
      };
    }

    // 3. Resolve tokens by scope
    let container = null;
    let collectionField = 'youtubeChannels';

    if (scope === 'youtube') {
      const channels = user.youtubeChannels || [];
      if (channelId) {
        container = channels.find(c => c.channelId === channelId || c.id === channelId);
      }
      if (!container && !channelId && channels.length > 0) {
        container = channels[0];
      }
      collectionField = 'youtubeChannels';
    } else if (scope === 'sheets') {
      const sheetsList = user.sheets || user.googleSheets || [];
      if (channelId) { // channelId can carry spreadsheetId or sheetId
        container = sheetsList.find(s => s.sheetId === channelId || s.spreadsheetId === channelId || s.id === channelId);
      }
      if (!container && !channelId && sheetsList.length > 0) {
        container = sheetsList[0];
      }
      collectionField = 'sheets';
    }

    if (!container || !container.tokens) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ accessToken: null, message: 'No token container found for scope' })
      };
    }

    const freshAccessToken = await getFreshGoogleToken(container, collectionField);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        accessToken: freshAccessToken || null,
        expiresAt: container.tokens?.expiresAt || null
      })
    };

  } catch (err) {
    console.error('[refresh-upload-token] Error:', err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ accessToken: null, error: err.message })
    };
  }
};
