// Netlify Function: approve-story
// Path: /.netlify/functions/approve-story
// Pure n8n Webhook Resume & Cancellation Relaying (Zero Claude Scene Override)

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
    const { 
      approveUrl, 
      threadId, 
      action = 'APPROVE'
    } = payload;

    const now = new Date();
    console.log(`[Netlify] Relaying action "${action}" to n8n Cloud resume webhook:`, approveUrl, 'Thread:', threadId);

    let db = null;
    try {
      db = await getDb();
    } catch (e) {}

    // ─── 1. HANDLE CANCEL / REJECT ACTION ─────────────────────────────
    if (action === 'CANCEL') {
      if (approveUrl) {
        const sep = approveUrl.includes('?') ? '&' : '?';
        const cancelTarget = approveUrl.includes('approval=') 
          ? approveUrl.replace('approval=yes', 'approval=no')
          : `${approveUrl}${sep}approval=no`;

        console.log('[Netlify] Sending cancellation to n8n webhook:', cancelTarget);
        try {
          await fetch(cancelTarget, { method: 'GET' });
        } catch (e) {
          console.warn('[Netlify] n8n cancellation fetch warning:', e.message);
        }
      }

      if (db && threadId) {
        await db.collection('threads').updateOne(
          { threadId },
          { 
            $set: { 
              status: 'CANCELLED', 
              'story.approveUrl': null,
              updatedAt: now 
            } 
          }
        );
      }

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, action: 'CANCEL', status: 'CANCELLED', threadId })
      };
    }

    // ─── 2. HANDLE STAGE 2: APPROVE SCENES & RENDER VIDEO ─────────────
    if (action === 'APPROVE_SCENES' || action === 'RENDER_VIDEO') {
      if (db && threadId) {
        await db.collection('threads').updateOne(
          { threadId },
          { 
            $set: { 
              status: 'RENDERING_VIDEO', 
              'story.approveUrl': null,
              updatedAt: now 
            } 
          }
        );
      }

      if (approveUrl) {
        const sep = approveUrl.includes('?') ? '&' : '?';
        const targetUrl = approveUrl.includes('approval=') ? approveUrl : `${approveUrl}${sep}approval=yes`;
        console.log('[Netlify] Resuming n8n Stage 2 Scenes Wait node:', targetUrl);
        try {
          await fetch(targetUrl, { method: 'GET' });
        } catch (e) {
          console.warn('[Netlify] n8n Stage 2 resume fetch warning:', e.message);
        }
      }

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          action: 'APPROVE_SCENES',
          status: 'RENDERING_VIDEO',
          threadId
        })
      };
    }

    // ─── 3. HANDLE STAGE 1: APPROVE STORY -> GENERATE 5 SCENES IN N8N ─
    // Update MongoDB status to GENERATING_SCENES
    if (db && threadId) {
      try {
        await db.collection('threads').updateOne(
          { threadId },
          { 
            $set: { 
              status: 'GENERATING_SCENES', 
              'story.approveUrl': null,
              updatedAt: now 
            } 
          }
        );
      } catch (dbPreErr) {
        console.warn('[Netlify] DB status update notice:', dbPreErr.message);
      }
    }

    // Resume n8n Wait for Approval node
    let resumedN8n = false;
    if (approveUrl) {
      const sep = approveUrl.includes('?') ? '&' : '?';
      const targetUrl = approveUrl.includes('approval=') ? approveUrl : `${approveUrl}${sep}approval=yes`;
      console.log('[Netlify] Resuming n8n Stage 1 Story Wait node:', targetUrl);
      try {
        const n8nResumeRes = await fetch(targetUrl, { method: 'GET' });
        console.log(`[Netlify] n8n Wait node resume response HTTP ${n8nResumeRes.status}`);
        resumedN8n = n8nResumeRes.ok;
      } catch (resumeErr) {
        console.error('[Netlify] Error resuming n8n Wait node:', resumeErr.message);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        action: 'APPROVE',
        status: 'GENERATING_SCENES',
        n8nResumed: resumedN8n,
        threadId
      })
    };

  } catch (err) {
    console.error('Approve Story Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
