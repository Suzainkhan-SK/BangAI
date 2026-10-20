// Netlify Function: stock-studio-automation
// Path: /.netlify/functions/stock-studio-automation
// Bang AI — Fully Autonomous 24-Hour Stock Studio Video & YouTube Autopilot Engine
// Handles: Scheduled 24h cron execution, user automation configuration, topic queueing, pause/resume, and instant runs.

import { ObjectId } from 'mongodb';
import { getDb } from './db.js';
import { verifyToken, getFreshGoogleToken } from './google-oauth.js';
import { getN8nConfig } from './n8n-config.js';

const MODAL_SERVE_URL = 'https://cmpunktg--bangai-stock-studio-serve.modal.run';
const N8N_YOUTUBE_WEBHOOK_URL = process.env.N8N_YOUTUBE_WEBHOOK_URL || 'https://cmpunktg33.app.n8n.cloud/webhook/viral-shorts-ai-youtube-upload';

/**
 * Reconciles status and media URLs for a Stock Studio automation document by querying Modal GPU cluster.
 */
export async function reconcileAutomationTaskStatus(db, autoDoc, modalBaseUrl = MODAL_SERVE_URL) {
  if (!autoDoc || !autoDoc.lastTaskId) return autoDoc;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${modalBaseUrl}/api/bangai/task/${autoDoc.lastTaskId}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const payload = await res.json();
      const taskData = payload?.data || payload || {};
      const rawStatus = taskData.status || (taskData.state === 1 || taskData.state === 'complete' ? 'complete' : taskData.state);
      const isComplete = rawStatus === 'complete' || taskData.state === 1 || !!taskData.video_url;
      const ytUrl = taskData.youtube_url || taskData.youtubeUrl || '';
      const videoUrl = taskData.video_url || taskData.videoUrl || '';

      autoDoc.lastTaskStatus = isComplete ? 'completed' : (rawStatus === 'processing' || rawStatus === 'rendering' ? 'rendering' : (rawStatus === 'failed' || rawStatus === -1 ? 'failed' : rawStatus));
      autoDoc.lastTaskProgress = taskData.progress ?? (isComplete ? 100 : 20);
      autoDoc.lastTaskStep = taskData.step || (isComplete ? 'Complete & Published' : '');
      if (videoUrl) autoDoc.lastVideoUrl = videoUrl;
      if (ytUrl) autoDoc.lastYoutubeUrl = ytUrl;

      // Persist to MongoDB if newly resolved
      const updates = {};
      if (ytUrl && !autoDoc.lastYoutubeUrl) updates.lastYoutubeUrl = ytUrl;
      if (videoUrl && !autoDoc.lastVideoUrl) updates.lastVideoUrl = videoUrl;

      const autoCol = db.collection('stock_studio_automations');
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date();
        await autoCol.updateOne({ _id: autoDoc._id }, { $set: updates });
      }

      // Reconcile completedTopics matching this taskId
      if (Array.isArray(autoDoc.completedTopics) && autoDoc.completedTopics.length > 0) {
        let topicUpdated = false;
        const updatedCompleted = autoDoc.completedTopics.map(ct => {
          if (ct.taskId === autoDoc.lastTaskId) {
            topicUpdated = true;
            return {
              ...ct,
              status: isComplete ? 'completed' : (ct.status || 'rendering'),
              youtubeUrl: ytUrl || ct.youtubeUrl || null,
              videoUrl: videoUrl || ct.videoUrl || null
            };
          }
          return ct;
        });

        if (topicUpdated) {
          autoDoc.completedTopics = updatedCompleted;
          await autoCol.updateOne(
            { _id: autoDoc._id },
            { $set: { completedTopics: updatedCompleted } }
          );
        }
      }
    }
  } catch (err) {
    console.debug(`[stock-studio-automation] Task reconciliation notice for ${autoDoc.lastTaskId}:`, err.message);
  }

  return autoDoc;
}

/**
 * Dispatches a single autonomous Stock Studio video generation
 */
