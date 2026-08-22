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

  try {
    const payload = JSON.parse(event.body || '{}');
    const { threadId, sessionId, approveUrl, reason = 'User clicked Stop / Terminate' } = payload;
    const now = new Date();

    console.log(`[Netlify Terminate] Terminating execution for thread: ${threadId}, reason: "${reason}"`);

    // 1. If an active n8n resume webhook exists, send cancellation signal
    if (approveUrl) {
      try {
        const sep = approveUrl.includes('?') ? '&' : '?';
        const cancelTarget = approveUrl.includes('approval=')
          ? approveUrl.replace(/approval=[^&]+/, 'approval=no&action=CANCEL')
          : `${approveUrl}${sep}approval=no&action=CANCEL`;

        console.log('[Netlify Terminate] Dispatching cancellation to n8n webhook:', cancelTarget);
        await fetch(cancelTarget, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approval: 'no', action: 'CANCEL', reason })
        }).catch(async () => {
          // Fallback to GET
          return fetch(cancelTarget, { method: 'GET' });
        });
      } catch (webhookErr) {
        console.warn('[Netlify Terminate] Webhook cancel warning (non-fatal):', webhookErr.message);
      }
    }

    // 2. Update thread status in MongoDB to CANCELLED
    let db = null;
    try {
      db = await getDb();
      if (db && threadId) {
        await db.collection('threads').updateOne(
          { threadId },
          {
            $set: {
              status: 'CANCELLED',
              errorMessage: reason,
              updatedAt: now
            },
            $push: {
              messages: {
                role: 'assistant',
                content: `⏹️ **Execution Terminated:** ${reason}.`,
                timestamp: now
              }
            }
          }
        );
      }
    } catch (dbErr) {
      console.warn('[Netlify Terminate] DB update warning:', dbErr.message);
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
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
