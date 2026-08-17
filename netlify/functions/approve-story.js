// Netlify Function: approve-story
// Path: /.netlify/functions/approve-story
// n8n Webhook resume trigger with Claude Refined Story forwarding & fallback dispatch

import { getDb } from './db.js';

const N8N_MAIN_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://cmpunktg22.app.n8n.cloud/webhook/viral-shorts-ai';

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
    const { approveUrl, threadId, sessionId, action = 'APPROVE', story, refinedStory } = payload;
    const storyToPass = refinedStory || story || null;

    console.log(`[Netlify] Relaying creator ${action} to n8n Cloud:`, approveUrl, 'Story:', storyToPass?.suggestedTitle);

    let n8nStatus = 200;

    // 1. If an active n8n execution is paused at the Wait node:
    if (approveUrl) {
      const sep = approveUrl.includes('?') ? '&' : '?';
      let targetUrl = approveUrl.includes('approval=') 
        ? approveUrl 
        : `${approveUrl}${sep}approval=${action === 'CANCEL' ? 'no' : 'yes'}`;

      if (storyToPass && action === 'APPROVE') {
        if (storyToPass.storyBrief) targetUrl += `&storyBrief=${encodeURIComponent(storyToPass.storyBrief)}`;
        if (storyToPass.suggestedTitle || storyToPass.title) targetUrl += `&suggestedTitle=${encodeURIComponent(storyToPass.suggestedTitle || storyToPass.title)}`;
        if (storyToPass.viralHook) targetUrl += `&viralHook=${encodeURIComponent(storyToPass.viralHook)}`;
        if (storyToPass.genre) targetUrl += `&genre=${encodeURIComponent(storyToPass.genre)}`;
      }

      try {
        // Try GET first (standard n8n wait webhook format)
        const res = await fetch(targetUrl);
        n8nStatus = res.status;
        console.log('[Netlify] n8n Cloud resume response status (GET):', n8nStatus);
      } catch (err) {
        console.warn('[Netlify] n8n resume fetch notice:', err.message);
      }
    } else if (action === 'APPROVE' && storyToPass) {
      // 2. If no active wait webhook existed (direct /refine generation), dispatch to main webhook:
      try {
        const host = event.headers?.host || 'viral-shorts-ai-studio.netlify.app';
        const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

        const res = await fetch(N8N_MAIN_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: storyToPass.storyBrief || storyToPass.suggestedTitle || 'Viral Video',
            refinedStory: storyToPass,
            isRefined: true,
            callbackUrl,
            threadId: threadId || `thread-${Date.now()}`,
            sessionId: sessionId || 'default-session',
            timestamp: new Date().toISOString()
          })
        });
        n8nStatus = res.status;
        console.log('[Netlify] Direct Refined Story dispatched to main n8n webhook, status:', n8nStatus);
      } catch (dispatchErr) {
        console.warn('[Netlify] Direct refined story dispatch notice:', dispatchErr.message);
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
        await db.collection('threads').updateOne(
          { threadId },
          { 
            $set: { 
              status: 'GENERATING_SCENES', 
              story: storyToPass || undefined,
              updatedAt: new Date() 
            } 
          }
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
