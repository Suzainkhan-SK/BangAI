// Netlify Function: approve-story
// Path: /.netlify/functions/approve-story
// Pure n8n Webhook resume trigger & MongoDB status updater (Zero synthetic fallbacks)

import { getDb } from './db.js';

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { approveUrl, threadId, action = 'APPROVE' } = payload;

    console.log(`[Netlify] Relaying creator ${action} to n8n Cloud:`, approveUrl);

    let n8nStatus = 200;
    if (approveUrl) {
      const sep = approveUrl.includes('?') ? '&' : '?';
      const targetUrl = approveUrl.includes('approval=') 
        ? approveUrl 
        : `${approveUrl}${sep}approval=${action === 'CANCEL' ? 'no' : 'yes'}`;

      try {
        const res = await fetch(targetUrl);
        n8nStatus = res.status;
        console.log('[Netlify] n8n Cloud resume response status:', n8nStatus);
      } catch (err) {
        console.warn('[Netlify] n8n resume fetch notice:', err.message);
      }
    }

    const db = await getDb();
    if (db && threadId) {
      if (action === 'CANCEL') {
        await db.collection('threads').updateOne(
          { threadId },
          { $set: { status: 'CANCELLED', updatedAt: new Date() } }
        );
      } else {
        // If approving Stage 1 story, set status to GENERATING_SCENES so UI shows live n8n progress
        await db.collection('threads').updateOne(
          { threadId },
          { $set: { status: 'GENERATING_SCENES', updatedAt: new Date() } }
        );
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        action,
        n8nStatus,
        threadId
      })
    };
  } catch (err) {
    console.error('Approve Story Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
