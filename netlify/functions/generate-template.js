// Netlify Function: generate-template
// Path: /.netlify/functions/generate-template
// Bang AI — Dispatches 1-Click Autonomous Template Video Workflow to n8n Cloud
// Features: Airtight 24h Daily Limit Enforcement, Rolling Window Tracking & Full Admin Governance

import { getDb } from './db.js';
import { verifyToken, getFreshGoogleToken } from './google-oauth.js';
import { getN8nConfig } from './n8n-config.js';
import { verifySeriesOwnership } from './template-series.js';

// Webhook endpoints for autonomous template workflows on n8n Cloud
const TEMPLATE_WEBHOOKS = {
  'world-mysteries':        'https://cmpunktg29.app.n8n.cloud/webhook/template-world-mysteries',
  'last-24-hours':          'https://cmpunktg29.app.n8n.cloud/webhook/template-last-24-hours',
  '3am-horror':             'https://cmpunktg29.app.n8n.cloud/webhook/template-3am-horror',
  'time-travel-influencer': 'https://cmpunktg33.app.n8n.cloud/webhook/template-time-travel-influencer',
  'family-micro-drama':     process.env.N8N_FAMILY_WEBHOOK_URL || 'https://cmpunktg33.app.n8n.cloud/webhook/ghar-ki-kahani'
};

const TEMPLATE_META = {
  'world-mysteries': {
    name: 'World Mysteries & Paranormal [5 Direct Video Scenes - 75s]',
    title: 'World Mysteries & Paranormal [1-Click]',
    musicId: 'mystery2',
    visualStyle: 'Dark Cinematic Mystery',
    language: 'English'
  },
  'last-24-hours': {
    name: 'Last 24 Hours [5 Direct Video Scenes - 75s]',
    title: 'Last 24 Hours [1-Click]',
    musicId: 'cinematic',
    visualStyle: 'Cinematic Realistic',
    language: 'Hinglish'
  },
  '3am-horror': {
    name: '3-AM Horror [5 Direct Video Scenes - 75s]',
    title: '3-AM Horror [1-Click]',
    musicId: 'mystery2',
    visualStyle: 'Dark Horror Cinematic',
    language: 'Hinglish'
  },
  'time-travel-influencer': {
    name: 'TIME TRAVEL INFLUENCER [5 Direct Video Scenes - 75s]',
    title: 'POV: Time Travel Influencer [1-Click]',
    musicId: 'action',
    visualStyle: 'Cinematic Live-Action Vlog',
    language: 'Hindi'
  },
  'family-micro-drama': {
    name: 'Ghar Ki Kahani - Family Drama - Webhook Based',
    title: 'Ghar Ki Kahani [Family Drama]',
    musicId: 'cinematic',
    visualStyle: 'Realistic Live-Action Micro-Drama',
    language: 'Hindi'
  }
};

/**
 * Calculates a user's exact template generation quota and remaining allowance.
 */
