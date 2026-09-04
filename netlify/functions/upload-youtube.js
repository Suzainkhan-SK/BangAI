// Netlify Function: upload-youtube.js
// Path: /.netlify/functions/upload-youtube
// Bang AI — Triggers n8n Cloud YouTube Upload Webhook with Dynamic Multi-Channel Tokens

import { getDb } from './db.js';
import { getFreshGoogleToken } from './google-oauth.js';
import crypto from 'crypto';

const N8N_YOUTUBE_WEBHOOK_URL = process.env.N8N_YOUTUBE_WEBHOOK_URL || 'https://cmpunktg24.app.n8n.cloud/webhook/viral-shorts-ai-youtube-upload';
const JWT_SECRET = process.env.JWT_SECRET || 'bang-ai-jwt-production-secret-9a8b7c6d5e4f3a2b1c0';

function verifyToken(token) {
  if (!token) return null;
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signatureB64 !== expectedSig) return null;
    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch (err) {
    return null;
  }
}

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const authHeader = event.headers.authorization || '';
    const userToken = authHeader.replace('Bearer ', '');
    const user = verifyToken(userToken);

    const payload = JSON.parse(event.body || '{}');
    const { threadId, title, description, tags, videoUrl, sessionId, channelId, privacy } = payload;

    if (!videoUrl) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'videoUrl is required for YouTube upload' })
      };
    }

    const now = new Date();
    const host = event.headers?.host || 'bangai.netlify.app';
    const callbackUrl = `https://${host}/.netlify/functions/story-approval`;

    let db = null;
    try {
      db = await getDb();
    } catch (e) {}

    // Retrieve user's dynamic Google OAuth token for selected channel and sheet
    let googleAccessToken = null;
    let selectedChannel = null;
    let userSheetAccessToken = null;
    let userSpreadsheetId = '';
    let userSheetName = 'Production Log';

    const userId = user?.userId || user?.id || payload.userId;
    const userEmail = user?.email || payload.email;

    if (db && (userId || userEmail)) {
      const userDoc = await db.collection('users').findOne({
        $or: [
          { userId: userId },
          { id: userId },
          { _id: userId },
          { email: userEmail ? userEmail.toLowerCase() : '' }
        ]
      });

      const channels = userDoc?.youtubeChannels || [];
      if (channelId) {
        selectedChannel = channels.find(c => c.channelId === channelId);
      } else {
        selectedChannel = channels.find(c => c.isDefault) || channels[0];
      }

      if (selectedChannel && selectedChannel.tokens) {
        googleAccessToken = await getFreshGoogleToken(selectedChannel, 'youtubeChannels') || selectedChannel.tokens.accessToken || null;
      }

      // Sheets
      const selectedSheetId = payload.selectedSheetId || payload.sheetId;
      const sheets = userDoc?.sheets || [];
      let targetSheet = selectedSheetId ? sheets.find(s => s.sheetId === selectedSheetId || s.spreadsheetId === selectedSheetId) : (sheets.find(s => s.isDefault) || sheets[0] || null);

      if (!targetSheet && userDoc?.googleSheets?.connected) {
        targetSheet = {
          spreadsheetId: userDoc.googleSheets.spreadsheetId || '',
          sheetName: 'Production Log',
          tokens: userDoc.googleSheets.tokens || selectedChannel?.tokens || null
        };
      }

      if (targetSheet) {
        const sheetContainer = targetSheet.tokens ? targetSheet : selectedChannel;
        if (sheetContainer && sheetContainer.tokens) {
          userSheetAccessToken = await getFreshGoogleToken(sheetContainer, 'youtubeChannels') || sheetContainer.tokens.accessToken || null;
        }
        userSpreadsheetId = targetSheet.spreadsheetId || targetSheet.sheetId || '';
        userSheetName = targetSheet.sheetName || 'Production Log';
      }
    }

    if (!googleAccessToken) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'NO_CHANNEL_CONNECTED', 
          message: 'No connected YouTube channel found. Please connect your YouTube channel in Profile to upload.' 
        })
      };
    }

    console.log('[Bang AI] Dispatching YouTube Upload to n8n Cloud for thread:', threadId, 'Channel:', selectedChannel?.channelTitle || 'Default');

    // Dispatch request to n8n Cloud YouTube Upload Webhook
    const webhookSecret = process.env.SHORTSAI_WEBHOOK_SECRET || 's-vshorts-sec-9a8b7c6d5e4f3a2b1c0';
    let n8nRes;
    try {
      n8nRes = await fetch(N8N_YOUTUBE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-webhook-secret': webhookSecret
        },
        body: JSON.stringify({
          videoUrl,
          title: title || payload.suggestedTitle || 'Viral YouTube Short',
          description: description || payload.youtubeDescription || '',
          tags: tags || payload.tags || [],
          storyBrief: payload.storyBrief || payload.brief || '',
          genre: payload.genre || 'Viral Story',
          contentType: payload.contentType || 'Shorts Video',
          language: payload.language || 'English',
          visualStyle: payload.visualStyle || 'Cinematic',
          mainCharacter: payload.mainCharacter || '',
          angleDifferentiator: payload.angleDifferentiator || '',
          threadId: threadId || '',
          sessionId: sessionId || '',
          webhookSecret: webhookSecret,
          callbackUrl,
          googleAccessToken: googleAccessToken || '',
          userYouTubeAccessToken: googleAccessToken || '',
          channelId: selectedChannel?.channelId || '',
          channelTitle: selectedChannel?.channelTitle || '',
          userYouTubeChannelTitle: selectedChannel?.channelTitle || '',
          userYouTubeChannelId: selectedChannel?.channelId || '',
          userSheetAccessToken: userSheetAccessToken || '',
          userSpreadsheetId: userSpreadsheetId || '',
          userSheetName: userSheetName || 'Production Log',
          autoLogToSheet: payload.autoLogToSheet !== false,
          privacyStatus: privacy || selectedChannel?.defaultPrivacy || 'public',
          timestamp: now.toISOString()
        })
      });
    } catch (err) {
      console.error('[Bang AI] Error calling n8n YouTube webhook:', err.message);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'N8N_UNREACHABLE',
          message: `Failed to connect to n8n Cloud YouTube upload pipeline: ${err.message}`
        })
      };
    }

    const n8nStatus = n8nRes.status;
    const n8nText = await n8nRes.text();
    console.log('[Bang AI] n8n YouTube upload response status:', n8nStatus, 'body:', n8nText);

    if (!n8nRes.ok) {
      const errMsg = `n8n rejected the upload request (HTTP ${n8nStatus}).`;
      if (db && threadId) {
        await db.collection('threads').updateOne(
          { threadId },
          {
            $set: {
              uploadStatus: 'FAILED',
              uploadError: errMsg,
              updatedAt: now
            },
            $push: {
              messages: {
                threadId,
                role: 'assistant',
                content: `❌ **YouTube upload could not be started.**\n\n${errMsg}`,
                timestamp: now
              }
            }
          }
        );
      }
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'N8N_DISPATCH_FAILED',
          message: errMsg,
          detail: n8nText.slice(0, 400)
        })
      };
    }

    if (db && threadId) {
      const resolvedUserId = user?.userId || user?.id || payload.userId;
      const resolvedEmail = (user?.email || payload.email || '').toLowerCase();
      const threadIdentity = {};
      if (resolvedUserId) threadIdentity.userId = resolvedUserId;
      if (resolvedEmail) { threadIdentity.email = resolvedEmail; threadIdentity.userEmail = resolvedEmail; }

      await db.collection('threads').updateOne(
        { threadId },
        {
          $set: {
            ...threadIdentity,
            uploadStatus: 'UPLOADING',
            uploadError: null,
            targetChannelTitle: selectedChannel?.channelTitle || 'Connected YouTube Channel',
            updatedAt: now
          },
          $push: {
            messages: {
              threadId,
              role: 'assistant',
              content: `🚀 **1-Click YouTube Upload initiated.** Uploading Short to ${selectedChannel ? `**${selectedChannel.channelTitle}**` : 'YouTube'}...`,
              timestamp: now
            }
          }
        }
      );
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        dispatched: true,
        uploadStatus: 'UPLOADING',
        message: 'Upload job accepted by n8n. Waiting for YouTube to return a video ID.',
        channel: selectedChannel?.channelTitle || null,
        n8nStatus
      })
    };
  } catch (err) {
    console.error('[Bang AI] upload-youtube error:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};
