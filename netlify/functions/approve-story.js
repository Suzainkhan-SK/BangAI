// Netlify Function: approve-story
// Path: /.netlify/functions/approve-story
// Handles 2-Stage Approvals, Story & Scene Refinements, and Cancellations while preserving cryptographic tokens

import { getDb } from './db.js';

function buildResumeUrl(rawUrl, action, refinePrompt = '') {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    if (action === 'CANCEL') {
      u.searchParams.set('approval', 'no');
      u.searchParams.set('action', 'CANCEL');
    } else if (action === 'REFINE_STORY' || action === 'REFINE') {
      u.searchParams.set('approval', 'refine');
      u.searchParams.set('action', 'REFINE_STORY');
      if (refinePrompt) u.searchParams.set('refinePrompt', refinePrompt);
    } else if (action === 'REFINE_SCENES') {
      u.searchParams.set('approval', 'refine');
      u.searchParams.set('action', 'REFINE_SCENES');
      if (refinePrompt) u.searchParams.set('refinePrompt', refinePrompt);
    } else if (action === 'APPROVE_SCENES' || action === 'RENDER_VIDEO') {
      u.searchParams.set('approval', 'yes');
      u.searchParams.set('action', 'APPROVE_SCENES');
    } else {
      u.searchParams.set('approval', 'yes');
      u.searchParams.set('action', 'APPROVE');
    }
    return u.toString();
  } catch (err) {
    const sep = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${sep}approval=${action === 'CANCEL' ? 'no' : (action.includes('REFINE') ? 'refine' : 'yes')}&action=${action}&refinePrompt=${encodeURIComponent(refinePrompt)}`;
  }
}

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
      refinePrompt = '',
      story = null,
      scenes = null,
      language = 'English',
      voiceId = 'adam',
      visualStyle = 'Cinematic Realistic'
    } = payload;

    const now = new Date();
    console.log(`[Netlify approve-story] Action: "${action}" | approveUrl: "${approveUrl}" | Thread: "${threadId}"`);

    let db = null;
    try {
      db = await getDb();
    } catch (e) {}

    let effectiveApproveUrl = approveUrl;

    // Fallback: If approveUrl is missing from payload, query MongoDB thread
    if (!effectiveApproveUrl && threadId && db) {
      try {
        const found = await db.collection('threads').findOne({ threadId });
        if (found) {
          effectiveApproveUrl = found.approveUrl || found.resumeUrl || found.story?.approveUrl || found.story?.resumeUrl;
          console.log('[approve-story] Resolved approveUrl from DB:', effectiveApproveUrl);
        }
      } catch (dbFindErr) {
        console.warn('[approve-story] DB find fallback notice:', dbFindErr.message);
      }
    }

    const targetResumeUrl = buildResumeUrl(effectiveApproveUrl, action, refinePrompt);
    console.log(`[approve-story] Built n8n target URL for action "${action}":`, targetResumeUrl);

    // ─── 1. HANDLE CANCEL / REJECT ACTION ─────────────────────────────
    if (action === 'CANCEL') {
      if (targetResumeUrl) {
        try {
          const res = await fetch(targetResumeUrl, { method: 'GET' });
          console.log(`[Netlify] n8n cancellation response HTTP ${res.status}`);
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
            },
            $push: {
              messages: {
                role: 'assistant',
                content: '⏹️ Generation cancelled by creator.',
                timestamp: now
              }
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

    // ─── 2. HANDLE STAGE 1 REFINEMENT: REFINE STORY BRIEF ─────────────
    if (action === 'REFINE_STORY' || action === 'REFINE') {
      console.log(`[Netlify] Refinement requested for Story Brief: "${refinePrompt}"`);

      if (db && threadId) {
        await db.collection('threads').updateOne(
          { threadId },
          {
            $set: {
              status: 'GENERATING',
              generationStage: 'AI Agent is refining story with full memory...',
              updatedAt: now
            },
            $push: {
              messages: {
                role: 'user',
                content: `✍️ **Refine Story Brief:** ${refinePrompt}`,
                timestamp: now
              }
            }
          }
        );
      }

      let n8nResumed = false;
      if (targetResumeUrl) {
        try {
          const res = await fetch(targetResumeUrl, { method: 'GET' });
          console.log(`[Netlify] n8n Wait node resume response HTTP ${res.status}`);
          n8nResumed = res.ok;
        } catch (err) {
          console.warn('[Netlify] Refine dispatch warning:', err.message);
        }
      }

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          action: 'REFINE_STORY',
          status: 'GENERATING',
          n8nResumed,
          message: 'Refinement dispatched to n8n AI Agent',
          threadId
        })
      };
    }

    // ─── 3. HANDLE STAGE 2 REFINEMENT: REFINE 5 SCENES SCREENPLAY ─────
    if (action === 'REFINE_SCENES') {
      console.log(`[Netlify] Refinement requested for 5 Scenes: "${refinePrompt}"`);

      if (db && threadId) {
        await db.collection('threads').updateOne(
          { threadId },
          {
            $set: {
              status: 'GENERATING',
              generationStage: 'AI Agent is refining 5-scene master screenplay...',
              updatedAt: now
            },
            $push: {
              messages: {
                role: 'user',
                content: `🎬 **Refine Scenes:** ${refinePrompt}`,
                timestamp: now
              }
            }
          }
        );
      }

      let n8nResumed = false;
      if (targetResumeUrl) {
        try {
          const res = await fetch(targetResumeUrl, { method: 'GET' });
          console.log(`[Netlify] n8n Scenes Wait node resume response HTTP ${res.status}`);
          n8nResumed = res.ok;
        } catch (err) {
          console.warn('[Netlify] Scene refine dispatch warning:', err.message);
        }
      }

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          action: 'REFINE_SCENES',
          status: 'GENERATING',
          n8nResumed,
          message: 'Scene refinement dispatched to n8n AI Agent',
          threadId
        })
      };
    }

    // ─── 4. HANDLE STAGE 2 APPROVAL: APPROVE SCENES & RENDER VIDEO ────
    if (action === 'APPROVE_SCENES' || action === 'RENDER_VIDEO') {
      if (db && threadId) {
        await db.collection('threads').updateOne(
          { threadId },
          { 
            $set: { 
              status: 'RENDERING_VIDEO', 
              'story.approveUrl': null,
              updatedAt: now 
            },
            $push: {
              messages: {
                role: 'assistant',
                content: '🎬 5 scenes approved! Autonomous 4K video rendering pipeline dispatched on n8n Cloud...',
                timestamp: now
              }
            }
          }
        );
      }

      if (targetResumeUrl) {
        try {
          const res = await fetch(targetResumeUrl, { method: 'GET' });
          console.log(`[Netlify] n8n Stage 2 resume response HTTP ${res.status}`);
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

    // ─── 5. HANDLE STAGE 1 APPROVAL: APPROVE STORY -> GENERATE 5 SCENES ─
    if (db && threadId) {
      try {
        await db.collection('threads').updateOne(
          { threadId },
          { 
            $set: { 
              status: 'GENERATING_SCENES', 
              'story.approveUrl': null,
              updatedAt: now 
            },
            $push: {
              messages: {
                role: 'assistant',
                content: '✨ Story brief approved! Generating 5-scene master screenplay...',
                timestamp: now
              }
            }
          }
        );
      } catch (dbPreErr) {
        console.warn('[Netlify] DB status update notice:', dbPreErr.message);
      }
    }

    let resumedN8n = false;
    if (targetResumeUrl) {
      try {
        const n8nResumeRes = await fetch(targetResumeUrl, { method: 'GET' });
        console.log(`[Netlify] n8n Wait node resume response HTTP ${n8nResumeRes?.status || 200}`);
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
