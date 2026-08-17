// Netlify Function: upload-youtube
// Path: /.netlify/functions/upload-youtube
// Triggers n8n Cloud Manual YouTube Upload Webhook & Authenticated OAuth Pipeline

import { getDb } from './db.js';

const N8N_YOUTUBE_WEBHOOK_URL = process.env.N8N_YOUTUBE_WEBHOOK_URL || 'https://cmpunktg22.app.n8n.cloud/webhook/viral-shorts-ai-youtube-upload';

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const { threadId, title, description, tags, videoUrl, sessionId } = payload;

    if (!videoUrl) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'videoUrl is required for YouTube upload' })
      };
    }

    console.log('[Netlify] Dispatching Manual YouTube Upload to n8n Cloud for thread:', threadId);

    const now = new Date();
    const host = event.headers?.host || 'viral-shorts-ai-studio.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    let db = null;
    try {
      db = await getDb();
    } catch (e) {}

    // 1. Dispatch request to n8n Cloud YouTube Upload Webhook
    let n8nRes;
    try {
      n8nRes = await fetch(N8N_YOUTUBE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          title: title || 'Viral YouTube Short',
          description: description || '',
          tags: tags || [],
          threadId: threadId || '',
          sessionId: sessionId || '',
          callbackUrl,
          timestamp: now.toISOString()
        })
      });
    } catch (err) {
      console.error('[Netlify] Error calling n8n YouTube webhook:', err.message);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'N8N_UNREACHABLE',
          message: `Failed to connect to n8n Cloud YouTube upload pipeline: ${err.message}`
        })
      };
    }

    const n8nStatus = n8nRes.status;
    const n8nText = await n8nRes.text();
    console.log('[Netlify] n8n YouTube upload response status:', n8nStatus, 'body:', n8nText);

    if (db && threadId) {
      await db.collection('threads').updateOne(
        { threadId },
        {
          $set: {
            status: 'UPLOADING_YOUTUBE',
            updatedAt: now
          },
          $push: {
            messages: {
              threadId,
              role: 'assistant',
              content: '🚀 **1-Click YouTube Upload initiated on n8n Cloud.** Downloading 4K video and uploading to YouTube...',
              timestamp: now
            }
          }
        }
      );
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        status: 'UPLOADING',
        message: '1-Click YouTube upload initiated on n8n Cloud!'
      })
    };
  } catch (err) {
    console.error('YouTube Upload Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
