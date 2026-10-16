// Netlify Function: template-automation
// Path: /.netlify/functions/template-automation
// Bang AI — Fully Autonomous 24-Hour AI Template Video & YouTube Autopilot Engine
// Handles: Scheduled 24h cron execution, user automation configuration, topic queueing, pause/resume, and instant runs.

import { getDb } from './db.js';
import { verifyToken, getFreshGoogleToken } from './google-oauth.js';
import { getN8nConfig } from './n8n-config.js';

// Default n8n Cloud Webhook endpoints for autonomous templates
const TEMPLATE_WEBHOOKS = {
  'world-mysteries': 'https://cmpunktg29.app.n8n.cloud/webhook/template-world-mysteries',
  'last-24-hours':   'https://cmpunktg29.app.n8n.cloud/webhook/template-last-24-hours',
  '3am-horror':      'https://cmpunktg29.app.n8n.cloud/webhook/template-3am-horror'
};

const TEMPLATE_META = {
  'world-mysteries': {
    name: 'World Mysteries & Paranormal [5 Direct Video Scenes - 75s]',
    title: 'World Mysteries & Paranormal [Autopilot]',
    musicId: 'mystery2',
    visualStyle: 'Dark Cinematic Mystery',
    language: 'English'
  },
  'last-24-hours': {
    name: 'Last 24 Hours [5 Direct Video Scenes - 75s]',
    title: 'Last 24 Hours [Autopilot]',
    musicId: 'cinematic',
    visualStyle: 'Cinematic Realistic',
    language: 'Hinglish'
  },
  '3am-horror': {
    name: '3-AM Horror [5 Direct Video Scenes - 75s]',
    title: '3-AM Horror [Autopilot]',
    musicId: 'mystery2',
    visualStyle: 'Dark Horror Cinematic',
    language: 'Hinglish'
  }
};

/**
 * Dispatches a single autonomous video generation for a given automation doc
 */