async function getUserTemplateQuota(db, user) {
  if (!db) {
    return {
      dailyLimit: 1,
      usedToday: 0,
      remaining: 1,
      isLimitReached: false,
      enforceDailyLimit: true,
      maintenanceMode: false,
      maintenanceNotice: '',
      limitWindow: '24h',
      nextResetTime: null,
      resetCountdownMs: 0
    };
  }

  const sysCol = db.collection('system_config');
  const configDoc = await sysCol.findOne({ _id: 'templates_configuration' }) || {};

  const enforceDailyLimit = configDoc.enforceDailyLimit !== false;
  const globalLimit = Number(configDoc.dailyLimit) > 0 ? Number(configDoc.dailyLimit) : 1;
  const limitWindow = configDoc.limitWindow || '24h';
  const maintenanceMode = !!configDoc.maintenanceMode;
  const maintenanceNotice = configDoc.maintenanceNotice || 'AI Template generation is currently undergoing scheduled maintenance. Please check back shortly.';
  const globalResetAt = configDoc.globalResetAt ? new Date(configDoc.globalResetAt) : null;

  if (!user) {
    return {
      authenticated: false,
      dailyLimit: globalLimit,
      usedToday: 0,
      remaining: globalLimit,
      isLimitReached: false,
      enforceDailyLimit,
      maintenanceMode,
      maintenanceNotice,
      limitWindow,
      nextResetTime: null,
      resetCountdownMs: 0
    };
  }

  const userId = String(user.userId || user.id || '');
  const userEmail = String(user.email || '').toLowerCase();

  // Check user document for custom limits or individual reset timestamp
  const userDoc = await db.collection('users').findOne({
    $or: [
      { id: userId },
      { _id: userId },
      { userId: userId },
      { email: userEmail }
    ]
  });

  const userDailyLimit = (userDoc && userDoc.templateDailyLimit !== undefined)
    ? Number(userDoc.templateDailyLimit)
    : globalLimit;
  const userResetAt = userDoc?.templateLimitResetAt ? new Date(userDoc.templateLimitResetAt) : null;

  // Calculate window start
  let windowStart;
  if (limitWindow === 'calendar') {
    const now = new Date();
    windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  } else {
    // 24-Hour Rolling Window
    windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  let effectiveStart = windowStart;
  if (globalResetAt && globalResetAt > effectiveStart) {
    effectiveStart = globalResetAt;
  }
  if (userResetAt && userResetAt > effectiveStart) {
    effectiveStart = userResetAt;
  }

  const query = {
    $or: [
      { userId },
      { userEmail }
    ],
    createdAt: { $gte: effectiveStart },
    resetByAdmin: { $ne: true },
    status: { $nin: ['failed', 'FAILED', 'RENDER_FAILED', 'EXECUTION_TIMEOUT'] },
    refunded: { $ne: true }
  };

  const usedToday = await db.collection('template_generations').countDocuments(query);
  const isUnlimited = userDailyLimit <= 0;
  const isLimitReached = !isUnlimited && enforceDailyLimit && usedToday >= userDailyLimit;
  const remaining = isUnlimited ? 999 : Math.max(0, userDailyLimit - usedToday);

  let nextResetTime = null;
  let resetCountdownMs = 0;

  if (isLimitReached) {
    if (limitWindow === 'calendar') {
      const now = new Date();
      nextResetTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    } else {
      const oldest = await db.collection('template_generations').findOne(query, { sort: { createdAt: 1 } });
      nextResetTime = oldest ? new Date(oldest.createdAt.getTime() + 24 * 60 * 60 * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    resetCountdownMs = Math.max(0, nextResetTime.getTime() - Date.now());
  }

  return {
    authenticated: true,
    userId,
    userEmail,
    dailyLimit: userDailyLimit,
    usedToday,
    remaining,
    isLimitReached,
    enforceDailyLimit,
    maintenanceMode,
    maintenanceNotice,
    limitWindow,
    nextResetTime: nextResetTime ? nextResetTime.toISOString() : null,
    resetCountdownMs
  };
}

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, '').trim();

  // -------------------------------------------------------------
  // GET: Fetch user's current daily quota & system governance status
  // -------------------------------------------------------------
  if (event.httpMethod === 'GET') {
    try {
      const user = verifyToken(tokenFromHeader);
      const db = await getDb();
      const quota = await getUserTemplateQuota(db, user);

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          ...quota
        })
      };
    } catch (err) {
      console.error('[generate-template] GET quota error:', err);
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: err.message || 'Internal Server Error' })
      };
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // -------------------------------------------------------------
  // POST: Autonomous 1-Click Template Video Generation Dispatch
  // -------------------------------------------------------------
  try {
    const payload = JSON.parse(event.body || '{}');
    const templateId = payload.templateId || 'world-mysteries';
    const n8nCfg = await getN8nConfig();
    const dynamicWebhooks = {
      'world-mysteries':        n8nCfg.webhooks?.template_world_mysteries || TEMPLATE_WEBHOOKS['world-mysteries'],
      'last-24-hours':          n8nCfg.webhooks?.template_last_24_hours   || TEMPLATE_WEBHOOKS['last-24-hours'],
      '3am-horror':             n8nCfg.webhooks?.template_3am_horror      || TEMPLATE_WEBHOOKS['3am-horror'],
      'time-travel-influencer': n8nCfg.webhooks?.template_time_travel_influencer || n8nCfg.webhooks?.timeTravelInfluencer || TEMPLATE_WEBHOOKS['time-travel-influencer'],
      'family-micro-drama':     process.env.N8N_FAMILY_WEBHOOK_URL || n8nCfg.webhooks?.template_family_micro_drama || n8nCfg.webhooks?.familyMicroDrama || TEMPLATE_WEBHOOKS['family-micro-drama']
    };
    const webhookUrl = dynamicWebhooks[templateId];

    if (!webhookUrl) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Template "${templateId}" is not configured.` })
      };
    }

    // Determine host for the callback URL
    const host = event.headers.host || 'bangai.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    const userToken = tokenFromHeader || payload.token;
    const user = verifyToken(userToken);

    if (!user) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized. Please sign in to generate template videos.' })
      };
    }

    const userId = String(user.userId || user.id || '');
    const userEmail = String(user.email || '').toLowerCase();
    const isAdmin = user.role === 'admin' || user.role === 'master_admin';

    const db = await getDb();

    // 1. Quota & Governance Verification
    const quota = await getUserTemplateQuota(db, user);

    if (quota.maintenanceMode && !isAdmin) {
      return {
        statusCode: 503,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'MAINTENANCE_MODE',
          message: quota.maintenanceNotice || 'AI Template generation is temporarily under scheduled maintenance.'
        })
      };
    }

    if (quota.isLimitReached && !isAdmin) {
      return {
        statusCode: 429,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'DAILY_LIMIT_REACHED',
          message: `Daily generation limit reached. You can generate up to ${quota.dailyLimit} video per 24 hours.`,
          dailyLimit: quota.dailyLimit,
          usedToday: quota.usedToday,
          remaining: 0,
          nextResetTime: quota.nextResetTime,
          resetCountdownMs: quota.resetCountdownMs
        })
      };
    }

    // 2. Dynamic Credentials Lookup from MongoDB
    let userYouTubeAccessToken = '';
    let userYouTubeChannelTitle = '';
    let userYouTubeChannelId = '';
    let userSheetAccessToken = '';
    let userSpreadsheetId = '';
    let userSheetName = 'Production Log';
    let targetChannel = null;

    if (db) {
      try {
        const userDoc = await db.collection('users').findOne({
          $or: [
            { id: userId },
            { _id: userId },
            { userId: userId },
            { email: userEmail }
          ]
        });

        if (userDoc) {
          // Resolve Target YouTube Channel
          const selectedChannelId = payload.selectedChannelId || payload.channelId;
          const channels = userDoc.youtubeChannels || [];

          if (selectedChannelId) {
            targetChannel = channels.find(c => c.channelId === selectedChannelId);
          }
          if (!targetChannel) {
            targetChannel = channels.find(c => c.isDefault) || channels[0] || null;
          }

          if (targetChannel && targetChannel.tokens) {
            userYouTubeAccessToken = await getFreshGoogleToken(targetChannel, 'youtubeChannels') || '';
            userYouTubeChannelTitle = targetChannel.channelTitle || '';
            userYouTubeChannelId = targetChannel.channelId || '';
          }

          // Resolve Target Google Sheet
          let targetSheet = null;
          if (userDoc.googleSheets && userDoc.googleSheets.length > 0) {
            targetSheet = userDoc.googleSheets.find(s => s.isDefault) || userDoc.googleSheets[0];
          }

          if (targetSheet) {
            const sheetTokenContainer = targetSheet.tokens ? targetSheet : targetChannel;
            if (sheetTokenContainer) {
              userSheetAccessToken = await getFreshGoogleToken(sheetTokenContainer, 'youtubeChannels') || '';
            }
            userSpreadsheetId = targetSheet.spreadsheetId || '';
            userSheetName = targetSheet.sheetName || 'Production Log';
          }
        }
      } catch (dbErr) {
        console.warn('[generate-template] Error resolving dynamic tokens:', dbErr.message);
      }
    }

    if (payload.autoUploadToYouTube !== false && !userYouTubeAccessToken && payload.forceWithoutUpload !== true) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'YOUTUBE_TOKEN_EXPIRED',
          message: 'Your YouTube channel connection has expired or is invalid. Please reconnect your YouTube channel on BangAI before starting generation.'
        })
      };
    }

    const autoUploadToYouTube = payload.autoUploadToYouTube !== false && !!userYouTubeAccessToken;
    const autoLogToSheet = payload.autoLogToSheet !== false;

    // Generate a unique thread ID for tracking
    const threadId = payload.threadId || `thread-template-${templateId}-${Date.now()}`;
    const sessionId = payload.sessionId || `session-${Date.now()}`;
    const webhookSecret = process.env.SHORTSAI_WEBHOOK_SECRET || 's-vshorts-sec-9a8b7c6d5e4f3a2b1c0';

    const meta = TEMPLATE_META[templateId] || TEMPLATE_META['world-mysteries'];

    const WORKFLOW_ID_MAP = {
      'world-mysteries':        n8nCfg.productionWorkflows?.worldMysteries        || 'i458lFk0Pnf2cSHY',
      'last-24-hours':          n8nCfg.productionWorkflows?.last24Hours          || 'PQKEFVjhD3P2yfnZ',
      '3am-horror':             n8nCfg.productionWorkflows?.horror3am            || '94IjipHAsUQWjkun',
      'time-travel-influencer': n8nCfg.productionWorkflows?.timeTravelInfluencer || '0IxJ385ACJjVJ2o9',
      'family-micro-drama':     n8nCfg.productionWorkflows?.familyMicroDrama     || 'NymNAsVCHNff4DWs',
      'viral-shorts':           n8nCfg.productionWorkflows?.viralShorts          || 'UKWYwnlKuCqTazIG'
    };
    const workflowId = WORKFLOW_ID_MAP[templateId] || null;

    // -------------------------------------------------------------
    // Section 3.5: Server-side validation (only for "family-micro-drama")
    // -------------------------------------------------------------
    let effectiveEpisodeMode = 'next';
    let effectiveCustomTopic = '';
    let characterImages = null;

    if (templateId === 'family-micro-drama') {
      // 1. Reject a showId other than GKK-001
      const showId = payload.showId || 'GKK-001';
      if (showId !== 'GKK-001') {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            error: 'INVALID_SHOW_ID',
            message: 'Invalid showId. Only "GKK-001" is currently supported.'
          })
        };
      }

      if (!db) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Database connection unavailable.' })
        };
      }

      // 2. Recompute characterImages from show_cast for token's user (never trust client)
      const castDocs = await db.collection('show_cast').find({ userId, showId: 'GKK-001' }).toArray();
      const castMap = {};
      for (const doc of castDocs) {
        castMap[doc.characterId] = doc.imageUrl;
      }

      const isValidHttpUrl = (str) => {
        if (!str || typeof str !== 'string') return false;
        try {
          const u = new URL(str);
          return (u.protocol === 'http:' || u.protocol === 'https:') && str.length <= 2048;
        } catch (_) {
          return false;
        }
      };

      // Reject if any required photo is missing or not a valid http(s) URL
      const REQUIRED_CAST = ['DADI', 'PAPA', 'MUMMY', 'DIDI', 'CHHOTA'];
      const missingRequired = [];
      for (const charId of REQUIRED_CAST) {
        const url = castMap[charId];
        if (!url || !isValidHttpUrl(url)) {
          missingRequired.push(charId);
        }
      }

      if (missingRequired.length > 0) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            error: 'REQUIRED_CAST_MISSING',
            message: `Missing or invalid required character reference photos for: ${missingRequired.join(', ')}. All 5 required characters (DADI, PAPA, MUMMY, DIDI, CHHOTA) must be saved before generating.`
          })
        };
      }

      // Reject any non-http(s) URL in optional cast if provided
      const OPTIONAL_CAST = ['NEIGHBOUR', 'GUEST'];
      for (const charId of OPTIONAL_CAST) {
        const url = castMap[charId];
        if (url && !isValidHttpUrl(url)) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'INVALID_IMAGE_URL',
              message: `Photo for character "${charId}" must be a valid http or https URL (max 2048 characters).`
            })
          };
        }
      }

      // Recompute characterImages: optional empty values are "" (never null)
      characterImages = {
        DADI: castMap.DADI,
        PAPA: castMap.PAPA,
        MUMMY: castMap.MUMMY,
        DIDI: castMap.DIDI,
        CHHOTA: castMap.CHHOTA,
        NEIGHBOUR: castMap.NEIGHBOUR && isValidHttpUrl(castMap.NEIGHBOUR) ? castMap.NEIGHBOUR : '',
        GUEST: castMap.GUEST && isValidHttpUrl(castMap.GUEST) ? castMap.GUEST : ''
      };

      // 3. Reject a custom idea over 300 characters, or one containing a blocked word
      effectiveEpisodeMode = payload.episodeMode === 'custom' ? 'custom' : 'next';
      if (effectiveEpisodeMode === 'custom') {
        const customIdea = typeof payload.customEpisodeTopic === 'string'
          ? payload.customEpisodeTopic.trim()
          : (typeof payload.prompt === 'string' ? payload.prompt.trim() : '');

        if (customIdea.length > 300) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'CUSTOM_IDEA_TOO_LONG',
              message: `Custom episode idea must not exceed 300 characters (received ${customIdea.length}).`
            })
          };
        }

        const BLOCKED_WORDS = [
          'rape', 'murder', 'kill', 'torture', 'terrorist', 'terrorism', 'suicide',
          'porn', 'sex', 'nude', 'nudity', 'nsfw', 'erotic', 'pedophile', 'child abuse',
          'domestic violence', 'assault', 'slur', 'bastard', 'bitch'
        ];

        const lowerIdea = customIdea.toLowerCase();
        const matchedWord = BLOCKED_WORDS.find(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          return regex.test(lowerIdea);
        });

        if (matchedWord) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'BLOCKED_CONTENT',
              message: `Custom episode idea contains prohibited content ("${matchedWord}"). Please revise to follow content guidelines.`
            })
          };
        }

        effectiveCustomTopic = customIdea;
      } else {
        effectiveCustomTopic = '';
      }
    }

    // 3. Atomically record the generation in MongoDB
    if (db && userId) {
      try {
        const generationPrompt = templateId === 'family-micro-drama'
          ? (effectiveEpisodeMode === 'custom' ? effectiveCustomTopic : 'Next Episode in Season')
          : (payload.prompt || '').trim();

        await db.collection('threads').updateOne(
          { threadId },
          {
            $set: {
              threadId,
              userId,
              userEmail: userEmail.toLowerCase(),
              title: meta.title,
              templateId,
              workflowId,
              status: 'started',
              isRetry: !!payload.isRetry,
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date(),
              messages: [
                {
                  role: 'system',
                  content: `${payload.isRetry ? '🔄 Retrying' : '1-Click Autonomous Generation started for'} template: ${meta.title}.${generationPrompt ? ` Topic: "${generationPrompt}".` : ' Auto-selecting topic.'} Auto-uploading to YouTube channel: ${userYouTubeChannelTitle || 'Default'}.`,
                  timestamp: new Date().toISOString()
                }
              ]
            }
          },
          { upsert: true }
        );

        // Record generation in template_generations collection for strict quota auditing
        await db.collection('template_generations').insertOne({
          userId,
          userEmail,
          templateId,
          templateTitle: meta.title,
          threadId,
          workflowId,
          isRetry: !!payload.isRetry,
          prompt: generationPrompt,
          channelTitle: userYouTubeChannelTitle || null,
          channelId: userYouTubeChannelId || null,
          createdAt: new Date(),
          status: 'dispatched',
          resetByAdmin: false
        });
      } catch (dbSaveErr) {
        console.warn('[generate-template] Could not save initial thread / generation record:', dbSaveErr.message);
      }
    }

    // -------------------------------------------------------------
    // Section 3.4: Construct Payload for n8n Workflow Dispatch
    // -------------------------------------------------------------
    let postPayload;

    if (templateId === 'family-micro-drama') {
      postPayload = {
        userId: userId || 'anonymous',
        userEmail: userEmail.toLowerCase(),
        threadId,
        sessionId,
        callbackUrl,
        webhookSecret,
        autoUploadToYouTube,
        userYouTubeAccessToken,
        userYouTubeChannelId,
        userYouTubeChannelTitle,
        autoLogToSheet,
        userSpreadsheetId,
        subtitleSettings: payload.subtitleSettings || null,
        subtitleStyle: payload.subtitleStyle || payload.subtitlePreset || 'hormozi',
        musicId: payload.musicId || meta.musicId,
        musicTrackUrl: payload.musicTrackUrl || payload.musicUrl || '',
        musicVolume: payload.musicVolume !== undefined ? Number(payload.musicVolume) : 0.08,
        aspectRatio: '9:16',
        language: 'Hindi',
        timestamp: new Date().toISOString(),
        templateId: 'family-micro-drama',
        showId: 'GKK-001',
        episodeMode: effectiveEpisodeMode,
        customEpisodeTopic: effectiveCustomTopic,
        characterImages
      };
    } else {
      postPayload = {
        templateId,
        templateName: meta.name,
        prompt: (payload.prompt || '').trim(),
        callbackUrl,
        threadId,
        sessionId,
        userId: userId || 'anonymous',
        userEmail: userEmail.toLowerCase(),
        webhookSecret,
        // Dynamic YouTube Settings
        autoUploadToYouTube,
        userYouTubeAccessToken,
        userYouTubeChannelTitle,
        userYouTubeChannelId,
        // Dynamic Google Sheet Settings
        autoLogToSheet,
        userSheetAccessToken,
        userSpreadsheetId,
        userSheetName,
        visualStyle: payload.visualStyle || meta.visualStyle,
        language: payload.language || meta.language,
        aspectRatio: payload.aspectRatio || '9:16',
        // Subtitle settings & styling
        subtitleSettings: payload.subtitleSettings || null,
        subtitleStyle: payload.subtitleStyle || payload.subtitlePreset || 'hormozi',
        // Music & volume settings
        musicId: payload.musicId || meta.musicId,
        musicTrackUrl: payload.musicTrackUrl || payload.musicUrl || '',
        musicVolume: payload.musicVolume !== undefined ? Number(payload.musicVolume) : 0.08,
        timestamp: new Date().toISOString()
      };

      // Only attach voiceover fields for non-native voice workflows
      if (templateId !== 'time-travel-influencer') {
        postPayload.voiceId = payload.voiceId || 'adam';
        postPayload.elevenLabsVoiceId = payload.elevenLabsVoiceId || '';
        postPayload.voiceSpeed = payload.voiceSpeed !== undefined ? Number(payload.voiceSpeed) : 1.20;
        postPayload.voiceVolume = payload.voiceVolume !== undefined ? Number(payload.voiceVolume) : 1.0;
      } else {
      // Keep influencerGender exactly as it is today
      if (payload.influencerGender) {
        postPayload.influencerGender = payload.influencerGender;
      }

      // 1. Story Mode: "library" | "custom" (custom only if prompt is non-empty)
      const promptText = (payload.prompt || '').trim();
      const effectiveStoryMode = (payload.storyMode === 'custom' && promptText) ? 'custom' : 'library';

      // 2. Series Mode: "new" | "continue" and seriesId
      const effectiveSeriesMode = payload.seriesMode === 'continue' ? 'continue' : 'new';
      let effectiveSeriesId = null;

      if (effectiveSeriesMode === 'continue') {
        effectiveSeriesId = payload.seriesId ? String(payload.seriesId).trim() : null;
        if (!effectiveSeriesId) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'SERIES_ID_REQUIRED',
              message: 'A valid seriesId is required when continuing a series.'
            })
          };
        }

        // Server-side validation: Reject any seriesId that does not belong to the signed-in user
        const isOwner = await verifySeriesOwnership(effectiveSeriesId, user);
        if (!isOwner) {
          return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              error: 'SERIES_NOT_OWNED',
              message: 'The selected series does not belong to your account.'
            })
          };
        }
      }

      // 3. Character Mode: recompute characterImageUrl on the server from the chosen mode
      const chosenCharacterMode = ['channel', 'upload', 'random'].includes(payload.characterMode)
        ? payload.characterMode
        : (targetChannel?.characterImageUrl ? 'channel' : (payload.characterImageUrl ? 'upload' : 'random'));

      let resolvedCharacterImageUrl = '';
      let isUploadUrlValid = false;

      if (chosenCharacterMode === 'channel') {
        resolvedCharacterImageUrl = targetChannel?.characterImageUrl || '';
      } else if (chosenCharacterMode === 'upload') {
        const rawUrl = (payload.characterImageUrl && typeof payload.characterImageUrl === 'string')
          ? payload.characterImageUrl.trim()
          : '';
        try {
          if (rawUrl) {
            const parsed = new URL(rawUrl);
            if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && rawUrl.length <= 2048) {
              isUploadUrlValid = true;
              resolvedCharacterImageUrl = rawUrl;
            }
          }
        } catch (e) {
          isUploadUrlValid = false;
        }
      } else {
        // Random mode: empty string, never null and never a placeholder
        resolvedCharacterImageUrl = '';
      }

      // saveChannelFace: boolean (true only when the checkbox is ticked and the URL is valid)
      const isSaveFace = Boolean(
        payload.saveChannelFace === true &&
        chosenCharacterMode === 'upload' &&
        isUploadUrlValid &&
        resolvedCharacterImageUrl
      );

      // Auto-save channel face to database if requested
      if (isSaveFace && db && userYouTubeChannelId) {
        try {
          await db.collection('users').updateOne(
            {
              $or: [{ id: userId }, { _id: userId }, { userId: userId }, { email: userEmail }],
              'youtubeChannels.channelId': userYouTubeChannelId
            },
            {
              $set: {
                'youtubeChannels.$.characterImageUrl': resolvedCharacterImageUrl,
                'youtubeChannels.$.updatedAt': new Date()
              }
            }
          );
          console.log(`[generate-template] Persisted new channel face for channel ${userYouTubeChannelId}: ${resolvedCharacterImageUrl}`);
        } catch (saveErr) {
          console.warn('[generate-template] Could not auto-save channel face:', saveErr.message);
        }
      }

      const channelName = targetChannel?.characterName || (typeof payload.channelCharacterName === 'string' ? payload.channelCharacterName : '');
      const channelGender = targetChannel?.characterGender || (['female', 'male', 'auto'].includes(payload.channelCharacterGender) ? payload.channelCharacterGender : '');

      // ADD these fields after existing fields are built
      postPayload.storyMode = effectiveStoryMode;
      postPayload.seriesMode = effectiveSeriesMode;
      postPayload.seriesId = effectiveSeriesId;
      postPayload.characterMode = chosenCharacterMode;
      postPayload.characterImageUrl = resolvedCharacterImageUrl;
      postPayload.saveChannelFace = isSaveFace;
      postPayload.channelCharacterName = channelName;
      postPayload.channelCharacterGender = channelGender;
    }
  }

  const postData = JSON.stringify(postPayload);

    console.log(`[generate-template] Dispatching 1-click template ${templateId} to n8n webhook...`);
    console.log(`[generate-template] Target YouTube: "${userYouTubeChannelTitle || 'None'}", Auto-Upload: ${autoUploadToYouTube}`);

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret
      },
      body: postData
    });

    const respText = await res.text();
    console.log(`[generate-template] n8n response: status ${res.status}, body: ${respText.slice(0, 150)}`);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        templateId,
        threadId,
        status: 'started',
        autoUploadToYouTube,
        channelTitle: userYouTubeChannelTitle || null,
        remaining: Math.max(0, quota.remaining - 1),
        dailyLimit: quota.dailyLimit,
        usedToday: quota.usedToday + 1,
        message: `${meta.title} generation dispatched successfully.`
      })
    };
  } catch (err) {
    console.error('[generate-template] Fatal error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' })
    };
  }
};
