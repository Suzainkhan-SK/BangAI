// Netlify Function: generate-story
// Path: /.netlify/functions/generate-story
// Bang AI — Dispatches prompt with dynamic user YouTube & Google Sheets OAuth credentials to n8n

import fs from 'fs';
import path from 'path';
import { getDb } from './db.js';
import { verifyToken, getFreshGoogleToken } from './google-oauth.js';
import { getN8nConfig } from './n8n-config.js';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://cmpunktg25.app.n8n.cloud/webhook/viral-shorts-ai';
const CACHE_FILE = path.join('/tmp', 'latest_story.json');

export const handler = async (event, context) => {
  // Handle CORS Preflight
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
    const prompt = payload.prompt || payload.rawUserInput || '';

    if (!prompt.trim()) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }

    // Clear previous story cache before triggering new n8n workflow
    try {
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
      }
    } catch (e) {}

    // Determine host to build the callback URL
    const host = event.headers.host || 'bangai.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    // Dynamic Credentials Lookup from MongoDB
    let userYouTubeAccessToken = '';
    let userYouTubeChannelTitle = '';
    let userYouTubeChannelId = '';
    let userSheetAccessToken = '';
    let userSpreadsheetId = '';
    let userSheetName = 'Production Log';

    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const userToken = authHeader.replace(/^Bearer\s+/i, '').trim() || payload.token;
    const user = verifyToken(userToken);

    if (!user) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized. Please sign in to create videos.' })
      };
    }

    let db = null;
    if (user) {
      try {
        db = await getDb();
        if (db) {
          const uid = user.userId || user.id;
          const userDoc = await db.collection('users').findOne({
            $or: [
              { id: uid },
              { _id: uid },
              { userId: uid },
              { email: user.email ? user.email.toLowerCase() : '' }
            ]
          });

          if (userDoc) {
            // 1. Resolve Target YouTube Channel
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

            // 2. Resolve Target Google Sheet
            const selectedSheetId = payload.selectedSheetId || payload.sheetId;
            const sheets = userDoc.sheets || [];
            let targetSheet = null;

            if (selectedSheetId) {
              targetSheet = sheets.find(s => s.sheetId === selectedSheetId || s.spreadsheetId === selectedSheetId);
            }
            if (!targetSheet) {
              targetSheet = sheets.find(s => s.isDefault) || sheets[0] || null;
            }

            // Fallback to legacy single sheet record if multi-sheet list is empty
            if (!targetSheet && userDoc.googleSheets?.connected) {
              targetSheet = {
                spreadsheetId: userDoc.googleSheets.spreadsheetId || '',
                sheetName: 'Production Log',
                tokens: userDoc.googleSheets.tokens || targetChannel?.tokens || null
              };
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
        console.warn('[generate-story] Error resolving dynamic tokens:', dbErr.message);
      }
    }

    const autoUploadToYouTube = payload.autoUploadToYouTube !== false && !!userYouTubeAccessToken;
    const autoLogToSheet = payload.autoLogToSheet !== false;

    // Strict multi-tenant thread identity
    const threadId = payload.threadId || `th_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionId = payload.sessionId || `sess_${Date.now()}`;
    const uid = user.userId || user.id;
    const userEmail = (user.email || '').toLowerCase();

    // Pre-seed thread in MongoDB so it belongs to the authenticated user from moment 0
    if (db) {
      try {
        await db.collection('threads').updateOne(
          { threadId },
          {
            $set: {
              threadId,
              sessionId,
              userId: uid,
              userEmail: userEmail,
              title: prompt.trim().substring(0, 60),
              status: 'generating',
              prompt: prompt.trim(),
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date(),
              messages: [
                {
                  role: 'user',
                  content: prompt.trim(),
                  timestamp: new Date().toISOString()
                }
              ]
            }
          },
          { upsert: true }
        );
      } catch (seedErr) {
        console.warn('[generate-story] Pre-seed thread error:', seedErr.message);
      }
    }

    console.log(`[Netlify] Sending prompt to n8n cloud webhook: "${prompt.substring(0, 50)}..."`);
    console.log(`[Netlify] Dynamic YouTube Channel: "${userYouTubeChannelTitle || 'Master Default'}", Auto-Upload: ${autoUploadToYouTube}`);
    console.log(`[Netlify] Dynamic Google Sheet: "${userSpreadsheetId || 'Master Default'}", Auto-Log: ${autoLogToSheet}`);

    const webhookSecret = process.env.SHORTSAI_WEBHOOK_SECRET || 's-vshorts-sec-9a8b7c6d5e4f3a2b1c0';
    const postData = JSON.stringify({
      prompt: prompt.trim(),
      voiceId: payload.voiceId || 'adam',
      elevenLabsVoiceId: payload.elevenLabsVoiceId || payload.voiceId || '',
      voiceSpeed: payload.voiceSpeed !== undefined ? Number(payload.voiceSpeed) : 1.10,
      voiceVolume: payload.voiceVolume !== undefined ? Number(payload.voiceVolume) : 1.0,
      visualStyle: payload.visualStyle || 'Cinematic Realistic',
      language: payload.language || 'Hinglish',
      aspectRatio: payload.aspectRatio || '9:16',
      // Subtitle settings & styling
      subtitleSettings: payload.subtitleSettings || null,
      subtitleStyle: payload.subtitleStyle || payload.subtitlePreset || 'hormozi',
      // Music & volume settings
      musicId: payload.musicId || 'mystery2',
      musicTrackUrl: payload.musicTrackUrl || payload.musicUrl || '',
      musicVolume: payload.musicVolume !== undefined ? Number(payload.musicVolume) : 0.08,
      callbackUrl: callbackUrl,
      threadId: threadId,
      sessionId: sessionId,
      userId: uid,
      userEmail: userEmail,
      webhookSecret: webhookSecret,
      // Dynamic User YouTube Channel OAuth
      autoUploadToYouTube: autoUploadToYouTube,
      userYouTubeAccessToken: userYouTubeAccessToken,
      userYouTubeChannelTitle: userYouTubeChannelTitle,
      userYouTubeChannelId: userYouTubeChannelId,
      // Dynamic User Google Sheets OAuth
      autoLogToSheet: autoLogToSheet,
      userSheetAccessToken: userSheetAccessToken,
      userSpreadsheetId: userSpreadsheetId,
      userSheetName: userSheetName,
      timestamp: new Date().toISOString()
    });

    const n8nCfg = await getN8nConfig();
    const targetWebhookUrl = n8nCfg.webhooks?.viral_shorts || N8N_WEBHOOK_URL;

    const res = await fetch(targetWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret
      },
      body: postData
    });

    const respText = await res.text();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        status: 'PROCESSING',
        message: 'Prompt dispatched to n8n autonomous video pipeline.',
        threadId: threadId,
        sessionId: sessionId,
        n8nStatus: res.status,
        callbackUrl: callbackUrl,
        selectedChannel: userYouTubeChannelTitle || null,
        selectedSheet: userSpreadsheetId || null,
        response: respText.substring(0, 200)
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
