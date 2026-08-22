// Netlify Function: approve-story
// Path: /.netlify/functions/approve-story
// Handles 2-Stage Approvals, Story & Scene Refinements, and Cancellations

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
    console.log(`[Netlify approve-story] Relaying action "${action}" to n8n Cloud resume webhook:`, approveUrl, 'Thread:', threadId);

    let db = null;
    try {
      db = await getDb();
    } catch (e) {}

    // ─── 1. HANDLE CANCEL / REJECT ACTION ─────────────────────────────
    if (action === 'CANCEL') {
      if (approveUrl) {
        const sep = approveUrl.includes('?') ? '&' : '?';
        const cancelTarget = approveUrl.includes('approval=') 
          ? approveUrl.replace(/approval=[^&]+/, 'approval=no&action=CANCEL')
          : `${approveUrl}${sep}approval=no&action=CANCEL`;

        console.log('[Netlify] Sending cancellation to n8n webhook:', cancelTarget);
        try {
          await fetch(cancelTarget, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approval: 'no', action: 'CANCEL', threadId })
          }).catch(() => fetch(cancelTarget, { method: 'GET' }));
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
      if (approveUrl) {
        const sep = approveUrl.includes('?') ? '&' : '?';
        const refineTarget = `${approveUrl}${sep}approval=refine&action=REFINE_STORY&refinePrompt=${encodeURIComponent(refinePrompt)}`;
        console.log('[Netlify] Sending Refinement to n8n Wait node:', refineTarget);

        try {
          const res = await fetch(refineTarget, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              approval: 'refine',
              action: 'REFINE_STORY',
              refinePrompt,
              threadId,
              sessionId,
              story,
              language,
              voiceId,
              visualStyle
            })
          }).catch(() => fetch(refineTarget, { method: 'GET' }));

          n8nResumed = true;
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
      if (approveUrl) {
        const sep = approveUrl.includes('?') ? '&' : '?';
        const refineTarget = `${approveUrl}${sep}approval=refine&action=REFINE_SCENES&refinePrompt=${encodeURIComponent(refinePrompt)}`;
        console.log('[Netlify] Sending Scene Refinement to n8n Scenes Wait node:', refineTarget);

        try {
          await fetch(refineTarget, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              approval: 'refine',
              action: 'REFINE_SCENES',
              refinePrompt,
              threadId,
              sessionId,
              scenes,
              story,
              language,
              voiceId,
              visualStyle
            })
          }).catch(() => fetch(refineTarget, { method: 'GET' }));

          n8nResumed = true;
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

      if (approveUrl) {
        const sep = approveUrl.includes('?') ? '&' : '?';
        const targetUrl = approveUrl.includes('approval=') ? approveUrl : `${approveUrl}${sep}approval=yes&action=APPROVE_SCENES`;
        console.log('[Netlify] Resuming n8n Stage 2 Scenes Wait node:', targetUrl);
        try {
          await fetch(targetUrl, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approval: 'yes', action: 'APPROVE_SCENES', threadId })
          }).catch(() => fetch(targetUrl, { method: 'GET' }));
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
    if (approveUrl) {
      const sep = approveUrl.includes('?') ? '&' : '?';
      const targetUrl = approveUrl.includes('approval=') ? approveUrl : `${approveUrl}${sep}approval=yes&action=APPROVE`;
      console.log('[Netlify] Resuming n8n Stage 1 Story Wait node:', targetUrl);
      try {
        const n8nResumeRes = await fetch(targetUrl, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approval: 'yes', action: 'APPROVE', threadId })
        }).catch(() => fetch(targetUrl, { method: 'GET' }));

        console.log(`[Netlify] n8n Wait node resume response HTTP ${n8nResumeRes?.status || 200}`);
        resumedN8n = true;
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
