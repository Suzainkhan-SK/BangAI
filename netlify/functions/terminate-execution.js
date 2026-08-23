// Netlify Function: terminate-execution
// Path: /.netlify/functions/terminate-execution
// Instantly terminates n8n Cloud execution and cancels active website generation

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

  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const payload = JSON.parse(event.body || '{}');
    const { threadId, sessionId, approveUrl, reason = 'Creator clicked Stop / Terminate' } = payload;
    const now = new Date();
    const webhookSecret = process.env.SHORTSAI_WEBHOOK_SECRET || 's-vshorts-sec-9a8b7c6d5e4f3a2b1c0';

    console.log(`[Netlify Terminate] Terminating execution for thread: ${threadId}, reason: "${reason}"`);

    let db = null;
    let effectiveApproveUrl = approveUrl;

    try {
      db = await getDb();
      if (!effectiveApproveUrl && threadId && db) {
        const found = await db.collection('threads').findOne({ threadId });
        if (found) {
          effectiveApproveUrl = found.approveUrl || found.resumeUrl || found.story?.approveUrl || found.story?.resumeUrl || found.cancelUrl;
        }
      }
    } catch (e) {}

    // 1. If an active n8n resume webhook exists, send cancellation signal
    if (effectiveApproveUrl) {
      try {
        const sep = effectiveApproveUrl.includes('?') ? '&' : '?';
        const cancelTarget = effectiveApproveUrl.includes('approval=')
          ? effectiveApproveUrl.replace(/approval=[^&]+/, 'approval=no&action=CANCEL')
          : `${effectiveApproveUrl}${sep}approval=no&action=CANCEL`;

        console.log('[Netlify Terminate] Dispatching cancellation to n8n webhook:', cancelTarget);
        await fetch(cancelTarget, { 
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-webhook-secret': webhookSecret
          },
          body: JSON.stringify({ approval: 'no', action: 'CANCEL', threadId, sessionId, reason, webhookSecret })
        }).catch(async () => {
          // Fallback to GET
          return fetch(cancelTarget, { 
            method: 'GET',
            headers: { 'x-webhook-secret': webhookSecret }
          });
        });
      } catch (webhookErr) {
        console.warn('[Netlify Terminate] Webhook cancel warning (non-fatal):', webhookErr.message);
      }
    }

    // 2. Update thread status in MongoDB to CANCELLED
    if (db && threadId) {
      try {
        await db.collection('threads').updateOne(
          { threadId },
          {
            $set: {
              status: 'CANCELLED',
              'story.approveUrl': null,
              errorMessage: reason,
              updatedAt: now
            },
            $push: {
              messages: {
                role: 'assistant',
                content: `⏹️ **Generation Cancelled:** ${reason}`,
                timestamp: now
              }
            }
          },
          { upsert: true }
        );
      } catch (dbErr) {
        console.warn('[Netlify Terminate] DB update warning:', dbErr.message);
      }
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        success: true,
        status: 'CANCELLED',
        message: 'Generation terminated successfully.',
        threadId
      })
    };
  } catch (err) {
    console.error('[Netlify Terminate Error]:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Internal Server Error' })
    };
  }
};
