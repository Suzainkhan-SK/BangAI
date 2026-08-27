// Netlify Function: story-approval
// POST: n8n posts story/scenes/video callback here → stored in memory
// GET: Browser polls here → checks memory, falls back to n8n API if cold container
// DELETE: Reset/clear thread

import { getDb } from './db.js';

const N8N_API_URL = 'https://cmpunktg23.app.n8n.cloud/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY || 'n8n_api_d07ac84c49c0e4b37d0025c7d8cb5c6d773a14f0';
const WORKFLOW_ID = '8gjIDzachTHImGke';

const READY_STATES = ['READY_FOR_APPROVAL', 'SCENES_READY_FOR_APPROVAL', 'COMPLETED', 'RENDER_FAILED', 'CANCELLED', 'DUPLICATE_TOPIC'];

// Fallback: query n8n execution API to find if this thread got a story callback
async function checkN8nExecutionForThread(threadId) {
  try {
    const res = await fetch(`${N8N_API_URL}/executions?workflowId=${WORKFLOW_ID}&status=waiting&limit=5`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    if (!res.ok) return null;

    const { data: executions } = await res.json();
    if (!executions?.length) return null;

    // Check the most recent execution for our thread data
    for (const exec of executions) {
      try {
        const detailRes = await fetch(`${N8N_API_URL}/executions/${exec.id}`, {
          headers: { 'X-N8N-API-KEY': N8N_API_KEY }
        });
        if (!detailRes.ok) continue;
        const detail = await detailRes.json();
        
        // Look for our threadId in execution data
        const dataStr = JSON.stringify(detail.data || {});
        if (dataStr.includes(threadId)) {
          // Found the execution — extract thread data from node outputs
          const nodes = detail.data?.resultData?.runData || {};
          const sendStoryNode = nodes['Send Story for Approval']?.[0]?.data?.main?.[0]?.[0]?.json;
          if (sendStoryNode?.threadId === threadId) {
            return {
              status: 'READY_FOR_APPROVAL',
              story: sendStoryNode,
              title: sendStoryNode.suggestedTitle,
              approveUrl: sendStoryNode.approveUrl,
              cancelUrl: sendStoryNode.cancelUrl,
              threadId
            };
          }
        }
      } catch (_) {}
    }
  } catch (e) {
    console.warn('[Approval] n8n fallback check failed:', e.message);
  }
  return null;
}

export const handler = async (event, context) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };

  try {
    const db = await getDb();
    const threadsCol = db.collection('threads');

    // ── DELETE: Reset thread ──────────────────────────────────────────
    if (event.httpMethod === 'DELETE' || event.queryStringParameters?.clear === 'true') {
      const { threadId } = event.queryStringParameters || {};
      if (threadId) {
        await threadsCol.deleteOne({ threadId });
      }
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ cleared: true }) };
    }

    // ── GET: Browser polling for story/scenes/video & Cancellation Check ──
    if (event.httpMethod === 'GET') {
      const { threadId, checkCancelled } = event.queryStringParameters || {};

      if (!threadId) {
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ hasStory: false, status: 'IDLE', threadId: null }) };
      }

      // 1. Check MongoDB store first
      let latest = await threadsCol.findOne({ threadId });

      // Fast-path: Quick cancellation query for n8n in-flight check
      if (checkCancelled === 'true') {
        const isCancelled = latest ? (latest.status === 'CANCELLED') : false;
        return {
          statusCode: 200,
          headers: CORS,
          body: JSON.stringify({
            isCancelled,
            status: latest?.status || 'UNKNOWN',
            threadId
          })
        };
      }

      // 2. Only check n8n execution API as fallback if NO record exists in MongoDB at all
      if (!latest) {
        const n8nData = await checkN8nExecutionForThread(threadId);
        if (n8nData) {
          await threadsCol.updateOne({ threadId }, { $set: n8nData }, { upsert: true });
          latest = await threadsCol.findOne({ threadId });
        }
      }

      // 3. Execution stall detection — n8n can timeout/crash silently
      //    If thread is stuck in an active generation state for > 90 minutes
      //    with no update from n8n, surface it as EXECUTION_TIMEOUT so the
      //    website stops animating and shows a retry card.
      const ACTIVE_GEN_STATUSES = ['GENERATING', 'GENERATING_SCENES', 'RENDERING_VIDEO'];
      const STALL_TIMEOUT_MS = 90 * 60 * 1000; // 90 minutes max — covers 60 min renders + buffer

      if (latest && ACTIVE_GEN_STATUSES.includes(latest.status)) {
        const lastUpdate = latest.updatedAt ? new Date(latest.updatedAt).getTime() : 0;
        const timeSinceUpdate = Date.now() - lastUpdate;

        if (lastUpdate > 0 && timeSinceUpdate > STALL_TIMEOUT_MS) {
          // Mark as execution timeout
          const stallDoc = {
            status: 'EXECUTION_TIMEOUT',
            errorMessage: `n8n workflow execution timed out or was cancelled after ${Math.round(timeSinceUpdate / 60000)} minutes. Please retry.`,
            updatedAt: new Date()
          };
          await threadsCol.updateOne({ threadId }, { $set: stallDoc });
          latest = { ...latest, ...stallDoc };
          console.log(`[story-approval] Detected stalled execution for thread ${threadId} — ${Math.round(timeSinceUpdate / 60000)} minutes with no update`);
        } else {
          // Actively generating/rendering — return current active status to keep website animation running
          return {
            statusCode: 200,
            headers: CORS,
            body: JSON.stringify({
              hasStory: false,
              status: latest.status,
              threadId: latest.threadId
            })
          };
        }
      }

      if (latest && (READY_STATES.includes(latest.status) || latest.status === 'EXECUTION_TIMEOUT')) {
        return {
          statusCode: 200,
          headers: CORS,
          body: JSON.stringify({
            hasStory: true,
            story: latest.story || null,
            scenes: latest.scenes || null,
            videoUrl: latest.videoUrl || null,
            youtubeUrl: latest.youtubeUrl || null,
            videoId: latest.videoId || null,
            threadId: latest.threadId,
            status: latest.status,
            title: latest.title || latest.story?.suggestedTitle,
            youtubeDescription: latest.youtubeDescription,
            tags: latest.tags,
            errorMessage: latest.errorMessage || null,
            refined: !!(latest.story?.refined || latest.refined),
            refineTimestamp: latest.story?.refineTimestamp || latest.refineTimestamp || null,
            changedFields: latest.changedFields || latest.story?.changedFields || null,
            changedScenes: latest.changedScenes || latest.story?.changedScenes || null,
            changeSummary: latest.changeSummary || latest.story?.changeSummary || null,
            refineFailed: latest.refineFailed ?? latest.story?.refineFailed ?? false,
            failReason: latest.failReason || latest.story?.failReason || null,
            refineRound: latest.refineRound || latest.story?.refineRound || 1,
            refineMode: latest.refineMode || latest.story?.refineMode || null,
            approveUrl: latest.approveUrl || latest.story?.approveUrl || null,
            cancelUrl: latest.cancelUrl || latest.story?.cancelUrl || null,
            storyTimestamp: latest.storyTimestamp || latest.story?.timestamp || latest.timestamp || null,
            updatedAt: latest.updatedAt || null
          })
        };
      }

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ hasStory: false, story: null, status: latest?.status || 'IDLE', threadId: latest?.threadId || null })
      };
    }


    // ── POST: n8n posts callback here ────────────────────────────────
    if (event.httpMethod === 'POST') {
      let data = {};
      try {
        const raw = typeof event.body === 'string' ? event.body : JSON.stringify(event.body || '{}');
        data = JSON.parse(raw);
        if (typeof data === 'string') data = JSON.parse(data);
      } catch (e) {
        data = {};
      }

      console.log('[story-approval] POST from n8n:', data.status, '| Thread:', data.threadId, '| Title:', data.suggestedTitle || data.title);

      const now = new Date();
      const threadId = data.threadId || `thread-${Date.now()}`;

      let status = 'READY_FOR_APPROVAL';
      let messageContent = `Story ready for review: "${data.suggestedTitle || data.title || 'New Story'}"`;

      if (data.status === 'CANCELLED') {
        status = 'CANCELLED';
        messageContent = 'Video generation was cancelled.';
      } else if (data.status === 'EXECUTION_TIMEOUT' || data.status === 'TIMEOUT') {
        status = 'EXECUTION_TIMEOUT';
        messageContent = `⏱️ **Approval Timed Out (30m):** Generation stopped to preserve resources. You can restart anytime.`;
      } else if (data.status === 'DUPLICATE_TOPIC') {
        status = 'DUPLICATE_TOPIC';
        messageContent = `Topic already covered: ${data.matchedTitle || data.message || 'Duplicate topic'}`;
      } else if (data.status === 'SCENES_READY_FOR_APPROVAL') {
        status = 'SCENES_READY_FOR_APPROVAL';
        messageContent = `🎬 Final 5 scenes ready: "${data.title || data.suggestedTitle}"`;
      } else if (['VIDEO_COMPLETED', 'VIDEO_UPLOADED_SUCCESS', 'COMPLETED', 'SUCCESS'].includes(data.status) || data.videoUrl) {
        status = 'COMPLETED';
        messageContent = data.youtubeUrl
          ? `🎉 **4K Video Uploaded to YouTube!**\n\n📺 ${data.youtubeUrl}`
          : `🎉 **4K Video Render Complete!**`;
      } else if (data.status === 'YOUTUBE_UPLOAD_FAILED') {
        status = 'COMPLETED';
        messageContent = `⚠️ YouTube Upload: ${data.errorMessage || 'Upload failed — retry available.'}`;
      } else if (data.status === 'RENDER_FAILED' || data.status === 'ERROR' || data.status === 'FAILED') {
        status = 'RENDER_FAILED';
        messageContent = `❌ Video rendering error: ${data.errorMessage || 'Failed in media engine'}`;
      }

      const updateDoc = {
        threadId,
        status,
        updatedAt: now
      };

      // Persist the full data blob as `story` so GET always returns it
      updateDoc.story = data;
      if (data.title || data.suggestedTitle) updateDoc.title = data.title || data.suggestedTitle;
      if (data.approveUrl) updateDoc.approveUrl = data.approveUrl;
      if (data.cancelUrl) updateDoc.cancelUrl = data.cancelUrl;
      if (data.resumeUrl) updateDoc.resumeUrl = data.resumeUrl;
      if (data.scenes && Array.isArray(data.scenes)) updateDoc.scenes = data.scenes;
      if (data.videoUrl) updateDoc.videoUrl = data.videoUrl;
      if (data.youtubeUrl) updateDoc.youtubeUrl = data.youtubeUrl;
      if (data.videoId) updateDoc.videoId = data.videoId;
      if (data.youtubeDescription) updateDoc.youtubeDescription = data.youtubeDescription;
      if (data.tags) updateDoc.tags = data.tags;
      if (data.changedFields) updateDoc.changedFields = data.changedFields;
      if (data.changedScenes) updateDoc.changedScenes = data.changedScenes;
      if (data.changeSummary) updateDoc.changeSummary = data.changeSummary;
      if (data.refineFailed !== undefined) updateDoc.refineFailed = data.refineFailed;
      if (data.failReason) updateDoc.failReason = data.failReason;
      if (data.refineRound) updateDoc.refineRound = data.refineRound;
      if (data.refineMode) updateDoc.refineMode = data.refineMode;
      if (data.refined !== undefined || data.isRefined !== undefined) updateDoc.refined = !!(data.refined || data.isRefined);
      if (data.refineTimestamp) updateDoc.refineTimestamp = data.refineTimestamp;
      if (data.timestamp) updateDoc.storyTimestamp = data.timestamp;
      if (status === 'COMPLETED') updateDoc.criticScore = 99;
      if (status === 'COMPLETED') updateDoc.criticScore = 99;

      const msgObj = {
        threadId,
        role: 'assistant',
        content: messageContent,
        story: data,
        scenes: data.scenes || null,
        videoUrl: data.videoUrl || null,
        youtubeUrl: data.youtubeUrl || null,
        status,
        timestamp: now
      };

      await threadsCol.updateOne(
        { threadId },
        { $set: updateDoc, $push: { messages: msgObj }, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );

      console.log('[story-approval] Stored thread', threadId, 'with status', status);

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ received: true, status: 'SUCCESS', threadId })
      };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  } catch (err) {
    console.error('[story-approval] Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