async function executeAutonomousRun(db, automation, isManualTrigger = false, hostHeader = 'bangai.netlify.app') {
  const userId = String(automation.userId || '');
  const userEmail = String(automation.userEmail || '').toLowerCase();
  const templateId = automation.templateId || 'world-mysteries';

  // 1. Resolve Dynamic n8n Webhook
  const n8nCfg = await getN8nConfig();
  const dynamicWebhooks = {
    'world-mysteries': n8nCfg.webhooks?.template_world_mysteries || TEMPLATE_WEBHOOKS['world-mysteries'],
    'last-24-hours':   n8nCfg.webhooks?.template_last_24_hours   || TEMPLATE_WEBHOOKS['last-24-hours'],
    '3am-horror':      n8nCfg.webhooks?.template_3am_horror      || TEMPLATE_WEBHOOKS['3am-horror']
  };
  const webhookUrl = dynamicWebhooks[templateId];

  if (!webhookUrl) {
    throw new Error(`Template "${templateId}" is not configured for autonomous execution.`);
  }

  // 2. Resolve User Document & Dynamic YouTube Tokens
  const userDoc = await db.collection('users').findOne({
    $or: [
      { id: userId },
      { _id: userId },
      { userId: userId },
      { email: String(userEmail || '').toLowerCase() },
      { email: userEmail }
    ]
  });

  if (!userDoc) {
    throw new Error(`User account for ${userEmail} was not found.`);
  }

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
      console.warn(`[template-automation] Token refresh error for ${userEmail}:`, tokenErr.message);
    }
  }

  const autoUploadToYouTube = automation.autoUploadToYouTube !== false && !!userYouTubeAccessToken;

  // 3. Pick Next Topic from Queue
  let nextTopic = '';
  let updatedUpcomingTopics = [...(automation.upcomingTopics || [])];

  if (updatedUpcomingTopics.length > 0) {
    nextTopic = updatedUpcomingTopics.shift().trim();
  }

  const completedDays = Number(automation.completedDays || 0) + 1;
  const totalDays = Number(automation.totalDays || 0);

  // 4. Construct Dispatch Payload
  const threadId = `thread-auto-${templateId}-${Date.now()}`;
  const sessionId = `session-auto-${Date.now()}`;
  const webhookSecret = process.env.SHORTSAI_WEBHOOK_SECRET || 's-vshorts-sec-9a8b7c6d5e4f3a2b1c0';
  const callbackUrl = `https://${hostHeader}/.netlify/functions/story-approval`;
  const meta = TEMPLATE_META[templateId] || TEMPLATE_META['world-mysteries'];

  const postData = JSON.stringify({
    templateId,
    templateName: meta.name,
    prompt: nextTopic,
    isAutomatedDailyRun: true,
    dayNumber: completedDays,
    callbackUrl,
    threadId,
    sessionId,
    userId: userId || 'anonymous',
    userEmail: userEmail,
    webhookSecret,
    // YouTube Auto-Upload
    autoUploadToYouTube,
    userYouTubeAccessToken,
    userYouTubeChannelTitle,
    userYouTubeChannelId,
    // Audio / Voice Customizations
    voiceId: automation.voiceId || 'adam',
    voiceSpeed: automation.voiceSpeed !== undefined ? Number(automation.voiceSpeed) : 1.20,
    voiceVolume: 1.0,
    visualStyle: meta.visualStyle,
    language: meta.language,
    aspectRatio: '9:16',
    subtitleStyle: 'hormozi',
    musicId: automation.musicId || meta.musicId,
    musicVolume: automation.musicVolume !== undefined ? Number(automation.musicVolume) : 0.08,
    timestamp: new Date().toISOString()
  });

  // 5. Record initial thread & generation
  try {
    await db.collection('threads').updateOne(
      { threadId },
      {
        $set: {
          threadId,
          userId,
          userEmail,
          title: `${meta.title} (Day ${completedDays})`,
          templateId,
          status: 'started',
          isAutonomousDaily: true,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date(),
          messages: [
            {
              role: 'system',
              content: `Autonomous 24h Video Engine dispatched for Day ${completedDays}/${totalDays || '∞'}. Topic: ${nextTopic ? `"${nextTopic}"` : 'AI Auto-Brainstorm'}. Target Channel: ${userYouTubeChannelTitle || 'None'}.`,
              timestamp: new Date().toISOString()
            }
          ]
        }
      },
      { upsert: true }
    );

    await db.collection('template_generations').insertOne({
      userId,
      userEmail,
      templateId,
      templateTitle: `${meta.title} · Day ${completedDays}`,
      threadId,
      prompt: nextTopic,
      channelTitle: userYouTubeChannelTitle || null,
      channelId: userYouTubeChannelId || null,
      isAutomatedDaily: true,
      dayNumber: completedDays,
      createdAt: new Date(),
      status: 'dispatched',
      resetByAdmin: false
    });
  } catch (dbErr) {
    console.warn('[template-automation] DB log error:', dbErr.message);
  }

  // 6. Call n8n Webhook
  console.log(`[template-automation] Dispatching Day ${completedDays} to n8n webhook: ${webhookUrl}`);
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': webhookSecret
    },
    body: postData
  });

  const respText = await res.text();
  console.log(`[template-automation] n8n response: ${res.status} ${respText.slice(0, 100)}`);

  // 7. Calculate Next Run (Exactly 24 hours from now)
  const now = new Date();
  const nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const isFinished = totalDays > 0 && completedDays >= totalDays;
  const newStatus = isFinished ? 'COMPLETED' : automation.status;

  const historyItem = {
    day: completedDays,
    topic: nextTopic || '(AI Auto-Brainstorm)',
    threadId,
    channelTitle: userYouTubeChannelTitle || 'Auto-Upload',
    executedAt: now,
    status: 'dispatched',
    isManualTrigger
  };

  // 8. Update Automation Document
  await db.collection('template_automations').updateOne(
    { _id: automation._id },
    {
      $set: {
        completedDays,
        upcomingTopics: updatedUpcomingTopics,
        lastRunAt: now,
        nextRunAt: isFinished ? null : nextRunAt,
        status: newStatus,
        updatedAt: now
      },
      $push: {
        topicsHistory: {
          $each: [historyItem],
          $slice: -50 // keep last 50 history entries
        },
        executionLogs: {
          $each: [{
            timestamp: now,
            status: 'success',
            day: completedDays,
            threadId,
            message: `Dispatched video for Day ${completedDays}. Topic: "${nextTopic || 'Auto-Brainstorm'}"`
          }],
          $slice: -30
        }
      }
    }
  );

  return {
    success: true,
    threadId,
    dayNumber: completedDays,
    totalDays,
    topic: nextTopic || 'AI Auto-Brainstorm',
    channelTitle: userYouTubeChannelTitle,
    autoUploadToYouTube,
    nextRunAt: isFinished ? null : nextRunAt,
    isFinished,
    status: newStatus
  };
}

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, '').trim();
  const hostHeader = event.headers.host || 'bangai.netlify.app';

  try {
    const db = await getDb();
    if (!db) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Database connection unavailable.' })
      };
    }

    const autoCol = db.collection('template_automations');

    // =========================================================================
    // GET: Fetch User's 24h Automation Configuration & Status
    // =========================================================================
    if (event.httpMethod === 'GET') {
      const user = verifyToken(tokenFromHeader);
      if (!user) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized. Please sign in.' })
        };
      }

      const userId = String(user.userId || user.id || '');
      const userEmail = String(user.email || '').toLowerCase();

      // Find user's automation doc
      let autoDoc = await autoCol.findOne({
        $or: [
          { userId },
          { userEmail }
        ]
      });

      // Find user channels
      const userDoc = await db.collection('users').findOne({
        $or: [
          { id: userId },
          { _id: userId },
          { userId },
          { email: userEmail }
        ]
      });

      const channels = (userDoc && userDoc.youtubeChannels) ? userDoc.youtubeChannels : [];
      const primaryChannel = channels.find(c => c.isDefault) || channels[0] || null;

      // Default template automation schema if none exists
      if (!autoDoc) {
        autoDoc = {
          userId,
          userEmail,
          status: 'PAUSED', // starts paused until user enables
          templateId: 'world-mysteries',
          totalDays: 7,
          completedDays: 0,
          upcomingTopics: [],
          voiceId: 'adam',
          voiceSpeed: 1.20,
          musicId: 'mystery2',
          musicVolume: 0.08,
          selectedChannelId: primaryChannel?.channelId || '',
          autoUploadToYouTube: true,
          topicsHistory: [],
          executionLogs: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          nextRunAt: null
        };
      }

      // Check if user has active channel and token status
      const hasChannel = channels.length > 0;
      const channelTokenValid = primaryChannel ? !!(primaryChannel.tokens?.accessToken || primaryChannel.tokens?.access_token || primaryChannel.tokens?.refreshToken) && !primaryChannel.tokens?.needsReconnect : false;

      // Enrich history with latest thread status/videoUrl if available
      if (autoDoc.topicsHistory && autoDoc.topicsHistory.length > 0) {
        const recentThreadIds = autoDoc.topicsHistory.map(h => h.threadId).filter(Boolean);
        if (recentThreadIds.length > 0) {
          const threads = await db.collection('threads')
            .find({ threadId: { $in: recentThreadIds } })
            .toArray()
            .catch(() => []);

          const threadMap = new Map();
          threads.forEach(t => threadMap.set(t.threadId, t));

          autoDoc.topicsHistory = autoDoc.topicsHistory.map(h => {
            const t = threadMap.get(h.threadId);
            return {
              ...h,
              videoUrl: t?.videoUrl || t?.story?.videoUrl || h.videoUrl || null,
              youtubeUrl: t?.youtubeUrl || t?.story?.youtubeUrl || h.youtubeUrl || null,
              status: t?.status || h.status || 'dispatched'
            };
          });
        }
      }

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          automation: autoDoc,
          channels: channels.map(c => ({
            channelId: c.channelId,
            channelTitle: c.channelTitle || c.title || 'YouTube Channel',
            title: c.channelTitle || c.title || 'YouTube Channel',
            customUrl: c.customUrl || '',
            avatarUrl: c.avatarUrl || c.thumbnailUrl || '',
            thumbnailUrl: c.avatarUrl || c.thumbnailUrl || '',
            subscriberCount: c.subscriberCount || '0',
            videoCount: c.videoCount || '0',
            isDefault: !!c.isDefault,
            needsReconnect: !!(c.tokens?.needsReconnect)
          })),
          hasChannel,
          channelTokenValid
        })
      };
    }

    // =========================================================================
    // POST: User & Scheduled Automation Actions
    // =========================================================================
    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const action = payload.action || 'save';

      // ── CRON / BACKGROUND RUNNER: Process all due automations ──────────────
      if (action === 'cron-runner' || action === 'process-due') {
        const now = new Date();
        const dueAutomations = await autoCol.find({
          status: 'ACTIVE',
          nextRunAt: { $lte: now }
        }).toArray();

        console.log(`[template-automation] Cron trigger: found ${dueAutomations.length} due automations.`);
        const results = [];

        for (const item of dueAutomations) {
          try {
            const res = await executeAutonomousRun(db, item, false, hostHeader);
            results.push({ id: item._id, email: item.userEmail, success: true, res });
          } catch (itemErr) {
            console.error(`[template-automation] Error processing ${item.userEmail}:`, itemErr.message);
            // Log failure to doc
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

      // ── Authenticated User Actions ─────────────────────────────────────────
      const user = verifyToken(tokenFromHeader || payload.token);
      if (!user) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized. Please sign in.' })
        };
      }

      const userId = String(user.userId || user.id || '');
      const userEmail = String(user.email || '').toLowerCase();

      // Find or init doc
      let autoDoc = await autoCol.findOne({
        $or: [{ userId }, { userEmail }]
      });

      // ── ACTION: SAVE SETTINGS ──────────────────────────────────────────────
      if (action === 'save') {
        const templateId = payload.templateId || autoDoc?.templateId || 'world-mysteries';
        const totalDays = payload.totalDays !== undefined ? Number(payload.totalDays) : (autoDoc?.totalDays ?? 7);
        const upcomingTopics = Array.isArray(payload.upcomingTopics)
          ? payload.upcomingTopics.map(t => String(t || '').trim()).filter(Boolean)
          : (autoDoc?.upcomingTopics || []);
        const voiceId = payload.voiceId || autoDoc?.voiceId || 'adam';
        const voiceSpeed = payload.voiceSpeed !== undefined ? Number(payload.voiceSpeed) : (autoDoc?.voiceSpeed ?? 1.20);
        const musicId = payload.musicId || autoDoc?.musicId || 'mystery2';
        const musicVolume = payload.musicVolume !== undefined ? Number(payload.musicVolume) : (autoDoc?.musicVolume ?? 0.08);
        const selectedChannelId = payload.selectedChannelId !== undefined ? payload.selectedChannelId : (autoDoc?.selectedChannelId || '');
        const autoUploadToYouTube = payload.autoUploadToYouTube !== false;
        const requestedStatus = payload.status || autoDoc?.status || 'ACTIVE';

        const now = new Date();
        let nextRunAt = autoDoc?.nextRunAt;

        // If activating and no future nextRunAt scheduled yet
        if (requestedStatus === 'ACTIVE' && (!nextRunAt || new Date(nextRunAt) <= now)) {
          // Schedule first automated run for 24 hours from activation, or right now if specified
          if (payload.scheduleImmediate) {
            nextRunAt = now;
          } else {
            nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          }
        } else if (requestedStatus === 'PAUSED') {
          // Keep nextRunAt or pause
        }

        const updateData = {
          userId,
          userEmail,
          templateId,
          totalDays,
          upcomingTopics,
          voiceId,
          voiceSpeed,
          musicId,
          musicVolume,
          selectedChannelId,
          autoUploadToYouTube,
          status: requestedStatus,
          nextRunAt: requestedStatus === 'ACTIVE' ? nextRunAt : (autoDoc?.nextRunAt || null),
          updatedAt: now
        };

        await autoCol.updateOne(
          { $or: [{ userId }, { userEmail }] },
          {
            $set: updateData,
            $setOnInsert: {
              completedDays: 0,
              topicsHistory: [],
              executionLogs: [{
                timestamp: now,
                status: 'info',
                message: 'Autonomous 24h Automation created & configured.'
              }],
              createdAt: now
            }
          },
          { upsert: true }
        );

        const updatedDoc = await autoCol.findOne({ $or: [{ userId }, { userEmail }] });

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            message: requestedStatus === 'ACTIVE'
              ? '⚡ Autonomous 24-Hour Automation is ACTIVE! Videos will auto-upload to your YouTube channel every 24h.'
              : 'Automation settings saved (PAUSED).',
            automation: updatedDoc
          })
        };
      }

      // ── ACTION: TOGGLE STATUS (PAUSE / RESUME) ─────────────────────────────
      if (action === 'toggle') {
        if (!autoDoc) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Automation is not configured yet. Please configure it first.' })
          };
        }

        const newStatus = autoDoc.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        const now = new Date();
        let nextRunAt = autoDoc.nextRunAt;

        if (newStatus === 'ACTIVE') {
          // If resumed, ensure nextRunAt is in the future
          if (!nextRunAt || new Date(nextRunAt) <= now) {
            nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          }
        }

        await autoCol.updateOne(
          { _id: autoDoc._id },
          {
            $set: {
              status: newStatus,
              nextRunAt: newStatus === 'ACTIVE' ? nextRunAt : autoDoc.nextRunAt,
              updatedAt: now
            },
            $push: {
              executionLogs: {
                $each: [{
                  timestamp: now,
                  status: 'info',
                  message: `User ${newStatus === 'ACTIVE' ? 'resumed' : 'paused'} 24h automation.`
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
            message: newStatus === 'ACTIVE' ? '⚡ Automation Resumed and Running.' : '⏸ Automation Paused.'
          })
        };
      }

      // ── ACTION: RUN NOW (INSTANT TRIGGER FOR TODAY) ────────────────────────
      if (action === 'run-now') {
        if (!autoDoc) {
          const userDocForInit = await db.collection('users').findOne({
            $or: [
              { id: userId },
              { _id: userId },
              { userId },
              { email: String(userEmail || '').toLowerCase() },
              { email: userEmail }
            ]
          });
          const userChannels = userDocForInit?.youtubeChannels || [];
          const primaryChannel = userChannels.find(c => c.isDefault) || userChannels[0] || null;

          autoDoc = {
            userId,
            userEmail,
            status: 'ACTIVE',
            templateId: 'world-mysteries',
            totalDays: 7,
            completedDays: 0,
            upcomingTopics: [],
            voiceId: 'adam',
            voiceSpeed: 1.20,
            musicId: 'mystery2',
            musicVolume: 0.08,
            selectedChannelId: primaryChannel?.channelId || '',
            autoUploadToYouTube: true,
            topicsHistory: [],
            executionLogs: [{
              timestamp: now,
              status: 'info',
              message: 'Autonomous 24h Automation created via instant trigger.'
            }],
            createdAt: now,
            updatedAt: now,
            nextRunAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          };
          const insertRes = await autoCol.insertOne(autoDoc);
          autoDoc._id = insertRes.insertedId;
        }

        console.log(`[template-automation] User ${userEmail} triggered immediate run.`);
        const runResult = await executeAutonomousRun(db, autoDoc, true, hostHeader);

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            message: `⚡ Day ${runResult.dayNumber} video dispatched! Autonomous rendering and direct YouTube upload started.`,
            runResult
          })
        };
      }

      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Unknown action: ${action}` })
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  } catch (err) {
    console.error('[template-automation] Fatal error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' })
    };
  }
};
