// Netlify Function: approve-story
// Path: /.netlify/functions/approve-story
// Handles 2-Stage Approvals, Story & Scene Refinements, and Cancellations while preserving cryptographic tokens

import { getDb } from './db.js';

function buildResumeUrl(rawUrl, action, extraParams = {}) {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    if (action === 'CANCEL') {
      u.searchParams.set('approval', 'no');
      u.searchParams.set('action', 'CANCEL');
    } else if (action === 'REFINE_STORY' || action === 'REFINE') {
      u.searchParams.set('approval', 'refine');
      u.searchParams.set('action', 'REFINE_STORY');
      if (extraParams.refinePrompt) u.searchParams.set('refinePrompt', extraParams.refinePrompt);
      if (extraParams.refineMode) u.searchParams.set('refineMode', extraParams.refineMode);
      if (extraParams.refineScenes && extraParams.refineScenes.length) {
        u.searchParams.set('refineScenes', JSON.stringify(extraParams.refineScenes));
      }
      if (extraParams.refineRound) u.searchParams.set('refineRound', String(extraParams.refineRound));
    } else if (action === 'REFINE_SCENES') {
      u.searchParams.set('approval', 'refine');
      u.searchParams.set('action', 'REFINE_SCENES');
      if (extraParams.refinePrompt) u.searchParams.set('refinePrompt', extraParams.refinePrompt);
      if (extraParams.refineMode) u.searchParams.set('refineMode', extraParams.refineMode);
      if (extraParams.refineScenes && extraParams.refineScenes.length) {
        u.searchParams.set('refineScenes', JSON.stringify(extraParams.refineScenes));
      }
      if (extraParams.refineRound) u.searchParams.set('refineRound', String(extraParams.refineRound));
    } else if (action === 'APPROVE_SCENES' || action === 'RENDER_VIDEO') {
      u.searchParams.set('approval', 'yes');
      u.searchParams.set('action', 'APPROVE_SCENES');
    } else {
      u.searchParams.set('approval', 'yes');
      u.searchParams.set('action', 'APPROVE');
    }

    if (extraParams.voiceId) u.searchParams.set('voiceId', extraParams.voiceId);
    if (extraParams.elevenLabsVoiceId) u.searchParams.set('elevenLabsVoiceId', extraParams.elevenLabsVoiceId);
    if (extraParams.voiceSpeed) u.searchParams.set('voiceSpeed', String(extraParams.voiceSpeed));
    if (extraParams.musicId) u.searchParams.set('musicId', extraParams.musicId);
    if (extraParams.musicTrackUrl) u.searchParams.set('musicTrackUrl', extraParams.musicTrackUrl);
    if (extraParams.musicVolume !== undefined) u.searchParams.set('musicVolume', String(extraParams.musicVolume));
    if (extraParams.subtitleSettings) {
      u.searchParams.set('subtitleSettings', typeof extraParams.subtitleSettings === 'string' ? extraParams.subtitleSettings : JSON.stringify(extraParams.subtitleSettings));
    }

    return u.toString();
  } catch (err) {
    const sep = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${sep}approval=${action === 'CANCEL' ? 'no' : (action.includes('REFINE') ? 'refine' : 'yes')}&action=${action}&refinePrompt=${encodeURIComponent(extraParams.refinePrompt || '')}&voiceId=${encodeURIComponent(extraParams.voiceId || '')}&voiceSpeed=${encodeURIComponent(extraParams.voiceSpeed || '1.0')}`;
  }
}

async function dispatchToN8n(targetUrl, payload, webhookSecret) {
  let resumed = false;
  let lastStatus = 0;
  let lastError = null;

  if (!targetUrl) {
    return { ok: false, status: 400, error: 'No target resume URL available' };
  }

  // 1. Try POST with JSON body and secret header
  try {
    const postRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret
      },
      body: JSON.stringify(payload)
    });
    lastStatus = postRes.status;
    if (postRes.ok) {
      console.log(`[Netlify] n8n POST resume succeeded with HTTP ${postRes.status}`);
      return { ok: true, status: postRes.status };
    }
    console.warn(`[Netlify] n8n POST resume returned HTTP ${postRes.status}, attempting GET fallback...`);
  } catch (postErr) {
    lastError = postErr.message;
    console.warn('[Netlify] n8n POST resume network error:', postErr.message);
  }

  // 2. Fallback to GET with URL parameters
  try {
    const getRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-webhook-secret': webhookSecret
      }
    });
    lastStatus = getRes.status;
    if (getRes.ok) {
      console.log(`[Netlify] n8n GET resume fallback succeeded with HTTP ${getRes.status}`);
      return { ok: true, status: getRes.status };
    }
    console.warn(`[Netlify] n8n GET resume fallback returned HTTP ${getRes.status}`);
  } catch (getErr) {
    lastError = getErr.message;
    console.warn('[Netlify] n8n GET resume network error:', getErr.message);
  }

  return {
    ok: false,
    status: lastStatus || 502,
    error: lastError || `n8n webhook-waiting returned HTTP ${lastStatus}`
  };
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

  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const payload = JSON.parse(event.body || '{}');
    const { 
      approveUrl, 
      threadId, 
      sessionId,
      action = 'APPROVE',
      refinePrompt = '',
      refineMode = 'full',
      refineScenes = [],
      refineRound = 1,
      story = null,
      scenes = null,
      language = 'English',
      voiceId = 'adam',
      elevenLabsVoiceId = '',
      visualStyle = 'Cinematic Realistic',
      subtitleSettings = null,
      musicId = 'mystery',
      musicTrackUrl = '',
      musicVolume = 0.2
    } = payload;

    const now = new Date();
    const webhookSecret = process.env.SHORTSAI_WEBHOOK_SECRET || 's-vshorts-sec-9a8b7c6d5e4f3a2b1c0';
    console.log(`[Netlify approve-story] Action: "${action}" | Mode: "${refineMode}" | Round: ${refineRound} | Thread: "${threadId}"`);

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

    if (!effectiveApproveUrl) {
      console.warn(`[approve-story] No approveUrl found for thread "${threadId}". Cannot resume workflow.`);
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({
          success: false,
          n8nResumed: false,
          error: 'NO_RESUME_URL',
          message: 'No active n8n wait hook found for this thread. Please ensure the workflow execution is running and waiting for review.'
        })
      };
    }

    const targetResumeUrl = buildResumeUrl(effectiveApproveUrl, action, {
      refinePrompt,
      refineMode,
      refineScenes,
      refineRound,
      voiceId,
      elevenLabsVoiceId,
      subtitleSettings,
      musicId,
      musicTrackUrl,
      musicVolume
    });
    console.log(`[approve-story] Built n8n target URL for action "${action}":`, targetResumeUrl);

    // ─── 1. HANDLE CANCEL / REJECT ACTION ─────────────────────────────
    if (action === 'CANCEL') {
      const dispatchResult = await dispatchToN8n(
        targetResumeUrl,
        { approval: 'no', action: 'CANCEL', threadId, sessionId, webhookSecret },
        webhookSecret
      );

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
        headers: CORS,
        body: JSON.stringify({
          success: true,
          action: 'CANCEL',
          status: 'CANCELLED',
          n8nResumed: dispatchResult.ok,
          threadId
        })
      };
    }

    // ─── 2. HANDLE STAGE 1 REFINEMENT: REFINE STORY BRIEF ─────────────
    if (action === 'REFINE_STORY' || action === 'REFINE') {
      console.log(`[Netlify] Refinement requested for Story Brief: [${refineMode}] "${refinePrompt}"`);

      const dispatchPayload = {
        approval: 'refine',
        action: 'REFINE_STORY',
        refinePrompt,
        refineMode,
        refineScenes: Array.isArray(refineScenes) ? refineScenes : [],
        refineRound,
        threadId,
        sessionId,
        language,
        voiceId,
        visualStyle,
        webhookSecret
      };

      const dispatchResult = await dispatchToN8n(targetResumeUrl, dispatchPayload, webhookSecret);

      if (!dispatchResult.ok) {
        console.error('[Netlify] Stage 1 Refine dispatch failed:', dispatchResult.error);
        return {
          statusCode: 502,
          headers: CORS,
          body: JSON.stringify({
            success: false,
            n8nResumed: false,
            error: 'N8N_RESUME_FAILED',
            message: `Could not trigger Story Doctor in n8n Cloud (HTTP ${dispatchResult.status}). ${dispatchResult.error || 'The wait step may have timed out. Please retry.'}`,
            threadId
          })
        };
      }

      // ONLY update database when n8n was ACTUALLY triggered successfully
      if (db && threadId) {
        await db.collection('threads').updateOne(
          { threadId },
          {
            $set: {
              status: 'GENERATING',
              refineRound,
              refineMode,
              refined: false,
              'story.refined': false,
              refineTimestamp: null,
              'story.refineTimestamp': null,
              generationStage: `AI Agent Story Doctor is refining story brief (Round ${refineRound})...`,
              updatedAt: now
            },
            $push: {
              messages: {
                role: 'user',
                content: `✍️ **Refine Story Brief (${refineMode}):** ${refinePrompt}`,
                timestamp: now
              }
            }
          }
        );
      }

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          success: true,
          action: 'REFINE_STORY',
          refineMode,
          refineRound,
          status: 'GENERATING',
          n8nResumed: true,
          message: 'Refinement dispatched to n8n AI Agent',
          threadId
        })
      };
    }

    // ─── 3. HANDLE STAGE 2 REFINEMENT: REFINE 5 SCENES SCREENPLAY ─────
    if (action === 'REFINE_SCENES') {
      console.log(`[Netlify] Refinement requested for 5 Scenes: [${refineMode}] "${refinePrompt}"`);

      const dispatchPayload = {
        approval: 'refine',
        action: 'REFINE_SCENES',
        refinePrompt,
        refineMode,
        refineScenes: Array.isArray(refineScenes) ? refineScenes : [],
        refineRound,
        threadId,
        sessionId,
        language,
        voiceId,
        visualStyle,
        webhookSecret
      };

      const dispatchResult = await dispatchToN8n(targetResumeUrl, dispatchPayload, webhookSecret);

      if (!dispatchResult.ok) {
        console.error('[Netlify] Stage 2 Refine dispatch failed:', dispatchResult.error);
        return {
          statusCode: 502,
          headers: CORS,
          body: JSON.stringify({
            success: false,
            n8nResumed: false,
            error: 'N8N_RESUME_FAILED',
            message: `Could not trigger Screenplay Doctor in n8n Cloud (HTTP ${dispatchResult.status}). ${dispatchResult.error || 'The wait step may have timed out. Please retry.'}`,
            threadId
          })
        };
      }

      // ONLY update database when n8n was ACTUALLY triggered successfully
      if (db && threadId) {
        await db.collection('threads').updateOne(
          { threadId },
          {
            $set: {
              status: 'GENERATING',
              refineRound,
              refineMode,
              refined: false,
              'story.refined': false,
              refineTimestamp: null,
              'story.refineTimestamp': null,
              refineScenes: Array.isArray(refineScenes) ? refineScenes : [],
              generationStage: `AI Agent Screenplay Doctor is refining 5 scenes (Round ${refineRound})...`,
              updatedAt: now
            },
            $push: {
              messages: {
                role: 'user',
                content: `🎬 **Refine Scenes (${refineMode}):** ${refinePrompt}`,
                timestamp: now
              }
            }
          }
        );
      }

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          success: true,
          action: 'REFINE_SCENES',
          refineMode,
          refineScenes,
          refineRound,
          status: 'GENERATING',
          n8nResumed: true,
          message: 'Scene refinement dispatched to n8n AI Agent',
          threadId
        })
      };
    }

    // ─── 4. HANDLE STAGE 2 APPROVAL: APPROVE SCENES & RENDER VIDEO ────
    if (action === 'APPROVE_SCENES' || action === 'RENDER_VIDEO') {
      const dispatchPayload = {
        approval: 'yes',
        action: 'APPROVE_SCENES',
        threadId,
        sessionId,
        voiceId,
        elevenLabsVoiceId,
        visualStyle,
        subtitleSettings,
        musicId,
        musicTrackUrl,
        musicVolume,
        language,
        webhookSecret
      };

      const dispatchResult = await dispatchToN8n(targetResumeUrl, dispatchPayload, webhookSecret);

      if (!dispatchResult.ok) {
        console.error('[Netlify] Stage 2 Approve dispatch failed:', dispatchResult.error);
        return {
          statusCode: 502,
          headers: CORS,
          body: JSON.stringify({
            success: false,
            n8nResumed: false,
            error: 'N8N_RESUME_FAILED',
            message: `Could not trigger video rendering in n8n Cloud (HTTP ${dispatchResult.status}). ${dispatchResult.error || 'The wait step may have timed out.'}`,
            threadId
          })
        };
      }

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

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          success: true,
          action: 'APPROVE_SCENES',
          status: 'RENDERING_VIDEO',
          n8nResumed: true,
          threadId
        })
      };
    }

    // ─── 5. HANDLE STAGE 1 APPROVAL: APPROVE STORY -> GENERATE 5 SCENES ─
    const dispatchPayload = {
      approval: 'yes',
      action: 'APPROVE',
      threadId,
      sessionId,
      webhookSecret
    };

    const dispatchResult = await dispatchToN8n(targetResumeUrl, dispatchPayload, webhookSecret);

    if (!dispatchResult.ok) {
      console.error('[Netlify] Stage 1 Approve dispatch failed:', dispatchResult.error);
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({
          success: false,
          n8nResumed: false,
          error: 'N8N_RESUME_FAILED',
          message: `Could not trigger screenplay generation in n8n Cloud (HTTP ${dispatchResult.status}). ${dispatchResult.error || 'The wait step may have timed out.'}`,
          threadId
        })
      };
    }

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

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        success: true,
        action: 'APPROVE',
        status: 'GENERATING_SCENES',
        n8nResumed: true,
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