export async function executeStockStudioAutonomousRun(db, automation, isManualTrigger = false) {
  const userId = String(automation.userId || '');
  const userEmail = String(automation.userEmail || '').toLowerCase();

  // 1. Resolve User Document & Dynamic YouTube Tokens
  const userQuery = [
    { email: String(userEmail || '').toLowerCase() },
    { email: userEmail }
  ];
  if (userId) {
    userQuery.push({ id: userId }, { userId: userId }, { _id: userId });
    if (ObjectId.isValid(userId)) {
      try {
        userQuery.push({ _id: new ObjectId(userId) });
      } catch (_) {}
    }
  }

  const userDoc = await db.collection('users').findOne({
    $or: userQuery
  });

  if (!userDoc) {
    throw new Error(`User account for ${userEmail || userId} was not found.`);
  }

  // 2. Resolve YouTube Channel
  const channels = userDoc.youtubeChannels || [];
  let targetChannel = null;
  if (automation.selectedChannelId) {
    targetChannel = channels.find(c => c.channelId === automation.selectedChannelId);
  }
  if (!targetChannel) {
    targetChannel = channels.find(c => c.isDefault) || channels[0] || null;
  }

  let userYouTubeAccessToken = '';
  let userYouTubeChannelTitle = '';
  let userYouTubeChannelId = '';

  if (targetChannel && targetChannel.tokens) {
    try {
      userYouTubeAccessToken = await getFreshGoogleToken(targetChannel, 'youtubeChannels') || '';
      userYouTubeChannelTitle = targetChannel.channelTitle || targetChannel.title || '';
      userYouTubeChannelId = targetChannel.channelId || '';
    } catch (tokenErr) {
      console.warn(`[stock-studio-automation] Token refresh error for ${userEmail}:`, tokenErr.message);
    }
  }

  const autoUploadToYouTube = automation.autoUploadToYouTube !== false && !!userYouTubeAccessToken;

  // 3. Resolve Topic from upcoming topics queue
  let nextTopic = '';
  let updatedUpcomingTopics = [...(automation.upcomingTopics || [])];
  if (updatedUpcomingTopics.length > 0) {
    nextTopic = updatedUpcomingTopics.shift().trim();
  }
  if (!nextTopic) {
    nextTopic = automation.defaultTopic || 'Deep Mysteries of the Universe';
  }

  // 4. Resolve Active Modal Cluster URL
  const sysCol = db.collection('system_config');
  const modalDoc = await sysCol.findOne({ _id: 'modal_configuration' });
  const activeCluster = modalDoc?.activeCluster || 'cmpunktg';
  const modalUrl = activeCluster === 'cmpunktg1'
    ? 'https://cmpunktg1--bangai-stock-studio-serve.modal.run'
    : MODAL_SERVE_URL;

  // 5. Resolve n8n YouTube upload webhook
  const n8nCfg = await getN8nConfig();
  const youtubeWebhookUrl = n8nCfg.webhooks?.youtube_upload || N8N_YOUTUBE_WEBHOOK_URL;

  const settings = automation.settings || {};
  const isBangCredits = automation.creditMode !== 'byok';

  // Determine video language:
  // 1. Explicit from settings
  // 2. Or infer Hindi if voice name contains Hindi/🇮🇳
  // 3. Default to Hindi ('hi-IN')
  let videoLanguage = settings.video_language || '';
  if (!videoLanguage && (settings.voice_name || '').toLowerCase().includes('hindi')) {
    videoLanguage = 'hi-IN';
  }
  if (!videoLanguage) {
    videoLanguage = 'hi-IN';
  }

  // 6. Build Stock Studio Task Payload strictly using user's applied settings
  const taskPayload = {
    video_subject: nextTopic,
    video_language: videoLanguage,
    video_aspect: settings.video_aspect || '9:16',
    video_source: settings.video_source || 'pexels',
    voice_name: settings.voice_name || 'json2video:jU6FDipvScsl0aEFyDoh:Aravinda - Mysteriou - 🇮🇳 Hindi (Male)',
    voice_speed: Number(settings.voice_speed || settings.voice_rate) || 1.1,
    voice_rate: Number(settings.voice_speed || settings.voice_rate) || 1.1,
    llm_provider: settings.llm_provider || settings.script_engine || 'gemini',
    llm_model: settings.llm_model || settings.script_model || 'gemini-2.5-flash',
    paragraph_number: Number(settings.paragraph_number) || 2,
    subtitle_preset: settings.subtitle_preset || 'mrbeast-viral',
    font_name: settings.font_name || '',
    font_size: Number(settings.font_size) || 50,
    text_fore_color: settings.text_fore_color || '#FFE600',
    stroke_color: settings.stroke_color || '#000000',
    stroke_width: Number(settings.stroke_width) || 2.0,
    bgm_type: settings.bgm_type || 'random',
    bgm_volume: Number(settings.bgm_volume) || 0.15,
    user_id: userDoc.id || userDoc._id?.toString() || userId,
    use_bangai_credits: isBangCredits,
    bang_api_credits: isBangCredits,
    use_bang_llm_credits: isBangCredits,
    use_bang_j2v_credits: isBangCredits,
    use_bang_voice_credits: isBangCredits,
    use_bang_material_credits: isBangCredits,
    auto_upload_youtube: autoUploadToYouTube,
    user_youtube_access_token: userYouTubeAccessToken,
    user_youtube_channel_title: userYouTubeChannelTitle,
    user_youtube_channel_id: userYouTubeChannelId,
    youtube_privacy: automation.youtubePrivacy || 'public',
    youtube_webhook_url: youtubeWebhookUrl
  };

  // 7. Dispatch to Modal GPU Cluster
  const modalRes = await fetch(`${modalUrl}/api/bangai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskPayload)
  });

  if (!modalRes.ok) {
    const errText = await modalRes.text().catch(() => '');
    throw new Error(`Modal render dispatch failed (${modalRes.status}): ${errText.slice(0, 200)}`);
  }

  const modalData = await modalRes.json();
  const taskId = modalData?.data?.task_id || modalData?.task_id || '';

  const now = new Date();
  const nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const totalRuns = (Number(automation.totalRuns) || 0) + 1;

  // 8. Update Automation Document
  const autoCol = db.collection('stock_studio_automations');
  await autoCol.updateOne(
    { _id: automation._id },
    {
      $set: {
        upcomingTopics: updatedUpcomingTopics,
        lastRunAt: now,
        nextRunAt: nextRunAt,
        totalRuns: totalRuns,
        lastTaskId: taskId,
        lastTopic: nextTopic,
        updatedAt: now
      },
      $push: {
        completedTopics: {
          $each: [{
            topic: nextTopic,
            taskId: taskId,
            dispatchedAt: now,
            autoUploadToYouTube,
            channelTitle: userYouTubeChannelTitle || null
          }],
          $slice: -100
        },
        executionLogs: {
          $each: [{
            timestamp: now,
            status: 'dispatched',
            topic: nextTopic,
            taskId: taskId,
            message: `Dispatched to Modal GPU. YouTube Auto-Upload: ${autoUploadToYouTube ? `Active (${userYouTubeChannelTitle})` : 'Disabled'}. Trigger: ${isManualTrigger ? 'Manual Run Now' : '24h Autopilot'}`
          }],
          $slice: -50
        }
      }
    }
  );

  return {
    success: true,
    taskId,
    topic: nextTopic,
    remainingTopics: updatedUpcomingTopics.length,
    autoUploadToYouTube,
    channelTitle: userYouTubeChannelTitle,
    nextRunAt
  };
}

export async function handler(event, context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const db = await getDb();
    const autoCol = db.collection('stock_studio_automations');
    const usersCol = db.collection('users');

    // Resolve Authorization
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    let token = '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
    const verifiedUser = verifyToken(token);

    // Fallback user resolution via query or body
    const queryParams = event.queryStringParameters || {};
    let reqBody = {};
    if (event.body) {
      try { reqBody = JSON.parse(event.body); } catch (_) {}
    }

    const candidateEmail = verifiedUser?.email || queryParams.email || reqBody.email || '';
    const candidateUserId = verifiedUser?.id || verifiedUser?.userId || queryParams.userId || reqBody.userId || '';

    // =========================================================================
    // 0. CRON / SCHEDULED BACKGROUND RUNNER (Triggered by Netlify Schedule or Modal Cron)
    // =========================================================================
    const isCronTrigger = 
      reqBody.action === 'cron-runner' || 
      reqBody.action === 'process-due' || 
      queryParams.action === 'cron-runner' || 
      queryParams.action === 'process-due' ||
      queryParams.cron === '1' ||
      event.headers?.['x-nf-event'] === 'schedule';

    if (isCronTrigger) {
      const now = new Date();
      const dueAutomations = await autoCol.find({
        status: 'ACTIVE',
        nextRunAt: { $lte: now }
      }).toArray();

      console.log(`[stock-studio-automation] Cron trigger: found ${dueAutomations.length} due automations.`);
      const results = [];

      for (const item of dueAutomations) {
        try {
          const res = await executeStockStudioAutonomousRun(db, item, false);
          results.push({ id: item._id, email: item.userEmail, success: true, res });
        } catch (itemErr) {
          console.error(`[stock-studio-automation] Error processing ${item.userEmail}:`, itemErr.message);
          await autoCol.updateOne(
            { _id: item._id },
            {
              $push: {
                executionLogs: {
                  $each: [{
                    timestamp: new Date(),
                    status: 'failed',
                    message: `Execution failed: ${itemErr.message}`
                  }],
                  $slice: -30
                }
              }
            }
          );
          results.push({ id: item._id, email: item.userEmail, success: false, error: itemErr.message });
        }
      }

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          processedCount: dueAutomations.length,
          results
        })
      };
    }

    // Helper to find user document
    const findUser = async () => {
      const userQuery = [];
      if (candidateEmail) {
        userQuery.push({ email: String(candidateEmail).toLowerCase() }, { email: candidateEmail });
      }
      if (candidateUserId) {
        userQuery.push(
          { id: candidateUserId },
          { userId: candidateUserId },
          { _id: candidateUserId },
          { customId: candidateUserId },
          { googleId: candidateUserId }
        );
        if (ObjectId.isValid(candidateUserId)) {
          try { userQuery.push({ _id: new ObjectId(candidateUserId) }); } catch (_) {}
        }
      }
      if (userQuery.length > 0) {
        return await usersCol.findOne({ $or: userQuery });
      }
      return null;
    };

    // =========================================================================
    // GET: Fetch User's Stock Studio Automation Document & YouTube Channels
    // =========================================================================
    if (event.httpMethod === 'GET') {
      const userDoc = await findUser();
      const effectiveEmail = userDoc?.email || candidateEmail || 'creator@bangai.com';
      const effectiveUserId = userDoc?.id || userDoc?._id?.toString() || candidateUserId || 'creator';

      let autoDoc = await autoCol.findOne({
        $or: [
          { userEmail: String(effectiveEmail).toLowerCase() },
          { userId: effectiveUserId }
        ]
      });

      if (!autoDoc) {
        const defaultDoc = {
          userId: effectiveUserId,
          userEmail: effectiveEmail,
          userName: userDoc?.name || effectiveEmail.split('@')[0],
          status: 'PAUSED',
          creditMode: 'bang_credits',
          upcomingTopics: [
            'Top 5 Unexplained Mysteries of Area 51',
            'Secrets of the Bermuda Triangle Flight 19',
            'Ancient Lost City Discovered Deep in Amazon'
          ],
          completedTopics: [],
          settings: {
            video_aspect: '9:16',
            video_source: 'pexels',
            script_engine: 'gemini',
            script_model: 'gemini-2.5-flash',
            voice_name: 'json2video:jU6FDipvScsl0aEFyDoh:Aravinda - Mysteriou - 🇮🇳 Hindi (Male)',
            voice_speed: 1.1,
            paragraph_number: 2,
            subtitle_preset: 'mrbeast-viral',
            font_size: 50,
            bgm_volume: 0.15,
            duration: 60
          },
          autoUploadToYouTube: true,
          youtubePrivacy: 'public',
          selectedChannelId: '',
          totalRuns: 0,
          executionLogs: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const insertRes = await autoCol.insertOne(defaultDoc);
        autoDoc = { ...defaultDoc, _id: insertRes.insertedId };
      }

      // Reconcile real-time status & media links for active/recent tasks from Modal GPU cluster
      autoDoc = await reconcileAutomationTaskStatus(db, autoDoc, MODAL_SERVE_URL);

      // Fetch Connected YouTube Channels from user document
      const channels = (userDoc?.youtubeChannels || []).map(c => ({
        channelId: c.channelId,
        channelTitle: c.channelTitle || c.title || 'YouTube Channel',
        avatarUrl: c.avatarUrl || c.thumbnailUrl || '',
        subscriberCount: c.subscriberCount || '0',
        isDefault: !!c.isDefault,
        needsReconnect: !!c.tokens?.needsReconnect
      }));

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          automation: autoDoc,
          channels,
          hasChannel: channels.length > 0
        })
      };
    }

    // =========================================================================
    // POST: User & Scheduled Automation Actions
    // =========================================================================
    if (event.httpMethod === 'POST') {
      const action = reqBody.action || 'save';

      // ── ACTION: TASK COMPLETED CALLBACK (From Modal Cluster) ───────────────
      if (action === 'task-completed') {
        const { taskId, youtubeUrl, videoUrl, channelTitle } = reqBody;
        if (!taskId) {
          return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing taskId' }) };
        }

        const now = new Date();
        const setFields = { updatedAt: now };
        if (youtubeUrl) setFields.lastYoutubeUrl = youtubeUrl;
        if (videoUrl) setFields.lastVideoUrl = videoUrl;

        // 1. Update matching document by lastTaskId or completedTopics.taskId
        const matched = await autoCol.findOne({
          $or: [{ lastTaskId: taskId }, { 'completedTopics.taskId': taskId }]
        });

        if (matched) {
          await autoCol.updateOne({ _id: matched._id }, { $set: setFields });

          // 2. Update specific completedTopic entry
          await autoCol.updateOne(
            { _id: matched._id, 'completedTopics.taskId': taskId },
            {
              $set: {
                'completedTopics.$.status': 'completed',
                'completedTopics.$.youtubeUrl': youtubeUrl || null,
                'completedTopics.$.videoUrl': videoUrl || null,
                'completedTopics.$.completedAt': now
              }
            }
          );
        }

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, message: `Task ${taskId} completion recorded successfully.` })
        };
      }

      // ── User-specific Actions (save, toggle, run-now) ───────────────────────
      const userDoc = await findUser();
      const effectiveEmail = userDoc?.email || candidateEmail || 'creator@bangai.com';
      const effectiveUserId = userDoc?.id || userDoc?._id?.toString() || candidateUserId || 'creator';

      let autoDoc = await autoCol.findOne({
        $or: [
          { userEmail: String(effectiveEmail).toLowerCase() },
          { userId: effectiveUserId }
        ]
      });

      if (!autoDoc) {
        const newDoc = {
          userId: effectiveUserId,
          userEmail: effectiveEmail,
          userName: userDoc?.name || effectiveEmail.split('@')[0],
          status: 'PAUSED',
          creditMode: 'bang_credits',
          upcomingTopics: [],
          completedTopics: [],
          settings: {},
          autoUploadToYouTube: true,
          youtubePrivacy: 'public',
          totalRuns: 0,
          executionLogs: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const ins = await autoCol.insertOne(newDoc);
        autoDoc = { ...newDoc, _id: ins.insertedId };
      }

      // ── ACTION: SAVE ───────────────────────────────────────────────────────
      if (action === 'save') {
        const { upcomingTopics, settings, creditMode, selectedChannelId, autoUploadToYouTube, youtubePrivacy, status } = reqBody;
        const now = new Date();

        const updates = {
          updatedAt: now
        };

        if (Array.isArray(upcomingTopics)) {
          updates.upcomingTopics = upcomingTopics.map(t => String(t).trim()).filter(Boolean);
        }
        if (settings && typeof settings === 'object') {
          updates.settings = { ...(autoDoc.settings || {}), ...settings };
        }
        if (creditMode) updates.creditMode = creditMode;
        if (selectedChannelId !== undefined) updates.selectedChannelId = selectedChannelId;
        if (autoUploadToYouTube !== undefined) updates.autoUploadToYouTube = !!autoUploadToYouTube;
        if (youtubePrivacy) updates.youtubePrivacy = youtubePrivacy;
        if (status) {
          updates.status = status;
          if (status === 'ACTIVE' && !autoDoc.nextRunAt) {
            updates.nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          }
        }

        await autoCol.updateOne({ _id: autoDoc._id }, { $set: updates });
        const updated = await autoCol.findOne({ _id: autoDoc._id });

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            automation: updated,
            message: 'Stock Studio automation settings saved successfully!'
          })
        };
      }

      // ── ACTION: TOGGLE STATUS (ACTIVE / PAUSED) ───────────────────────────
      if (action === 'toggle') {
        const newStatus = autoDoc.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        const now = new Date();
        const nextRunAt = newStatus === 'ACTIVE' ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : null;

        await autoCol.updateOne(
          { _id: autoDoc._id },
          {
            $set: {
              status: newStatus,
              nextRunAt,
              updatedAt: now
            },
            $push: {
              executionLogs: {
                $each: [{
                  timestamp: now,
                  status: 'status_change',
                  message: `User switched automation to ${newStatus}.`
                }],
                $slice: -30
              }
            }
          }
        );

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            status: newStatus,
            message: `Stock Studio Automation is now ${newStatus === 'ACTIVE' ? 'ACTIVE (generating every 24 hours)' : 'PAUSED'}.`
          })
        };
      }

      // ── ACTION: RUN NOW (Instant Test / Dispatch) ─────────────────────────
      if (action === 'run-now') {
        const updates = {};
        if (Array.isArray(reqBody.upcomingTopics) && reqBody.upcomingTopics.length > 0) {
          updates.upcomingTopics = reqBody.upcomingTopics.map(t => String(t).trim()).filter(Boolean);
          autoDoc.upcomingTopics = updates.upcomingTopics;
        }
        if (reqBody.settings && typeof reqBody.settings === 'object') {
          updates.settings = { ...(autoDoc.settings || {}), ...reqBody.settings };
          autoDoc.settings = updates.settings;
        }
        if (reqBody.creditMode) {
          updates.creditMode = reqBody.creditMode;
          autoDoc.creditMode = reqBody.creditMode;
        }
        if (reqBody.autoUploadToYouTube !== undefined) {
          updates.autoUploadToYouTube = !!reqBody.autoUploadToYouTube;
          autoDoc.autoUploadToYouTube = !!reqBody.autoUploadToYouTube;
        }
        if (reqBody.selectedChannelId !== undefined) {
          updates.selectedChannelId = reqBody.selectedChannelId;
          autoDoc.selectedChannelId = reqBody.selectedChannelId;
        }
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = new Date();
          await autoCol.updateOne({ _id: autoDoc._id }, { $set: updates });
        }

        // If user passed a specific topic in run-now, push it to front of queue
        if (reqBody.topic && String(reqBody.topic).trim()) {
          const customTopic = String(reqBody.topic).trim();
          autoDoc.upcomingTopics = [customTopic, ...(autoDoc.upcomingTopics || [])];
        }

        const runResult = await executeStockStudioAutonomousRun(db, autoDoc, true);
        const refreshed = await autoCol.findOne({ _id: autoDoc._id });

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            ...runResult,
            automation: refreshed,
            message: `🚀 Video for "${runResult.topic}" successfully dispatched to Modal GPU cluster! YouTube Auto-Upload: ${runResult.autoUploadToYouTube ? 'Active' : 'Disabled'}.`
          })
        };
      }

      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Unknown action: ${action}` })
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  } catch (err) {
    console.error('[stock-studio-automation] Error:', err);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
}
