// Netlify Function: story-approval
// POST: n8n posts story/scenes/video callback here → stored in memory
// GET: Browser polls here → checks memory, falls back to n8n API if cold container
// DELETE: Reset/clear thread

import { getDb } from './db.js';
import { verifyToken } from './google-oauth.js';
import { getN8nConfig } from './n8n-config.js';
import { getDirectExecutionStatus, getLatestWorkflowExecutions } from './n8n-checker.js';

const N8N_API_URL = 'https://cmpunktg33.app.n8n.cloud/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY || 'n8n_api_d07ac84c49c0e4b37d0025c7d8cb5c6d773a14f0';
const WORKFLOW_ID = 'UKWYwnlKuCqTazIG';

const READY_STATES = ['READY_FOR_APPROVAL', 'SCENES_READY_FOR_APPROVAL', 'COMPLETED', 'UPLOADING_YOUTUBE', 'RENDER_FAILED', 'FAILED', 'CANCELLED', 'DUPLICATE_TOPIC', 'EXECUTION_TIMEOUT'];

// Fallback: query n8n execution API to find if this thread got a story callback
async function checkN8nExecutionForThread(threadId) {
  try {
    const n8nCfg = await getN8nConfig();
    const apiUrl = n8nCfg.activeInstance ? `${n8nCfg.activeInstance}/api/v1` : N8N_API_URL;
    const apiKey = n8nCfg.apiKey || N8N_API_KEY;
    const workflowId = n8nCfg.workflowId || WORKFLOW_ID;

    const res = await fetch(`${apiUrl}/executions?workflowId=${workflowId}&status=waiting&limit=5`, {
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    if (!res.ok) return null;

    const { data: executions } = await res.json();
    if (!executions?.length) return null;

    // Check the most recent execution for our thread data
    for (const exec of executions) {
      try {
        const detailRes = await fetch(`${apiUrl}/executions/${exec.id}`, {
          headers: { 'X-N8N-API-KEY': apiKey }
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

    // ── DELETE: Reset thread (Protected) ────────────────────────────────
    if (event.httpMethod === 'DELETE') {
      const { threadId } = event.queryStringParameters || {};
      const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim() || event.queryStringParameters?.token;
      const user = verifyToken(token);

      if (threadId && user) {
        const existing = await threadsCol.findOne({ threadId });
        if (existing) {
          const authUid = user.userId || user.id;
          const authEmail = (user.email || '').toLowerCase();
          const isOwner = (existing.userId && existing.userId === authUid) ||
                          (existing.userEmail && existing.userEmail.toLowerCase() === authEmail);
          if (isOwner) {
            await threadsCol.deleteOne({ threadId });
          }
        }
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
      //    Adaptive per-status timeouts:
      //    - GENERATING: 60 minutes (1 hour)
      //    - GENERATING_SCENES: 60 minutes (1 hour)
      //    - started: 60 minutes (1 hour)
      //    - RENDERING_VIDEO: 90 minutes (covers long renders + buffers)
      const ACTIVE_GEN_STATUSES = ['started', 'GENERATING', 'GENERATING_SCENES', 'RENDERING_VIDEO'];
      const STALL_TIMEOUTS_MS = {
        started: 60 * 60 * 1000,
        GENERATING: 60 * 60 * 1000,
        GENERATING_SCENES: 60 * 60 * 1000,
        RENDERING_VIDEO: 90 * 60 * 1000
      };

      if (latest && ACTIVE_GEN_STATUSES.includes(latest.status)) {
        const lastUpdate = latest.updatedAt ? new Date(latest.updatedAt).getTime() : (latest.createdAt ? new Date(latest.createdAt).getTime() : 0);
        const timeSinceUpdate = Date.now() - lastUpdate;

        // Fetch dynamic error & recovery settings from MongoDB Atlas
        let recoverySettings = {};
        try {
          recoverySettings = await db.collection('system_config').findOne({ _id: 'error_recovery_settings' }) || {};
        } catch (_) {}

        const detectionEnabled = recoverySettings.enabled !== false;
        const directN8nCheck = recoverySettings.directN8nStatusCheck !== false;
        const cooldownMinutes = Number(recoverySettings.retryCooldownMinutes) > 0 ? Number(recoverySettings.retryCooldownMinutes) : 5;
        const stallMinutes = Number(recoverySettings.stallTimeoutMinutes) > 0 ? Number(recoverySettings.stallTimeoutMinutes) : 15;
        const stallTimeout = stallMinutes * 60 * 1000;
        const autoRefund = recoverySettings.autoRefundCredits !== false;
        const friendlyMsg = recoverySettings.friendlyErrorMessage ||
          'Our AI rendering engine encountered an unexpected hiccup while processing your video. Don\'t worry — your credit has been 100% preserved and you can retry in 5 minutes.';

        // 1. Direct n8n Execution Status Checking (Active Universal Probe)
        if (detectionEnabled && directN8nCheck && timeSinceUpdate > 3000) {
          let execInfo = null;
          if (latest.executionId) {
            execInfo = await getDirectExecutionStatus(latest.executionId);
          } else if (latest.workflowId) {
            const recent = await getLatestWorkflowExecutions(latest.workflowId, 3);
            if (recent && recent.length > 0) {
              const matched = recent.find(r => {
                const startMs = new Date(r.startedAt).getTime();
                return Math.abs(startMs - lastUpdate) < 300000; // within 5 minutes
              }) || recent[0];
              if (matched) {
                execInfo = await getDirectExecutionStatus(matched.id);
                if (matched.id && !latest.executionId) {
                  await threadsCol.updateOne({ threadId }, { $set: { executionId: matched.id } });
                  latest.executionId = matched.id;
                }
              }
            }
          }

          if (execInfo && (execInfo.status === 'error' || execInfo.status === 'crashed' || execInfo.status === 'canceled')) {
            const canRetryAt = new Date(Date.now() + cooldownMinutes * 60 * 1000);
            const failDoc = {
              status: 'FAILED',
              errorMessage: friendlyMsg,
              detailedError: execInfo.error?.message || `n8n execution status: ${execInfo.status}`,
              failedNode: execInfo.lastNodeExecuted || null,
              executionId: execInfo.id || latest.executionId || null,
              canRetryAt: canRetryAt.toISOString(),
              retryCooldownSeconds: cooldownMinutes * 60,
              updatedAt: new Date()
            };
            await threadsCol.updateOne({ threadId }, { $set: failDoc });
            latest = { ...latest, ...failDoc };

            if (autoRefund) {
              await db.collection('template_generations').updateMany(
                { threadId },
                { $set: { status: 'failed', refunded: true, updatedAt: new Date() } }
              );
            }
            console.log(`[story-approval] Universal probe detected execution ${execInfo.id} failure (${execInfo.status}) for thread ${threadId}`);
          }
        }

        // 2. Intelligent Stall Guard
        if (latest.status !== 'FAILED') {
          if (lastUpdate > 0 && timeSinceUpdate > stallTimeout) {
            const canRetryAt = new Date(Date.now() + cooldownMinutes * 60 * 1000);
            const stallDoc = {
              status: 'EXECUTION_TIMEOUT',
              errorMessage: friendlyMsg,
              detailedError: `Execution timed out after ${Math.round(timeSinceUpdate / 60000)} minutes in state ${latest.status}`,
              canRetryAt: canRetryAt.toISOString(),
              retryCooldownSeconds: cooldownMinutes * 60,
              updatedAt: new Date()
            };
            await threadsCol.updateOne({ threadId }, { $set: stallDoc });
            latest = { ...latest, ...stallDoc };

            if (autoRefund) {
              await db.collection('template_generations').updateMany(
                { threadId },
                { $set: { status: 'failed', refunded: true, updatedAt: new Date() } }
              );
            }
            console.log(`[story-approval] Detected stalled execution for thread ${threadId} (${latest.status}) — ${Math.round(timeSinceUpdate / 60000)}m with no update`);
          } else {
            // Still actively running
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
      }

      if (latest && (READY_STATES.includes(latest.status) || latest.status === 'EXECUTION_TIMEOUT' || latest.status === 'FAILED')) {
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
            finalSettings: latest.finalSettings || latest.story?.finalSettings || null,
            scenesSource: latest.scenesSource || latest.story?.scenesSource || null,
            totalScenes: latest.story?.totalScenes ?? (Array.isArray(latest.scenes) ? latest.scenes.length : null),
            executionId: latest.executionId || latest.story?.executionId || null,
            uploadStatus: latest.uploadStatus || latest.story?.uploadStatus || null,
            uploadError: latest.uploadError || latest.story?.uploadError || null,
            ytUploadStatus: latest.ytUploadStatus || latest.story?.ytUploadStatus || null,
            ytProcessingStatus: latest.ytProcessingStatus || latest.story?.ytProcessingStatus || null,
            bytesUploaded: latest.bytesUploaded ?? latest.story?.bytesUploaded ?? null,
            criticVerdict: latest.criticVerdict || latest.story?.criticVerdict || null,
            criticScore: latest.criticScore ?? null,
            errorMessage: latest.errorMessage || null,
            detailedError: latest.detailedError || null,
            failedNode: latest.failedNode || null,
            canRetryAt: latest.canRetryAt || null,
            retryCooldownSeconds: latest.retryCooldownSeconds || 300,
            isRetry: !!latest.isRetry,
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


    // ── POST: n8n posts callback here (Authenticated via webhook secret) ────
    if (event.httpMethod === 'POST') {
      const incomingSecret = event.headers['x-webhook-secret'] || event.headers['X-Webhook-Secret'] || '';
      const expectedSecret = process.env.SHORTSAI_WEBHOOK_SECRET || 's-vshorts-sec-9a8b7c6d5e4f3a2b1c0';
      if (!incomingSecret || incomingSecret !== expectedSecret) {
        return {
          statusCode: 401,
          headers: CORS,
          body: JSON.stringify({ success: false, error: 'Unauthorized: Invalid or missing webhook secret' })
        };
      }

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
      const rawExecId = data.executionId || data.execution?.id;
      const rawWfId = data.workflowId || data.workflow?.id;
      let threadId = data.threadId;
      let existing = null;

      if (threadId) {
        existing = await threadsCol.findOne({ threadId });
      } else if (rawExecId) {
        existing = await threadsCol.findOne({ executionId: String(rawExecId) });
        if (existing) threadId = existing.threadId;
      }
      
      if (!existing && rawWfId) {
        existing = await threadsCol.findOne(
          { workflowId: String(rawWfId), status: { $in: ACTIVE_GEN_STATUSES } },
          { sort: { updatedAt: -1 } }
        );
        if (existing) threadId = existing.threadId;
      }

      if (!threadId) {
        threadId = `thread-${Date.now()}`;
      }

      // Normalize error trigger payload if received directly from n8n error handler
      if (data.execution?.error || data.status === 'ERROR' || data.status === 'FAILED' || data.status === 'RENDER_FAILED') {
        data.status = 'FAILED';
        if (!data.errorMessage && data.execution?.error?.message) {
          data.errorMessage = data.execution.error.message;
        }
        if (!data.failedNode && data.execution?.lastNodeExecuted) {
          data.failedNode = data.execution.lastNodeExecuted;
        }
        if (!data.executionId && rawExecId) {
          data.executionId = String(rawExecId);
        }
      }

      let status = 'READY_FOR_APPROVAL';
      let messageContent = (data.suggestedTitle || data.title)
        ? `Story ready for review: "${data.suggestedTitle || data.title}"`
        : 'Story ready for review';

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
        const sceneCount = Array.isArray(data.scenes) ? data.scenes.length : (data.totalScenes || 5);
        const titleStr = data.title || data.suggestedTitle;
        messageContent = titleStr
          ? `🎬 Final ${sceneCount} scenes ready: "${titleStr}"`
          : `🎬 Final ${sceneCount} scenes ready`;
      } else if (['VIDEO_COMPLETED', 'VIDEO_UPLOADED_SUCCESS', 'COMPLETED', 'SUCCESS'].includes(data.status) || data.videoUrl) {
        status = 'COMPLETED';
        messageContent = data.youtubeUrl
          ? `🎉 **Video Uploaded to YouTube!**\n\n📺 ${data.youtubeUrl}`
          : `🎉 **Video Render Complete!**`;
      } else if (data.status === 'YOUTUBE_UPLOAD_FAILED') {
        status = 'COMPLETED';
        messageContent = `⚠️ YouTube Upload: ${data.errorMessage || 'Upload failed — retry available.'}`;
      } else if (data.status === 'RENDER_FAILED' || data.status === 'ERROR' || data.status === 'FAILED') {
        status = 'FAILED';
        messageContent = `❌ Video generation error: ${data.errorMessage || 'Failed in media pipeline'}`;
      } else if (['generating_story', 'GENERATING', 'started'].includes(data.status)) {
        status = 'GENERATING';
        messageContent = data.message || 'Autonomous video pipeline started on n8n Cloud...';
      }

      const updateDoc = {
        threadId,
        status,
        updatedAt: now
      };

      if (status === 'FAILED') {
        const canRetryAt = new Date(Date.now() + 5 * 60 * 1000);
        updateDoc.canRetryAt = canRetryAt.toISOString();
        updateDoc.retryCooldownSeconds = 300;
        updateDoc.errorMessage = data.errorMessage || 'Our AI rendering engine encountered an unexpected error while processing your video. Your credit has been preserved.';
        updateDoc.detailedError = data.detailedError || data.errorMessage || null;
        updateDoc.failedNode = data.failedNode || null;
        try {
          await db.collection('template_generations').updateMany(
            { threadId },
            { $set: { status: 'failed', refunded: true, updatedAt: now } }
          );
        } catch (_) {}
      }

      // Preserve or inherit multi-tenant user ownership
      if (existing?.userId) updateDoc.userId = existing.userId;
      else if (data.userId) updateDoc.userId = data.userId;

      if (existing?.userEmail) updateDoc.userEmail = existing.userEmail;
      else if (data.userEmail) updateDoc.userEmail = data.userEmail.toLowerCase();

      if (data.executionId) {
        updateDoc.executionId = String(data.executionId);
      }

      // Persist the full data blob merged with existing story so manual callbacks don't wipe previous data
      updateDoc.story = { ...((existing && existing.story) || {}), ...data };
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

      // Hoist scene-level refine fields if not at root
      const resolvedChangedScenes = data.changedScenes || data.story?.changedScenes || (Array.isArray(data.scenes) ? data.scenes.find(s => s && s.changedScenes)?.changedScenes : null);
      if (resolvedChangedScenes) updateDoc.changedScenes = resolvedChangedScenes;

      const resolvedChangeSummary = data.changeSummary || data.story?.changeSummary || (Array.isArray(data.scenes) ? data.scenes.find(s => s && s.changeSummary)?.changeSummary : null);
      if (resolvedChangeSummary) updateDoc.changeSummary = resolvedChangeSummary;

      const resolvedRefineFailed = data.refineFailed ?? data.story?.refineFailed ?? (Array.isArray(data.scenes) ? data.scenes.find(s => s && s.refineFailed !== undefined)?.refineFailed : undefined);
      if (resolvedRefineFailed !== undefined) updateDoc.refineFailed = resolvedRefineFailed;

      const resolvedFailReason = data.failReason || data.story?.failReason || (Array.isArray(data.scenes) ? data.scenes.find(s => s && s.failReason)?.failReason : null);
      if (resolvedFailReason) updateDoc.failReason = resolvedFailReason;

      if (data.refineRound) updateDoc.refineRound = data.refineRound;
      if (data.refineMode) updateDoc.refineMode = data.refineMode;
      if (data.refined !== undefined || data.isRefined !== undefined) updateDoc.refined = !!(data.refined || data.isRefined);
      if (data.refineTimestamp) updateDoc.refineTimestamp = data.refineTimestamp;
      if (data.timestamp) updateDoc.storyTimestamp = data.timestamp;

      // D1 & D3: Real fields from workflow
      if (data.criticScore !== undefined && data.criticScore !== null) updateDoc.criticScore = data.criticScore;
      if (data.criticVerdict) updateDoc.criticVerdict = data.criticVerdict;
      if (data.finalSettings) updateDoc.finalSettings = data.finalSettings;
      if (data.scenesSource) updateDoc.scenesSource = data.scenesSource;
      if (data.uploadStatus) updateDoc.uploadStatus = data.uploadStatus;
      if (data.uploadError) updateDoc.uploadError = data.uploadError;
      if (data.ytUploadStatus) updateDoc.ytUploadStatus = data.ytUploadStatus;
      if (data.ytProcessingStatus) updateDoc.ytProcessingStatus = data.ytProcessingStatus;
      if (data.bytesUploaded !== undefined && data.bytesUploaded !== null) updateDoc.bytesUploaded = data.bytesUploaded;

      // R11-E: If the incoming payload sends an explicit uploadStatus, trust it verbatim and skip derivation.
      // Only derive when the field is absent.
      if (!updateDoc.uploadStatus) {
        if (data.status === 'YOUTUBE_UPLOAD_FAILED') {
          updateDoc.uploadStatus = 'FAILED';
        } else if (data.status === 'VIDEO_UPLOADED_SUCCESS' || (['VIDEO_COMPLETED', 'COMPLETED', 'SUCCESS'].includes(data.status) && typeof data.youtubeUrl === 'string' && data.youtubeUrl.startsWith('http'))) {
          updateDoc.uploadStatus = 'UPLOADED';
        } else if (['VIDEO_COMPLETED', 'COMPLETED', 'SUCCESS'].includes(data.status)) {
          if (existing?.uploadStatus === 'UPLOADED') {
            updateDoc.uploadStatus = 'UPLOADED';
          } else {
            updateDoc.uploadStatus = 'PENDING';
          }
        }
      }

      // Never downgrade an already UPLOADED status
      if (existing?.uploadStatus === 'UPLOADED' && updateDoc.uploadStatus !== 'UPLOADED') {
        updateDoc.uploadStatus = 'UPLOADED';
      }

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

      // Also sync to template_generations collection for real-time admin template tracking
      try {
        const genPatch = {
          status,
          updatedAt: now
        };
        if (data.videoUrl) genPatch.videoUrl = data.videoUrl;
        if (data.youtubeUrl) genPatch.youtubeUrl = data.youtubeUrl;
        if (data.videoId) genPatch.videoId = data.videoId;
        if (data.title || data.suggestedTitle) genPatch.title = data.title || data.suggestedTitle;
        if (data.errorMessage) genPatch.errorMessage = data.errorMessage;
        await db.collection('template_generations').updateMany(
          { threadId },
          { $set: genPatch }
        );
      } catch (genSyncErr) {
        console.warn('[story-approval] Error syncing to template_generations:', genSyncErr.message);
      }

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
