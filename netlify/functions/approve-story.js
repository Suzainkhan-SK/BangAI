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
    const { 
      approveUrl, 
      threadId, 
      sessionId, 
      action = 'APPROVE', 
      story, 
      refinedStory,
      language = 'English',
      voiceId = 'adam',
      visualStyle = 'Cinematic Realistic',
      autoUploadToYouTube = false
    } = payload;
    
    const storyToPass = refinedStory || story || null;
    const effectiveLanguage = storyToPass?.language || language || 'English';

    console.log(`[Netlify] Relaying creator ${action} to n8n Cloud:`, approveUrl, 'Story:', storyToPass?.suggestedTitle, 'Lang:', effectiveLanguage);

    const now = new Date();
    const host = event.headers?.host || 'viral-shorts-ai-studio.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    let db = null;
    try {
      db = await getDb();
    } catch (e) {}

    // ─── 1. HANDLE CANCEL ACTION ──────────────────────────────────────
    if (action === 'CANCEL') {
      if (approveUrl) {
        const sep = approveUrl.includes('?') ? '&' : '?';
        const cancelTarget = approveUrl.includes('approval=') 
          ? approveUrl.replace('approval=yes', 'approval=no')
          : `${approveUrl}${sep}approval=no`;
        try {
          await fetch(cancelTarget);
        } catch (e) {}
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
        body: JSON.stringify({ success: true, action: 'CANCEL', threadId })
      };
    }

    // ─── 2. HANDLE APPROVE ACTION ────────────────────────────────────
    let executionResumed = false;

    // A) Try waking an active n8n Wait node if approveUrl exists
    if (approveUrl) {
      const sep = approveUrl.includes('?') ? '&' : '?';
      let targetUrl = approveUrl.includes('approval=') 
        ? approveUrl 
        : `${approveUrl}${sep}approval=yes`;

      if (storyToPass) {
        if (storyToPass.storyBrief) targetUrl += `&storyBrief=${encodeURIComponent(storyToPass.storyBrief)}`;
        if (storyToPass.suggestedTitle || storyToPass.title) targetUrl += `&suggestedTitle=${encodeURIComponent(storyToPass.suggestedTitle || storyToPass.title)}`;
        if (storyToPass.viralHook) targetUrl += `&viralHook=${encodeURIComponent(storyToPass.viralHook)}`;
        if (storyToPass.genre) targetUrl += `&genre=${encodeURIComponent(storyToPass.genre)}`;
        targetUrl += `&language=${encodeURIComponent(effectiveLanguage)}`;
      }

      try {
        const res = await fetch(targetUrl);
        if (res.ok) {
          executionResumed = true;
          console.log('[Netlify] Successfully resumed waiting n8n execution via webhook!');
        } else {
          console.log(`[Netlify] Resume webhook returned HTTP ${res.status}. Falling back to fresh execution dispatch...`);
        }
      } catch (err) {
        console.warn('[Netlify] Resume webhook fetch error:', err.message);
      }
    }

    // B) If execution was not resumed (e.g. was cancelled, refined, or expired), launch fresh execution!
    if (!executionResumed) {
      console.log('[Netlify] Dispatching fresh n8n pipeline for approved story...');
      try {
        const freshRes = await fetch(N8N_MAIN_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: storyToPass?.storyBrief || storyToPass?.suggestedTitle || 'Viral Short',
            refinedStory: storyToPass,
            isRefined: true,
            language: effectiveLanguage,
            voiceId: storyToPass?.voiceId || voiceId,
            visualStyle: storyToPass?.visualStyle || visualStyle,
            autoUploadToYouTube: !!autoUploadToYouTube,
            callbackUrl,
            threadId: threadId || `thread-${Date.now()}`,
            sessionId: sessionId || 'default-session',
            timestamp: now.toISOString()
          })
        });

        if (!freshRes.ok) {
          const errText = await freshRes.text();
          console.error('[Netlify] n8n fresh dispatch rejected:', freshRes.status, errText);
          return {
            statusCode: 502,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'WORKFLOW_INACTIVE',
              message: `n8n Cloud rejected request (HTTP ${freshRes.status}). Ensure workflow u8vcVLc00wPp2AAI is active.`
            })
          };
        }
        executionResumed = true;
      } catch (dispatchErr) {
        console.error('[Netlify] n8n dispatch error:', dispatchErr.message);
        return {
          statusCode: 502,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: 'N8N_UNREACHABLE',
            message: `Could not connect to n8n Cloud: ${dispatchErr.message}`
          })
        };
      }
    }

    // Update MongoDB
    if (db && threadId) {
      await db.collection('threads').updateOne(
        { threadId },
        { 
          $set: { 
            status: 'GENERATING_SCENES', 
            story: storyToPass || undefined,
            updatedAt: now 
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
        action: 'APPROVE',
        executionStarted: true,
        status: 'GENERATING_SCENES',
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
