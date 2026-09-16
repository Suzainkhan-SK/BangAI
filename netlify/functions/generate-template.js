// Netlify Function: generate-template
// Path: /.netlify/functions/generate-template
// Bang AI — Dispatches 1-Click Autonomous Template Video Workflow to n8n Cloud

import { getDb } from './db.js';
import { verifyToken, getFreshGoogleToken } from './google-oauth.js';

// Webhook endpoint for the new World Mysteries & Paranormal template workflow
const TEMPLATE_WEBHOOKS = {
  'world-mysteries': 'https://cmpunktg24.app.n8n.cloud/webhook/template-world-mysteries'
};

export const handler = async (event) => {
  // CORS Preflight
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
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const templateId = payload.templateId || 'world-mysteries';
    const webhookUrl = TEMPLATE_WEBHOOKS[templateId];

    if (!webhookUrl) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Template "${templateId}" is not configured.` })
      };
    }

    // Determine host for the callback URL
    const host = event.headers.host || 'bangai.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    // Dynamic Credentials Lookup from MongoDB
    let userYouTubeAccessToken = '';
    let userYouTubeChannelTitle = '';
    let userYouTubeChannelId = '';
    let userSheetAccessToken = '';
    let userSpreadsheetId = '';
    let userSheetName = 'Production Log';
    let userEmail = '';
    let userId = '';

    const authHeader = event.headers.authorization || '';
    const userToken = authHeader.replace('Bearer ', '') || payload.token;
    const user = verifyToken(userToken);

    if (user) {
      userId = user.userId || user.id;
      userEmail = user.email || '';
      try {
        const db = await getDb();
        if (db) {
          const userDoc = await db.collection('users').findOne({
            $or: [
              { id: userId },
              { _id: userId },
              { userId: userId },
              { email: userEmail ? userEmail.toLowerCase() : '' }
            ]
          });

          if (userDoc) {
            // Resolve Target YouTube Channel
            const selectedChannelId = payload.selectedChannelId || payload.channelId;
            const channels = userDoc.youtubeChannels || [];
            let targetChannel = null;

            if (selectedChannelId) {
              targetChannel = channels.find(c => c.channelId === selectedChannelId);
            }
            if (!targetChannel) {
              targetChannel = channels.find(c => c.isDefault) || channels[0] || null;
            }

            if (targetChannel && targetChannel.tokens) {
              userYouTubeAccessToken = await getFreshGoogleToken(targetChannel, 'youtubeChannels') || targetChannel.tokens.accessToken || '';
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
                userSheetAccessToken = await getFreshGoogleToken(sheetTokenContainer, 'youtubeChannels') || sheetTokenContainer.tokens?.accessToken || '';
              }
              userSpreadsheetId = targetSheet.spreadsheetId || '';
              userSheetName = targetSheet.sheetName || 'Production Log';
            }
          }
        }
      } catch (dbErr) {
        console.warn('[generate-template] Error resolving dynamic tokens:', dbErr.message);
      }
    }

    const autoUploadToYouTube = payload.autoUploadToYouTube !== false && !!userYouTubeAccessToken;
    const autoLogToSheet = payload.autoLogToSheet !== false;

    // Generate a unique thread ID for tracking
    const threadId = payload.threadId || `thread-template-${templateId}-${Date.now()}`;
    const sessionId = payload.sessionId || `session-${Date.now()}`;
    const webhookSecret = process.env.SHORTSAI_WEBHOOK_SECRET || 's-vshorts-sec-9a8b7c6d5e4f3a2b1c0';

    // Store thread in DB if available
    try {
      const db = await getDb();
      if (db && userId) {
        await db.collection('threads').insertOne({
          threadId,
          userId,
          title: 'World Mysteries & Paranormal [1-Click]',
          templateId,
          status: 'started',
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [
            {
              role: 'system',
              content: `1-Click Autonomous Generation started for template: World Mysteries & Paranormal [75s]. Auto-uploading to YouTube channel: ${userYouTubeChannelTitle || 'Default'}.`,
              timestamp: new Date().toISOString()
            }
          ]
        });
      }
    } catch (dbSaveErr) {
      console.warn('[generate-template] Could not save initial thread:', dbSaveErr.message);
    }

    const postData = JSON.stringify({
      templateId,
      templateName: 'World Mysteries & Paranormal [5 Direct Video Scenes - 75s]',
      prompt: (payload.prompt || '').trim(), // optional custom topic if provided in future
      callbackUrl,
      threadId,
      sessionId,
      userId: userId || 'anonymous',
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
      // Voice & Visual Settings
      voiceId: payload.voiceId || 'adam',
      visualStyle: payload.visualStyle || 'Dark Cinematic Mystery',
      language: payload.language || 'English',
      timestamp: new Date().toISOString()
    });

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
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        templateId,
        threadId,
        status: 'started',
        autoUploadToYouTube,
        channelTitle: userYouTubeChannelTitle || null,
        message: 'World Mysteries & Paranormal template generation dispatched successfully.'
      })
    };
  } catch (err) {
    console.error('[generate-template] Fatal error:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: err.message || 'Internal Server Error' })
    };
  }
};
